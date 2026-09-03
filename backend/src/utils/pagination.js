"use strict";

const MAX_LIMIT = 100;

/** Normalise `?page=&limit=` into safe integers with sane bounds. */
function getPagination(query, defaultLimit = 20) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  return { page, limit, offset: (page - 1) * limit };
}

/**
 * Turn `?sort=field&order=desc` into a Sequelize order clause, but only for
 * columns the caller has explicitly whitelisted — otherwise a crafted `sort`
 * would let a client order by (and probe) arbitrary columns.
 */
function getOrder(query, allowed = ["created_at"], fallback = [["created_at", "DESC"]]) {
  const field = query.sort;
  if (!field || !allowed.includes(field)) return fallback;
  const dir = String(query.order || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";
  return [[field, dir]];
}

module.exports = { getPagination, getOrder, MAX_LIMIT };
