import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { Field, Alert, Spinner } from "../components/ui";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    const next = {};
    if (!form.email.trim()) next.email = "Email is required";
    if (!form.password) next.password = "Password is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await signIn(form.email.trim(), form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setMessage(err.message);
      // The server returns field-keyed messages for validation failures.
      if (err.errors) setErrors(err.errors);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="mark">GF</div>

        <h1 style={{ fontSize: 21, marginBottom: 4 }}>Sign in</h1>
        <p style={{ margin: "0 0 22px", color: "var(--ink-3)", fontSize: 13.5 }}>
          Grow Farms administration panel
        </p>

        <Alert tone="error">{message}</Alert>

        <form onSubmit={submit} noValidate>
          <Field
            label="Email address"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="admin@growfarms.com"
            value={form.email}
            onChange={change}
            error={errors.email}
            required
          />

          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={change}
            error={errors.password}
            required
          />

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 6 }}
            disabled={busy}
          >
            {busy ? <Spinner /> : <LogIn size={16} />}
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
