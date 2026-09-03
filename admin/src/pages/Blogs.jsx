import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, FileText, Search } from "lucide-react";

import { blogs } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import { Loading, Alert, Badge, EmptyState, ConfirmDialog, Pagination } from "../components/ui";

export default function Blogs() {
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
    try {
      const data = await blogs.list({ page, limit: 20, search, status });
      setRows(data);
      setMeta(data.meta);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await blogs.remove(toDelete.id);
      toast.success("Post deleted");
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
          <h1>Blogs</h1>
          <div className="sub">Articles shown on the blog listing and detail pages.</div>
        </div>
        <Link to="/blogs/new" className="btn btn-primary">
          <Plus size={16} />
          New post
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
                placeholder="Search posts…"
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
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState icon={FileText} title="No posts yet" hint="Write your first article." />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th style={{ width: 62 }}>Image</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Author</th>
                    <th>Published</th>
                    <th>Views</th>
                    <th>Status</th>
                    <th style={{ width: 96 }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => navigate(`/blogs/${b.id}/edit`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        {b.featured_image_url ? (
                          <img src={b.featured_image_url} alt="" className="thumb" />
                        ) : (
                          <div className="thumb" />
                        )}
                      </td>
                      <td>
                        <div className="cell-title">{b.title}</div>
                        <div className="cell-sub">/{b.slug}</div>
                      </td>
                      <td style={{ color: "var(--ink-2)" }}>{b.category?.name || "—"}</td>
                      <td style={{ color: "var(--ink-3)" }}>{b.author_name}</td>
                      <td style={{ whiteSpace: "nowrap", color: "var(--ink-3)", fontSize: 12.5 }}>
                        {formatDate(b.published_at)}
                      </td>
                      <td>{b.views}</td>
                      <td>
                        <Badge value={b.status} />
                      </td>
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Edit"
                          onClick={() => navigate(`/blogs/${b.id}/edit`)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon danger"
                          title="Delete"
                          onClick={() => setToDelete(b)}
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
        title="Delete this post?"
        message={toDelete ? `"${toDelete.title}" will be permanently deleted.` : ""}
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
