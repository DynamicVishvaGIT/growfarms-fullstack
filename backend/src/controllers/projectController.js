"use strict";

const { Op } = require("sequelize");
const {
  Project,
  ProjectImage,
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
  "short_description",
  "full_description",
  "location",
  "total_area",
  "category_id",
  "map_pin_top",
  "map_pin_left",
  "status",
  "is_featured",
  "show_on_map",
  "sort_order",
  "meta_title",
  "meta_description",
  "about_eyebrow",
  "about_title",
  "about_body",
  "why_choose_eyebrow",
  "why_choose_title",
  "why_choose_body",
  "invest_title",
  "invest_body",
];

const BOOLEANS = ["is_featured", "show_on_map"];
const NUMERICS = ["category_id", "map_pin_top", "map_pin_left", "sort_order"];

/**
 * The single-image columns a project form can upload or clear. Each arrives as
 * its own multer field, and each accepts a `remove_<field>=true` flag.
 */
const IMAGE_FIELDS = [
  "hero_image",
  "map_image",
  "about_image",
  "about_image_2",
  "about_image_3",
  "about_image_4",
  "invest_image",
];

const firstFile = (files, field) =>
  files && files[field] && files[field][0] ? files[field][0] : null;

/** Whitelist and type-normalise a multipart or JSON body. */
function pickBody(body) {
  const out = {};
  for (const key of WRITABLE) {
    if (body[key] === undefined) continue;
    let v = body[key];
    if (BOOLEANS.includes(key)) {
      v = v === true || v === "true" || v === "1";
    } else if (NUMERICS.includes(key)) {
      v = v === "" || v === null || v === "null" ? null : Number(v);
    } else if (v === "") {
      v = null;
    } else if (typeof v === "string") {
      // multipart/form-data encodes every newline as CRLF; the About and
      // "Why invest" headings are split on newlines to rebuild the design's
      // line breaks, so stray \r has to go before it is stored.
      v = v.replace(/\r\n/g, "\n");
    }
    out[key] = v;
  }
  return out;
}

/** Includes used when the frontend asks for a full project detail page. */
const detailIncludes = [
  { association: "category", attributes: ["id", "name", "slug"] },
  { association: "images", separate: true, order: [["sort_order", "ASC"]] },
  {
    association: "packages",
    required: false,
    include: [{ association: "images" }, { association: "tags" }],
  },
  { association: "amenities", through: { attributes: ["sort_order"] } },
  { association: "facilities", where: { is_active: true }, required: false },
  { association: "routes", where: { is_active: true }, required: false },
  { association: "faqs", where: { is_active: true }, required: false },
  { association: "whyChooseCards", where: { is_active: true }, required: false },
  // `separate` keeps these two ordered without multiplying the joined rows —
  // an empty result simply means "this project uses the shared list".
  {
    association: "buyingSteps",
    separate: true,
    where: { is_active: true, scope: "details" },
    order: [["sort_order", "ASC"], ["id", "ASC"]],
  },
  {
    association: "testimonials",
    separate: true,
    where: { is_active: true },
    order: [["sort_order", "ASC"], ["id", "ASC"]],
  },
];

/** Convert every stored path on a loaded project tree into a public URL. */
function serializeProject(row) {
  const p = withUrls(row.toJSON(), IMAGE_FIELDS);

  if (p.images) p.images = p.images.map((i) => withUrls(i));
  if (p.amenities) p.amenities = p.amenities.map((a) => withUrls(a));
  if (p.facilities) p.facilities = p.facilities.map((f) => withUrls(f));
  if (p.routes) p.routes = p.routes.map((r) => withUrls(r));
  if (p.whyChooseCards) p.whyChooseCards = p.whyChooseCards.map((c) => withUrls(c));
  if (p.buyingSteps) p.buyingSteps = p.buyingSteps.map((s) => withUrls(s));
  if (p.testimonials) p.testimonials = p.testimonials.map((t) => withUrls(t));

  if (p.packages) {
    p.packages = p.packages.map((pkg) => {
      const out = withUrls(pkg);
      if (out.images) out.images = out.images.map((i) => withUrls(i));
      return out;
    });
  }

  // DECIMAL columns come back as strings from the MySQL driver, and the pin
  // placement maths in AerialMapSection needs real numbers.
  if (p.map_pin_top !== null && p.map_pin_top !== undefined) {
    p.map_pin_top = Number(p.map_pin_top);
  }
  if (p.map_pin_left !== null && p.map_pin_left !== undefined) {
    p.map_pin_left = Number(p.map_pin_left);
  }

  return p;
}

