import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Save, Plus, Trash2, ChevronUp, ChevronDown, ExternalLink,
  Mail, Phone, MapPin, Clock, MessageCircle, ArrowUpRight,
} from "lucide-react";

import { content, settings as settingsApi } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import { Loading, Alert, Field, Spinner, EmptyState } from "../components/ui";

/**
 * Admin → Contact Page.
 *
 * The three cards above the contact form used to be editable only as raw JSON
 * inside Website Content, and the map had no link to open — this page gives
 * both a proper form. Cards are stored on the `contact.info_cards` block's
 * `extra_data.cards`; the two map fields are plain settings.
 */

const PAGE = "contact";
const SECTION_KEY = "info_cards";

/** The icons the public card can draw, keyed by what is stored. */
const ICON_OPTIONS = [
  ["mail", "Envelope — email"],
  ["phone", "Handset — phone"],
  ["map", "Pin — address"],
  ["clock", "Clock — opening hours"],
  ["message", "Speech bubble — enquiries"],
];

const ICON_PREVIEW = {
  mail: Mail,
  phone: Phone,
  map: MapPin,
  clock: Clock,
  message: MessageCircle,
};

/**
 * The card is drawn inside a fixed vector shape, so its text has a budget.
 * Past these the site still wraps the text rather than spilling it, but the
 * card grows taller than the two beside it — worth warning about here.
 */
const LINE_CHARS = 38;
const COMFORTABLE_LINES = 2;
const MAX_CARDS = 6;

/**
 * Cards are edited with their lines as one block of text — trimming that to an
 * array on every keystroke would swallow the newline the moment it is typed —
 * so `linesText` is the editing shape and `lines` the stored one.
 */
const blankCard = () => ({ icon: "mail", title: "", linesText: "", link: "" });

/**
 * What the page was designed around. Offered as a starting point when the
 * block has no cards saved, and — because a card row with nothing in it would
 * be a hole in the page — what the website itself falls back to.
 */
const DEFAULT_CARDS = [
  { icon: "mail", title: "Mail us 24/7", linesText: "", link: "" },
  { icon: "phone", title: "Call us 24/7", linesText: "", link: "" },
  { icon: "map", title: "Our Locations", linesText: "", link: "" },
];

const textToLines = (text) =>
  String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/**
 * Accept whatever gets pasted out of Google Maps. "Embed a map" hands over a
 * whole `<iframe …>` snippet and "Share" hands over an ordinary maps link;
 * neither is what the iframe's src needs, and a plain share link renders as a
 * refused-to-connect box, which is how this field usually goes wrong.
 */
export function toEmbedUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";

  const fromIframe = value.match(/src=["']([^"']+)["']/i);
  if (fromIframe) return fromIframe[1];

  if (!/^https?:\/\//i.test(value)) return value;
  if (/\/maps\/embed/i.test(value) || /[?&]output=embed/i.test(value)) return value;
  if (/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl)\//i.test(value)) return value; // can't be embedded

  if (/^https?:\/\/(www\.)?google\.[^/]+\/maps/i.test(value)) {
    return `${value}${value.includes("?") ? "&" : "?"}output=embed`;
  }

  return value;
}

/** Short links resolve in a browser but never inside an iframe. */
const isShortLink = (url) => /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl)\//i.test(String(url).trim());

