"use strict";

const { Op } = require("sequelize");
const {
  Blog,
  BlogChecklist,
  BlogImage,
  BlogStep,
  BlogRelated,
  BuyingStep,
  sequelize,
} = require("../models");
const asyncHandler = require("../middleware/asyncHandler");
const ApiError = require("../utils/ApiError");
const { ok, created, noContent, paginated } = require("../utils/respond");
const { getPagination, getOrder } = require("../utils/pagination");
const { withUrls, deleteUpload, storedPathFor } = require("../utils/files");
const { uniqueSlug } = require("../services/slugService");

const WRITABLE = [
  "title",
  "excerpt",
  "content",
  "hero_title",
  "hero_subtitle",
  "sub_heading",
  "second_description",
  "quote_text",
  "quote_author",
  "category_id",
  "author_name",
  "published_at",
  "status",
  "is_featured",
  "sort_order",
  "meta_title",
  "meta_description",
];

function pickBody(body) {
  const out = {};
  for (const key of WRITABLE) {
    if (body[key] === undefined) continue;
    let v = body[key];
    if (key === "is_featured") v = v === true || v === "true" || v === "1";
    else if (key === "category_id" || key === "sort_order") {
      v = v === "" || v === null || v === "null" ? null : Number(v);
    } else if (v === "") v = null;
    out[key] = v;
  }
  return out;
}

const includes = [
  { association: "category", attributes: ["id", "name", "slug"] },
  { association: "checklist", separate: true, order: [["sort_order", "ASC"]] },
  { association: "images", separate: true, order: [["sort_order", "ASC"]] },
  { association: "steps", separate: true, order: [["sort_order", "ASC"]] },
];

function serializeBlog(row) {
  const out = withUrls(row.toJSON());
  // The gallery rows carry their own image column, so they need the same
  // relative-path → public-URL pass the post itself gets.
  if (out.images) out.images = out.images.map((i) => withUrls(i));
  // Whether the steps below belong to this post or are the shared fallback.
  // The admin form reads it so it never adopts the shared list as the post's
  // own and writes a copy of it back on the next save.
  if (out.steps) out.steps_source = out.steps.length ? "post" : "shared";
  return out;
}

/** Parse a checklist payload sent as JSON or newline separated text. */
function parseChecklist(raw) {
  if (raw === undefined || raw === null) return null;
  let items = raw;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = items.split("\n");
    }
  }
  if (!Array.isArray(items)) return [];
  return items
    .map((v, i) => ({
      item_text: String(typeof v === "string" ? v : v.item_text || "").trim().slice(0, 400),
      sort_order: i,
    }))
    .filter((v) => v.item_text);
}

/**
 * Parse the numbered steps payload — sent as JSON from the admin form.
 * Rows without a title are dropped, so a half-filled row cannot reach the site.
 */
function parseSteps(raw) {
  if (raw === undefined || raw === null) return null;
  let items = raw;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(items)) return [];
  return items
    .map((v, i) => ({
      step_number: String(v.step_number ?? "").trim().slice(0, 6) || String(i + 1).padStart(2, "0"),
      title: String(v.title || "").trim().slice(0, 160),
      description: String(v.description || "").trim() || null,
      sort_order: i,
    }))
    .filter((v) => v.title);
}

/** The ids a post has picked for its "Other Blog" row, in their arranged order. */
async function relatedIdsFor(blogId) {
  const rows = await BlogRelated.findAll({
    where: { blog_id: blogId },
    order: [["sort_order", "ASC"]],
    attributes: ["related_blog_id"],
  });
  return rows.map((r) => r.related_blog_id);
}

/**
 * Parse the "Other Blog" picks — a JSON array of post ids, in the order they
 * should appear. Self-references and duplicates are dropped here so neither can
 * reach the database.
 */
function parseRelated(raw, selfId) {
  if (raw === undefined || raw === null) return null;
  let items = raw;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(items)) return [];

  const seen = new Set();
  const out = [];
  for (const v of items) {
    const id = Number(typeof v === "object" && v ? v.id : v);
    if (!Number.isInteger(id) || id <= 0) continue;
    if (selfId && id === Number(selfId)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ related_blog_id: id, sort_order: out.length });
  }
  return out;
}

/* ── Reads ───────────────────────────────────────────────────────────────── */

/** GET /api/blogs */
const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query, 12);
  const order = getOrder(
    req.query,
    ["published_at", "title", "views", "created_at", "sort_order"],
    [
      ["sort_order", "ASC"],
      ["published_at", "DESC"],
      ["id", "DESC"],
    ],
  );

  const where = {};
  if (!req.admin) where.status = "published";
  else if (req.query.status) where.status = req.query.status;

  if (req.query.category_id) where.category_id = req.query.category_id;
  if (req.query.featured === "true") where.is_featured = true;

  if (req.query.search) {
    const q = `%${req.query.search}%`;
    where[Op.or] = [
      { title: { [Op.like]: q } },
      { excerpt: { [Op.like]: q } },
      { content: { [Op.like]: q } },
    ];
  }

  const result = await Blog.findAndCountAll({
    where,
    order,
    limit,
    offset,
    distinct: true,
    include: [{ association: "category", attributes: ["id", "name", "slug"] }],
    // The body is large and never rendered in a list.
    attributes: { exclude: ["content"] },
  });

  result.rows = result.rows.map(serializeBlog);
  return paginated(res, result, { page, limit });
});

