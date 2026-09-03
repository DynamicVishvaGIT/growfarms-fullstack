"use strict";

const { Category, Project, Package, Blog } = require("../models");
const asyncHandler = require("../middleware/asyncHandler");
const ApiError = require("../utils/ApiError");
const { ok, created, noContent } = require("../utils/respond");
const { withUrls, deleteUpload, storedPathFor } = require("../utils/files");
const { uniqueSlug } = require("../services/slugService");

const TYPES = ["project", "package", "blog"];

/** GET /api/categories */
const list = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.type && TYPES.includes(req.query.type)) where.type = req.query.type;
  if (!req.admin) where.is_active = true;

  const rows = await Category.findAll({
    where,
    order: [
      ["type", "ASC"],
      ["sort_order", "ASC"],
      ["name", "ASC"],
    ],
  });

  return ok(res, rows.map((r) => withUrls(r.toJSON())));
});

/** GET /api/categories/:idOrSlug */
const getOne = asyncHandler(async (req, res) => {
  const key = req.params.idOrSlug;
  const where = /^\d+$/.test(key) ? { id: Number(key) } : { slug: key };

  const row = await Category.findOne({ where });
  if (!row) throw ApiError.notFound("Category not found");

  return ok(res, withUrls(row.toJSON()));
});

function pickBody(body) {
  const out = {};
  for (const key of ["name", "type", "description", "sort_order", "is_active"]) {
    if (body[key] === undefined) continue;
    let v = body[key];
    if (key === "is_active") v = v === true || v === "true" || v === "1";
    else if (key === "sort_order") v = Number(v) || 0;
    else if (v === "") v = null;
    out[key] = v;
  }
  if (out.type && !TYPES.includes(out.type)) out.type = "project";
  return out;
}

/** POST /api/categories */
const create = asyncHandler(async (req, res) => {
  const payload = pickBody(req.body);
  if (!payload.name) {
    throw ApiError.badRequest("Category name is required", { name: "Name is required" });
  }

  payload.slug = await uniqueSlug(Category, req.body.slug || payload.name);
  if (req.file) payload.image = storedPathFor(req.file);

  const row = await Category.create(payload);
  return created(res, withUrls(row.toJSON()));
});

/** PUT /api/categories/:id */
const update = asyncHandler(async (req, res) => {
  const row = await Category.findByPk(req.params.id);
  if (!row) throw ApiError.notFound("Category not found");

  const payload = pickBody(req.body);
  if (req.body.slug || payload.name) {
    payload.slug = await uniqueSlug(Category, req.body.slug || payload.name || row.name, row.id);
  }

  let stale = null;
  if (req.file) {
    stale = row.image;
    payload.image = storedPathFor(req.file);
  } else if (String(req.body.remove_image) === "true") {
    stale = row.image;
    payload.image = null;
  }

  await row.update(payload);
  if (stale) deleteUpload(stale);

  return ok(res, withUrls(row.toJSON()));
});

/**
 * DELETE /api/categories/:id
 *
 * Refused while anything still points at it — silently orphaning projects or
 * posts would be far harder to notice than an explicit error.
 */
const remove = asyncHandler(async (req, res) => {
  const row = await Category.findByPk(req.params.id);
  if (!row) throw ApiError.notFound("Category not found");

  const [projects, packages, blogs] = await Promise.all([
    Project.count({ where: { category_id: row.id } }),
    Package.count({ where: { category_id: row.id } }),
    Blog.count({ where: { category_id: row.id } }),
  ]);

  const inUse = projects + packages + blogs;
  if (inUse > 0) {
    throw ApiError.conflict(
      `This category is still used by ${projects} project(s), ${packages} package(s) and ${blogs} blog post(s). Reassign them first.`,
    );
  }

  const image = row.image;
  await row.destroy();
  deleteUpload(image);

  return noContent(res);
});

module.exports = { list, getOne, create, update, remove };
