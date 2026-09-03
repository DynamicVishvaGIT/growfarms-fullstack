import { useCallback, useEffect, useState } from "react";
import { Pencil, Image as ImageIcon } from "lucide-react";

import { content } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import {
  Loading, Alert, EmptyState, Modal, Field, Checkbox, Spinner, ImagePicker,
} from "../components/ui";

const PAGES = [
  { key: "home", label: "Home" },
  { key: "about", label: "About" },
  { key: "details", label: "Project page" },
  { key: "blogs", label: "Blogs" },
  { key: "contact", label: "Contact" },
  { key: "global", label: "Global" },
];

export default function Content() {
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [extraJson, setExtraJson] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await content.list({ page }));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (row) => {
    setForm({
      title: row.title || "",
      subtitle: row.subtitle || "",
      body: row.body || "",
      link_label: row.link_label || "",
      link_url: row.link_url || "",
      sort_order: row.sort_order ?? 0,
      is_active: row.is_active,
    });
    setExtraJson(row.extra_data ? JSON.stringify(row.extra_data, null, 2) : "");
    setJsonError("");
    setImageFile(null);
    setImageUrl(row.image_url || null);
    setRemoveImage(false);
    setEditing(row);
  };

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const save = async () => {
    const payload = { ...form };

    // Validate the JSON here so a typo surfaces in the field, not as a 400.
    if (extraJson.trim()) {
      try {
        JSON.parse(extraJson);
        payload.extra_data = extraJson;
      } catch (err) {
        setJsonError(`Invalid JSON: ${err.message}`);
        return;
      }
    } else {
      payload.extra_data = "null";
    }
    setJsonError("");

    if (imageFile) payload.image = imageFile;
    else if (removeImage) payload.remove_image = "true";

    setSaving(true);
    try {
      await content.update(editing.id, payload);
      toast.success("Content updated");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Website Content</h1>
          <div className="sub">
            The headings, paragraphs and images used across the public site.
          </div>
        </div>
      </div>

      <Alert tone="error">{error}</Alert>

      <div className="tabs">
        {PAGES.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`tab${page === p.key ? " active" : ""}`}
            onClick={() => setPage(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ImageIcon}
            title="No content blocks for this page"
            hint="Blocks are created by the seed script and edited here."
          />
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {rows.map((row) => (
            <div className="card" key={row.id}>
              <div className="card-head">
                <div>
                  <h2>{row.label || row.section_key}</h2>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                    {row.page}.{row.section_key}
                  </div>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(row)}>
                  <Pencil size={14} />
                  Edit
                </button>
              </div>
              <div className="card-body" style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                {row.image_url && (
                  <img
                    src={row.image_url}
                    alt=""
                    style={{
                      width: 118,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  {row.title && (
                    <div style={{ fontWeight: 600, marginBottom: 4, whiteSpace: "pre-line" }}>
                      {row.title}
                    </div>
                  )}
                  {row.subtitle && (
                    <div style={{ color: "var(--ink-2)", fontSize: 13, marginBottom: 6 }}>
                      {row.subtitle}
                    </div>
                  )}
                  {row.body && (
                    <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 13, lineHeight: 1.6 }}>
                      {row.body.length > 260 ? `${row.body.slice(0, 260)}…` : row.body}
                    </p>
                  )}
                  {row.extra_data && (
                    <div style={{ marginTop: 9, fontSize: 11.5, color: "var(--muted)" }}>
                      + structured data ({Object.keys(row.extra_data).join(", ")})
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? editing.label || editing.section_key : ""}
        wide
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <Spinner /> : null}
              Save changes
            </button>
          </>
        }
      >
        <Field
          label="Title"
          name="title"
          as="textarea"
          rows={2}
          value={form.title || ""}
          onChange={change}
          hint="Line breaks are preserved — the hero headings use them."
        />
        <Field label="Subtitle" name="subtitle" value={form.subtitle || ""} onChange={change} />
        <Field label="Body" name="body" as="textarea" rows={6} value={form.body || ""} onChange={change} />

        <ImagePicker
          label="Image"
          value={removeImage ? null : imageUrl}
          file={imageFile}
          onPick={(f) => {
            setImageFile(f);
            setRemoveImage(false);
          }}
          onClear={() => {
            setImageFile(null);
            setRemoveImage(true);
          }}
        />

        <div className="form-grid">
          <Field label="Link label" name="link_label" value={form.link_label || ""} onChange={change} />
          <Field label="Link URL" name="link_url" value={form.link_url || ""} onChange={change} />
        </div>

        <Field
          label="Structured data (JSON)"
          name="extra_data"
          as="textarea"
          rows={9}
          value={extraJson}
          onChange={(e) => {
            setExtraJson(e.target.value);
            setJsonError("");
          }}
          error={jsonError}
          hint="Lists that don't fit the fields above — footer links, stat counters, contact cards."
          style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 12.5 }}
        />

        <div className="form-grid">
          <Field
            label="Sort order"
            name="sort_order"
            type="number"
            value={form.sort_order ?? 0}
            onChange={change}
          />
          <Checkbox label="Active" name="is_active" checked={form.is_active} onChange={change} />
        </div>
      </Modal>
    </>
  );
}