/* ── Public reads ────────────────────────────────────────────────────────── */

/** GET /api/projects */
const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query, 50);
  const order = getOrder(
    req.query,
    ["sort_order", "title", "created_at"],
    [
      ["sort_order", "ASC"],
      ["id", "ASC"],
    ],
  );

  const where = {};
  // Admin callers see everything; the public endpoint only ever sees active.
  if (!req.admin) where.status = "active";
  else if (req.query.status) where.status = req.query.status;

  if (req.query.category_id) where.category_id = req.query.category_id;
  if (req.query.featured === "true") where.is_featured = true;
  if (req.query.on_map === "true") where.show_on_map = true;

  if (req.query.search) {
    const q = `%${req.query.search}%`;
    where[Op.or] = [
      { title: { [Op.like]: q } },
      { location: { [Op.like]: q } },
      { short_description: { [Op.like]: q } },
    ];
  }

  const result = await Project.findAndCountAll({
    where,
    order,
    limit,
    offset,
    distinct: true,
    include: [
      { association: "category", attributes: ["id", "name", "slug"] },
      { association: "images", separate: true, order: [["sort_order", "ASC"]] },
    ],
  });

  result.rows = result.rows.map(serializeProject);
  return paginated(res, result, { page, limit });
});

/** GET /api/projects/map — the trimmed payload AerialMapSection needs. */
const mapPins = asyncHandler(async (req, res) => {
  const rows = await Project.findAll({
    where: { status: "active", show_on_map: true },
    order: [
      ["sort_order", "ASC"],
      ["id", "ASC"],
    ],
    attributes: [
      "id",
      "slug",
      "title",
      "short_description",
      "full_description",
      "hero_image",
      "map_pin_top",
      "map_pin_left",
    ],
  });
  return ok(res, rows.map(serializeProject));
});

/** GET /api/projects/featured — backs /details when no slug is given. */
const featured = asyncHandler(async (req, res) => {
  const row =
    (await Project.findOne({
      where: { status: "active", is_featured: true },
      order: [["sort_order", "ASC"]],
      include: detailIncludes,
    })) ||
    (await Project.findOne({
      where: { status: "active" },
      order: [["sort_order", "ASC"]],
      include: detailIncludes,
    }));

  if (!row) throw ApiError.notFound("No active project available");
  return ok(res, serializeProject(row));
});

/** GET /api/projects/:idOrSlug */
const getOne = asyncHandler(async (req, res) => {
  const key = req.params.idOrSlug;
  const where = /^\d+$/.test(key) ? { id: Number(key) } : { slug: key };
  if (!req.admin) where.status = "active";

  const row = await Project.findOne({ where, include: detailIncludes });
  if (!row) throw ApiError.notFound("Project not found");

  return ok(res, serializeProject(row));
});

/* ── Admin writes ────────────────────────────────────────────────────────── */

/** Replace a project's amenity links with the given id list. */
async function syncAmenities(project, rawIds, transaction) {
  let ids = rawIds;
  if (typeof ids === "string") {
    try {
      ids = JSON.parse(ids);
    } catch {
      ids = ids.split(",");
    }
  }
  const clean = (Array.isArray(ids) ? ids : [])
    .map((v) => parseInt(v, 10))
    .filter(Number.isFinite);

  await project.setAmenities(clean, { transaction });
}

/** POST /api/projects */
const create = asyncHandler(async (req, res) => {
  const payload = pickBody(req.body);
  if (!payload.title) {
    throw ApiError.badRequest("Title is required", { title: "Title is required" });
  }

  payload.slug = await uniqueSlug(Project, req.body.slug || payload.title);

  const heroFile = firstFile(req.files, "hero_image");
  for (const field of IMAGE_FIELDS) {
    const file = firstFile(req.files, field);
    if (file) payload[field] = storedPathFor(file);
  }

  const project = await sequelize.transaction(async (tx) => {
    const row = await Project.create(payload, { transaction: tx });

    const gallery = (req.files && req.files.images) || [];
    if (gallery.length) {
      await ProjectImage.bulkCreate(
        gallery.map((f, i) => ({
          project_id: row.id,
          image_path: storedPathFor(f),
          alt_text: row.title,
          is_primary: i === 0 && !heroFile,
          sort_order: i,
        })),
        { transaction: tx },
      );
    }

    if (req.body.amenity_ids !== undefined) {
      await syncAmenities(row, req.body.amenity_ids, tx);
    }
    return row;
  });

  const full = await Project.findByPk(project.id, { include: detailIncludes });
  return created(res, serializeProject(full));
});

