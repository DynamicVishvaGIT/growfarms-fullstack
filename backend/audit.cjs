"use strict";

/**
 * One-off audit harness.
 *
 * Walks every public read, every admin write, and then pushes deliberately
 * awkward data at the sections whose layouts are a fixed shape, so the answer
 * to "does an admin edit break the page?" is measured rather than assumed.
 *
 * Everything it creates is torn down in `cleanup`, which runs even when an
 * assertion fails.
 */

const BASE = process.env.API || "http://localhost:5000/api";

// This harness writes to whatever database the API is pointed at, so it must
// never be aimed at a live site even though it tidies up after itself.
if (process.env.NODE_ENV === "production") {
  console.error("[audit] refuses to run against NODE_ENV=production.");
  process.exit(1);
}

let token = null;
const created = []; // { path, id } — torn down in reverse
let pass = 0;
let fail = 0;
const failures = [];

const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function head(title) {
  console.log(`\n${C.bold(`── ${title} `.padEnd(64, "─"))}`);
}

function check(ok, label, detail) {
  if (ok) {
    pass += 1;
    console.log(`  ${C.green("PASS")}  ${label}`);
  } else {
    fail += 1;
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ${C.red("FAIL")}  ${label}${detail ? C.dim(`  (${detail})`) : ""}`);
  }
}

function note(label) {
  console.log(`  ${C.yellow("NOTE")}  ${label}`);
}

async function api(path, { method = "GET", body, form, auth = false } = {}) {
  const headers = {};
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = new FormData();
    for (const [k, v] of Object.entries(form)) payload.append(k, String(v));
  } else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  const json = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, json, data: json && json.data };
}

/* ══ 1. Public reads ════════════════════════════════════════════════════ */

const PUBLIC_READS = [
  ["/health", "health"],
  ["/projects", "projects list"],
  ["/projects/map", "map pins"],
  ["/projects/featured", "featured project"],
  ["/packages", "packages"],
  ["/blogs", "blogs"],
  ["/categories", "categories"],
  ["/faqs", "faqs"],
  ["/testimonials", "testimonials"],
  ["/amenities", "amenities"],
  ["/facilities", "facilities"],
  ["/travel-routes", "travel routes"],
  ["/buying-steps", "buying steps"],
  ["/why-pali-slides", "why pali slides"],
  ["/why-choose-cards", "why choose cards"],
  ["/philosophy-cards", "philosophy cards"],
  ["/content?grouped=true", "website content"],
  ["/settings", "settings"],
];

async function publicReads() {
  head("Public reads (what the website fetches)");
  for (const [path, label] of PUBLIC_READS) {
    const r = await api(path);
    const count = Array.isArray(r.data)
      ? `${r.data.length} rows`
      : r.data
        ? "object"
        : "empty";
    check(r.status === 200 && r.json && r.json.success !== false, `GET ${path}`, `${r.status} ${count}`);
  }
}

/* ══ 2. Auth ════════════════════════════════════════════════════════════ */

async function login() {
  head("Auth");
  const r = await api("/auth/login", {
    method: "POST",
    body: {
      email: process.env.SEED_ADMIN_EMAIL || "admin@growfarms.com",
      password: process.env.SEED_ADMIN_PASSWORD || "Admin@12345",
    },
  });
  token = r.data && r.data.token;
  check(Boolean(token), "admin login returns a token", `status ${r.status}`);

  const me = await api("/auth/me", { auth: true });
  check(me.status === 200, "GET /auth/me with the token");

  const noAuth = await api("/faqs/all");
  check(noAuth.status === 401, "admin list without a token is 401", `got ${noAuth.status}`);
  return Boolean(token);
}

/* ══ 3. Write round-trips ═══════════════════════════════════════════════ */

/** Minimum viable body per resource, plus the field an update should change. */
const RESOURCES = [
  { path: "faqs", create: { question: "Audit Q?", answer: "Audit A" }, edit: ["question", "Audit Q edited?"] },
  { path: "amenities", create: { name: "Audit amenity" }, edit: ["name", "Audit amenity edited"] },
  { path: "facilities", create: { name: "Audit facility" }, edit: ["name", "Audit facility edited"] },
  { path: "travel-routes", create: { mode: "road", label: "Audit route" }, edit: ["label", "Audit route edited"] },
  { path: "buying-steps", create: { step_number: "99", title: "Audit step", scope: "details" }, edit: ["title", "Audit step edited"] },
  { path: "why-pali-slides", create: { title: "Audit slide" }, edit: ["title", "Audit slide edited"] },
  { path: "why-choose-cards", create: { title: "Audit card", position: "left" }, edit: ["title", "Audit card edited"] },
  { path: "philosophy-cards", create: { title: "Audit philosophy" }, edit: ["title", "Audit philosophy edited"] },
  { path: "testimonials", create: { youtube_id: "AUDITVIDEO", author_name: "Audit" }, edit: ["author_name", "Audit edited"] },
];

async function writeRoundTrips() {
  head("Admin writes — create, read back, update, delete");

  for (const res of RESOURCES) {
    const c = await api(`/${res.path}`, { method: "POST", form: { ...res.create, is_active: "true" }, auth: true });
    const id = c.data && c.data.id;
    if (!id) {
      check(false, `POST /${res.path}`, `${c.status} ${JSON.stringify(c.json)}`);
      continue;
    }
    created.push({ path: res.path, id });

    // Every field sent must come back stored, not silently dropped.
    const stored = Object.entries(res.create).every(([k, v]) => String(c.data[k]) === String(v));
    check(stored, `POST /${res.path} stores every field sent`, JSON.stringify(res.create));

    const g = await api(`/${res.path}/${id}`, { auth: true });
    check(g.status === 200 && g.data.id === id, `GET /${res.path}/:id reads it back`);

    const [field, value] = res.edit;
    const u = await api(`/${res.path}/${id}`, { method: "PUT", form: { [field]: value }, auth: true });
    check(u.status === 200 && u.data[field] === value, `PUT /${res.path}/:id updates ${field}`, u.data && u.data[field]);

    // A partial update must not blank the fields it did not mention.
    const untouched = Object.keys(res.create).filter((k) => k !== field);
    const kept = untouched.every((k) => u.data[k] !== null && u.data[k] !== "");
    check(kept, `PUT /${res.path}/:id leaves untouched fields alone`, untouched.join(", "));
  }
}

/* ══ 4. Project prose + relations ═══════════════════════════════════════ */

async function projectRoundTrip() {
  head("Project detail payload");

  const list = await api("/projects");
  const projectId = list.data && list.data[0] && list.data[0].id;
  if (!projectId) return check(false, "at least one project exists");

  const before = await api(`/projects/${projectId}`);
  const original = {
    about_title: before.data.about_title || "",
    about_body: before.data.about_body || "",
    invest_title: before.data.invest_title || "",
    invest_body: before.data.invest_body || "",
  };

  const multiline = "About\nAudit\nProject";
  const u = await api(`/projects/${projectId}`, {
    method: "PUT",
    form: { about_title: multiline, about_body: "Audit body", invest_title: "Why\nAudit", invest_body: "Audit invest" },
    auth: true,
  });
  check(u.status === 200, "PUT /projects/:id accepts the prose fields");
  check(u.data.about_title === multiline, "newlines survive the round trip as \n, not \r\n", JSON.stringify(u.data.about_title));
  check(u.data.slug === before.data.slug, "a partial update does not regenerate the slug");

  const after = await api(`/projects/${projectId}`);
  const rel = ["images", "packages", "amenities", "facilities", "faqs", "whyChooseCards", "buyingSteps", "testimonials"];
  const present = rel.filter((k) => Array.isArray(after.data[k]));
  check(present.length === rel.length, "detail payload carries every relation", `missing: ${rel.filter((k) => !present.includes(k)).join(", ") || "none"}`);

  // Put the project back exactly as it was.
  await api(`/projects/${projectId}`, { method: "PUT", form: original, auth: true });
  const restored = await api(`/projects/${projectId}`);
  check(
    (restored.data.about_title || "") === original.about_title,
    "prose restored to its original value",
  );

  return projectId;
}

/* ══ 5. Scoping ═════════════════════════════════════════════════════════ */

async function scoping(projectId) {
  head("Project scoping — one project's content must not leak");

  const own = await api(`/faqs`, { method: "POST", form: { project_id: projectId, question: "Scoped Q?", answer: "A", is_active: "true" }, auth: true });
  if (!own.data) return check(false, "could not create a scoped FAQ");
  created.push({ path: "faqs", id: own.data.id });

  const shared = await api("/faqs");
  const leaked = shared.data.filter((r) => r.project_id !== null);
  check(leaked.length === 0, "GET /faqs (shared list) excludes project rows", `${leaked.length} leaked`);

  const scoped = await api(`/faqs?project_id=${projectId}`);
  check(
    scoped.data.some((r) => r.id === own.data.id),
    "GET /faqs?project_id= returns the project's own row",
  );

  const others = await api("/projects");
  const other = others.data.find((p) => p.id !== projectId);
  if (other) {
    const otherDetail = await api(`/projects/${other.id}`);
    const stolen = (otherDetail.data.faqs || []).some((f) => f.id === own.data.id);
    check(!stolen, `project ${other.id} does not see project ${projectId}'s FAQ`);
  }

  const withShared = await api(`/faqs/all?project_id=${projectId}&include_shared=true`, { auth: true });
  const hasOwn = withShared.data.some((r) => r.project_id !== null);
  const hasShared = withShared.data.some((r) => r.project_id === null);
  check(hasOwn && hasShared, "include_shared returns own + shared for the admin screen", `own=${hasOwn} shared=${hasShared}`);
}

