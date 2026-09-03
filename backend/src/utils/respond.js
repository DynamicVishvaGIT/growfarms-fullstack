"use strict";

/** Every successful response shares this envelope so clients can rely on it. */
const ok = (res, data, meta) => {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.json(body);
};

const created = (res, data) => res.status(201).json({ success: true, data });

const noContent = (res) => res.status(204).send();

/** Build a pagination meta block from the standard Sequelize count/rows shape. */
const paginated = (res, { count, rows }, { page, limit }) =>
  res.json({
    success: true,
    data: rows,
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(count / limit)),
    },
  });

module.exports = { ok, created, noContent, paginated };
