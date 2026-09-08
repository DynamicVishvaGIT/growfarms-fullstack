import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import BlogBanner from "../assets/images/blog_details.png";
import logo_img from "../assets/images/grow-farms-logo.png";

import { Link, useParams, useNavigate } from "react-router-dom";
import useApiData from "../hooks/useApiData";
import { getBlog, getContent, contentBlock } from "../lib/api";
import { blogPlainText, readingTimeMinutes } from "../lib/blogContent";
import BlogContent from "./BlogContent";

gsap.registerPlugin(ScrollTrigger);

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

function formatMetaDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function useDocumentMeta(post) {
  useEffect(() => {
    if (!post) return undefined;

    const previousTitle = document.title;
    document.title = post.meta_title || `${post.title} | Grow Farms`;

    const description =
      post.meta_description || blogPlainText(post.content, 155);

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

const BlogDetails = () => {
  const [heroVisible, setHeroVisible] = useState(false);

  const { slug } = useParams();
  const navigate = useNavigate();

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
  const status = !slug ? "missing" : isForThisSlug ? result.status : "loading";

  const loadingPost = status === "loading";
  const notFound = status === "missing";

  useDocumentMeta(post);

  // The two page-wide labels, from Admin → Content → Blogs. Both fall back to
  // the wording the page shipped with, so an unreachable backend changes nothing.
  const { data: pageContent } = useApiData((signal) => getContent("blogs", signal), null, []);
  const heroBlock = contentBlock(pageContent, "blogs", "detail_hero");
  const relatedBlock = contentBlock(pageContent, "blogs", "detail_related");

  // Steps ride along with the post. The API already substitutes the shared
  // scope-"blog" list for a post that defines none, so there is one list here
  // either way.
  const steps = useMemo(
    () =>
      (post?.steps || []).map((s) => ({
        n: s.step_number,
        title: s.title,
        desc: s.description || "",
      })),
    [post],
  );

  const checklist = (post?.checklist || []).map((c) => c.item_text);

  // Heading, paragraph and ticked list all come from Admin → Blogs → Takeaways.
  // A post that fills in none of the three drops the section entirely.
  const takeawayHeading = (post?.sub_heading || "").trim();
  const takeawayBody = (post?.second_description || "").trim();
  const hasTakeaways = Boolean(takeawayHeading || takeawayBody || checklist.length);

  const relatedPosts = useMemo(() => {
    if (!post?.related?.length) return [];
    return post.related.map((r) => ({
      slug: r.slug,
      image: r.featured_image_url || r.banner_image_url || null,
      category: r.category?.name || "Grow Farms",
      date: formatMetaDate(r.published_at || r.createdAt),
      author: r.author_name || "Admin",
      title: r.title,
    }));
  }, [post]);

  const bannerImage = post?.banner_image_url || post?.featured_image_url || BlogBanner;
  const postTitle = post?.title || "";

  // Wording over the banner: the post's own first, then the Content block, and
  // finally the post's title so the banner is never left bare.
  const heroHeading =
    (post?.hero_title || "").trim() || (heroBlock?.title || "").trim() || postTitle;
  const heroSubtitle = (post?.hero_subtitle || "").trim();

  const backLabel = (heroBlock?.link_label || "").trim() || "All blogs";
  const relatedHeading = (relatedBlock?.title || "").trim() || "Other Blog";

  // The image row under the body. Uploaded gallery images win; with none, the
  // featured image still appears inline when it differs from the banner, which
  // is what the page did before the gallery existed.
  const galleryImages = useMemo(() => {
    const rows = (post?.images || [])
      .map((img) => ({
        key: img.id,
        src: img.image_path_url,
        alt: img.alt_text || post?.title || "",
      }))
      .filter((img) => img.src);
    if (rows.length) return rows;

    if (post?.featured_image_url && post.featured_image_url !== post.banner_image_url) {
      return [{ key: "featured", src: post.featured_image_url, alt: post.title || "" }];
    }
    return [];
  }, [post]);

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const pageRef = useRef(null);
  const detailsRef = useRef(null);
  const imgsRef = useRef(null);
  const growRef = useRef(null);
  const stepsWrapRef = useRef(null);
  const quoteRef = useRef(null);
  const otherBlogRef = useRef(null);

  const revealKey = loadingPost || notFound ? "pending" : post?.id || "static";

  useLayoutEffect(() => {
    if (revealKey === "pending") return undefined;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return undefined;

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

    const safetyTimer = setTimeout(() => {
      revealTargets.forEach((el) => {
        if (parseFloat(window.getComputedStyle(el).opacity) < 1) {
          gsap.set(el, { opacity: 1, y: 0, scale: 1, clearProps: "transform" });
        }
      });
    }, 2500);

    return () => {
      clearTimeout(safetyTimer);
      ctx.revert();
    };
  }, [revealKey]);

  if (loadingPost) return <ArticleSkeleton />;
  if (notFound) return <NotFound />;

  return (
    <div ref={pageRef}>
      {/* ---------------- HERO ---------------- */}
      <section className="relative w-full h-[60vh] min-h-[420px] sm:h-[70vh] sm:min-h-[500px] md:h-screen md:min-h-[650px] overflow-hidden">
        <div className="relative w-full h-full">
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
              {heroHeading && (
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
                  {heroHeading}
                </h1>
              )}

              {heroSubtitle && (
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
              )}
            </div>
          </div>

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
          <div ref={detailsRef}>
            <Link
              to="/blogs"
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs uppercase tracking-wider text-[#B9C4AE] transition-colors hover:text-[#F4EDE1]"
            >
              <BackIcon />
              {backLabel}
            </Link>

            {postTitle && (
              <h1 className="mt-4 font-display text-2xl sm:text-4xl lg:text-[2.75rem] font-medium leading-tight text-[#F4EDE1] max-w-4xl">
                {postTitle}
              </h1>
            )}

            {metaItems.length > 0 && (
              <MetaRow items={metaItems} className="mt-4 border-t border-[#EDE7D9]/10 pt-4" />
            )}

            {post && (
              <div className="mt-6 max-w-3xl lg:max-w-4xl">
                <BlogContent raw={post.content} />
              </div>
            )}

            <ShareRow title={postTitle} />
          </div>

          {galleryImages.length > 0 && (
            <div ref={imgsRef} className="mt-10 sm:mt-12 max-w-4xl">
              <div
                className={`grid gap-4 sm:gap-6 ${
                  galleryImages.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                {galleryImages.map((img) => (
                  <div
                    key={img.key}
                    className="rounded-2xl overflow-hidden aspect-[16/9] shadow-xl shadow-black/20"
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasTakeaways && (
            <div ref={growRef} className="mt-14 sm:mt-20 max-w-4xl">
              <h2 className="font-display text-xl sm:text-3xl font-medium text-[#F4EDE1]">
                {takeawayHeading || "Key takeaways"}
              </h2>

              {takeawayBody && (
                <p className="mt-4 max-w-3xl whitespace-pre-line text-[#C9C0AC] text-[14px] sm:text-[15px] leading-relaxed">
                  {takeawayBody}
                </p>
              )}

              {checklist.length > 0 && (
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
              )}
            </div>
          )}

          {steps?.length > 0 && (
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
          )}
        </div>

        {post?.quote_text && (
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
            <div className="flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-[#34533C] flex items-center justify-center">
              <QuoteMark className="w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7 fill-current text-white" />
            </div>

            <div className="flex-1 pt-0.5 sm:pt-1.5 lg:pt-2">
              <p className="text-[#333333] text-sm sm:text-lg lg:text-xl leading-relaxed whitespace-pre-line">
                &ldquo;{post.quote_text}&rdquo;
              </p>
              {post.quote_author && (
                <p className="mt-3 sm:mt-4 text-[11px] sm:text-sm tracking-wider uppercase text-[#526B57] font-semibold">
                  - {post.quote_author}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ---------------- OTHER BLOG ---------------- */}
      {relatedPosts.length > 0 && (
        <div ref={otherBlogRef}>
          <section className="relative text-[#EDE7D9] px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 lg:pt-28 pb-16 sm:pb-20 lg:pb-24 overflow-hidden">
            <h2 className="font-display text-center text-lg sm:text-2xl font-medium text-[#F4EDE1] underline decoration-1 underline-offset-8">
              {relatedHeading}
            </h2>

            <div className="mt-10 sm:mt-14 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {relatedPosts.map((blog, i) => (
                <article
                  key={blog.slug || i}
                  className="group cursor-pointer"
                  onClick={() => blog.slug && navigate(`/blog-details/${blog.slug}`)}
                >
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-xl shadow-black/20">
                    {blog.image ? (
                      <img
                        src={blog.image}
                        alt={blog.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#2a4830] flex items-center justify-center">
                        <img
                          src={logo_img}
                          alt=""
                          aria-hidden="true"
                          className="w-1/2 max-w-[110px] object-contain opacity-20"
                        />
                      </div>
                    )}

                    <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-[#F4EDE1] text-[#1F3B22] text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
                      {blog.category}
                    </span>

                    <span className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E8D24C] flex items-center justify-center shadow-md transition-transform duration-500 ease-out group-hover:rotate-45 motion-reduce:transition-none motion-reduce:group-hover:rotate-0">
                      <ArrowIcon />
                    </span>
                  </div>

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