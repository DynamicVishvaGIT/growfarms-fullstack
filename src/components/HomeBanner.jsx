import React, { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import logo_img from "../assets/images/grow-farms-logo.png";
import cloude_1  from "../assets/images/cloude_1.png";

gsap.registerPlugin(ScrollTrigger);

// ─── Scroll budget ─────────────────────────────────────────────────────────────
const getPinHeight = () => "500vh";

const TOTAL_SCROLLS = 5;
const VIDEO_END   = 3 / TOTAL_SCROLLS; // 0.0 → 0.6
const CLOUD_START = VIDEO_END;
const CLOUD_RANGE = 2 / TOTAL_SCROLLS; // 0.6 → 1.0

// ─── Text stages ──────────────────────────────────────────────────────────────
const TEXT_STAGES = [
  {
    heading : "Own a Piece of\nNature, Not Just Land.",
    sub     : "Premium farmhouse plots designed for peaceful living, smart investment, and future generations.",
  },
  {
    heading : "Where Serenity Meets\nSmart Investment.",
    sub     : "Curated land that appreciates over time while giving you a sanctuary away from city chaos.",
  },
  {
    heading : "Build Memories That\nOutlast Generations.",
    sub     : "Lush greenery, clean air, and space to breathe — right at your doorstep, near Mumbai.",
  },
];

const SEGMENT    = 1 / TOTAL_SCROLLS; // 0.2 per stage
const ENTER_FRAC = 0.28;
const EXIT_FRAC  = 0.72;

// ─── Frame config ──────────────────────────────────────────────────────────────
const FRAME_COUNT  = 114;
const FRAME_PREFIX = "/frames/";
const FRAME_EXT    = "webp";
const FRAME_PAD    = 1;
const BATCH_SIZE   = 20;

const pad   = (n, w) => (w > 1 ? String(n).padStart(w, "0") : String(n));
const clamp = (v) => Math.max(0, Math.min(1, v));
const easeOut3 = (t) => 1 - Math.pow(1 - t, 3);
const easeIn3  = (t) => Math.pow(t, 3);

const applyCloud = (el, xPct, opacity) => {
  if (!el) return;
  el.style.transform = `translateX(${xPct}%)`;
  el.style.opacity   = opacity;
};

// ══════════════════════════════════════════════════════════════════════════════
const HomeBanner = () => {
  const [ready,     setReady]     = useState(false);
  const [loadPct,   setLoadPct]   = useState(0);
  const [pinHeight, setPinHeight] = useState(getPinHeight());
  const [activeIdx, setActiveIdx] = useState(0);

  const pinWrapRef   = useRef(null);
  const stickyRef    = useRef(null);
  const canvasRef    = useRef(null);
  const triggerRef   = useRef(null);
  const framesRef    = useRef([]);
  const lastFrameRef = useRef(-1);
  const progressRef  = useRef(0);
  const lerpRef      = useRef(0);
  const lerpRafRef   = useRef(null);
  const scrollHintRef = useRef(null);

  const textStageRefs = useRef(TEXT_STAGES.map(() => ({
    wrap   : null,
    eyebrow: null,
    h1     : null,
    p      : null,
  })));

  const cloudLMobRef  = useRef(null);
  const cloudLDeskRef = useRef(null);
  const cloudRMobRef  = useRef(null);
  const cloudRDeskRef = useRef(null);

  // ── vh fix ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const set = () => {
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
      setPinHeight(getPinHeight());
    };
    set();
    window.addEventListener("resize", set, { passive: true });
    return () => window.removeEventListener("resize", set);
  }, []);

  // ── drawFrame ────────────────────────────────────────────────────────────────
  const drawFrame = useCallback((index) => {
    const idx    = Math.max(0, Math.min(index, FRAME_COUNT - 1));
    const bitmap = framesRef.current[idx];
    const canvas = canvasRef.current;
    if (!bitmap || !canvas) return;
    if (idx === lastFrameRef.current) return;
    lastFrameRef.current = idx;

    const ctx = canvas.getContext("2d", { alpha: false });
    const { width: cw, height: ch } = canvas;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const bw = bitmap.width, bh = bitmap.height;
    const scale = Math.max(cw / bw, ch / bh);
    const dw = Math.ceil(bw * scale), dh = Math.ceil(bh * scale);
    const dx = Math.round((cw - dw) / 2), dy = Math.round((ch - dh) / 2);

    ctx.fillStyle = "#163f1f";
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(bitmap, dx, dy, dw, dh);
  }, []);

  // ── Resize canvas ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const pr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      if (canvas.width !== Math.round(w * pr) || canvas.height !== Math.round(h * pr)) {
        canvas.width  = Math.round(w * pr);
        canvas.height = Math.round(h * pr);
        lastFrameRef.current = -1;
        if (framesRef.current.length > 0) drawFrame(Math.max(0, lastFrameRef.current));
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [drawFrame]);

  // ── Preload frames ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const urls = Array.from({ length: FRAME_COUNT }, (_, i) =>
        `${FRAME_PREFIX}${pad(i + 1, FRAME_PAD)}.${FRAME_EXT}`
      );
      const bitmaps  = new Array(FRAME_COUNT);
      let loaded     = 0;
      let firstDrawn = false;

      for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        if (cancelled) return;
        const slice = urls.slice(i, i + BATCH_SIZE);
        await Promise.all(
          slice.map(async (url, j) => {
            try {
              const res = await fetch(url);
              const blob = await res.blob();
              bitmaps[i + j] = await createImageBitmap(blob, {
                colorSpaceConversion: "none",
                premultiplyAlpha    : "none",
              });
            } catch (e) {
              console.warn("Frame load failed:", url, e);
            }
            loaded++;
            setLoadPct(Math.round((loaded / FRAME_COUNT) * 100));
            if (!firstDrawn && bitmaps[0]) {
              firstDrawn        = true;
              framesRef.current = bitmaps;
              drawFrame(0);
              setReady(true);
            }
          })
        );
      }
      if (cancelled) return;
      framesRef.current = bitmaps;
      setReady(true);
    };
    load().catch(console.error);
    return () => { cancelled = true; };
  }, [drawFrame]);

  // ── applyTextStages ──────────────────────────────────────────────────────────
  const applyTextStages = useCallback((p) => {
    let currentActive = 0;

    TEXT_STAGES.forEach((_, i) => {
      const refs   = textStageRefs.current[i];
      if (!refs.wrap) return;

      const isFirst = i === 1;
      const isLast  = i === TEXT_STAGES.length - 1;
      const start   = i * SEGMENT;
      const local   = (p - start) / SEGMENT; // 0..1 within this stage

      let opacity = 0;
      let yH1     = 32;
      let yEye    = 20;
      let yP      = 44;

      if (p < start) {
        // Stage hasn't started yet — hidden below
        opacity = 0; yH1 = 32; yEye = 20; yP = 44;
      } else if (isFirst && p < SEGMENT * ENTER_FRAC) {
        // Stage 0: animate in on initial load (progress 0 → ENTER_FRAC*SEGMENT)
        const t = easeOut3(p / (SEGMENT * ENTER_FRAC));
        opacity = t;
        yH1     = 32 * (1 - t);
        yEye    = 20 * (1 - t);
        yP      = 44 * (1 - t);
      } else if (local <= ENTER_FRAC && !isFirst) {
        // Non-first stages: animate in
        const t = easeOut3(local / ENTER_FRAC);
        opacity = t; yH1 = 32 * (1 - t); yEye = 20 * (1 - t); yP = 44 * (1 - t);
      } else if (isLast) {
        // Last stage: lock visible forever
        opacity = 1; yH1 = 0; yEye = 0; yP = 0;
        currentActive = i;
      } else if (local <= EXIT_FRAC) {
        // Hold fully visible
        opacity = 1; yH1 = 0; yEye = 0; yP = 0;
        currentActive = i;
      } else {
        // Exit: slide up + fade out
        const exitT = easeIn3(clamp((local - EXIT_FRAC) / (1 - EXIT_FRAC)));
        opacity = 1 - exitT;
        yH1     = -22 * exitT;
        yEye    = -14 * exitT;
        yP      = -14 * exitT;
      }

      refs.wrap.style.opacity = opacity;
      if (refs.eyebrow) refs.eyebrow.style.transform = `translateY(${yEye}px)`;
      if (refs.h1)      refs.h1.style.transform      = `translateY(${yH1}px)`;
      if (refs.p)       refs.p.style.transform       = `translateY(${yP}px)`;
    });

    setActiveIdx(currentActive);
  }, []);

  // ── Lerp loop ────────────────────────────────────────────────────────────────
  const startLerp = useCallback(() => {
    const tick = () => {
      const target = progressRef.current;
      const diff   = target - lerpRef.current;

      if (Math.abs(diff) < 0.5 / FRAME_COUNT) {
        lerpRef.current    = target;
        lerpRafRef.current = null;
        applyTextStages(lerpRef.current);
        return;
      }

      lerpRef.current += diff * 0.1;
      const p = lerpRef.current;

      // Canvas
      const videoP   = Math.min(p / VIDEO_END, 1);
      drawFrame(Math.round(videoP * (FRAME_COUNT - 1)));

      // Clouds
      const cloudP = clamp((p - CLOUD_START) / CLOUD_RANGE);
      applyCloud(cloudLMobRef.current,  -130 + cloudP * 130, cloudP);
      applyCloud(cloudLDeskRef.current, -130 + cloudP * 130, cloudP);
      applyCloud(cloudRMobRef.current,   130 - cloudP * 130, cloudP);
      applyCloud(cloudRDeskRef.current,  130 - cloudP * 130, cloudP);

      // Text
      applyTextStages(p);

      lerpRafRef.current = requestAnimationFrame(tick);
    };
    if (!lerpRafRef.current) lerpRafRef.current = requestAnimationFrame(tick);
  }, [drawFrame, applyTextStages]);

  // ── ScrollTrigger ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;

    // Init clouds
    [cloudLMobRef, cloudLDeskRef].forEach(({ current: el }) => {
      if (!el) return;
      el.style.transform  = "translateX(-130%)";
      el.style.opacity    = "0";
      el.style.willChange = "transform, opacity";
    });
    [cloudRMobRef, cloudRDeskRef].forEach(({ current: el }) => {
      if (!el) return;
      el.style.transform  = "translateX(130%)";
      el.style.opacity    = "0";
      el.style.willChange = "transform, opacity";
    });

    // Init text stages — stage 0 visible, rest hidden
    textStageRefs.current.forEach((refs, i) => {
      if (!refs.wrap) return;
      refs.wrap.style.willChange = "opacity";
      const visible = i === 0;
      refs.wrap.style.opacity = visible ? "1" : "0";
      const eyeY = visible ? "0px" : "20px";
      const h1Y  = visible ? "0px" : "32px";
      const pY   = visible ? "0px" : "44px";
      if (refs.eyebrow) { refs.eyebrow.style.transform = `translateY(${eyeY})`; refs.eyebrow.style.willChange = "transform"; }
      if (refs.h1)      { refs.h1.style.transform      = `translateY(${h1Y})`;  refs.h1.style.willChange      = "transform"; }
      if (refs.p)       { refs.p.style.transform       = `translateY(${pY})`;   refs.p.style.willChange       = "transform"; }
    });

    if (triggerRef.current) { triggerRef.current.kill(); triggerRef.current = null; }

    triggerRef.current = ScrollTrigger.create({
      trigger      : pinWrapRef.current,
      start        : "top top",
      end          : "bottom bottom",
      pin          : stickyRef.current,
      anticipatePin: 1,
      pinSpacing   : false,
      onUpdate(self) {
        progressRef.current = self.progress;
        startLerp();
      },
    });

    ScrollTrigger.refresh();

    return () => {
      if (triggerRef.current) { triggerRef.current.kill(); triggerRef.current = null; }
      if (lerpRafRef.current) cancelAnimationFrame(lerpRafRef.current);
    };
  }, [ready, startLerp]);

  useEffect(() => {
    if (triggerRef.current) ScrollTrigger.refresh();
  }, [pinHeight]);

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        /* ── Heading ── */
        .hb-heading {
          font-size: clamp(2rem, 5vw, 3.25rem);
          font-weight: 300;
          width: 100%;                    /* FIX: fill container width */
          max-width: 18ch;                /* FIX: tighter ch so it wraps nicely at 2 lines */
          line-height: 1.08;
          letter-spacing: -0.02em;
          color: #ffffff;
          white-space: pre-line;
          text-shadow: 0 4px 32px rgba(0,0,0,0.4);
          margin: 0 auto 1.25rem;        /* FIX: auto horizontal to keep centered */
        }

        /* ── Eyebrow ── */
        .hb-eyebrow {
          font-size: clamp(0.6rem, 1vw, 0.75rem);
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(163, 201, 110, 0.85);
          margin: 0 auto 1rem;
          display: block;
          width: 100%;
          max-width: 18ch;               /* aligned with heading */
          text-shadow: 0 1px 8px rgba(0,0,0,0.3);
        }

        /* ── Sub copy ── */
        .hb-sub {
          font-size: clamp(0.78rem, 1.2vw, 1rem);
          font-weight: 300;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.68);
          width: 100%;
          max-width: 38ch;               /* slightly wider than heading is fine */
          margin: 0 auto;
          text-shadow: 0 1px 12px rgba(0,0,0,0.3);
        }

        /* ── Dots ── */
        .hb-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          transition: background 0.3s ease, transform 0.3s ease;
        }
        .hb-dot.active {
          background: #a3c96e;
          transform: scale(1.4);
        }

      `}</style>

      <div
        ref={pinWrapRef}
        className="overflow-visible"
        style={{ height: pinHeight, position: "relative", zIndex: 30 }}
      >
        <div
          ref={stickyRef}
          className="relative w-full"
          style={{ height: "calc(var(--vh, 1vh) * 100)", overflow: "visible" }}
        >

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{
              opacity       : ready ? 1 : 0,
              transition    : "opacity 0.4s ease",
              imageRendering: "crisp-edges",
            }}
          />

          {/* Bottom gradient */}
          <div
            className="absolute bottom-0 left-0 w-full pointer-events-none"
            style={{
              height: "30%", zIndex: 10,
              background: `linear-gradient(to top,
                rgba(14,42,20,0.98) 0%,
                rgba(22,63,31,0.80) 30%,
                rgba(22,63,31,0.35) 60%,
                transparent 100%)`,
            }}
          />

          {/* Top vignette */}
          <div
            className="absolute top-0 left-0 w-full pointer-events-none"
            style={{
              height: "22%", zIndex: 10,
              background: "linear-gradient(to bottom, rgba(14,42,20,0.5) 0%, transparent 100%)",
            }}
          />

          {/* Logo */}
          <div className="absolute top-0 left-0 right-0 z-30 flex justify-center pt-8 md:pt-10 px-6">
            <img
              src={logo_img}
              alt="GrowFarms – Live with Nature"
              className="h-12 md:h-14 lg:h-16 w-auto object-contain"
            />
          </div>

          {/* ── Hero text stages ── */}
          <div className="absolute inset-0 z-20 pointer-events-none select-none">
            {TEXT_STAGES.map((stage, i) => {
              const isFirst = i === 0;
              return (
                <div
                  key={i}
                  ref={(el) => {
                    if (!textStageRefs.current[i]) return;
                    textStageRefs.current[i].wrap = el;
                    // ── Stamp initial styles immediately on DOM attach ──
                    // so text is never invisible before the ScrollTrigger effect runs
                    if (el) {
                      el.style.opacity    = isFirst ? "1" : "0";
                      el.style.willChange = "opacity";
                    }
                  }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 sm:px-10"
                  style={{ paddingBottom: "5rem" }}
                >

                  {/* Eyebrow */}
                  <span
                    ref={(el) => {
                      if (!textStageRefs.current[i]) return;
                      textStageRefs.current[i].eyebrow = el;
                      if (el) {
                        el.style.transform  = isFirst ? "translateY(0px)" : "translateY(20px)";
                        el.style.willChange = "transform";
                      }
                    }}
                    className="hb-eyebrow"
                  >
                    {stage.eyebrow}
                  </span>

                  {/* Heading */}
                  <h1
                    ref={(el) => {
                      if (!textStageRefs.current[i]) return;
                      textStageRefs.current[i].h1 = el;
                      if (el) {
                        el.style.transform  = isFirst ? "translateY(0px)" : "translateY(32px)";
                        el.style.willChange = "transform";
                      }
                    }}
                    className="hb-heading"
                  >
                    {stage.heading}
                  </h1>

                  {/* Sub */}
                  <p
                    ref={(el) => {
                      if (!textStageRefs.current[i]) return;
                      textStageRefs.current[i].p = el;
                      if (el) {
                        el.style.transform  = isFirst ? "translateY(0px)" : "translateY(44px)";
                        el.style.willChange = "transform";
                      }
                    }}
                    className="hb-sub"
                  >
                    {stage.sub}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ── Stage progress dots ── */}
          <div
            className="absolute z-30 flex flex-col gap-2 items-center"
            style={{ right: "1.5rem", top: "50%", transform: "translateY(-50%)" }}
          >
            {TEXT_STAGES.map((_, i) => (
              <div key={i} className={`hb-dot${activeIdx === i ? " active" : ""}`} />
            ))}
          </div>


          {/* Left cloud — mobile */}
          <div ref={cloudLMobRef} className="absolute pointer-events-none md:hidden"
            style={{ bottom: "-5%", left: "-10%", width: "280px", zIndex: 40, opacity: 0, transform: "translateX(-130%)" }}>
            <img src={cloude_1} alt="" className="w-full h-auto object-contain" style={{ transform: "scaleX(-1)" }} />
          </div>

          {/* Left cloud — desktop */}
          <div ref={cloudLDeskRef} className="absolute pointer-events-none hidden md:block"
            style={{ bottom: "-28%", left: "-40%", width: "clamp(700px,100vw,1800px)", zIndex: 40, opacity: 0, transform: "translateX(-130%)" }}>
            <img src={cloude_1} alt="" className="w-full h-auto object-contain" style={{ transform: "scaleX(-1)" }} />
          </div>

          {/* Right cloud — mobile */}
          <div ref={cloudRMobRef} className="absolute pointer-events-none md:hidden"
            style={{ bottom: "-5%", right: "-10%", width: "280px", zIndex: 40, opacity: 0, transform: "translateX(130%)" }}>
            <img src={cloude_1} alt="" className="w-full h-auto object-contain" />
          </div>

          {/* Right cloud — desktop */}
          <div ref={cloudRDeskRef} className="absolute pointer-events-none hidden md:block"
            style={{ bottom: "-28%", right: "-40%", width: "clamp(700px,100vw,1800px)", zIndex: 40, opacity: 0, transform: "translateX(130%)" }}>
            <img src={cloude_1} alt="" className="w-full h-auto object-contain" />
          </div>

        </div>
      </div>
    </>
  );
};

export default HomeBanner;