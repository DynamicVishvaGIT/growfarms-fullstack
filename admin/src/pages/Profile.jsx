import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, KeyRound, LogOut } from "lucide-react";

import { auth } from "../api/endpoints";
import { tokenStore } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Field, Alert, Spinner, ImagePicker } from "../components/ui";

export default function Profile() {
  const { admin, setAdmin, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: admin?.name || "",
    email: admin?.email || "",
    phone: admin?.phone || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileError, setProfileError] = useState("");

  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pwErrors, setPwErrors] = useState({});
  const [pwError, setPwError] = useState("");

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileErrors({});
    setSavingProfile(true);

    try {
      const payload = { ...form };
      if (avatarFile) payload.avatar = avatarFile;

      const { admin: updated } = await auth.updateProfile(payload);
      setAdmin(updated);
      setAvatarFile(null);
      toast.success("Profile updated");
    } catch (err) {
      setProfileError(err.message);
      if (err.errors) setProfileErrors(err.errors);
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwErrors({});

    if (pw.new_password !== pw.confirm) {
      setPwErrors({ confirm: "The two passwords do not match" });
      return;
    }

    setSavingPw(true);
    try {
      const { token } = await auth.changePassword(pw.current_password, pw.new_password);
      // The server reissues a token, so the current session stays valid.
      tokenStore.set(token);
      setPw({ current_password: "", new_password: "", confirm: "" });
      toast.success("Password changed");
    } catch (err) {
      setPwError(err.message);
      if (err.errors) setPwErrors(err.errors);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My Profile</h1>
          <div className="sub">Your account details and password.</div>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            signOut();
            navigate("/login", { replace: true });
          }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
          gap: 18,
          alignItems: "start",
        }}
      >
        <form className="card" onSubmit={saveProfile}>
          <div className="card-head">
            <h2>Account details</h2>
          </div>
          <div className="card-body">
            <Alert tone="error">{profileError}</Alert>

            <ImagePicker
              label="Profile photo"
              value={admin?.avatar_url}
              file={avatarFile}
              onPick={setAvatarFile}
              onClear={() => setAvatarFile(null)}
            />

            <Field
              label="Name"
              name="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={profileErrors.name}
              required
            />
            <Field
              label="Email address"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              error={profileErrors.email}
              required
            />
            <Field
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              error={profileErrors.phone}
            />

            <div className="field">
              <label>Role</label>
              <div style={{ color: "var(--ink-2)", textTransform: "capitalize" }}>
                {admin?.role?.replace("_", " ")}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? <Spinner /> : <Save size={16} />}
              Save profile
            </button>
          </div>
        </form>

        <form className="card" onSubmit={changePassword}>
          <div className="card-head">
            <h2>Change password</h2>
          </div>
          <div className="card-body">
            <Alert tone="error">{pwError}</Alert>

            <Field
              label="Current password"
              name="current_password"
              type="password"
              autoComplete="current-password"
              value={pw.current_password}
              onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))}
              error={pwErrors.current_password}
              required
            />
            <Field
              label="New password"
              name="new_password"
              type="password"
              autoComplete="new-password"
              value={pw.new_password}
              onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))}
              error={pwErrors.new_password}
              hint="At least 8 characters, including a letter and a number."
              required
            />
            <Field
              label="Confirm new password"
              name="confirm"
              type="password"
              autoComplete="new-password"
              value={pw.confirm}
              onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
              error={pwErrors.confirm}
              required
            />

            <button type="submit" className="btn btn-primary" disabled={savingPw}>
              {savingPw ? <Spinner /> : <KeyRound size={16} />}
              Change password
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
