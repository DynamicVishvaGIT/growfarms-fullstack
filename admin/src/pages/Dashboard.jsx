import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Map, CheckCircle2, Tags, Inbox, Sparkles, Package, FileText, Quote } from "lucide-react";

import { dashboard } from "../api/endpoints";
import { Loading, Alert, Badge, EmptyState } from "../components/ui";

/** One metric tile. `tone` picks the icon chip colour. */
function Stat({ icon: Icon, value, label, meta, tone = "green", to }) {
  const tones = {
    green: { bg: "var(--green-100)", fg: "var(--green-600)" },
    gold: { bg: "#faf3dd", fg: "var(--gold-dark)" },
    info: { bg: "var(--info-bg)", fg: "var(--info)" },
    ok: { bg: "var(--ok-bg)", fg: "var(--ok)" },
  };
  const c = tones[tone] || tones.green;

  const body = (
    <div className="stat">
      <div className="icon" style={{ background: c.bg, color: c.fg }}>
        <Icon size={19} />
      </div>
      <div className="value">{value ?? "—"}</div>
      <div className="label">{label}</div>
      {meta && <div className="meta">{meta}</div>}
    </div>
  );

  return to ? <Link to={to}>{body}</Link> : body;
}

/** Inline bar chart for the 14-day enquiry trend — no chart library needed. */
function TrendChart({ series }) {
  if (!series?.length) return null;
  const max = Math.max(1, ...series.map((d) => d.count));

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 110, padding: "8px 0" }}>
      {series.map((d) => (
        <div key={d.date} style={{ flex: 1, textAlign: "center" }}>
          <div
            title={`${d.date}: ${d.count} enquir${d.count === 1 ? "y" : "ies"}`}
            style={{
              height: `${Math.max(3, (d.count / max) * 84)}px`,
              background: d.count ? "var(--green-600)" : "var(--border)",
              borderRadius: "4px 4px 2px 2px",
              transition: "height 0.3s ease",
            }}
          />
          <div style={{ fontSize: 9.5, color: "var(--muted)", marginTop: 5 }}>
            {d.date.slice(8)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [trend, setTrend] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    Promise.all([
      dashboard.stats(),
      dashboard.recentEnquiries(),
      dashboard.enquiryTrend(),
    ])
      .then(([s, r, t]) => {
        if (!alive) return;
        setStats(s);
        setRecent(r);
        setTrend(t);
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <Loading label="Loading dashboard…" />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">An overview of your properties, content and leads.</div>
        </div>
      </div>

      <Alert tone="error">{error}</Alert>

      {stats && (
        <>
          <div className="stat-grid">
            <Stat
              icon={Map}
              value={stats.properties.total}
              label="Total Properties"
              meta={`${stats.properties.inactive} inactive`}
              to="/projects"
            />
            <Stat
              icon={CheckCircle2}
              value={stats.properties.active}
              label="Active Properties"
              tone="ok"
              to="/projects"
            />
            <Stat
              icon={Tags}
              value={stats.categories.total}
              label="Categories"
              tone="gold"
              to="/categories"
            />
            <Stat
              icon={Inbox}
              value={stats.enquiries.total}
              label="Total Enquiries"
              meta={`${stats.enquiries.last_30_days} in the last 30 days`}
              tone="info"
              to="/enquiries"
            />
            <Stat
              icon={Sparkles}
              value={stats.enquiries.new}
              label="New Enquiries"
              meta="Awaiting first response"
              tone="gold"
              to="/enquiries"
            />
            <Stat
              icon={Package}
              value={stats.packages.total}
              label="Land Packages"
              meta={`${stats.packages.active} active`}
              to="/packages"
            />
            <Stat
              icon={FileText}
              value={stats.blogs.total}
              label="Blog Posts"
              meta={`${stats.blogs.published} published`}
              to="/blogs"
            />
            <Stat
              icon={Quote}
              value={stats.testimonials.total}
              label="Testimonials"
              to="/cms/testimonials"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
              gap: 18,
              alignItems: "start",
            }}
            className="dash-grid"
          >
            <div className="card">
              <div className="card-head">
                <h2>Recent enquiries</h2>
                <Link to="/enquiries" className="btn btn-ghost btn-sm">
                  View all
                </Link>
              </div>

              {recent.length === 0 ? (
                <EmptyState
                  title="No enquiries yet"
                  hint="Submissions from the website's contact and enquiry forms land here."
                />
              ) : (
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>Interested in</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((e) => (
                        <tr key={e.id}>
                          <td>
                            <div className="cell-title">{e.name}</div>
                            <div className="cell-sub">
                              {e.source === "enquiry_modal" ? "Enquiry modal" : "Contact page"}
                            </div>
                          </td>
                          <td>
                            <div>{e.email}</div>
                            <div className="cell-sub">{e.phone}</div>
                          </td>
                          <td>{e.project?.title || e.subject || "—"}</td>
                          <td>
                            <Badge value={e.status} />
                          </td>
                          <td style={{ whiteSpace: "nowrap", color: "var(--ink-3)" }}>
                            {formatDate(e.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-head">
                <h2>Enquiries · last 14 days</h2>
              </div>
              <div className="card-body">
                <TrendChart series={trend} />
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid var(--border)",
                    display: "grid",
                    gap: 9,
                  }}
                >
                  {[
                    ["New", stats.enquiries.new, "new"],
                    ["Read", stats.enquiries.read, "read"],
                    ["Contacted", stats.enquiries.contacted, "contacted"],
                    ["Closed", stats.enquiries.closed, "closed"],
                  ].map(([label, count, key]) => (
                    <div
                      key={key}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <Badge value={key} />
                      <strong style={{ fontSize: 15 }}>{count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <style>{`
            @media (max-width: 1080px) {
              .dash-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </>
      )}
    </>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
