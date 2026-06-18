import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import home_banner_2 from "../assets/images/home_banner_2.jpg";

gsap.registerPlugin(ScrollTrigger);

const pins = [
  {
    id: "skybreez",
    label: "Skybreez",
    top: "75%",
    left: "22%",
    desc: "Serene hillside farmhouse plots with panoramic valley views.",
    fullDesc:
      "Skybreez by Grow Farms is a tranquil farmhouse community nestled in the rolling hills near Mumbai. Designed for those who seek a peaceful escape, each plot offers sweeping valley views, fresh mountain air, and a chance to reconnect with nature — while staying close to city conveniences.",
    image: home_banner_2,
  },
  {
    id: "sarasview",
    label: "Sarasview",
    top: "58%",
    left: "50%",
    desc: "Premium plots overlooking the rocky peaks and lush canopy.",
    fullDesc:
      "Sarasview by Grow Farms is a sprawling 140-acre residential farmland development located in the peaceful surroundings of Aptavane Village, just 2 km away from the historic Pali city in Maharashtra.",
    image: home_banner_2,
  },
  {
    id: "xyzview",
    label: "Xyzview",
    top: "52%",
    left: "82%",
    desc: "Premium plots overlooking the rocky peaks and lush canopy.",
    fullDesc:
      "Xyzview offers premium farmland plots with breathtaking views of the surrounding peaks and verdant canopy. A rare opportunity to own land in one of Maharashtra's most scenic corridors.",
    image: home_banner_2,
  },
  {
    id: "syview2",
    label: "Syview 2",
    top: "75%",
    left: "78%",
    desc: "Premium plots overlooking the rocky peaks and lush canopy.",
    fullDesc:
      "Syview 2 expands on the success of our first phase, offering larger plots with enhanced amenities and unobstructed views of the natural landscape.",
    image: home_banner_2,
  },
];

// ── Adjust this to your actual navbar height ──────────────────────────────────
// FIX 1: desktop drawer is offset from top so it doesn't cover the navbar.
// Change this value to match your navbar's pixel height.
const NAVBAR_HEIGHT = 64;

