"use strict";

const { Admin } = require("../models");
const asyncHandler = require("../middleware/asyncHandler");
const ApiError = require("../utils/ApiError");
const { ok } = require("../utils/respond");
const { signAdminToken, publicAdmin } = require("../services/tokenService");
const { deleteUpload, storedPathFor } = require("../utils/files");

/** POST /api/auth/login */
const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  const admin = await Admin.scope("withPassword").findOne({ where: { email } });

  // Same message and roughly the same work either way, so the response can't
  // be used to enumerate which email addresses have accounts.
  const valid = admin ? await admin.verifyPassword(password) : false;
  if (!admin || !valid) throw ApiError.unauthorized("Invalid email or password");

  if (!admin.is_active) throw ApiError.forbidden("This account has been deactivated");

  admin.last_login_at = new Date();
  await admin.save();

  return ok(res, { token: signAdminToken(admin), admin: publicAdmin(admin) });
});

/** GET /api/auth/me */
const me = asyncHandler(async (req, res) => ok(res, { admin: publicAdmin(req.admin) }));

/** PUT /api/auth/profile */
const updateProfile = asyncHandler(async (req, res) => {
  const admin = req.admin;
  const { name, email, phone } = req.body;

  if (email && email.toLowerCase() !== admin.email) {
    const clash = await Admin.findOne({ where: { email: email.toLowerCase() } });
    if (clash) throw ApiError.conflict("That email address is already in use");
    admin.email = email;
  }

  if (name !== undefined) admin.name = name;
  if (phone !== undefined) admin.phone = phone || null;

  if (req.file) {
    const previous = admin.avatar;
    admin.avatar = storedPathFor(req.file);
    await admin.save();
    deleteUpload(previous);
    return ok(res, { admin: publicAdmin(admin) });
  }

  await admin.save();
  return ok(res, { admin: publicAdmin(admin) });
});

/** PUT /api/auth/password */
const changePassword = asyncHandler(async (req, res) => {
  const { current_password: current, new_password: next } = req.body;

  const admin = await Admin.scope("withPassword").findByPk(req.admin.id);
  const valid = await admin.verifyPassword(String(current || ""));
  if (!valid) throw ApiError.badRequest("Your current password is incorrect", {
    current_password: "Current password is incorrect",
  });

  await admin.setPassword(next);
  await admin.save();

  // A fresh token so any session that knew the old password is not extended.
  return ok(res, { token: signAdminToken(admin), message: "Password updated" });
});

/** POST /api/auth/logout — stateless JWT, so this just acknowledges. */
const logout = asyncHandler(async (req, res) =>
  ok(res, { message: "Signed out. Please discard your token." }),
);

module.exports = { login, me, updateProfile, changePassword, logout };
