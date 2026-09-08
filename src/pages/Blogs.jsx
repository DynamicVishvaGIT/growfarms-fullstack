import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BlogBanner from "../assets/images/Blog_Banner_2.jpeg";
import logo_img from "../assets/images/grow-farms-logo.png";

import { useNavigate } from "react-router-dom";
import useApiData from "../hooks/useApiData";
import { getBlogs } from "../lib/api";

gsap.registerPlugin(ScrollTrigger);

const PAGE_SIZE = 12;

// The API refuses to return more than 100 rows in one page, so this is what
// "all of them" actually means here.
const MAX_LIMIT = 100;

// Nothing is shown that did not come from the API. Until the request lands
// this is what renders, and it is also where an empty or unreachable backend
// leaves the page — the grid then gives way to the "coming soon" panel rather
// than to invented posts.
const EMPTY_FEED = { items: [], hasMore: false };

// ── icons ────────────────────────────────────────────────────────────────────
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const PersonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className="text-[#2d2d2d]">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

// ── blog card ────────────────────────────────────────────────────────────────
const BlogCard = ({ img, title, category, date, author, slug }) => {
  const badgeRef = useRef(null);
  const fabRef   = useRef(null);
  const imgRef   = useRef(null);

  const handleMouseEnter = () => {
    gsap.to(badgeRef.current, {
      scale: 1.08,
      y: -2,
      duration: 0.3,
      ease: "power2.out",
    });
    gsap.to(fabRef.current, {
      scale: 1.15,
      rotate: 45,
      duration: 0.35,
      ease: "back.out(1.7)",
    });
    gsap.to(imgRef.current, {
      scale: 1.06,
      duration: 0.6,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(badgeRef.current, {
      scale: 1,
      y: 0,
      duration: 0.3,
      ease: "power2.inOut",
    });
    gsap.to(fabRef.current, {
      scale: 1,
      rotate: 0,
      duration: 0.35,
      ease: "power2.inOut",
    });
    gsap.to(imgRef.current, {
      scale: 1,
      duration: 0.5,
      ease: "power2.inOut",
    });
  };

  const navigate = useNavigate()

  return (
    <div
      className="flex flex-col gap-2 cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => navigate(slug ? `/blog-details/${slug}` : "/blog-details")}
    >
      <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
        {img ? (
          <img
            ref={imgRef}
            src={img}
            alt={title}
            className="w-full h-full object-cover will-change-transform"
          />
        ) : (
          // A real post that simply has no featured image. Deliberately the
          // brand mark on a flat tint rather than a stock photograph, so it
          // never reads as a picture belonging to this article.
          <div
            ref={imgRef}
            className="w-full h-full bg-[#2a4830] flex items-center justify-center will-change-transform"
          >
            <img
              src={logo_img}
              alt=""
              aria-hidden="true"
              className="w-1/2 max-w-[110px] object-contain opacity-20"
            />
          </div>
        )}

        <span
          ref={badgeRef}
          className="absolute top-3 left-3 bg-[#2d5a27] text-white text-[10px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full will-change-transform origin-left"
        >
          {category || "Mixed Farming"}
        </span>

        <button
          ref={fabRef}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center will-change-transform"
          style={{ backgroundColor: "#e8c547" }}
          aria-label="Read more"
        >
          <ArrowIcon />
        </button>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-[#d4cfc9]">
        <span className="flex items-center gap-1">
          <CalendarIcon />
          {date || "MARCH 28, 2024"}
        </span>
        <span className="flex items-center gap-1">
          <PersonIcon />
          {author || "ADMIN"}
        </span>
      </div>

      <h3 className="text-white text-[15px] font-normal leading-snug">{title}</h3>
    </div>
  );
};

// ── empty and loading states ─────────────────────────────────────────────────

/**
 * Shown while the first request is still in flight, so the page never flashes
 * "coming soon" at a visitor who is about to be given a grid of posts.
 */
const BlogGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10 max-w-6xl mx-auto">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex flex-col gap-3" aria-hidden="true">
        <div className="rounded-xl aspect-[4/3] bg-[#EDE7D9]/10 animate-pulse" />
        <div className="h-2.5 w-1/2 rounded-full bg-[#EDE7D9]/10 animate-pulse" />
        <div className="h-3 w-4/5 rounded-full bg-[#EDE7D9]/10 animate-pulse" />
      </div>
    ))}
  </div>
);

/** What stands in for the grid when the CMS holds no published posts. */
const ComingSoon = () => (
  <div className="max-w-xl mx-auto px-2 py-16 sm:py-24 text-center">
    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EDE7D9]/10">
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
        <path
          d="M4 5.5A1.5 1.5 0 0 1 5.5 4H14l6 6v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z"
          fill="none"
          stroke="#C7DDB5"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M14 4v6h6" fill="none" stroke="#C7DDB5" strokeWidth="1.5" strokeLinejoin="round" />
        <path
          d="M8 13.5h8M8 16.5h5"
          stroke="#C7DDB5"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>

    <h2 className="mt-7 font-display text-2xl sm:text-3xl font-medium text-[#F4EDE1]">
      Blogs Coming Soon
    </h2>

    <p className="mt-3 text-[14px] sm:text-[15px] leading-relaxed text-[#C9C0AC]">
      We&rsquo;re putting together stories from the farm — on land, growing and
      the people behind it. Check back shortly.
    </p>
  </div>
);

// ── main component ────────────────────────────────────────────────────────────
/** The card's date line is upper-case, so format to match the design. */
function formatCardDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    .toUpperCase();
}

