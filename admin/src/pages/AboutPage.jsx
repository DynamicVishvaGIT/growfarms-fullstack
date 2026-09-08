import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Save, Plus, Trash2, ChevronUp, ChevronDown, ArrowUpRight, Award,
} from "lucide-react";

import { content } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import { Loading, Alert, Field, Spinner, ImagePicker } from "../components/ui";

/**
 * Admin → About Page.
 *
 * The "15 Years of Cultivating Trust" block. Its heading, paragraph and
 * photograph were already editable under Website Content, but the counters,
 * the pull-quote and the floating card were reachable only as raw JSON in the
 * `extra_data` box — and the gold pill and the card's heading had nowhere to
 * live at all. This page gives every part of the section a proper field.
 */

const PAGE = "about";
const SECTION_KEY = "trust_section";

const MAX_STATS = 4;

/** A counter row the admin has added but not yet filled in. */
const blankStat = () => ({ value: "", suffix: "", label: "" });

export default function AboutPage() {
  const toast = useToast();

  const [block, setBlock] = useState(null);
  const [form, setForm] = useState({
    subtitle: "",
    title: "",
    body: "",
    quote: "",
    card_title: "",
    card_text: "",
  });
  const [stats, setStats] = useState([]);

  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await content.list({ page: PAGE });
      const found = rows.find((r) => r.section_key === SECTION_KEY) || null;
      setBlock(found);

      const extra = found?.extra_data || {};
      setForm({
        subtitle: found?.subtitle || "",
        title: found?.title || "",
        body: found?.body || "",
        quote: extra.quote || "",
        card_title: extra.card_title || "",
        card_text: extra.card_text || "",
      });
      setStats(
        (Array.isArray(extra.stats) ? extra.stats : []).map((st) => ({
          value: st.value ?? "",
          suffix: st.suffix ?? "",
          label: st.label ?? "",
        })),
      );

      setImageFile(null);
      setImageUrl(found?.image_url || null);
      setRemoveImage(false);
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

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const setStat = (i, key, value) =>
    setStats((list) => list.map((st, x) => (x === i ? { ...st, [key]: value } : st)));

  const moveStat = (from, to) =>
    setStats((list) => {
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const save = async () => {
    if (!block) {
      setError("This content block does not exist yet. Run the seeder, or add it under Website Content.");
      return;
    }

    setSaving(true);
    try {
      // Keep any other keys the block carries; only these are edited here.
      const extra = {
        ...(block.extra_data || {}),
        stats: stats
          .filter((st) => String(st.value).trim() || st.label.trim())
          .map((st) => {
            // Store a plain number when it is one, so the site can count up to
            // it. Anything else is kept verbatim and simply shown as typed.
            const asNumber = Number(String(st.value).trim());
            return {
              value:
                String(st.value).trim() !== "" && Number.isFinite(asNumber)
                  ? asNumber
                  : String(st.value).trim(),
              suffix: st.suffix.trim(),
              label: st.label.trim(),
            };
          }),
        quote: form.quote.trim(),
        card_title: form.card_title.trim(),
        card_text: form.card_text.trim(),
      };

      const payload = {
        subtitle: form.subtitle.trim(),
        title: form.title.trim(),
        body: form.body.trim(),
        extra_data: JSON.stringify(extra),
      };

      if (imageFile) payload.image = imageFile;
      else if (removeImage) payload.remove_image = "true";

      await content.update(block.id, payload);
      toast.success("About page saved");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Loading the about page…" />;

  const SaveButton = () => (
    <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
      {saving ? <Spinner /> : <Save size={16} />}
      {saving ? "Saving…" : "Save changes"}
    </button>
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1>About Page</h1>
          <div className="sub">
            The &ldquo;15 Years of Cultivating Trust&rdquo; section, top to bottom.
          </div>
        </div>
        <SaveButton />
      </div>

      <Alert tone="error">{error}</Alert>

      {!block && (
        <Alert tone="info">
          No <code>about / trust_section</code> block was found in this database, so
          the website is showing the wording it ships with. Add the block under{" "}
          <Link to="/content">Website Content</Link> to edit it here.
        </Alert>
      )}

      <div className="card">
        <div className="card-head">
          <h2>Heading</h2>
        </div>
        <div className="card-body">
          <Field
            label="Pill label"
            name="subtitle"
            value={form.subtitle}
            onChange={change}
            placeholder="Our Legacy"
            maxLength={60}
            hint="The small gold badge above the heading. Left blank the site shows “Our Legacy”."
          />

          <Field
            label="Heading"
            name="title"
            value={form.title}
            onChange={change}
            placeholder="15 Years of Cultivating Trust"
            maxLength={200}
          />

          <Field
            label="Paragraph"
            name="body"
            as="textarea"
            rows={4}
            value={form.body}
            onChange={change}
            hint="The block of copy under the heading."
          />
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-head">
          <div>
            <h2>Counters</h2>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
              The figures that count up as the section scrolls into view.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setStats((list) => [...list, blankStat()])}
            disabled={stats.length >= MAX_STATS}
          >
            <Plus size={14} />
            Add counter
          </button>
        </div>
        <div className="card-body">
          {stats.length === 0 ? (
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
              None set, so the site shows the two it was designed with — 15+ years
              experience and 7-8 average team tenure.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {stats.map((st, i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    padding: 14,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div className="row" style={{ flexWrap: "nowrap", alignItems: "center" }}>
                    <input
                      className="input"
                      value={st.value}
                      placeholder="15"
                      aria-label={`Counter ${i + 1} number`}
                      onChange={(e) => setStat(i, "value", e.target.value)}
                      style={{ width: 96, flex: "0 0 auto", textAlign: "center" }}
                    />
                    <input
                      className="input"
                      value={st.suffix}
                      placeholder="+"
                      maxLength={6}
                      aria-label={`Counter ${i + 1} suffix`}
                      onChange={(e) => setStat(i, "suffix", e.target.value)}
                      style={{ width: 76, flex: "0 0 auto", textAlign: "center" }}
                    />
                    <input
                      className="input"
                      value={st.label}
                      placeholder="Years Experience"
                      maxLength={60}
                      aria-label={`Counter ${i + 1} label`}
                      onChange={(e) => setStat(i, "label", e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-icon"
                      title="Move up"
                      aria-label="Move up"
                      disabled={i === 0}
                      onClick={() => moveStat(i, i - 1)}
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      title="Move down"
                      aria-label="Move down"
                      disabled={i === stats.length - 1}
                      onClick={() => moveStat(i, i + 1)}
                    >
                      <ChevronDown size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon danger"
                      title="Remove"
                      aria-label="Remove"
                      onClick={() => setStats((list) => list.filter((_, x) => x !== i))}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Shows as{" "}
                    <strong style={{ color: "var(--ink-2)" }}>
                      {`${st.value || "0"}${st.suffix || ""}`}
                    </strong>{" "}
                    over &ldquo;{st.label || "…"}&rdquo;
                    {String(st.value).trim() !== "" &&
                      !Number.isFinite(Number(String(st.value).trim())) && (
                        <> · not a number, so it is shown as typed instead of counting up</>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {stats.length >= 3 && (
            <p style={{ marginTop: 12, marginBottom: 0, fontSize: 12, color: "var(--muted)" }}>
              The row was drawn for two. A third and fourth still fit, but they get
              tight on a phone.
            </p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-head">
          <h2>Pull quote</h2>
        </div>
        <div className="card-body">
          <Field
            label="Quote"
            name="quote"
            as="textarea"
            rows={3}
            value={form.quote}
            onChange={change}
            placeholder="Our commitment extends beyond transactions…"
            hint="Italic, against the gold rule under the counters. The quotation marks are added by the site — type the words only."
          />
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-head">
          <h2>Photograph &amp; floating card</h2>
        </div>
        <div className="card-body">
          <ImagePicker
            label="Photograph"
            value={removeImage ? null : imageUrl}
            file={imageFile}
            hint="Fills the right-hand side and drifts slightly as the page scrolls."
            onPick={(f) => {
              setImageFile(f);
              setRemoveImage(false);
            }}
            onClear={() => {
              setImageFile(null);
              setRemoveImage(true);
            }}
          />

          <div style={{ marginTop: 18 }}>
            <Field
              label="Card heading"
              name="card_title"
              value={form.card_title}
              onChange={change}
              placeholder="Certified Stability"
              maxLength={60}
              hint="The white card sitting over the bottom-left of the photograph."
            />

            <Field
              label="Card text"
              name="card_text"
              as="textarea"
              rows={3}
              value={form.card_text}
              onChange={change}
              placeholder="We understand your dream of a second home surrounded by nature."
              hint="Two short lines fit the card. Longer text makes it taller."
            />
          </div>
        </div>
      </div>

      <div className="row" style={{ justifyContent: "flex-end", marginTop: 18 }}>
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
        The Core Philosophy cards below this section are in{" "}
        <Link to="/cms/philosophy-cards" style={{ color: "var(--green-600)" }}>
          CMS &rarr; Core Philosophy
        </Link>
        .
      </p>

      <p
        style={{
          marginTop: 8,
          fontSize: 12,
          color: "var(--muted)",
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        <Award size={14} />
        Every field here falls back on its own — clear one and the site restores just
        that piece.
      </p>
    </>
  );
}