/** GET /api/blogs/:idOrSlug */
const getOne = asyncHandler(async (req, res) => {
  const key = req.params.idOrSlug;
  const where = /^\d+$/.test(key) ? { id: Number(key) } : { slug: key };
  if (!req.admin) where.status = "published";

  const row = await Blog.findOne({ where, include: includes });
  if (!row) throw ApiError.notFound("Blog post not found");

  // Count public reads only, and never let a counter failure break the page.
  if (!req.admin) {
    Blog.increment("views", { where: { id: row.id } }).catch(() => {});
  }

  const data = serializeBlog(row);

  // A post that names no steps of its own falls back to the shared journey in
  // Admin → CMS → Buying Steps (scope "blog"), which is what every article
  // showed before steps became per-post. Shaped like the post's own rows so
  // the page renders one list either way.
  if (data.steps_source === "shared") {
    data.steps = await BuyingStep.findAll({
      where: { scope: "blog", project_id: null, is_active: true },
      order: [["sort_order", "ASC"], ["id", "ASC"]],
      attributes: ["id", "step_number", "title", "description", "sort_order"],
    }).then((rows) => rows.map((r) => r.toJSON()));
  }

  // The "Other Blog" row. Posts picked in Admin → Blogs win, in the order they
  // were arranged there; a post that picks none keeps the automatic list of the
  // newest siblings, which is what every article showed before the picker.
  const pickedIds = await relatedIdsFor(row.id);
  let related = [];

  if (pickedIds.length) {
    const where = { id: { [Op.in]: pickedIds } };
    if (!req.admin) where.status = "published";

    const found = await Blog.findAll({
      where,
      attributes: { exclude: ["content"] },
      include: [{ association: "category", attributes: ["id", "name", "slug"] }],
    });

    // Re-impose the admin's order — `IN` gives no ordering of its own — and
    // drop anything that has since been unpublished or deleted.
    const byId = new Map(found.map((b) => [b.id, b]));
    related = pickedIds.map((id) => byId.get(id)).filter(Boolean);
  }

  data.related_source = related.length ? "post" : "auto";

  if (!related.length) {
    related = await Blog.findAll({
      where: { status: "published", id: { [Op.ne]: row.id } },
      order: [["published_at", "DESC"]],
      limit: 3,
      attributes: { exclude: ["content"] },
      include: [{ association: "category", attributes: ["id", "name", "slug"] }],
    });
  }

  data.related = related.map(serializeBlog);

  // The ids as picked, so the admin form can show the picker without having to
  // tell an arranged list apart from the automatic one.
  data.related_ids = pickedIds;

  return ok(res, data);
});

/* ── Writes ──────────────────────────────────────────────────────────────── */

/** POST /api/blogs */
const create = asyncHandler(async (req, res) => {
  const payload = pickBody(req.body);
  if (!payload.title) {
    throw ApiError.badRequest("Title is required", { title: "Title is required" });
  }

  payload.slug = await uniqueSlug(Blog, req.body.slug || payload.title);
  if (!payload.published_at && payload.status !== "draft") payload.published_at = new Date();

  const featuredFile = req.files && req.files.featured_image ? req.files.featured_image[0] : null;
  const bannerFile = req.files && req.files.banner_image ? req.files.banner_image[0] : null;
  const galleryFiles = (req.files && req.files.images) || [];
  if (featuredFile) payload.featured_image = storedPathFor(featuredFile);
  if (bannerFile) payload.banner_image = storedPathFor(bannerFile);

  const blog = await sequelize.transaction(async (tx) => {
    const row = await Blog.create(payload, { transaction: tx });

    const checklist = parseChecklist(req.body.checklist);
    if (checklist && checklist.length) {
      await BlogChecklist.bulkCreate(
        checklist.map((c) => ({ ...c, blog_id: row.id })),
        { transaction: tx },
      );
    }

    const steps = parseSteps(req.body.steps);
    if (steps && steps.length) {
      await BlogStep.bulkCreate(
        steps.map((st) => ({ ...st, blog_id: row.id })),
        { transaction: tx },
      );
    }

    const related = parseRelated(req.body.related, row.id);
    if (related && related.length) {
      await BlogRelated.bulkCreate(
        related.map((r) => ({ ...r, blog_id: row.id })),
        { transaction: tx },
      );
    }

    if (galleryFiles.length) {
      await BlogImage.bulkCreate(
        galleryFiles.map((f, i) => ({
          blog_id: row.id,
          image_path: storedPathFor(f),
          alt_text: row.title,
          sort_order: i,
        })),
        { transaction: tx },
      );
    }
    return row;
  });

  const full = await Blog.findByPk(blog.id, { include: includes });
  const out = serializeBlog(full);
  out.related_ids = await relatedIdsFor(full.id);
  return created(res, out);
});

