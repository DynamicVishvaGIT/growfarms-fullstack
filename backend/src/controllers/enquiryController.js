"use strict";

const { Op } = require("sequelize");
const { Enquiry, Project, Package } = require("../models");
const asyncHandler = require("../middleware/asyncHandler");
const ApiError = require("../utils/ApiError");
const { ok, created, noContent, paginated } = require("../utils/respond");
const { getPagination, getOrder } = require("../utils/pagination");

const STATUSES = ["new", "read", "contacted", "closed"];

/**
 * POST /api/enquiries — public.
 *
 * Backs both public forms. The enquiry modal sends `name`; the contact page
 * sends `first_name` / `last_name`. Whichever arrives, we persist all three so
 * the admin list always has a single display name to show.
 */
const submit = asyncHandler(async (req, res) => {
  const b = req.body;

  const firstName = (b.first_name || b.firstName || "").trim();
  const lastName = (b.last_name || b.lastName || "").trim();
  const combined = [firstName, lastName].filter(Boolean).join(" ");
  const name = (b.name || combined).trim();

  if (!name) {
    throw ApiError.badRequest("Please enter your name", { name: "Please enter your name" });
  }

  // Resolve the referenced project by id or slug, but never fail the
  // submission over it — a lead is worth more than a perfect foreign key.
  let projectId = null;
  let subject = (b.subject || "").trim() || null;

  if (b.project_id || b.project_slug) {
    const key = b.project_id || b.project_slug;
    const where = /^\d+$/.test(String(key)) ? { id: Number(key) } : { slug: String(key) };
    const project = await Project.findOne({ where, attributes: ["id", "title"] });
    if (project) {
      projectId = project.id;
      if (!subject) subject = project.title;
    }
  }

  let packageId = null;
  if (b.package_id && /^\d+$/.test(String(b.package_id))) {
    const pkg = await Package.findByPk(Number(b.package_id), { attributes: ["id", "title"] });
    if (pkg) {
      packageId = pkg.id;
      if (!subject) subject = pkg.title;
    }
  }

  const source = ["enquiry_modal", "contact_page", "package", "other"].includes(b.source)
    ? b.source
    : "contact_page";

  const enquiry = await Enquiry.create({
    source,
    name: name.slice(0, 120),
    first_name: firstName ? firstName.slice(0, 60) : null,
    last_name: lastName ? lastName.slice(0, 60) : null,
    email: String(b.email || "").trim().toLowerCase().slice(0, 254),
    phone: String(b.phone || "").trim().slice(0, 30),
    message: b.message ? String(b.message).slice(0, 5000) : null,
    project_id: projectId,
    package_id: packageId,
    subject,
    status: "new",
    ip_address: (req.ip || "").slice(0, 64),
    user_agent: String(req.headers["user-agent"] || "").slice(0, 400),
  });

  // Deliberately minimal: the public form only needs to know it landed.
  return created(res, {
    id: enquiry.id,
    message: "Thank you! Your enquiry has been received.",
  });
});

/* ── Admin ───────────────────────────────────────────────────────────────── */

/** GET /api/enquiries */
const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query, 20);
  const order = getOrder(
    req.query,
    ["created_at", "name", "status"],
    [["created_at", "DESC"]],
  );

  const where = {};
  if (req.query.status && STATUSES.includes(req.query.status)) {
    where.status = req.query.status;
  }
  if (req.query.source) where.source = req.query.source;
  if (req.query.project_id) where.project_id = req.query.project_id;

  if (req.query.from || req.query.to) {
    where.created_at = {};
    if (req.query.from) where.created_at[Op.gte] = new Date(req.query.from);
    if (req.query.to) {
      const to = new Date(req.query.to);
      to.setHours(23, 59, 59, 999);
      where.created_at[Op.lte] = to;
    }
  }

  if (req.query.search) {
    const q = `%${req.query.search}%`;
    where[Op.or] = [
      { name: { [Op.like]: q } },
      { email: { [Op.like]: q } },
      { phone: { [Op.like]: q } },
      { message: { [Op.like]: q } },
      { subject: { [Op.like]: q } },
    ];
  }

  const result = await Enquiry.findAndCountAll({
    where,
    order,
    limit,
    offset,
    include: [
      { association: "project", attributes: ["id", "title", "slug"] },
      { association: "package", attributes: ["id", "title"] },
      { association: "handler", attributes: ["id", "name"] },
    ],
  });

  return paginated(res, result, { page, limit });
});

/** GET /api/enquiries/:id — reading a new enquiry marks it read. */
const getOne = asyncHandler(async (req, res) => {
  const row = await Enquiry.findByPk(req.params.id, {
    include: [
      { association: "project", attributes: ["id", "title", "slug"] },
      { association: "package", attributes: ["id", "title"] },
      { association: "handler", attributes: ["id", "name"] },
    ],
  });
  if (!row) throw ApiError.notFound("Enquiry not found");

  if (row.status === "new") {
    row.status = "read";
    row.handled_by = req.admin.id;
    await row.save();
  }

  return ok(res, row);
});

/** PUT /api/enquiries/:id */
const update = asyncHandler(async (req, res) => {
  const row = await Enquiry.findByPk(req.params.id);
  if (!row) throw ApiError.notFound("Enquiry not found");

  const payload = {};

  if (req.body.status !== undefined) {
    if (!STATUSES.includes(req.body.status)) {
      throw ApiError.badRequest(`Status must be one of: ${STATUSES.join(", ")}`, {
        status: "Invalid status",
      });
    }
    payload.status = req.body.status;
    payload.handled_by = req.admin.id;
  }

  if (req.body.admin_notes !== undefined) {
    payload.admin_notes = req.body.admin_notes ? String(req.body.admin_notes).slice(0, 5000) : null;
  }

  await row.update(payload);

  const full = await Enquiry.findByPk(row.id, {
    include: [
      { association: "project", attributes: ["id", "title", "slug"] },
      { association: "handler", attributes: ["id", "name"] },
    ],
  });
  return ok(res, full);
});

/** DELETE /api/enquiries/:id */
const remove = asyncHandler(async (req, res) => {
  const row = await Enquiry.findByPk(req.params.id);
  if (!row) throw ApiError.notFound("Enquiry not found");
  await row.destroy();
  return noContent(res);
});

/** GET /api/enquiries/export — CSV of the current filter for offline follow-up. */
const exportCsv = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.status && STATUSES.includes(req.query.status)) where.status = req.query.status;

  const rows = await Enquiry.findAll({
    where,
    order: [["created_at", "DESC"]],
    limit: 5000,
    include: [{ association: "project", attributes: ["title"] }],
  });

  // Prefix formula characters so a spreadsheet treats every cell as text.
  const cell = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const header = [
    "ID", "Date", "Source", "Name", "Email", "Phone",
    "Project", "Subject", "Status", "Message", "Notes",
  ];

  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.created_at,
        r.source,
        r.name,
        r.email,
        r.phone,
        r.project ? r.project.title : "",
        r.subject,
        r.status,
        r.message,
        r.admin_notes,
      ]
        .map(cell)
        .join(","),
    );
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="enquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
  );
  return res.send(`﻿${lines.join("\r\n")}`);
});

module.exports = { submit, list, getOne, update, remove, exportCsv };
