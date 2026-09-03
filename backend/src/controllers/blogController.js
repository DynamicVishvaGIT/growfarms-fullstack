"use strict";

const { Op } = require("sequelize");
const { Blog, BlogChecklist, sequelize } = require("../models");
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
];

function serializeBlog(row) {
  return withUrls(row.toJSON());
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

  // The blog detail page shows three sibling posts.
  data.related = await Blog.findAll({
    where: { status: "published", id: { [Op.ne]: row.id } },
    order: [["published_at", "DESC"]],
    limit: 3,
    attributes: { exclude: ["content"] },
    include: [{ association: "category", attributes: ["id", "name", "slug"] }],
  }).then((rows) => rows.map(serializeBlog));

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
    return row;
  });

  const full = await Blog.findByPk(blog.id, { include: includes });
  return created(res, serializeBlog(full));
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
  });

  staleFiles.forEach(deleteUpload);

  const full = await Blog.findByPk(row.id, { include: includes });
  return ok(res, serializeBlog(full));
});

/** DELETE /api/blogs/:id */
const remove = asyncHandler(async (req, res) => {
  const row = await Blog.findByPk(req.params.id);
  if (!row) throw ApiError.notFound("Blog post not found");

  const paths = [row.featured_image, row.banner_image];
  await row.destroy();
  paths.forEach(deleteUpload);

  return noContent(res);
});

module.exports = { list, getOne, create, update, remove };
