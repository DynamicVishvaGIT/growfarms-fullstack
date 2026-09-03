"use strict";

const jwt = require("jsonwebtoken");
const env = require("../config/env");

/** Issue an access token for an admin row. */
function signAdminToken(admin) {
  return jwt.sign(
    { sub: admin.id, email: admin.email, role: admin.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn, issuer: "growfarms-api" },
  );
}

/** The admin shape safe to hand back to the client. */
function publicAdmin(admin) {
  const { toPublicUrl } = require("../utils/files");
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    phone: admin.phone,
    avatar: admin.avatar,
    avatar_url: toPublicUrl(admin.avatar),
    is_active: admin.is_active,
    last_login_at: admin.last_login_at,
  };
}

module.exports = { signAdminToken, publicAdmin };