function CardEditor({ card, index, total, onChange, onMove, onRemove }) {
  const Icon = ICON_PREVIEW[card.icon] || Mail;
  const lines = textToLines(card.linesText);
  const longLines = lines.filter((l) => l.length > LINE_CHARS);

  const set = (key, value) => onChange({ ...card, [key]: value });

  return (
    <div className="card">
      <div className="card-head">
        <div className="row" style={{ gap: 10, alignItems: "center" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#1e3a2b",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            <Icon size={15} />
          </span>
          <div>
            <h2>{card.title || `Card ${index + 1}`}</h2>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
              Position {index + 1} of {total}
            </div>
          </div>
        </div>

        <div className="row" style={{ gap: 4 }}>
          <button
            type="button"
            className="btn-icon"
            title="Move up"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            className="btn-icon"
            title="Move down"
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
          >
            <ChevronDown size={16} />
          </button>
          <button
            type="button"
            className="btn-icon danger"
            title="Remove this card"
            onClick={() => onRemove(index)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="form-grid">
          <Field
            label="Heading"
            name={`card-title-${index}`}
            value={card.title || ""}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Mail us 24/7"
            maxLength={40}
          />
          <Field
            label="Icon"
            name={`card-icon-${index}`}
            as="select"
            value={card.icon || "mail"}
            onChange={(e) => set("icon", e.target.value)}
          >
            {ICON_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Field>
        </div>

        <Field
          label="Lines"
          name={`card-lines-${index}`}
          as="textarea"
          rows={3}
          value={card.linesText || ""}
          onChange={(e) => set("linesText", e.target.value)}
          placeholder={"info@growfarms.co\nsales@growfarms.co"}
          hint={
            lines.length === 0
              ? `Left empty, the site fills this card from Settings → Contact details (emails, phones or the address, matching the icon above).`
              : `One entry per line. ${COMFORTABLE_LINES} lines of up to ${LINE_CHARS} characters fit the card design.`
          }
        />

        {(longLines.length > 0 || lines.length > COMFORTABLE_LINES) && (
          <Alert tone="info">
            {longLines.length > 0 && (
              <>
                {longLines.length === 1 ? "One line is" : `${longLines.length} lines are`} longer
                than {LINE_CHARS} characters.{" "}
              </>
            )}
            {lines.length > COMFORTABLE_LINES && (
              <>This card has {lines.length} lines. </>
            )}
            The text wraps instead of spilling out of the card, but the card grows taller than
            its neighbours — shorten it to keep the row even.
          </Alert>
        )}

        <Field
          label="Arrow button link"
          name={`card-link-${index}`}
          value={card.link || ""}
          onChange={(e) => set("link", e.target.value)}
          placeholder="https://maps.google.com/… · mailto:info@growfarms.co · tel:+919999999999"
          hint="Where the small arrow in the card's corner goes. Left empty, an email or phone card links to its first line and an address card opens the map link below."
        />
      </div>
    </div>
  );
}

export default function ContactPage() {
  const toast = useToast();

  const [block, setBlock] = useState(null);
  const [cards, setCards] = useState([]);
  const [mapEmbed, setMapEmbed] = useState("");
  const [mapLink, setMapLink] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, settingRows] = await Promise.all([
        content.list({ page: PAGE }),
        settingsApi.list({ group: "contact" }),
      ]);

      const found = rows.find((r) => r.section_key === SECTION_KEY) || null;
      setBlock(found);
      setCards(
        (found?.extra_data?.cards || []).map((c) => ({
          icon: c.icon || "mail",
          title: c.title || "",
          linesText: Array.isArray(c.lines) ? c.lines.join("\n") : "",
          link: c.link || "",
        })),
      );

      const byKey = Object.fromEntries(settingRows.map((s) => [s.key, s.value ?? ""]));
      setMapEmbed(byKey.google_map_embed ?? "");
      setMapLink(byKey.google_map_link ?? "");

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

  const updateCard = (index, next) =>
    setCards((list) => list.map((c, i) => (i === index ? next : c)));

  const moveCard = (index, delta) =>
    setCards((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const removeCard = (index) => setCards((list) => list.filter((_, i) => i !== index));

  const addCard = () => setCards((list) => [...list, blankCard()]);

  const save = async () => {
    setSaving(true);
    try {
      // Keep any other keys the block carries; only the cards are edited here.
      const stored = cards.map((c) => ({
        icon: c.icon || "mail",
        title: c.title.trim(),
        lines: textToLines(c.linesText),
        link: c.link.trim(),
      }));

      const extra = { ...(block?.extra_data || {}), cards: stored };
      const payload = { extra_data: JSON.stringify(extra) };

      if (block) {
        await content.update(block.id, payload);
      } else {
        // A database seeded before this block existed has no row to edit.
        await content.create({
          page: PAGE,
          section_key: SECTION_KEY,
          label: "Contact info cards",
          ...payload,
        });
      }

      // `google_map_link` only exists on databases that have had the
      // migration run; bulkUpdate skips unknown keys rather than failing.
      await settingsApi.bulkUpdate({
        google_map_embed: toEmbedUrl(mapEmbed),
        google_map_link: mapLink.trim(),
      });

      toast.success("Contact page saved");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Loading the contact page…" />;

  const normalisedEmbed = toEmbedUrl(mapEmbed);
  const embedChanged = Boolean(mapEmbed.trim()) && normalisedEmbed !== mapEmbed.trim();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Contact Page</h1>
          <div className="sub">
            The cards above the enquiry form, and the map at the bottom of the page.
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <Spinner /> : <Save size={16} />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <Alert tone="error">{error}</Alert>

      <Alert tone="info">
        The email addresses, phone numbers and office address themselves live in{" "}
        <Link to="/settings">Settings → Contact details</Link>, which the footer reads too.
        A card left with no lines shows those values; typing lines here overrides them for
        this card only.
      </Alert>

      {cards.length === 0 && (
        <div className="card">
          <EmptyState
            icon={MapPin}
            title="No cards saved for this page"
            hint="With none saved the website falls back to the three cards it was designed around, filled from Settings → Contact details. Start from those to edit them here."
          />
          <div className="card-body" style={{ paddingTop: 0 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setCards(DEFAULT_CARDS.map((c) => ({ ...c })))}
            >
              <Plus size={15} />
              Start from the three default cards
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        {cards.map((card, index) => (
          <CardEditor
            // Cards have no id of their own, and the arrows reorder them, so
            // the index is genuinely the identity here.
            key={index}
            card={card}
            index={index}
            total={cards.length}
            onChange={(next) => updateCard(index, next)}
            onMove={moveCard}
            onRemove={removeCard}
          />
        ))}
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={addCard}
          disabled={cards.length >= MAX_CARDS}
        >
          <Plus size={15} />
          Add card
        </button>
        {cards.length >= 4 && (
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            The row is three cards wide — a fourth wraps onto a second line.
          </span>
        )}
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <div className="card-head">
          <div>
            <h2>Map</h2>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
              The full-width map under the enquiry form.
            </div>
          </div>
          {mapLink.trim() && (
            <a
              href={mapLink.trim()}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-sm"
            >
              <ExternalLink size={14} />
              Test link
            </a>
          )}
        </div>

        <div className="card-body">
          <Field
            label="Map embed URL"
            name="google_map_embed"
            as="textarea"
            rows={2}
            value={mapEmbed}
            onChange={(e) => setMapEmbed(e.target.value)}
            placeholder="https://www.google.com/maps/embed?pb=…"
            hint="From Google Maps → Share → Embed a map. Paste the whole <iframe> snippet if that is easier — the src is pulled out of it when you save."
          />

          {embedChanged && (
            <Alert tone="info">
              Saved as <code style={{ wordBreak: "break-all" }}>{normalisedEmbed}</code>
            </Alert>
          )}

          {isShortLink(normalisedEmbed) && (
            <Alert tone="error">
              A <code>maps.app.goo.gl</code> short link cannot be embedded — it will render as an
              empty grey box. Use Share → <strong>Embed a map</strong> and paste that snippet
              instead. The short link is fine in the field below.
            </Alert>
          )}

          <Field
            label="Map link"
            name="google_map_link"
            value={mapLink}
            onChange={(e) => setMapLink(e.target.value)}
            placeholder="https://www.google.com/maps/place/…"
            hint="Opened in a new tab by the address card's arrow and by the map's own button. From Google Maps → Share → Send a link."
          />

          {normalisedEmbed && !isShortLink(normalisedEmbed) && (
            <div className="field">
              <label>Preview</label>
              <iframe
                title="Map preview"
                src={normalisedEmbed}
                style={{
                  width: "100%",
                  height: 260,
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="hint">
                This is the live map — a grey or blocked frame here means the URL is not an
                embed URL.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="row" style={{ justifyContent: "flex-end", marginTop: 18 }}>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <Spinner /> : <Save size={16} />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <p style={{ marginTop: 18, fontSize: 12, color: "var(--muted)", display: "flex", gap: 6, alignItems: "center" }}>
        <ArrowUpRight size={14} />
        The banner heading and image for this page are in Website Content → Contact.
      </p>
    </>
  );
}