/** PUT /api/projects/:id */
const update = asyncHandler(async (req, res) => {
  const row = await Project.findByPk(req.params.id);
  if (!row) throw ApiError.notFound("Project not found");

  const payload = pickBody(req.body);
  if (req.body.slug || payload.title) {
    payload.slug = await uniqueSlug(
      Project,
      req.body.slug || payload.title || row.title,
      row.id,
    );
  }

  const staleFiles = [];

  for (const field of IMAGE_FIELDS) {
    const file = firstFile(req.files, field);
    if (file) {
      staleFiles.push(row[field]);
      payload[field] = storedPathFor(file);
    } else if (String(req.body[`remove_${field}`]) === "true") {
      staleFiles.push(row[field]);
      payload[field] = null;
    }
  }

  await sequelize.transaction(async (tx) => {
    await row.update(payload, { transaction: tx });

    const gallery = (req.files && req.files.images) || [];
    if (gallery.length) {
      const startAt = await ProjectImage.count({
        where: { project_id: row.id },
        transaction: tx,
      });
      await ProjectImage.bulkCreate(
        gallery.map((f, i) => ({
          project_id: row.id,
          image_path: storedPathFor(f),
          alt_text: row.title,
          sort_order: startAt + i,
        })),
        { transaction: tx },
      );
    }

    if (req.body.amenity_ids !== undefined) {
      await syncAmenities(row, req.body.amenity_ids, tx);
    }
  });

  // Old files go only once the row is safely committed, so a failed write
  // never leaves the record pointing at a deleted file.
  staleFiles.forEach(deleteUpload);

  const full = await Project.findByPk(row.id, { include: detailIncludes });
  return ok(res, serializeProject(full));
});

/** DELETE /api/projects/:id */
const remove = asyncHandler(async (req, res) => {
  const row = await Project.findByPk(req.params.id, {
    include: [
      { association: "images" },
      { association: "packages", include: [{ association: "images" }] },
    ],
  });
  if (!row) throw ApiError.notFound("Project not found");

  // Every single-image column, so deleting a project leaves no orphaned file
  // behind on disk.
  const paths = IMAGE_FIELDS.map((f) => row[f]);
  (row.images || []).forEach((i) => paths.push(i.image_path));
  (row.packages || []).forEach((p) =>
    (p.images || []).forEach((i) => paths.push(i.image_path)),
  );

  await row.destroy();
  paths.forEach(deleteUpload);

  return noContent(res);
});

/* ── Gallery sub-resource ────────────────────────────────────────────────── */

/** POST /api/projects/:id/images */
const addImages = asyncHandler(async (req, res) => {
  const row = await Project.findByPk(req.params.id);
  if (!row) throw ApiError.notFound("Project not found");

  const files = req.files || [];
  if (!files.length) throw ApiError.badRequest("No images were uploaded");

  const startAt = await ProjectImage.count({ where: { project_id: row.id } });
  const images = await ProjectImage.bulkCreate(
    files.map((f, i) => ({
      project_id: row.id,
      image_path: storedPathFor(f),
      alt_text: req.body.alt_text || row.title,
      sort_order: startAt + i,
    })),
  );

  return created(res, images.map((i) => withUrls(i.toJSON())));
});

/** DELETE /api/projects/:id/images/:imageId */
const removeImage = asyncHandler(async (req, res) => {
  const image = await ProjectImage.findOne({
    where: { id: req.params.imageId, project_id: req.params.id },
  });
  if (!image) throw ApiError.notFound("Image not found");

  const path = image.image_path;
  await image.destroy();
  deleteUpload(path);

  return noContent(res);
});

/** PUT /api/projects/:id/images/:imageId/primary */
const setPrimaryImage = asyncHandler(async (req, res) => {
  const image = await ProjectImage.findOne({
    where: { id: req.params.imageId, project_id: req.params.id },
  });
  if (!image) throw ApiError.notFound("Image not found");

  await sequelize.transaction(async (tx) => {
    await ProjectImage.update(
      { is_primary: false },
      { where: { project_id: req.params.id }, transaction: tx },
    );
    await image.update({ is_primary: true }, { transaction: tx });
  });

  return ok(res, withUrls(image.toJSON()));
});

module.exports = {
  list,
  mapPins,
  getOne,
  featured,
  create,
  update,
  remove,
  addImages,
  removeImage,
  setPrimaryImage,
};
