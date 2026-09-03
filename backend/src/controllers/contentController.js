"use strict";

const { WebsiteContent } = require("../models");
const asyncHandler = require("../middleware/asyncHandler");
const ApiError = require("../utils/ApiError");
const { ok, created, noContent } = require("../utils/respond");
const { withUrls, deleteUpload, storedPathFor } = require("../utils/files");

const PAGES = ["home", "about", "details", "blogs", "contact", "global"];

const serialize = (row) => withUrls(row.toJSON ? row.toJSON() : row);

/**
 * GET /api/content
 *
 * Returns blocks keyed as `page.section_key` when `?grouped=true`, which is
 * how the frontend looks a single block up without scanning an array.
 */
const list = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.page && PAGES.includes(req.query.page)) where.page = req.query.page;
  if (!req.admin) where.is_active = true;

  const rows = await WebsiteContent.findAll({
    where,
    order: [
      ["page", "ASC"],
      ["sort_order", "ASC"],
      ["id", "ASC"],
    ],
  });

  const data = rows.map(serialize);

  if (req.query.grouped === "true") {
    const grouped = {};
    for (const row of data) {
      if (!grouped[row.page]) grouped[row.page] = {};
      grouped[row.page][row.section_key] = row;
    }
    return ok(res, grouped);
  }

  return ok(res, data);
});

/** GET /api/content/:id — accepts a numeric id or a "page.section_key" pair. */
const getOne = asyncHandler(async (req, res) => {
  const key = req.params.id;
  let row;

  if (/^\d+$/.test(key)) {
    row = await WebsiteContent.findByPk(Number(key));
  } else if (key.includes(".")) {
    const [page, ...rest] = key.split(".");
    row = await WebsiteContent.findOne({
      where: { page, section_key: rest.join(".") },
    });
  } else {
    row = await WebsiteContent.findOne({ where: { section_key: key } });
  }

  if (!row) throw ApiError.notFound("Content block not found");
  return ok(res, serialize(row));
});

const FIELDS = [
  "page",
  "section_key",
  "label",
  "title",
  "subtitle",
  "body",
  "link_url",
  "link_label",
  "sort_order",
  "is_active",
];

function pickBody(body) {
  const out = {};
  for (const key of FIELDS) {
    if (body[key] === undefined) continue;
    let v = body[key];
    if (key === "is_active") v = v === true || v === "true" || v === "1";
    else if (key === "sort_order") v = Number(v) || 0;
    else if (v === "") v = null;
    out[key] = v;
  }

  if (body.extra_data !== undefined) {
    let extra = body.extra_data;
    if (typeof extra === "string") {
      try {
        extra = JSON.parse(extra);
      } catch {
        throw ApiError.badRequest("extra_data must be valid JSON", {
          extra_data: "Must be valid JSON",
        });
      }
    }
    out.extra_data = extra;
  }

  if (out.page && !PAGES.includes(out.page)) out.page = "home";
  return out;
}

/** POST /api/content */
const create = asyncHandler(async (req, res) => {
  const payload = pickBody(req.body);
  if (!payload.section_key) {
    throw ApiError.badRequest("A section key is required", {
      section_key: "Section key is required",
    });
  }
  if (req.file) payload.image = storedPathFor(req.file);

  const row = await WebsiteContent.create(payload);
  return created(res, serialize(row));
});

/** PUT /api/content/:id */
const update = asyncHandler(async (req, res) => {
  const row = await WebsiteContent.findByPk(req.params.id);
  if (!row) throw ApiError.notFound("Content block not found");

  const payload = pickBody(req.body);

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

  return ok(res, serialize(row));
});

/**
 * PUT /api/content/bulk — save a whole page of blocks in one request, which
 * is how the admin's page editor submits.
 */
const bulkUpdate = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) throw ApiError.badRequest("No content blocks were supplied");

  const updated = await WebsiteContent.sequelize.transaction(async (tx) => {
    const out = [];
    for (const item of items) {
      if (!item.id) continue;
      const row = await WebsiteContent.findByPk(item.id, { transaction: tx });
      if (!row) continue;
      await row.update(pickBody(item), { transaction: tx });
      out.push(row);
    }
    return out;
  });

  return ok(res, updated.map(serialize));
});

/** DELETE /api/content/:id */
const remove = asyncHandler(async (req, res) => {
  const row = await WebsiteContent.findByPk(req.params.id);
  if (!row) throw ApiError.notFound("Content block not found");

  const image = row.image;
  await row.destroy();
  deleteUpload(image);

  return noContent(res);
});

module.exports = { list, getOne, create, update, bulkUpdate, remove };
