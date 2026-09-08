import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Save, Plus, Pencil, ExternalLink, Package as PackageIcon } from "lucide-react";

import {
  projects as projectsApi,
  amenities as amenitiesApi,
  packages as packagesApi,
} from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import {
  Field, Alert, Loading, Spinner, ImagePicker, EmptyState,
} from "../components/ui";
import CmsList from "./CmsList";

/**
 * Every section of the public project page, in the order a visitor scrolls past
 * them. The strip is deliberately the page's own running order rather than an
 * alphabetical menu of tables, so "which tab edits the bit under the banner?"
 * is answered by counting down the page.
 *
 * `cms` entries hand the tab straight to CmsList locked to this project; the
 * rest are columns on the project row itself.
 */
const TABS = [
  { key: "banner", label: "Banner & About" },
  { key: "why-choose-cards", label: "Why Choose Us", cms: true },
  { key: "facilities", label: "Local Facilities", cms: true },
  { key: "invest", label: "Why Invest in Pali" },
  { key: "amenities", label: "Amenities" },
  { key: "packages", label: "Land Packages" },
  { key: "buying-steps", label: "How to Buy", cms: true },
  { key: "testimonials", label: "Testimonials", cms: true },
  { key: "faqs", label: "FAQs", cms: true },
];

const BLANK_PROSE = {
  about_eyebrow: "",
  about_title: "",
  about_body: "",
  why_choose_eyebrow: "",
  why_choose_title: "",
  why_choose_body: "",
  invest_title: "",
  invest_body: "",
};

/** The single-image columns this page can replace or clear. */
const IMAGE_FIELDS = [
  "hero_image",
  "about_image",
  "about_image_2",
  "about_image_3",
  "about_image_4",
  "invest_image",
];

/**
 * The four tilted photo cards under the About text, in the order they sit on
 * the page. Each slot falls back on its own, so the row always shows four cards
 * — an empty slot renders the design's own photograph for that position.
 */
const ABOUT_CARDS = [
  { field: "about_image", label: "Photo 1 (left)" },
  { field: "about_image_2", label: "Photo 2" },
  { field: "about_image_3", label: "Photo 3" },
  { field: "about_image_4", label: "Photo 4 (right)" },
];

const blankImages = () =>
  Object.fromEntries(IMAGE_FIELDS.map((f) => [f, { file: null, url: null, remove: false }]));

/** Rebuild the image state from a loaded (or freshly saved) project row. */
const imagesFrom = (p) =>
  Object.fromEntries(
    IMAGE_FIELDS.map((f) => [f, { file: null, url: p[`${f}_url`] || null, remove: false }]),
  );

function SaveBar({ onSave, saving, label = "Save changes" }) {
  return (
    <div className="row" style={{ justifyContent: "flex-end", marginTop: 18 }}>
      <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
        {saving ? <Spinner /> : <Save size={16} />}
        {saving ? "Saving…" : label}
      </button>
    </div>
  );
}

