import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import BlogBanner from "../assets/images/blog_details.png";
import logo_img from "../assets/images/grow-farms-logo.png"; // ⚠️ adjust to your actual logo path
import farmImg1 from "../assets/images/farm_couple_1.jpg"; // ⚠️ swap for your real assets
import farmImg2 from "../assets/images/farm_couple_1.jpg";
import blogThumb from "../assets/images/Blog_Banner_2.jpeg"; // ⚠️ swap for the mountain-lake image

gsap.registerPlugin(ScrollTrigger);

const checklist = [
  "Make ridges when planting crops on your farm of flat land.",
  "Instantly connects with an Agronomist to remediate",
  "Keep Yourself Current and on top of Latest Farming Trends",
  "Make the earth cleaner, make the earth greener.",
];

const steps = [
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

const otherBlogs = [
  {
    image: blogThumb,
    category: "Mixed Farming",
    date: "March 28, 2024",
    title: "Better Agriculture for Better Future",
  },
  {
    image: blogThumb,
    category: "Mixed Farming",
    date: "March 28, 2024",
    title: "A farmer is a person who works in agriculture.",
  },
  {
    image: blogThumb,
    category: "Mixed Farming",
    date: "March 28, 2024",
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
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="#B9C4AE" strokeWidth="1.6" fill="none" />
    <path d="M3 9h18M8 3v4M16 3v4" stroke="#B9C4AE" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const AdminIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
    <circle cx="12" cy="8" r="3.2" stroke="#B9C4AE" strokeWidth="1.6" fill="none" />
    <path
      d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5"
      stroke="#B9C4AE"
      strokeWidth="1.6"
      strokeLinecap="round"
      fill="none"
    />
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

const BlogDetails = () => {
  /* ---------- Hero mount animation (unchanged) ---------- */
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      setTimeout(() => setHeroVisible(true), 50);
    });
    return () => cancelAnimationFrame(t);
  }, []);

  /* ---------- Page-wide ref (scopes the GSAP context) ---------- */
  const pageRef = useRef(null);

  /* ---------- Section-level refs — same granularity as About.jsx ---------- */
  const detailsRef = useRef(null); // intro heading + paragraphs
  const imgsRef = useRef(null); // image pair
  const growRef = useRef(null); // "everything grown" block incl. checklist
  const stepsWrapRef = useRef(null); // numbered steps grid
  const quoteRef = useRef(null); // quote card
  const otherBlogRef = useRef(null); // whole "Other Blog" section

  /* ---------- GSAP ScrollTrigger — About.jsx-style section reveals ---------- */
  useLayoutEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    // FIX 1: reset scroll to top on mount. When this page is reached via
    // client-side navigation (React Router push), the browser can retain the
    // previous page's scroll position for a frame. ScrollTrigger reads scroll
    // position at creation time, so a stale position causes it to compute the
    // wrong trigger point on the *first* render — this is the #1 reason the
    // "works on localhost, breaks in production" symptom shows up (dev's hot
    // reload always starts at scroll 0, a real user's route change doesn't).
    window.scrollTo(0, 0);

    // Collect every section we animate so the safety-net fallback (FIX 3)
    // can force them visible if something upstream still goes wrong.
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

          // Shared helper — always fromTo so final state is explicit.
          // FIX 2: start is now "top 95%" instead of "top 88%". A later
          // start point means the element only needs to be barely inside the
          // viewport to fire, which makes the trigger far more tolerant of
          // small layout/measurement differences between dev and prod.
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
              }
            );
          };

          reveal(detailsRef.current);
          reveal(imgsRef.current, { scale: 0.97 }, { scale: 1 });
          reveal(growRef.current);
          reveal(stepsWrapRef.current);
          reveal(
            quoteRef.current,
            { y: isMobile ? 30 : 50, scale: 0.97 },
            { scale: 1, duration: 0.8 }
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

          // FIX 3: extra refresh once the *entire* window (fonts, all
          // network requests, everything) has finished loading. Production
          // servers/CDNs are almost always slower than a local dev server,
          // so fonts swapping in or late-loading assets can shift layout
          // after our image-based refresh already ran. This second refresh
          // catches that.
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
        }
      );
    }, pageRef);

    // FIX 4 (safety net): if for any reason a section never received its
    // ScrollTrigger-driven "to" state within 2.5s (blocked JS chunk, a
    // failed dynamic import, matchMedia edge case, etc.), force it to its
    // final visible state directly. This guarantees content can never be
    // permanently stuck invisible in production, even if the root cause
    // above isn't the only one at play.
    const safetyTimer = setTimeout(() => {
      revealTargets.forEach((el) => {
        const computed = window.getComputedStyle(el);
        if (parseFloat(computed.opacity) < 1) {
          gsap.set(el, { opacity: 1, y: 0, scale: 1, clearProps: "transform" });
        }
      });
    }, 2500);

    return () => {
      clearTimeout(safetyTimer);
      ctx.revert(); // kills all ScrollTriggers created inside ctx
    };
  }, []);

  return (
    <div ref={pageRef}>
      {/* ---------------- HERO (unchanged) ---------------- */}
      <section className="relative w-full h-[60vh] min-h-[420px] sm:h-[70vh] sm:min-h-[500px] md:h-screen md:min-h-[650px] overflow-hidden">
        <div className="relative w-full h-full">
          {/* Hero Image */}
          <img
            src={BlogBanner}
            alt="Blog Banner"
            fetchPriority="high"
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
          </div>

          {/* Hero Content */}
          <div
            className="
              absolute
              inset-0
              z-30
              flex
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
                Better Agriculture for a Better Future
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
                At Grow Farms, we believe that owning agricultural land is
                more than an investment
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
          {/* Intro text block */}
          <div ref={detailsRef}>
            <h1 className="font-display text-2xl sm:text-4xl lg:text-[2.75rem] font-medium leading-tight text-[#F4EDE1] max-w-4xl">
              Better Agriculture for Better Future
            </h1>

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
          </div>

          {/* Image pair */}
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

          {/* Everything on our farm is grown */}
          <div ref={growRef} className="mt-14 sm:mt-20 max-w-4xl">
            <h2 className="font-display text-xl sm:text-3xl font-medium text-[#F4EDE1]">
              Everything on our farm is grown
            </h2>

            <p className="mt-4 text-[#D8CFBB] text-[14px] sm:text-[15px] leading-relaxed max-w-5xl">
              They offer adaptability, high nutritional value, and can yield higher
              yields with minimal agronomic inputs, and provide{" "}
              <span className="text-[#C7DDB5] underline decoration-[#C7DDB5]/50 underline-offset-2">
                significant potential for sustainable
              </span>{" "}
              agriculture and provide nutritional and income security for small and
              marginal farmers in dry and rainfed semi-arid regions.
            </p>

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
      <div ref={otherBlogRef}>
        <section className="relative text-[#EDE7D9] px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 lg:pt-28 pb-16 sm:pb-20 lg:pb-24 overflow-hidden">
          <h2 className="font-display text-center text-lg sm:text-2xl font-medium text-[#F4EDE1] underline decoration-1 underline-offset-8">
            Other Blog
          </h2>

          <div className="mt-10 sm:mt-14 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {otherBlogs.map((blog, i) => (
              <article key={i} className="group">
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-xl shadow-black/20">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    loading="lazy"
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
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon />
                    {blog.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <AdminIcon />
                    Admin
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
    </div>
  );
};

export default BlogDetails;