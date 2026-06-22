import React, { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import logo_img from "../assets/images/grow-farms-logo.png";
import cloude_1  from "../assets/images/cloude_1.png";

gsap.registerPlugin(ScrollTrigger);

// ─── Scroll budget ─────────────────────────────────────────────────────────────
const getPinHeight = () => (window.innerWidth < 768 ? "350vh" : "700vh");
const VIDEO_END   = 3 / 7;
const CLOUD_START = VIDEO_END;
const CLOUD_RANGE = 1 - CLOUD_START;

// ─── Frame config ──────────────────────────────────────────────────────────────
const FRAME_COUNT  = 376;
const FRAME_PREFIX = "/frames/";
const FRAME_EXT    = "webp";
const FRAME_PAD    = 1;
const BATCH_SIZE   = 20;

const pad = (n, w) => (w > 1 ? String(n).padStart(w, "0") : String(n));

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

  const pinWrapRef   = useRef(null);
  const stickyRef    = useRef(null);
  const canvasRef    = useRef(null);
  const triggerRef   = useRef(null);
  const framesRef    = useRef([]);
  const lastFrameRef = useRef(-1);
  const progressRef  = useRef(0);
  const lerpRef      = useRef(0);
  const lerpRafRef   = useRef(null);

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

  // ── drawFrame — IMPROVED canvas drawing ─────────────────────────────────────
  // Uses imageSmoothingQuality "high" + correct cover-fit + retina-aware sizing
  const drawFrame = useCallback((index) => {
    const idx    = Math.max(0, Math.min(index, FRAME_COUNT - 1));
    const bitmap = framesRef.current[idx];
    const canvas = canvasRef.current;
    if (!bitmap || !canvas) return;
    if (idx === lastFrameRef.current) return;
    lastFrameRef.current = idx;

    const ctx = canvas.getContext("2d", { alpha: false }); // alpha:false = faster compositing
    const { width: cw, height: ch } = canvas;

    // ✅ High quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // ✅ Cover-fit: fills canvas, maintains aspect ratio, centers crop
    const bw    = bitmap.width;
    const bh    = bitmap.height;
    const scale = Math.max(cw / bw, ch / bh);   // cover (not contain)
    const dw    = Math.ceil(bw * scale);
    const dh    = Math.ceil(bh * scale);
    const dx    = Math.round((cw - dw) / 2);    // centered
    const dy    = Math.round((ch - dh) / 2);

    // ✅ clearRect not needed with alpha:false — fillRect is faster
    ctx.fillStyle = "#163f1f"; // match bg color (only visible if bitmap missing)
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(bitmap, dx, dy, dw, dh);
  }, []);

  // ── Resize canvas to device pixels (crisp on retina/HiDPI) ─────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const pr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x — 3x wastes memory
      const w  = canvas.offsetWidth;
      const h  = canvas.offsetHeight;
      // Only resize if dimensions actually changed (avoids clearing on unrelated repaints)
      if (canvas.width !== Math.round(w * pr) || canvas.height !== Math.round(h * pr)) {
        canvas.width  = Math.round(w * pr);
        canvas.height = Math.round(h * pr);
        // Redraw last frame at new size
        lastFrameRef.current = -1; // force redraw
        if (framesRef.current.length > 0) {
          const idx = Math.max(0, lastFrameRef.current);
          drawFrame(idx);
        }
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [drawFrame]);

  // ── Preload frames — frame 0 drawn instantly to kill green flash ─────────────
  useEffect(() => {
    let cancelled  = false;

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
              const res      = await fetch(url);
              const blob     = await res.blob();
              // ✅ colorSpaceConversion: 'none' = skip sRGB→display conversion,
              //    faster decode, no color shift
              bitmaps[i + j] = await createImageBitmap(blob, {
                colorSpaceConversion: "none",
                premultiplyAlpha    : "none",
              });
            } catch (e) {
              console.warn("Frame load failed:", url, e);
            }
            loaded++;
            setLoadPct(Math.round((loaded / FRAME_COUNT) * 100));

            // Draw frame 0 the instant it's ready — no green screen
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

  // ── Apple-style lerp loop ───────────────────────────────────────────────────
  const startLerp = useCallback(() => {
    const tick = () => {
      const target = progressRef.current;
      const diff   = target - lerpRef.current;

      if (Math.abs(diff) < 0.5 / FRAME_COUNT) {
        lerpRef.current    = target;
        lerpRafRef.current = null;
        return;
      }

      lerpRef.current += diff * 0.1; // 0.1 = smooth; lower = more cinematic

      const p        = lerpRef.current;
      const videoP   = Math.min(p / VIDEO_END, 1);
      const frameIdx = Math.round(videoP * (FRAME_COUNT - 1));
      drawFrame(frameIdx);

      const cloudP = Math.min(Math.max((p - CLOUD_START) / CLOUD_RANGE, 0), 1);
      applyCloud(cloudLMobRef.current,  -130 + cloudP * 130, cloudP);
      applyCloud(cloudLDeskRef.current, -130 + cloudP * 130, cloudP);
      applyCloud(cloudRMobRef.current,   130 - cloudP * 130, cloudP);
      applyCloud(cloudRDeskRef.current,  130 - cloudP * 130, cloudP);

      lerpRafRef.current = requestAnimationFrame(tick);
    };

    if (!lerpRafRef.current) {
      lerpRafRef.current = requestAnimationFrame(tick);
    }
  }, [drawFrame]);

  // ── ScrollTrigger ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;

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

        {/* Canvas — visible as soon as frame 0 is ready */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{
            opacity          : ready ? 1 : 0,
            transition       : "opacity 0.4s ease",
            imageRendering   : "crisp-edges", // extra sharpness hint to browser
          }}
        />

        {/* Fallback bg */}
        <div
          className="absolute inset-0"
          style={{ background: "#163f1f", zIndex: ready ? -1 : 0 }}
        />

        {/* Thin bottom loading bar — disappears as soon as frame 0 is drawn */}
        {!ready && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: "2px", zIndex: 60,
            background: "rgba(255,255,255,0.08)",
          }}>
            <div style={{
              height    : "100%",
              width     : `${loadPct}%`,
              background: "linear-gradient(90deg, #6aad3d, #a3c96e)",
              transition: "width 0.15s ease",
            }} />
          </div>
        )}

        {/* Bottom gradient */}
        <div
          className="absolute bottom-0 left-0 w-full pointer-events-none"
          style={{
            height: "38%", zIndex: 10,
            background: `linear-gradient(to top,
              rgba(22,63,31,0.95) 0%,
              rgba(28,82,40,0.72) 35%,
              rgba(28,82,40,0.28) 65%,
              transparent 100%)`,
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

        {/* Hero text */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 sm:px-6 select-none">
          <h1
            className="text-white"
            style={{
              fontSize  : "clamp(1.2rem, 3vw, 3rem)",
              fontFamily: "'Inter', sans-serif",
              textShadow: "0 2px 20px rgba(0,0,0,0.35)",
            }}
          >
            Own a Piece of Nature, Not Just Land.
          </h1>
          <p
            className="text-white/90 font-light leading-snug max-w-3xl"
            style={{
              fontSize    : "clamp(0.8rem, 1.3vw, 1.45rem)",
              fontFamily  : "'Inter', sans-serif",
              textShadow  : "0 1px 12px rgba(0,0,0,0.25)",
              marginBottom: "5rem",
            }}
          >
            Premium farmhouse plots near Mumbai designed for peaceful living,
            <br className="hidden sm:block" />
            investment, and future generations.
          </p>
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
  );
};

export default HomeBanner;