export default function ProjectContent() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const projectId = params.get("project") || "";
  const tab = params.get("tab") || TABS[0].key;

  const [projectList, setProjectList] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [prose, setProse] = useState(BLANK_PROSE);
  const [images, setImages] = useState(blankImages);
  const [saving, setSaving] = useState(false);

  const [allAmenities, setAllAmenities] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const [packageRows, setPackageRows] = useState([]);

  /* ── Loading ──────────────────────────────────────────────────────────── */

  useEffect(() => {
    projectsApi
      .list({ limit: 100 })
      .then((rows) => {
        setProjectList(rows);
        // Land on a project rather than an empty shell, so the page opens
        // showing real content instead of asking a question first.
        if (!projectId && rows.length) {
          setParams({ project: String(rows[0].id), tab }, { replace: true });
        }
      })
      .catch((err) => setError(err.message));
    amenitiesApi.list().then(setAllAmenities).catch(() => {});
    // Only on mount: re-running this on every param change would fight the
    // user's own project choice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const p = await projectsApi.get(projectId);
      setProject(p);
      setProse(
        Object.fromEntries(Object.keys(BLANK_PROSE).map((k) => [k, p[k] || ""])),
      );
      setImages(imagesFrom(p));
      setSelectedAmenities((p.amenities || []).map((a) => a.id));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (!projectId || tab !== "packages") return;
    packagesApi.list({ project_id: projectId, limit: 100 }).then(setPackageRows).catch(() => {});
  }, [projectId, tab]);

  /* ── Saving ───────────────────────────────────────────────────────────── */

  const setTab = (key) => setParams({ project: projectId, tab: key });
  const setProject_ = (id) => setParams({ project: id, tab });

  const changeProse = (e) => {
    const { name, value } = e.target;
    setProse((f) => ({ ...f, [name]: value }));
  };

  const pickImage = (field, file) =>
    setImages((s) => ({ ...s, [field]: { ...s[field], file, remove: false } }));

  const clearImage = (field) =>
    setImages((s) => ({ ...s, [field]: { ...s[field], file: null, remove: true } }));

  /**
   * Both prose tabs share one save. Sending every text field together means a
   * half-finished edit on the other tab is never silently dropped, and the
   * backend's whitelist leaves every column this form does not mention alone.
   */
  const saveProse = async () => {
    const payload = { ...prose };

    for (const field of IMAGE_FIELDS) {
      const state = images[field];
      if (state.file) payload[field] = state.file;
      else if (state.remove) payload[`remove_${field}`] = "true";
    }

    setSaving(true);
    try {
      const saved = await projectsApi.update(projectId, payload);
      toast.success("Section saved");
      setImages(imagesFrom(saved));
      setProject(saved);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveAmenities = async () => {
    setSaving(true);
    try {
      await projectsApi.update(projectId, {
        amenity_ids: JSON.stringify(selectedAmenities),
      });
      toast.success("Amenities updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAmenity = (id) =>
    setSelectedAmenities((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );

  /* ── Render ───────────────────────────────────────────────────────────── */

  const active = TABS.find((t) => t.key === tab) || TABS[0];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Project Content</h1>
          <div className="sub">
            Everything on one project&apos;s public page, section by section, in the order
            visitors scroll past them.
          </div>
        </div>

        {project?.slug && (
          <a
            className="btn btn-ghost"
            href={`/details/${project.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={15} />
            View page
          </a>
        )}
      </div>

      <Alert tone="error">{error}</Alert>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-body">
          <Field
            label="Editing project"
            name="project"
            as="select"
            value={projectId}
            onChange={(e) => setProject_(e.target.value)}
            hint="Every tab below edits this project only. Other projects keep their own content."
          >
            {projectList.length === 0 && <option value="">No projects yet</option>}
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Field>
        </div>
      </div>

      {!projectId ? (
        <EmptyState
          title="No projects yet"
          hint="Create a project first — its page sections are edited here."
        />
      ) : (
        <>
          <div className="tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`tab${t.key === tab ? " active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <Loading label="Loading project…" />
          ) : active.cms ? (
            <>
              {/* The three cards are rows of their own; the block that
                  introduces them is columns on the project, so this tab
                  carries both. */}
              {active.key === "why-choose-cards" && (
                <div className="card" style={{ marginBottom: 18 }}>
                  <div className="card-head">
                    <h2>Section heading</h2>
                  </div>
                  <div className="card-body">
                    <p style={{ margin: "0 0 16px", color: "var(--ink-3)", fontSize: 13 }}>
                      The label, headline and paragraph above the three cards. Each field left
                      blank keeps the wording the site ships with, so filling in only the
                      headline is a perfectly good edit.
                    </p>

                    <div className="form-grid">
                      <Field
                        label="Small label"
                        name="why_choose_eyebrow"
                        value={prose.why_choose_eyebrow}
                        onChange={changeProse}
                        placeholder="The Advantage"
                        maxLength={80}
                        hint="The gold line above the headline."
                      />
                      <Field
                        label="Headline"
                        name="why_choose_title"
                        value={prose.why_choose_title}
                        onChange={changeProse}
                        placeholder={`Why Choose ${project?.title || "this project"}?`}
                        maxLength={200}
                        hint="Names the project by default — change it here to say something else."
                      />
                      <Field
                        label="Paragraph"
                        name="why_choose_body"
                        as="textarea"
                        rows={6}
                        className="span-2"
                        value={prose.why_choose_body}
                        onChange={changeProse}
                        hint="The centred paragraph under the headline."
                      />
                    </div>

                    <SaveBar onSave={saveProse} saving={saving} label="Save heading" />
                  </div>
                </div>
              )}

              {/* Locked to this project: the list hides its own project picker
                  and creates every new row against this project. */}
              <CmsList
                key={`${active.key}-${projectId}`}
                resource={active.key}
                projectId={projectId}
                embedded
              />
            </>
          ) : tab === "banner" ? (
            <div className="card">
              <div className="card-head">
                <h2>Banner &amp; About</h2>
              </div>
              <div className="card-body">
                <ImagePicker
                  label="Banner image"
                  value={images.hero_image.remove ? null : images.hero_image.url}
                  file={images.hero_image.file}
                  onPick={(f) => pickImage("hero_image", f)}
                  onClear={() => clearImage("hero_image")}
                  hint="The full-width image at the top of the page. The heading over it is the project title."
                />

                <div style={{ marginTop: 24 }} className="form-grid">
                  <Field
                    label="Small label"
                    name="about_eyebrow"
                    value={prose.about_eyebrow}
                    onChange={changeProse}
                    placeholder="About"
                    maxLength={80}
                    hint={'The gold line above the heading. Leave blank for "About".'}
                  />
                  <Field
                    label="About heading"
                    name="about_title"
                    value={prose.about_title}
                    onChange={changeProse}
                    placeholder={`${project?.title || "This project"} Project`}
                    maxLength={200}
                    hint="The large centred heading. Leave blank to use the project title."
                  />
                  <Field
                    label="About text"
                    name="about_body"
                    as="textarea"
                    rows={7}
                    className="span-2"
                    value={prose.about_body}
                    onChange={changeProse}
                    hint="The centred paragraph under the heading. Leave blank to keep the wording the site ships with."
                  />
                </div>

                <div style={{ marginTop: 8 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--ink-2)",
                    }}
                  >
                    About photos
                  </label>
                  <p style={{ margin: "0 0 14px", color: "var(--ink-3)", fontSize: 13 }}>
                    The four tilted photo cards under the paragraph, left to right. Any slot
                    left empty keeps the photograph the site ships with for that position, so
                    the row always shows four.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {ABOUT_CARDS.map(({ field, label }) => (
                      <ImagePicker
                        key={field}
                        label={label}
                        value={images[field].remove ? null : images[field].url}
                        file={images[field].file}
                        onPick={(f) => pickImage(field, f)}
                        onClear={() => clearImage(field)}
                      />
                    ))}
                  </div>
                </div>

                <SaveBar onSave={saveProse} saving={saving} />
              </div>
            </div>
          ) : tab === "invest" ? (
            <div className="card">
              <div className="card-head">
                <h2>Why Invest in Pali</h2>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <Field
                    label="Heading"
                    name="invest_title"
                    as="textarea"
                    rows={2}
                    className="span-2"
                    value={prose.invest_title}
                    onChange={changeProse}
                    placeholder={"Why should\ninvest in Pali"}
                    hint="A line break here splits the heading in two on tablets and up."
                  />
                  <Field
                    label="Paragraph"
                    name="invest_body"
                    as="textarea"
                    rows={7}
                    className="span-2"
                    value={prose.invest_body}
                    onChange={changeProse}
                    hint="Leave blank to keep the wording the site ships with."
                  />
                </div>

                <ImagePicker
                  label="Landscape image"
                  value={images.invest_image.remove ? null : images.invest_image.url}
                  file={images.invest_image.file}
                  onPick={(f) => pickImage("invest_image", f)}
                  onClear={() => clearImage("invest_image")}
                  hint="The wide photo that closes this section."
                />

                <SaveBar onSave={saveProse} saving={saving} />
              </div>
            </div>
          ) : tab === "amenities" ? (
            <div className="card">
              <div className="card-head">
                <h2>Amenities</h2>
              </div>
              <div className="card-body">
                <p style={{ margin: "0 0 16px", color: "var(--ink-3)", fontSize: 13 }}>
                  Amenities are shared across projects so one icon and wording stay consistent
                  everywhere. Tick the ones this project offers — the rest of the catalogue is
                  edited under <Link to="/cms/amenities">Amenities</Link>.
                </p>

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
                          id={`pc-amenity-${a.id}`}
                          checked={selectedAmenities.includes(a.id)}
                          onChange={() => toggleAmenity(a.id)}
                        />
                        <label htmlFor={`pc-amenity-${a.id}`}>{a.name}</label>
                      </div>
                    ))}
                  </div>
                )}

                <SaveBar onSave={saveAmenities} saving={saving} label="Save amenities" />
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="page-head" style={{ padding: "16px 18px 0" }}>
                <div className="sub">The land packages offered on this project&apos;s page.</div>
                <Link className="btn btn-primary" to={`/packages/new?project=${projectId}`}>
                  <Plus size={16} />
                  New package
                </Link>
              </div>

              {packageRows.length === 0 ? (
                <EmptyState
                  icon={PackageIcon}
                  title="No packages for this project yet"
                  hint="Add one and it appears in the Land Packages section of the page."
                />
              ) : (
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Area</th>
                        <th>Price</th>
                        <th style={{ width: 60 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {packageRows.map((row) => (
                        <tr key={row.id}>
                          <td className="cell-title">{row.title}</td>
                          <td>{row.area_sqft || "—"}</td>
                          <td>{row.price_label || row.price || "—"}</td>
                          <td className="actions">
                            <Link className="btn-icon" title="Edit" to={`/packages/${row.id}/edit`}>
                              <Pencil size={15} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
