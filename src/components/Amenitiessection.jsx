import React, { useEffect, useRef } from "react";

import leafCard from "../assets/images/LeafCard.png";
import rightCard from "../assets/images/LeafCard2.png";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ================================================================
   ICONS
================================================================ */

const icons = {
  water: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="amenity-icon"
    >
      <path d="M12 2.5c3.2 4.2 6.5 8.3 6.5 12.2a6.5 6.5 0 1 1-13 0c0-3.9 3.3-8 6.5-12.2Z" />
    </svg>
  ),

  electricity: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="amenity-icon"
    >
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  ),

  gated: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="amenity-icon"
    >
      <path d="M3 11.5 12 6l9 5.5" />
      <rect x="4.5" y="11.5" width="15" height="7.5" rx="1" />
      <path d="M9 19v-4h6v4" />
    </svg>
  ),

  plantation: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="amenity-icon"
    >
      <path d="M12 3c3.5 1 6 3.8 6 7.2 0 3-2.3 5.3-6 5.3s-6-2.3-6-5.3C6 6.8 8.5 4 12 3Z" />
      <path d="M12 15.5V21" />
    </svg>
  ),

  security: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="amenity-icon"
    >
      <path d="M12 2.5 4.5 5.5v5.8c0 5 3.2 8.6 7.5 10.2 4.3-1.6 7.5-5.2 7.5-10.2V5.5L12 2.5Z" />
    </svg>
  ),

  title: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="amenity-icon"
    >
      <path d="M7 3h7l4 4v14H7Z" />
      <path d="M14 3v4h4" />
      <path d="M9.5 12.5h5M9.5 15.5h5" />
    </svg>
  ),

  garden: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="amenity-icon"
    >
      <circle cx="12" cy="7" r="2.3" />
      <circle cx="7" cy="12" r="2.3" />
      <circle cx="17" cy="12" r="2.3" />
      <circle cx="12" cy="12" r="2.3" />
      <path d="M12 16v5" />
    </svg>
  ),

  road: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="amenity-icon amenity-icon-road"
    >
      <path d="M9 3 6 21M15 3l3 18" />
      <path d="M12 3v3M12 10v3M12 17v3" />
    </svg>
  ),
};


/* ================================================================
   AMENITIES DATA
================================================================ */

const amenities = [
  { icon: icons.water, label: "Water Facility" },
  { icon: icons.electricity, label: "Electricity" },
  { icon: icons.gated, label: "Gated Community" },
  { icon: icons.plantation, label: "Plantation" },
  { icon: icons.security, label: "24x7 Security" },
  { icon: icons.title, label: "Clear Title" },
  { icon: icons.garden, label: "Common Garden" },
  { icon: icons.road, label: "Tar Road" },
];


/* ================================================================
   LEAF CARD
================================================================ */

