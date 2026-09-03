import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Plus, X } from "lucide-react";

import { packages, projects, categories } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import { Field, Alert, Loading, Spinner, Dropzone, ImageGrid } from "../components/ui";

const BLANK = {
  title: "",
  slug: "",
  description: "",
  project_id: "",
  category_id: "",
  price: "",
  price_label: "",
  area_sqft: "",
  built_up_sqft: "",
  configuration: "",
  button_variant: "outline",
  button_color: "#D4AF37",
  button_label: "Book Now",
  card_rotate: 0,
  status: "active",
  sort_order: 0,
};

export default function PackageForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  // Arriving from a project's Content page carries the project along, so the
  // package is already attached to the right one before anything is typed.
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(() => {
    const preset = searchParams.get("project");
    return preset ? { ...BLANK, project_id: preset } : BLANK;
  });
  const [tags, setTags] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [cats, setCats] = useState([]);

  const [images, setImages] = useState([]);
  const [pendingImages, setPendingImages] = useState([]);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const loadPackage = useCallback(async () => {
    try {
      const p = await packages.get(id);
      setForm({
        ...BLANK,
        ...Object.fromEntries(Object.keys(BLANK).map((k) => [k, p[k] ?? BLANK[k]])),
      });
      setTags(p.tags || []);
      setImages(p.images || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    projects.list({ limit: 100 }).then(setProjectList).catch(() => {});
    categories.list({ type: "package" }).then(setCats).catch(() => {});
    if (isEdit) loadPackage();
  }, [isEdit, loadPackage]);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const updateTag = (index, patch) =>
    setTags((list) => list.map((t, i) => (i === index ? { ...t, ...patch } : t)));

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
      project_id: form.project_id || null,
      category_id: form.category_id || null,
      price: form.price === "" ? null : form.price,
      area_sqft: form.area_sqft === "" ? null : form.area_sqft,
      built_up_sqft: form.built_up_sqft === "" ? null : form.built_up_sqft,
      tags: JSON.stringify(
        tags
          .filter((t) => t.label?.trim())
          .map((t) => ({ label: t.label.trim(), accent_color: t.accent_color || null })),
      ),
    };

    if (pendingImages.length) payload.images = pendingImages;

    setSaving(true);
    try {
      const saved = isEdit
        ? await packages.update(id, payload)
        : await packages.create(payload);

      toast.success(isEdit ? "Package updated" : "Package created");

      if (isEdit) {
        setPendingImages([]);
        setImages(saved.images || []);
        setTags(saved.tags || []);
      } else {
        navigate(`/packages/${saved.id}/edit`, { replace: true });
      }
    } catch (err) {
      setError(err.message);
      if (err.errors) setErrors(err.errors);
    } finally {
      setSaving(false);
    }
  };

  const deleteImage = async (imageId) => {
    try {
      await packages.removeImage(id, imageId);
      setImages((list) => list.filter((i) => i.id !== imageId));
      toast.success("Image deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading label="Loading package…" />;

  return (
    <>
      <div className="page-head">
        <div>
          <Link
            to="/packages"
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
            Back to packages
          </Link>
          <h1>{isEdit ? form.title || "Edit package" : "New package"}</h1>
        </div>
      </div>

      <Alert tone="error">{error}</Alert>

      <form onSubmit={submit}>
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card">
            <div className="card-head">
              <h2>Package details</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <Field
                  label="Title"
                  name="title"
                  value={form.title}
                  onChange={change}
                  error={errors.title}
                  placeholder="Farmland With 2BHK Bungalow"
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
                  label="Description"
                  name="description"
                  as="textarea"
                  rows={3}
                  className="span-2"
                  value={form.description || ""}
                  onChange={change}
                />

                <Field label="Project" name="project_id" as="select" value={form.project_id || ""} onChange={change}>
                  <option value="">— Not linked —</option>
                  {projectList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </Field>

                <Field label="Category" name="category_id" as="select" value={form.category_id || ""} onChange={change}>
                  <option value="">— None —</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Field>

                <Field
                  label="Price (number)"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price ?? ""}
                  onChange={change}
                  error={errors.price}
                  placeholder="1598000"
                  hint="Used for sorting and filtering."
                />
                <Field
                  label="Price label (displayed)"
                  name="price_label"
                  value={form.price_label || ""}
                  onChange={change}
                  placeholder="₹15.98 Lakh"
                  hint="Exactly what the card shows."
                />

                <Field
                  label="Plot area (sq ft)"
                  name="area_sqft"
                  type="number"
                  min="0"
                  value={form.area_sqft ?? ""}
                  onChange={change}
                  placeholder="21780"
                />
                <Field
                  label="Built-up area (sq ft)"
                  name="built_up_sqft"
                  type="number"
                  min="0"
                  value={form.built_up_sqft ?? ""}
                  onChange={change}
                  placeholder="800"
                />

                <Field
                  label="Configuration"
                  name="configuration"
                  value={form.configuration || ""}
                  onChange={change}
                  placeholder="2BHK"
                />

                <Field label="Status" name="status" as="select" value={form.status} onChange={change}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="sold_out">Sold out</option>
                </Field>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Card appearance</h2>
            </div>
            <div className="card-body">
              <p style={{ margin: "0 0 16px", color: "var(--ink-3)", fontSize: 13 }}>
                These control how the package card renders on the site — the same values the
                existing design uses, so the cards keep their look and fan animation.
              </p>

              <div className="form-grid">
                <Field
                  label="Button style"
                  name="button_variant"
                  as="select"
                  value={form.button_variant}
                  onChange={change}
                >
                  <option value="outline">Outline</option>
                  <option value="solid">Solid</option>
                </Field>

                <div className="field">
                  <label htmlFor="button_color">Button colour</label>
                  <div className="row">
                    <input
                      type="color"
                      id="button_color"
                      name="button_color"
                      value={form.button_color || "#D4AF37"}
                      onChange={change}
                      style={{ width: 46, height: 38, padding: 3, border: "1px solid var(--border-strong)", borderRadius: 8, cursor: "pointer" }}
                    />
                    <input
                      className="input"
                      name="button_color"
                      value={form.button_color || ""}
                      onChange={change}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <Field
                  label="Button label"
                  name="button_label"
                  value={form.button_label || ""}
                  onChange={change}
                  placeholder="Book Now"
                />

                <Field
                  label="Card tilt (degrees)"
                  name="card_rotate"
                  type="number"
                  step="0.5"
                  value={form.card_rotate ?? 0}
                  onChange={change}
                  hint="The fan angle on desktop. Try -5 and 5 for a pair."
                />

                <Field
                  label="Sort order"
                  name="sort_order"
                  type="number"
                  value={form.sort_order ?? 0}
                  onChange={change}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Tags</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setTags((t) => [...t, { label: "", accent_color: null }])}
              >
                <Plus size={14} />
                Add tag
              </button>
            </div>
            <div className="card-body">
              {tags.length === 0 ? (
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                  No tags. These are the small pills on the card — e.g. "Road Access", "2BHK",
                  "₹5.99 Lakh".
                </p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {tags.map((tag, i) => (
                    <div className="row" key={i} style={{ flexWrap: "nowrap" }}>
                      <input
                        className="input"
                        placeholder="Tag label"
                        value={tag.label || ""}
                        onChange={(e) => updateTag(i, { label: e.target.value })}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="color"
                        title="Filled pill colour"
                        value={tag.accent_color || "#D4AF37"}
                        onChange={(e) => updateTag(i, { accent_color: e.target.value })}
                        style={{ width: 42, height: 38, padding: 3, border: "1px solid var(--border-strong)", borderRadius: 8, cursor: "pointer" }}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => updateTag(i, { accent_color: null })}
                        title="Use the outlined style instead"
                      >
                        Outline
                      </button>
                      <button
                        type="button"
                        className="btn-icon danger"
                        onClick={() => setTags((list) => list.filter((_, x) => x !== i))}
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
              <Dropzone
                onFiles={(files) => setPendingImages((p) => [...p, ...files])}
                label="Drop package images here — the card cross-fades between them"
              />

              {pendingImages.length > 0 && (
                <div className="alert alert-info" style={{ marginTop: 12 }}>
                  {pendingImages.length} image{pendingImages.length > 1 ? "s" : ""} ready to upload.
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

              {isEdit && <ImageGrid images={images} onDelete={deleteImage} />}
            </div>
          </div>

          <div className="row" style={{ justifyContent: "flex-end", paddingBottom: 10 }}>
            <Link to="/packages" className="btn btn-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Spinner /> : <Save size={16} />}
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create package"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
