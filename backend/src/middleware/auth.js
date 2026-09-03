"use strict";

const jwt = require("jsonwebtoken");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("./asyncHandler");

function extractToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}

/**
 * Verify the bearer token and attach the live admin row to `req.admin`.
 *
 * The row is re-read on every request rather than trusted from the token, so
 * deactivating an admin takes effect immediately instead of at token expiry.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized("Authentication token missing");

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.secret);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Your session has expired, please sign in again");
    }
    throw ApiError.unauthorized("Invalid authentication token");
  }

  const { Admin } = require("../models");
  const admin = await Admin.findByPk(payload.sub);

  if (!admin) throw ApiError.unauthorized("Account no longer exists");
  if (!admin.is_active) throw ApiError.forbidden("This account has been deactivated");

  req.admin = admin;
  next();
});

/** Restrict a route to specific roles. Use after `requireAuth`. */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.admin) return next(ApiError.unauthorized());
  if (!roles.includes(req.admin.role)) {
    return next(ApiError.forbidden(`This action requires one of: ${roles.join(", ")}`));
  }
  next();
};

module.exports = { requireAuth, requireRole };
