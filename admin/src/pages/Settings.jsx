import { useCallback, useEffect, useState } from "react";
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
                    hint={s.key}
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
                  hint={s.key}
                />
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
