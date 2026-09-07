/**
 * Blog body helpers.
 *
 * The admin stores `content` as a single TEXT column and authors put two very
 * different things in it: basic HTML (what the form's hint promises) and plain
 * typed prose pasted out of a doc, which arrives as `\r\n` separated lines with
 * no markup at all. Both have to render as a real article, so everything the
 * page shows goes through `normalizeBlogContent` → `sanitizeBlogHtml` first.
 *
 * The admin preview imports its own copy of these rules (admin/src/lib) so the
 * two apps stay independently buildable; keep the two files in step.
 */

/** A body containing any of these is treated as already-authored HTML. */
const BLOCK_HTML_RE =
  /<(p|div|h[1-6]|ul|ol|li|blockquote|figure|img|br|hr|table|section|article|pre)\b/i;

const SAFE_URL_RE = /^(https?:|mailto:|tel:|\/|\.\/|#)/i;

/* ── Plain text → HTML ───────────────────────────────────────────────────── */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Turn bare http(s) URLs into links; run after escaping, never before. */
function autolink(html) {
  return html.replace(
    /(^|[\s(])((?:https?:\/\/)[^\s<)]+[^\s<).,;:!?])/g,
    (_, lead, url) => `${lead}<a href="${url}">${url}</a>`,
  );
}

/**
 * Light inline markup, so an author never has to type HTML for the common
 * cases. It runs on already-escaped text and every tag it produces is one we
 * build ourselves, so nothing an author writes can become markup on its own.
 */
function emphasis(html) {
  // The `\S…\S` shape is what keeps "4 * 5 * 6" from turning into italics:
  // like markdown, a delimiter only counts when it hugs the text it marks.
  return html
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*(\S(?:[^*\n]*\S)?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*(\S(?:[^*\n]*\S)?)\*(?=[\s.,;:!?)]|$)/g, "$1<em>$2</em>")
    .replace(/(^|[\s(])_(\S(?:[^_\n]*\S)?)_(?=[\s.,;:!?)]|$)/g, "$1<em>$2</em>");
}

const LINK_MD_RE = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;

function inline(s) {
  let out = escapeHtml(s.trim());

  // `[text](url)` is parked behind a placeholder so autolink cannot rewrite
  // the URL sitting inside it. The markers are private-use code points, so
  // no body anyone actually typed can collide with them.
  const links = [];
  out = out.replace(LINK_MD_RE, (match, text, url) => {
    if (!SAFE_URL_RE.test(url)) return match;
    links.push(`<a href="${url}">${text}</a>`);
    return `\uE000${links.length - 1}\uE001`;
  });

  out = emphasis(autolink(out));
  return out.replace(/\uE000(\d+)\uE001/g, (_, i) => links[Number(i)]);
}

/**
 * A line that reads like a section title rather than a sentence: short, and
 * either a question or with no sentence-ending punctuation at all.
 */
function looksLikeHeading(line) {
  const t = line.trim();
  if (!t || t.length > 90) return false;
  return /[?:]$/.test(t) || !/[.!?;,]$/.test(t);
}

/**
 * A paragraph that is really a bullet the author typed on its own line — the
 * shape you get when a list is pasted out of a document with blank lines
 * between the items. Only merged into a list when several appear in a row.
 */
function looksLikeBareItem(block) {
  if (block.includes("\n")) return false;
  const t = block.trim();
  return Boolean(t) && t.length <= 60 && !/[.!?:;,]$/.test(t) && !/^[-*•>#\d]/.test(t);
}

const BULLET_RE = /^[-*•]\s+/;
const NUMBER_RE = /^\d+[.)]\s+/;
const QUOTE_RE = /^>\s?/;
const HEADING_RE = /^#{1,4}\s+/;
const MARKERS = [HEADING_RE, BULLET_RE, NUMBER_RE, QUOTE_RE];

/**
 * Render one blank-line separated block by scanning it into runs of like
 * lines, so a block can mix a heading with the list that belongs under it.
 */
