"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const env = require("./env");
const ApiError = require("../utils/ApiError");

/** Folders an upload is allowed to land in — anything else is rejected. */
const FOLDERS = ["projects", "packages", "blogs", "amenities", "facilities", "misc"];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Build a collision-proof filename that keeps no part of the client-supplied
 * name except a sanitised slug, so a hostile filename can never traverse out
 * of the upload directory or masquerade as a script.
 */
function uniqueFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const base = path
    .basename(originalName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "image";

  const stamp = Date.now().toString(36);
  const rand = crypto.randomBytes(8).toString("hex");
  return `${base}-${stamp}-${rand}${ext}`;
}

function storageFor(folder) {
  return multer.diskStorage({
    destination(req, file, cb) {
      const safeFolder = FOLDERS.includes(folder) ? folder : "misc";
      const dest = path.join(env.paths.uploads, safeFolder);
      ensureDir(dest);
      cb(null, dest);
    },
    filename(req, file, cb) {
      cb(null, uniqueFilename(file.originalname));
    },
  });
}

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = env.upload.allowedMime.includes(file.mimetype);
  const extOk = env.upload.allowedExt.includes(ext);

  // Both must pass: the extension alone is trivially forged, and the browser's
  // mimetype alone lets `payload.php` through with an image content-type.
  if (!mimeOk || !extOk) {
    return cb(
      new ApiError(
        400,
        `Unsupported file type. Allowed: ${env.upload.allowedExt.join(", ")}`,
      ),
    );
  }
  cb(null, true);
}

/**
 * Parser for resources that take form fields but no files.
 *
 * The admin panel posts every form as multipart/form-data, including the CMS
 * lists that have no image. `express.json()` and `express.urlencoded()` cannot
 * read multipart, so without a parser here `req.body` arrives empty and every
 * NOT NULL column is rejected for a value the client did send. Files are
 * refused outright — these resources have nowhere to put one.
 */
function fieldsOnly() {
  return multer({ limits: { fields: 60 } }).none();
}

/** Build an upload middleware targeting one of the whitelisted folders. */
function uploader(folder) {
  return multer({
    storage: storageFor(folder),
    fileFilter,
    limits: {
      fileSize: env.upload.maxSizeBytes,
      files: 12,
      fields: 60,
    },
  });
}

module.exports = { uploader, fieldsOnly, FOLDERS, ensureDir, uniqueFilename };
