"use strict";

const express = require("express");
const rateLimit = require("express-rate-limit");

const env = require("../config/env");
const { uploader, fieldsOnly } = require("../config/multer");
const { requireAuth, requireRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const asyncHandler = require("../middleware/asyncHandler");

const V = require("../validators");

const authController = require("../controllers/authController");
const dashboardController = require("../controllers/dashboardController");
const projectController = require("../controllers/projectController");
const packageController = require("../controllers/packageController");
const categoryController = require("../controllers/categoryController");
const blogController = require("../controllers/blogController");
const enquiryController = require("../controllers/enquiryController");
const contentController = require("../controllers/contentController");
const settingController = require("../controllers/settingController");
const cms = require("../controllers/cmsControllers");

const router = express.Router();

/* ── Rate limiters ───────────────────────────────────────────────────────── */

const loginLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.loginMax,
  message: { success: false, message: "Too many sign-in attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const enquiryLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.enquiryMax,
  message: {
    success: false,
    message: "Too many enquiries from this address. Please try again shortly.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ── Uploaders ───────────────────────────────────────────────────────────── */

const projectUpload = uploader("projects");
const packageUpload = uploader("packages");
const blogUpload = uploader("blogs");
const miscUpload = uploader("misc");
const amenityUpload = uploader("amenities");
const facilityUpload = uploader("facilities");

/**
 * Attach `req.admin` when a valid token is present, but never reject.
 *
 * Public list endpoints use this so an admin previewing the site sees drafts
 * and inactive rows, while an anonymous visitor sees only published content.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  if (!req.headers.authorization) return next();
  return requireAuth(req, res, (err) => next(err && err.status === 401 ? null : err));
});

/* ══ Health ══════════════════════════════════════════════════════════════ */

router.get("/health", (req, res) =>
  res.json({ success: true, data: { status: "ok", time: new Date().toISOString() } }),
);

/* ══ Auth ════════════════════════════════════════════════════════════════ */

router.post("/auth/login", loginLimiter, V.loginRules, validate, authController.login);
router.post("/auth/logout", requireAuth, authController.logout);
router.get("/auth/me", requireAuth, authController.me);
router.put(
  "/auth/profile",
  requireAuth,
  miscUpload.single("avatar"),
  V.profileRules,
  validate,
  authController.updateProfile,
);
router.put(
  "/auth/password",
  requireAuth,
  V.passwordRules,
  validate,
  authController.changePassword,
);

/* ══ Dashboard ═══════════════════════════════════════════════════════════ */

router.get("/dashboard/stats", requireAuth, dashboardController.stats);
router.get("/dashboard/recent-enquiries", requireAuth, dashboardController.recentEnquiries);
router.get("/dashboard/enquiry-trend", requireAuth, dashboardController.enquiryTrend);

/* ══ Projects (properties) ═══════════════════════════════════════════════ */

// Static segments must be declared before the /:idOrSlug catch-all.
router.get("/projects/map", projectController.mapPins);
router.get("/projects/featured", projectController.featured);
router.get("/projects", optionalAuth, V.paginationRules, validate, projectController.list);
router.get("/projects/:idOrSlug", optionalAuth, projectController.getOne);

router.post(
  "/projects",
  requireAuth,
  projectUpload.fields([
    { name: "hero_image", maxCount: 1 },
    { name: "map_image", maxCount: 1 },
    { name: "about_image", maxCount: 1 },
    { name: "about_image_2", maxCount: 1 },
    { name: "about_image_3", maxCount: 1 },
    { name: "about_image_4", maxCount: 1 },
    { name: "invest_image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  V.projectRules,
  validate,
  projectController.create,
);

router.put(
  "/projects/:id",
  requireAuth,
  projectUpload.fields([
    { name: "hero_image", maxCount: 1 },
    { name: "map_image", maxCount: 1 },
    { name: "about_image", maxCount: 1 },
    { name: "about_image_2", maxCount: 1 },
    { name: "about_image_3", maxCount: 1 },
    { name: "about_image_4", maxCount: 1 },
    { name: "invest_image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  V.idParam,
  V.projectRules,
  validate,
  projectController.update,
);

router.delete(
  "/projects/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  V.idParam,
  validate,
  projectController.remove,
);

router.post(
  "/projects/:id/images",
  requireAuth,
  projectUpload.array("images", 10),
  projectController.addImages,
);
router.delete("/projects/:id/images/:imageId", requireAuth, projectController.removeImage);
router.put(
  "/projects/:id/images/:imageId/primary",
  requireAuth,
  projectController.setPrimaryImage,
);

/* ══ Packages ════════════════════════════════════════════════════════════ */

router.get("/packages", optionalAuth, V.paginationRules, validate, packageController.list);
router.get("/packages/:idOrSlug", optionalAuth, packageController.getOne);

router.post(
  "/packages",
  requireAuth,
  packageUpload.array("images", 10),
  V.packageRules,
  validate,
  packageController.create,
);
router.put(
  "/packages/:id",
  requireAuth,
  packageUpload.array("images", 10),
  V.idParam,
  V.packageRules,
  validate,
  packageController.update,
);
router.delete(
  "/packages/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  V.idParam,
  validate,
  packageController.remove,
);
router.post(
  "/packages/:id/images",
  requireAuth,
  packageUpload.array("images", 10),
  packageController.addImages,
);
router.delete("/packages/:id/images/:imageId", requireAuth, packageController.removeImage);

/* ══ Categories ══════════════════════════════════════════════════════════ */

router.get("/categories", optionalAuth, categoryController.list);
router.get("/categories/:idOrSlug", optionalAuth, categoryController.getOne);
router.post(
  "/categories",
  requireAuth,
  miscUpload.single("image"),
  V.categoryRules,
  validate,
  categoryController.create,
);
router.put(
  "/categories/:id",
  requireAuth,
  miscUpload.single("image"),
  V.idParam,
  V.categoryRules,
  validate,
  categoryController.update,
);
router.delete(
  "/categories/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  V.idParam,
  validate,
  categoryController.remove,
);

/* ══ Blogs ═══════════════════════════════════════════════════════════════ */

router.get("/blogs", optionalAuth, V.paginationRules, validate, blogController.list);
router.get("/blogs/:idOrSlug", optionalAuth, blogController.getOne);

router.post(
  "/blogs",
  requireAuth,
  blogUpload.fields([
    { name: "featured_image", maxCount: 1 },
    { name: "banner_image", maxCount: 1 },
    { name: "images", maxCount: 12 },
  ]),
  V.blogRules,
  validate,
  blogController.create,
);
router.put(
  "/blogs/:id",
  requireAuth,
  blogUpload.fields([
    { name: "featured_image", maxCount: 1 },
    { name: "banner_image", maxCount: 1 },
    { name: "images", maxCount: 12 },
  ]),
  V.idParam,
  V.blogRules,
  validate,
  blogController.update,
);
router.delete(
  "/blogs/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  V.idParam,
  validate,
  blogController.remove,
);

// The in-article gallery. Uploads ride the form save too; these exist so an
// image can be added or dropped without re-submitting the whole post.
router.post(
  "/blogs/:id/images",
  requireAuth,
  blogUpload.array("images", 12),
  blogController.addImages,
);
router.delete("/blogs/:id/images/:imageId", requireAuth, blogController.removeImage);

/* ══ Enquiries ═══════════════════════════════════════════════════════════ */

// The only public write endpoint in the API.
router.post("/enquiries", enquiryLimiter, V.enquiryRules, validate, enquiryController.submit);

router.get("/enquiries", requireAuth, V.paginationRules, validate, enquiryController.list);
router.get("/enquiries/export", requireAuth, enquiryController.exportCsv);
router.get("/enquiries/:id", requireAuth, V.idParam, validate, enquiryController.getOne);
router.put(
  "/enquiries/:id",
  requireAuth,
  V.idParam,
  V.enquiryUpdateRules,
  validate,
  enquiryController.update,
);
router.delete(
  "/enquiries/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  V.idParam,
  validate,
  enquiryController.remove,
);

/* ══ Website content ═════════════════════════════════════════════════════ */

router.get("/content", optionalAuth, contentController.list);
router.get("/content/:id", optionalAuth, contentController.getOne);
router.post("/content", requireAuth, miscUpload.single("image"), contentController.create);
router.put("/content/bulk", requireAuth, contentController.bulkUpdate);
router.put("/content/:id", requireAuth, miscUpload.single("image"), contentController.update);
router.delete(
  "/content/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  contentController.remove,
);

/* ══ Settings ════════════════════════════════════════════════════════════ */

router.get("/settings", settingController.list);
router.get("/settings/:key", settingController.getOne);
router.post("/settings", requireAuth, requireRole("super_admin", "admin"), settingController.create);
router.put("/settings", requireAuth, settingController.bulkUpdate);
router.put("/settings/:key", requireAuth, miscUpload.single("value"), settingController.update);
router.delete(
  "/settings/:key",
  requireAuth,
  requireRole("super_admin"),
  settingController.remove,
);

/* ══ Simple CMS lists ════════════════════════════════════════════════════ */

/**
 * Mount one factory-built controller as a full resource: a public read, an
 * admin read, and the protected writes.
 */
function mountCms(path, controller, upload) {
  // The admin panel posts every one of these forms as multipart/form-data, so
  // the imageless resources still need a multipart parser — `fieldsOnly` —
  // or req.body arrives empty and the row is rejected for a null the client
  // never sent. /reorder is plain JSON and is mounted before /:id, so it
  // deliberately skips both.
  const parse = upload ? upload.single("image") : fieldsOnly();

  router.get(`/${path}`, controller.listPublic);
  router.get(`/${path}/all`, requireAuth, controller.listAdmin);
  router.get(`/${path}/:id`, requireAuth, controller.getOne);

  router.post(`/${path}`, requireAuth, parse, controller.create);
  router.put(`/${path}/reorder`, requireAuth, controller.reorder);
  router.put(`/${path}/:id`, requireAuth, parse, controller.update);
  router.delete(
    `/${path}/:id`,
    requireAuth,
    requireRole("super_admin", "admin"),
    controller.remove,
  );
}

mountCms("amenities", cms.amenities, amenityUpload);
mountCms("facilities", cms.facilities, facilityUpload);
mountCms("travel-routes", cms.travelRoutes, facilityUpload);
mountCms("buying-steps", cms.buyingSteps, null);
mountCms("why-pali-slides", cms.whyPaliSlides, miscUpload);
mountCms("why-choose-cards", cms.whyChooseCards, miscUpload);
mountCms("philosophy-cards", cms.philosophyCards, null);
mountCms("faqs", cms.faqs, null);
mountCms("testimonials", cms.testimonials, miscUpload);
mountCms("social-links", cms.socialLinks, null);

module.exports = router;
