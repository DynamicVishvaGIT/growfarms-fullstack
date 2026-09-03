
import { useEffect, useRef } from "react";

import WhyPali1 from "../assets/images/Why_Pali_2.png";
import WhyPali2 from "../assets/images/Why_Pali_1.png";
import Animals from "../assets/images/animals.png";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import useApiData from "../hooks/useApiData";
import { getWhyChooseCards } from "../lib/api";
import { useProject } from "../context/projectContext";

gsap.registerPlugin(ScrollTrigger);

/* ---------------------------------------------------------------------
   CARD DATA
--------------------------------------------------------------------- */

const FALLBACK_CARDS = [
  {
    id: "left",
    src: Animals,
    alt: "Animals in Pali farmland",
    title: "History & Culture",
    body: "Buying farm land in Pali supports the community. It can create jobs and strengthen local heritage.",
    objPos: "center",
  },
  {
    id: "center",
    src: WhyPali2,
    alt: "Green farm life in Pali",
    title: "Green Environment",
    body: "Pali offers open spaces, cleaner air, and a nature-centric lifestyle without sacrificing convenience.",
    objPos: "center",
  },
  {
    id: "right",
    src: WhyPali1,
    alt: "Farm workers in Pali",
    title: "Helps The Local Area",
    body: "Buying farm land in Pali supports the local community. It can create jobs and help the local economy.",
    objPos: "center",
  },
];

/* ---------------------------------------------------------------------
   Why Choose Sarasview
--------------------------------------------------------------------- */

/**
 * The layout is a fixed three-slot row (left / center / right), each with its
 * own entrance direction and its own ref. So rather than rendering a variable
 * list, each slot is filled from the API when a card exists for that position
 * and falls back to the original card otherwise.
 */
function mergeCards(rows) {
  if (!rows?.length) return null;

  return FALLBACK_CARDS.map((fallback) => {
    const match = rows.find((r) => r.position === fallback.id);
    if (!match) return fallback;
    return {
      id: fallback.id,
      src: match.image_url || fallback.src,
      alt: match.alt_text || fallback.alt,
      title: match.title || fallback.title,
      body: match.body || fallback.body,
      objPos: match.object_position || fallback.objPos,
    };
  });
}

