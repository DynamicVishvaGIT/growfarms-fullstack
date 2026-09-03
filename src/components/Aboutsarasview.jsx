import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import aboutPhoto1 from "../assets/images/About_Img_1.png";
import aboutPhoto2 from "../assets/images/About_Img_2.png";
import aboutPhoto3 from "../assets/images/About_Img_3.png";
import aboutPhoto4 from "../assets/images/Land_Pakages_1.jpg";

import { useProject } from "../context/projectContext";
import { withLineBreaks } from "../lib/richText";

gsap.registerPlugin(ScrollTrigger);

/** The designed copy, kept as the fallback for anything left blank in the CMS. */
const FALLBACK_BODY =
  "Sarasview by Grow Farms is a sprawling 140-acre residential farmland " +
  "development located in the peaceful surroundings of Aptavane Village, just " +
  "2 km away from the historic Pali city in Maharashtra. This project provides " +
  "an ideal opportunity for nature lovers and investors alike to own a piece of " +
  "pristine land. It offers scenic river-touch plots, making it a perfect " +
  "retreat for those who seek tranquility, yet desire modern conveniences close by.";

/** The design's own photographs, used when a project has uploaded none. */
const FALLBACK_PHOTOS = [aboutPhoto1, aboutPhoto2, aboutPhoto3, aboutPhoto4];

/**
 * How the row of photographs is scattered: the two middle cards lean away from
 * each other and sit a touch higher, the outer two stay nearly upright and drop
 * down, which is what gives the row its hand-laid look. `depth` is how far a
 * card drifts as the section scrolls past, so the row separates slightly
 * instead of moving as one flat block.
 */
const CARD_LAYOUT = [
  { rot: -1.5, lift: 16, depth: 18, z: 1 },
  { rot: -5,   lift: 0,  depth: 40, z: 3 },
  { rot: 4.5,  lift: 4,  depth: 32, z: 2 },
  { rot: -2,   lift: 14, depth: 14, z: 1 },
];

/**
 * Split a stored About heading into the small label and the heading proper.
 *
 * The label used to live in the same field as the heading, stored as one
 * multi-line value ("About\nSarasview\nProject"). It is its own column now, so
 * a heading still carrying the old first line is split back apart here rather
 * than printing "About" twice above the section.
 */
function splitHeading(storedTitle, storedEyebrow, projectName) {
  const raw = String(storedTitle ?? "").trim();
  const lines = raw ? raw.split(/\r\n|\r|\n/).map((l) => l.trim()).filter(Boolean) : [];
  const hasLegacyLabel = lines.length > 1 && /^about$/i.test(lines[0]);

  const eyebrow =
    String(storedEyebrow ?? "").trim() || (hasLegacyLabel ? lines[0] : "About");
  const heading =
    (hasLegacyLabel ? lines.slice(1).join(" ") : raw) || `${projectName} Project`;

  return { eyebrow, heading };
}

