import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Images } from "lucide-react";

import { projects, categories, amenities as amenitiesApi } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import {
  Field, Checkbox, Alert, Loading, Spinner, ImagePicker, Dropzone, ImageGrid,
} from "../components/ui";

const BLANK = {
  title: "",
  slug: "",
  short_description: "",
  full_description: "",
  location: "",
  total_area: "",
  category_id: "",
  map_pin_top: "",
  map_pin_left: "",
  status: "active",
  is_featured: false,
  show_on_map: true,
  sort_order: 0,
  meta_title: "",
  meta_description: "",
};

export default function ProjectForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(BLANK);
  const [cats, setCats] = useState([]);
  const [allAmenities, setAllAmenities] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const [heroFile, setHeroFile] = useState(null);
  const [heroUrl, setHeroUrl] = useState(null);
  const [removeHero, setRemoveHero] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [pendingImages, setPendingImages] = useState([]);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const loadProject = useCallback(async () => {
    try {
      const p = await projects.get(id);
      setForm({
        ...BLANK,
        ...Object.fromEntries(
          Object.keys(BLANK).map((k) => [k, p[k] ?? BLANK[k]]),
        ),
      });
      setHeroUrl(p.hero_image_url || null);
      setGallery(p.images || []);
      setSelectedAmenities((p.amenities || []).map((a) => a.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    categories.list({ type: "project" }).then(setCats).catch(() => {});
    amenitiesApi.list().then(setAllAmenities).catch(() => {});
    if (isEdit) loadProject();
  }, [isEdit, loadProject]);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const toggleAmenity = (amenityId) => {
    setSelectedAmenities((list) =>
      list.includes(amenityId) ? list.filter((x) => x !== amenityId) : [...list, amenityId],
    );
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
      // Empty strings would be written as 0 by Number(); send null instead.
      map_pin_top: form.map_pin_top === "" ? null : form.map_pin_top,
      map_pin_left: form.map_pin_left === "" ? null : form.map_pin_left,
      category_id: form.category_id || null,
      amenity_ids: JSON.stringify(selectedAmenities),
    };

    if (heroFile) payload.hero_image = heroFile;
    if (removeHero && !heroFile) payload.remove_hero_image = "true";
    if (pendingImages.length) payload.images = pendingImages;

    setSaving(true);
    try {
      const saved = isEdit
        ? await projects.update(id, payload)
        : await projects.create(payload);

      toast.success(isEdit ? "Project updated" : "Project created");

      if (isEdit) {
        setPendingImages([]);
        setHeroFile(null);
        setRemoveHero(false);
        setHeroUrl(saved.hero_image_url || null);
        setGallery(saved.images || []);
      } else {
        navigate(`/projects/${saved.id}/edit`, { replace: true });
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
      await projects.removeImage(id, imageId);
      setGallery((list) => list.filter((i) => i.id !== imageId));
      toast.success("Image deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const makePrimary = async (imageId) => {
    try {
      await projects.setPrimaryImage(id, imageId);
      setGallery((list) => list.map((i) => ({ ...i, is_primary: i.id === imageId })));
      toast.success("Primary image updated");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading label="Loading project…" />;

  return (
    <>
      <div className="page-head">
        <div>
          <Link
            to="/projects"
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
            Back to projects
          </Link>
          <h1>{isEdit ? form.title || "Edit project" : "New project"}</h1>
          <div className="sub">
            {isEdit ? "Update this property's details, images and amenities." : "Add a new property to the website."}
          </div>
        </div>
      </div>

      <Alert tone="error">{error}</Alert>

      <form onSubmit={submit}>
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card">
            <div className="card-head">
              <h2>Basic details</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <Field
                  label="Project title"
                  name="title"
                  value={form.title}
                  onChange={change}
                  error={errors.title}
                  placeholder="Sarasview"
                  required
                />
                <Field
                  label="URL slug"
                  name="slug"
                  value={form.slug}
                  onChange={change}
                  error={errors.slug}
                  placeholder="sarasview"
                  hint="Leave blank to generate it from the title. Used in /details/<slug>."
                />

                <Field
                  label="Short description"
                  name="short_description"
                  as="textarea"
                  rows={2}
                  className="span-2"
                  value={form.short_description || ""}
                  onChange={change}
                  error={errors.short_description}
                  hint="The one-line summary shown in the map tooltip."
                  maxLength={500}
                />

                <Field
                  label="Full description"
                  name="full_description"
                  as="textarea"
                  rows={5}
                  className="span-2"
                  value={form.full_description || ""}
                  onChange={change}
                  hint="Shown on the map's detail panel and the project page."
                />

                <Field
                  label="Location"
                  name="location"
                  value={form.location || ""}
                  onChange={change}
                  placeholder="Aptavane Village, Pali, Maharashtra"
                />
                <Field
                  label="Total area"
                  name="total_area"
                  value={form.total_area || ""}
                  onChange={change}
                  placeholder="140 acres"
                />

                <Field label="Category" name="category_id" as="select" value={form.category_id || ""} onChange={change}>
                  <option value="">— None —</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Field>

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
              <h2>Aerial map placement</h2>
            </div>
            <div className="card-body">
              <p style={{ margin: "0 0 16px", color: "var(--ink-3)", fontSize: 13 }}>
                These are percentage coordinates on the aerial map's source image — the same values
                the map component uses to position each pin. 0% is the top/left edge.
              </p>
              <div className="form-grid">
                <Field
                  label="Pin position from top (%)"
                  name="map_pin_top"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.map_pin_top ?? ""}
                  onChange={change}
                  error={errors.map_pin_top}
                  placeholder="61.1"
                />
                <Field
                  label="Pin position from left (%)"
                  name="map_pin_left"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.map_pin_left ?? ""}
                  onChange={change}
                  error={errors.map_pin_left}
                  placeholder="49.4"
                />
              </div>
              <Checkbox
                label="Show this project as a pin on the aerial map"
                name="show_on_map"
                checked={form.show_on_map}
                onChange={change}
              />
              <Checkbox
                label="Featured project"
                name="is_featured"
                checked={form.is_featured}
                onChange={change}
                hint="The featured project is what /details shows when no project is specified."
              />
              <Field
                label="Sort order"
                name="sort_order"
                type="number"
                value={form.sort_order ?? 0}
                onChange={change}
                hint="Lower numbers appear first."
              />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Images</h2>
            </div>
            <div className="card-body">
              <ImagePicker
                label="Hero / banner image"
                value={removeHero ? null : heroUrl}
                file={heroFile}
                onPick={(f) => {
                  setHeroFile(f);
                  setRemoveHero(false);
                }}
                onClear={() => {
                  setHeroFile(null);
                  setRemoveHero(true);
                }}
                hint="Used as the project banner and the map panel thumbnail."
              />

              <div style={{ marginTop: 22 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "var(--ink-2)",
                  }}
                >
                  Gallery
                </label>

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
                    <ImageGrid images={gallery} onDelete={deleteImage} onSetPrimary={makePrimary} />
                  ) : (
                    <p style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}>
                      <Images size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
                      No gallery images yet.
                    </p>
                  )
                ) : (
                  <p style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}>
                    Save the project first to manage its gallery.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Amenities</h2>
            </div>
            <div className="card-body">
              {allAmenities.length === 0 ? (
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                  No amenities defined yet — add them under Amenities first.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                    gap: 2,
                  }}
                >
                  {allAmenities.map((a) => (
                    <div className="checkbox-row" key={a.id}>
                      <input
                        type="checkbox"
                        id={`amenity-${a.id}`}
                        checked={selectedAmenities.includes(a.id)}
                        onChange={() => toggleAmenity(a.id)}
                      />
                      <label htmlFor={`amenity-${a.id}`}>{a.name}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>SEO</h2>
            </div>
            <div className="card-body">
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
            <Link to="/projects" className="btn btn-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Spinner /> : <Save size={16} />}
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create project"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
