import { useState, useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import AboutBanner from "../assets/images/About_Banner.png";
import logo_img from "../assets/images/grow-farms-logo.png";
import TrustSection from "../components/TrustSection";
import CorePhilosophy from "../components/CorePhilosophy";
import ParallaxSection from "../components/ParallaxSection";

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  /* ─── Hero entrance state ─────────────────────────────────────── */
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setTimeout(() => setHeroVisible(true), 60);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ─── Mouse parallax on banner image (desktop only) ──────────── */
  const bannerImgRef = useRef(null);
  const bannerWrapRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    let rafId;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    const STRENGTH = 12; // px max shift
    const LERP = 0.06;   // smoothing factor

    const onMouseMove = (e) => {
      // Only on desktop (md+)
      if (window.innerWidth < 768) return;

      const { innerWidth: W, innerHeight: H } = window;
      // Normalise to [-1, 1]
      targetX = ((e.clientX / W) - 0.5) * 2;
      targetY = ((e.clientY / H) - 0.5) * 2;
    };

    const tick = () => {
      currentX += (targetX - currentX) * LERP;
      currentY += (targetY - currentY) * LERP;

      if (bannerImgRef.current) {
        bannerImgRef.current.style.transform = `
          scale(1.08)
          translate(${-currentX * STRENGTH}px, ${-currentY * STRENGTH}px)
        `;
      }

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
      // Reset transform on cleanup
      if (bannerImgRef.current) {
        bannerImgRef.current.style.transform = "";
      }
    };
  }, []);

  /* ─── GSAP ScrollTrigger for the three child sections ────────── */
  const pageRef = useRef(null);
  const trustRef = useRef(null);
  const coreRef = useRef(null);
  const parallaxRef = useRef(null);

  useLayoutEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          isMobile: "(max-width: 639px)",
          isDesktop: "(min-width: 640px)",
        },
        (context) => {
          const { isMobile } = context.conditions;
          const travel = isMobile ? 28 : 44;
          const dur = isMobile ? 0.65 : 0.85;

          // Shared helper — always fromTo so final state is explicit
          const reveal = (el, extraFrom = {}, extraTo = {}, startPos = "top 82%") => {
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

          reveal(trustRef.current);
          reveal(coreRef.current, { y: travel * 1.2 }, {}, "top 85%");
          reveal(parallaxRef.current, { scale: 0.97 }, { scale: 1 }, "top 88%");

          // Refresh after layout settles
          const images = pageRef.current
            ? Array.from(pageRef.current.querySelectorAll("img"))
            : [];
          let loaded = 0;
          const onLoad = () => {
            loaded += 1;
            if (loaded >= images.length) ScrollTrigger.refresh();
          };
          images.forEach((img) => {
            if (img.complete) onLoad();
            else {
              img.addEventListener("load", onLoad, { once: true });
              img.addEventListener("error", onLoad, { once: true });
            }
          });

          let resizeTimer;
          const onResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
          };
          window.addEventListener("resize", onResize);

          return () => {
            window.removeEventListener("resize", onResize);
            clearTimeout(resizeTimer);
            images.forEach((img) => {
              img.removeEventListener("load", onLoad);
              img.removeEventListener("error", onLoad);
            });
          };
        }
      );
    }, pageRef);

    return () => ctx.revert();
  }, []);

  /* ─── Render ──────────────────────────────────────────────────── */
  return (
    <section ref={pageRef} className="relative w-full overflow-hidden">

      {/* ── Banner ─────────────────────────────────────────────── */}
      <div
        ref={bannerWrapRef}
        className="relative w-full h-[70vh] sm:h-[75vh] md:h-[90vh] overflow-hidden"
      >
        {/* Banner image — Ken Burns on mount, mouse parallax on desktop */}
        <img
          ref={bannerImgRef}
          src={AboutBanner}
          alt="About Banner"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover
            motion-reduce:transition-none motion-reduce:transform-none"
          style={{
            objectPosition: "center 20%",
            // Ken Burns: start slightly zoomed, settle to 1.08 (parallax adds the rest)
            transform: heroVisible ? "scale(1.08)" : "scale(1.18)",
            transition: "transform 2800ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            willChange: "transform",
          }}
        />

        {/* Subtle dark vignette — edges only, keeps midtones clean */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.28) 100%)",
          }}
        />

        {/* ── Top bar: logo ────────────────────────────────────── */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-center pt-6 md:pt-8 px-6 md:px-10">
          <img
            src={logo_img}
            alt="GrowFarms – Live with Nature"
            className="h-12 md:h-14 lg:h-16 w-auto object-contain
              motion-reduce:transition-none"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(-14px)",
              transition: "opacity 700ms ease-out, transform 700ms ease-out",
              transitionDelay: "100ms",
            }}
          />
        </div>

        {/* ── Hero text — centred ──────────────────────────────── */}
        <div className="absolute inset-0 z-20 flex items-center justify-center flex-col px-5 text-center">

          {/* Eyebrow label */}
          <span
            className="mb-3 text-[10px] sm:text-xs tracking-[0.25em] uppercase
              text-white/70 font-medium motion-reduce:transition-none"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(10px)",
              transition: "opacity 700ms ease-out, transform 700ms ease-out",
              transitionDelay: "200ms",
            }}
          >
            About GrowFarms
          </span>

          <h1
            className="text-white font-light tracking-[0.08em]
              text-[22px] min-[400px]:text-[26px] sm:text-[32px] md:text-[40px] lg:text-[48px]
              leading-tight max-w-3xl motion-reduce:transition-none"
            style={{
              textShadow: "0 4px 24px rgba(0,0,0,0.40)",
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(18px)",
              transition: "opacity 800ms ease-out, transform 800ms ease-out",
              transitionDelay: "320ms",
            }}
          >
            Where Nature Meets Smart Investment
          </h1>

          <p
            className="mt-3 sm:mt-4 text-white/85 max-w-xl
              text-[13px] sm:text-[15px] md:text-[16px] lg:text-[17px]
              leading-relaxed tracking-wide motion-reduce:transition-none"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(14px)",
              transition: "opacity 800ms ease-out, transform 800ms ease-out",
              transitionDelay: "480ms",
            }}
          >
            We help you own premium farmland with complete transparency,
            expert guidance, and long-term value.
          </p>

          {/* Scroll cue — animated chevron */}
          <div
            className="mt-10 sm:mt-14 flex flex-col items-center gap-1
              motion-reduce:hidden"
            style={{
              opacity: heroVisible ? 1 : 0,
              transition: "opacity 600ms ease-out",
              transitionDelay: "900ms",
            }}
          >
            <span className="text-white/50 text-[10px] tracking-[0.2em] uppercase">
              Scroll
            </span>
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-white/50 animate-bounce"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* ── Bottom green gradient fade ───────────────────────── */}
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

      {/* ── Child sections — each wrapped for scroll-reveal ─────── */}
      <div ref={trustRef}>
        <TrustSection />
      </div>

      <div ref={coreRef}>
        <CorePhilosophy />
      </div>

      <div ref={parallaxRef}>
        <ParallaxSection />
      </div>

    </section>
  );
};

export default About;