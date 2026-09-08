import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Save } from "lucide-react";

import { settings } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import { Loading, Alert, Field, Spinner, ImagePicker } from "../components/ui";

const GROUPS = [
  { key: "general", label: "General" },
  { key: "contact", label: "Contact details" },
  { key: "social", label: "Social links" },
  { key: "seo", label: "SEO" },
  { key: "media", label: "Logo & media" },
];

/**
 * Where the website actually reads each value.
 *
 * The key on its own does not say which part of the site a box controls, and
 * several of them feed more than one page — the footer and the contact page
 * share the primary email and phone, so editing one changes both. Keys absent
 * from this map just show their key, as before.
 */
const USED_BY = {
  contact_email_1: "Footer, and the first entry on the contact page",
  contact_email_2: "Contact page only",
  contact_phone_1: "Footer, and the first entry on the contact page",
  contact_phone_2: "Contact page only",
  contact_address: "Footer, and the contact page",
  google_map_embed: "The map at the bottom of the contact page",
  google_map_link: "Opened by the contact page's address card and the map's button",
  copyright_text: "Footer",
  site_logo: "Footer",
};

const usageHint = (key) => (USED_BY[key] ? `${key} — ${USED_BY[key]}` : key);

export default function Settings() {
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [values, setValues] = useState({});
  const [group, setGroup] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Image settings upload one at a time, so they're tracked separately.
  const [imageFiles, setImageFiles] = useState({});
  const [removedImages, setRemovedImages] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await settings.list();
      setRows(data);
      setValues(Object.fromEntries(data.map((s) => [s.key, s.value ?? ""])));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = rows.filter((r) => r.group === group);

  const save = async () => {
    setSaving(true);
    try {
      // Text settings go in one bulk request; images need their own multipart
      // call each, since a file can't ride along in the JSON body.
      const textValues = Object.fromEntries(
        rows
          .filter((r) => r.type !== "image")
          .map((r) => [r.key, values[r.key] ?? ""]),
      );
      await settings.bulkUpdate(textValues);

      for (const [key, file] of Object.entries(imageFiles)) {
        if (file) await settings.update(key, { value: file });
      }
      for (const [key, removed] of Object.entries(removedImages)) {
        if (removed && !imageFiles[key]) await settings.update(key, { remove_image: "true" });
      }

      setImageFiles({});
      setRemovedImages({});
      toast.success("Settings saved");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Loading settings…" />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <div className="sub">Site-wide values used across the website's header, footer and forms.</div>
        </div>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <Spinner /> : <Save size={16} />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <Alert tone="error">{error}</Alert>

      <div className="tabs">
        {GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            className={`tab${group === g.key ? " active" : ""}`}
            onClick={() => setGroup(g.key)}
          >
            {g.label}
          </button>
        ))}
      </div>

      {group === "contact" && (
        <Alert tone="info">
          These values feed the footer and the contact page's cards. The cards themselves —
          their headings, which lines they show and where their arrows link — are on{" "}
          <Link to="/contact-page">Contact Page</Link>, along with the map.
        </Alert>
      )}

      {group === "social" && (
        <Alert tone="info">
          The footer's social icons are managed on{" "}
          <Link to="/cms/social-links">Social Media Links</Link>, where each platform
          has its own row, icon and on/off switch. Any social keys still listed below
          are left over from an earlier setup and are not read by the website.
        </Alert>
      )}

      <div className="card">
        <div className="card-body">
          {visible.length === 0 ? (
            <p style={{ margin: 0, color: "var(--muted)" }}>No settings in this group.</p>
          ) : (
            visible.map((s) => {
              if (s.type === "image") {
                return (
                  <ImagePicker
                    key={s.key}
                    label={s.label || s.key}
                    value={removedImages[s.key] ? null : s.value_url}
                    file={imageFiles[s.key]}
                    onPick={(f) => {
                      setImageFiles((m) => ({ ...m, [s.key]: f }));
                      setRemovedImages((m) => ({ ...m, [s.key]: false }));
                    }}
                    onClear={() => {
                      setImageFiles((m) => ({ ...m, [s.key]: null }));
                      setRemovedImages((m) => ({ ...m, [s.key]: true }));
                    }}
                    hint={usageHint(s.key)}
                  />
                );
              }

              return (
                <Field
                  key={s.key}
                  label={s.label || s.key}
                  name={s.key}
                  as={s.type === "textarea" ? "textarea" : "input"}
                  type={s.type === "textarea" ? undefined : s.type === "number" ? "number" : "text"}
                  rows={s.type === "textarea" ? 3 : undefined}
                  value={values[s.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
                  hint={usageHint(s.key)}
                />
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
