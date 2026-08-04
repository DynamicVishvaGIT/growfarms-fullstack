import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------------
   Step data — positions are % of the desktop stage (viewBox 0 0 1000 900)
--------------------------------------------------------------------- */
const STEPS = [
  {
    number: '01',
    title: 'Explore Available Plots',
    description:
      'Browse our curated selection of verified farmland plots across prime agricultural zones suited to your investment goals.',
    top: '22%',
    left: '57%',
    width: 236,
    rotate: 0,
  },
  {
    number: '02',
    title: 'Schedule A Site Visit',
    description:
      'Book a guided on-site visit with our land experts to experience the property firsthand before making any commitment.',
    top: '46%',
    left: '32%',
    width: 214,
    rotate: 0,
  },
  {
    number: '03',
    title: 'Verify & Complete Documentation',
    description:
      'Review all legal documents, verify the property details, and complete the purchase process securely.',
    top: '70%',
    left: '60%',
    width: 242,
    rotate: -4,
    defaultOpen: true,
  },
  {
    number: '04',
    title: 'Become A Proud Land Owner',
    description:
      'Complete payment and registration to officially become a proud farmland owner and begin your agricultural journey.',
    top: '90%',
    left: '30%',
    width: 236,
    rotate: 20,
  },
];

/* Dashed S-curve threading between the card centers, traced against the
   supplied path mask. viewBox 0 0 1000 900 (matches the desktop stage). */
const PATH_D = `
  M 470 10
  C 630 50, 665 155, 585 215
  C 535 250, 455 222, 395 216
  C 300 202, 90 200, 100 320
  C 100 362, 190 402, 225 408
  C 405 422, 565 432, 685 482
  C 805 532, 750 800, 300 640
  C -200 500, 200 800, 500 900
`;

