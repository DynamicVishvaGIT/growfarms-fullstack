import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Map, Search, Star } from "lucide-react";

import { projects } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import { Loading, Alert, Badge, EmptyState, ConfirmDialog, Pagination } from "../components/ui";

export default function Projects() {
  const navigate = useNavigate();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await projects.list({ page, limit: 20, search, status });
      setRows(data);
      setMeta(data.meta);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  // Debounced so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await projects.remove(toDelete.id);
      toast.success(`"${toDelete.title}" was deleted`);
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Projects</h1>
          <div className="sub">
            The properties shown as pins on the aerial map and as detail pages.
          </div>
        </div>
        <Link to="/projects/new" className="btn btn-primary">
          <Plus size={16} />
          New project
        </Link>
      </div>

      <Alert tone="error">{error}</Alert>

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
                placeholder="Search projects…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{ paddingLeft: 33, minWidth: 230 }}
              />
            </div>

            <select
              className="select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="sold_out">Sold out</option>
            </select>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Map}
            title="No projects found"
            hint="Create your first project to place a pin on the aerial map."
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th style={{ width: 62 }}>Image</th>
                    <th>Project</th>
                    <th>Location</th>
                    <th>Map pin</th>
                    <th>Packages</th>
                    <th>Status</th>
                    <th style={{ width: 96 }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}/edit`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        {p.hero_image_url ? (
                          <img src={p.hero_image_url} alt="" className="thumb" />
                        ) : (
                          <div className="thumb" />
                        )}
                      </td>
                      <td>
                        <div className="cell-title">
                          {p.title}
                          {p.is_featured && (
                            <Star
                              size={12}
                              fill="var(--gold)"
                              color="var(--gold)"
                              style={{ marginLeft: 6, verticalAlign: -1 }}
                            />
                          )}
                        </div>
                        <div className="cell-sub">/{p.slug}</div>
                      </td>
                      <td style={{ color: "var(--ink-2)" }}>{p.location || "—"}</td>
                      <td style={{ fontSize: 12.5, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                        {p.map_pin_top != null && p.map_pin_left != null
                          ? `${p.map_pin_top}% / ${p.map_pin_left}%`
                          : "not placed"}
                      </td>
                      <td>{p.packages?.length ?? "—"}</td>
                      <td>
                        <Badge value={p.status} />
                      </td>
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Edit"
                          onClick={() => navigate(`/projects/${p.id}/edit`)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon danger"
                          title="Delete"
                          onClick={() => setToDelete(p)}
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

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this project?"
        message={
          toDelete
            ? `"${toDelete.title}" and its images, packages, facilities and FAQs will be permanently removed. Enquiries already received are kept, but will no longer be linked to it.`
            : ""
        }
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
