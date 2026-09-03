"use strict";

const { Op } = require("sequelize");

const asyncHandler = require("../middleware/asyncHandler");
const ApiError = require("../utils/ApiError");
const { ok, created, noContent } = require("../utils/respond");
const { withUrls, deleteUpload, storedPathFor } = require("../utils/files");

/**
 * Build a standard five-verb controller for the simple ordered CMS lists
 * (amenities, FAQs, slides, steps, testimonials …). Each of those resources
 * is the same shape — a flat, sortable, toggleable row with at most one image
 * — so factoring the handlers keeps ~9 near-identical files honest.
 *
 * Anything with real domain logic (projects, packages, blogs, enquiries)
 * gets a hand-written controller instead.
 */
function crudFactory({
  model,
  fields,
  imageField = null,
  imageFolder = "misc",
  defaultOrder = [["sort_order", "ASC"], ["id", "ASC"]],
  publicFilter = { is_active: true },
  label = "Item",
  // Set for the lists that carry a nullable project_id. A row with a project
  // belongs to that project alone; a row without one is the shared default.
  projectScoped = false,
}) {
  /** Copy only whitelisted keys off the body — never spread req.body. */
  const pick = (body) => {
    const out = {};
    for (const f of fields) {
      if (body[f] !== undefined) {
        // Multipart bodies arrive as strings; normalise the obvious casts.
        let v = body[f];
        // multipart/form-data encodes every newline as CRLF, so a textarea
        // would store stray \r the frontend then has to split around.
        if (typeof v === "string") v = v.replace(/\r\n/g, "\n");
        if (v === "null" || v === "") v = null;
        else if (v === "true") v = true;
        else if (v === "false") v = false;
        out[f] = v;
      }
    }
    return out;
  };

  const serialize = (row) => withUrls(row.toJSON ? row.toJSON() : row);

  return {
    /** Public list — active rows only, in display order. */
    listPublic: asyncHandler(async (req, res) => {
      const where = { ...publicFilter };

      if (req.query.project_id) {
        where.project_id = req.query.project_id;
      } else if (projectScoped) {
        // No project asked for means "the shared list". Without this, one
        // project's FAQs and testimonials would surface on the home page and
        // on every other project that has none of its own.
        where.project_id = null;
      }

      // `scope` is how buying steps separate the project page's curve from the
      // blog article's list. Ignoring it here served the blog the project
      // page's steps.
      if (req.query.scope && model.rawAttributes.scope) where.scope = req.query.scope;

      const rows = await model.findAll({ where, order: defaultOrder });
      return ok(res, rows.map(serialize));
    }),

    /** Admin list — everything, including inactive rows. */
    listAdmin: asyncHandler(async (req, res) => {
      const where = {};
      // `project_id=null` asks for the shared rows specifically; omitting it
      // altogether still returns every row, which is what the plain CMS lists
      // want when no project is selected.
      if (req.query.project_id === "null") {
        where.project_id = null;
      } else if (req.query.project_id) {
        // `include_shared` is what the Project Content screen asks for: it has
        // to show what the page actually renders, and a project with no rows of
        // its own renders the shared ones.
        where.project_id =
          req.query.include_shared === "true"
            ? { [Op.or]: [req.query.project_id, null] }
            : req.query.project_id;
      }
      if (req.query.scope && model.rawAttributes.scope) where.scope = req.query.scope;
      const rows = await model.findAll({ where, order: defaultOrder });
      return ok(res, rows.map(serialize));
    }),

    getOne: asyncHandler(async (req, res) => {
      const row = await model.findByPk(req.params.id);
      if (!row) throw ApiError.notFound(`${label} not found`);
      return ok(res, serialize(row));
    }),

    create: asyncHandler(async (req, res) => {
      const payload = pick(req.body);
      if (imageField && req.file) payload[imageField] = storedPathFor(req.file);
      const row = await model.create(payload);
      return created(res, serialize(row));
    }),

    update: asyncHandler(async (req, res) => {
      const row = await model.findByPk(req.params.id);
      if (!row) throw ApiError.notFound(`${label} not found`);

      const payload = pick(req.body);

      if (imageField && req.file) {
        const previous = row[imageField];
        payload[imageField] = storedPathFor(req.file);
        await row.update(payload);
        // Only remove the old file once the row has actually been updated,
        // so a failed write never leaves the record pointing at nothing.
        deleteUpload(previous);
        return ok(res, serialize(row));
      }

      // An explicit `remove_image` flag clears the image without replacing it.
      if (imageField && String(req.body.remove_image) === "true") {
        const previous = row[imageField];
        payload[imageField] = null;
        await row.update(payload);
        deleteUpload(previous);
        return ok(res, serialize(row));
      }

      await row.update(payload);
      return ok(res, serialize(row));
    }),

    remove: asyncHandler(async (req, res) => {
      const row = await model.findByPk(req.params.id);
      if (!row) throw ApiError.notFound(`${label} not found`);
      const image = imageField ? row[imageField] : null;
      await row.destroy();
      deleteUpload(image);
      return noContent(res);
    }),

    /** Bulk re-order from a drag-and-drop list: [{id, sort_order}, …]. */
    reorder: asyncHandler(async (req, res) => {
      const items = Array.isArray(req.body.items) ? req.body.items : [];
      await model.sequelize.transaction(async (tx) => {
        for (const { id, sort_order } of items) {
          await model.update({ sort_order }, { where: { id }, transaction: tx });
        }
      });
      return ok(res, { updated: items.length });
    }),

    imageFolder,
  };
}

module.exports = crudFactory;