const Blogs = () => {
  const [heroVisible, setHeroVisible] = useState(false);
  const gridRef    = useRef(null);
  const viewAllRef = useRef(null);

  // Raised by "View All", which is the only thing that refetches this list.
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data: feed, loading } = useApiData(
    async (signal) => {
      const rows = await getBlogs({ limit }, signal);

      // `null` is the client saying it could not reach the API at all, which
      // is the one case worth holding the previous render for. An empty array
      // is a real answer — there are no posts — and must be adopted, or the
      // page would keep showing whatever it had last.
      if (!rows) return null;

      return {
        // A full page back means there is probably another page behind it.
        hasMore: rows.length >= limit && limit < MAX_LIMIT,
        items: rows.map((b) => ({
          id: b.id,
          slug: b.slug,
          img: b.featured_image_url || null,
          title: b.title,
          category: b.category?.name,
          date: formatCardDate(b.published_at || b.created_at),
          author: (b.author_name || "Admin").toUpperCase(),
        })),
      };
    },
    EMPTY_FEED,
    [limit],
  );

  const posts = feed.items;
  const isEmpty = !loading && posts.length === 0;

  // Hero entrance
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Cards: staggered fade-up on scroll enter.
  //
  // This has to re-run whenever `posts` changes. The built-in list renders
  // first and the CMS list replaces it a moment later, so every card the API
  // brings in is a DOM node this animation has never seen. Running only on
  // mount meant those nodes kept the `opacity: 0` they were rendered with and
  // stayed invisible — which is why posts "sometimes" did not show: the ones
  // whose id happened to match the built-in list survived, because React
  // reused those nodes, and the rest silently vanished.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Cards already revealed keep what they have: re-animating the whole grid
    // when "View All" appends to it would flash everything already on screen.
    const cards = Array.from(grid.querySelectorAll(".blog-card:not([data-revealed])"));
    if (!cards.length) return;
    cards.forEach((el) => el.setAttribute("data-revealed", ""));

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: { amount: 0.6, from: "start" },
          scrollTrigger: {
            trigger: grid,
            start: "top 85%",
            once: true,
          },
        }
      );
    }, gridRef);

    // Fail open. If the trigger never fires — a stale measurement, a refresh
    // landing at the wrong moment — show the cards anyway rather than leave
    // the page looking like there are no posts at all.
    const safety = setTimeout(() => {
      cards.forEach((el) => {
        if (parseFloat(window.getComputedStyle(el).opacity) < 1) {
          gsap.set(el, { opacity: 1, y: 0 });
        }
      });
    }, 2500);

    return () => {
      clearTimeout(safety);
      // `revert` puts the cards back to the visible state they render in, and
      // touches only this grid — the old cleanup called
      // `ScrollTrigger.getAll().kill()`, which killed the triggers belonging
      // to every other section on the page as well.
      ctx.revert();
    };
  }, [posts]);

  // View All: fade-up on scroll enter. Keyed to `hasMore` because the button
  // only exists while there is another page to ask for.
  useLayoutEffect(() => {
    const button = viewAllRef.current;
    if (!button) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        button,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: button,
            start: "top 92%",
            once: true,
          },
        }
      );
    }, viewAllRef);

    return () => ctx.revert();
  }, [feed.hasMore]);

  // View All hover: letter-spacing expand
  const handleViewAllEnter = () => {
    gsap.to(viewAllRef.current, {
      letterSpacing: "0.12em",
      duration: 0.3,
      ease: "power2.out",
    });
  };
  const handleViewAllLeave = () => {
    gsap.to(viewAllRef.current, {
      letterSpacing: "0em",
      duration: 0.3,
      ease: "power2.inOut",
    });
  };

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative h-screen w-full overflow-hidden">
        <div className="relative w-full h-full">
          <img
            src={BlogBanner}
            alt="Blog Banner"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3000ms] ease-out"
            style={{ transform: heroVisible ? "scale(1.05)" : "scale(1.15)" }}
          />

          <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-center pt-6 md:pt-8 px-6 md:px-10">
            <img
              src={logo_img}
              alt="GrowFarms – Live with Nature"
              className="h-12 md:h-14 lg:h-16 w-auto transition-all duration-700 ease-out"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0px)" : "translateY(-12px)",
              }}
            />
          </div>

          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <h1
              className="text-white font-light tracking-[0.25em] text-3xl sm:text-4xl md:text-5xl lg:text-6xl transition-all duration-1000 ease-out"
              style={{
                textShadow: "0 4px 20px rgba(0,0,0,0.45)",
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0px)" : "translateY(20px)",
              }}
            >
              Blogs
            </h1>
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
        </div>
      </section>

      {/* ── BLOG GRID ────────────────────────────────────────────────────── */}
      <section className="w-full bg-[#315537] px-6 md:px-10 lg:px-16 pt-10 pb-16">
        {loading && <BlogGridSkeleton />}

        {isEmpty && <ComingSoon />}

        {!loading && posts.length > 0 && (
          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10 max-w-6xl mx-auto"
          >
            {posts.map((post) => (
              <div key={post.id} className="blog-card">
                <BlogCard
                  img={post.img}
                  title={post.title}
                  category={post.category}
                  date={post.date}
                  author={post.author}
                  slug={post.slug}
                />
              </div>
            ))}
          </div>
        )}

        {feed.hasMore && (
          <div className="mt-12 flex justify-center">
            <button
              ref={viewAllRef}
              onClick={() => setLimit(MAX_LIMIT)}
              onMouseEnter={handleViewAllEnter}
              onMouseLeave={handleViewAllLeave}
              className="text-white text-base font-normal underline underline-offset-4 decoration-white/60 hover:decoration-white transition-[text-decoration-color] duration-300 cursor-pointer"
            >
              View All
            </button>
          </div>
        )}
      </section>
    </>
  );
};

export default Blogs;