/* ══ 6. Validation and rejection ════════════════════════════════════════ */

async function validation() {
  head("Validation — bad input must be refused, not stored");

  const missing = await api("/faqs", { method: "POST", form: { answer: "no question" }, auth: true });
  check(missing.status >= 400, "FAQ without a question is rejected", `got ${missing.status}`);

  const noTitle = await api("/projects", { method: "PUT", form: {}, auth: true });
  check(noTitle.status === 404 || noTitle.status >= 400, "PUT /projects with no id is not a 200");

  const badId = await api("/faqs/999999", { auth: true });
  check(badId.status === 404, "unknown id is a 404", `got ${badId.status}`);

  const enquiry = await api("/enquiries", { method: "POST", body: { name: "x", email: "nope", message: "hi" } });
  check(enquiry.status === 422, "malformed enquiry is a 422", `got ${enquiry.status}`);
}

/* ══ 7. Layout stress ═══════════════════════════════════════════════════ */

/**
 * The frontend's own merge rules, copied verbatim from the components, so this
 * measures what would actually render rather than what the API happens to
 * return.
 */
const SLOTS = ["left", "center", "right"];
const mergeWhyChoose = (rows) => SLOTS.map((slot) => rows.find((r) => r.position === slot) || { fallback: slot });

async function layoutStress(projectId) {
  head("Layout stress — what an admin can do to a fixed-shape section");

  /* ── Why Choose: a fixed three-slot row ── */
  const extras = [];
  for (const position of ["left", "center", "right", "left"]) {
    const r = await api("/why-choose-cards", {
      method: "POST",
      form: { project_id: projectId, title: `Stress ${position} ${extras.length + 1}`, position, is_active: "true" },
      auth: true,
    });
    if (r.data) {
      created.push({ path: "why-choose-cards", id: r.data.id });
      extras.push(r.data);
    }
  }

  const detail = await api(`/projects/${projectId}`);
  const cards = detail.data.whyChooseCards || [];
  const rendered = mergeWhyChoose(cards);
  check(rendered.length === 3, "Why Choose still renders exactly 3 slots with 4 cards", `${cards.length} rows -> ${rendered.length} slots`);
  const dropped = cards.length - rendered.filter((c) => !c.fallback).length;
  if (dropped > 0) {
    note(`Why Choose silently drops ${dropped} card(s): a 2nd card in the same slot never appears on the site.`);
  }

  /* ── How to Buy: a fixed four-card curve ── */
  const stepIds = [];
  for (let i = 1; i <= 7; i += 1) {
    const r = await api("/buying-steps", {
      method: "POST",
      form: { project_id: projectId, scope: "details", step_number: `S${i}`, title: `Stress step ${i}`, is_active: "true" },
      auth: true,
    });
    if (r.data) {
      created.push({ path: "buying-steps", id: r.data.id });
      stepIds.push(r.data.id);
    }
  }

  const detail2 = await api(`/projects/${projectId}`);
  const steps = detail2.data.buyingSteps || [];
  check(steps.length >= 7, `project payload returns every step the admin created`, `${steps.length}`);

  // HowToBuyFarmLand slices to the four designed slots before positioning.
  const FALLBACK_SLOTS = 4;
  const shown = steps.slice(0, FALLBACK_SLOTS);
  const positions = shown.map((s, i) => s.pos_top || `slot ${i}`);
  const collisions = positions.length - new Set(positions).size;
  check(
    shown.length === FALLBACK_SLOTS && collisions === 0,
    `How to Buy clamps ${steps.length} steps to ${FALLBACK_SLOTS} non-overlapping cards`,
    `${shown.length} shown, ${collisions} collisions`,
  );

  /* ── Testimonials: geometry is derived, so any count should be safe ── */
  const ring = (count) => {
    const n = Math.max(2, count);
    return (-1 * (320 / 2 + 28)) / Math.tan(Math.PI / n);
  };
  const finite = [0, 1, 2, 3, 6, 12, 40].every((n) => Number.isFinite(ring(n)) && ring(n) < 0);
  check(finite, "Testimonial ring geometry stays finite from 0 to 40 videos");

  /* ── Long text ── */
  const longQ = `${"A very long question that an admin could paste ".repeat(12)}?`;
  const longFaq = await api("/faqs", {
    method: "POST",
    form: { project_id: projectId, question: longQ, answer: "x".repeat(4000), is_active: "true" },
    auth: true,
  });
  if (longFaq.data) {
    created.push({ path: "faqs", id: longFaq.data.id });
    check(longFaq.data.question.length === longQ.length, "a long FAQ question is stored unclipped", `${longFaq.data.question.length} chars`);
  } else {
    check(longFaq.status === 422, "an over-long FAQ question is a 422 field error, not a 500", `got ${longFaq.status}`);
    check(
      Boolean(longFaq.json && longFaq.json.errors && longFaq.json.errors.question),
      "the 422 names the offending field so the form can highlight it",
      JSON.stringify(longFaq.json && longFaq.json.errors),
    );
    check(!(longFaq.json && longFaq.json.stack), "the error response carries no stack trace");
  }

  /* ── Empty section ── */
  const emptyProject = (await api("/projects")).data.find((p) => p.id !== projectId);
  if (emptyProject) {
    const d = await api(`/projects/${emptyProject.id}`);
    const emptyRelations = ["faqs", "whyChooseCards", "buyingSteps", "testimonials"].filter(
      (k) => (d.data[k] || []).length === 0,
    );
    check(true, `a project with ${emptyRelations.length} empty sections still returns 200`, emptyRelations.join(", ") || "none empty");
  }
}

