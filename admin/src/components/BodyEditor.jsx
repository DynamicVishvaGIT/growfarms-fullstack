import { useMemo, useRef, useState } from "react";
import {
  Bold,
  Code,
  Eye,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pencil,
  Quote,
} from "lucide-react";

import {
  normalizeBlogContent,
  sanitizeBlogHtml,
  readingTimeMinutes,
  wordCount,
} from "../lib/blogContent";

/**
 * The blog body field.
 *
 * The body used to be a bare textarea whose hint promised HTML support, so
 * authors typed plain prose and had no way to tell what the article would look
 * like. This adds the two things that were missing: shortcuts that insert the
 * markup the site understands, and a preview rendered through the very same
 * pipeline the website uses, so what shows here is what ships.
 */

/** Wrap the selection, or drop the marker in and put the caret inside it. */
function wrapSelection(text, start, end, before, after, placeholder) {
  const selected = text.slice(start, end) || placeholder;
  return {
    value: text.slice(0, start) + before + selected + after + text.slice(end),
    selectionStart: start + before.length,
    selectionEnd: start + before.length + selected.length,
  };
}

/** Prefix every line the selection touches — headings, bullets, quotes. */
function prefixLines(text, start, end, makePrefix) {
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const lineEndIndex = text.indexOf("\n", end);
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;

  const block = text.slice(lineStart, lineEnd) || "Text";
  const prefixed = block
    .split("\n")
    .map((line, i) => `${makePrefix(i)}${line.replace(/^(#{1,4}\s+|[-*]\s+|\d+[.)]\s+|>\s?)/, "")}`)
    .join("\n");

  return {
    value: text.slice(0, lineStart) + prefixed + text.slice(lineEnd),
    selectionStart: lineStart,
    selectionEnd: lineStart + prefixed.length,
  };
}

const TOOLS = [
  { key: "h2", icon: Heading2, title: "Heading", run: (t, s, e) => prefixLines(t, s, e, () => "## ") },
  { key: "h3", icon: Heading3, title: "Subheading", run: (t, s, e) => prefixLines(t, s, e, () => "### ") },
  { key: "bold", icon: Bold, title: "Bold", run: (t, s, e) => wrapSelection(t, s, e, "**", "**", "bold text") },
  { key: "italic", icon: Italic, title: "Italic", run: (t, s, e) => wrapSelection(t, s, e, "*", "*", "italic text") },
  { key: "ul", icon: List, title: "Bulleted list", run: (t, s, e) => prefixLines(t, s, e, () => "- ") },
  { key: "ol", icon: ListOrdered, title: "Numbered list", run: (t, s, e) => prefixLines(t, s, e, (i) => `${i + 1}. `) },
  { key: "quote", icon: Quote, title: "Quote", run: (t, s, e) => prefixLines(t, s, e, () => "> ") },
  { key: "code", icon: Code, title: "Inline code", run: (t, s, e) => wrapSelection(t, s, e, "`", "`", "code") },
  {
    key: "link",
    icon: Link2,
    title: "Link",
    run: (t, s, e) => {
      const selected = t.slice(s, e) || "link text";
      const inserted = `[${selected}](https://)`;
      return {
        value: t.slice(0, s) + inserted + t.slice(e),
        // Land the caret on the URL, which is the part still to be filled in.
        selectionStart: s + selected.length + 3,
        selectionEnd: s + inserted.length - 1,
      };
    },
  },
];

export default function BodyEditor({ value = "", onChange, error, name = "content" }) {
  const [tab, setTab] = useState("write");
  const areaRef = useRef(null);

  const previewHtml = useMemo(
    () => sanitizeBlogHtml(normalizeBlogContent(value)),
    [value],
  );
  const words = useMemo(() => wordCount(value), [value]);
  const minutes = useMemo(() => readingTimeMinutes(value), [value]);

  const applyTool = (tool) => {
    const area = areaRef.current;
    if (!area) return;

    const next = tool.run(area.value, area.selectionStart, area.selectionEnd);
    onChange(next.value);

    // React owns the value, so the caret has to be restored after it repaints.
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(next.selectionStart, next.selectionEnd);
    });
  };

  return (
    <div className="field">
      <div className="editor-head">
        <label htmlFor={name}>Body</label>
        <div className="editor-tabs">
          <button
            type="button"
            className={tab === "write" ? "active" : ""}
            onClick={() => setTab("write")}
          >
            <Pencil size={13} />
            Write
          </button>
          <button
            type="button"
            className={tab === "preview" ? "active" : ""}
            onClick={() => setTab("preview")}
          >
            <Eye size={13} />
            Preview
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <>
          <div className="editor-toolbar">
            {TOOLS.map((tool) => (
              <button
                key={tool.key}
                type="button"
                title={tool.title}
                aria-label={tool.title}
                onClick={() => applyTool(tool)}
              >
                <tool.icon size={15} />
              </button>
            ))}
          </div>

          <textarea
            id={name}
            name={name}
            ref={areaRef}
            className={`textarea editor-area${error ? " invalid" : ""}`}
            rows={18}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={"Write the article here.\n\nLeave a blank line between paragraphs. Use ## for a heading and - for a bullet."}
          />
        </>
      ) : (
        <div className="blog-preview">
          {previewHtml ? (
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          ) : (
            <p className="blog-preview-empty">Nothing to preview yet.</p>
          )}
        </div>
      )}

      <div className="editor-foot">
        <span>
          Blank line between paragraphs. <code>##</code> heading, <code>-</code> bullet,
          <code>**bold**</code>, <code>[text](url)</code>. Pasted HTML works too.
        </span>
        <span className="editor-count">
          {words.toLocaleString()} {words === 1 ? "word" : "words"}
          {minutes ? ` · ${minutes} min read` : ""}
        </span>
      </div>

      {error && <div className="error">{error}</div>}
    </div>
  );
}
