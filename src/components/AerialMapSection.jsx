import { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import home_banner_2 from "../assets/images/home_banner_2.jpg";
import { useNavigate } from "react-router-dom";
import EnquiryModal from "./EnquiryModal";
import useApiData from "../hooks/useApiData";
import { getMapPins } from "../lib/api";

gsap.registerPlugin(ScrollTrigger);

// FIX: must match HomeBanner's BG_COLOR exactly
const BG_COLOR = "#163f1f";

/**
 * The original hard-coded pins. These stay as the fallback so the map still
 * renders exactly as designed when the backend is unavailable.
 */
const FALLBACK_PINS = [
  {
    id: "skybreez",
    label: "Skybreez",
    imgTop: 78.7,
    imgLeft: 19.1,
    desc: "Serene hillside farmhouse plots with panoramic valley views.",
    fullDesc:
      "Skybreez by Grow Farms is a tranquil farmhouse community nestled in the rolling hills near Mumbai. Designed for those who seek a peaceful escape, each plot offers sweeping valley views, fresh mountain air, and a chance to reconnect with nature — while staying close to city conveniences.",
    image: home_banner_2,
  },
  {
    id: "sarasview",
    label: "Sarasview",
    imgTop: 61.1,
    imgLeft: 49.4,
    desc: "Premium plots overlooking the rocky peaks and lush canopy.",
    fullDesc:
      "Sarasview by Grow Farms is a sprawling 140-acre residential farmland development located in the peaceful surroundings of Aptavane Village, just 2 km away from the historic Pali city in Maharashtra.",
    image: home_banner_2,
  },
  {
    id: "xyzview",
    label: "Xyzview",
    imgTop: 51.4,
    imgLeft: 83.8,
    desc: "Premium plots overlooking the rocky peaks and lush canopy.",
    fullDesc:
      "Xyzview offers premium farmland plots with breathtaking views of the surrounding peaks and verdant canopy. A rare opportunity to own land in one of Maharashtra's most scenic corridors.",
    image: home_banner_2,
  },
  {
    id: "syview2",
    label: "Syview 2",
    imgTop: 78.7,
    imgLeft: 74.4,
    desc: "Premium plots overlooking the rocky peaks and lush canopy.",
    fullDesc:
      "Syview 2 expands on the success of our first phase, offering larger plots with enhanced amenities and unobstructed views of the natural landscape.",
    image: home_banner_2,
  },
];

const ZOOM_SCALE = 1.3;

/**
 * Reshape an API project into the exact pin shape this component already
 * works with, so nothing below here has to change.
 */
function toPin(project) {
  return {
    id: project.slug,
    label: project.title,
    slug: project.slug,
    imgTop: Number(project.map_pin_top) || 0,
    imgLeft: Number(project.map_pin_left) || 0,
    desc: project.short_description || "",
    fullDesc: project.full_description || project.short_description || "",
    image: project.hero_image_url || FALLBACK_PINS[0].image,
  };
}

export default function AerialMapSection() {
  const [activePin, setActivePin] = useState(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  const { data: pins } = useApiData(
    async (signal) => {
      const rows = await getMapPins(signal);
      if (!rows) return null;
      // A project with no coordinates would land at 0,0 — skip it rather than
      // stacking pins in the corner.
      const usable = rows.filter(
        (r) => r.map_pin_top !== null && r.map_pin_left !== null,
      );
      return usable.length ? usable.map(toPin) : null;
    },
    FALLBACK_PINS,
  );

  const [displayPositions, setDisplayPositions] = useState(() =>
    FALLBACK_PINS.map((p) => ({ left: p.imgLeft, top: p.imgTop })),
  );

  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const mapRef = useRef(null);
  const imgRef = useRef(null);
  const pinInnerRefs = useRef([]);
  const pinWrapRefs = useRef([]);

  const naturalSize = useRef({ w: 1600, h: 1080 });
  const panX = useRef(0);
  const zoomRef = useRef({ scale: 1, originX: 50, originY: 50 });

  const drag = useRef({
    active: false,
    startX: 0,
    startPanX: 0,
    moved: false,
  });

  const lastSelectedRef = useRef(null);
  const selected = pins.find((p) => p.id === activePin);
  if (selected) lastSelectedRef.current = selected;
  const displayPin = selected || lastSelectedRef.current;

  // ── Convert pin's source-image % → rendered box % ─────────────────────────
  const getPinDisplayPercent = useCallback((pin) => {
    const map = mapRef.current;
    if (!map) return { left: pin.imgLeft, top: pin.imgTop };
    const w = map.clientWidth;
    const h = map.clientHeight;
    if (!w || !h) return { left: pin.imgLeft, top: pin.imgTop };

    const { w: nw, h: nh } = naturalSize.current;
    const scale = Math.max(w / nw, h / nh);
    const dispW = nw * scale;
    const dispH = nh * scale;
    const offsetX = (dispW - w) / 2;
    const offsetY = (dispH - h) / 2;

    const posX = (pin.imgLeft / 100) * dispW - offsetX;
    const posY = (pin.imgTop / 100) * dispH - offsetY;

    return {
      left: (posX / w) * 100,
      top: (posY / h) * 100,
    };
  }, []);

  const recalcPositions = useCallback(() => {
    setDisplayPositions(pins.map((p) => getPinDisplayPercent(p)));
  }, [getPinDisplayPercent, pins]);

  useEffect(() => {
    recalcPositions();
    const ro = new ResizeObserver(() => recalcPositions());
    if (mapRef.current) ro.observe(mapRef.current);
    window.addEventListener("resize", recalcPositions);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recalcPositions);
    };
  }, [recalcPositions]);

  // ── Clamp pan ─────────────────────────────────────────────────────────────
  const clampPan = useCallback((x) => {
    const viewport = viewportRef.current;
    const map = mapRef.current;
    if (!viewport || !map) return x;
    const maxScroll = -(map.scrollWidth - viewport.clientWidth);
    return Math.min(0, Math.max(maxScroll, x));
  }, []);

  // ── Zoom to pin ───────────────────────────────────────────────────────────
  const zoomToPin = useCallback(
    (pinIndex) => {
      const viewport = viewportRef.current;
      const map = mapRef.current;
      if (!viewport || !map) return;

      const pin = pins[pinIndex];
      if (!pin) return;
      const { left: pinLeftPct, top: pinTopPct } = getPinDisplayPercent(pin);

      const mapW = map.offsetWidth;
      const vW = viewport.clientWidth;
      const pinPxX = (pinLeftPct / 100) * mapW;
      const targetPanX = clampPan(vW / 2 - pinPxX);

      gsap.to(map, {
        transformOrigin: `${pinLeftPct}% ${pinTopPct}%`,
        scale: ZOOM_SCALE,
        x: targetPanX,
        duration: 0.75,
        ease: "power3.out",
        onUpdate() {
          panX.current = targetPanX;
          zoomRef.current.scale = ZOOM_SCALE;
          zoomRef.current.originX = pinLeftPct;
          zoomRef.current.originY = pinTopPct;
        },
      });
    },
    [clampPan, getPinDisplayPercent, pins],
  );

  // ── Zoom out ──────────────────────────────────────────────────────────────
  const zoomOut = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    gsap.to(map, {
      scale: 1,
      x: 0,
      duration: 0.55,
      ease: "power3.inOut",
      onComplete() {
        panX.current = 0;
        zoomRef.current.scale = 1;
        zoomRef.current.originX = 50;
        zoomRef.current.originY = 50;
        map.style.transformOrigin = "50% 50%";
      },
    });
  }, []);

  // ── Pin click ─────────────────────────────────────────────────────────────
  const handlePinClick = useCallback(
    (pinId, isActive, pinIndex) => {
      if (drag.current.moved) return;
      if (isActive) {
        setActivePin(null);
        zoomOut();
      } else {
        setActivePin(pinId);
        zoomToPin(pinIndex);
      }
    },
    [zoomOut, zoomToPin],
  );

  // ── Drag (pan) ───────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    if (zoomRef.current.scale > 1) return;
    if (e.button !== undefined && e.button !== 0) return;
    drag.current.moved = false;
    if (e.target.closest("[data-pin]")) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    drag.current = {
      active: true,
      startX: clientX,
      startPanX: panX.current,
      moved: false,
    };
    if (!e.touches) e.preventDefault();
  }, []);

  const onPointerMove = useCallback(
    (e) => {
      if (!drag.current.active) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const dx = clientX - drag.current.startX;
      if (Math.abs(dx) > 4) drag.current.moved = true;
      const newX = clampPan(drag.current.startPanX + dx);
      panX.current = newX;
      if (mapRef.current)
        mapRef.current.style.transform = `translateX(${newX}px)`;
    },
    [clampPan],
  );

  const onPointerUp = useCallback(() => {
    if (!drag.current.active) return;
    drag.current.active = false;
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener("mousedown", onPointerDown);
    el.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchend", onPointerUp);
    return () => {
      el.removeEventListener("mousedown", onPointerDown);
      el.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, [onPointerDown, onPointerMove, onPointerUp]);

  // ── GSAP scroll entrance ─────────────────────────────────────────────────
  useEffect(() => {
    const inners = pinInnerRefs.current.filter(Boolean);
    gsap.set(inners, { opacity: 0, scale: 0, transformOrigin: "50% 50%" });

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


  const navigate = useNavigate();

  return (
    /*
      FIX: backgroundColor = BG_COLOR (same as HomeBanner)
      This is the single most important fix — both sections share the
      exact same background color so there is zero visible seam/patch
      between them regardless of dvh fluctuations on Android Chrome.
    */
    <section
      ref={sectionRef}
      className="relative"
      style={{ backgroundColor: BG_COLOR, marginTop: 0 }}
    >
      {/*
        FIX: Top bridge gradient — covers any residual 1-2px gap
        by blending BG_COLOR → transparent over the map top edge.
      */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "48px",
          background: `linear-gradient(to bottom, ${BG_COLOR}, transparent)`,
          zIndex: 10,
          pointerEvents: "none",
        }}
      />

      {/* ── MAP VIEWPORT ── */}
      <div
        ref={viewportRef}
        /*
          FIX: previously this only had a height at xl/2xl breakpoints
          (`xl:h-[1000px] 2xl:h-[1250px]`), meaning every mobile width had
          NO explicit height. With no defined height on this element, its
          size depended on the <img> resolving through a height:100% chain
          with nothing concrete above it — which can transiently compute
          near-zero during reflow. That collapse, right at this section's
          top edge, is what showed as a visible gap when scrolling up on
          mobile. Giving it a real height at every breakpoint removes that
          dependency entirely.
        */
        className="relative overflow-hidden select-none h-[vh] sm:h-[75vh] md:h-[850px] xl:h-[1000px] 2xl:h-[1250px]"
        style={{
          touchAction: "pan-y",
        }}
      >
        {/* ── MAP INNER ── */}
        <div
          ref={mapRef}
          style={{
            width: "110%",
            height: "100%",
            willChange: "transform",
            transform: "translateX(0px) scale(1)",
            transformOrigin: "50% 50%",
            position: "relative",
          }}
        >
          <img
            ref={imgRef}
            src={home_banner_2}
            alt="Aerial farmland view"
            draggable={false}
            onLoad={() => {
              if (imgRef.current) {
                naturalSize.current = {
                  w: imgRef.current.naturalWidth || 1600,
                  h: imgRef.current.naturalHeight || 1080,
                };
              }
              recalcPositions();
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              pointerEvents: "none",
            }}
          />

          {/* ── Pins ── */}
          {pins.map((pin, i) => {
            const isActive = activePin === pin.id;
            const pos = displayPositions[i] || {
              left: pin.imgLeft,
              top: pin.imgTop,
            };
            return (
              <div
                key={pin.id}
                ref={(el) => (pinWrapRefs.current[i] = el)}
                data-pin={pin.id}
                className="group"
                style={{
                  position: "absolute",
                  top: `${pos.top}%`,
                  left: `${pos.left}%`,
                  zIndex: 25,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  ref={(el) => (pinInnerRefs.current[i] = el)}
                  style={{ display: "inline-block" }}
                >
                  {/* Tooltip (desktop hover only) */}
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
                          background: "rgba(255,255,255,0.95)",
                          backdropFilter: "blur(12px)",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                        }}
                      >
                        <p className="text-[#1a4a22] font-semibold text-xs leading-tight">
                          {pin.label}
                        </p>
                      </div>
                      <div
                        className="mx-auto w-0 h-0"
                        style={{
                          borderLeft: "5px solid transparent",
                          borderRight: "5px solid transparent",
                          borderTop: "5px solid rgba(255,255,255,0.95)",
                        }}
                      />
                    </div>
                  )}

                  {/* Pin dot */}
                  <div
                    className="relative flex items-center justify-center cursor-pointer"
                    onClick={() => handlePinClick(pin.id, isActive, i)}
                  >
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
                        background: isActive
                          ? "rgba(255,255,255,0.9)"
                          : "rgba(255,255,255,0.35)",
                        backdropFilter: "blur(6px)",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
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
        </div>

        {/* Bottom gradient */}
        <div
          className="absolute bottom-0 left-0 w-full pointer-events-none"
          style={{
            height: "clamp(70px, 8%, 180px)",
            background: `linear-gradient(180deg,
              rgba(49,85,55,0)   0%,
              rgba(49,85,55,0.3) 35%,
              rgba(49,85,55,0.7) 65%,
              #315537            100%)`,
            zIndex: 900,
          }}
        />
      </div>

      {/* ── DESKTOP DRAWER ── */}
      <div
        className="fixed right-0 z-[998] hidden sm:flex flex-col"
        style={{
          top: "0",
          height: "100vh",
          width: "clamp(260px, 40%, 400px)",
          background: "#DDEADF",
          transform: activePin ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.42s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
        }}
      >
        {displayPin && (
          <>
            <div className="relative">
              <button
                onClick={() => {
                  setActivePin(null);
                  zoomOut();
                }}
                className="group absolute top-3 right-3 w-9 h-9 flex items-center justify-center
                  rounded-full bg-white border border-gray-200 shadow-lg overflow-hidden
                  cursor-pointer transition-all duration-500 hover:scale-110 hover:rotate-180
                  hover:shadow-2xl active:scale-95"
              >
                <span
                  className="absolute inset-0 bg-[#315537] scale-0 rounded-full
                  transition-transform duration-500 group-hover:scale-100"
                />
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="relative z-10 text-gray-600 transition-all duration-500
                    group-hover:text-white group-hover:scale-125"
                >
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col h-full px-6 pb-6 pt-5 overflow-y-auto">
              <h2
                className="text-[#1a3d22] mb-3"
                style={{
                  fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)",
                  fontWeight: 600,
                }}
              >
                {displayPin.label}
              </h2>
              <p className="text-[#3d5040] leading-relaxed mb-5 text-sm sub_font">
                {displayPin.fullDesc}
              </p>
              <div
                className="w-full rounded-xl mb-6"
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
                  onClick={() => navigate(`/details/${displayPin.slug || displayPin.id}`)}
                  className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium
                    transition-all duration-200 hover:opacity-90"
                  style={{ background: "#315537" }}
                >
                  View Details
                </button>
                <button
                  onClick={() => setEnquiryOpen(true)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer
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

      {/* ── MOBILE BOTTOM SHEET ── */}
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-[9998] sm:hidden transition-opacity duration-300"
          style={{
            background: "rgba(0,0,0,0.45)",
            opacity: activePin ? 1 : 0,
            pointerEvents: activePin ? "auto" : "none",
          }}
          onClick={() => {
            setActivePin(null);
            zoomOut();
          }}
        />

        {/* Sheet */}
        <div
          className="fixed bottom-0 left-0 right-0 z-[9999] sm:hidden rounded-t-2xl"
          style={{
            background: "rgba(240,245,241,0.98)",
            backdropFilter: "blur(20px)",
            transform: activePin ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
            maxHeight: "82vh",
            pointerEvents: activePin ? "auto" : "none",
          }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-black/15" />
          </div>

          {displayPin && (
            <div
              className="flex flex-col px-5 pt-2 pb-8 overflow-y-auto"
              style={{ maxHeight: "78vh" }}
            >
              <button
                onClick={() => {
                  setActivePin(null);
                  zoomOut();
                }}
                aria-label="Close"
                className="group relative self-end w-10 h-10 flex items-center justify-center
                  rounded-full bg-white border border-gray-200 shadow-lg overflow-hidden
                  transition-all duration-500 hover:scale-110 hover:rotate-180
                  hover:shadow-2xl active:scale-95"
              >
                <span
                  className="absolute inset-0 bg-black scale-0 rounded-full
                  transition-transform duration-500 group-hover:scale-100"
                />
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="relative z-10 text-gray-600 transition-all duration-500
                    group-hover:text-white group-hover:scale-125"
                >
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </svg>
              </button>

              <h2
                className="text-[#1a3d22] mb-2"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                }}
              >
                {displayPin.label}
              </h2>
              <p className="text-[#3d5040] leading-relaxed mb-4 text-sm">
                {displayPin.fullDesc}
              </p>
              <div
                className="w-full rounded-xl mb-5"
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
                  onClick={() => navigate(`/details/${displayPin.slug || displayPin.id}`)}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-medium
                    active:opacity-80 transition-opacity"
                  style={{ background: "#315537" }}
                >
                  View Details
                </button>
                <button
                  onClick={() => setEnquiryOpen(true)}
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

      {/* ── ENQUIRY MODAL ── */}
      <EnquiryModal
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        property={displayPin}
      />
    </section>
  );
}