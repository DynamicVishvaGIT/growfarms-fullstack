"use strict";

const { Setting } = require("../models");
const asyncHandler = require("../middleware/asyncHandler");
const ApiError = require("../utils/ApiError");
const { ok, created, noContent } = require("../utils/respond");
const { toPublicUrl, deleteUpload, storedPathFor } = require("../utils/files");

const GROUPS = ["general", "contact", "social", "seo", "media"];
const TYPES = ["text", "textarea", "image", "url", "email", "number", "boolean"];

/** Image settings are returned with a resolved URL alongside the raw value. */
function serialize(row) {
  const s = row.toJSON ? row.toJSON() : row;
  if (s.type === "image" && s.value) s.value_url = toPublicUrl(s.value);
  return s;
}

/**
 * GET /api/settings
 *
 * `?flat=true` returns a plain `{ key: value }` map, which is what the
 * frontend wants for footer/contact details.
 */
const list = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.group && GROUPS.includes(req.query.group)) where.group = req.query.group;

  const rows = await Setting.findAll({
    where,
    order: [
      ["group", "ASC"],
      ["sort_order", "ASC"],
      ["id", "ASC"],
    ],
  });

  if (req.query.flat === "true") {
    const flat = {};
    for (const row of rows) {
      flat[row.key] = row.type === "image" && row.value ? toPublicUrl(row.value) : row.value;
    }
    return ok(res, flat);
  }

  return ok(res, rows.map(serialize));
});

/** GET /api/settings/:key */
const getOne = asyncHandler(async (req, res) => {
  const row = await Setting.findOne({ where: { key: req.params.key } });
  if (!row) throw ApiError.notFound("Setting not found");
  return ok(res, serialize(row));
});

/** PUT /api/settings/:key */
const update = asyncHandler(async (req, res) => {
  const row = await Setting.findOne({ where: { key: req.params.key } });
  if (!row) throw ApiError.notFound("Setting not found");

  let stale = null;
  const payload = {};

  if (req.file) {
    stale = row.value;
    payload.value = storedPathFor(req.file);
  } else if (String(req.body.remove_image) === "true" && row.type === "image") {
    stale = row.value;
    payload.value = null;
  } else if (req.body.value !== undefined) {
    payload.value = req.body.value === "" ? null : String(req.body.value);
  }

  if (req.body.label !== undefined) payload.label = req.body.label;

  await row.update(payload);
  if (stale) deleteUpload(stale);

  return ok(res, serialize(row));
});

/**
 * PUT /api/settings — save many keys in one request. Only keys that already
 * exist are written, so a stray field in the form can't create junk rows.
 */
const bulkUpdate = asyncHandler(async (req, res) => {
  const payload = req.body.settings || req.body;
  if (!payload || typeof payload !== "object") {
    throw ApiError.badRequest("No settings were supplied");
  }

  const updated = await Setting.sequelize.transaction(async (tx) => {
    const out = [];
    for (const [key, value] of Object.entries(payload)) {
      const row = await Setting.findOne({ where: { key }, transaction: tx });
      if (!row) continue;
      await row.update({ value: value === "" ? null : String(value) }, { transaction: tx });
      out.push(row);
    }
    return out;
  });

  return ok(res, updated.map(serialize));
});

/** POST /api/settings — for adding a brand new key from the admin panel. */
const create = asyncHandler(async (req, res) => {
  const { key, value, label } = req.body;
  if (!key) throw ApiError.badRequest("A setting key is required", { key: "Key is required" });

  const exists = await Setting.findOne({ where: { key } });
  if (exists) throw ApiError.conflict("That setting key already exists");

  const row = await Setting.create({
    key: String(key).trim().slice(0, 80),
    value: value ?? null,
    label: label ?? null,
    group: GROUPS.includes(req.body.group) ? req.body.group : "general",
    type: TYPES.includes(req.body.type) ? req.body.type : "text",
    sort_order: Number(req.body.sort_order) || 0,
  });

  return created(res, serialize(row));
});

/** DELETE /api/settings/:key */
const remove = asyncHandler(async (req, res) => {
  const row = await Setting.findOne({ where: { key: req.params.key } });
  if (!row) throw ApiError.notFound("Setting not found");

  const image = row.type === "image" ? row.value : null;
  await row.destroy();
  if (image) deleteUpload(image);

  return noContent(res);
});

module.exports = { list, getOne, update, bulkUpdate, create, remove };
