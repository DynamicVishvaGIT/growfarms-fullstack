import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Save, UploadCloud, Trash2, Undo2, MapPinned, ImageOff, ArrowUpRight, Eye, EyeOff,
} from "lucide-react";

import { content, projects as projectsApi } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import { Loading, Alert, Field, Spinner } from "../components/ui";

/**
 * Admin → Aerial Map.
 *
 * The photograph behind the home page's interactive map — the one the project
 * pins sit on. It shipped as a bundled frontend asset, so changing it meant a
 * rebuild; this page moves it into the CMS as the `home / aerial_map` content
 * block and hands it an uploader.
 *
 * The pins themselves belong to the projects (Projects → each project's map
 * position), and are drawn over the preview here because their coordinates are
 * percentages OF THIS IMAGE: swap in a photograph framed differently and the
 * pins land somewhere else. Seeing them on the new picture before saving is
 * the whole reason this page previews at size rather than as a thumbnail.
 */

const PAGE = "home";
const SECTION_KEY = "aerial_map";
const BLOCK_LABEL = "Aerial map — background image";

/** Mirrors the server's own filter, so a doomed upload is refused up front. */
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_MB = 5;

const DEFAULT_ALT = "Aerial farmland view";

function formatSize(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AerialMapSection() {
  const toast = useToast();

  const [block, setBlock] = useState(null);
  const [pins, setPins] = useState([]);

  // `saved*` is what the database holds; the unprefixed state is what the
  // admin is looking at. The difference between the two is "unsaved changes".
  const [savedUrl, setSavedUrl] = useState(null);
  const [savedAlt, setSavedAlt] = useState("");
  const [alt, setAlt] = useState("");

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [clearImage, setClearImage] = useState(false);

  const [dimensions, setDimensions] = useState(null);
  const [showPins, setShowPins] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // The pin overlay is a checking aid — losing it is no reason to stop the
      // admin replacing the image, so its failure resolves to an empty list.
      const [rows, pinRows] = await Promise.all([
        content.list({ page: PAGE }),
        projectsApi.mapPins().catch(() => []),
      ]);

      const found = rows.find((r) => r.section_key === SECTION_KEY) || null;
      setBlock(found);
      setSavedUrl(found?.image_url || null);
      setSavedAlt(found?.title || "");
      setAlt(found?.title || "");
      setPins(Array.isArray(pinRows) ? pinRows : []);

      setFile(null);
      setClearImage(false);
      setDimensions(null);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Object URLs leak until revoked, and this component re-renders on every
  // keystroke in the alt-text field.
  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const previewUrl = filePreview || (clearImage ? null : savedUrl);
  const dirty = Boolean(file) || clearImage || alt.trim() !== savedAlt.trim();

  const pick = (picked) => {
    if (!picked) return;

    if (!picked.type.startsWith("image/")) {
      toast.error("That file is not an image.");
      return;
    }
    if (picked.size > MAX_MB * 1024 * 1024) {
      toast.error(
        `Images have to be under ${MAX_MB}MB — that one is ${formatSize(picked.size)}.`,
      );
      return;
    }

    setFile(picked);
    setClearImage(false);
    setDimensions(null);
  };

  const revert = () => {
    setFile(null);
    setClearImage(false);
    setAlt(savedAlt);
    setDimensions(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { title: alt.trim() };
      if (file) payload.image = file;
      else if (clearImage) payload.remove_image = "true";

      if (block) {
        await content.update(block.id, payload);
      } else {
        // A database seeded before this block existed has no row to edit.
        await content.create({
          page: PAGE,
          section_key: SECTION_KEY,
          label: BLOCK_LABEL,
          sort_order: 4,
          ...payload,
        });
      }

      toast.success("Aerial map saved");
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Loading the aerial map…" />;

  const SaveButton = () => (
    <button
      type="button"
      className="btn btn-primary"
      onClick={save}
      disabled={saving || !dirty}
      title={dirty ? undefined : "Nothing has changed yet"}
    >
      {saving ? <Spinner /> : <Save size={16} />}
      {saving ? "Saving…" : "Save changes"}
    </button>
  );

  // A project with no coordinates would land at 0,0 — the frontend skips it
  // rather than stacking pins in the corner, so the preview does too.
  const placedPins = pins.filter(
    (p) =>
      p.map_pin_top !== null &&
      p.map_pin_left !== null &&
      Number.isFinite(Number(p.map_pin_top)) &&
      Number.isFinite(Number(p.map_pin_left)),
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Aerial Map</h1>
          <div className="sub">
            The photograph behind the home page&rsquo;s interactive map.
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {dirty && (
            <button type="button" className="btn btn-ghost" onClick={revert} disabled={saving}>
              <Undo2 size={15} />
              Discard
            </button>
          )}
          <SaveButton />
        </div>
      </div>

      <Alert tone="error">{error}</Alert>

      {dirty && (
        <Alert tone="warn">
          Unsaved changes — the website is still showing the previous image.
        </Alert>
      )}

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Map image</h2>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
              JPG, PNG, WEBP or AVIF · up to {MAX_MB}MB · a wide landscape shot works best
            </div>
          </div>
          {previewUrl && placedPins.length > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowPins((v) => !v)}
            >
              {showPins ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPins ? "Hide pins" : "Show pins"}
            </button>
          )}
        </div>

        <div className="card-body">
          {previewUrl ? (
            <div
              style={{
                position: "relative",
                borderRadius: "var(--radius)",
                overflow: "hidden",
                border: "1px solid var(--border)",
                background: "var(--green-900)",
                lineHeight: 0,
              }}
            >
              <img
                src={previewUrl}
                alt=""
                onLoad={(e) =>
                  setDimensions({
                    w: e.currentTarget.naturalWidth,
                    h: e.currentTarget.naturalHeight,
                  })
                }
                style={{ display: "block", width: "100%", height: "auto" }}
              />

              {showPins &&
                placedPins.map((pin) => (
                  <div
                    key={pin.id}
                    title={`${pin.title} — ${Number(pin.map_pin_left)}% across, ${Number(
                      pin.map_pin_top,
                    )}% down`}
                    style={{
                      position: "absolute",
                      top: `${Number(pin.map_pin_top)}%`,
                      left: `${Number(pin.map_pin_left)}%`,
                      transform: "translate(-50%, -50%)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: "2px solid #fff",
                        background: "rgba(255,255,255,0.35)",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.45)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10.5,
                        lineHeight: 1.4,
                        fontWeight: 600,
                        color: "var(--green-900)",
                        background: "rgba(255,255,255,0.94)",
                        borderRadius: 6,
                        padding: "2px 6px",
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
                      }}
                    >
                      {pin.title}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div
              style={{
                border: "1px dashed var(--border-strong)",
                borderRadius: "var(--radius)",
                padding: "38px 20px",
                textAlign: "center",
                color: "var(--muted)",
                background: "var(--green-50)",
              }}
            >
              <ImageOff size={30} style={{ opacity: 0.5 }} />
              <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--ink-2)" }}>
                No image set
              </p>
              <span style={{ fontSize: 12 }}>
                The website falls back to the photograph it ships with.
              </span>
            </div>
          )}

          <div className="row" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => inputRef.current?.click()}
            >
              <UploadCloud size={15} />
              {previewUrl ? "Replace image" : "Upload image"}
            </button>

            {previewUrl && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setFile(null);
                  setClearImage(true);
                  setDimensions(null);
                }}
              >
                <Trash2 size={15} />
                Remove
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            hidden
            onChange={(e) => {
              pick(e.target.files?.[0]);
              // Reset so picking the same file twice still fires onChange.
              e.target.value = "";
            }}
          />

          <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
            {file ? (
              <>
                New file: <strong style={{ color: "var(--ink-2)" }}>{file.name}</strong> ·{" "}
                {formatSize(file.size)}
                {dimensions ? ` · ${dimensions.w}×${dimensions.h}px` : ""} — not saved yet.
              </>
            ) : clearImage ? (
              <>The saved image is deleted when you save.</>
            ) : savedUrl ? (
              <>
                Currently live
                {dimensions ? ` · ${dimensions.w}×${dimensions.h}px` : ""} ·{" "}
                <a
                  href={savedUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--green-600)" }}
                >
                  open full size
                </a>
              </>
            ) : null}
          </div>

          <p style={{ marginTop: 12, marginBottom: 0, fontSize: 12, color: "var(--muted)" }}>
            The section crops the picture to fill the screen, keeping its middle on
            narrow ones — so leave the pinned area away from the far edges.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-head">
          <h2>Image description</h2>
        </div>
        <div className="card-body">
          <Field
            label="Alt text"
            name="alt"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder={DEFAULT_ALT}
            maxLength={200}
            hint={`Read out by screen readers, and shown if the image fails to load. Left blank the site uses “${DEFAULT_ALT}”.`}
          />
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-head">
          <div>
            <h2>Pins on this map</h2>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
              Positioned as a percentage of the image above, so a differently framed
              photograph needs them nudged.
            </div>
          </div>
        </div>
        <div className="card-body">
          {placedPins.length === 0 ? (
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
              No project has a map position set, so the site shows the four pins it was
              designed with. Give a project one under{" "}
              <Link to="/projects" style={{ color: "var(--green-600)" }}>
                Projects
              </Link>
              .
            </p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {placedPins.map((pin) => (
                <div
                  key={pin.id}
                  className="row"
                  style={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "9px 12px",
                    flexWrap: "nowrap",
                  }}
                >
                  <span className="row" style={{ gap: 8, alignItems: "center", minWidth: 0 }}>
                    <MapPinned size={15} color="var(--green-600)" />
                    <strong style={{ fontSize: 13.5 }}>{pin.title}</strong>
                  </span>
                  <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                    {Number(pin.map_pin_left)}% across · {Number(pin.map_pin_top)}% down ·{" "}
                    <Link to={`/projects/${pin.id}/edit`} style={{ color: "var(--green-600)" }}>
                      Edit
                    </Link>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="row" style={{ justifyContent: "flex-end", marginTop: 18 }}>
        {dirty && (
          <button type="button" className="btn btn-ghost" onClick={revert} disabled={saving}>
            <Undo2 size={15} />
            Discard
          </button>
        )}
        <SaveButton />
      </div>

      <p
        style={{
          marginTop: 18,
          fontSize: 12,
          color: "var(--muted)",
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        <ArrowUpRight size={14} />
        Remove the image and the site restores the photograph it ships with, so this
        section can never end up blank.
      </p>
    </>
  );
}
