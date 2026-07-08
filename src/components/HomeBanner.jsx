import React, { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import logo_img from "../assets/images/grow-farms-logo.png";

gsap.registerPlugin(ScrollTrigger);

// ─── constants ────────────────────────────────────────────────────────────────
const BG_COLOR = "#163f1f"; // single source of truth for background color

const getPinHeight = () =>
  window.innerWidth < 768 ? "400vh" : "600vh";

const TOTAL_SCROLLS = 5;
const VIDEO_END     = 3 / TOTAL_SCROLLS; // 0.0 → 0.6

// ─── Text stages ──────────────────────────────────────────────────────────────
const TEXT_STAGES = [
  {
    heading: "Own a Piece of\nNature, Not Just Land.",
    sub: "Premium farmhouse plots designed for peaceful living, smart investment, and future generations.",
  },
  {
    heading: "Where Serenity Meets\nSmart Investment.",
    sub: "Curated land that appreciates over time while giving you a sanctuary away from city chaos.",
  },
  {
    heading: "Build Memories That\nOutlast Generations.",
    sub: "Lush greenery, clean air, and space to breathe — right at your doorstep, near Mumbai.",
  },
];

const SEGMENT    = 1 / TOTAL_SCROLLS;
const ENTER_FRAC = 0.28;
const EXIT_FRAC  = 0.72;

// ─── Frame config ──────────────────────────────────────────────────────────────
const FRAME_COUNT  = 114;
const FRAME_PREFIX = "/frames/";
const FRAME_EXT    = "webp";
const FRAME_PAD    = 1;
const BATCH_SIZE   = 20;

const pad      = (n, w) => (w > 1 ? String(n).padStart(w, "0") : String(n));
const clamp    = (v)    => Math.max(0, Math.min(1, v));
const easeOut3 = (t)    => 1 - Math.pow(1 - t, 3);
const easeIn3  = (t)    => Math.pow(t, 3);

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

  const textStageRefs = useRef(
    TEXT_STAGES.map(() => ({ wrap: null, eyebrow: null, h1: null, p: null }))
  );

  // ── vh fix ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const set = () => {
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`
      );
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

    // FIX: fill the whole canvas with BG_COLOR first so no transparent strip
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(bitmap, dx, dy, dw, dh);
  }, []);

  // ── Resize canvas ─────────────────────────────────────────────────────────
  // FIX: use stickyRef.clientHeight instead of window.innerHeight
  // Android Chrome toolbar changes dvh dynamically; clientHeight is stable
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const pr     = Math.min(window.devicePixelRatio || 1, 2);
      const sticky = stickyRef.current;

      // clientWidth/clientHeight reflect the actual rendered box size —
      // NOT the dvh unit which fluctuates with Android's address bar
      const w = sticky ? sticky.clientWidth  : window.innerWidth;
      const h = sticky ? sticky.clientHeight : window.innerHeight;

      canvas.width  = Math.round(w * pr);
      canvas.height = Math.round(h * pr);

      lastFrameRef.current = -1;

      if (framesRef.current.length) {
        const vidP = Math.min(progressRef.current / VIDEO_END, 1);
        drawFrame(Math.round(vidP * (FRAME_COUNT - 1)));
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    // FIX: also observe stickyRef so dvh changes trigger a redraw
    if (stickyRef.current) ro.observe(stickyRef.current);
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
              const res  = await fetch(url);
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

      const isFirst = i === 0;
      const isLast  = i === TEXT_STAGES.length - 1;
      const start   = i * SEGMENT;
      const local   = (p - start) / SEGMENT;

      let opacity = 0;
      let yH1     = 32;
      let yEye    = 20;
      let yP      = 44;

      if (p < start) {
        opacity = 0; yH1 = 32; yEye = 20; yP = 44;
      } else if (isFirst && p < SEGMENT * ENTER_FRAC) {
        const t = easeOut3(p / (SEGMENT * ENTER_FRAC));
        opacity = t;
        yH1     = 32 * (1 - t);
        yEye    = 20 * (1 - t);
        yP      = 44 * (1 - t);
        currentActive = 0;
      } else if (local <= ENTER_FRAC && !isFirst) {
        const t = easeOut3(local / ENTER_FRAC);
        opacity = t;
        yH1     = 32 * (1 - t);
        yEye    = 20 * (1 - t);
        yP      = 44 * (1 - t);
      } else if (isLast) {
        opacity = 1; yH1 = 0; yEye = 0; yP = 0;
        currentActive = i;
      } else if (local <= EXIT_FRAC) {
        opacity = 1; yH1 = 0; yEye = 0; yP = 0;
        currentActive = i;
      } else {
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
        const p      = target;
        const videoP = Math.min(p / VIDEO_END, 1);
        drawFrame(Math.round(videoP * (FRAME_COUNT - 1)));
        applyTextStages(p);
        return;
      }

      const ease = Math.abs(diff) > 0.2 ? 0.12 : 0.08;
      lerpRef.current += diff * ease;
      const p = lerpRef.current;

      const videoP = Math.min(p / VIDEO_END, 1);
      drawFrame(Math.round(videoP * (FRAME_COUNT - 1)));
      applyTextStages(p);

      lerpRafRef.current = requestAnimationFrame(tick);
    };
    if (!lerpRafRef.current)
      lerpRafRef.current = requestAnimationFrame(tick);
  }, [drawFrame, applyTextStages]);

  // ── ScrollTrigger ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;

    textStageRefs.current.forEach((refs, i) => {
      if (!refs.wrap) return;
      refs.wrap.style.willChange = "opacity";
      const visible = i === 0;
      refs.wrap.style.opacity    = visible ? "1" : "0";
      const eyeY = visible ? "0px" : "20px";
      const h1Y  = visible ? "0px" : "32px";
      const pY   = visible ? "0px" : "44px";
      if (refs.eyebrow) { refs.eyebrow.style.transform = `translateY(${eyeY})`; refs.eyebrow.style.willChange = "transform"; }
      if (refs.h1)      { refs.h1.style.transform      = `translateY(${h1Y})`;  refs.h1.style.willChange      = "transform"; }
      if (refs.p)       { refs.p.style.transform       = `translateY(${pY})`;   refs.p.style.willChange       = "transform"; }
    });

    if (triggerRef.current) { triggerRef.current.kill(); triggerRef.current = null; }

    triggerRef.current = ScrollTrigger.create({
      trigger          : pinWrapRef.current,
      start            : "top top",
      end              : "bottom bottom",
      pin              : stickyRef.current,
      pinSpacing       : true,
      anticipatePin    : 1,
      invalidateOnRefresh: true,
      fastScrollEnd    : true,
      onUpdate(self) {
        progressRef.current = gsap.utils.clamp(0, 1, self.progress);
        startLerp();
      },
    });

    ScrollTrigger.refresh();

    return () => {
      if (triggerRef.current) { triggerRef.current.kill(); triggerRef.current = null; }
      if (lerpRafRef.current) cancelAnimationFrame(lerpRafRef.current);
    };
  }, [ready, startLerp]);

  // Refresh on resize / orientation
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh(true);
    window.addEventListener("resize", refresh);
    window.addEventListener("orientationchange", refresh);
    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("orientationchange", refresh);
    };
  }, []);

  useEffect(() => {
    if (triggerRef.current) ScrollTrigger.refresh();
  }, [pinHeight]);

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .hb-heading {
          font-size: clamp(2rem, 5vw, 3.25rem);
          font-weight: 300;
          width: 100%;
          max-width: 18ch;
          line-height: 1.08;
          letter-spacing: -0.02em;
          color: #ffffff;
          white-space: pre-line;
          text-shadow: 0 4px 32px rgba(0,0,0,0.4);
          margin: 0 auto 1.25rem;
        }
        .hb-eyebrow {
          font-size: clamp(0.6rem, 1vw, 0.75rem);
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(163, 201, 110, 0.85);
          margin: 0 auto 1rem;
          display: block;
          width: 100%;
          max-width: 18ch;
          text-shadow: 0 1px 8px rgba(0,0,0,0.3);
        }
        .hb-sub {
          font-size: clamp(0.78rem, 1.2vw, 1rem);
          font-weight: 300;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.68);
          width: 100%;
          max-width: 32ch;
          margin: 0 auto;
          text-shadow: 0 1px 12px rgba(0,0,0,0.3);
        }
      `}</style>

      {/*
        FIX 1: pinWrapRef gets backgroundColor: BG_COLOR
        This fills the GSAP pin-spacer background so no dark strip
        appears between HomeBanner and the next section during scroll.
      */}
      <div
        ref={pinWrapRef}
        className="overflow-hidden"
        style={{
          height         : pinHeight,
          position       : "relative",
          zIndex         : 30,
          backgroundColor: BG_COLOR, // ← KEY FIX
        }}
      >
        {/*
          FIX 2: stickyRef gets the same backgroundColor.
          When dvh changes (Android toolbar show/hide), before canvas
          repaints there's a flash of this background — must match.
        */}
        <div
          ref={stickyRef}
          className="relative w-full"
          style={{
            height         : "100dvh",
            overflow       : "hidden",
            backgroundColor: BG_COLOR, // ← KEY FIX
          }}
        >
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            style={{
              position       : "absolute",
              inset          : 0,
              // FIX 3: width/height 100% of parent, NOT 100dvh
              // The parent is already 100dvh; using 100dvh on canvas
              // can overshoot when dvh changes and leave a gap
              width          : "100%",
              height         : "100%",
              opacity        : ready ? 1 : 0,
              transition     : "opacity 0.4s ease",
              imageRendering : "crisp-edges",
              display        : "block",
            }}
          />

          {/* Top vignette */}
          <div
            className="absolute top-0 left-0 w-full pointer-events-none"
            style={{
              height    : "22%",
              zIndex    : 10,
              background: `linear-gradient(to bottom, rgba(14,42,20,0.5) 0%, transparent 100%)`,
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

          {/*
            FIX 4: Bottom gradient end color = BG_COLOR
            This seamlessly bridges HomeBanner bottom into AerialMapSection top.
            Both sections share BG_COLOR so there is zero visible seam.
          */}
          <div
            className="absolute bottom-0 left-0 w-full pointer-events-none"
            style={{
              // FIX 5: height 100% instead of clamp — ensures it always
              // reaches the very bottom pixel of the sticky container
              height : "clamp(80px, 35%, 220px)",
              background: `linear-gradient(180deg,
                rgba(22,63,31,0)   0%,
                rgba(22,63,31,0.4) 40%,
                rgba(22,63,31,0.8) 70%,
                ${BG_COLOR}        100%)`,
              zIndex: 20,
            }}
          />
        </div>
      </div>
    </>
  );
};

export default HomeBanner;