/** PUT /api/blogs/:id */
const update = asyncHandler(async (req, res) => {
  const row = await Blog.findByPk(req.params.id);
  if (!row) throw ApiError.notFound("Blog post not found");

  const payload = pickBody(req.body);
  if (req.body.slug || payload.title) {
    payload.slug = await uniqueSlug(Blog, req.body.slug || payload.title || row.title, row.id);
  }
  if (payload.status === "published" && !row.published_at && !payload.published_at) {
    payload.published_at = new Date();
  }

  const featuredFile = req.files && req.files.featured_image ? req.files.featured_image[0] : null;
  const bannerFile = req.files && req.files.banner_image ? req.files.banner_image[0] : null;
  const staleFiles = [];

  if (featuredFile) {
    staleFiles.push(row.featured_image);
    payload.featured_image = storedPathFor(featuredFile);
  } else if (String(req.body.remove_featured_image) === "true") {
    staleFiles.push(row.featured_image);
    payload.featured_image = null;
  }

  if (bannerFile) {
    staleFiles.push(row.banner_image);
    payload.banner_image = storedPathFor(bannerFile);
  } else if (String(req.body.remove_banner_image) === "true") {
    staleFiles.push(row.banner_image);
    payload.banner_image = null;
  }

  const galleryFiles = (req.files && req.files.images) || [];

  await sequelize.transaction(async (tx) => {
    await row.update(payload, { transaction: tx });

    const checklist = parseChecklist(req.body.checklist);
    if (checklist !== null) {
      await BlogChecklist.destroy({ where: { blog_id: row.id }, transaction: tx });
      if (checklist.length) {
        await BlogChecklist.bulkCreate(
          checklist.map((c) => ({ ...c, blog_id: row.id })),
          { transaction: tx },
        );
      }
    }

    // Steps arrive as the whole list or not at all, so an omitted key leaves
    // the saved steps alone and an empty array clears them.
    const steps = parseSteps(req.body.steps);
    if (steps !== null) {
      await BlogStep.destroy({ where: { blog_id: row.id }, transaction: tx });
      if (steps.length) {
        await BlogStep.bulkCreate(
          steps.map((st) => ({ ...st, blog_id: row.id })),
          { transaction: tx },
        );
      }
    }

    // Same all-or-nothing rule as the steps: an omitted key leaves the picks
    // alone, an empty array hands the row back to the automatic list.
    const related = parseRelated(req.body.related, row.id);
    if (related !== null) {
      await BlogRelated.destroy({ where: { blog_id: row.id }, transaction: tx });
      if (related.length) {
        await BlogRelated.bulkCreate(
          related.map((r) => ({ ...r, blog_id: row.id })),
          { transaction: tx },
        );
      }
    }

    // Gallery uploads are additive — existing images are removed one at a time
    // through their own endpoint, never by saving the form.
    if (galleryFiles.length) {
      const startAt = await BlogImage.count({ where: { blog_id: row.id }, transaction: tx });
      await BlogImage.bulkCreate(
        galleryFiles.map((f, i) => ({
          blog_id: row.id,
          image_path: storedPathFor(f),
          alt_text: row.title,
          sort_order: startAt + i,
        })),
        { transaction: tx },
      );
    }
  });

  staleFiles.forEach(deleteUpload);

  const full = await Blog.findByPk(row.id, { include: includes });
  const out = serializeBlog(full);
  out.related_ids = await relatedIdsFor(full.id);
  return ok(res, out);
});

/** DELETE /api/blogs/:id */
const remove = asyncHandler(async (req, res) => {
  const row = await Blog.findByPk(req.params.id, {
    include: [{ association: "images" }],
  });
  if (!row) throw ApiError.notFound("Blog post not found");

  const paths = [row.featured_image, row.banner_image];
  (row.images || []).forEach((i) => paths.push(i.image_path));

  await row.destroy();
  paths.forEach(deleteUpload);

  return noContent(res);
});

/* ── Gallery ─────────────────────────────────────────────────────────────── */

/** POST /api/blogs/:id/images */
const addImages = asyncHandler(async (req, res) => {
  const row = await Blog.findByPk(req.params.id);
  if (!row) throw ApiError.notFound("Blog post not found");

  const files = req.files || [];
  if (!files.length) throw ApiError.badRequest("No images were uploaded");

  const startAt = await BlogImage.count({ where: { blog_id: row.id } });
  const images = await BlogImage.bulkCreate(
    files.map((f, i) => ({
      blog_id: row.id,
      image_path: storedPathFor(f),
      alt_text: req.body.alt_text || row.title,
      sort_order: startAt + i,
    })),
  );

  return created(res, images.map((i) => withUrls(i.toJSON())));
});

/** DELETE /api/blogs/:id/images/:imageId */
const removeImage = asyncHandler(async (req, res) => {
  const image = await BlogImage.findOne({
    where: { id: req.params.imageId, blog_id: req.params.id },
  });
  if (!image) throw ApiError.notFound("Image not found");

  const storedPath = image.image_path;
  await image.destroy();
  deleteUpload(storedPath);

  return noContent(res);
});

module.exports = { list, getOne, create, update, remove, addImages, removeImage };
