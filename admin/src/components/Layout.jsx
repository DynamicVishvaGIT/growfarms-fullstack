import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Map, Package, Tags, FileText, Inbox, Image, Sparkles,
  HelpCircle, Quote, Compass, Route, ListOrdered, Heart, Settings as Cog,
  User, LogOut, Menu, ExternalLink, Building2, ChevronDown, LayoutTemplate, Share2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { dashboard } from "../api/endpoints";

const NAV = [
  {
    group: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    group: "Properties",
    items: [
      { to: "/projects", label: "Projects", icon: Map },
      { to: "/project-content", label: "Project Content", icon: LayoutTemplate },
      { to: "/packages", label: "Land Packages", icon: Package },
      { to: "/categories", label: "Categories", icon: Tags },
      { to: "/cms/amenities", label: "Amenities", icon: Sparkles },
      { to: "/cms/facilities", label: "Local Facilities", icon: Building2 },
      { to: "/cms/travel-routes", label: "How to Reach", icon: Route },
    ],
  },
  {
    group: "Leads",
    items: [{ to: "/enquiries", label: "Enquiries", icon: Inbox, badge: "newEnquiries" }],
  },
  {
    group: "Content",
    items: [
      { to: "/blogs", label: "Blogs", icon: FileText },
      { to: "/content", label: "Website Content", icon: Image },
      { to: "/cms/faqs", label: "FAQs", icon: HelpCircle },
      { to: "/cms/testimonials", label: "Testimonials", icon: Quote },
      { to: "/cms/why-pali-slides", label: "Why Pali Slides", icon: Compass },
      { to: "/cms/why-choose-cards", label: "Why Choose Cards", icon: Heart },
      { to: "/cms/buying-steps", label: "Buying Steps", icon: ListOrdered },
      { to: "/cms/philosophy-cards", label: "Core Philosophy", icon: Heart },
      { to: "/cms/social-links", label: "Social Media Links", icon: Share2 },
    ],
  },
  {
    group: "System",
    items: [
      { to: "/settings", label: "Settings", icon: Cog },
      { to: "/profile", label: "My Profile", icon: User },
    ],
  },
];

/** Flat lookup so the topbar can name the current page. */
const TITLES = NAV.flatMap((g) => g.items).reduce((acc, i) => {
  acc[i.to] = i.label;
  return acc;
}, {});

export default function Layout() {
  const { admin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newEnquiries, setNewEnquiries] = useState(0);
  const menuRef = useRef(null);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // The unread badge is a nicety, so a failure here stays silent.
  useEffect(() => {
    let alive = true;
    const load = () =>
      dashboard
        .stats()
        .then((s) => alive && setNewEnquiries(s.enquiries.new))
        .catch(() => {});

    load();
    const timer = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [location.pathname]);

  const counts = { newEnquiries };
  const title = TITLES[location.pathname] || pageTitleFromPath(location.pathname);
  const initials = (admin?.name || "A")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="shell">
      {navOpen && <div className="sidebar-scrim" onClick={() => setNavOpen(false)} />}

      <aside className={`sidebar${navOpen ? " open" : ""}`}>
        <div className="sidebar-brand">
          <div className="mark">GF</div>
          <div>
            <div className="name">Grow Farms</div>
            <div className="role">{admin?.role?.replace("_", " ") || "admin"}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((group) => (
            <div key={group.group}>
              <div className="nav-group">{group.group}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const count = item.badge ? counts[item.badge] : 0;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                    {count > 0 && <span className="count">{count}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="btn-icon mobile-toggle"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <Menu size={19} />
          </button>

          <div className="title">{title}</div>
          <div className="spacer" />

          <a
            href={import.meta.env.VITE_SITE_URL || "http://localhost:5173"}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-sm"
            title="Open the public website"
          >
            <ExternalLink size={14} />
            View site
          </a>

          <div className="menu" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "none",
                border: "none",
                cursor: "pointer",
                font: "inherit",
                padding: 4,
              }}
            >
              {admin?.avatar_url ? (
                <img src={admin.avatar_url} alt="" className="avatar" />
              ) : (
                <span className="avatar">{initials}</span>
              )}
              <ChevronDown size={14} color="var(--ink-3)" />
            </button>

            {menuOpen && (
              <div className="menu-pop">
                <div style={{ padding: "8px 11px 10px" }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{admin?.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{admin?.email}</div>
                </div>
                <div className="sep" />
                <button type="button" onClick={() => navigate("/profile")}>
                  <User size={15} />
                  My profile
                </button>
                <button type="button" onClick={() => navigate("/settings")}>
                  <Cog size={15} />
                  Settings
                </button>
                <div className="sep" />
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    navigate("/login", { replace: true });
                  }}
                  style={{ color: "var(--danger)" }}
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/** Fall back to a readable title for nested routes like /projects/12/edit. */
function pageTitleFromPath(path) {
  const segment = path.split("/").filter(Boolean)[0];
  if (!segment) return "Dashboard";
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}
