import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import BlogBanner from "../assets/images/blog_details.png";
import logo_img from "../assets/images/grow-farms-logo.png";
import farmImg1 from "../assets/images/farm_couple_1.jpg";
import farmImg2 from "../assets/images/farm_couple_1.jpg";
import blogThumb from "../assets/images/Blog_Banner_2.jpeg";

import { Link, useParams, useNavigate } from "react-router-dom";
import useApiData from "../hooks/useApiData";
import { getBlog, getBuyingSteps } from "../lib/api";
import { blogPlainText, readingTimeMinutes } from "../lib/blogContent";
import BlogContent from "./BlogContent";

gsap.registerPlugin(ScrollTrigger);

/* The designed article at /blog-details (no slug) keeps its built-in copy —
   these are only ever used on that route, never to stand in for a real post. */
const FALLBACK_CHECKLIST = [
  "Make ridges when planting crops on your farm of flat land.",
  "Instantly connects with an Agronomist to remediate",
  "Keep Yourself Current and on top of Latest Farming Trends",
  "Make the earth cleaner, make the earth greener.",
];

const FALLBACK_STEPS = [
  {
    n: "01",
    title: "Choose Your Plot",
    desc: "Explore our premium agricultural land options and select the perfect location.",
  },
  {
    n: "02",
    title: "Visit the Site",
    desc: "Schedule a site visit with our experts to experience the project firsthand.",
  },
  {
    n: "03",
    title: "Complete Your Investment",
    desc: "Our team assists you throughout the documentation process, ensuring a smooth and transparent purchase.",
  },
];

const FALLBACK_OTHER_BLOGS = [
  {
    image: blogThumb,
    category: "Mixed Farming",
    date: "March 28, 2024",
    author: "Admin",
    title: "Better Agriculture for Better Future",
  },
  {
    image: blogThumb,
    category: "Mixed Farming",
    date: "March 28, 2024",
    author: "Admin",
    title: "A farmer is a person who works in agriculture.",
  },
  {
    image: blogThumb,
    category: "Mixed Farming",
    date: "March 28, 2024",
    author: "Admin",
    title: "A farmer is a person who works in agriculture.",
  },
];

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full">
    <circle cx="12" cy="12" r="11" fill="#F4EDE1" />
    <path
      d="M7 12.5l3 3 7-7"
      stroke="#1F3B22"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const QuoteMark = ({ className }) => (
  <svg viewBox="0 0 40 32" className={className || "w-6 h-7 md:w-9 md:h-6"}>
    <path
      fill="#FFFFFF"
      d="M0 32V19.6C0 8.6 6.5 1.6 16.6 0l2 5.4C11.9 7 8.7 10.6 8.4 15.6H16V32H0Zm22 0V19.6c0-11 6.5-18 16.6-19.6l2 5.4C33.9 7 30.7 10.6 30.4 15.6H38V32H22Z"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0">
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
    <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const AdminIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0">
    <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" fill="none" />
    <path
      d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" fill="none" />
    <path d="M12 7v5.3l3.2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path
      d="M6 18L18 6M18 6H9M18 6v9"
      stroke="#1F3B22"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
    <path
      d="M15 5l-7 7 7 7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

/** Match the uppercase meta line the related-post cards already use. */
function formatMetaDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Keep the document head in step with the post being read. */
function useDocumentMeta(post) {
  useEffect(() => {
    if (!post) return undefined;

    const previousTitle = document.title;
    document.title = post.meta_title || `${post.title} | Grow Farms`;

    const description =
      post.meta_description || post.excerpt || blogPlainText(post.content, 155);

    let tag = document.querySelector('meta[name="description"]');
    const created = !tag;
    if (created) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "description");
      document.head.appendChild(tag);
    }
    const previousDescription = tag.getAttribute("content");
    if (description) tag.setAttribute("content", description);

    return () => {
      document.title = previousTitle;
      if (created) tag.remove();
      else if (previousDescription !== null) tag.setAttribute("content", previousDescription);
    };
  }, [post]);
}

