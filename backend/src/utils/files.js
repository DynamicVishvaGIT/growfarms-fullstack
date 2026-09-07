"use strict";

const fs = require("fs");
const path = require("path");
const env = require("../config/env");

/**
 * Turn a stored relative path ("uploads/projects/x.png") into the absolute URL
 * the browser should request. Values that are already absolute, or that point
 * at the frontend's own bundled assets, are passed through untouched.
 *
 * The API prefix is part of the URL on purpose. In production the panel and the
 * website are same-origin with the API, and the host only routes `/api/*` to
 * this process — a bare `/uploads/...` lands on the static site instead and
 * comes back as the SPA's index.html, so every image would render broken.
 * Serving them under the prefix means images ride the one route that is known
 * to reach us, on any host, with no extra proxy rule. app.js mounts the same
 * folder at both paths, so URLs handed out before this change still resolve.
 */
function toPublicUrl(storedPath) {
  if (!storedPath) return null;
  if (/^https?:\/\//i.test(storedPath)) return storedPath;
  const clean = String(storedPath).replace(/^\/+/, "");
  return `${env.publicUrl}${env.apiPrefix}/${clean}`;
}

/** Map over an object's image-ish fields, converting each to a public URL. */
function withUrls(plain, fields = ["image", "image_path", "hero_image", "map_image", "featured_image", "banner_image", "icon_image", "avatar", "thumbnail", "logo"]) {
  if (!plain || typeof plain !== "object") return plain;
  const out = { ...plain };
  for (const f of fields) {
    if (f in out && typeof out[f] === "string") out[`${f}_url`] = toPublicUrl(out[f]);
  }
  return out;
}

/**
 * Delete an uploaded file, refusing anything that resolves outside the upload
 * root and never touching the seed folder (those files back the original
 * frontend design and must survive admin edits).
 */
function deleteUpload(storedPath) {
  if (!storedPath || /^https?:\/\//i.test(storedPath)) return false;

  const clean = String(storedPath).replace(/^\/+/, "");
  if (!clean.startsWith(`${env.upload.dir}/`)) return false;

  const relative = clean.slice(env.upload.dir.length + 1);
  if (relative.startsWith("seed/")) return false;

  const abs = path.resolve(env.paths.uploads, relative);
  if (!abs.startsWith(path.resolve(env.paths.uploads) + path.sep)) return false;

  try {
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
      return true;
    }
  } catch (err) {
    console.warn(`[files] could not delete ${abs}: ${err.message}`);
  }
  return false;
}

/** Relative path we persist for a freshly uploaded multer file. */
function storedPathFor(file) {
  if (!file) return null;
  const folder = path.basename(path.dirname(file.path));
  return `${env.upload.dir}/${folder}/${file.filename}`;
}

module.exports = { toPublicUrl, withUrls, deleteUpload, storedPathFor };
