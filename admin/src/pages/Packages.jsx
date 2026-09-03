import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Package as PackageIcon } from "lucide-react";

import { packages, projects } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import { Loading, Alert, Badge, EmptyState, ConfirmDialog, Pagination } from "../components/ui";

export default function Packages() {
  const navigate = useNavigate();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [projectList, setProjectList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [projectId, setProjectId] = useState("");
  const [page, setPage] = useState(1);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await packages.list({ page, limit: 20, project_id: projectId });
      setRows(data);
      setMeta(data.meta);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    projects.list({ limit: 100 }).then(setProjectList).catch(() => {});
  }, []);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await packages.remove(toDelete.id);
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
          <h1>Land Packages</h1>
          <div className="sub">The purchasable plot offerings shown on each project page.</div>
        </div>
        <Link to="/packages/new" className="btn btn-primary">
          <Plus size={16} />
          New package
        </Link>
      </div>

      <Alert tone="error">{error}</Alert>

      <div className="card">
        <div className="card-head">
          <div className="filters">
            <select
              className="select"
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All projects</option>
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={PackageIcon}
            title="No packages yet"
            hint="Add the plot offerings buyers can choose from."
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th style={{ width: 62 }}>Image</th>
                    <th>Package</th>
                    <th>Project</th>
                    <th>Price</th>
                    <th>Area</th>
                    <th>Status</th>
                    <th style={{ width: 96 }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/packages/${p.id}/edit`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        {p.image_urls?.[0] ? (
                          <img src={p.image_urls[0]} alt="" className="thumb" />
                        ) : (
                          <div className="thumb" />
                        )}
                      </td>
                      <td>
                        <div className="cell-title">{p.title}</div>
                        <div className="cell-sub">
                          {(p.tags || []).map((t) => t.label).join(" · ") || `/${p.slug}`}
                        </div>
                      </td>
                      <td style={{ color: "var(--ink-2)" }}>{p.project?.title || "—"}</td>
                      <td style={{ fontWeight: 600 }}>{p.price_label || "—"}</td>
                      <td style={{ color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                        {p.area_sqft ? `${p.area_sqft.toLocaleString("en-IN")} sq ft` : "—"}
                      </td>
                      <td>
                        <Badge value={p.status} />
                      </td>
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Edit"
                          onClick={() => navigate(`/packages/${p.id}/edit`)}
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
        title="Delete this package?"
        message={toDelete ? `"${toDelete.title}" and its images will be permanently removed.` : ""}
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
