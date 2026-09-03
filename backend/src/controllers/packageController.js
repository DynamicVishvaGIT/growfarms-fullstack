"use strict";

const { Op } = require("sequelize");
const {
  Package,
  PackageImage,
  PackageTag,
  sequelize,
} = require("../models");
const asyncHandler = require("../middleware/asyncHandler");
const ApiError = require("../utils/ApiError");
const { ok, created, noContent, paginated } = require("../utils/respond");
const { getPagination, getOrder } = require("../utils/pagination");
const { withUrls, deleteUpload, storedPathFor } = require("../utils/files");
const { uniqueSlug } = require("../services/slugService");

const WRITABLE = [
  "project_id",
  "category_id",
  "title",
  "description",
  "price",
  "price_label",
  "area_sqft",
  "built_up_sqft",
  "configuration",
  "button_variant",
  "button_color",
  "button_label",
  "card_rotate",
  "status",
  "sort_order",
];

const NUMERICS = [
  "project_id",
  "category_id",
  "price",
  "area_sqft",
  "built_up_sqft",
  "card_rotate",
  "sort_order",
];

function pickBody(body) {
  const out = {};
  for (const key of WRITABLE) {
    if (body[key] === undefined) continue;
    let v = body[key];
    if (NUMERICS.includes(key)) {
      v = v === "" || v === null || v === "null" ? null : Number(v);
    } else if (v === "") {
      v = null;
    }
    out[key] = v;
  }
  return out;
}

const includes = [
  { association: "project", attributes: ["id", "title", "slug"] },
  { association: "category", attributes: ["id", "name", "slug"] },
  { association: "images", separate: true, order: [["sort_order", "ASC"]] },
  { association: "tags", separate: true, order: [["sort_order", "ASC"]] },
];

function serializePackage(row) {
  const p = withUrls(row.toJSON());
  if (p.images) p.images = p.images.map((i) => withUrls(i));

  // The card reads `images` as a plain array of URLs for its crossfade loop.
  p.image_urls = (p.images || []).map((i) => i.image_path_url).filter(Boolean);

  if (p.card_rotate !== null && p.card_rotate !== undefined) {
    p.card_rotate = Number(p.card_rotate);
  }
  if (p.price !== null && p.price !== undefined) p.price = Number(p.price);

  return p;
}

/* ── Reads ───────────────────────────────────────────────────────────────── */

/** GET /api/packages */
const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query, 50);
  const order = getOrder(
    req.query,
    ["sort_order", "title", "price", "created_at"],
    [
      ["sort_order", "ASC"],
      ["id", "ASC"],
    ],
  );

  const where = {};
  if (!req.admin) where.status = "active";
  else if (req.query.status) where.status = req.query.status;

  if (req.query.project_id) where.project_id = req.query.project_id;
  if (req.query.category_id) where.category_id = req.query.category_id;

  if (req.query.search) {
    const q = `%${req.query.search}%`;
    where[Op.or] = [{ title: { [Op.like]: q } }, { description: { [Op.like]: q } }];
  }

  const result = await Package.findAndCountAll({
    where,
    order,
    limit,
    offset,
    distinct: true,
    include: includes,
  });

  result.rows = result.rows.map(serializePackage);
  return paginated(res, result, { page, limit });
});

/** GET /api/packages/:idOrSlug */
const getOne = asyncHandler(async (req, res) => {
  const key = req.params.idOrSlug;
  const where = /^\d+$/.test(key) ? { id: Number(key) } : { slug: key };
  if (!req.admin) where.status = "active";

  const row = await Package.findOne({ where, include: includes });
  if (!row) throw ApiError.notFound("Package not found");

  return ok(res, serializePackage(row));
});

/* ── Writes ──────────────────────────────────────────────────────────────── */

/** Parse the tag list, accepting JSON or a comma separated fallback. */
function parseTags(raw) {
  if (raw === undefined || raw === null) return null;
  let tags = raw;
  if (typeof tags === "string") {
    try {
      tags = JSON.parse(tags);
    } catch {
      tags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((label) => ({ label }));
    }
  }
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t, i) => ({
      label: String(typeof t === "string" ? t : t.label || "").trim().slice(0, 80),
      accent_color: (typeof t === "object" && t.accent_color) || null,
      sort_order: i,
    }))
    .filter((t) => t.label);
}

