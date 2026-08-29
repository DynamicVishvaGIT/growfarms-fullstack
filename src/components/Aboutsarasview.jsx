import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import blobShape from "../assets/images/sp_2_notext.png";
import farmPhoto from "../assets/images/sp_1.png";

gsap.registerPlugin(ScrollTrigger);

const AboutSarasview = () => {
  const sectionRef = useRef(null);
  const photoRef   = useRef(null);
  const blobRef    = useRef(null);
  const headingRef = useRef(null);
  const bodyRef    = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(photoRef.current,   { x: -80, opacity: 0, scale: 0.94 });
      gsap.set(blobRef.current,    { x:  80, opacity: 0, scale: 0.94 });
      gsap.set(headingRef.current, { y: 40,  opacity: 0, filter: "blur(6px)" });
      gsap.set(bodyRef.current,    { y: 30,  opacity: 0, filter: "blur(4px)" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger     : sectionRef.current,
          start       : "top 68%",
          toggleActions: "play none none reverse",
        },
        defaults: { ease: "power3.out" },
      });

      tl.to(photoRef.current, { x: 0, opacity: 1, scale: 1, duration: 1.1 })
        .to(blobRef.current,    { x: 0, opacity: 1, scale: 1, duration: 1.1 }, "-=0.85")
        .to(headingRef.current, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.75 }, "-=0.45")
        .to(bodyRef.current,    { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.65 }, "-=0.45");
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <style>{`
        /* ── Section ─────────────────────────────── */
        .asv-section {
          background     : #315537;
          min-height     : 100vh;
          display        : flex;
          align-items    : center;
          justify-content: center;
          overflow       : hidden;
        }

        /* ── Row: desktop side-by-side ───────────── */
        .asv-inner {
          display        : flex;
          align-items    : center;
          justify-content: center;
          max-width      : 1200px;
          width          : 100%;
        }

        /* ── LEFT: photo ─────────────────────────── */
        .asv-photo-wrap {
          flex-shrink: 0;
          position   : relative;
          width      : clamp(200px, 30vw, 400px);
          left       : 8%;
          top        : 50px;
          z-index    : 2;
        }

        .asv-photo {
          width     : 100%;
          height    : auto;
          display   : block;
          object-fit: contain;
          transition: transform 0.6s cubic-bezier(0.34,1.56,0.64,1);
        }
        .asv-photo:hover { transform: translateY(-8px) scale(1.02); }

        /* ── RIGHT: blob + text ───────────────────── */
        .asv-blob-wrap {
          position   : relative;
          flex-shrink: 0;
          width      : clamp(280px, 48vw, 620px);
          z-index    : 1;
        }

        .asv-blob-img {
          width  : 100%;
          height : auto;
          display: block;
        }

        /* Text pinned inside blob's visible body */
        .asv-blob-text {
          position       : absolute;
          top            : 5%;
          left           : 16%;
          right          : 10%;
          bottom         : 14%;
          display        : flex;
          flex-direction : column;
          justify-content: center;
        }

        .asv-heading {
          font-size     : clamp(1.5rem, 3vw, 2.75rem);
          font-weight   : 400;
          line-height   : 1.1;
          letter-spacing: -0.01em;
          color         : #D4AF37;
          margin        : 0 0 0.9rem;
        }

        .asv-body {
          font-size  : clamp(0.85rem, 0.95vw, 0.88rem);
          font-weight: 300;
          line-height: 1.78;
          color      : rgba(230, 238, 220, 0.78);
          max-width  : 46ch;
        }

        /* ── Tablet (601px – 900px) ───────────────── */
        @media (max-width: 900px) {
          .asv-photo-wrap {
            width: clamp(160px, 28vw, 300px);
            left : 5%;
            top  : 30px;
          }
          .asv-blob-wrap { width: clamp(260px, 58vw, 520px); }
          .asv-blob-text { top: 8%; left: 14%; right: 8%; bottom: 10%; }
        }

        /* ── Mobile (≤ 600px) — completely new layout ── */
        @media (max-width: 600px) {
          .asv-section {
            /* Less vertical padding on mobile */
            padding   : 3rem 1.25rem 1.5rem;
            min-height: auto;
          }

          /*
            Stack vertically: photo on top, text block below.
            No more overlap trick — that's what caused the heading
            to be covered by the image.
          */
          .asv-inner {
            flex-direction: column;
            align-items   : center;
            gap           : 2rem;
          }

          /* Photo: centered, reasonable size, NO offset, NO negative margin */
          .asv-photo-wrap {
            width        : clamp(200px, 72vw, 300px);
            left         : 0;
            top          : 0;
            position     : relative;   /* remove the absolute-style offsets */
            margin-bottom: 0;
            z-index      : 2;
          }

          /*
            Hide the blob image on mobile — it's a decorative shape that
            only works well when text is absolutely positioned inside it.
            On mobile we use normal flow text instead.
          */
          .asv-blob-wrap {
            width   : 100%;
            position: relative;
            z-index : 1;
          }

          .asv-blob-img {
            display: none;   /* hide the blob shape on mobile */
          }

          /*
            Text is now in normal flow (not absolutely positioned),
            so it stacks cleanly below the photo.
          */
          .asv-blob-text {
            position: relative;
            top     : auto;
            left    : auto;
            right   : auto;
            bottom  : auto;
            padding : 0 0.25rem;
            gap     : 0.75rem;
            display : flex;
            flex-direction: column;
          }

          .asv-heading {
            font-size     : clamp(1.6rem, 7vw, 2.2rem);
            margin-bottom : 0.75rem;
            line-height   : 1.15;
          }

          .asv-body {
            font-size : clamp(0.85rem, 3.8vw, 1rem);
            line-height: 1.75;
            max-width  : 100%;
          }
        }
      `}</style>

      <section ref={sectionRef} className="asv-section">
        <div className="asv-inner">

          {/* LEFT / TOP — farm photo */}
          <div ref={photoRef} className="asv-photo-wrap">
            <img
              src={farmPhoto}
              alt="Sarasview farmland — rolling green hills near Pali, Maharashtra"
              className="asv-photo"
            />
          </div>

          {/* RIGHT / BOTTOM — blob + text */}
          <div ref={blobRef} className="asv-blob-wrap">
            {/* Decorative blob — hidden on mobile via CSS */}
            <img
              src={blobShape}
              alt=""
              aria-hidden="true"
              className="asv-blob-img"
            />

            <div className="asv-blob-text">
              <h2 ref={headingRef} className="asv-heading">
                About<br />
                Sarasview<br />
                Project
              </h2>
              <p ref={bodyRef} className="asv-body">
                Sarasview by Grow Farms is a sprawling 140-acre residential
                farmland development located in the peaceful surroundings of
                Aptavane Village, just 2 km away from the historic Pali city
                in Maharashtra. This project provides an ideal opportunity for
                nature lovers and investors alike to own a piece of pristine
                land. It offers scenic river-touch plots, making it a perfect
                retreat for those who seek tranquility, yet desire modern
                conveniences close by.
              </p>
            </div>
          </div>

        </div>
      </section>
    </>
  );
};

export default AboutSarasview;