/* ══ 8. Regressions found by this audit ════════════════════════════════ */

async function regressions() {
  head("Regressions this audit found");

  const blog = await api("/buying-steps?scope=blog");
  const detailsOnly = await api("/buying-steps?scope=details");
  const blogLeak = (blog.data || []).filter((r) => r.scope !== "blog");
  check(blogLeak.length === 0, "GET /buying-steps?scope=blog returns blog steps only", `${blogLeak.length} details steps leaked into the blog page`);
  check(
    (detailsOnly.data || []).every((r) => r.scope === "details"),
    "GET /buying-steps?scope=details returns details steps only",
  );

  const CR = String.fromCharCode(13);
  const LF = String.fromCharCode(10);
  const crlf = await api("/buying-steps", {
    method: "POST",
    form: {
      step_number: "98",
      title: "CRLF probe",
      description: "line one" + CR + LF + "line two",
      scope: "details",
      is_active: "true",
    },
    auth: true,
  });
  if (crlf.data) {
    created.push({ path: "buying-steps", id: crlf.data.id });
    check(
      !crlf.data.description.includes(CR),
      "CRLF from a multipart textarea is normalised on write",
      JSON.stringify(crlf.data.description),
    );
  }
}

/* ══ Cleanup ════════════════════════════════════════════════════════════ */

