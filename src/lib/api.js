/**
 * Public API client for the Grow Farms website.
 *
 * Design rule for this file: the site must look and behave exactly as it does
 * today even when the backend is unreachable. Every read helper therefore
 * resolves to `null` on failure rather than throwing, and each component keeps
 * its original hard-coded data as the fallback. Only the enquiry submitters
 * throw, because there the user needs to be told it did not send.
 */

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

/** How long to wait before giving up and rendering the built-in content. */
const TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors || null;
  }
}

function buildQuery(params) {
  if (!params) return "";
  const usable = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (!usable.length) return "";
  return `?${new URLSearchParams(usable).toString()}`;
}

async function request(path, { method = "GET", body, params, signal } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // Honour a caller's own abort signal (component unmount) alongside the timeout.
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(`${BASE}${path}${buildQuery(params)}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.success === false) {
      throw new ApiError(
        (data && data.message) || `Request failed (${res.status})`,
        res.status,
        data && data.errors,
      );
    }

    return data.data;
  } finally {
    clearTimeout(timer);
  }
}

/** A read that never throws — returns null so the caller keeps its fallback. */
async function safeGet(path, params, signal) {
  try {
    return await request(path, { params, signal });
  } catch (err) {
    if (err.name !== "AbortError" && import.meta.env.DEV) {
      console.info(`[api] ${path} unavailable, using built-in content:`, err.message);
    }
    return null;
  }
}

/* ── Reads ───────────────────────────────────────────────────────────────── */

export const getMapPins = (signal) => safeGet("/projects/map", null, signal);
export const getProjects = (params, signal) => safeGet("/projects", params, signal);
export const getProject = (slug, signal) => safeGet(`/projects/${slug}`, null, signal);
export const getFeaturedProject = (signal) => safeGet("/projects/featured", null, signal);

export const getPackages = (params, signal) => safeGet("/packages", params, signal);

export const getBlogs = (params, signal) => safeGet("/blogs", params, signal);
export const getBlog = (slug, signal) => safeGet(`/blogs/${slug}`, null, signal);

export const getFaqs = (params, signal) => safeGet("/faqs", params, signal);
export const getTestimonials = (signal) => safeGet("/testimonials", null, signal);
export const getAmenities = (signal) => safeGet("/amenities", null, signal);
export const getFacilities = (params, signal) => safeGet("/facilities", params, signal);
export const getTravelRoutes = (params, signal) => safeGet("/travel-routes", params, signal);
export const getBuyingSteps = (params, signal) => safeGet("/buying-steps", params, signal);
export const getWhyPaliSlides = (signal) => safeGet("/why-pali-slides", null, signal);
export const getWhyChooseCards = (params, signal) => safeGet("/why-choose-cards", params, signal);
export const getPhilosophyCards = (signal) => safeGet("/philosophy-cards", null, signal);
export const getSocialLinks = (signal) => safeGet("/social-links", null, signal);

/**
 * Settings and content blocks are wanted by several components at once (the
 * footer, the nav, the hero, the contact cards). Memoising the in-flight
 * promise means one request per page load instead of one per component.
 */
const shared = new Map();

function sharedGet(key, loader) {
  if (!shared.has(key)) {
    shared.set(
      key,
      // A failure must not be cached forever, or a backend that comes up later
      // would never be picked up on a client-side navigation.
      loader().catch((err) => {
        shared.delete(key);
        throw err;
      }),
    );
  }
  return shared.get(key);
}

export const getContent = (page, signal) =>
  sharedGet(`content:${page}`, () => safeGet("/content", { page, grouped: "true" }, signal));

export const getSettings = (signal) =>
  sharedGet("settings", () => safeGet("/settings", { flat: "true" }, signal));

/** Read one content block out of a grouped response. */
export function contentBlock(grouped, page, key) {
  return grouped?.[page]?.[key] || null;
}

/* ── Writes ──────────────────────────────────────────────────────────────── */

/**
 * Submit an enquiry. Unlike the reads this rejects on failure — the visitor
 * must not be shown a success screen for a message that never arrived.
 */
export function submitEnquiry(payload) {
  return request("/enquiries", { method: "POST", body: payload });
}

/**
 * Turn a server validation response into the `{ field: message }` shape both
 * public forms already use for their inline errors.
 */
export function toFormErrors(err, fieldMap = {}) {
  if (!(err instanceof ApiError) || !err.errors) return {};
  const out = {};
  for (const [key, message] of Object.entries(err.errors)) {
    out[fieldMap[key] || key] = message;
  }
  return out;
}

export const apiBaseUrl = BASE;
