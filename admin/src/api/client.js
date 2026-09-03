/**
 * Thin fetch wrapper around the Grow Farms API.
 *
 * Handles the three things every call needs: the base URL, the bearer token,
 * and turning the API's `{ success, data, message, errors }` envelope into
 * either a resolved value or a thrown ApiError the forms can read.
 */

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const TOKEN_KEY = "growfarms_admin_token";

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* private mode — the session simply won't persist across reloads */
    }
  },
  clear() {
    this.set(null);
  },
};

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    // Field-keyed messages from express-validator, ready to drop into a form.
    this.errors = errors || null;
  }
}

/** Callbacks registered by AuthContext so a 401 anywhere signs the user out. */
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

function buildQuery(params) {
  if (!params) return "";
  const usable = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (!usable.length) return "";
  return `?${new URLSearchParams(usable).toString()}`;
}

async function request(path, { method = "GET", body, params, isForm = false, raw = false } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (isForm) {
    // Let the browser set the multipart boundary itself.
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE}${path}${buildQuery(params)}`, {
      method,
      headers,
      body: payload,
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Is the backend running?",
      0,
    );
  }

  if (res.status === 401) {
    tokenStore.clear();
    if (onUnauthorized) onUnauthorized();
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.message || "Your session has expired", 401, data.errors);
  }

  if (raw) {
    if (!res.ok) throw new ApiError("Download failed", res.status);
    return res;
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok || !data || data.success === false) {
    throw new ApiError(
      (data && data.message) || `Request failed (${res.status})`,
      res.status,
      data && data.errors,
    );
  }

  // List endpoints carry pagination in `meta`; attach it without changing shape.
  if (data.meta && Array.isArray(data.data)) {
    const rows = [...data.data];
    rows.meta = data.meta;
    return rows;
  }

  return data.data;
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),

  postForm: (path, formData) =>
    request(path, { method: "POST", body: formData, isForm: true }),
  putForm: (path, formData) =>
    request(path, { method: "PUT", body: formData, isForm: true }),

  download: (path, params) => request(path, { params, raw: true }),

  baseUrl: BASE,
};

/**
 * Build FormData from a plain object, skipping undefined values and
 * unwrapping File / File[] fields.
 */
export function toFormData(values) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;

    if (value instanceof File) {
      fd.append(key, value);
    } else if (Array.isArray(value) && value[0] instanceof File) {
      value.forEach((file) => fd.append(key, file));
    } else if (value === null) {
      fd.append(key, "");
    } else if (typeof value === "object") {
      fd.append(key, JSON.stringify(value));
    } else {
      fd.append(key, String(value));
    }
  }
  return fd;
}