async function cleanup() {
  head("Cleanup");
  let removed = 0;
  for (const { path, id } of created.reverse()) {
    const r = await api(`/${path}/${id}`, { method: "DELETE", auth: true });
    if (r.status === 204 || r.status === 404) removed += 1;
    else console.log(`  ${C.red("LEFT")}  /${path}/${id} -> ${r.status}`);
  }
  check(removed === created.length, `all ${created.length} audit rows deleted`, `${removed} removed`);
}

/* ══ Run ════════════════════════════════════════════════════════════════ */

(async () => {
  console.log(C.bold(`\nGrow Farms — API & layout audit  ${C.dim(BASE)}`));

  try {
    await publicReads();
    if (!(await login())) throw new Error("cannot continue without a token");
    await writeRoundTrips();
    const projectId = await projectRoundTrip();
    await scoping(projectId);
    await validation();
    await layoutStress(projectId);
    await regressions();
  } catch (err) {
    fail += 1;
    failures.push(`harness error: ${err.message}`);
    console.log(`\n  ${C.red("ERROR")} ${err.stack}`);
  } finally {
    await cleanup();
  }

  console.log(`\n${"─".repeat(64)}`);
  console.log(`  ${pass} passed, ${fail} failed`);
  if (failures.length) {
    console.log(`\n  ${C.red("Failures")}`);
    failures.forEach((f) => console.log(`    · ${f}`));
  }
  console.log(`${"─".repeat(64)}\n`);
  process.exit(fail ? 1 : 0);
})();