function LeafCard({
  icon,
  label,
  shape,
}) {
  const cardRef = useRef(null);
  const imageRef = useRef(null);
  const contentRef = useRef(null);
  const glowRef = useRef(null);
  const iconRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    const image = imageRef.current;
    const content = contentRef.current;
    const glow = glowRef.current;
    const iconElement = iconRef.current;

    if (
      !card ||
      !image ||
      !content ||
      !glow ||
      !iconElement
    ) {
      return;
    }

    const desktop = window.matchMedia(
      "(min-width: 768px)"
    );

    const handleMouseMove = (event) => {
      if (!desktop.matches) return;

      const rect = card.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateY =
        ((x - centerX) / centerX) * 5;

      const rotateX =
        ((centerY - y) / centerY) * 5;

      const moveX =
        (x - centerX) * 0.025;

      const moveY =
        (y - centerY) * 0.025;

      gsap.to(card, {
        rotateX,
        rotateY,
        y: -7,
        scale: 1.025,
        duration: 0.35,
        ease: "power2.out",
        overwrite: true,
      });

      gsap.to(image, {
        x: moveX,
        y: moveY,
        scale: 1.055,
        duration: 0.45,
        ease: "power2.out",
        overwrite: true,
      });

      gsap.to(content, {
        x: moveX * 0.4,
        y: moveY * 0.4,
        duration: 0.4,
        ease: "power2.out",
        overwrite: true,
      });

      gsap.to(glow, {
        x: x - centerX,
        y: y - centerY,
        opacity: 0.8,
        duration: 0.3,
        ease: "power2.out",
        overwrite: true,
      });
    };


    const handleMouseEnter = () => {
      if (!desktop.matches) return;

      gsap.to(iconElement, {
        scale: 1.15,
        y: -4,
        rotate: -3,
        duration: 0.45,
        ease: "back.out(2)",
        overwrite: true,
      });

      gsap.to(glow, {
        opacity: 0.8,
        duration: 0.3,
      });
    };


    const handleMouseLeave = () => {
      if (!desktop.matches) return;

      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        y: 0,
        scale: 1,
        duration: 0.65,
        ease: "elastic.out(1, 0.45)",
        overwrite: true,
      });

      gsap.to(image, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power3.out",
        overwrite: true,
      });

      gsap.to(content, {
        x: 0,
        y: 0,
        duration: 0.55,
        ease: "power3.out",
        overwrite: true,
      });

      gsap.to(iconElement, {
        scale: 1,
        y: 0,
        rotate: 0,
        duration: 0.5,
        ease: "back.out(2)",
        overwrite: true,
      });

      gsap.to(glow, {
        opacity: 0,
        duration: 0.4,
      });
    };


    card.addEventListener(
      "mousemove",
      handleMouseMove
    );

    card.addEventListener(
      "mouseenter",
      handleMouseEnter
    );

    card.addEventListener(
      "mouseleave",
      handleMouseLeave
    );


    return () => {
      card.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      card.removeEventListener(
        "mouseenter",
        handleMouseEnter
      );

      card.removeEventListener(
        "mouseleave",
        handleMouseLeave
      );

      gsap.killTweensOf([
        card,
        image,
        content,
        glow,
        iconElement,
      ]);
    };
  }, []);


  return (
    <div
      ref={cardRef}
      className="amenity-card"
    >

      {/* Leaf image */}

      <img
        ref={imageRef}
        src={shape}
        alt=""
        className="amenity-shape"
        draggable={false}
      />


      {/* Cursor glow */}

      <div
        ref={glowRef}
        className="amenity-glow"
        aria-hidden="true"
      />


      {/* Content */}

      <div
        ref={contentRef}
        className="amenity-content"
      >

        <div
          ref={iconRef}
          className="amenity-icon-wrap"
        >
          {icon}
        </div>

        <span className="amenity-label">
          {label}
        </span>

      </div>

    </div>
  );
}


/* ================================================================
   MAIN COMPONENT
================================================================ */

