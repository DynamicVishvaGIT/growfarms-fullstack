import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Images,
  Plus,
  Save,
  Sparkles,
  X,
} from "lucide-react";

import { blogs, categories } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import {
  Field, Alert, Badge, Loading, Spinner, ImagePicker, Dropzone, ImageGrid,
} from "../components/ui";
import BodyEditor from "../components/BodyEditor";
import { blogPlainText } from "../lib/blogContent";

const BLANK = {
  title: "",
  slug: "",
  content: "",
  hero_title: "",
  hero_subtitle: "",
  sub_heading: "",
  second_description: "",
  quote_text: "",
  quote_author: "",
  category_id: "",
  author_name: "Admin",
  published_at: "",
  status: "published",
  is_featured: false,
  sort_order: 0,
  meta_title: "",
  meta_description: "",
};

const SUB_HEADING_MAX = 240;
const HERO_TITLE_MAX = 240;
const HERO_SUBTITLE_MAX = 400;
const QUOTE_MAX = 1000;
const META_TITLE_MAX = 180;
const META_DESC_MAX = 320;

/** A step row the admin has added but not yet filled in. */
const BLANK_STEP = { step_number: "", title: "", description: "" };

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

/**
 * Only a post's own steps are editable here.
 *
 * The API fills an empty list with the shared scope-"blog" buying steps so the
 * article still renders them, but those belong to Admin → CMS → Buying Steps.
 * Adopting them would silently copy the shared list onto this post the next
 * time it is saved, so they are left out and the form shows the fallback note.
 */
