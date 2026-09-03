"use strict";

/**
 * Route-level smoke test that does not need MySQL.
 *
 * Boots the real Express app and drives it over HTTP, checking the parts that
 * are independent of the database: routing, CORS, JWT enforcement, validation,
 * error shape and the static uploads mount. Anything that would touch the DB is
 * expected to fail at the connection, which is itself a useful signal that the
 * request reached the controller.
 *
 *   node smoke.test.cjs
 */

const app = require("./src/app");
const env = require("./src/config/env");

let pass = 0;
let fail = 0;

function check(name, condition, detail) {
  if (condition) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${name}${detail ? `  → ${detail}` : ""}`);
  }
}

async function main() {
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (path, options = {}) => {
    const res = await fetch(base + path, options);
    let body = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON response */
    }
    return { status: res.status, body, headers: res.headers };
  };

  console.log("\n── Health & routing ─────────────────────────────────────────");

  let r = await call("/api/health");
  check("GET /api/health returns 200", r.status === 200, `got ${r.status}`);
  check("health payload uses the success envelope", r.body?.success === true);
  check("health reports ok", r.body?.data?.status === "ok");

  r = await call("/");
  check("GET / returns the API banner", r.status === 200 && r.body?.data?.name === "Grow Farms API");

  r = await call("/api/does-not-exist");
  check("unknown route returns 404", r.status === 404, `got ${r.status}`);
  check("404 uses the error envelope", r.body?.success === false && typeof r.body?.message === "string");

  console.log("\n── JWT protection ───────────────────────────────────────────");

  const protectedRoutes = [
    ["GET", "/api/dashboard/stats"],
    ["GET", "/api/enquiries"],
    ["POST", "/api/projects"],
    ["PUT", "/api/projects/1"],
    ["DELETE", "/api/projects/1"],
    ["POST", "/api/packages"],
    ["DELETE", "/api/blogs/1"],
    ["GET", "/api/amenities/all"],
    ["PUT", "/api/content/1"],
    ["PUT", "/api/settings"],
    ["GET", "/api/auth/me"],
  ];

  for (const [method, path] of protectedRoutes) {
    const res = await call(path, { method });
    check(`${method} ${path} rejects anonymous access`, res.status === 401, `got ${res.status}`);
  }

  r = await call("/api/dashboard/stats", {
    headers: { Authorization: "Bearer not-a-real-token" },
  });
  check("a forged token is rejected", r.status === 401, `got ${r.status}`);
  check("forged token message is explanatory", /invalid|expired/i.test(r.body?.message || ""));

  console.log("\n── Public enquiry validation ────────────────────────────────");

  const post = (payload) =>
    call("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

  r = await post({});
  check("empty enquiry is rejected with 422", r.status === 422, `got ${r.status}`);
  check("validation returns field-keyed errors", r.body?.errors && typeof r.body.errors === "object");
  check("missing email is reported", Boolean(r.body?.errors?.email));
  check("missing phone is reported", Boolean(r.body?.errors?.phone));

  r = await post({ name: "Asha Rao", email: "not-an-email", phone: "9876543210" });
  check("bad email is rejected", r.status === 422 && Boolean(r.body?.errors?.email));

  r = await post({ name: "Asha Rao", email: "asha@example.com", phone: "123" });
  check("short phone is rejected", r.status === 422 && Boolean(r.body?.errors?.phone));

  r = await post({ name: "A", email: "asha@example.com", phone: "9876543210" });
  check("one-character name is rejected", r.status === 422 && Boolean(r.body?.errors?.name));

  r = await post({ name: "Asha9Rao", email: "asha@example.com", phone: "9876543210" });
  check("name with digits is rejected", r.status === 422 && Boolean(r.body?.errors?.name));

  r = await post({
    name: "Asha Rao",
    email: "asha@example.com",
    phone: "9876543210",
    message: "short",
  });
  check("too-short message is rejected", r.status === 422 && Boolean(r.body?.errors?.message));

  // A fully valid payload passes validation and then fails at the database,
  // which proves the request travelled all the way through to the controller.
  r = await post({
    name: "Asha Rao",
    email: "asha@example.com",
    phone: "+91 98765 43210",
    message: "I would like to know more about the Sarasview plots, please.",
  });
  check(
    "a valid enquiry clears validation and reaches the DB layer",
    r.status !== 422,
    `expected not-422, got ${r.status} (${r.body?.message})`,
  );

  console.log("\n── Login validation ─────────────────────────────────────────");

  r = await call("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  check("empty login is rejected with 422", r.status === 422, `got ${r.status}`);

  r = await call("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "nope", password: "x" }),
  });
  check("malformed login email is rejected", r.status === 422 && Boolean(r.body?.errors?.email));

  console.log("\n── CORS ─────────────────────────────────────────────────────");

  r = await call("/api/health", { headers: { Origin: "http://localhost:5173" } });
  check(
    "frontend origin is allowed",
    r.headers.get("access-control-allow-origin") === "http://localhost:5173",
    r.headers.get("access-control-allow-origin"),
  );

  r = await call("/api/health", { headers: { Origin: "http://localhost:5174" } });
  check(
    "admin origin is allowed",
    r.headers.get("access-control-allow-origin") === "http://localhost:5174",
    r.headers.get("access-control-allow-origin"),
  );

  console.log("\n── Static uploads ───────────────────────────────────────────");

  const res = await fetch(`${base}/${env.upload.dir}/seed/grow-farms-logo.png`);
  check("a seeded image is served", res.status === 200, `got ${res.status}`);
  check("uploads send nosniff", res.headers.get("x-content-type-options") === "nosniff");
  check("image content-type is correct", (res.headers.get("content-type") || "").startsWith("image/"));

  const traversal = await fetch(`${base}/${env.upload.dir}/../package.json`);
  check("path traversal out of uploads is blocked", traversal.status !== 200, `got ${traversal.status}`);

  console.log("\n── Security headers ─────────────────────────────────────────");

  r = await call("/api/health");
  check("x-powered-by is hidden", !r.headers.get("x-powered-by"));
  check("helmet sets nosniff", r.headers.get("x-content-type-options") === "nosniff");

  server.close();

  console.log(`\n${"─".repeat(62)}`);
  console.log(`  ${pass} passed, ${fail} failed`);
  console.log(`${"─".repeat(62)}\n`);

  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("smoke test crashed:", err);
  process.exit(1);
});
