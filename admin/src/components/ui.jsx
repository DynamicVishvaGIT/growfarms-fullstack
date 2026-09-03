import { useEffect, useRef, useState } from "react";
import { Inbox, X, UploadCloud, Trash2, Star } from "lucide-react";

/* ── Form field ──────────────────────────────────────────────────────────── */

/**
 * One labelled control. `as` picks the element so text, textarea and select
 * all share the same label / error / hint treatment.
 */
export function Field({
  label,
  name,
  as = "input",
  error,
  hint,
  className = "",
  children,
  required,
  ...props
}) {
  const Tag = as;
  const cls = as === "select" ? "select" : as === "textarea" ? "textarea" : "input";

  return (
    <div className={`field ${className}`}>
      {label && (
        <label htmlFor={name}>
          {label}
          {required && <span style={{ color: "var(--danger)" }}> *</span>}
        </label>
      )}
      <Tag
        id={name}
        name={name}
        className={`${cls}${error ? " invalid" : ""}`}
        aria-invalid={error ? "true" : undefined}
        {...props}
      >
        {children}
      </Tag>
      {hint && !error && <div className="hint">{hint}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export function Checkbox({ label, name, checked, onChange, hint }) {
  return (
    <div className="field">
      <div className="checkbox-row">
        <input
          type="checkbox"
          id={name}
          name={name}
          checked={Boolean(checked)}
          onChange={onChange}
        />
        <label htmlFor={name}>{label}</label>
      </div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

/* ── Status pills ────────────────────────────────────────────────────────── */

export function Badge({ value }) {
  if (!value) return null;
  const label = String(value).replace(/_/g, " ");
  return <span className={`badge badge-${value}`}>{label}</span>;
}

/* ── Feedback ────────────────────────────────────────────────────────────── */

export function Spinner({ dark }) {
  return <span className={`spinner${dark ? " dark" : ""}`} aria-label="Loading" />;
}

export function Loading({ label = "Loading…" }) {
  return (
    <div className="loading-block">
      <div style={{ textAlign: "center" }}>
        <Spinner dark />
        <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13 }}>{label}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", hint, icon: Icon = Inbox }) {
  return (
    <div className="empty">
      <Icon size={38} />
      <p>{title}</p>
      {hint && <span>{hint}</span>}
    </div>
  );
}

export function Alert({ tone = "error", children }) {
  if (!children) return null;
  return <div className={`alert alert-${tone}`}>{children}</div>;
}

/* ── Modal ───────────────────────────────────────────────────────────────── */

export function Modal({ open, onClose, title, children, footer, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Delete", onConfirm, onCancel, busy }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title || "Are you sure?"}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? <Spinner /> : null}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

/* ── Pagination ──────────────────────────────────────────────────────────── */

export function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, totalPages, total, limit } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // A sliding window of five, so long lists don't produce a hundred buttons.
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const shown = [];
  for (let i = start; i < start + 5 && i <= totalPages; i += 1) shown.push(i);

  return (
    <div className="pagination">
      <span>
        Showing {from}–{to} of {total}
      </span>
      <div className="pages">
        <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1}>
          ‹
        </button>
        {shown.map((n) => (
          <button
            key={n}
            type="button"
            className={n === page ? "active" : ""}
            onClick={() => onPage(n)}
          >
            {n}
          </button>
        ))}
        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= totalPages}>
          ›
        </button>
      </div>
    </div>
  );
}

/* ── Image inputs ────────────────────────────────────────────────────────── */

/**
 * Single-image picker with preview, used for hero images, icons and avatars.
 * `value` is the existing URL; `file` is a newly chosen File.
 */
export function ImagePicker({ label, value, file, onPick, onClear, hint, accept = "image/*" }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    // Object URLs leak until revoked, and this component re-renders a lot.
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview || value;

  return (
    <div className="field">
      {label && <label>{label}</label>}
      {shown && <img src={shown} alt="" className="preview-single" />}
      <div className="row">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()}>
          <UploadCloud size={15} />
          {shown ? "Replace" : "Upload"}
        </button>
        {shown && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
            <Trash2 size={15} />
            Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) onPick(picked);
          // Reset so picking the same file twice still fires onChange.
          e.target.value = "";
        }}
      />
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

/** Multi-file dropzone used by the gallery managers. */
export function Dropzone({ onFiles, label = "Drop images here or click to browse", accept = "image/*" }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);

  const handle = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (files.length) onFiles(files);
  };

  return (
    <>
      <div
        className={`dropzone${over ? " over" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handle(e.dataTransfer.files);
        }}
      >
        <UploadCloud size={26} style={{ marginBottom: 8, opacity: 0.55 }} />
        <div style={{ fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, marginTop: 3 }}>JPG, PNG, WEBP or AVIF · up to 5MB each</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}

/** Grid of already-saved images with delete and set-primary controls. */
export function ImageGrid({ images, onDelete, onSetPrimary }) {
  if (!images?.length) return null;

  return (
    <div className="img-grid" style={{ marginTop: 14 }}>
      {images.map((img) => (
        <div className="img-tile" key={img.id}>
          <img src={img.image_path_url || img.url} alt={img.alt_text || ""} />
          {img.is_primary && <span className="primary-flag">Primary</span>}
          <div className="tools">
            {onSetPrimary && !img.is_primary && (
              <button type="button" title="Make primary" onClick={() => onSetPrimary(img.id)}>
                <Star size={13} />
              </button>
            )}
            {onDelete && (
              <button type="button" title="Delete image" onClick={() => onDelete(img.id)}>
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
