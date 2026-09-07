import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Plus,
  Save,
  Sparkles,
  X,
} from "lucide-react";

import { blogs, categories } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import { Field, Alert, Badge, Loading, Spinner, ImagePicker } from "../components/ui";
import BodyEditor from "../components/BodyEditor";
import { blogPlainText } from "../lib/blogContent";

const BLANK = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category_id: "",
  author_name: "Admin",
  published_at: "",
  status: "published",
  is_featured: false,
  sort_order: 0,
  meta_title: "",
  meta_description: "",
};

const EXCERPT_MAX = 500;
const META_TITLE_MAX = 180;
const META_DESC_MAX = 320;

const SITE_URL = (import.meta.env.VITE_SITE_URL || "http://localhost:5173").replace(/\/+$/, "");

/** MySQL DATETIME → the `YYYY-MM-DDTHH:mm` a datetime-local input expects. */
function toLocalInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Preview of the URL the post will get. The server has the last word — it also
 * de-duplicates against existing posts — so this only mirrors the shape.
 */
function slugPreview(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip the accents NFKD split off
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}

/** Character counter that only turns loud as the limit gets close. */
function Counter({ value, max }) {
  const used = (value || "").length;
  const tone = used > max ? "var(--danger)" : used > max * 0.9 ? "var(--warn)" : "var(--muted)";
  return (
    <span style={{ color: tone, fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
      {used} / {max}
    </span>
  );
}

export default function BlogForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(BLANK);
  const [cats, setCats] = useState([]);
  const [checklist, setChecklist] = useState([]);

  // Read-only facts about a saved post, kept out of the editable form state.
  const [meta, setMeta] = useState({ slug: "", views: 0, status: "" });

  const [featuredFile, setFeaturedFile] = useState(null);
  const [featuredUrl, setFeaturedUrl] = useState(null);
  const [removeFeatured, setRemoveFeatured] = useState(false);

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [removeBanner, setRemoveBanner] = useState(false);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const adopt = useCallback((b) => {
    setForm({
      ...BLANK,
      ...Object.fromEntries(Object.keys(BLANK).map((k) => [k, b[k] ?? BLANK[k]])),
      published_at: toLocalInput(b.published_at),
    });
    setMeta({ slug: b.slug || "", views: b.views || 0, status: b.status || "" });
    setFeaturedUrl(b.featured_image_url || null);
    setBannerUrl(b.banner_image_url || null);
  }, []);

  const loadBlog = useCallback(async () => {
    try {
      const b = await blogs.get(id);
      adopt(b);
      setChecklist((b.checklist || []).map((c) => c.item_text));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, adopt]);

  useEffect(() => {
    categories.list({ type: "blog" }).then(setCats).catch(() => {});
    if (isEdit) loadBlog();
  }, [isEdit, loadBlog]);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  /* The slug the visitor will see: what was typed, else the saved one, else
     what the server will derive from the title. */
  const effectiveSlug =
    slugPreview(form.slug) || (form.slug ? "" : meta.slug) || slugPreview(form.title);

  const liveUrl = meta.slug ? `${SITE_URL}/blog-details/${meta.slug}` : null;

  const bodyPreviewText = useMemo(() => blogPlainText(form.content, 400), [form.content]);

  const moveItem = (from, to) =>
    setChecklist((list) => {
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setErrors({});

    if (!form.title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }

    const payload = {
      ...form,
      category_id: form.category_id || null,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      checklist: JSON.stringify(checklist.filter((c) => c.trim())),
    };

    if (featuredFile) payload.featured_image = featuredFile;
    if (removeFeatured && !featuredFile) payload.remove_featured_image = "true";
    if (bannerFile) payload.banner_image = bannerFile;
    if (removeBanner && !bannerFile) payload.remove_banner_image = "true";

    setSaving(true);
    try {
      const saved = isEdit ? await blogs.update(id, payload) : await blogs.create(payload);
      toast.success(isEdit ? "Post updated" : "Post created");

      if (isEdit) {
        setFeaturedFile(null);
        setBannerFile(null);
        setRemoveFeatured(false);
        setRemoveBanner(false);
        // The server owns the slug and may have de-duplicated it, so take the
        // saved row back rather than trusting what was typed.
        adopt(saved);
        setChecklist((saved.checklist || []).map((c) => c.item_text));
      } else {
        navigate(`/blogs/${saved.id}/edit`, { replace: true });
      }
    } catch (err) {
      setError(err.message);
      if (err.errors) setErrors(err.errors);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Loading post…" />;

  return (
    <>
      <div className="page-head">
        <div>
          <Link
            to="/blogs"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--ink-3)",
              fontSize: 13,
              marginBottom: 7,
            }}
          >
            <ArrowLeft size={14} />
            Back to blogs
          </Link>
          <h1>{isEdit ? form.title || "Edit post" : "New post"}</h1>
          {isEdit && (
            <div
              className="sub"
              style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
            >
              <Badge value={meta.status || form.status} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Eye size={13} />
                {meta.views.toLocaleString()} {meta.views === 1 ? "view" : "views"}
              </span>
              {liveUrl && (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    color: "var(--green-600)",
                    fontWeight: 600,
                  }}
                >
                  <ExternalLink size={13} />
                  View on site
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <Alert tone="error">{error}</Alert>

      <form onSubmit={submit}>
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card">
            <div className="card-head">
              <h2>Content</h2>
            </div>
            <div className="card-body">
              <Field
                label="Title"
                name="title"
                value={form.title}
                onChange={change}
                error={errors.title}
                required
              />

              <Field
                label="URL slug"
                name="slug"
                value={form.slug}
                onChange={change}
                placeholder={slugPreview(form.title)}
                hint={
                  effectiveSlug
                    ? `Lives at /blog-details/${effectiveSlug}`
                    : "Generated from the title if left blank."
                }
              />

              <div className="field">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <label htmlFor="excerpt" style={{ margin: 0 }}>
                    Excerpt
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {bodyPreviewText && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          setField("excerpt", blogPlainText(form.content, 180))
                        }
                      >
                        <Sparkles size={13} />
                        From body
                      </button>
                    )}
                    <Counter value={form.excerpt} max={EXCERPT_MAX} />
                  </div>
                </div>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  className={`textarea${errors.excerpt ? " invalid" : ""}`}
                  rows={2}
                  maxLength={EXCERPT_MAX}
                  value={form.excerpt || ""}
                  onChange={change}
                />
                {errors.excerpt ? (
                  <div className="error">{errors.excerpt}</div>
                ) : (
                  <div className="hint">
                    Shown on the listing card and under the title on the article.
                  </div>
                )}
              </div>

              <BodyEditor
                value={form.content || ""}
                onChange={(next) => setField("content", next)}
                error={errors.content}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Key takeaways</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setChecklist((c) => [...c, ""])}
              >
                <Plus size={14} />
                Add item
              </button>
            </div>
            <div className="card-body">
              {checklist.length === 0 ? (
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                  No items yet. These render as the ticked list inside the article, and
                  the section is hidden on the site when it is empty.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 9 }}>
                  {checklist.map((item, i) => (
                    <div className="row" key={i} style={{ flexWrap: "nowrap" }}>
                      <input
                        className="input"
                        value={item}
                        placeholder="Checklist item"
                        onChange={(e) =>
                          setChecklist((list) => list.map((v, x) => (x === i ? e.target.value : v)))
                        }
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn-icon"
                        title="Move up"
                        aria-label="Move up"
                        disabled={i === 0}
                        onClick={() => moveItem(i, i - 1)}
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        title="Move down"
                        aria-label="Move down"
                        disabled={i === checklist.length - 1}
                        onClick={() => moveItem(i, i + 1)}
                      >
                        <ChevronDown size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon danger"
                        title="Remove"
                        aria-label="Remove"
                        onClick={() => setChecklist((list) => list.filter((_, x) => x !== i))}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Images</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <ImagePicker
                  label="Featured image (listing card)"
                  value={removeFeatured ? null : featuredUrl}
                  file={featuredFile}
                  hint="Used on the blog grid, and inside the article when it differs from the banner."
                  onPick={(f) => {
                    setFeaturedFile(f);
                    setRemoveFeatured(false);
                  }}
                  onClear={() => {
                    setFeaturedFile(null);
                    setRemoveFeatured(true);
                  }}
                />
                <ImagePicker
                  label="Banner image (article header)"
                  value={removeBanner ? null : bannerUrl}
                  file={bannerFile}
                  hint="The full-width hero behind the title. Falls back to the featured image."
                  onPick={(f) => {
                    setBannerFile(f);
                    setRemoveBanner(false);
                  }}
                  onClear={() => {
                    setBannerFile(null);
                    setRemoveBanner(true);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Publishing</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <Field label="Status" name="status" as="select" value={form.status} onChange={change}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </Field>

                <Field
                  label="Category"
                  name="category_id"
                  as="select"
                  value={form.category_id || ""}
                  onChange={change}
                  hint="Shown as the pill on the card and above the article title."
                >
                  <option value="">— None —</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Field>

                <Field label="Author" name="author_name" value={form.author_name || ""} onChange={change} />

                <Field
                  label="Publish date"
                  name="published_at"
                  type="datetime-local"
                  value={form.published_at || ""}
                  onChange={change}
                  hint="Left blank, a published post uses the current time."
                />

                <Field
                  label="Sort order"
                  name="sort_order"
                  type="number"
                  value={form.sort_order ?? 0}
                  onChange={change}
                  hint="Lower numbers come first on the blog listing."
                />

                <div className="field">
                  <div className="checkbox-row">
                    <input
                      type="checkbox"
                      id="is_featured"
                      name="is_featured"
                      checked={Boolean(form.is_featured)}
                      onChange={change}
                    />
                    <label htmlFor="is_featured">Featured post</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Search &amp; sharing</h2>
            </div>
            <div className="card-body">
              <div className="field">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <label htmlFor="meta_title" style={{ margin: 0 }}>
                    Meta title
                  </label>
                  <Counter value={form.meta_title} max={META_TITLE_MAX} />
                </div>
                <input
                  id="meta_title"
                  name="meta_title"
                  className="input"
                  maxLength={META_TITLE_MAX}
                  placeholder={form.title ? `${form.title} | Grow Farms` : ""}
                  value={form.meta_title || ""}
                  onChange={change}
                />
                <div className="hint">The browser tab and search result heading.</div>
              </div>

              <div className="field">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <label htmlFor="meta_description" style={{ margin: 0 }}>
                    Meta description
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {(form.excerpt || bodyPreviewText) && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          setField(
                            "meta_description",
                            (form.excerpt || blogPlainText(form.content, 155)).slice(
                              0,
                              META_DESC_MAX,
                            ),
                          )
                        }
                      >
                        <Sparkles size={13} />
                        From excerpt
                      </button>
                    )}
                    <Counter value={form.meta_description} max={META_DESC_MAX} />
                  </div>
                </div>
                <textarea
                  id="meta_description"
                  name="meta_description"
                  className="textarea"
                  rows={2}
                  maxLength={META_DESC_MAX}
                  placeholder={form.excerpt || ""}
                  value={form.meta_description || ""}
                  onChange={change}
                />
                <div className="hint">
                  Falls back to the excerpt, then the opening of the body, when empty.
                </div>
              </div>
            </div>
          </div>

          <div className="row" style={{ justifyContent: "flex-end", paddingBottom: 10 }}>
            <Link to="/blogs" className="btn btn-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Spinner /> : <Save size={16} />}
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create post"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
