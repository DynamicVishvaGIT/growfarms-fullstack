import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import trustedImg from "../assets/images/trust_img.jpg";

gsap.registerPlugin(ScrollTrigger);

export default function TrustSection() {
  const sectionRef = useRef(null);
  const eyebrowRef = useRef(null);
  const headingRef = useRef(null);
  const bodyRef = useRef(null);
  const statsRef = useRef(null);
  const quoteRef = useRef(null);

  const imgColRef = useRef(null);
  const mainImgRef = useRef(null);
  const cardRef = useRef(null);

  const stat1Ref = useRef(null);
  const stat2Ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // -----------------------------
      // LEFT CONTENT ANIMATION
      // -----------------------------
      gsap.fromTo(
        [
          eyebrowRef.current,
          headingRef.current,
          bodyRef.current,
          statsRef.current,
          quoteRef.current,
        ],
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: "power3.out",
          stagger: 0.13,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );

      // -----------------------------
      // IMAGE ANIMATION
      // -----------------------------
      gsap.fromTo(
        imgColRef.current,
        {
          opacity: 0,
          x: 50,
        },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );

      // -----------------------------
      // FLOATING CARD
      // -----------------------------
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          y: 25,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.4)",
          delay: 0.35,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );

      // -----------------------------
      // COUNT UP
      // -----------------------------
      const countUp = (el, target, suffix = "") => {
        if (!el) return;

        const obj = { val: 0 };

        gsap.to(obj, {
          val: target,
          duration: 1.6,
          ease: "power2.out",
          delay: 0.5,

          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },

          onUpdate: () => {
            el.textContent = Math.round(obj.val) + suffix;
          },
        });
      };

      countUp(stat1Ref.current, 15, "+");
      countUp(stat2Ref.current, 7, "-8");

      // -----------------------------
      // IMAGE PARALLAX
      // -----------------------------
      gsap.to(mainImgRef.current, {
        yPercent: -8,
        ease: "none",

        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="
        relative
        w-full
        overflow-hidden

        px-4
        py-10

        sm:px-6
        sm:py-12

        md:px-8
        md:py-14

        lg:px-10
        lg:py-16

        xl:px-12
        xl:py-20
      "
    >
      {/* --------------------------------
          DOT GRID BACKGROUND
      -------------------------------- */}
      <div
        className="
          absolute
          inset-0
          pointer-events-none
          opacity-[0.03]
        "
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* --------------------------------
          MAIN CONTAINER
      -------------------------------- */}
      <div
        className="
          relative
          w-full
          max-w-[1200px]
          mx-auto
        "
      >
        <div
          className="
            grid
            grid-cols-1
            gap-12

            md:gap-14

            lg:grid-cols-2
            lg:gap-12

            xl:gap-16

            items-center
          "
        >
          {/* ==================================================
              LEFT CONTENT
          ================================================== */}
          <div
            className="
              w-full
              min-w-0

              flex
              flex-col

              gap-5

              sm:gap-6

              lg:gap-7
            "
          >
            {/* EYEBROW */}
            <div
              ref={eyebrowRef}
              style={{ opacity: 0 }}
            >
              <span
                className="
                  inline-flex
                  items-center
                  justify-center

                  text-[9px]
                  sm:text-[10px]
                  md:text-[11px]

                  font-semibold
                  tracking-[0.16em]
                  sm:tracking-[0.18em]

                  uppercase

                  text-[#1E3A0F]
                  bg-[#C9A84C]

                  px-3
                  py-1.5

                  sm:px-3.5
                  sm:py-1.5

                  rounded-full

                  whitespace-nowrap
                "
              >
                Our Legacy
              </span>
            </div>

            {/* HEADING */}
            <h2
              ref={headingRef}
              className="
                w-full

                text-[2rem]
                leading-[1.15]

                sm:text-[2.35rem]
                sm:leading-[1.13]

                md:text-[2.6rem]

                lg:text-[2.55rem]

                xl:text-[3rem]

                font-semibold
                text-white
              "
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                opacity: 0,
              }}
            >
              15 Years of Cultivating Trust
            </h2>

            {/* BODY */}
            <p
              ref={bodyRef}
              className="
                w-full
                max-w-[520px]

                text-[0.88rem]
                leading-[1.7]

                sm:text-[0.95rem]

                md:text-[1rem]

                text-white/65
              "
              style={{ opacity: 0 }}
            >
              Grow Farms has a strong foothold in the market, with 15 years
              of experience. We guarantee reliable delivery of agricultural
              land, merging the grit of traditional farming with the
              precision of modern financial management.
            </p>

            {/* ==================================================
                STATS
            ================================================== */}
            <div
              ref={statsRef}
              className="
                flex
                items-stretch

                gap-7

                sm:gap-10

                md:gap-12

                mt-1
              "
              style={{ opacity: 0 }}
            >
              {/* STAT 1 */}
              <div className="min-w-0">
                <p
                  ref={stat1Ref}
                  className="
                    text-[2rem]
                    leading-none

                    sm:text-[2.35rem]

                    md:text-[2.6rem]

                    font-bold
                    text-white
                  "
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}
                >
                  0+
                </p>

                <p
                  className="
                    mt-2

                    text-[9px]
                    leading-tight

                    sm:text-[10px]

                    md:text-[11px]

                    tracking-[0.08em]
                    uppercase

                    text-white/50
                    font-medium

                    whitespace-nowrap
                  "
                >
                  Years Experience
                </p>
              </div>

              {/* DIVIDER */}
              <div className="w-px bg-white/10 self-stretch" />

              {/* STAT 2 */}
              <div className="min-w-0">
                <p
                  ref={stat2Ref}
                  className="
                    text-[2rem]
                    leading-none

                    sm:text-[2.35rem]

                    md:text-[2.6rem]

                    font-bold
                    text-white
                  "
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}
                >
                  0-8
                </p>

                <p
                  className="
                    mt-2

                    text-[9px]
                    leading-tight

                    sm:text-[10px]

                    md:text-[11px]

                    tracking-[0.08em]
                    uppercase

                    text-white/50
                    font-medium

                    whitespace-nowrap
                  "
                >
                  Avg. Team Tenure
                </p>
              </div>
            </div>

            {/* ==================================================
                QUOTE
            ================================================== */}
            <div
              ref={quoteRef}
              className="
                w-full
                max-w-[520px]

                border-l-[2px]
                sm:border-l-[3px]

                border-[#C9A84C]

                pl-4
                sm:pl-5

                mt-1
              "
              style={{ opacity: 0 }}
            >
              <p
                className="
                  text-[0.82rem]
                  leading-[1.7]

                  sm:text-[0.9rem]

                  md:text-[0.95rem]

                  text-white/58
                  italic
                "
              >
                "Our commitment extends beyond transactions; we prioritize
                environmental and health considerations in every acre we
                manage."
              </p>
            </div>
          </div>

          {/* ==================================================
              RIGHT IMAGE
          ================================================== */}
          <div
            ref={imgColRef}
            className="
              relative
              w-full
              min-w-0

              flex
              justify-center

              lg:justify-end
            "
            style={{ opacity: 0 }}
          >
            {/* IMAGE WRAPPER */}
            <div
              className="
                relative
                w-full

                max-w-[520px]

                lg:max-w-none

                overflow-hidden
                rounded-xl

                sm:rounded-2xl
              "
            >
              <div
                ref={mainImgRef}
                className="w-full"
                style={{
                  willChange: "transform",
                }}
              >
                <img
                  src={trustedImg}
                  alt="Two farmers shaking hands in a field"
                  className="
                    block
                    w-full

                    h-[300px]

                    sm:h-[360px]

                    md:h-[420px]

                    lg:h-[460px]

                    xl:h-[480px]

                    object-cover
                  "
                />
              </div>
            </div>

            {/* ==================================================
                FLOATING CARD
            ================================================== */}
            <div
              ref={cardRef}
              className="
                absolute

                z-10

                bg-white
                rounded-xl
                sm:rounded-2xl

                shadow-2xl

                px-4
                py-4

                sm:px-5
                sm:py-5

                w-[175px]

                sm:w-[205px]

                md:w-[215px]

                bottom-[-18px]
                left-3

                sm:bottom-5
                sm:left-auto
                sm:right-[-8px]

                lg:left-[-20px]
                lg:right-auto

                xl:left-[-24px]
              "
              style={{
                opacity: 0,
              }}
            >
              {/* BADGE */}
              <div
                className="
                  flex
                  items-center
                  justify-center

                  w-7
                  h-7

                  sm:w-8
                  sm:h-8

                  rounded-full

                  bg-[#C9A84C]

                  mb-2.5
                  sm:mb-3

                  shadow-sm
                "
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                >
                  <path
                    d="M2.5 7.5L6 11L12.5 4"
                    stroke="white"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* CARD TITLE */}
              <h4
                className="
                  text-[#1E3A0F]

                  font-bold

                  text-[1rem]

                  sm:text-[1.1rem]

                  leading-[1.2]

                  mb-1.5
                  sm:mb-2
                "
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}
              >
                Certified Stability
              </h4>

              {/* CARD TEXT */}
              <p
                className="
                  text-gray-500

                  text-[0.68rem]

                  sm:text-[0.73rem]

                  leading-[1.55]
                "
              >
                We understand your dream of a second home surrounded by
                nature.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}