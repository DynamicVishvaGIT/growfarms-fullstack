"use strict";

const slugify = require("slugify");
const { Op } = require("sequelize");

const base = (value) =>
  slugify(String(value || ""), { lower: true, strict: true, trim: true }).slice(0, 150) ||
  "item";

/**
 * Produce a slug unique within `Model`, appending -2, -3 … on collision.
 * `excludeId` lets an update keep its own slug without colliding with itself.
 */
async function uniqueSlug(Model, value, excludeId = null, field = "slug") {
  const root = base(value);
  let candidate = root;
  let n = 1;

  // Bounded so a pathological data set can never spin here forever.
  while (n < 500) {
    const where = { [field]: candidate };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await Model.findOne({ where, attributes: ["id"] });
    if (!existing) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

module.exports = { uniqueSlug, base };