export default function Aboutsarasview() {
  const project = useProject();

  const { data: CARDS } = useApiData(
    async (signal) => {
      if (project?.whyChooseCards?.length) return mergeCards(project.whyChooseCards);
      const rows = await getWhyChooseCards(undefined, signal);
      return mergeCards(rows);
    },
    FALLBACK_CARDS,
    [project?.id],
  );

  const sectionRef = useRef(null);
  const eyebrowRef = useRef(null);
  const headlineRef = useRef(null);
  const paraRef = useRef(null);

  const cardRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  const imageRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  const glowRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* =============================================================
         INITIAL STATES
      ============================================================= */

      gsap.set(eyebrowRef.current, {
        opacity: 0,
        y: 20,
      });

      gsap.set(headlineRef.current, {
        opacity: 0,
        y: 45,
      });

      gsap.set(paraRef.current, {
        opacity: 0,
        y: 25,
      });

      cardRefs.forEach((ref, index) => {
        const directions = [
          { x: -70, y: 20, rotation: -2 },
          { x: 0, y: 70, rotation: 0 },
          { x: 70, y: 20, rotation: 2 },
        ];

        gsap.set(ref.current, {
          opacity: 0,
          x: directions[index].x,
          y: directions[index].y,
          rotation: directions[index].rotation,
          scale: 0.94,
        });

        gsap.set(imageRefs[index].current, {
          scale: 1.12,
        });

        gsap.set(glowRefs[index].current, {
          opacity: 0,
        });
      });

      /* =============================================================
         MAIN SCROLL ANIMATION
      ============================================================= */

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 78%",
          toggleActions: "play none none reverse",
          invalidateOnRefresh: true,
        },

        defaults: {
          ease: "power3.out",
        },
      });

      /* Eyebrow */

      tl.to(eyebrowRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.55,
      });

      /* Heading */

      tl.to(
        headlineRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
        },
        "-=0.25"
      );

      /* Paragraph */

      tl.to(
        paraRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
        },
        "-=0.35"
      );

      /* =============================================================
         CARDS
      ============================================================= */

      cardRefs.forEach((ref, index) => {
        tl.to(
          ref.current,
          {
            opacity: 1,
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            duration: 0.9,
            ease: "power3.out",
          },
          index === 0 ? "-=0.25" : "-=0.65"
        );

        /* Image slowly settles */

        tl.to(
          imageRefs[index].current,
          {
            scale: 1,
            duration: 1.2,
            ease: "power2.out",
          },
          "<"
        );
      });

      /* =============================================================
         CARD HOVER / 3D INTERACTION
      ============================================================= */

      cardRefs.forEach((cardRef, index) => {
        const card = cardRef.current;
        const image = imageRefs[index].current;
        const glow = glowRefs[index].current;

        if (!card) return;

        const handleMove = (event) => {
          /*
             Don't run expensive 3D mouse calculations on
             touch/mobile devices.
          */

          if (window.innerWidth <= 767) return;

          const rect = card.getBoundingClientRect();

          const x =
            event.clientX -
            rect.left -
            rect.width / 2;

          const y =
            event.clientY -
            rect.top -
            rect.height / 2;

          const rotateY = (x / (rect.width / 2)) * 5;
          const rotateX = -(y / (rect.height / 2)) * 5;

          /* Card tilt */

          gsap.to(card, {
            rotateX,
            rotateY,
            y: -8,
            scale: 1.015,
            duration: 0.35,
            ease: "power2.out",
            overwrite: "auto",
          });

          /* Image movement */

          gsap.to(image, {
            x: x * 0.025,
            y: y * 0.025,
            scale: 1.07,
            duration: 0.45,
            ease: "power2.out",
            overwrite: "auto",
          });

          /* Spotlight position */

          gsap.to(glow, {
            x: x * 0.35,
            y: y * 0.35,
            opacity: 1,
            duration: 0.25,
            ease: "power2.out",
            overwrite: "auto",
          });
        };

        const handleEnter = () => {
          if (window.innerWidth <= 767) return;

          gsap.to(card, {
            boxShadow:
              "0 25px 60px rgba(0,0,0,0.28)",
            duration: 0.35,
            ease: "power2.out",
          });

          gsap.to(glow, {
            opacity: 1,
            duration: 0.35,
          });
        };

        const handleLeave = () => {
          gsap.to(card, {
            rotateX: 0,
            rotateY: 0,
            y: 0,
            scale: 1,
            boxShadow: "0 0 0 rgba(0,0,0,0)",
            duration: 0.65,
            ease: "elastic.out(1, 0.5)",
            overwrite: "auto",
          });

          gsap.to(image, {
            x: 0,
            y: 0,
            scale: 1.04,
            duration: 0.6,
            ease: "power3.out",
            overwrite: "auto",
          });

          gsap.to(glow, {
            opacity: 0,
            duration: 0.45,
            ease: "power2.out",
          });
        };

        card.addEventListener(
          "mousemove",
          handleMove
        );

        card.addEventListener(
          "mouseenter",
          handleEnter
        );

        card.addEventListener(
          "mouseleave",
          handleLeave
        );

        /* Cleanup */

        card._cleanup = () => {
          card.removeEventListener(
            "mousemove",
            handleMove
          );

          card.removeEventListener(
            "mouseenter",
            handleEnter
          );

          card.removeEventListener(
            "mouseleave",
            handleLeave
          );
        };
      });

      /* =============================================================
         REFRESH SCROLLTRIGGER AFTER LAYOUT
      ============================================================= */

      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    }, sectionRef);

    return () => {
      cardRefs.forEach((ref) => {
        if (ref.current?._cleanup) {
          ref.current._cleanup();
        }
      });

      ctx.revert();
    };
  }, []);

  return (
    <>
      <style>{`

        /* =========================================================
           SECTION
        ========================================================= */

        .wc-section {
          background: #315537;
          width: 100%;
          overflow: hidden;
          position: relative;
          perspective: 1200px;
        }


        /* =========================================================
           HEADER
        ========================================================= */

        .wc-header {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          text-align: center;

          padding:
            clamp(2.5rem, 6vw, 5rem)
            1.25rem
            clamp(1.5rem, 3vw, 2.5rem);
        }


        .wc-eyebrow {
          color: #D4AF37;

          font-size:
            clamp(11px, 1.1vw, 14px);

          font-weight: 600;

          letter-spacing: 0.2em;

          margin-bottom: 0.5rem;

          opacity: 0;
        }


        .wc-headline {
          color: #fff;

          font-weight: 700;

          font-size:
            clamp(22px, 4vw, 50px);

          letter-spacing: -0.01em;

          line-height: 1.15;

          margin-bottom: 1rem;

          opacity: 0;
        }


        .wc-para {
          color: rgba(255,255,255,0.75);

          font-size:
            clamp(13px, 1.15vw, 15px);

          line-height: 1.85;

          max-width: 990px;

          margin: 0 auto;

          opacity: 0;
        }


        /* =========================================================
           CARDS
        ========================================================= */

        .wc-cards {
          display: flex;

          width: 100%;

          align-items: flex-end;

          gap: 0;

          perspective: 1200px;
        }


        .wc-card {
          position: relative;

          overflow: hidden;

          flex: 1 1 0;

          transform-style: preserve-3d;

          cursor: pointer;

          isolation: isolate;

          will-change:
            transform,
            opacity;

          background: #315537;
        }


        /* =========================================================
           IMAGE
        ========================================================= */

        .wc-card-img {
          position: absolute;

          width: 108%;
          height: 108%;

          object-fit: cover;

          transition:
            filter 0.5s ease;

          will-change:
            transform;

          pointer-events: none;
        }


        .wc-card:hover .wc-card-img {
          filter: saturate(1.08) contrast(1.03);
        }


        /* =========================================================
           GRADIENT
        ========================================================= */

        .wc-card-overlay {
          position: absolute;

          inset: 0;

          z-index: 1;

          background:
            linear-gradient(
              180deg,
              rgba(49, 85, 55, 0.85) 0%,
              rgba(49, 85, 55, 0.4) 35%,
              rgba(49, 85, 55, 0) 70%
            );

          pointer-events: none;
        }


        /* =========================================================
           CURSOR SPOTLIGHT
        ========================================================= */

        .wc-card-glow {
          position: absolute;

          width: 180px;
          height: 180px;

          left: 50%;
          top: 50%;

          transform:
            translate(-50%, -50%);

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(255,255,255,0.16) 0%,
              rgba(255,255,255,0.07) 25%,
              rgba(255,255,255,0) 70%
            );

          filter: blur(2px);

          z-index: 2;

          opacity: 0;

          pointer-events: none;

          mix-blend-mode: screen;
        }


        /* =========================================================
           TEXT
        ========================================================= */

        .wc-card-text {
          position: absolute;

          top: 0;
          left: 0;
          right: 0;

          z-index: 3;

          padding:
            clamp(16px, 2.5vw, 32px);

          max-width: 85%;

          transform:
            translateZ(35px);

          pointer-events: none;
        }


        .wc-card-title {
          font-weight: 700;

          color: #fff;

          margin-bottom: 0.4rem;

          font-size:
            clamp(15px, 1.5vw, 20px);

          line-height: 1.25;
        }


        .wc-card-body {
          color:
            rgba(255,255,255,0.85);

          font-size:
            clamp(11px, 1vw, 13px);

          line-height: 1.6;
        }


        /* =========================================================
           DESKTOP
        ========================================================= */

        @media (min-width: 1024px) {

          .wc-card:nth-child(1) {
            height:
              clamp(240px, 24vw, 320px);
          }

          .wc-card:nth-child(2) {
            height:
              clamp(280px, 30vw, 380px);
          }

          .wc-card:nth-child(3) {
            height:
              clamp(340px, 38vw, 480px);
          }

        }


        /* =========================================================
           TABLET
        ========================================================= */

        @media (min-width: 768px)
          and (max-width: 1023px) {

          .wc-cards {
            align-items: stretch;
          }

          .wc-card {
            height:
              clamp(220px, 28vw, 300px);
          }

          .wc-card-title {
            font-size: 15px;
          }

          .wc-card-body {
            font-size: 11.5px;
          }

          .wc-card-text {
            padding: 16px;
            max-width: 100%;
          }

        }


        /* =========================================================
           MOBILE
        ========================================================= */

        @media (max-width: 767px) {

          .wc-section {
            padding-bottom: 2.5rem;
            perspective: none;
          }

          .wc-cards {
            flex-direction: column;

            align-items: stretch;

            gap: 0.75rem;

            padding: 0 1rem;

            perspective: none;
          }

          .wc-card {
            width: 100%;

            flex: none;

            aspect-ratio: 16 / 9;

            height: auto;

            border-radius: 12px;

            transform:
              none !important;

            box-shadow: none !important;
          }

          .wc-card-img {
            inset: -2%;

            width: 104%;
            height: 104%;

            transform:
              scale(1.04) !important;
          }

          .wc-card-glow {
            display: none;
          }

          .wc-card-title {
            font-size: 15px;
          }

          .wc-card-body {
            font-size: 12.5px;
          }

          .wc-card-text {
            padding: 14px 16px;

            max-width: 100%;

            transform: none;
          }

        }


        /* =========================================================
           SMALL MOBILE
        ========================================================= */

        @media (max-width: 424px) {

          .wc-cards {
            gap: 0.6rem;

            padding: 0 0.75rem;
          }

          .wc-card {
            border-radius: 10px;
          }

          .wc-card-title {
            font-size: 14px;
          }

          .wc-card-body {
            font-size: 12px;
          }

        }


        /* =========================================================
           LARGE DESKTOP
        ========================================================= */

        @media (min-width: 1440px) {

          .wc-card:nth-child(1) {
            height: 330px;
          }

          .wc-card:nth-child(2) {
            height: 400px;
          }

          .wc-card:nth-child(3) {
            height: 500px;
          }

        }


        @media (min-width: 1920px) {

          .wc-card:nth-child(1) {
            height: 370px;
          }

          .wc-card:nth-child(2) {
            height: 450px;
          }

          .wc-card:nth-child(3) {
            height: 560px;
          }

        }


        /* =========================================================
           REDUCED MOTION
        ========================================================= */

        @media (prefers-reduced-motion: reduce) {

          .wc-card,
          .wc-card-img,
          .wc-eyebrow,
          .wc-headline,
          .wc-para {
            transition: none !important;
            animation: none !important;
          }

        }

      `}</style>


      <section
        ref={sectionRef}
        className="wc-section"
      >

        {/* =======================================================
            HEADER
        ======================================================= */}

        <div className="wc-header">

          <p
            ref={eyebrowRef}
            className="wc-eyebrow"
          >
            The Advantage
          </p>


          <h2
            ref={headlineRef}
            className="wc-headline"
          >
            Why Choose Sarasview?
          </h2>


          <p
            ref={paraRef}
            className="wc-para sub_font"
          >
            Pali is becoming a preferred destination for families,
            investors, and weekend home buyers because it offers a
            peaceful environment while staying well-connected to
            major cities. Unlike crowded urban areas, Pali provides
            open spaces, cleaner air, and a nature-centric lifestyle
            without sacrificing convenience.
          </p>

        </div>


        {/* =======================================================
            CARDS
        ======================================================= */}

        <div className="wc-cards">

          {CARDS.map(
            (
              {
                id,
                src,
                alt,
                title,
                body,
                objPos,
              },
              i
            ) => (

              <div
                key={id}
                ref={cardRefs[i]}
                className="wc-card"
                style={{
                  opacity: 0,
                }}
              >

                {/* Image */}

                <img
                  ref={imageRefs[i]}
                  src={src}
                  alt={alt}
                  className="wc-card-img"
                  style={{
                    objectPosition: objPos,
                  }}
                />


                {/* Gradient */}

                <div
                  className="wc-card-overlay"
                  aria-hidden="true"
                />


                {/* Interactive spotlight */}

                <div
                  ref={glowRefs[i]}
                  className="wc-card-glow"
                  aria-hidden="true"
                />


                {/* Text */}

                <div className="wc-card-text">

                  <p className="wc-card-title">
                    {title}
                  </p>

                  <p className="wc-card-body sub_font">
                    {body}
                  </p>

                </div>

              </div>

            )
          )}

        </div>

      </section>
    </>
  );
}

