import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <Compass size={44} color="var(--muted)" style={{ marginBottom: 14 }} />
        <h1 style={{ fontSize: 22, marginBottom: 6 }}>Page not found</h1>
        <p style={{ color: "var(--ink-3)", margin: "0 0 20px" }}>
          That admin page doesn&apos;t exist.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