export default function AmenitiesSection() {

  const sectionRef = useRef(null);
  const eyebrowRef = useRef(null);
  const headingRef = useRef(null);
  const waveRef = useRef(null);


  useEffect(() => {

    const section = sectionRef.current;

    if (!section) return;


    const ctx = gsap.context(() => {

      /*
       * IMPORTANT:
       * We select elements AFTER React has rendered them.
       * This prevents null refs.
       */

      const cards =
        gsap.utils.toArray(
          ".amenity-card"
        );

      const eyebrow =
        eyebrowRef.current;

      const heading =
        headingRef.current;

      const wave =
        waveRef.current;


      /* Safety check */

      if (!eyebrow || !heading) {
        return;
      }


      /* ==========================================================
         INITIAL STATES
      ========================================================== */

      gsap.set(eyebrow, {
        opacity: 0,
        y: 20,
      });

      gsap.set(heading, {
        opacity: 0,
        y: 35,
      });


      if (cards.length) {
        gsap.set(cards, {
          opacity: 0,
          y: 55,
          scale: 0.92,
        });
      }


      /* ==========================================================
         MAIN SCROLL ANIMATION
      ========================================================== */

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,

          start: "top 78%",

          toggleActions:
            "play none none reverse",

          invalidateOnRefresh: true,
        },
      });


      timeline
        .to(eyebrow, {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: "power3.out",
        })

        .to(
          heading,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.25"
        );


      if (cards.length) {
        timeline.to(
          cards,
          {
            opacity: 1,
            y: 0,
            scale: 1,

            duration: 0.8,

            stagger: {
              each: 0.1,
              from: "center",
            },

            ease: "power3.out",
          },
          "-=0.3"
        );
      }


      /* ==========================================================
         WAVE PARALLAX
      ========================================================== */

      if (wave) {
        gsap.to(wave, {
          y: -10,

          ease: "none",

          scrollTrigger: {
            trigger: section,

            start: "top bottom",

            end: "bottom top",

            scrub: 1.2,
          },
        });
      }


      /* ==========================================================
         REFRESH SCROLLTRIGGER
      ========================================================== */

      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });

    }, section);


    return () => {
      ctx.revert();
    };

  }, []);


  return (
    <section
      ref={sectionRef}
      className="amenities-section"
    >

      <style>{`

        /* =========================================================
           SECTION
        ========================================================= */

        .amenities-section {
          position: relative;

          width: 100%;

          background: #254229;

          overflow: hidden;

          isolation: isolate;

          padding-bottom: 7rem;

          perspective: 1200px;
        }


        /* =========================================================
           CONTAINER
        ========================================================= */

        .amenities-container {
          position: relative;

          z-index: 2;

          width: 100%;

          max-width: 1280px;

          margin: 0 auto;

          display: flex;

          flex-direction: column;

          align-items: center;

          padding:
            2.5rem
            1.5rem
            5rem;
        }


        /* =========================================================
           EYEBROW
        ========================================================= */

        .amenities-eyebrow {
          color: #C99A45;

          font-size: 0.875rem;

          font-weight: 500;

          letter-spacing: 0.35em;

          margin: 0 0 0.75rem;

          text-align: center;
        }


        /* =========================================================
           HEADING
        ========================================================= */

        .amenities-heading {
          color: white;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-weight: 400;

          font-size:
            clamp(2.25rem, 5vw, 3.75rem);

          line-height: 1.05;

          margin: 0 0 3.5rem;

          text-align: center;

          letter-spacing: -0.02em;
        }


        /* =========================================================
           GRID
        ========================================================= */

        .amenities-grid {
          width: 100%;

          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap:
            2rem 1.5rem;
        }


        /* =========================================================
           CARD
        ========================================================= */

        .amenity-card {
          position: relative;

          width: 100%;

          height: 130px;

          display: flex;

          align-items: center;

          justify-content: center;

          transform-style: preserve-3d;

          cursor: pointer;

          will-change:
            transform,
            opacity;

          transition:
            filter 0.35s ease;
        }


        .amenity-card:hover {
          filter:
            drop-shadow(
              0 18px 28px
              rgba(0, 0, 0, 0.18)
            );
        }


        /* =========================================================
           LEAF SHAPE
        ========================================================= */

        .amenity-shape {
          position: absolute;

          inset: 0;

          width: 100%;

          height: 100%;

          object-fit: contain;

          user-select: none;

          pointer-events: none;

          will-change: transform;

          transform-origin: center;
        }


        /* =========================================================
           GLOW
        ========================================================= */

        .amenity-glow {
          position: absolute;

          left: 50%;
          top: 50%;

          width: 140px;
          height: 140px;

          transform:
            translate(-50%, -50%);

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(255,255,255,0.16) 0%,
              rgba(255,255,255,0.06) 30%,
              rgba(255,255,255,0) 70%
            );

          opacity: 0;

          z-index: 2;

          pointer-events: none;

          mix-blend-mode: screen;

          will-change:
            transform,
            opacity;
        }


        /* =========================================================
           CONTENT
        ========================================================= */

        .amenity-content {
          position: relative;

          z-index: 3;

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: center;

          gap: 0.6rem;

          padding: 0 1.5rem;

          text-align: center;

          will-change: transform;
        }


        /* =========================================================
           ICON
        ========================================================= */

        .amenity-icon-wrap {
          color: #BFD3B7;

          display: flex;

          align-items: center;

          justify-content: center;

          transform-origin: center;

          will-change: transform;
        }


        .amenity-icon {
          width: 32px;

          height: 32px;

          display: block;
        }


        .amenity-icon-road {
          width: 28px;

          height: 28px;
        }


        /* =========================================================
           LABEL
        ========================================================= */

        .amenity-label {
          color: #C7D6C0;

          font-size: 13px;

          font-weight: 500;

          letter-spacing: 0.03em;

          line-height: 1.25;

          text-align: center;
        }


        /* =========================================================
           TABLET
        ========================================================= */

        @media (max-width: 1023px) {

          .amenities-container {
            padding:
              2.5rem
              1.25rem
              4.5rem;
          }

          .amenities-heading {
            margin-bottom: 3rem;
          }

          .amenities-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));

            gap:
              1.5rem 1rem;
          }

          .amenity-card {
            height: 125px;
          }
        }


        /* =========================================================
           MOBILE
        ========================================================= */

        @media (max-width: 767px) {

          .amenities-section {
            padding-bottom: 5rem;

            perspective: none;
          }


          .amenities-container {
            padding:
              2.25rem
              0.85rem
              3.25rem;
          }


          .amenities-eyebrow {
            font-size: 11px;

            letter-spacing: 0.28em;
          }


          .amenities-heading {
            font-size:
              clamp(2rem, 10vw, 3rem);

            margin-bottom: 2.25rem;
          }


          .amenities-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));

            gap:
              0.8rem 0.5rem;
          }


          .amenity-card {
            height: 115px;

            transform:
              none !important;
          }


          .amenity-shape {
            transform:
              none !important;
          }


          .amenity-glow {
            display: none;
          }


          .amenity-content {
            gap: 0.45rem;

            padding: 0 0.5rem;
          }


          .amenity-icon {
            width: 27px;

            height: 27px;
          }


          .amenity-icon-road {
            width: 24px;

            height: 24px;
          }


          .amenity-label {
            font-size: 11px;

            line-height: 1.3;
          }
        }


        /* =========================================================
           SMALL MOBILE
        ========================================================= */

        @media (max-width: 380px) {

          .amenities-container {
            padding-left: 0.65rem;

            padding-right: 0.65rem;
          }


          .amenities-grid {
            gap:
              0.65rem
              0.35rem;
          }


          .amenity-card {
            height: 105px;
          }


          .amenity-label {
            font-size: 10px;
          }
        }


        /* =========================================================
           LARGE DESKTOP
        ========================================================= */

        @media (min-width: 1440px) {

          .amenities-container {
            max-width: 1400px;
          }


          .amenities-grid {
            gap:
              2.5rem 2rem;
          }


          .amenity-card {
            height: 140px;
          }
        }


        /* =========================================================
           REDUCED MOTION
        ========================================================= */

        @media (prefers-reduced-motion: reduce) {

          .amenity-card,
          .amenity-shape,
          .amenity-content,
          .amenity-icon-wrap {
            transition: none !important;

            transform: none !important;
          }
        }

      `}</style>


      {/* ==========================================================
          CONTENT
      ========================================================== */}

      <div className="amenities-container">

        <p
          ref={eyebrowRef}
          className="amenities-eyebrow"
        >
          LIFESTYLE
        </p>


        <h2
          ref={headingRef}
          className="amenities-heading"
        >
          Amenities
        </h2>


        {/* ========================================================
            GRID
        ======================================================== */}

        <div className="amenities-grid">

          {amenities.map((item, index) => (
            <LeafCard
              key={item.label}
              icon={item.icon}
              label={item.label}
              shape={
                index % 2 === 0
                  ? leafCard
                  : rightCard
              }
            />
          ))}

        </div>

      </div>


      {/* ==========================================================
          BOTTOM WAVE
      ========================================================== */}

      <svg
        ref={waveRef}
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="amenities-wave"
        aria-hidden="true"
      >
        <path
          d="
            M0,90
            C300,60 480,38 720,40
            C960,42 1200,48 1440,90
            L1440,120
            L0,120
            Z
          "
          fill="#315537"
        />
      </svg>


      <style>{`

        .amenities-wave {
          position: absolute;

          bottom: -10px;

          left: 0;

          width: 100%;

          height:
            clamp(60px, 10vw, 100px);

          z-index: 5;

          pointer-events: none;

        
          will-change: transform;
        }

      `}</style>

    </section>
  );
}
