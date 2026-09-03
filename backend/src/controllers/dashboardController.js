"use strict";

const { Op, fn, col, literal } = require("sequelize");
const {
  Project, Package, Category, Enquiry, Blog, Testimonial, Faq, sequelize,
} = require("../models");
const asyncHandler = require("../middleware/asyncHandler");
const { ok } = require("../utils/respond");

/** GET /api/dashboard/stats */
const stats = asyncHandler(async (req, res) => {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalProjects,
    activeProjects,
    totalPackages,
    activePackages,
    totalCategories,
    totalEnquiries,
    newEnquiries,
    readEnquiries,
    contactedEnquiries,
    closedEnquiries,
    enquiriesLast30,
    totalBlogs,
    publishedBlogs,
    totalTestimonials,
    totalFaqs,
  ] = await Promise.all([
    Project.count(),
    Project.count({ where: { status: "active" } }),
    Package.count(),
    Package.count({ where: { status: "active" } }),
    Category.count(),
    Enquiry.count(),
    Enquiry.count({ where: { status: "new" } }),
    Enquiry.count({ where: { status: "read" } }),
    Enquiry.count({ where: { status: "contacted" } }),
    Enquiry.count({ where: { status: "closed" } }),
    Enquiry.count({ where: { created_at: { [Op.gte]: since30 } } }),
    Blog.count(),
    Blog.count({ where: { status: "published" } }),
    Testimonial.count({ where: { is_active: true } }),
    Faq.count({ where: { is_active: true } }),
  ]);

  return ok(res, {
    properties: {
      total: totalProjects,
      active: activeProjects,
      inactive: totalProjects - activeProjects,
    },
    packages: { total: totalPackages, active: activePackages },
    categories: { total: totalCategories },
    enquiries: {
      total: totalEnquiries,
      new: newEnquiries,
      read: readEnquiries,
      contacted: contactedEnquiries,
      closed: closedEnquiries,
      last_30_days: enquiriesLast30,
    },
    blogs: { total: totalBlogs, published: publishedBlogs },
    testimonials: { total: totalTestimonials },
    faqs: { total: totalFaqs },
  });
});

/** GET /api/dashboard/recent-enquiries */
const recentEnquiries = asyncHandler(async (req, res) => {
  const rows = await Enquiry.findAll({
    order: [["created_at", "DESC"]],
    limit: 8,
    include: [{ association: "project", attributes: ["id", "title", "slug"] }],
  });
  return ok(res, rows);
});

/**
 * GET /api/dashboard/enquiry-trend — enquiries per day for the last 14 days,
 * zero-filled so the chart has no gaps.
 */
const enquiryTrend = asyncHandler(async (req, res) => {
  const days = 14;
  const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const rows = await Enquiry.findAll({
    attributes: [
      [fn("DATE", col("created_at")), "day"],
      [fn("COUNT", col("id")), "count"],
    ],
    where: { created_at: { [Op.gte]: since } },
    group: [literal("DATE(created_at)")],
    order: [[literal("DATE(created_at)"), "ASC"]],
    raw: true,
  });

  const counts = new Map(rows.map((r) => [String(r.day), Number(r.count)]));
  const series = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, count: counts.get(key) || 0 });
  }

  return ok(res, series);
});

module.exports = { stats, recentEnquiries, enquiryTrend };
