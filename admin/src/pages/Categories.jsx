import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";

import { categories } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import {
  Loading, Alert, EmptyState, ConfirmDialog, Modal, Field, Checkbox, Spinner, Badge,
} from "../components/ui";

const TYPES = [
  { value: "project", label: "Project" },
  { value: "package", label: "Package" },
  { value: "blog", label: "Blog" },
];

const BLANK = { name: "", slug: "", type: "project", description: "", sort_order: 0, is_active: true };

export default function Categories() {
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await categories.list({ type: typeFilter }));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setForm(BLANK);
    setErrors({});
    setEditing("new");
  };

  const openEdit = (row) => {
    setForm({
      name: row.name,
      slug: row.slug,
      type: row.type,
      description: row.description || "",
      sort_order: row.sort_order,
      is_active: row.is_active,
    });
    setErrors({});
    setEditing(row);
  };

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const save = async () => {
    if (!form.name.trim()) {
      setErrors({ name: "Name is required" });
      return;
    }

    setSaving(true);
    try {
      if (editing === "new") await categories.create(form);
      else await categories.update(editing.id, form);

      toast.success(editing === "new" ? "Category created" : "Category updated");
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
      await categories.remove(toDelete.id);
      toast.success("Category deleted");
      setToDelete(null);
      load();
    } catch (err) {
      // The API refuses to delete a category still in use, and says by what.
      toast.error(err.message);
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Categories</h1>
          <div className="sub">Group projects, packages and blog posts.</div>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Plus size={16} />
          New category
        </button>
      </div>

      <Alert tone="error">{error}</Alert>

      <div className="card">
        <div className="card-head">
          <div className="filters">
            <select className="select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All types</option>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState icon={Tags} title="No categories yet" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Type</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th style={{ width: 96 }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="cell-title">{c.name}</td>
                    <td style={{ color: "var(--muted)", fontSize: 12.5 }}>{c.slug}</td>
                    <td style={{ textTransform: "capitalize" }}>{c.type}</td>
                    <td>{c.sort_order}</td>
                    <td>
                      <Badge value={c.is_active ? "active" : "inactive"} />
                    </td>
                    <td className="actions">
                      <button type="button" className="btn-icon" title="Edit" onClick={() => openEdit(c)}>
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon danger"
                        title="Delete"
                        onClick={() => setToDelete(c)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New category" : "Edit category"}
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
        <Field label="Name" name="name" value={form.name} onChange={change} error={errors.name} required />
        <Field
          label="Slug"
          name="slug"
          value={form.slug}
          onChange={change}
          hint="Generated from the name if left blank."
        />
        <Field label="Type" name="type" as="select" value={form.type} onChange={change}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Field>
        <Field
          label="Description"
          name="description"
          as="textarea"
          rows={2}
          value={form.description}
          onChange={change}
        />
        <Field label="Sort order" name="sort_order" type="number" value={form.sort_order} onChange={change} />
        <Checkbox label="Active" name="is_active" checked={form.is_active} onChange={change} />
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this category?"
        message={
          toDelete
            ? `"${toDelete.name}" will be deleted. If any projects, packages or posts still use it, the delete is refused so nothing is orphaned.`
            : ""
        }
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