/* ── Small pieces ────────────────────────────────────────────────────────── */

const MetaRow = ({ items, className = "" }) => (
  <div
    className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] sm:text-xs tracking-wide uppercase text-[#B9C4AE] ${className}`}
  >
    {items.map(({ icon: Icon, label }) => (
      <span key={label} className="flex items-center gap-1.5">
        <Icon />
        {label}
      </span>
    ))}
  </div>
);

/** Copy-link share control; uses the native share sheet where there is one. */
const ShareRow = ({ title }) => {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Cancelled or unavailable — fall through to copying instead.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 rounded-full border border-[#EDE7D9]/25 px-4 py-2 text-[11px] sm:text-xs uppercase tracking-wider text-[#D8CFBB] transition-colors hover:border-[#C7DDB5]/60 hover:text-[#F4EDE1]"
    >
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
        <path
          d="M14 4h6v6M20 4l-8.5 8.5M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {copied ? "Link copied" : "Share this post"}
    </button>
  );
};

const SkeletonLine = ({ w = "100%" }) => (
  <span
    className="block h-3.5 rounded-full bg-[#EDE7D9]/10 animate-pulse"
    style={{ width: w }}
  />
);

const ArticleSkeleton = () => (
  <div className="min-h-screen bg-[#315537]">
    <div className="h-[45vh] min-h-[320px] w-full bg-[#2a4830] animate-pulse" />
    <div className="mx-auto max-w-3xl px-5 sm:px-10 py-14 space-y-4">
      <SkeletonLine w="45%" />
      <SkeletonLine w="90%" />
      <SkeletonLine w="100%" />
      <SkeletonLine w="80%" />
      <div className="pt-6 space-y-4">
        <SkeletonLine w="100%" />
        <SkeletonLine w="95%" />
        <SkeletonLine w="70%" />
      </div>
    </div>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen bg-[#315537] flex items-center justify-center px-5 py-24 text-center">
    <div className="max-w-md">
      <img src={logo_img} alt="Grow Farms" className="mx-auto h-12 sm:h-14 object-contain" />
      <h1 className="mt-8 font-display text-2xl sm:text-3xl font-medium text-[#F4EDE1]">
        We couldn&rsquo;t find that post
      </h1>
      <p className="mt-3 text-[#D8CFBB] text-sm sm:text-[15px] leading-relaxed">
        The article may have been moved or unpublished. Everything else we&rsquo;ve
        written is still on the blog.
      </p>
      <Link
        to="/blogs"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#E8D24C] px-6 py-3 text-sm font-semibold text-[#1F3B22] transition-transform hover:scale-[1.03]"
      >
        <BackIcon />
        Back to all blogs
      </Link>
    </div>
  </div>
);

/* ── Page ────────────────────────────────────────────────────────────────── */

const BlogDetails = () => {
  const [heroVisible, setHeroVisible] = useState(false);

  const { slug } = useParams();
  const navigate = useNavigate();

  // Without a slug this stays exactly the static article it has always been.
  //
  // This does not use `useApiData`: that hook deliberately keeps the previous
  // response on screen while the next one loads, which is right for a section
  // of a page but wrong for a whole article — following a related-post link to
  // a slug that no longer resolves would leave the article you just came from
  // sitting under the new URL. Here the post is tied to the slug that asked
  // for it, so anything else is a real loading or missing state.
  // The stored result carries the slug it answers, so the moment the route
  // changes the derivation below reports "loading" without an extra render.
  const [result, setResult] = useState({ slug: null, post: null, status: "idle" });

  useEffect(() => {
    if (!slug) return undefined;

    const controller = new AbortController();
    let alive = true;

    getBlog(slug, controller.signal)
      .then((data) => {
        if (!alive) return;
        setResult({ slug, post: data || null, status: data ? "ready" : "missing" });
      })
      .catch(() => {
        if (alive) setResult({ slug, post: null, status: "missing" });
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [slug]);

  const isForThisSlug = Boolean(slug) && result.slug === slug;
  const post = isForThisSlug ? result.post : null;
  const status = !slug ? "static" : isForThisSlug ? result.status : "loading";

  const isCms = Boolean(slug);
  const loadingPost = status === "loading";
  const notFound = status === "missing";

  useDocumentMeta(post);

  const { data: steps } = useApiData(
    async (signal) => {
      const rows = await getBuyingSteps({ scope: "blog" }, signal);
      if (!rows?.length) return null;
      return rows.map((r) => ({
        n: r.step_number,
        title: r.title,
        desc: r.description || "",
      }));
    },
    FALLBACK_STEPS,
  );

  const checklist = post
    ? (post.checklist || []).map((c) => c.item_text)
    : FALLBACK_CHECKLIST;

  const relatedPosts = useMemo(() => {
    if (!post) return FALLBACK_OTHER_BLOGS;
    return (post.related || []).map((r) => ({
      slug: r.slug,
      image: r.featured_image_url || r.banner_image_url || blogThumb,
      category: r.category?.name || "Grow Farms",
      date: formatMetaDate(r.published_at || r.createdAt),
      author: r.author_name || "Admin",
      title: r.title,
    }));
  }, [post]);

  const bannerImage = post?.banner_image_url || post?.featured_image_url || BlogBanner;
  const postTitle = post?.title || "Better Agriculture for a Better Future";
  const heroSubtitle =
    post?.excerpt ||
    (post ? blogPlainText(post.content, 160) : null) ||
    "At Grow Farms, we believe that owning agricultural land is more than an investment";

  // A featured image only earns a slot in the body when it isn't the banner.
  const inlineImage =
    post?.featured_image_url && post.featured_image_url !== post.banner_image_url
      ? post.featured_image_url
      : null;

  const readMinutes = post ? readingTimeMinutes(post.content) : 0;

  const metaItems = post
    ? [
        { icon: CalendarIcon, label: formatMetaDate(post.published_at || post.createdAt) },
        { icon: AdminIcon, label: post.author_name || "Admin" },
        ...(readMinutes ? [{ icon: ClockIcon, label: `${readMinutes} min read` }] : []),
      ].filter((m) => m.label)
    : [];

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      setTimeout(() => setHeroVisible(true), 50);
    });
    return () => cancelAnimationFrame(t);
  }, []);

  // Arriving from a related-post card is a client-side push, which keeps the
  // previous article's scroll position.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  /* ---------- Page-wide ref (scopes the GSAP context) ---------- */
  const pageRef = useRef(null);

  /* ---------- Section-level refs — same granularity as About.jsx ---------- */
  const detailsRef = useRef(null); // title + meta + body
  const imgsRef = useRef(null); // image pair / featured figure
  const growRef = useRef(null); // checklist block
  const stepsWrapRef = useRef(null); // numbered steps grid
  const quoteRef = useRef(null); // quote card
  const otherBlogRef = useRef(null); // whole "Other Blog" section

  // The article's own content decides how tall every section is, so the
  // reveals are built against the finished DOM rather than the skeleton —
  // triggers created over the loading state measure a layout that is about to
  // be replaced, and then fire at the wrong scroll position or not at all.
  const revealKey = loadingPost || notFound ? "pending" : post?.id || "static";

  /* ---------- GSAP ScrollTrigger — About.jsx-style section reveals ---------- */
  useLayoutEffect(() => {
    if (revealKey === "pending") return undefined;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return undefined;

    // Collect every section we animate so the safety-net fallback below can
    // force them visible if something upstream still goes wrong.
    const revealTargets = [
      detailsRef.current,
      imgsRef.current,
      growRef.current,
      stepsWrapRef.current,
      quoteRef.current,
      otherBlogRef.current,
    ].filter(Boolean);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          isMobile: "(max-width: 639px)",
          isDesktop: "(min-width: 640px)",
        },
        (context) => {
          const { isMobile } = context.conditions;
          const travel = isMobile ? 24 : 40;
          const dur = isMobile ? 0.6 : 0.9;

          // Shared helper — always fromTo so the final state is explicit. The
          // late "top 95%" start means an element only has to be barely inside
          // the viewport to fire, which tolerates the small layout differences
          // between a local dev server and production.
          const reveal = (el, extraFrom = {}, extraTo = {}, startPos = "top 95%") => {
            if (!el) return;
            gsap.fromTo(
              el,
              { y: travel, opacity: 0, ...extraFrom },
              {
                y: 0,
                opacity: 1,
                duration: dur,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: el,
                  start: startPos,
                  once: true,
                },
                ...extraTo,
              },
            );
          };

          reveal(detailsRef.current);
          reveal(imgsRef.current, { scale: 0.97 }, { scale: 1 });
          reveal(growRef.current);
          reveal(stepsWrapRef.current);
          reveal(
            quoteRef.current,
            { y: isMobile ? 30 : 50, scale: 0.97 },
            { scale: 1, duration: 0.8 },
          );
          reveal(otherBlogRef.current);

          /* ---- Image-load + resize refresh (identical to About.jsx) --- */
          const images = pageRef.current
            ? Array.from(pageRef.current.querySelectorAll("img"))
            : [];

          let loadedCount = 0;
          const onImageLoad = () => {
            loadedCount += 1;
            if (loadedCount === images.length) ScrollTrigger.refresh();
          };
          images.forEach((img) => {
            if (img.complete) onImageLoad();
            else {
              img.addEventListener("load", onImageLoad, { once: true });
              img.addEventListener("error", onImageLoad, { once: true });
            }
          });

          let resizeTimer;
          const onResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
          };
          window.addEventListener("resize", onResize);

          // A second refresh once the whole window — fonts included — is done.
          // Production hosts are slower than a dev server, so late assets can
          // shift the layout after the image-based refresh has already run.
          const onWindowLoad = () => ScrollTrigger.refresh();
          window.addEventListener("load", onWindowLoad);

          return () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("load", onWindowLoad);
            clearTimeout(resizeTimer);
            images.forEach((img) => {
              img.removeEventListener("load", onImageLoad);
              img.removeEventListener("error", onImageLoad);
            });
          };
        },
      );
    }, pageRef);

    // Safety net: if a section never received its ScrollTrigger-driven "to"
    // state within 2.5s (blocked chunk, failed dynamic import, matchMedia edge
    // case), force it visible. Content must never be permanently invisible.
    const safetyTimer = setTimeout(() => {
      revealTargets.forEach((el) => {
        if (parseFloat(window.getComputedStyle(el).opacity) < 1) {
          gsap.set(el, { opacity: 1, y: 0, scale: 1, clearProps: "transform" });
        }
      });
    }, 2500);

    return () => {
      clearTimeout(safetyTimer);
      ctx.revert(); // kills all ScrollTriggers created inside ctx
    };
  }, [revealKey]);

  if (loadingPost) return <ArticleSkeleton />;
  if (notFound) return <NotFound />;

  return (
    <div ref={pageRef}>
      {/* ---------------- HERO ---------------- */}
      <section className="relative w-full h-[60vh] min-h-[420px] sm:h-[70vh] sm:min-h-[500px] md:h-screen md:min-h-[650px] overflow-hidden">
        <div className="relative w-full h-full">
          {/* Hero Image */}
          <img
            src={bannerImage}
            alt={postTitle}
            fetchPriority="high"
            onError={(e) => {
              e.currentTarget.src = BlogBanner;
            }}
            className="
              absolute inset-0
              w-full h-full
              object-cover object-center
              transition-transform duration-[3000ms] ease-out
              motion-reduce:transition-none motion-reduce:transform-none
            "
            style={{
              transform: heroVisible ? "scale(1.05)" : "scale(1.15)",
            }}
          />

          {/* Top Logo */}
          <div
            className="
              absolute
              top-0 left-0
              z-30
              flex justify-center
              w-full
              px-4
              pt-4
              sm:pt-6
              md:pt-8
              lg:pt-10
            "
          >
            <Link to="/" aria-label="Grow Farms home">
              <img
                src={logo_img}
                alt="GrowFarms – Live with Nature"
                className="
                  w-auto
                  h-8
                  min-[400px]:h-9
                  sm:h-12
                  md:h-14
                  lg:h-16
                  xl:h-[70px]
                  object-contain
                  transition-all duration-700 ease-out
                  motion-reduce:transition-none
                "
                style={{
                  opacity: heroVisible ? 1 : 0,
                  transform: heroVisible ? "translateY(0)" : "translateY(-12px)",
                }}
              />
            </Link>
          </div>

          {/* Hero Content */}
          <div
            className="
              absolute
              inset-0
              z-30
              flex
              flex-col
              items-center
              justify-center
              px-5
              sm:px-8
              md:px-10
              lg:px-16
              pt-8
              sm:pt-10
              md:pt-16
            "
          >
            <div className="w-full max-w-[850px] text-center text-white">
              {post?.category?.name && (
                <span
                  className="
                    inline-block mb-4
                    rounded-full bg-[#F4EDE1] text-[#1F3B22]
                    px-3 py-1
                    text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider
                    transition-all duration-700 ease-out
                    motion-reduce:transition-none
                  "
                  style={{
                    opacity: heroVisible ? 1 : 0,
                    transform: heroVisible ? "translateY(0)" : "translateY(12px)",
                    transitionDelay: "80ms",
                  }}
                >
                  {post.category.name}
                </span>
              )}

              <h1
                className="
                  font-semibold
                  tracking-[0.06em]
                  sm:tracking-[0.08em]
                  leading-tight
                  text-[20px]
                  min-[400px]:text-[22px]
                  sm:text-[26px]
                  md:text-[32px]
                  lg:text-[38px]
                  xl:text-[42px]
                  transition-all duration-700 ease-out
                  motion-reduce:transition-none
                "
                style={{
                  opacity: heroVisible ? 1 : 0,
                  transform: heroVisible ? "translateY(0)" : "translateY(16px)",
                  transitionDelay: "150ms",
                }}
              >
                {postTitle}
              </h1>

              <p
                className="
                  mx-auto
                  mt-2
                  max-w-[90%]
                  sm:max-w-[650px]
                  leading-relaxed
                  tracking-[0.08em]
                  sm:tracking-[0.12em]
                  text-[11px]
                  min-[400px]:text-[12px]
                  sm:text-[14px]
                  md:text-[16px]
                  lg:text-[18px]
                  transition-all duration-700 ease-out
                  motion-reduce:transition-none
                "
                style={{
                  opacity: heroVisible ? 1 : 0,
                  transform: heroVisible ? "translateY(0)" : "translateY(14px)",
                  transitionDelay: "300ms",
                }}
              >
                {heroSubtitle}
              </p>
            </div>
          </div>

          {/* Bottom Green Gradient */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 z-20 w-full"
            style={{
              height: "clamp(90px, 30%, 250px)",
              background: `
                linear-gradient(
                  180deg,
                  rgba(49,85,55,0) 0%,
                  rgba(49,85,55,0.25) 30%,
                  rgba(49,85,55,0.65) 68%,
                  #315537 100%
                )
              `,
            }}
          />
        </div>
      </section>

      {/* ---------------- DETAILS SECTION ---------------- */}
      <section className="relative bg-[#315537] text-[#EDE7D9] px-5 sm:px-10 lg:px-16 pt-14 sm:pt-20 lg:pt-8 pb-16 sm:pb-20 lg:pb-40">
        <div className="relative max-w-6xl mx-auto">
          {/* Intro / article body */}
          <div ref={detailsRef}>
            {isCms && (
              <Link
                to="/blogs"
                className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs uppercase tracking-wider text-[#B9C4AE] transition-colors hover:text-[#F4EDE1]"
              >
                <BackIcon />
                All blogs
              </Link>
            )}

            <h1 className="mt-4 font-display text-2xl sm:text-4xl lg:text-[2.75rem] font-medium leading-tight text-[#F4EDE1] max-w-4xl">
              {post?.title || "Better Agriculture for Better Future"}
            </h1>

            {metaItems.length > 0 && (
              <MetaRow items={metaItems} className="mt-4 border-t border-[#EDE7D9]/10 pt-4" />
            )}

            {post ? (
              <div className="mt-6 max-w-3xl lg:max-w-4xl">
                {post.excerpt && (
                  <p className="mb-6 text-[15px] sm:text-base lg:text-lg leading-relaxed text-[#EDE7D9]">
                    {post.excerpt}
                  </p>
                )}
                <BlogContent raw={post.content} />
              </div>
            ) : (
              <div className="mt-5 space-y-4 max-w-3xl lg:max-w-6xl text-[#D8CFBB] text-[14px] sm:text-[15px] lg:text-base leading-relaxed">
                <p>
                  At Grow Farms, we believe that owning agricultural land is more than an
                  investment&mdash;it&rsquo;s a step toward a healthier, more peaceful
                  lifestyle. Surrounded by nature, our farm projects offer the perfect
                  balance of modern convenience and natural beauty, making them ideal for
                  farming, weekend homes, or long-term investment.
                </p>
                <p>
                  Our carefully developed agricultural plots come with essential
                  infrastructure, including internal roads, water supply, electricity,
                  fencing, and plantation. Every project is designed to provide a
                  hassle-free experience while preserving the beauty of nature and
                  promoting sustainable living.
                </p>
              </div>
            )}

            {isCms && <ShareRow title={postTitle} />}
          </div>

          {/* Imagery — the designed pair on the static page, the post's own
              featured image on a CMS article that has one. */}
          {post ? (
            inlineImage && (
              <div ref={imgsRef} className="mt-10 sm:mt-12">
                <div className="rounded-2xl overflow-hidden aspect-[16/9] shadow-xl shadow-black/20 max-w-4xl">
                  <img
                    src={inlineImage}
                    alt={postTitle}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )
          ) : (
            <div
              ref={imgsRef}
              className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
            >
              <div className="rounded-2xl overflow-hidden aspect-[4/3] shadow-xl shadow-black/20 group">
                <img
                  src={farmImg1}
                  alt="Couple checking crop data on a tablet in the field"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </div>
              <div className="rounded-2xl overflow-hidden aspect-[4/3] shadow-xl shadow-black/20 group">
                <img
                  src={farmImg2}
                  alt="Couple checking crop data on a tablet in the field"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </div>
            </div>
          )}

          {/* Checklist — hidden entirely when a post has no items of its own */}
          {checklist.length > 0 && (
            <div ref={growRef} className="mt-14 sm:mt-20 max-w-4xl">
              <h2 className="font-display text-xl sm:text-3xl font-medium text-[#F4EDE1]">
                {post ? "Key takeaways" : "Everything on our farm is grown"}
              </h2>

              {!post && (
                <p className="mt-4 text-[#D8CFBB] text-[14px] sm:text-[15px] leading-relaxed max-w-5xl">
                  They offer adaptability, high nutritional value, and can yield higher
                  yields with minimal agronomic inputs, and provide{" "}
                  <span className="text-[#C7DDB5] underline decoration-[#C7DDB5]/50 underline-offset-2">
                    significant potential for sustainable
                  </span>{" "}
                  agriculture and provide nutritional and income security for small and
                  marginal farmers in dry and rainfed semi-arid regions.
                </p>
              )}

              <div className="mt-6 space-y-4 sm:space-y-5">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="tick-check w-5 h-5 shrink-0 mt-0.5">
                      <CheckIcon />
                    </span>
                    <p className="text-[#EDE7D9] text-[14px] sm:text-[15px] leading-snug">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Numbered steps */}
          <div
            ref={stepsWrapRef}
            className="mt-14 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-8"
          >
            {steps.map((s) => (
              <div key={s.n}>
                <span className="font-display text-3xl sm:text-5xl text-[#F4EDE1]">
                  {s.n}
                </span>
                <div className="step-dot w-1.5 h-1.5 rounded-full bg-[#C7DDB5] my-3" />
                <h3 className="text-base sm:text-lg font-semibold text-[#F4EDE1]">
                  {s.title}
                </h3>
                <p className="mt-2 text-[#C9C0AC] text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quote card */}
        <div
          ref={quoteRef}
          className="
            relative
            lg:absolute lg:inset-x-0 lg:-bottom-16
            mt-10 sm:mt-14 lg:mt-0
            w-full lg:w-[90%]
            max-w-full sm:max-w-2xl lg:max-w-5xl
            mx-auto
            bg-white rounded-3xl
            p-5 sm:p-8 lg:p-10
            shadow-lg
            flex items-start gap-4 sm:gap-6
          "
        >
          {/* Circular Quote Mark Icon Container */}
          <div className="flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-[#34533C] flex items-center justify-center">
            <QuoteMark className="w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7 fill-current text-white" />
          </div>

          {/* Text Content */}
          <div className="flex-1 pt-0.5 sm:pt-1.5 lg:pt-2">
            <p className="text-[#333333] text-sm sm:text-lg lg:text-xl leading-relaxed">
              &ldquo;When you listen to yourself, everything come naturally. It come
              from in, like a kind of will to do something. Try to be sensitive. That
              is just a few clicks away.&rdquo;
            </p>
            <p className="mt-3 sm:mt-4 text-[11px] sm:text-sm tracking-wider uppercase text-[#526B57] font-semibold">
              - SATISFIED CLIENT
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- OTHER BLOG ---------------- */}
      {relatedPosts.length > 0 && (
        <div ref={otherBlogRef}>
          <section className="relative text-[#EDE7D9] px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 lg:pt-28 pb-16 sm:pb-20 lg:pb-24 overflow-hidden">
            <h2 className="font-display text-center text-lg sm:text-2xl font-medium text-[#F4EDE1] underline decoration-1 underline-offset-8">
              Other Blog
            </h2>

            <div className="mt-10 sm:mt-14 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {relatedPosts.map((blog, i) => (
                <article
                  key={blog.slug || i}
                  className={blog.slug ? "group cursor-pointer" : "group"}
                  onClick={() => blog.slug && navigate(`/blog-details/${blog.slug}`)}
                >
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-xl shadow-black/20">
                    <img
                      src={blog.image}
                      alt={blog.title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = blogThumb;
                      }}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />

                    {/* category pill */}
                    <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-[#F4EDE1] text-[#1F3B22] text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
                      {blog.category}
                    </span>

                    {/* circular action button */}
                    <span className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E8D24C] flex items-center justify-center shadow-md transition-transform duration-500 ease-out group-hover:rotate-45 motion-reduce:transition-none motion-reduce:group-hover:rotate-0">
                      <ArrowIcon />
                    </span>
                  </div>

                  {/* meta row */}
                  <div className="mt-3 sm:mt-4 flex items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] tracking-wide uppercase text-[#B9C4AE]">
                    {blog.date && (
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon />
                        {blog.date}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <AdminIcon />
                      {blog.author}
                    </span>
                  </div>

                  {/* title */}
                  <h3 className="mt-2 sm:mt-2.5 text-[#F4EDE1] text-sm sm:text-base lg:text-lg font-medium leading-snug">
                    {blog.title}
                  </h3>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default BlogDetails;