function adoptSteps(b) {
  if (b.steps_source !== "post") return [];
  return (b.steps || []).map((st) => ({
    step_number: st.step_number || "",
    title: st.title || "",
    description: st.description || "",
  }));
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
  const [steps, setSteps] = useState([]);

  // "Other Blog": the ids this post points at, plus every post to choose from.
  const [related, setRelated] = useState([]);
  const [allPosts, setAllPosts] = useState([]);

  // Saved gallery rows, plus the files picked but not yet uploaded.
  const [gallery, setGallery] = useState([]);
  const [pendingImages, setPendingImages] = useState([]);

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
      setSteps(adoptSteps(b));
      setRelated(b.related_ids || []);
      setGallery(b.images || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, adopt]);

  useEffect(() => {
    categories.list({ type: "blog" }).then(setCats).catch(() => {});
    // Everything published or drafted, so the picker can offer any sibling.
    blogs.list({ limit: 100 }).then(setAllPosts).catch(() => {});
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

  /* Every post except this one, so a post can never be its own sibling. */
  const pickablePosts = useMemo(
    () => allPosts.filter((b) => String(b.id) !== String(id)),
    [allPosts, id],
  );

  const postsById = useMemo(
    () => new Map(pickablePosts.map((b) => [b.id, b])),
    [pickablePosts],
  );

  const unpickedPosts = useMemo(
    () => pickablePosts.filter((b) => !related.includes(b.id)),
    [pickablePosts, related],
  );

  /** Reorder within any of the repeaters — the checklist and the steps both. */
  const move = (setList) => (from, to) =>
    setList((list) => {
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const moveItem = move(setChecklist);
  const moveStep = move(setSteps);
  const moveRelated = move(setRelated);

  const setStep = (i, key, value) =>
    setSteps((list) => list.map((st, x) => (x === i ? { ...st, [key]: value } : st)));

  const deleteImage = async (imageId) => {
    try {
      await blogs.removeImage(id, imageId);
      setGallery((list) => list.filter((img) => img.id !== imageId));
      toast.success("Image removed");
    } catch (err) {
      toast.error(err.message);
    }
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
      steps: JSON.stringify(steps.filter((st) => st.title.trim())),
      related: JSON.stringify(related),
    };

    if (pendingImages.length) payload.images = pendingImages;

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
        setSteps(adoptSteps(saved));
        setRelated(saved.related_ids || []);
        setGallery(saved.images || []);
        setPendingImages([]);
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

              <BodyEditor
                value={form.content || ""}
                onChange={(next) => setField("content", next)}
                error={errors.content}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Banner</h2>
            </div>
            <div className="card-body">
              <p style={{ margin: "0 0 16px", color: "var(--ink-3)", fontSize: 13 }}>
                The full-width image at the very top of the article and the wording
                laid over it.
              </p>

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
                  <label htmlFor="hero_title" style={{ margin: 0 }}>
                    Banner heading
                  </label>
                  <Counter value={form.hero_title} max={HERO_TITLE_MAX} />
                </div>
                <input
                  id="hero_title"
                  name="hero_title"
                  className={`input${errors.hero_title ? " invalid" : ""}`}
                  maxLength={HERO_TITLE_MAX}
                  placeholder="Blog Details"
                  value={form.hero_title || ""}
                  onChange={change}
                />
                {errors.hero_title ? (
                  <div className="error">{errors.hero_title}</div>
                ) : (
                  <div className="hint">
                    Left blank the site uses the &ldquo;Article hero&rdquo; block in
                    Content → Blogs, and past that the post&rsquo;s own title.
                  </div>
                )}
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
                  <label htmlFor="hero_subtitle" style={{ margin: 0 }}>
                    Banner sub-line
                  </label>
                  <Counter value={form.hero_subtitle} max={HERO_SUBTITLE_MAX} />
                </div>
                <textarea
                  id="hero_subtitle"
                  name="hero_subtitle"
                  className={`textarea${errors.hero_subtitle ? " invalid" : ""}`}
                  rows={2}
                  maxLength={HERO_SUBTITLE_MAX}
                  value={form.hero_subtitle || ""}
                  onChange={change}
                />
                {errors.hero_subtitle ? (
                  <div className="error">{errors.hero_subtitle}</div>
                ) : (
                  <div className="hint">
                    Optional line under the heading. Nothing is drawn when it is empty.
                  </div>
                )}
              </div>

              <ImagePicker
                label="Banner image"
                value={removeBanner ? null : bannerUrl}
                file={bannerFile}
                hint="The full-width image behind the heading. Falls back to the featured image."
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

          <div className="card">
            <div className="card-head">
              <h2>In-article gallery</h2>
            </div>
            <div className="card-body">
              <p style={{ margin: "0 0 16px", color: "var(--ink-3)", fontSize: 13 }}>
                The row of images between the body copy and the takeaways. One image
                spans the column; two or more sit side by side. Leave it empty and the
                row is skipped.
              </p>

              <Dropzone onFiles={(files) => setPendingImages((p) => [...p, ...files])} />

              {pendingImages.length > 0 && (
                <div className="alert alert-info" style={{ marginTop: 12 }}>
                  {pendingImages.length} image{pendingImages.length > 1 ? "s" : ""} ready to
                  upload — they will be saved when you press Save.
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ marginLeft: "auto" }}
                    onClick={() => setPendingImages([])}
                  >
                    Clear
                  </button>
                </div>
              )}

              {isEdit ? (
                gallery.length ? (
                  <ImageGrid images={gallery} onDelete={deleteImage} />
                ) : (
                  <p style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}>
                    <Images size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
                    No gallery images yet.
                  </p>
                )
              ) : (
                <p style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}>
                  Images picked above are uploaded with the post when you create it.
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Takeaways section</h2>
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
              <p style={{ margin: "0 0 16px", color: "var(--ink-3)", fontSize: 13 }}>
                The block further down the article: a heading, a paragraph and a ticked
                list. Each part is optional, and the whole section is hidden on the site
                when all three are empty.
              </p>

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
                  <label htmlFor="sub_heading" style={{ margin: 0 }}>
                    Sub heading
                  </label>
                  <Counter value={form.sub_heading} max={SUB_HEADING_MAX} />
                </div>
                <input
                  id="sub_heading"
                  name="sub_heading"
                  className={`input${errors.sub_heading ? " invalid" : ""}`}
                  maxLength={SUB_HEADING_MAX}
                  placeholder="Everything on our farm is grown"
                  value={form.sub_heading || ""}
                  onChange={change}
                />
                {errors.sub_heading ? (
                  <div className="error">{errors.sub_heading}</div>
                ) : (
                  <div className="hint">
                    Heads the section. Left blank it reads &ldquo;Key takeaways&rdquo;.
                  </div>
                )}
              </div>

              <Field
                label="Second description"
                name="second_description"
                as="textarea"
                rows={5}
                value={form.second_description || ""}
                onChange={change}
                hint="The paragraph between that heading and the ticked list. Leave blank to go straight from the heading to the list."
              />

              <label style={{ display: "block", margin: "18px 0 8px", fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)" }}>
                Ticked list
              </label>

              {checklist.length === 0 ? (
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                  No items yet. These render as the ticked list under the paragraph above.
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
              <h2>Steps</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  setSteps((list) => [
                    ...list,
                    { ...BLANK_STEP, step_number: String(list.length + 1).padStart(2, "0") },
                  ])
                }
              >
                <Plus size={14} />
                Add step
              </button>
            </div>
            <div className="card-body">
              <p style={{ margin: "0 0 16px", color: "var(--ink-3)", fontSize: 13 }}>
                The numbered row near the foot of the article. Adding a step here
                replaces the shared list for this post only.
              </p>

              {steps.length === 0 ? (
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                  No steps of its own, so this post shows the shared list from{" "}
                  <Link to="/cms/buying-steps" style={{ color: "var(--green-600)" }}>
                    CMS &rarr; Buying Steps
                  </Link>{" "}
                  (the ones set to &ldquo;Blog article&rdquo;).
                </p>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {steps.map((st, i) => (
                    <div
                      key={i}
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: 10,
                        padding: 14,
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      <div className="row" style={{ flexWrap: "nowrap", alignItems: "center" }}>
                        <input
                          className="input"
                          value={st.step_number}
                          placeholder="01"
                          maxLength={6}
                          aria-label={"Step " + (i + 1) + " number"}
                          onChange={(e) => setStep(i, "step_number", e.target.value)}
                          style={{ width: 78, flex: "0 0 auto", textAlign: "center" }}
                        />
                        <input
                          className="input"
                          value={st.title}
                          placeholder="Choose Your Plot"
                          maxLength={160}
                          aria-label={"Step " + (i + 1) + " title"}
                          onChange={(e) => setStep(i, "title", e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className="btn-icon"
                          title="Move up"
                          aria-label="Move up"
                          disabled={i === 0}
                          onClick={() => moveStep(i, i - 1)}
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Move down"
                          aria-label="Move down"
                          disabled={i === steps.length - 1}
                          onClick={() => moveStep(i, i + 1)}
                        >
                          <ChevronDown size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon danger"
                          title="Remove"
                          aria-label="Remove"
                          onClick={() => setSteps((list) => list.filter((_, x) => x !== i))}
                        >
                          <X size={15} />
                        </button>
                      </div>
                      <textarea
                        className="textarea"
                        rows={2}
                        value={st.description}
                        placeholder="Explore our premium agricultural land options…"
                        aria-label={"Step " + (i + 1) + " description"}
                        onChange={(e) => setStep(i, "description", e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Pull quote</h2>
            </div>
            <div className="card-body">
              <p style={{ margin: "0 0 16px", color: "var(--ink-3)", fontSize: 13 }}>
                The white card that straddles the foot of the article. Leave the quote
                blank and the card is not drawn.
              </p>

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
                  <label htmlFor="quote_text" style={{ margin: 0 }}>
                    Quote
                  </label>
                  <Counter value={form.quote_text} max={QUOTE_MAX} />
                </div>
                <textarea
                  id="quote_text"
                  name="quote_text"
                  className={`textarea${errors.quote_text ? " invalid" : ""}`}
                  rows={3}
                  maxLength={QUOTE_MAX}
                  placeholder="When you listen to yourself, everything come naturally…"
                  value={form.quote_text || ""}
                  onChange={change}
                />
                {errors.quote_text ? (
                  <div className="error">{errors.quote_text}</div>
                ) : (
                  <div className="hint">
                    The quotation marks are added by the site &mdash; type the words only.
                  </div>
                )}
              </div>

              <Field
                label="Attribution"
                name="quote_author"
                value={form.quote_author || ""}
                onChange={change}
                error={errors.quote_author}
                maxLength={160}
                placeholder="Satisfied Client"
                hint="Printed under the quote. Left blank, the quote stands on its own."
              />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Listing image</h2>
            </div>
            <div className="card-body">
              <ImagePicker
                label="Featured image"
                value={removeFeatured ? null : featuredUrl}
                file={featuredFile}
                hint="The card on the blog grid, and the thumbnail other articles link back with."
                onPick={(f) => {
                  setFeaturedFile(f);
                  setRemoveFeatured(false);
                }}
                onClear={() => {
                  setFeaturedFile(null);
                  setRemoveFeatured(true);
                }}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Other Blog</h2>
            </div>
            <div className="card-body">
              <p style={{ margin: "0 0 16px", color: "var(--ink-3)", fontSize: 13 }}>
                The three cards the article ends with. Pick posts here to say exactly
                which ones appear, in this order; pick none and the site keeps showing
                the most recently published posts on its own.
              </p>

              {related.length === 0 ? (
                <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: 13 }}>
                  Nothing picked, so this post shows the newest three automatically.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 9, marginBottom: 14 }}>
                  {related.map((rid, i) => {
                    const picked = postsById.get(rid);
                    return (
                      <div className="row" key={rid} style={{ flexWrap: "nowrap" }}>
                        <div
                          className="input"
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            background: "var(--surface-2, transparent)",
                          }}
                        >
                          <span style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                            {i + 1}.
                          </span>
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {picked ? picked.title : `Post #${rid} (deleted)`}
                          </span>
                          {picked && picked.status !== "published" && (
                            <span style={{ marginLeft: "auto" }}>
                              <Badge value={picked.status} />
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Move up"
                          aria-label="Move up"
                          disabled={i === 0}
                          onClick={() => moveRelated(i, i - 1)}
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Move down"
                          aria-label="Move down"
                          disabled={i === related.length - 1}
                          onClick={() => moveRelated(i, i + 1)}
                        >
                          <ChevronDown size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon danger"
                          title="Remove"
                          aria-label="Remove"
                          onClick={() => setRelated((list) => list.filter((v) => v !== rid))}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="related_picker">Add a post</label>
                <select
                  id="related_picker"
                  className="select"
                  value=""
                  disabled={unpickedPosts.length === 0}
                  onChange={(e) => {
                    const rid = Number(e.target.value);
                    if (rid) setRelated((list) => [...list, rid]);
                    e.target.value = "";
                  }}
                >
                  <option value="">
                    {unpickedPosts.length ? "\u2014 Choose a post \u2014" : "No other posts available"}
                  </option>
                  {unpickedPosts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                      {b.status === "published" ? "" : ` (${b.status})`}
                    </option>
                  ))}
                </select>
                <div className="hint">
                  A draft picked here stays hidden on the site until it is published.
                  The site shows three cards, so anything past the third is a spare.
                </div>
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
                    {bodyPreviewText && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          setField(
                            "meta_description",
                            blogPlainText(form.content, 155).slice(0, META_DESC_MAX),
                          )
                        }
                      >
                        <Sparkles size={13} />
                        From body
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
                  placeholder={bodyPreviewText}
                  value={form.meta_description || ""}
                  onChange={change}
                />
                <div className="hint">
                  Falls back to the opening of the body when empty.
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
