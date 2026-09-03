import { useCallback, useEffect, useState } from "react";
import { Inbox, Trash2, Download, Search, Mail, Phone } from "lucide-react";

import { enquiries } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import {
  Loading, Alert, Badge, EmptyState, ConfirmDialog, Pagination, Modal, Spinner,
} from "../components/ui";

const STATUSES = ["new", "read", "contacted", "closed"];

export default function Enquiries() {
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await enquiries.list({ page, limit: 20, status, source, search });
      setRows(data);
      setMeta(data.meta);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, status, source, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  /** Opening a "new" enquiry marks it read server-side; mirror that locally. */
  const openEnquiry = async (row) => {
    try {
      const full = await enquiries.get(row.id);
      setOpen(full);
      setNotes(full.admin_notes || "");
      setRows((list) =>
        list.map((r) => (r.id === row.id && r.status === "new" ? { ...r, status: "read" } : r)),
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  const setStatusFor = async (row, next) => {
    try {
      const updated = await enquiries.update(row.id, { status: next });
      setRows((list) => list.map((r) => (r.id === row.id ? { ...r, status: next } : r)));
      if (open?.id === row.id) setOpen(updated);
      toast.success(`Marked as ${next}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await enquiries.update(open.id, { admin_notes: notes });
      toast.success("Notes saved");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await enquiries.remove(toDelete.id);
      toast.success("Enquiry deleted");
      setToDelete(null);
      if (open?.id === toDelete.id) setOpen(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const exportCsv = async () => {
    try {
      const res = await enquiries.exportUrl({ status });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Enquiries</h1>
          <div className="sub">
            Leads from the website's contact page and property enquiry modal.
          </div>
        </div>
        <button type="button" className="btn btn-ghost" onClick={exportCsv}>
          <Download size={15} />
          Export CSV
        </button>
      </div>

      <Alert tone="error">{error}</Alert>

      <div className="tabs">
        <button
          type="button"
          className={`tab${status === "" ? " active" : ""}`}
          onClick={() => {
            setStatus("");
            setPage(1);
          }}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`tab${status === s ? " active" : ""}`}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="filters">
            <div style={{ position: "relative" }}>
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted)",
                }}
              />
              <input
                className="input"
                placeholder="Search name, email, phone…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{ paddingLeft: 33, minWidth: 250 }}
              />
            </div>

            <select
              className="select"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All sources</option>
              <option value="contact_page">Contact page</option>
              <option value="enquiry_modal">Enquiry modal</option>
              <option value="package">Package</option>
            </select>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No enquiries found"
            hint="Form submissions from the public website will appear here."
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Interested in</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ width: 50 }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => openEnquiry(e)}
                      style={{
                        cursor: "pointer",
                        fontWeight: e.status === "new" ? 500 : 400,
                      }}
                    >
                      <td>
                        <div className="cell-title">{e.name}</div>
                        <div className="cell-sub">
                          {e.source === "enquiry_modal" ? "Enquiry modal" : "Contact page"}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{e.email}</div>
                        <div className="cell-sub">{e.phone}</div>
                      </td>
                      <td style={{ color: "var(--ink-2)" }}>
                        {e.project?.title || e.subject || "—"}
                      </td>
                      <td
                        style={{
                          maxWidth: 240,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "var(--ink-3)",
                        }}
                      >
                        {e.message || "—"}
                      </td>
                      <td style={{ whiteSpace: "nowrap", color: "var(--ink-3)", fontSize: 12.5 }}>
                        {formatDate(e.created_at)}
                      </td>
                      <td>
                        <Badge value={e.status} />
                      </td>
                      <td className="actions" onClick={(ev) => ev.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-icon danger"
                          title="Delete"
                          onClick={() => setToDelete(e)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} onPage={setPage} />
          </>
        )}
      </div>

      <Modal
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title="Enquiry details"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(null)}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={saveNotes}
              disabled={savingNotes}
            >
              {savingNotes ? <Spinner /> : null}
              Save notes
            </button>
          </>
        }
      >
        {open && (
          <>
            <div className="row" style={{ marginBottom: 18 }}>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`btn btn-sm ${open.status === s ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setStatusFor(open, s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            <dl className="detail-list">
              <dt>Name</dt>
              <dd>{open.name}</dd>

              <dt>Email</dt>
              <dd>
                <a href={`mailto:${open.email}`} style={{ color: "var(--green-600)" }}>
                  <Mail size={13} style={{ verticalAlign: -2, marginRight: 5 }} />
                  {open.email}
                </a>
              </dd>

              <dt>Phone</dt>
              <dd>
                <a href={`tel:${open.phone}`} style={{ color: "var(--green-600)" }}>
                  <Phone size={13} style={{ verticalAlign: -2, marginRight: 5 }} />
                  {open.phone}
                </a>
              </dd>

              <dt>Interested in</dt>
              <dd>{open.project?.title || open.package?.title || open.subject || "—"}</dd>

              <dt>Source</dt>
              <dd>{open.source === "enquiry_modal" ? "Property enquiry modal" : "Contact page"}</dd>

              <dt>Received</dt>
              <dd>{formatDateTime(open.created_at)}</dd>

              <dt>Message</dt>
              <dd style={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{open.message || "—"}</dd>
            </dl>

            <div className="field" style={{ marginTop: 20 }}>
              <label htmlFor="admin_notes">Internal notes</label>
              <textarea
                id="admin_notes"
                className="textarea"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Call outcome, follow-up date, site visit scheduled…"
              />
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this enquiry?"
        message={
          toDelete
            ? `The enquiry from ${toDelete.name} will be permanently deleted. This cannot be undone.`
            : ""
        }
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
