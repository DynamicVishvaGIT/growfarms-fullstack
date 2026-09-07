"use strict";

const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/** Read a required variable, failing loudly at boot rather than mysteriously later. */
function required(key, fallback) {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const bool = (v, d = false) =>
  v === undefined ? d : ["1", "true", "yes", "on"].includes(String(v).toLowerCase());

const int = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: (process.env.NODE_ENV || "development") === "production",
  port: int(process.env.PORT, 5000),
  apiPrefix: process.env.API_PREFIX || "/api",
  publicUrl: (process.env.PUBLIC_URL || "http://localhost:5000").replace(/\/+$/, ""),

  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: int(process.env.DB_PORT, 3306),
    name: required("DB_NAME", "growfarms"),
    user: required("DB_USER", "root"),
    password: process.env.DB_PASSWORD || "",
    logging: bool(process.env.DB_LOGGING, false),
    // Create tables a model needs but the database lacks, at boot. Only ever
    // CREATE TABLE — existing tables are never altered or dropped — so a
    // newly deployed model stops meaning a hand-run migration. Off by default:
    // a server should not issue DDL unless someone asked it to.
    autoCreateTables: bool(process.env.DB_AUTO_CREATE, false),
  },

  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  upload: {
    dir: process.env.UPLOAD_DIR || "uploads",
    maxSizeBytes: int(process.env.MAX_UPLOAD_SIZE_MB, 5) * 1024 * 1024,
    allowedMime: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "image/svg+xml",
    ],
    allowedExt: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"],
  },

  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME || "Grow Farms Admin",
    email: process.env.SEED_ADMIN_EMAIL || "admin@growfarms.com",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin@12345",
  },

  rateLimit: {
    windowMs: int(process.env.RATE_LIMIT_WINDOW_MIN, 15) * 60 * 1000,
    max: int(process.env.RATE_LIMIT_MAX, 300),
    loginMax: int(process.env.LOGIN_RATE_LIMIT_MAX, 10),
    enquiryMax: int(process.env.ENQUIRY_RATE_LIMIT_MAX, 20),
  },

  paths: {
    root: path.resolve(__dirname, "../.."),
    uploads: path.resolve(__dirname, "../..", process.env.UPLOAD_DIR || "uploads"),
  },
};

if (env.isProduction && env.jwt.secret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production");
}

module.exports = env;