function ChevronIcon({ className, style }) {
  return (
    <svg
      width="11"
      height="7"
      viewBox="0 0 12 8"
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path
        d="M1 1.5L6 6.5L11 1.5"
        stroke="#9CA3AF"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CurvedDownArrow = ({ innerRef, className, style }) => (
  <svg
    ref={innerRef}
    viewBox="0 0 120 80"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      fill="#fff"
      d="M18 24
         C 38 4, 72 8, 82 32
         L 96 26
         L 92 58
         L 62 52
         L 74 44
         C 66 26, 42 22, 24 36
         Z"
    />
  </svg>
);

function StepCard({ step, cardRef, isOpen, onToggle }) {
  return (
    <div
      ref={cardRef}
      className="absolute select-none"
      style={{
        top: step.top,
        left: step.left,
        width: step.width,
        transform: `translate(-50%, -50%) rotate(${step.rotate}deg)`,
        cursor: 'pointer',
      }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      {/* Stacked ghost shadows */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.32)',
          transform: 'rotate(-5deg) translate(5px, 6px)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.62)',
          transform: 'rotate(-2.5deg) translate(2px, 3px)',
        }}
        aria-hidden="true"
      />

      {/* Card face */}
      <div
        className="relative rounded-2xl bg-white"
        style={{
          padding: '10px 14px 12px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
        }}
      >
        <div className="flex items-center justify-between mb-1 gap-2">
          <span
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '10px',
              letterSpacing: '0.18em',
              color: '#9CA3AF',
            }}
          >
            {step.number}
          </span>
          <ChevronIcon
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
              flexShrink: 0,
            }}
          />
        </div>

        <p
          className="text-center"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '13.5px',
            lineHeight: '1.35',
            color: '#1f2937',
          }}
        >
          {step.title}
        </p>

        {/* Expandable description */}
        <div
          style={{
            overflow: 'hidden',
            maxHeight: isOpen ? '140px' : '0px',
            opacity: isOpen ? 1 : 0,
            transition: 'max-height 0.32s ease, opacity 0.28s ease',
            marginTop: isOpen ? '6px' : '0',
          }}
        >
          <p
            className="text-center"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '10px',
              lineHeight: '1.65',
              color: '#6B7280',
            }}
          >
            {step.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HowToBuyFarmLand() {
  const sectionRef = useRef(null);
  const dottedPathRef = useRef(null); // visible dotted path (never touched by GSAP dash logic)
  const maskPathRef = useRef(null); // invisible "draw" path that drives the reveal mask
  const cardRefs = useRef([]);
  const arrowRef = useRef(null);
  const mobileItemRefs = useRef([]);

  const initialOpen = STEPS.findIndex((s) => s.defaultOpen);
  const [openDesktop, setOpenDesktop] = useState(
    initialOpen === -1 ? null : initialOpen
  );
  const [openMobile, setOpenMobile] = useState(
    initialOpen === -1 ? null : initialOpen
  );

  const handleDesktopToggle = (i) =>
    setOpenDesktop((prev) => (prev === i ? null : i));

  const handleMobileToggle = (i) =>
    setOpenMobile((prev) => (prev === i ? null : i));

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Wait for web fonts to finish loading before measuring/animating anything.
    // Playfair Display / Inter swapping in late shifts layout and throws off
    // ScrollTrigger's start/end math, which is why animations can fire at the
    // wrong scroll position (or not at all) on first load.
    const fontsReady =
      typeof document !== 'undefined' && document.fonts
        ? document.fonts.ready
        : Promise.resolve();

    let ctx;
    let cancelled = false;

    fontsReady.then(() => {
      if (cancelled) return;

      ctx = gsap.context(() => {
        const allEls = [
          ...cardRefs.current,
          arrowRef.current,
          ...mobileItemRefs.current,
        ].filter(Boolean);

        if (prefersReducedMotion()) {
          gsap.set(allEls, { opacity: 1, x: 0, y: 0, scale: 1 });
          if (maskPathRef.current) {
            gsap.set(maskPathRef.current, { strokeDashoffset: 0 });
          }
          return;
        }

        // Draw the line as the section scrolls into view. We animate a
        // hidden "mask path" (solid stroke) rather than the visible dotted
        // path itself — animating dashoffset directly on the "2 10" dotted
        // path would overwrite its dasharray with one giant dash, turning
        // the dots into a solid line. The mask path reveals the always-dotted
        // path underneath it, so the dots stay dots the whole time.
        if (maskPathRef.current) {
          const length = maskPathRef.current.getTotalLength();
          gsap.set(maskPathRef.current, {
            strokeDasharray: length,
            strokeDashoffset: length,
          });
          gsap.to(maskPathRef.current, {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              end: 'bottom 60%',
              scrub: 0.7,
            },
          });
        }

        // Cards pop in individually
        cardRefs.current.forEach((el, i) => {
          if (!el) return;
          gsap.fromTo(
            el,
            { opacity: 0, y: 28, scale: 0.9 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.55,
              ease: 'back.out(1.7)',
              delay: i * 0.08,
              scrollTrigger: {
                trigger: el,
                start: 'top 90%',
                toggleActions: "play none none none"
              },
            }
          );
        });

        // Curved arrow pop
        if (arrowRef.current) {
          gsap.fromTo(
            arrowRef.current,
            { opacity: 0, scale: 0.5, rotate: -20 },
            {
              opacity: 0.9,
              scale: 1,
              rotate: 0,
              duration: 0.5,
              ease: 'back.out(2)',
              scrollTrigger: {
                trigger: arrowRef.current,
                start: 'top 95%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        // Mobile stagger fade-slide
        mobileItemRefs.current.forEach((el, i) => {
          if (!el) return;
          gsap.fromTo(
            el,
            { opacity: 0, x: -22 },
            {
              opacity: 1,
              x: 0,
              duration: 0.48,
              ease: 'power2.out',
              delay: i * 0.07,
              scrollTrigger: {
                trigger: el,
                start: 'top 92%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        });
      }, section);

      // Positions were computed before fonts/layout fully settled elsewhere
      // on the page (e.g. images above this section); re-measure once more
      // on the next frame to be safe.
      setTimeout(() => {
  ScrollTrigger.refresh();
}, 100);
    });

    return () => {
      cancelled = true;
      if (ctx) ctx.revert();
    };
  }, []);


  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{padding: '56px 20px 130px' }}
    >
      {/* ── Header ── */}
      <div className="relative z-10 mx-auto max-w-lg text-center">
        <h2
          style={{
            fontWeight: 500,
            fontSize: 'clamp(24px, 4vw, 32px)',
            color: '#fff',
            letterSpacing: '-0.01em',
          }}
        >
          How To Buy Farm Land
        </h2>
        <p
          style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.75,
            letterSpacing: '0.04em',
            maxWidth: '400px',
            margin: '10px auto 0',
          }}
        >
          Turn Your Dream Of Owning Farm Land Into Reality With Our Simple,
          Secure, And Customer-Friendly Four-Step Process.
        </p>
      </div>

      {/* ── Desktop / tablet scattered layout ── */}
      <div
        className="relative mx-auto mt-14 hidden md:block"
        style={{
          width: '100%',
          maxWidth: '980px',
          aspectRatio: '1000 / 900',
        }}
        aria-label="Four steps to buy farmland"
      >
        {/* SVG dashed connector, revealed progressively via a mask */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1000 900"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <mask
              id="farmland-path-reveal"
              maskUnits="userSpaceOnUse"
              x="-1000"
              y="-1000"
              width="3000"
              height="3000"
            >
              {/* Thick solid stroke used purely to drive the reveal —
                  never rendered directly, only used as a mask. */}
              <path
                ref={maskPathRef}
                d={PATH_D}
                fill="none"
                stroke="#fff"
                strokeWidth="24"
                strokeLinecap="round"
              />
            </mask>
          </defs>

          {/* The actual visible dotted line — always stays dotted */}
          <path
            ref={dottedPathRef}
            d={PATH_D}
            fill="none"
            stroke="#fff"
            strokeOpacity="0.6"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="2 10"
            vectorEffect="non-scaling-stroke"
            mask="url(#farmland-path-reveal)"
          />
        </svg>

        {/* Step cards */}
        {STEPS.map((step, i) => (
          <StepCard
            key={step.number}
            step={step}
            isOpen={openDesktop === i}
            onToggle={() => handleDesktopToggle(i)}
            cardRef={(el) => (cardRefs.current[i] = el)}
          />
        ))}

        {/* Curved down-right arrow */}
        <CurvedDownArrow
          innerRef={arrowRef}
          className="absolute"
          style={{
            top: '100%',
            left: '50%',
            transform: 'rotate(8deg)',
            width: '80px',
            height: 'auto',
            opacity: 0.9,
          }}
        />
      </div>

      {/* ── Mobile vertical stepper ── */}
      <ol
        className="relative z-10 mx-auto mt-12 max-w-sm space-y-5 md:hidden"
        style={{ listStyle: 'none' }}
      >
        {/* Vertical dashed connector line */}
        <span
          className="absolute"
          aria-hidden="true"
          style={{
            left: '15px',
            top: '8px',
            bottom: '8px',
            width: '1px',
            borderLeft: '1.5px dashed rgba(255,255,255,0.3)',
          }}
        />

        {STEPS.map((step, i) => {
          const isOpen = openMobile === i;
          return (
            <li
              key={step.number}
              ref={(el) => (mobileItemRefs.current[i] = el)}
              className="relative flex gap-4"
            >
              {/* Number bubble */}
              <span
                className="relative z-10 flex shrink-0 items-center justify-center rounded-full bg-white"
                style={{
                  width: '32px',
                  height: '32px',
                  fontSize: '10.5px',
                  fontWeight: 500,
                  color: '#374151',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
                }}
              >
                {step.number}
              </span>

              {/* Card */}
              <div
                className="flex-1 rounded-2xl bg-white"
                style={{
                  padding: '10px 14px',
                  boxShadow: '0 8px 22px rgba(0,0,0,0.22)',
                  cursor: 'pointer',
                }}
                onClick={() => handleMobileToggle(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleMobileToggle(i);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p
                    style={{
                      fontSize: '13px',
                      lineHeight: 1.3,
                      color: '#1f2937',
                    }}
                  >
                    {step.title}
                  </p>
                  <ChevronIcon
                    style={{
                      flexShrink: 0,
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.28s ease',
                    }}
                  />
                </div>

                {/* Expandable description */}
                <div
                  style={{
                    overflow: 'hidden',
                    maxHeight: isOpen ? '120px' : '0px',
                    opacity: isOpen ? 1 : 0,
                    transition: 'max-height 0.32s ease, opacity 0.28s ease',
                    marginTop: isOpen ? '6px' : '0',
                  }}
                >
                  <p
                    style={{
                      fontSize: '11px',
                      lineHeight: 1.65,
                      color: '#6B7280',
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}