function renderBlock(block) {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  const out = [];
  let i = 0;

  const runOf = (re) => {
    const run = [];
    while (i < lines.length && re.test(lines[i])) {
      run.push(lines[i].replace(re, ""));
      i += 1;
    }
    return run;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (HEADING_RE.test(line)) {
      const level = Math.min(4, Math.max(2, line.match(/^#+/)[0].length + 1));
      out.push(`<h${level}>${inline(line.replace(HEADING_RE, ""))}</h${level}>`);
      i += 1;
      continue;
    }

    if (BULLET_RE.test(line)) {
      out.push(`<ul>${runOf(BULLET_RE).map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`);
      continue;
    }

    if (NUMBER_RE.test(line)) {
      out.push(`<ol>${runOf(NUMBER_RE).map((l) => `<li>${inline(l)}</li>`).join("")}</ol>`);
      continue;
    }

    if (QUOTE_RE.test(line)) {
      const quoted = runOf(QUOTE_RE).map(inline).join("<br />");
      out.push(`<blockquote><p>${quoted}</p></blockquote>`);
      continue;
    }

    // A run of ordinary prose lines.
    const run = [];
    while (i < lines.length && !MARKERS.some((re) => re.test(lines[i]))) {
      run.push(lines[i]);
      i += 1;
    }

    // "Title line, then the paragraph that belongs under it" — one block in
    // the source, two elements on the page.
    if (!out.length && run.length > 1 && looksLikeHeading(run[0])) {
      out.push(`<h3>${inline(run[0])}</h3>`);
      run.shift();
    }
    if (run.length) out.push(`<p>${run.map(inline).join("<br />")}</p>`);
  }

  return out.join("");
}

function plainTextToHtml(text) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const out = [];

  for (let i = 0; i < blocks.length; i += 1) {
    if (looksLikeBareItem(blocks[i])) {
      let end = i;
      while (end < blocks.length && looksLikeBareItem(blocks[end])) end += 1;
      if (end - i >= 2) {
        const items = blocks.slice(i, end).map((b) => `<li>${inline(b)}</li>`).join("");
        out.push(`<ul>${items}</ul>`);
        i = end - 1;
        continue;
      }
    }
    out.push(renderBlock(blocks[i]));
  }

  return out.join("\n");
}

/** Body as it was stored → HTML ready to be sanitized and rendered. */
export function normalizeBlogContent(raw) {
  const text = String(raw ?? "").replace(/\r\n?/g, "\n").trim();
  if (!text) return "";
  return BLOCK_HTML_RE.test(text) ? text : plainTextToHtml(text);
}

/* ── Sanitizing ──────────────────────────────────────────────────────────── */

/** Tag → attributes kept on it. Anything absent is unwrapped, not trusted. */
export const ALLOWED_TAGS = {
  p: [], br: [], hr: [], strong: [], b: [], em: [], i: [], u: [], s: [], sup: [], sub: [],
  h2: [], h3: [], h4: [], h5: [], h6: [],
  ul: [], ol: [], li: [],
  blockquote: [], figure: [], figcaption: [], span: [],
  code: [], pre: [],
  a: ["href", "title"],
  img: ["src", "alt"],
  table: [], thead: [], tbody: [], tr: [], th: [], td: [],
};

/** Removed with their contents — unwrapping these would leak code as text. */
const DROP_WITH_CONTENT = new Set([
  "script", "style", "iframe", "object", "embed", "link", "meta", "form",
  "input", "button", "select", "textarea", "svg", "math", "noscript", "template",
]);

function scrubUrl(value) {
  const v = String(value || "").trim();
  return SAFE_URL_RE.test(v) ? v : null;
}

function scrubElement(el) {
  const tag = el.tagName.toLowerCase();

  if (DROP_WITH_CONTENT.has(tag)) {
    el.remove();
    return;
  }

  // Children first: unwrapping the parent below must not skip them.
  Array.from(el.children).forEach(scrubElement);

  if (!Object.prototype.hasOwnProperty.call(ALLOWED_TAGS, tag)) {
    el.replaceWith(...Array.from(el.childNodes));
    return;
  }

  const keep = ALLOWED_TAGS[tag];
  Array.from(el.attributes).forEach((attr) => {
    const name = attr.name.toLowerCase();
    if (!keep.includes(name)) {
      el.removeAttribute(attr.name);
      return;
    }
    if (name === "href" || name === "src") {
      const safe = scrubUrl(attr.value);
      if (safe) el.setAttribute(name, safe);
      else el.removeAttribute(attr.name);
    }
  });
}

/**
 * Strip everything outside the allowlist. Returns a detached <body> so callers
 * can walk real nodes instead of re-parsing a string; `null` off the browser.
 */
export function sanitizeToBody(html) {
  if (!html || typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  Array.from(doc.body.children).forEach(scrubElement);
  return doc.body;
}

export function sanitizeBlogHtml(html) {
  const body = sanitizeToBody(html);
  if (body) return body.innerHTML;
  // No DOM available: show the text, never the markup.
  return html ? `<p>${escapeHtml(String(html).replace(/<[^>]*>/g, " "))}</p>` : "";
}

/* ── Derived values ──────────────────────────────────────────────────────── */

/** Body as one line of readable text — for meta descriptions and previews. */
export function blogPlainText(raw, limit = 0) {
  const text = normalizeBlogContent(raw)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  if (!limit || text.length <= limit) return text;
  return `${text.slice(0, limit).replace(/\s+\S*$/, "")}…`;
}

export function wordCount(raw) {
  const text = blogPlainText(raw);
  return text ? text.split(/\s+/).length : 0;
}

/** Whole minutes at an average reading pace, never below 1 for a real body. */
export function readingTimeMinutes(raw) {
  const words = wordCount(raw);
  return words ? Math.max(1, Math.round(words / 200)) : 0;
}
