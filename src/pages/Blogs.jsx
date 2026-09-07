import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BlogBanner from "../assets/images/Blog_Banner_2.jpeg";
import logo_img from "../assets/images/grow-farms-logo.png";

import img1 from "../assets/images/Blog_Banner_2.jpeg";
import img2 from "../assets/images/Blog_Banner_2.jpeg";
import img3 from "../assets/images/Blog_Banner_2.jpeg";
import img4 from "../assets/images/Blog_Banner_2.jpeg";
import img5 from "../assets/images/Blog_Banner_2.jpeg";
import img6 from "../assets/images/Blog_Banner_2.jpeg";
import img7 from "../assets/images/Blog_Banner_2.jpeg";
import img8 from "../assets/images/Blog_Banner_2.jpeg";
import img9 from "../assets/images/Blog_Banner_2.jpeg";
import { useNavigate } from "react-router-dom";
import useApiData from "../hooks/useApiData";
import { getBlogs } from "../lib/api";

gsap.registerPlugin(ScrollTrigger);

const PAGE_SIZE = 12;

// The API refuses to return more than 100 rows in one page, so this is what
// "all of them" actually means here.
const MAX_LIMIT = 100;

const FALLBACK_POSTS = [
  { id: 1, img: img1, title: "Better Agriculture for Better Future" },
  { id: 2, img: img2, title: "A farmer is a person who works in agriculture." },
  { id: 3, img: img3, title: "A farmer is a person who works in agriculture." },
  { id: 4, img: img4, title: "A farmer is a person who works in agriculture." },
  { id: 5, img: img5, title: "A farmer is a person who works in agriculture." },
  { id: 6, img: img6, title: "A farmer is a person who works in agriculture." },
  { id: 7, img: img7, title: "A farmer is a person who works in agriculture." },
  { id: 8, img: img8, title: "A farmer is a person who works in agriculture." },
  { id: 9, img: img9, title: "A farmer is a person who works in agriculture." },
];

// The built-in list is all there is to show, so it never offers "View All".
const FALLBACK_FEED = { items: FALLBACK_POSTS, hasMore: false };

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
        <img
          ref={imgRef}
          src={img}
          alt={title}
          className="w-full h-full object-cover will-change-transform"
        />

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

  const { data: feed } = useApiData(
    async (signal) => {
      const rows = await getBlogs({ limit }, signal);
      if (!rows?.length) return null;
      return {
        // A full page back means there is probably another page behind it.
        hasMore: rows.length >= limit && limit < MAX_LIMIT,
        items: rows.map((b) => ({
          id: b.id,
          slug: b.slug,
          img: b.featured_image_url || FALLBACK_POSTS[0].img,
          title: b.title,
          category: b.category?.name,
          date: formatCardDate(b.published_at || b.created_at),
          author: (b.author_name || "Admin").toUpperCase(),
        })),
      };
    },
    FALLBACK_FEED,
    [limit],
  );

  const posts = feed.items;

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
              Blog
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