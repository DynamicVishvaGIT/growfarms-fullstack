import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Pencil, Trash2, List, Copy } from "lucide-react";

import { cmsRegistry, projects as projectsApi } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import {
  Loading, Alert, Badge, EmptyState, ConfirmDialog, Modal, Field, Checkbox, Spinner, ImagePicker,
} from "../components/ui";
import { CMS_CONFIG, COLUMN_LABELS } from "./cmsConfig";

/** Seed a form object from the config's declared defaults. */
function blankFrom(config) {
  const out = {};
  for (const f of config.fields) {
    out[f.name] = f.type === "checkbox" ? (f.default ?? false) : f.type === "number" ? 0 : "";
  }
  if (config.projectScoped) out.project_id = "";
  return out;
}

/**
 * One page for every simple CMS list.
 *
 * It also runs embedded inside Project Content, where `resource` and
 * `projectId` arrive as props instead of route params: the list is then locked
 * to one project, so the project picker and the Project column disappear and
 * every new row is created against that project.
 */
export default function CmsList({ resource: resourceProp, projectId = null, embedded = false }) {
  const params = useParams();
  const resource = resourceProp || params.resource;
  const toast = useToast();

  const config = CMS_CONFIG[resource];
  const apiFor = cmsRegistry[resource];

  const [rows, setRows] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!apiFor) return;
    setLoading(true);
    try {
      setRows(
        await apiFor.list(
          projectId ? { project_id: projectId, include_shared: "true" } : undefined,
        ),
      );
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiFor, projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    // Only needed for the picker and the Project column, neither of which is
    // rendered once the list is already locked to a project.
    if (config?.projectScoped && !projectId) {
      projectsApi.list({ limit: 100 }).then(setProjectList).catch(() => {});
    }
  }, [config, projectId]);

  // An unknown :resource is a routing mistake, not a server error.
  if (!config || !apiFor) {
    return (
      <EmptyState
        icon={List}
        title="Unknown content type"
        hint={`There is no CMS list called "${resource}".`}
      />
    );
  }

  const openNew = () => {
    const blank = blankFrom(config);
    if (projectId) blank.project_id = projectId;
    setForm(blank);
    setErrors({});
    setImageFile(null);
    setImageUrl(null);
    setRemoveImage(false);
    setEditing("new");
  };

  const openEdit = (row) => {
    const next = {};
    for (const f of config.fields) next[f.name] = row[f.name] ?? (f.type === "checkbox" ? false : "");
    if (config.projectScoped) next.project_id = row.project_id || "";

    setForm(next);
    setErrors({});
    setImageFile(null);
    setImageUrl(config.image ? row[`${config.image.field}_url`] || null : null);
    setRemoveImage(false);
    setEditing(row);
  };

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const save = async () => {
    const next = {};
    for (const f of config.fields) {
      if (f.required && !String(form[f.name] ?? "").trim()) next[f.name] = `${f.label} is required`;
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = { ...form };
    if (config.projectScoped) payload.project_id = projectId || form.project_id || null;
    if (config.image) {
      if (imageFile) payload.image = imageFile;
      else if (removeImage) payload.remove_image = "true";
    }

    setSaving(true);
    try {
      if (editing === "new") await apiFor.create(payload);
      else await apiFor.update(editing.id, payload);

      toast.success(editing === "new" ? `${config.singular} created` : `${config.singular} updated`);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.message);
      if (err.errors) setErrors(err.errors);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await apiFor.remove(toDelete.id);
      toast.success(`${config.singular} deleted`);
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const renderCell = (row, col) => {
    const value = row[col];
    if (col === "is_active") return <Badge value={value ? "active" : "inactive"} />;
    if (col === "project_id") {
      const owner = projectList.find((p) => String(p.id) === String(value));
      if (owner) return owner.title;
      return <span style={{ color: "var(--muted)" }}>All projects</span>;
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (!value && value !== 0) return <span style={{ color: "var(--muted)" }}>—</span>;

    const text = String(value);
    return text.length > 90 ? `${text.slice(0, 90)}…` : text;
  };

  // Locked to one project, the Project column would repeat the same name on
  // every row, so it earns its place only on the standalone page.
  const columns = projectId
    ? config.columns.filter((c) => c !== "project_id")
    : config.columns;

  // The public page shows a project's own rows when it has any, and the shared
  // rows only when it has none. Both sets are listed here so the screen matches
  // the page, and `inheriting` says which of the two is actually live.
  const isShared = (row) => row.project_id === null || row.project_id === undefined;
  const ownCount = projectId ? rows.filter((r) => !isShared(r)).length : 0;
  const sharedCount = projectId ? rows.filter(isShared).length : 0;
  const inheriting = Boolean(projectId) && ownCount === 0 && sharedCount > 0;

  /** Duplicate a shared row onto this project so it can be tailored safely. */
  const copyToProject = async (row) => {
    const payload = { project_id: projectId };
    for (const f of config.fields) {
      if (f.name === "project_id") continue;
      payload[f.name] = row[f.name] ?? (f.type === "checkbox" ? false : "");
    }

    try {
      await apiFor.create(payload);
      toast.success(
        config.image && row[`${config.image.field}_url`]
          ? `Copied to this project — re-upload its image`
          : `Copied to this project`,
      );
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          {embedded ? (
            <div className="sub">{config.subtitle}</div>
          ) : (
            <>
              <h1>{config.title}</h1>
              <div className="sub">{config.subtitle}</div>
            </>
          )}
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Plus size={16} />
          New {config.singular.toLowerCase()}
        </button>
      </div>

      <Alert tone="error">{error}</Alert>
      {config.note && <Alert tone="info">{config.note}</Alert>}

      {projectId && sharedCount > 0 && (
        <Alert tone="info">
          {inheriting
            ? `This project has none of its own, so the ${sharedCount} shared ${config.title.toLowerCase()} below are what its page shows. Add one here — or copy a shared row — and it replaces all of them, for this project only.`
            : `This project's page shows its own ${ownCount} ${config.title.toLowerCase()}. The ${sharedCount} shared row${sharedCount > 1 ? "s are" : " is"} listed below for reference but ${sharedCount > 1 ? "do" : "does"} not appear on this page.`}
        </Alert>
      )}

      <div className="card">
        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={List}
            title={`No ${config.title.toLowerCase()} yet`}
            hint={
              projectId
                ? "Nothing here and nothing shared, so this section falls back to the content the site ships with. Add one to replace it for this project."
                : undefined
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  {config.image && <th style={{ width: 62 }}>Image</th>}
                  {projectId && <th style={{ width: 118 }}>Source</th>}
                  {columns.map((c) => (
                    <th key={c}>{COLUMN_LABELS[c] || c}</th>
                  ))}
                  <th style={{ width: projectId ? 128 : 96 }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const shared = projectId && isShared(row);
                  // A shared row that this project overrides is still listed,
                  // but dimmed: it is not what the page renders.
                  const overridden = shared && !inheriting;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => openEdit(row)}
                      style={{ cursor: "pointer", opacity: overridden ? 0.5 : 1 }}
                    >
                      {config.image && (
                        <td>
                          {row[`${config.image.field}_url`] ? (
                            <img src={row[`${config.image.field}_url`]} alt="" className="thumb" />
                          ) : (
                            <div className="thumb" />
                          )}
                        </td>
                      )}
                      {projectId && (
                        <td>
                          {!shared ? (
                            <Badge value="this_project" />
                          ) : (
                            <Badge value={inheriting ? "inherited" : "not_shown"} />
                          )}
                        </td>
                      )}
                      {columns.map((c, i) => (
                        <td key={c} className={i === 0 ? "cell-title" : undefined}>
                          {renderCell(row, c)}
                        </td>
                      ))}
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        {shared && (
                          <button
                            type="button"
                            className="btn-icon"
                            title="Copy to this project"
                            onClick={() => copyToProject(row)}
                          >
                            <Copy size={15} />
                          </button>
                        )}
                        <button type="button" className="btn-icon" title="Edit" onClick={() => openEdit(row)}>
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon danger"
                          title="Delete"
                          onClick={() => setToDelete(row)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === "new" ? `New ${config.singular.toLowerCase()}` : `Edit ${config.singular.toLowerCase()}`}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <Spinner /> : null}
              Save
            </button>
          </>
        }
      >
        {projectId && editing && editing !== "new" && isShared(editing) && (
          <Alert tone="info">
            This is a shared {config.singular.toLowerCase()}. Saving here changes it for
            every project. To change it for this project alone, close this and use the
            copy button on its row instead.
          </Alert>
        )}

        {config.projectScoped && !projectId && (
          <Field
            label="Project"
            name="project_id"
            as="select"
            value={form.project_id || ""}
            onChange={change}
            hint="Leave blank to show this on every project."
          >
            <option value="">— All projects —</option>
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Field>
        )}

        {config.image && (
          <ImagePicker
            label={config.image.label}
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
        )}

        {config.fields.map((f) => {
          if (f.type === "checkbox") {
            return (
              <Checkbox
                key={f.name}
                label={f.label}
                name={f.name}
                checked={form[f.name]}
                onChange={change}
                hint={f.hint}
              />
            );
          }

          if (f.type === "select") {
            return (
              <Field
                key={f.name}
                label={f.label}
                name={f.name}
                as="select"
                value={form[f.name] ?? ""}
                onChange={change}
                error={errors[f.name]}
                hint={f.hint}
                required={f.required}
              >
                {f.options.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Field>
            );
          }

          return (
            <Field
              key={f.name}
              label={f.label}
              name={f.name}
              as={f.type === "textarea" ? "textarea" : "input"}
              type={f.type === "textarea" ? undefined : f.type}
              rows={f.rows}
              min={f.min}
              max={f.max}
              step={f.step}
              placeholder={f.placeholder}
              value={form[f.name] ?? ""}
              onChange={change}
              error={errors[f.name]}
              hint={f.hint}
              required={f.required}
            />
          );
        })}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete this ${config.singular.toLowerCase()}?`}
        message="This will be permanently removed from the website."
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
