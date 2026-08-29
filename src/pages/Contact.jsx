import { useLayoutEffect, useRef } from "react";
import ContactBanner from "../assets/images/Contact_banner.png";
import logo_img from "../assets/images/grow-farms-logo.png";
import CardVector from "../assets/images/Vector__4_.png";
import contectSideimg from "../assets/images/Contact.jpg";

import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const infoCards = [
  {
    icon: Mail,
    title: "Mail us 24/7",
    lines: ["pbminfo@admin.com", "pbmadmin@info.com"],
  },
  {
    icon: Phone,
    title: "Call us 24/7",
    lines: [
      "Phone : (+55) 654 - 545 - 5418",
      "Mobile : (+01) 654 - 545 - 1235",
    ],
  },
  {
    icon: MapPin,
    title: "Our Locations",
    lines: ["4821 Ride Top, Anch St, Alaska", "997998, USA main city."],
  },
];

const Contact = () => {
  /* ---------- Page-wide ref (scopes the GSAP context) ---------- */
  const pageRef = useRef(null);

  /* ---------- Section-level refs — same granularity as About.jsx ---------- */
  const cardsWrapRef = useRef(null); // whole info-cards grid, one block
  const imageRef = useRef(null); // side image panel
  const formRef = useRef(null); // form panel (heading + inputs together)
  const mapRef = useRef(null); // map section

  // Kept for the floating arrow-bubble query below (not used for stagger reveal)
  const cardRefs = useRef([]);
  const buttonRef = useRef(null);
  cardRefs.current = [];
  const addCardRef = (el) => el && cardRefs.current.push(el);

  /* ---------- GSAP ScrollTrigger — About.jsx-style section reveals ---------- */
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
          // (identical to the reveal() helper in About.jsx)
          const reveal = (el, extraFrom = {}, extraTo = {}, startPos = "top 85%") => {
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

          reveal(cardsWrapRef.current, {}, {}, "top 82%");
          reveal(
            imageRef.current,
            { x: isMobile ? 0 : -60, y: isMobile ? travel : 0, scale: 1.05 },
            { x: 0, scale: 1, duration: 1 },
            "top 85%"
          );
          reveal(formRef.current, {}, {}, "top 85%");
          reveal(mapRef.current, { scale: 0.97 }, { scale: 1, duration: 1 }, "top 88%");

          // Continuous float on the arrow bubbles — unrelated to scroll reveal,
          // kept as an interactive/ambient animation like About's mouse parallax
          cardRefs.current.forEach((card) => {
            const bubble = card.querySelector(".arrow-bubble");
            if (!bubble) return;
            gsap.to(bubble, {
              y: -8,
              duration: 1.6,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
            });
          });

          // Refresh after layout settles (identical to About.jsx)
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

    return () => ctx.revert(); // kills all ScrollTriggers created inside ctx
  }, []);

  const handleBubbleEnter = (e) => {
    gsap.to(e.currentTarget, {
      scale: 1.15,
      rotate: 45,
      duration: 0.35,
      ease: "back.out(2)",
    });
  };
  const handleBubbleLeave = (e) => {
    gsap.to(e.currentTarget, {
      scale: 1,
      rotate: 0,
      duration: 0.35,
      ease: "power2.out",
    });
  };

  const handleButtonEnter = () => {
    gsap.to(buttonRef.current, {
      scale: 1.03,
      paddingRight: 36,
      duration: 0.3,
      ease: "power2.out",
    });
  };
  const handleButtonLeave = () => {
    gsap.to(buttonRef.current, {
      scale: 1,
      paddingRight: 28,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    gsap.fromTo(
      buttonRef.current,
      { scale: 0.94 },
      { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.4)" },
    );
  };

  return (
    <section ref={pageRef} className="relative w-full overflow-hidden">
      {/* Banner Wrapper */}
      <div className="relative w-full h-[70vh] sm:h-[75vh] md:h-[80vh] overflow-hidden">
        <img
          src={ContactBanner}
          alt="Contact Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-center pt-6 md:pt-8 px-6 md:px-10">
          <img
            src={logo_img}
            alt="GrowFarms – Live with Nature"
            className="h-12 md:h-14 lg:h-16 w-auto object-contain"
          />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
          <h1
            className="text-white font-light tracking-[0.10em] text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
            style={{ textShadow: "0 4px 20px rgba(0,0,0,0.45)" }}
          >
            Contact Us
          </h1>
          <p className="text-white font-light">
            Get in Touch and Start Your Journey with Nature.
          </p>
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

      <section className="w-full px-4 py-10 sm:px-6 sm:py-14 lg:px-10 lg:py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:gap-8">
          {/* Info Cards */}
          <div
            ref={cardsWrapRef}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {infoCards.map(({ icon: Icon, title, lines }) => (
              <div
                key={title}
                ref={addCardRef}
                className="relative px-6 py-10 shadow-sm sm:px-7"
              >
                <img
                  src={CardVector}
                  alt="cardVector"
                  className="absolute inset-0 h-full w-full"
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1e3a2b]">
                      <Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
                    </span>
                    <h3 className="text-lg font-semibold text-[#16281c] sm:text-xl">
                      {title}
                    </h3>
                  </div>

                  <div className="mt-5 border-t border-gray-100 pt-5">
                    {lines.map((line) => (
                      <p
                        key={line}
                        className="text-[13px] leading-6 text-gray-500 sm:text-sm"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={`${title} - open`}
                  onMouseEnter={handleBubbleEnter}
                  onMouseLeave={handleBubbleLeave}
                  className="
                    arrow-bubble absolute
                    -bottom-2 right-6
                    z-20 flex h-11 w-11
                    items-center justify-center
                    rounded-full bg-white
                    text-[#1e3a2b]
                    shadow-md ring-1 ring-black/5
                    sm:right-0
                  "
                >
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>

          {/* Image + Form Panel */}
          <div className="flex flex-col mt-5 overflow-hidden rounded-[2rem] bg-white lg:flex-row">
            <div
              ref={imageRef}
              className="relative h-72 w-full sm:h-96 lg:h-[100vh] lg:w-[40%]"
            >
              <img
                src={contectSideimg}
                alt="Aerial view of a green homestead and vegetable gardens"
                className="h-full w-full object-cover"
              />
            </div>

            <div
              ref={formRef}
              className="relative w-full px-6 py-8 sm:px-10 sm:py-10 lg:w-[60%] lg:px-12 lg:py-12"
            >
              <span className="inline-block rounded-full bg-[#f3f0e8] px-4 py-1.5 text-xs font-medium tracking-wide text-[#16281c]">
                Get To Contact Us
              </span>

              <h2 className="mt-4 font-serif text-3xl leading-tight text-[#1e3a2b] sm:text-4xl">
                Have a any Questions?
                <br />
                Get in Touch!
              </h2>

              <form
                onSubmit={handleSubmit}
                className="relative mt-7 flex flex-col gap-4"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="First Name"
                    autoFocus
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#1e3a2b] transition"
                  />
                  <input
                    type="text"
                    placeholder="Last Number"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#1e3a2b] transition"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#1e3a2b] transition"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#1e3a2b] transition"
                  />
                </div>

                <textarea
                  placeholder="Messages"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#1e3a2b] transition"
                />

                <button
                  ref={buttonRef}
                  type="submit"
                  onMouseEnter={handleButtonEnter}
                  onMouseLeave={handleButtonLeave}
                  className="mt-1 cursor-pointer flex w-fit items-center gap-2 rounded-full bg-[#315537] py-3.5 pl-7 pr-7 text-sm font-medium text-white shadow-md transition-colors hover:bg-[#16281c]"
                >
                  Send Massage
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <div ref={mapRef} className="overflow-hidden shadow-sm">
        {/* Iframe */}
        <div className="relative h-[420px] w-full sm:h-[500px]">
          <iframe
            src="https://www.google.com/maps?q=Mumbai,Maharashtra,India&output=embed"
            width="100%"
            height="500px"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mumbai Map"
          />
        </div>
      </div>
    </section>
  );
};

export default Contact;