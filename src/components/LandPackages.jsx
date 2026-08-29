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
    tags: [
      { label: "Road Access" },
      { label: "Fencing" },
      { label: "₹5.99 Lakh", accent: "#D4AF37" },
    ],
    button: { variant: "outline", color: "#D4AF37" },
    images: [Land_Pakages_1, Land_Pakages_1, Land_Pakages_1],
    rotate: -5,
  },
  {
    id: 2,
    title: "Farmland With 2BHK Bungalow",
    description:
      "21,780 Sq. Ft. Agricultural Land With An 800 Sq. Ft. 2BHK Bungalow And All Essential Basic Amenities Included.",
    tags: [
      { label: "21,780 Sq. Ft." },
      { label: "2BHK" },
      { label: "₹15.98 Lakh", accent: "#4C7A4F" },
    ],
    button: { variant: "solid", color: "#D4AF37" },
    images: [Land_Pakages_2, Land_Pakages_2, Land_Pakages_2],
    rotate: 5,
  },
];

function PackageCard({ pkg, index }) {
  const cardRef = useRef(null);
  const imgRef = useRef(null);
  const btnRef = useRef(null);
  const tagsRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const activeSlide = useRef(0);
  const intervalRef = useRef(null);
  const isAnimating = useRef(false);

  const prefersReduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isDesktop = () =>
    typeof window !== "undefined" && window.innerWidth >= 768;

  /* ── Scroll reveal: fade + rise + settle into fan rotation ──────── */
  useEffect(() => {
    if (prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          y: 70,
          scale: 0.94,
          rotate: 0,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotate: isDesktop() ? pkg.rotate : 0,
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
  }, [index, pkg.rotate]);

  /* ── Staggered inner content reveal ─────────────────────────────── */
  useEffect(() => {
    if (prefersReduced()) return;
    const targets = [titleRef.current, descRef.current, tagsRef.current, btnRef.current].filter(
      Boolean,
    );
    gsap.set(targets, { opacity: 0, y: 18 });

    const st = ScrollTrigger.create({
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
    return () => st.kill();
  }, [index]);

  /* ── Auto slideshow (quiet crossfade, no dots) ──────────────────── */
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
    if (prefersReduced() || pkg.images.length < 2) return;
    intervalRef.current = setInterval(
      () => goToSlide((activeSlide.current + 1) % pkg.images.length),
      3400 + index * 400,
    );
    return () => clearInterval(intervalRef.current);
  }, [goToSlide, index, pkg.images.length]);

  /* ── Hover: settle flat, lift, zoom image ───────────────────────── */
  const handleMouseEnter = useCallback(() => {
    if (prefersReduced()) return;
    gsap.to(cardRef.current, {
      rotate: 0,
      y: -8,
      scale: 1.015,
      boxShadow: "0 30px 60px -20px rgba(0,0,0,0.55)",
      duration: 0.5,
      ease: "power3.out",
    });
    gsap.to(imgRef.current, { scale: 1.08, duration: 0.6, ease: "power2.out" });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (prefersReduced()) return;
    gsap.to(cardRef.current, {
      rotate: isDesktop() ? pkg.rotate : 0,
      y: 0,
      scale: 1,
      boxShadow: "0 20px 45px -20px rgba(0,0,0,0.4)",
      duration: 0.6,
      ease: "elastic.out(1, 0.6)",
    });
    gsap.to(imgRef.current, { scale: 1, duration: 0.6, ease: "power2.out" });
  }, [pkg.rotate]);

  /* ── Magnetic Book Now ───────────────────────────────────────────── */
  const handleBtnMove = useCallback((e) => {
    if (prefersReduced()) return;
    const btn = btnRef.current;
    if (!btn) return;
    const { left, top, width, height } = btn.getBoundingClientRect();
    const dx = (e.clientX - (left + width / 2)) * 0.3;
    const dy = (e.clientY - (top + height / 2)) * 0.3;
    gsap.to(btn, { x: dx, y: dy, duration: 0.3, ease: "power2.out" });
  }, []);

  const handleBtnEnter = useCallback(() => {
    gsap.to(btnRef.current, { scale: 1.04, duration: 0.25, ease: "power2.out" });
  }, []);

  const handleBtnLeave = useCallback(() => {
    gsap.to(btnRef.current, {
      x: 0,
      y: 0,
      scale: 1,
      duration: 0.45,
      ease: "elastic.out(1, 0.5)",
    });
  }, []);

  /* ── Tag hover pulse ─────────────────────────────────────────────── */
  const handleTagEnter = (el) => {
    gsap.to(el, { scale: 1.08, duration: 0.22, ease: "power2.out" });
  };
  const handleTagLeave = (el) => {
    gsap.to(el, { scale: 1, duration: 0.22, ease: "power2.out" });
  };

  const isOutline = pkg.button.variant === "outline";

  return (
    <div
      ref={cardRef}
      className="relative w-full max-w-[420px] mx-auto rounded-[2rem] border border-white/10 bg-[#214527] p-4 sm:p-5 shadow-[0_20px_45px_-20px_rgba(0,0,0,0.4)] backdrop-blur-sm"
      style={{ opacity: 0, willChange: "transform" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image */}
      <div className="relative h-[210px] sm:h-[250px] md:h-[300px] w-full overflow-hidden rounded-[1.5rem]">
        <img
          ref={imgRef}
          src={pkg.images[0]}
          alt={pkg.title}
          className="h-full w-full object-cover"
          style={{ willChange: "transform, opacity" }}
        />

      </div>

      {/* Content */}
      <div className="pt-5 px-1 pb-1">
        <h3
          ref={titleRef}
          className="font-serif text-lg sm:text-xl md:text-2xl text-[#D4AF37] leading-snug mb-2"
        >
          {pkg.title}
        </h3>

        <p
          ref={descRef}
          className="text-white/70 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-2"
        >
          {pkg.description}
        </p>

        <div ref={tagsRef} className="flex flex-wrap gap-2 mb-5">
          {pkg.tags.map((tag) => (
            <span
              key={tag.label}
              onMouseEnter={(e) => handleTagEnter(e.currentTarget)}
              onMouseLeave={(e) => handleTagLeave(e.currentTarget)}
              className="inline-block rounded-full px-3 py-1 text-[10px] sm:text-xs font-medium tracking-wide uppercase cursor-default"
              style={
                tag.accent
                  ? { backgroundColor: tag.accent, color: "#fff" }
                  : {
                      border: "1px solid rgba(255,255,255,0.3)",
                      color: "rgba(255,255,255,0.85)",
                    }
              }
            >
              {tag.label}
            </span>
          ))}
        </div>

        <button
          ref={btnRef}
          onMouseEnter={handleBtnEnter}
          onMouseLeave={handleBtnLeave}
          onMouseMove={handleBtnMove}
          className="w-full rounded-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-colors"
          style={
            isOutline
              ? {
                  backgroundColor: "transparent",
                  border: `1.5px solid ${pkg.button.color}`,
                  color: pkg.button.color,
                }
              : {
                  backgroundColor: pkg.button.color,
                  color: "#20361f",
                }
          }
        >
          Book Now
        </button>
      </div>
    </div>
  );
}

export default function LandPackages() {
  const headingRef = useRef(null);
  const eyebrowRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [eyebrowRef.current, headingRef.current],
        { opacity: 0, y: -28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.12,
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
      className="w-full bg-[#315537] py-16 sm:py-20 md:py-10 px-4 sm:px-6 md:px-10 lg:px-16"
    >
      <p
        ref={eyebrowRef}
        className="text-[#D4AF37] text-center tracking-[0.35em] text-xs sm:text-sm font-medium uppercase mb-3"
        style={{ opacity: 0 }}
      >
        Offerings
      </p>
      <h2
        ref={headingRef}
        className="text-white font-serif text-center mb-12 md:mb-16"
        style={{ fontSize: "clamp(1.9rem, 4.2vw, 3rem)", opacity: 0 }}
      >
        Land Packages
      </h2>

      <div className="mx-auto grid max-w-4xl grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 lg:gap-14 place-items-center">
        {packages.map((pkg, i) => (
          <PackageCard key={pkg.id} pkg={pkg} index={i} />
        ))}
      </div>
    </section>
  );
}