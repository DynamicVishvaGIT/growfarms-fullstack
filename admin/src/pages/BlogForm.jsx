import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Plus, X } from "lucide-react";

import { blogs, categories } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import { Field, Alert, Loading, Spinner, ImagePicker } from "../components/ui";

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

/** MySQL DATETIME → the `YYYY-MM-DDTHH:mm` a datetime-local input expects. */
function toLocalInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BlogForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(BLANK);
  const [cats, setCats] = useState([]);
  const [checklist, setChecklist] = useState([]);

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

  const loadBlog = useCallback(async () => {
    try {
      const b = await blogs.get(id);
      setForm({
        ...BLANK,
        ...Object.fromEntries(Object.keys(BLANK).map((k) => [k, b[k] ?? BLANK[k]])),
        published_at: toLocalInput(b.published_at),
      });
      setFeaturedUrl(b.featured_image_url || null);
      setBannerUrl(b.banner_image_url || null);
      setChecklist((b.checklist || []).map((c) => c.item_text));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    categories.list({ type: "blog" }).then(setCats).catch(() => {});
    if (isEdit) loadBlog();
  }, [isEdit, loadBlog]);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

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
        setFeaturedUrl(saved.featured_image_url || null);
        setBannerUrl(saved.banner_image_url || null);
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
                hint="Generated from the title if left blank."
              />
              <Field
                label="Excerpt"
                name="excerpt"
                as="textarea"
                rows={2}
                value={form.excerpt || ""}
                onChange={change}
                error={errors.excerpt}
                hint="The short summary shown on the listing card."
                maxLength={500}
              />
              <Field
                label="Body"
                name="content"
                as="textarea"
                rows={14}
                value={form.content || ""}
                onChange={change}
                hint="Basic HTML is supported — <p>, <h2>, <strong>, <ul>, <a>."
                style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 13 }}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Checklist</h2>
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
                  No checklist items. These render as the ticked list inside the article.
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
                        className="btn-icon danger"
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

                <Field label="Category" name="category_id" as="select" value={form.category_id || ""} onChange={change}>
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

              <Field
                label="Meta title"
                name="meta_title"
                value={form.meta_title || ""}
                onChange={change}
                maxLength={180}
              />
              <Field
                label="Meta description"
                name="meta_description"
                as="textarea"
                rows={2}
                value={form.meta_description || ""}
                onChange={change}
                maxLength={320}
              />
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
