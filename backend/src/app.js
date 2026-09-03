"use strict";

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Behind nginx/Apache in production, so req.ip reflects the real client.
if (env.isProduction) app.set("trust proxy", 1);

app.disable("x-powered-by");

/* ── Security headers ────────────────────────────────────────────────────── */

app.use(
  helmet({
    // The API serves JSON plus images consumed by a different origin; the
    // default CORP/COEP headers would block the frontend from loading them.
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }),
);

/* ── CORS ────────────────────────────────────────────────────────────────── */

const corsOptions = {
  origin(origin, callback) {
    // No Origin header: same-origin, curl, or a server-to-server call.
    if (!origin) return callback(null, true);
    if (env.corsOrigins.includes(origin)) return callback(null, true);

    // In development, allow any localhost port so a second Vite instance
    // (the admin panel) does not need a config change to talk to the API.
    if (!env.isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Disposition"],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ── Body parsing ────────────────────────────────────────────────────────── */

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(compression());

if (!env.isProduction) app.use(morgan("dev"));
else app.use(morgan("combined"));

/* ── Global rate limit ───────────────────────────────────────────────────── */

app.use(
  rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please slow down." },
    // Static uploads are cheap and hit hard by image-heavy pages.
    skip: (req) => req.path.startsWith(`/${env.upload.dir}/`),
  }),
);

/* ── Static uploads ──────────────────────────────────────────────────────── */

app.use(
  `/${env.upload.dir}`,
  express.static(env.paths.uploads, {
    maxAge: env.isProduction ? "30d" : 0,
    etag: true,
    index: false,
    // Uploaded files are content, never code: force the browser to download
    // rather than execute anything that slipped past the mime filter.
    setHeaders(res, filePath) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      if (path.extname(filePath).toLowerCase() === ".svg") {
        res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'");
      }
    },
  }),
);

/* ── API ─────────────────────────────────────────────────────────────────── */

app.get("/", (req, res) =>
  res.json({
    success: true,
    data: {
      name: "Grow Farms API",
      version: "1.0.0",
      docs: `${env.apiPrefix}/health`,
    },
  }),
);

app.use(env.apiPrefix, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
