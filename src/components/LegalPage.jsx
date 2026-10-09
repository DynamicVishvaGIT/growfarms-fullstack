import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUp, ChevronDown } from "lucide-react";

import ContactBanner from "../assets/images/Contact_banner.png";
import logo_img from "../assets/images/grow-farms-logo.png";

gsap.registerPlugin(ScrollTrigger);

/**
 * The shared layout behind the Privacy Policy and Terms and Conditions pages.
 *
 * Each page supplies its text as `sections`: a heading plus a list of blocks,
 * where a block is one of
 *   - a paragraph (string or JSX),
 *   - `{ list }`     — bullets; an item may be `[boldLabel, text]`,
 *   - `{ clauses }`  — numbered clauses, each `[number, text]`,
 *   - `{ details }`  — contact cards, each `{ icon, label, value, href? }`.
 * The layout never rewrites the text it is given.
 */

// How far below the top of the viewport a section counts as "current", and
// where a jump from the menu lands it.
const SPY_OFFSET = 140;
const JUMP_OFFSET = 32;

const paragraphClass = "sub_font text-[14px] sm:text-[15px] leading-7 text-[#3d5040]";

const Block = ({ block }) => {
  if (typeof block === "string" || (!block.list && !block.clauses && !block.details)) {
    return <p className={paragraphClass}>{block}</p>;
  }

  if (block.list) {
    return (
      <ul className="space-y-3">
        {block.list.map((item, i) => (
          <li
            key={i}
            className={`${paragraphClass} flex gap-3 rounded-xl bg-[#F4EFE4] px-4 py-3
              transition-colors duration-200 hover:bg-[#E9F0E6]`}
          >
            <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#315537]" />
            <span>
              {Array.isArray(item) ? (
                <>
                  <strong className="font-semibold text-[#1a3d22]">{item[0]}</strong>{" "}
                  {item[1]}
                </>
              ) : (
                item
              )}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.clauses) {
    return (
      <ol className="space-y-3">
        {block.clauses.map(([number, text]) => (
          <li
            key={number}
            className={`${paragraphClass} flex gap-4 rounded-xl border-l-[3px] border-[#315537]/25 bg-[#F4EFE4] px-4 py-3
              transition-colors duration-200 hover:border-[#315537] hover:bg-[#E9F0E6]`}
          >
            <span className="shrink-0 font-semibold tabular-nums text-[#315537]">{number}</span>
            <span>{text}</span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {block.details.map(({ icon: Icon, label, value, href }) => {
        const inner = (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#315537] text-white">
              <Icon className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <span className="sub_font min-w-0 text-[14px] leading-6 text-[#3d5040]">
              <strong className="block font-semibold text-[#1a3d22]">{label}</strong>
              <span className="break-words">{value}</span>
            </span>
          </>
        );
        const base =
          "flex items-start gap-3 rounded-xl border border-[#315537]/10 bg-[#F4EFE4] p-4 transition-all duration-200";
        const wide = label === "Address:" ? "sm:col-span-2" : "";

        return href ? (
          <a
            key={label}
            href={href}
            {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={`${base} ${wide} hover:-translate-y-0.5 hover:border-[#315537]/40 hover:bg-[#E9F0E6]`}
          >
            {inner}
          </a>
        ) : (
          <div key={label} className={`${base} ${wide}`}>
            {inner}
          </div>
        );
      })}
    </div>
  );
};

const LegalPage = ({ title, subtitle, sections }) => {
  const [heroVisible, setHeroVisible] = useState(false);
  const [active, setActive] = useState(sections[0].id);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const layoutRef = useRef(null);
  const tocRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Reading progress, scroll-spy and the back-to-top button all read the same
  // scroll position, so one rAF-throttled listener drives all three.
  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const content = contentRef.current;
      if (!content) return;

      const rect = content.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const read = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 1;
      setProgress(rect.top > 0 ? 0 : read);
      setShowTop(rect.top < 0);

      let current = sections[0].id;
      for (const { id } of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= SPY_OFFSET) current = id;
      }
      // The last section is short and may never reach the offset line.
      if (rect.bottom <= window.innerHeight) current = sections[sections.length - 1].id;
      setActive(current);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  // The page sits inside containers with `overflow-x: hidden`, which breaks
  // CSS `position: sticky`, so the desktop menu is pinned with ScrollTrigger
  // instead — the same tool the rest of the site uses for pinning.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        ScrollTrigger.create({
          trigger: layoutRef.current,
          start: `top ${JUMP_OFFSET}px`,
          end: () => `bottom ${tocRef.current.offsetHeight + JUMP_OFFSET * 2}px`,
          pin: tocRef.current,
          pinSpacing: false,
          invalidateOnRefresh: true,
        });
      });

      gsap.utils.toArray(".legal-section").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          },
        );
      });
    }, layoutRef);

    // Fail open, as the blog grid does: never leave a section invisible.
    const safety = setTimeout(() => {
      layoutRef.current?.querySelectorAll(".legal-section").forEach((el) => {
        if (parseFloat(window.getComputedStyle(el).opacity) < 1) {
          gsap.set(el, { opacity: 1, y: 0 });
        }
      });
    }, 3000);

    return () => {
      clearTimeout(safety);
      ctx.revert();
    };
  }, []);

  const jumpTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    setMenuOpen(false);
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - JUMP_OFFSET,
      behavior: "smooth",
    });
  };

  const activeIndex = Math.max(sections.findIndex((s) => s.id === active), 0);

  return (
    <>
      <style>{`
        .legal-link { color: #315537; text-decoration: underline; text-underline-offset: 3px; }
        .legal-link:hover { color: #1a3d22; }
      `}</style>

      {/* Reading progress */}
      <div className="fixed left-0 top-0 z-[60] h-[3px] w-full bg-transparent pointer-events-none">
        <div
          className="h-full bg-[#e8c547] origin-left transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative w-full h-[55vh] sm:h-[60vh] md:h-[65vh] overflow-hidden">
        <img
          src={ContactBanner}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3000ms] ease-out"
          style={{ transform: heroVisible ? "scale(1.05)" : "scale(1.15)" }}
        />

        <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-center pt-6 md:pt-8 px-6 md:px-10">
          <Link to="/" aria-label="GrowFarms home">
            <img
              src={logo_img}
              alt="GrowFarms – Live with Nature"
              className="h-12 md:h-14 lg:h-16 w-auto object-contain transition-all duration-700 ease-out"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0px)" : "translateY(-12px)",
              }}
            />
          </Link>
        </div>

        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center transition-all duration-1000 ease-out"
          style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0px)" : "translateY(20px)",
          }}
        >
          <h1
            className="text-white font-light tracking-[0.12em] text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
            style={{ textShadow: "0 4px 20px rgba(0,0,0,0.45)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="sub_font text-white/90 text-sm tracking-[0.3em] uppercase font-semibold">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className="absolute bottom-0 left-0 w-full pointer-events-none z-20"
          style={{
            height: "clamp(90px, 28%, 240px)",
            background: `linear-gradient(
              180deg,
              rgba(49,85,55,0) 0%,
              rgba(49,85,55,0.30) 35%,
              rgba(49,85,55,0.70) 70%,
              #315537 100%
            )`,
          }}
        />
      </section>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <section className="w-full bg-[#315537] px-4 pt-6 pb-20 sm:px-6 lg:px-10">
        <div
          ref={layoutRef}
          className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[260px_1fr] lg:gap-10"
        >
          {/* Section menu — a pinned sidebar on desktop, a dropdown on mobile */}
          <aside className="relative">
            <div ref={tocRef} className="lg:w-[260px]">
              {/* Mobile dropdown */}
              <div className="lg:hidden rounded-2xl bg-[#2a4830] text-white">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                  className="sub_font flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm"
                >
                  <span className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-widest text-white/55">
                      Jump to section
                    </span>
                    <span className="block truncate">
                      {activeIndex + 1}. {sections[activeIndex].title}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: menuOpen ? "1fr" : "0fr" }}
                >
                  <ol className="overflow-hidden">
                    {sections.map((s, i) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => jumpTo(s.id)}
                          className={`sub_font w-full border-t border-white/10 px-5 py-3 text-left text-sm transition-colors
                            ${active === s.id ? "text-[#e8c547]" : "text-white/75 hover:text-white"}`}
                        >
                          {i + 1}. {s.title}
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Desktop sidebar */}
              <nav aria-label={`${title} sections`} className="hidden lg:block">
                <p className="sub_font mb-4 text-[10px] uppercase tracking-widest text-white/55">
                  On this page
                </p>
                <ol className="relative space-y-1 border-l border-white/15">
                  {sections.map((s, i) => {
                    const isActive = active === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => jumpTo(s.id)}
                          className={`sub_font -ml-px flex w-full items-baseline gap-2 border-l-2 py-1.5 pl-4 pr-2 text-left text-[13px] leading-5 transition-all duration-200
                            ${
                              isActive
                                ? "border-[#e8c547] text-white translate-x-1"
                                : "border-transparent text-white/60 hover:text-white hover:border-white/40"
                            }`}
                        >
                          <span className={`w-5 shrink-0 tabular-nums ${isActive ? "text-[#e8c547]" : "text-white/40"}`}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {s.title}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </div>
          </aside>

          {/* Sections */}
          <div ref={contentRef} className="space-y-5 min-w-0">
            {sections.map((s, i) => (
              <article
                key={s.id}
                id={s.id}
                className={`legal-section rounded-[1.5rem] bg-white p-6 sm:p-8 transition-shadow duration-300
                  ${active === s.id ? "shadow-[0_10px_40px_rgba(0,0,0,0.18)]" : "shadow-none"}`}
              >
                <div className="mb-5 flex items-center gap-4">
                  <span
                    className={`sub_font flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300
                      ${active === s.id ? "bg-[#e8c547] text-[#1a3d22]" : "bg-[#315537] text-white"}`}
                  >
                    {i + 1}
                  </span>
                  <h2
                    className="text-[#1a3d22]"
                    style={{ fontSize: "clamp(1.15rem, 2.2vw, 1.5rem)", fontWeight: 600 }}
                  >
                    {s.title}
                  </h2>
                </div>
                <div className="space-y-4">
                  {s.blocks.map((block, j) => (
                    <Block key={j} block={block} />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Back to top */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#e8c547] text-[#1a3d22] shadow-lg
          transition-all duration-300 hover:scale-110
          ${showTop ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-4"}`}
      >
        <ArrowUp className="h-5 w-5" strokeWidth={2.2} />
      </button>
    </>
  );
};

export default LegalPage;
