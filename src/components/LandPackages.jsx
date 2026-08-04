import { useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Land_Pakages_1 from "../assets/images/Land_Pakages_1.jpg";
import Land_Pakages_2 from "../assets/images/Land_Pakages_2.jpg";

gsap.registerPlugin(ScrollTrigger);

const packages = [
  {
    id: 1,
    title: "Farm Land",
    description:
      "21,780 Sq. Ft. Agricultural Land With Basic Plantation, Fencing, Water, Electricity, Road Access, And All Essential Common Amenities.",
    tags: ["Road Access", "Fencing", "₹5.99 Lakh"],
    images: [Land_Pakages_1, Land_Pakages_1, Land_Pakages_1],
  },
  {
    id: 2,
    title: "Farmland With 2BHK Bungalow",
    description:
      "21,780 Sq. Ft. Agricultural Land With An 800 Sq. Ft. 2BHK Bungalow And All Essential Basic Amenities Included.",
    tags: ["21,780 Sq. Ft", "2Bhk", "₹5.99 Lakh"],
    images: [Land_Pakages_2, Land_Pakages_2, Land_Pakages_2],
  },
];

function PackageCard({ pkg, index }) {
  const cardRef = useRef(null);
  const imgRef = useRef(null);
  const btnRef = useRef(null);
  const overlayRef = useRef(null);
  const tagsRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const glowRef = useRef(null);
  const dotRefs = useRef([]);
  const activeSlide = useRef(0);
  const intervalRef = useRef(null);
  const isAnimating = useRef(false);
  const rafRef = useRef(null);

  const prefersReduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 1. Scroll reveal ─────────────────────────────────────────── */
  useEffect(() => {
    if (prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 70, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          delay: index * 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        },
      );
    }, cardRef);
    return () => ctx.revert();
  }, [index]);

  /* ── 2. Slide‑in stagger for inner content on first view ─────── */
  useEffect(() => {
    if (prefersReduced()) return;
    const targets = [
      titleRef.current,
      descRef.current,
      tagsRef.current,
      btnRef.current,
    ].filter(Boolean);
    gsap.set(targets, { opacity: 0, y: 22 });

    ScrollTrigger.create({
      trigger: cardRef.current,
      start: "top 82%",
      onEnter: () => {
        gsap.to(targets, {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.1,
          delay: index * 0.2 + 0.35,
          ease: "power2.out",
        });
      },
      once: true,
    });
  }, [index]);

  /* ── 3. Auto slideshow ───────────────────────────────────────── */
  const goToSlide = useCallback(
    (next) => {
      if (isAnimating.current || next === activeSlide.current) return;
      isAnimating.current = true;
      const img = imgRef.current;
      gsap.to(img, {
        opacity: 0,
        scale: 1.06,
        duration: 0.32,
        ease: "power2.in",
        onComplete: () => {
          img.src = pkg.images[next];
          dotRefs.current.forEach((d, i) => {
            if (!d) return;
            gsap.to(d, {
              width: i === next ? 20 : 10,
              backgroundColor:
                i === next ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.4)",
              duration: 0.3,
              ease: "power2.out",
            });
          });
          activeSlide.current = next;
          gsap.to(img, {
            opacity: 1,
            scale: 1,
            duration: 0.48,
            ease: "power2.out",
            onComplete: () => {
              isAnimating.current = false;
            },
          });
        },
      });
    },
    [pkg.images],
  );

  useEffect(() => {
    // init dot sizes
    dotRefs.current.forEach((d, i) => {
      if (!d) return;
      gsap.set(d, {
        width: i === 0 ? 20 : 10,
        backgroundColor:
          i === 0 ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.4)",
      });
    });

    if (prefersReduced()) return;
    intervalRef.current = setInterval(
      () => {
        goToSlide((activeSlide.current + 1) % pkg.images.length);
      },
      3200 + index * 400,
    );
    return () => clearInterval(intervalRef.current);
  }, [goToSlide, index, pkg.images.length]);

  /* ── 4. 3‑D tilt on mouse‑move ──────────────────────────────── */
  const handleMouseMove = useCallback((e) => {
    if (prefersReduced()) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card) return;
      const { left, top, width, height } = card.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5; // -0.5 → +0.5
      const y = (e.clientY - top) / height - 0.5;

      gsap.to(card, {
        rotateY: x * 12,
        rotateX: -y * 12,
        transformPerspective: 900,
        duration: 0.4,
        ease: "power2.out",
      });

      // parallax image
      if (imgRef.current) {
        gsap.to(imgRef.current, {
          x: x * 18,
          y: y * 12,
          scale: 1.06,
          duration: 0.5,
          ease: "power2.out",
        });
      }

      // glow follow
      if (glowRef.current) {
        gsap.to(glowRef.current, {
          x: e.clientX - left - 60,
          y: e.clientY - top - 60,
          opacity: 0.55,
          duration: 0.35,
          ease: "power2.out",
        });
      }
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const card = cardRef.current;
    if (!card) return;
    gsap.to(card, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.65,
      ease: "elastic.out(1, 0.55)",
    });
    if (imgRef.current) {
      gsap.to(imgRef.current, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.65,
        ease: "elastic.out(1, 0.55)",
      });
    }
    if (glowRef.current) {
      gsap.to(glowRef.current, { opacity: 0, duration: 0.4 });
    }
  }, []);

  /* ── 5. Magnetic Book Now ────────────────────────────────────── */
  const handleBtnMove = useCallback((e) => {
    if (prefersReduced()) return;
    const btn = btnRef.current;
    if (!btn) return;
    const { left, top, width, height } = btn.getBoundingClientRect();
    const cx = left + width / 2;
    const cy = top + height / 2;
    const dx = (e.clientX - cx) * 0.35;
    const dy = (e.clientY - cy) * 0.35;
    gsap.to(btn, { x: dx, y: dy, duration: 0.3, ease: "power2.out" });
  }, []);

  const handleBtnEnter = useCallback(() => {
    gsap.to(btnRef.current, {
      scale: 1.05,
      backgroundColor: "#f0f0f0",
      duration: 0.25,
      ease: "power2.out",
    });
  }, []);

  const handleBtnLeave = useCallback(() => {
    gsap.to(btnRef.current, {
      x: 0,
      y: 0,
      scale: 1,
      backgroundColor: "#ffffff",
      duration: 0.45,
      ease: "elastic.out(1, 0.5)",
    });
  }, []);

  const handleBtnDown = useCallback(() => {
    gsap.to(btnRef.current, { scale: 0.95, duration: 0.1, ease: "power2.in" });
  }, []);

  const handleBtnUp = useCallback(() => {
    gsap.to(btnRef.current, { scale: 1.05, duration: 0.2, ease: "power2.out" });
  }, []);

  /* ── 6. Tag hover pulse ──────────────────────────────────────── */
  const handleTagEnter = (el) => {
    gsap.to(el, {
      scale: 1.1,
      backgroundColor: "rgba(255,255,255,0.25)",
      duration: 0.22,
      ease: "power2.out",
    });
  };
  const handleTagLeave = (el) => {
    gsap.to(el, {
      scale: 1,
      backgroundColor: "rgba(255,255,255,1)",
      duration: 0.22,
      ease: "power2.out",
    });
  };

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-3xl shadow-2xl cursor-pointer"
      style={{
        opacity: 0,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glow blob that follows cursor */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute z-20 h-32 w-32 rounded-full opacity-0"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)",
          filter: "blur(6px)",
          transform: "translate(0,0)",
        }}
      />

      {/* Full-height image */}
      <div className="relative h-[480px] w-full overflow-hidden">
        <img
          ref={imgRef}
          src={pkg.images[0]}
          alt={pkg.title}
          className="h-full w-full object-cover"
          style={{
            willChange: "transform, opacity",
            transformOrigin: "center center",
          }}
        />

        {/* Dark-to-green gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.45) 45%, rgba(20,60,25,0.96) 100%)",
          }}
        />

        {/* Bottom overlay content */}
        <div
          ref={overlayRef}
          className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-5 pt-3"
          style={{
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            background:
              "linear-gradient(360deg, rgba(255,255,255,0.12) 0%, rgba(31,78,39,0) 100%)",
          }}
        >
          {/* Slide dots */}
          <div className="mb-4 flex items-center justify-center gap-2">
            {pkg.images.map((_, i) => (
              <button
                key={i}
                ref={(el) => (dotRefs.current[i] = el)}
                onClick={() => goToSlide(i)}
                aria-label={`Slide ${i + 1}`}
                className="h-[10px] rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.4)", width: 10 }}
              />
            ))}
          </div>

          <h3
            ref={titleRef}
            className="text-2xl font-semibold text-white leading-tight"
          >
            {pkg.title}
          </h3>

          <p
            ref={descRef}
            className="my-2 sub_font text-xs text-white/85 line-clamp-2 leading-relaxed"
          >
            {pkg.description}
          </p>

          {/* Tags */}
          <div ref={tagsRef} className="flex flex-wrap gap-2">
            {pkg.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full sub_font border border-white/30 bg-white px-3 py-1 text-xs font-medium text-green-800"
                style={{ cursor: "default" }}
                onMouseEnter={(e) => handleTagEnter(e.currentTarget)}
                onMouseLeave={(e) => handleTagLeave(e.currentTarget)}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Book Now — magnetic */}
          <button
            ref={btnRef}
            onMouseEnter={handleBtnEnter}
            onMouseLeave={handleBtnLeave}
            onMouseMove={handleBtnMove}
            onMouseDown={handleBtnDown}
            onMouseUp={handleBtnUp}
            className="relative mt-5 w-full sub_font  overflow-hidden rounded-full bg-white py-3 font-bold text-green"
            style={{ willChange: "transform" }}
          >
            {/* shimmer sweep */}
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full"
              style={{
                background:
                  "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)",
                animation: "shimmer 2.6s infinite",
              }}
            />
            Book Now
          </button>
        </div>
      </div>

      {/* shimmer keyframe injected once */}
      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
      `}</style>
    </div>
  );
}

export default function LandPackages() {
  const headingRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: -32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full min-h-screen py-14 px-4 sm:px-6 md:px-10 lg:px-16"
    >
      <h2
        ref={headingRef}
        className="mb-10 text-center text-white md:mb-14"
        style={{
          fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
          fontWeight: 400,
          letterSpacing: "0.01em",
          opacity: 0,
        }}
      >
        Land Pakages
      </h2>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
        {packages.map((pkg, i) => (
          <PackageCard key={pkg.id} pkg={pkg} index={i} />
        ))}
      </div>
    </section>
  );
}