const AboutSarasview = () => {
  const sectionRef = useRef(null);
  const eyebrowRef = useRef(null);
  const headingRef = useRef(null);
  const bodyRef    = useRef(null);
  const rowRef     = useRef(null);

  const project = useProject();

  // Each project writes its own About block; anything left blank falls back to
  // the designed copy, so an unedited project renders exactly as it does today.
  const projectName = project?.title || "Sarasview";
  const { eyebrow, heading } = splitHeading(
    project?.about_title,
    project?.about_eyebrow,
    projectName,
  );
  const body = project?.about_body || FALLBACK_BODY;

  // Each card falls back on its own, so the row always keeps the designed shape
  // of four: a project that has uploaded two photographs shows those two in
  // their slots and the design's own in the other two, and a project that has
  // uploaded none renders exactly what the design ships with.
  const photos = useMemo(
    () =>
      [
        project?.about_image_url,
        project?.about_image_2_url,
        project?.about_image_3_url,
        project?.about_image_4_url,
      ].map((url, i) => url || FALLBACK_PHOTOS[i]),
    [project],
  );

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mm = gsap.matchMedia();

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".asv-card");

      if (reduced) {
        // Everything is authored hidden, so a reader who has asked for less
        // motion still gets the finished section rather than a blank one.
        gsap.set([eyebrowRef.current, headingRef.current, bodyRef.current], {
          opacity: 1,
          y: 0,
          filter: "none",
        });
        cards.forEach((card, i) =>
          gsap.set(card, { opacity: 1, y: 0, scale: 1, rotate: CARD_LAYOUT[i % 4].rot }),
        );
        return;
      }

      gsap.set(eyebrowRef.current, { y: 18, opacity: 0 });
      gsap.set(headingRef.current, { y: 40, opacity: 0, filter: "blur(6px)" });
      gsap.set(bodyRef.current,    { y: 30, opacity: 0, filter: "blur(4px)" });
      gsap.set(cards, { y: 90, opacity: 0, scale: 0.88, rotate: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger      : sectionRef.current,
          start        : "top 72%",
          toggleActions: "play none none reverse",
        },
        defaults: { ease: "power3.out" },
      });

      tl.to(eyebrowRef.current, { y: 0, opacity: 1, duration: 0.55 })
        .to(headingRef.current, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.8 }, "-=0.3")
        .to(bodyRef.current,    { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.7 }, "-=0.5");

      // The cards deal themselves onto the page: each rises, settles to its
      // resting tilt and overshoots a hair, one after the next.
      cards.forEach((card, i) => {
        tl.to(
          card,
          {
            y       : 0,
            opacity : 1,
            scale   : 1,
            rotate  : CARD_LAYOUT[i % 4].rot,
            duration: 0.9,
            ease    : "back.out(1.4)",
          },
          i === 0 ? "-=0.35" : "-=0.72",
        );
      });

      // A gentle parallax once they have landed — only on wide screens, where
      // the row has room to separate. On the two-by-two grid a phone gets, the
      // same drift would just make the two rows jitter past each other.
      mm.add("(min-width: 901px)", () => {
        cards.forEach((card, i) => {
          gsap.to(card, {
            yPercent: -CARD_LAYOUT[i % 4].depth / 4,
            ease    : "none",
            scrollTrigger: {
              trigger: rowRef.current,
              start  : "top bottom",
              end    : "bottom top",
              scrub  : 0.8,
            },
          });
        });
      });
    }, sectionRef);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, [photos]);

  return (
    <>
      <style>{`
        /* ── Section ─────────────────────────────── */
        .asv-section {
          background: #315537;
          overflow  : hidden;
          padding   : clamp(3.5rem, 8vw, 7rem) clamp(1.25rem, 5vw, 4rem)
                      clamp(3rem, 7vw, 6rem);
        }

        .asv-inner {
          max-width: 1180px;
          margin   : 0 auto;
          width    : 100%;
        }

        /* ── Heading block ───────────────────────── */
        .asv-head {
          text-align   : center;
          margin-inline: auto;
          max-width    : 60rem;
        }

        .asv-eyebrow {
          font-family   : "Montserrat", sans-serif;
          font-size     : clamp(0.72rem, 1.1vw, 0.82rem);
          font-weight   : 500;
          letter-spacing: 0.06em;
          color         : #D4AF37;
          margin        : 0 0 0.55rem;
        }

        .asv-heading {
          font-size     : clamp(1.75rem, 4.6vw, 3.1rem);
          font-weight   : 400;
          line-height   : 1.15;
          letter-spacing: -0.01em;
          color         : #FFFFFF;
          margin        : 0;
        }

        .asv-body {
          font-family: "Montserrat", sans-serif;
          font-size  : clamp(0.8rem, 1.05vw, 0.875rem);
          font-weight: 300;
          line-height: 1.95;
          color      : rgba(230, 238, 220, 0.82);
          max-width  : 46rem;
          margin     : clamp(1.1rem, 2.4vw, 1.6rem) auto 0;
        }

        /* ── Row of photographs ──────────────────── */
        .asv-row {
          display        : flex;
          align-items    : flex-start;
          justify-content: center;
          gap            : clamp(0.5rem, 1.4vw, 1.1rem);
          margin-top     : clamp(1.75rem, 4vw, 3.1rem);
        }

        .asv-card {
          flex        : 1 1 0;
          min-width   : 0;
          max-width   : 280px;
          margin-top  : var(--lift);
          z-index     : var(--z);
          position    : relative;
          will-change : transform;
        }

        /*
          The tilt lives on this outer element because GSAP animates it, so the
          inner one is free to own the hover transform — an inline transform
          from GSAP would otherwise always beat a CSS :hover rule.
        */
        .asv-card-inner {
          position     : relative;
          overflow     : hidden;
          border-radius: clamp(10px, 1.2vw, 16px);
          aspect-ratio : 5 / 6.4;
          background   : rgba(255, 255, 255, 0.06);
          box-shadow   : 0 18px 40px rgba(0, 0, 0, 0.28);
          transition   : transform 0.65s cubic-bezier(0.22, 1, 0.36, 1),
                         box-shadow 0.65s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .asv-card-img {
          width     : 100%;
          height    : 100%;
          display   : block;
          object-fit: cover;
          transition: transform 0.85s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* Hover straightens the card, lifts it clear of its neighbours and
           eases the photograph in a little. */
        .asv-card:hover { z-index: 5; }

        .asv-card:hover .asv-card-inner {
          transform : rotate(calc(var(--rot) * -1)) translateY(-14px) scale(1.045);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
        }

        .asv-card:hover .asv-card-img { transform: scale(1.07); }

        /* ── Tablet ──────────────────────────────── */
        /* The row still reads as a row here, so it keeps its shape and only
           flattens the stagger, which would otherwise eat the height. */
        @media (max-width: 900px) {
          .asv-card { margin-top: calc(var(--lift) * 0.5); }
        }

        /* ── Mobile ──────────────────────────────── */
        /* Four cards side by side would be thumbnails at this width, so the row
           folds into two pairs — each card keeps its own tilt. */
        @media (max-width: 600px) {
          .asv-row {
            flex-wrap : wrap;
            gap       : 0.75rem;
            margin-top: 2.25rem;
          }

          .asv-card {
            flex      : 0 0 calc(50% - 0.375rem);
            max-width : none;
            margin-top: 0;
          }

          .asv-card-inner { aspect-ratio: 5 / 6; }

          .asv-body { line-height: 1.8; }
        }

        @media (prefers-reduced-motion: reduce) {
          .asv-card-inner,
          .asv-card-img { transition: none; }
        }
      `}</style>

      <section ref={sectionRef} className="asv-section">
        <div className="asv-inner">

          {/* Heading block */}
          <div className="asv-head">
            <p ref={eyebrowRef} className="asv-eyebrow">
              {eyebrow}
            </p>

            <h2 ref={headingRef} className="asv-heading">
              {withLineBreaks(heading)}
            </h2>

            <p ref={bodyRef} className="asv-body">
              {withLineBreaks(body)}
            </p>
          </div>

          {/* Scattered row of photographs */}
          <div ref={rowRef} className="asv-row">
            {photos.map((src, i) => {
              const { rot, lift, z } = CARD_LAYOUT[i % CARD_LAYOUT.length];

              return (
                <div
                  key={`${src}-${i}`}
                  className="asv-card"
                  style={{ "--rot": `${rot}deg`, "--lift": `${lift}px`, "--z": z }}
                >
                  <div className="asv-card-inner">
                    <img
                      src={src}
                      alt={`${projectName} farmland — view ${i + 1}`}
                      className="asv-card-img"
                      loading="lazy"
                    />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>
    </>
  );
};

export default AboutSarasview;
