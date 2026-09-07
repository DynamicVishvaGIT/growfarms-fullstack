import { createElement, useMemo } from "react";

import { normalizeBlogContent, sanitizeToBody } from "../lib/blogContent";

/**
 * Renders a blog body on the dark green article background.
 *
 * The sanitized markup is walked into real React elements rather than handed
 * to `dangerouslySetInnerHTML`, which keeps a sanitizer slip from ever
 * becoming live markup and lets every tag carry the page's own type styles.
 */

const CLASSES = {
  p: "mb-5 last:mb-0",
  h2: "font-display text-xl sm:text-2xl lg:text-[28px] font-medium text-[#F4EDE1] mt-10 first:mt-0 mb-3 leading-snug",
  h3: "font-display text-lg sm:text-xl font-medium text-[#F4EDE1] mt-9 first:mt-0 mb-2.5 leading-snug",
  h4: "text-base sm:text-lg font-semibold text-[#F4EDE1] mt-7 first:mt-0 mb-2",
  h5: "text-[15px] font-semibold text-[#F4EDE1] mt-6 first:mt-0 mb-2",
  h6: "text-sm font-semibold uppercase tracking-wide text-[#B9C4AE] mt-6 first:mt-0 mb-2",
  ul: "mb-5 pl-5 list-disc marker:text-[#C7DDB5] space-y-2",
  ol: "mb-5 pl-5 list-decimal marker:text-[#C7DDB5] space-y-2",
  li: "pl-1",
  blockquote:
    "my-7 border-l-2 border-[#C7DDB5]/60 pl-4 sm:pl-6 italic text-[#EDE7D9] [&>p]:mb-0",
  a: "text-[#C7DDB5] underline decoration-[#C7DDB5]/50 underline-offset-2 transition-colors hover:decoration-[#C7DDB5]",
  strong: "font-semibold text-[#F4EDE1]",
  b: "font-semibold text-[#F4EDE1]",
  em: "italic",
  i: "italic",
  u: "underline underline-offset-2",
  hr: "my-9 border-0 h-px bg-[#EDE7D9]/15",
  img: "rounded-2xl my-7 w-full object-cover shadow-xl shadow-black/20",
  figure: "my-7",
  figcaption: "mt-2.5 text-xs sm:text-[13px] text-[#B9C4AE] text-center",
  code: "rounded bg-black/25 px-1.5 py-0.5 text-[0.9em] font-mono text-[#E8D9B8]",
  pre: "my-6 overflow-x-auto rounded-xl bg-black/25 p-4 text-[13px] font-mono text-[#E8D9B8] [&>code]:bg-transparent [&>code]:p-0",
  table: "my-6 w-full border-collapse text-left text-sm",
  th: "border-b border-[#EDE7D9]/20 px-3 py-2 font-semibold text-[#F4EDE1]",
  td: "border-b border-[#EDE7D9]/10 px-3 py-2 align-top",
};

const VOID_TAGS = new Set(["br", "hr", "img"]);

function toReact(node, key) {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const tag = node.tagName.toLowerCase();
  const props = { key };
  if (CLASSES[tag]) props.className = CLASSES[tag];

  if (tag === "a") {
    const href = node.getAttribute("href");
    if (!href) return Array.from(node.childNodes).map(toReact);
    props.href = href;
    // Outbound links leave the site; same-page anchors must not.
    if (!href.startsWith("#")) {
      props.target = "_blank";
      props.rel = "noopener noreferrer";
    }
  }

  if (tag === "img") {
    const src = node.getAttribute("src");
    if (!src) return null;
    props.src = src;
    props.alt = node.getAttribute("alt") || "";
    props.loading = "lazy";
  }

  if (VOID_TAGS.has(tag)) return createElement(tag, props);

  const children = Array.from(node.childNodes)
    .map((child, i) => toReact(child, i))
    .filter((child) => child !== null && child !== "");

  return createElement(tag, props, children.length ? children : null);
}

export default function BlogContent({ raw, className = "" }) {
  const nodes = useMemo(() => {
    const body = sanitizeToBody(normalizeBlogContent(raw));
    if (!body) return null;
    return Array.from(body.childNodes)
      .map((node, i) => toReact(node, i))
      .filter((node) => node !== null && String(node).trim() !== "");
  }, [raw]);

  if (!nodes || !nodes.length) return null;

  return (
    <div
      className={`text-[#D8CFBB] text-[14px] sm:text-[15px] lg:text-base leading-relaxed ${className}`}
    >
      {nodes}
    </div>
  );
}