export default function AerialMapSection() {
  const [activePin, setActivePin] = useState(null);
  const sectionRef = useRef(null);
  const pinInnerRefs = useRef([]);

  // FIX 3: Keep last selected pin in a ref so the drawer/sheet content
  // doesn't disappear instantly when closing — it stays visible for the
  // full slide-out transition (400ms), then is gone.
  const lastSelectedRef = useRef(null);
  const selected = pins.find((p) => p.id === activePin);
  if (selected) lastSelectedRef.current = selected;
  const displayPin = selected || lastSelectedRef.current;

  useEffect(() => {
    const inners = pinInnerRefs.current.filter(Boolean);

    gsap.set(inners, {
      opacity: 0,
      scale: 0,
      transformOrigin: "50% 50%",
    });

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 75%",
      once: true,
      onEnter: () => {
        gsap.to(inners, {
          opacity: 1,
          scale: 1,
          duration: 1.0,
          ease: "back.out(1.6)",
          stagger: 0.7,
        });
      },
    });

    return () => {
      trigger.kill();
      gsap.set(inners, { clearProps: "all" });
    };
  }, []);

  return (
    // FIX 5: overflow-x-hidden instead of overflow-hidden so animate-ping
    // rings on edge pins don't get clipped vertically.
    <section ref={sectionRef} className="relative w-full overflow-x-hidden">
      <img
        src={home_banner_2}
        alt="Aerial farmland view"
        className="w-full h-auto block"
        style={{ minHeight: "220px", objectFit: "cover" }}
      />

      {/* Bottom gradient */}
      <div
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{
          height: "20%",
          background: "linear-gradient(180deg, rgba(49,85,55,0) 0%, #315537 100%)",
          zIndex: 900,
        }}
      />

      {/* ── Location Pins ── */}
      {pins.map((pin, i) => {
        const isActive = activePin === pin.id;

        return (
          // OUTER shell — only handles position & centering. GSAP never touches this.
          <div
            key={pin.id}
            className="group"
            style={{
              position : "absolute",
              top      : pin.top,
              left     : pin.left,
              zIndex   : 15,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* INNER wrapper — GSAP animates scale + opacity here only */}
            <div
              ref={(el) => (pinInnerRefs.current[i] = el)}
              style={{ display: "inline-block" }}
            >
              {/* Tooltip — desktop hover only, hidden when a pin is active */}
              {!activePin && (
                <div
                  className="absolute bottom-full left-1/2 mb-3 w-max max-w-[160px]
                    opacity-0 group-hover:opacity-100
                    transition-all duration-300 ease-out pointer-events-none z-30
                    hidden sm:block"
                  style={{ transform: "translateX(-50%)" }}
                >
                  <div
                    className="rounded-xl px-3 py-2 text-center"
                    style={{
                      background    : "rgba(255,255,255,0.95)",
                      backdropFilter: "blur(12px)",
                      boxShadow     : "0 8px 32px rgba(0,0,0,0.18)",
                    }}
                  >
                    <p className="text-[#1a4a22] font-semibold text-xs leading-tight">
                      {pin.label}
                    </p>
                  </div>
                  <div
                    className="mx-auto w-0 h-0"
                    style={{
                      borderLeft : "5px solid transparent",
                      borderRight: "5px solid transparent",
                      borderTop  : "5px solid rgba(255,255,255,0.95)",
                    }}
                  />
                </div>
              )}

              {/* Pin dot */}
              <div
                className="relative flex items-center justify-center cursor-pointer"
                onClick={() => setActivePin(isActive ? null : pin.id)}
              >
                {/* FIX 4: ping ring hidden when pin is active — avoids
                    the bouncing ring showing behind the enlarged dot */}
                {!isActive && (
                  <span
                    className="absolute w-[28px] h-[28px] sm:w-[36px] sm:h-[36px] rounded-full border border-white/60 animate-ping"
                    style={{ animationDuration: "2.2s" }}
                  />
                )}

                <div
                  className={`w-[16px] h-[16px] sm:w-[22px] sm:h-[22px] rounded-full border-2 border-white
                    transition-all duration-300
                    ${isActive ? "scale-150" : "group-hover:scale-125"}`}
                  style={{
                    background    : isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                    backdropFilter: "blur(6px)",
                    boxShadow     : "0 2px 12px rgba(0,0,0,0.3)",
                  }}
                >
                  <div className="w-full h-full rounded-full flex items-center justify-center">
                    <div
                      className="w-[5px] h-[5px] sm:w-[7px] sm:h-[7px] rounded-full"
                      style={{ background: isActive ? "#315537" : "white" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* ── DESKTOP DRAWER ──
          FIX 1: top offset by NAVBAR_HEIGHT so the drawer doesn't cover the navbar.
          FIX 2: z-index set to 998 (one below the mobile sheet at 9999).
      ── */}
      <div
        className="fixed right-0 z-[998] hidden sm:flex flex-col"
        style={{
          top       : `0`,
          height    : `100vh`,
          width     : "clamp(260px, 40%, 400px)",
          background: "#DDEADF",
          transform : activePin ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.42s cubic-bezier(0.4,0,0.2,1)",
          boxShadow : "-8px 0 40px rgba(0,0,0,0.18)",
        }}
      >
        {/* FIX 3: render displayPin (last selected) instead of selected
            so content stays visible during the slide-out transition */}
        {displayPin && (
          <>
            <button
              onClick={() => setActivePin(null)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center
                hover:bg-black/8 transition-colors duration-200 z-10"
              style={{ border: "1px solid rgba(0,0,0,0.12)" }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="#555" strokeWidth="2.5" strokeLinecap="round">
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            </button>
            <div className="flex flex-col h-full px-6 pt-10 pb-6 overflow-y-auto">
              <h2
                className="text-[#1a3d22] mb-3"
                style={{
                  fontSize  : "clamp(1.3rem, 2.5vw, 1.8rem)",
                  fontWeight: 600,
                }}
              >
                {displayPin.label}
              </h2>
              <p className="text-[#3d5040] leading-relaxed mb-5 text-sm">
                {displayPin.fullDesc}
              </p>
              <div
                className="w-full rounded-xl overflow-hidden mb-6"
                style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}
              >
                <img
                  src={displayPin.image}
                  alt={displayPin.label}
                  className="w-full h-[140px] object-cover"
                />
              </div>
              <div className="flex gap-3 mt-auto">
                <button
                  className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium
                    transition-all duration-200 hover:opacity-90"
                  style={{ background: "#315537" }}
                >
                  View Details
                </button>
                <button
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200 hover:bg-black/5"
                  style={{ border: "1.5px solid #315537", color: "#315537" }}
                >
                  Enquire Now
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── MOBILE BOTTOM SHEET ──
          FIX 2: overlay at z-[9998], sheet at z-[9999] so sheet always
          renders on top of the overlay — no tap-through risk.
      ── */}
      <>
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 z-[9998] sm:hidden transition-opacity duration-300"
          style={{
            background   : "rgba(0,0,0,0.45)",
            opacity      : activePin ? 1 : 0,
            pointerEvents: activePin ? "auto" : "none",
          }}
          onClick={() => setActivePin(null)}
        />

        {/* Sheet */}
        <div
          className="fixed bottom-0 left-0 right-0 z-[9999] sm:hidden rounded-t-2xl overflow-hidden"
          style={{
            background    : "rgba(240,245,241,0.98)",
            backdropFilter: "blur(20px)",
            transform     : activePin ? "translateY(0)" : "translateY(100%)",
            transition    : "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
            boxShadow     : "0 -8px 40px rgba(0,0,0,0.2)",
            maxHeight     : "82vh",
          }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-black/15" />
          </div>

          {/* FIX 3: render displayPin so content stays during slide-out */}
          {displayPin && (
            <div
              className="flex flex-col px-5 pt-2 pb-8 overflow-y-auto"
              style={{ maxHeight: "78vh" }}
            >
              <button
                onClick={() => setActivePin(null)}
                className="self-end w-7 h-7 rounded-full flex items-center justify-center mb-2"
                style={{ border: "1px solid rgba(0,0,0,0.12)" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="#555" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </svg>
              </button>
              <h2
                className="text-[#1a3d22] mb-2"
                style={{
                  fontSize  : "1.5rem",
                  fontFamily: "'Georgia', serif",
                  fontWeight: 600,
                }}
              >
                {displayPin.label}
              </h2>
              <p className="text-[#3d5040] leading-relaxed mb-4 text-sm">
                {displayPin.fullDesc}
              </p>
              <div
                className="w-full rounded-xl overflow-hidden mb-5"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              >
                <img
                  src={displayPin.image}
                  alt={displayPin.label}
                  className="w-full h-[160px] object-cover"
                />
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 py-3 rounded-xl text-white text-sm font-medium
                    active:opacity-80 transition-opacity"
                  style={{ background: "#315537" }}
                >
                  View Details
                </button>
                <button
                  className="flex-1 py-3 rounded-xl text-sm font-medium active:bg-black/5"
                  style={{ border: "1.5px solid #315537", color: "#315537" }}
                >
                  Enquire Now
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    </section>
  );
}