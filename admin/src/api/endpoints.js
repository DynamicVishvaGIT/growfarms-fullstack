import { api, toFormData } from "./client";

/* ── Auth ────────────────────────────────────────────────────────────────── */

export const auth = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  me: () => api.get("/auth/me"),
  updateProfile: (values) => api.putForm("/auth/profile", toFormData(values)),
  changePassword: (current_password, new_password) =>
    api.put("/auth/password", { current_password, new_password }),
};

/* ── Dashboard ───────────────────────────────────────────────────────────── */

export const dashboard = {
  stats: () => api.get("/dashboard/stats"),
  recentEnquiries: () => api.get("/dashboard/recent-enquiries"),
  enquiryTrend: () => api.get("/dashboard/enquiry-trend"),
};

/* ── Projects ────────────────────────────────────────────────────────────── */

export const projects = {
  list: (params) => api.get("/projects", params),
  get: (idOrSlug) => api.get(`/projects/${idOrSlug}`),
  create: (values) => api.postForm("/projects", toFormData(values)),
  update: (id, values) => api.putForm(`/projects/${id}`, toFormData(values)),
  remove: (id) => api.del(`/projects/${id}`),
  addImages: (id, files) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    return api.postForm(`/projects/${id}/images`, fd);
  },
  removeImage: (id, imageId) => api.del(`/projects/${id}/images/${imageId}`),
  setPrimaryImage: (id, imageId) => api.put(`/projects/${id}/images/${imageId}/primary`),
};

/* ── Packages ────────────────────────────────────────────────────────────── */

export const packages = {
  list: (params) => api.get("/packages", params),
  get: (idOrSlug) => api.get(`/packages/${idOrSlug}`),
  create: (values) => api.postForm("/packages", toFormData(values)),
  update: (id, values) => api.putForm(`/packages/${id}`, toFormData(values)),
  remove: (id) => api.del(`/packages/${id}`),
  addImages: (id, files) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    return api.postForm(`/packages/${id}/images`, fd);
  },
  removeImage: (id, imageId) => api.del(`/packages/${id}/images/${imageId}`),
};

/* ── Categories ──────────────────────────────────────────────────────────── */

export const categories = {
  list: (params) => api.get("/categories", params),
  create: (values) => api.postForm("/categories", toFormData(values)),
  update: (id, values) => api.putForm(`/categories/${id}`, toFormData(values)),
  remove: (id) => api.del(`/categories/${id}`),
};

/* ── Blogs ───────────────────────────────────────────────────────────────── */

export const blogs = {
  list: (params) => api.get("/blogs", params),
  get: (idOrSlug) => api.get(`/blogs/${idOrSlug}`),
  create: (values) => api.postForm("/blogs", toFormData(values)),
  update: (id, values) => api.putForm(`/blogs/${id}`, toFormData(values)),
  remove: (id) => api.del(`/blogs/${id}`),
};

/* ── Enquiries ───────────────────────────────────────────────────────────── */

export const enquiries = {
  list: (params) => api.get("/enquiries", params),
  get: (id) => api.get(`/enquiries/${id}`),
  update: (id, values) => api.put(`/enquiries/${id}`, values),
  remove: (id) => api.del(`/enquiries/${id}`),
  exportUrl: (params) => api.download("/enquiries/export", params),
};

/* ── Website content & settings ──────────────────────────────────────────── */

export const content = {
  list: (params) => api.get("/content", params),
  get: (id) => api.get(`/content/${id}`),
  create: (values) => api.postForm("/content", toFormData(values)),
  update: (id, values) => api.putForm(`/content/${id}`, toFormData(values)),
  remove: (id) => api.del(`/content/${id}`),
};

export const settings = {
  list: (params) => api.get("/settings", params),
  update: (key, values) => api.putForm(`/settings/${key}`, toFormData(values)),
  bulkUpdate: (map) => api.put("/settings", { settings: map }),
};

/* ── The ten simple CMS lists ───────────────────────────────────────────── */

/**
 * All ten share the factory-built controller on the server, so one client
 * factory mirrors it exactly.
 */
function cmsResource(path) {
  return {
    list: (params) => api.get(`/${path}/all`, params),
    listPublic: (params) => api.get(`/${path}`, params),
    get: (id) => api.get(`/${path}/${id}`),
    create: (values) => api.postForm(`/${path}`, toFormData(values)),
    update: (id, values) => api.putForm(`/${path}/${id}`, toFormData(values)),
    remove: (id) => api.del(`/${path}/${id}`),
    reorder: (items) => api.put(`/${path}/reorder`, { items }),
  };
}

export const amenities = cmsResource("amenities");
export const facilities = cmsResource("facilities");
export const travelRoutes = cmsResource("travel-routes");
export const buyingSteps = cmsResource("buying-steps");
export const whyPaliSlides = cmsResource("why-pali-slides");
export const whyChooseCards = cmsResource("why-choose-cards");
export const philosophyCards = cmsResource("philosophy-cards");
export const faqs = cmsResource("faqs");
export const testimonials = cmsResource("testimonials");
export const socialLinks = cmsResource("social-links");

/** Look a CMS resource up by the slug used in the admin route. */
export const cmsRegistry = {
  amenities,
  facilities,
  "travel-routes": travelRoutes,
  "buying-steps": buyingSteps,
  "why-pali-slides": whyPaliSlides,
  "why-choose-cards": whyChooseCards,
  "philosophy-cards": philosophyCards,
  faqs,
  testimonials,
  "social-links": socialLinks,
};
