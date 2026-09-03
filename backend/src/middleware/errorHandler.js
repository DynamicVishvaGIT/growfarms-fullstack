"use strict";

const multer = require("multer");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const { deleteUpload, storedPathFor } = require("../utils/files");

/** Drop any files multer already wrote for a request that ended up failing. */
function cleanupUploads(req) {
  const files = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) files.push(...req.files);
  else if (req.files && typeof req.files === "object") {
    for (const list of Object.values(req.files)) files.push(...list);
  }
  for (const f of files) deleteUpload(storedPathFor(f));
}

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  cleanupUploads(req);

  let status = err.status || 500;
  let message = err.message || "Something went wrong";
  let details = err.details || null;

  if (err instanceof multer.MulterError) {
    status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? `File is too large. Maximum size is ${Math.round(env.upload.maxSizeBytes / 1024 / 1024)}MB`
        : `Upload failed: ${err.message}`;
  } else if (err.name === "SequelizeUniqueConstraintError") {
    status = 409;
    details = Object.fromEntries(
      (err.errors || []).map((e) => [e.path, `${e.path} is already in use`]),
    );
    message = "That value is already taken";
  } else if (err.name === "SequelizeValidationError") {
    status = 422;
    details = Object.fromEntries((err.errors || []).map((e) => [e.path, e.message]));
    message = "Please correct the highlighted fields";
  } else if (err.name === "SequelizeForeignKeyConstraintError") {
    status = 409;
    message = "That record is still referenced by other data";
  } else if (
    err.name === "SequelizeDatabaseError" &&
    err.original &&
    err.original.code === "ER_DATA_TOO_LONG"
  ) {
    // Pasting more text than the column holds is the author's mistake, not the
    // server's: answer it like any other field error so the form can point at
    // the offending input instead of showing a 500.
    status = 422;
    message = "Please correct the highlighted fields";
    const column = /column '([^']+)'/.exec(err.original.sqlMessage || "");
    details = column ? { [column[1]]: "This is too long for that field" } : null;
  } else if (err.name === "SequelizeDatabaseError" && !env.isProduction) {
    status = 500;
    message = err.message;
  }

  // Never leak internals on a 500 in production.
  if (status >= 500 && env.isProduction) {
    message = "Something went wrong. Please try again.";
    details = null;
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  const body = { success: false, message };
  if (details) body.errors = details;
  if (!env.isProduction && status >= 500) body.stack = err.stack;

  res.status(status).json(body);
};