/** POST /api/packages */
const create = asyncHandler(async (req, res) => {
  const payload = pickBody(req.body);
  if (!payload.title) {
    throw ApiError.badRequest("Title is required", { title: "Title is required" });
  }

  payload.slug = await uniqueSlug(Package, req.body.slug || payload.title);

  const pkg = await sequelize.transaction(async (tx) => {
    const row = await Package.create(payload, { transaction: tx });

    const files = req.files || [];
    if (files.length) {
      await PackageImage.bulkCreate(
        files.map((f, i) => ({
          package_id: row.id,
          image_path: storedPathFor(f),
          alt_text: row.title,
          is_primary: i === 0,
          sort_order: i,
        })),
        { transaction: tx },
      );
    }

    const tags = parseTags(req.body.tags);
    if (tags && tags.length) {
      await PackageTag.bulkCreate(
        tags.map((t) => ({ ...t, package_id: row.id })),
        { transaction: tx },
      );
    }

    return row;
  });

  const full = await Package.findByPk(pkg.id, { include: includes });
  return created(res, serializePackage(full));
});

/** PUT /api/packages/:id */
const update = asyncHandler(async (req, res) => {
  const row = await Package.findByPk(req.params.id);
  if (!row) throw ApiError.notFound("Package not found");

  const payload = pickBody(req.body);
  if (req.body.slug || payload.title) {
    payload.slug = await uniqueSlug(
      Package,
      req.body.slug || payload.title || row.title,
      row.id,
    );
  }

  await sequelize.transaction(async (tx) => {
    await row.update(payload, { transaction: tx });

    const files = req.files || [];
    if (files.length) {
      const startAt = await PackageImage.count({
        where: { package_id: row.id },
        transaction: tx,
      });
      await PackageImage.bulkCreate(
        files.map((f, i) => ({
          package_id: row.id,
          image_path: storedPathFor(f),
          alt_text: row.title,
          sort_order: startAt + i,
        })),
        { transaction: tx },
      );
    }

    // Tags are small and fully controlled by the form, so replacing the set
    // wholesale is simpler and safer than diffing it.
    const tags = parseTags(req.body.tags);
    if (tags !== null) {
      await PackageTag.destroy({ where: { package_id: row.id }, transaction: tx });
      if (tags.length) {
        await PackageTag.bulkCreate(
          tags.map((t) => ({ ...t, package_id: row.id })),
          { transaction: tx },
        );
      }
    }
  });

  const full = await Package.findByPk(row.id, { include: includes });
  return ok(res, serializePackage(full));
});

/** DELETE /api/packages/:id */
const remove = asyncHandler(async (req, res) => {
  const row = await Package.findByPk(req.params.id, {
    include: [{ association: "images" }],
  });
  if (!row) throw ApiError.notFound("Package not found");

  const paths = (row.images || []).map((i) => i.image_path);
  await row.destroy();
  paths.forEach(deleteUpload);

  return noContent(res);
});

/** POST /api/packages/:id/images */
const addImages = asyncHandler(async (req, res) => {
  const row = await Package.findByPk(req.params.id);
  if (!row) throw ApiError.notFound("Package not found");

  const files = req.files || [];
  if (!files.length) throw ApiError.badRequest("No images were uploaded");

  const startAt = await PackageImage.count({ where: { package_id: row.id } });
  const images = await PackageImage.bulkCreate(
    files.map((f, i) => ({
      package_id: row.id,
      image_path: storedPathFor(f),
      alt_text: row.title,
      sort_order: startAt + i,
    })),
  );

  return created(res, images.map((i) => withUrls(i.toJSON())));
});

/** DELETE /api/packages/:id/images/:imageId */
const removeImage = asyncHandler(async (req, res) => {
  const image = await PackageImage.findOne({
    where: { id: req.params.imageId, package_id: req.params.id },
  });
  if (!image) throw ApiError.notFound("Image not found");

  const path = image.image_path;
  await image.destroy();
  deleteUpload(path);

  return noContent(res);
});

module.exports = { list, getOne, create, update, remove, addImages, removeImage };
