// import React, { useEffect, useRef, useState, useCallback } from "react";
// import { gsap } from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";

// import logo_img from "../assets/images/grow-farms-logo.png";

// gsap.registerPlugin(ScrollTrigger);

// // FIX: Tell GSAP to ignore resize events caused by mobile browser toolbar
// // show/hide (the address bar collapsing/expanding on scroll). Without this,
// // every toolbar toggle fires a "resize" that can trigger pin recalculation
// // mid-scroll, which is what produced the gap between this section and the
// // next one when scrolling UP on mobile (toolbar re-appearing = resize event).
// ScrollTrigger.config({ ignoreMobileResize: true });

// // ─── constants ────────────────────────────────────────────────────────────────
// const BG_COLOR = "#163f1f";

// // Detect mobile ONCE at module load — won't change mid-session
// const IS_MOBILE = window.innerWidth < 768;

// const getPinHeight = () => (window.innerWidth < 768 ? "400vh" : "600vh");

// const TOTAL_SCROLLS = 5;
// const VIDEO_END     = 3 / TOTAL_SCROLLS; // 0.0 → 0.6

// // ─── Text stages ──────────────────────────────────────────────────────────────
// const TEXT_STAGES = [
//   {
//     heading: "Own a Piece of\nNature, Not Just Land.",
//     sub: "Premium farmhouse plots designed for peaceful living, smart investment, and future generations.",
//   },
//   {
//     heading: "Where Serenity Meets\nSmart Investment.",
//     sub: "Curated land that appreciates over time while giving you a sanctuary away from city chaos.",
//   },
//   {
//     heading: "Build Memories That\nOutlast Generations.",
//     sub: "Lush greenery, clean air, and space to breathe — right at your doorstep, near Mumbai.",
//   },
// ];

// const SEGMENT    = 1 / TOTAL_SCROLLS;
// const ENTER_FRAC = 0.28;
// const EXIT_FRAC  = 0.72;

// // ─── Frame config ─────────────────────────────────────────────────────────────
// // Mobile frames: portrait optimised  → public/frames-mobile/%d.webp
// //   Generate with:
// //   ffmpeg -i "src/assets/farm_video.mp4" -vf "fps=24,scale=-2:1080" \
// //          -vcodec libwebp -compression_level 4 -qscale:v 80 -an \
// //          public/frames-mobile/%d.webp
// //
// // Desktop frames: landscape          → public/frames/%d.webp
// //   Generate with:
// //   ffmpeg -i "src/assets/farm_video.mp4" -vf "fps=24,scale=1920:-2" \
// //          -vcodec libwebp -compression_level 4 -qscale:v 90 -an \
// //          public/frames/%d.webp
// // ─────────────────────────────────────────────────────────────────────────────
// const FRAME_COUNT  = 114;
// const FRAME_PREFIX = IS_MOBILE ? "/frames-mobile/" : "/frames/";
// const FRAME_EXT    = "webp";
// const FRAME_PAD    = 1;
// const BATCH_SIZE   = 20;

// // DPR cap: mobile → 1.5x  (portrait frames are already 1080px tall, plenty)
// //          desktop → 2x
// const DPR_CAP = IS_MOBILE ? 1.5 : 2;

// const pad      = (n, w) => (w > 1 ? String(n).padStart(w, "0") : String(n));
// const clamp    = (v)    => Math.max(0, Math.min(1, v));
// const easeOut3 = (t)    => 1 - Math.pow(1 - t, 3);
// const easeIn3  = (t)    => Math.pow(t, 3);

// // ══════════════════════════════════════════════════════════════════════════════
// const HomeBanner = () => {
//   const [ready,     setReady]     = useState(false);
//   const [loadPct,   setLoadPct]   = useState(0);
//   const [pinHeight, setPinHeight] = useState(getPinHeight());
//   const [activeIdx, setActiveIdx] = useState(0);

//   const pinWrapRef   = useRef(null);
//   const stickyRef    = useRef(null);
//   const canvasRef    = useRef(null);
//   const triggerRef   = useRef(null);
//   const framesRef    = useRef([]);
//   const lastFrameRef = useRef(-1);
//   const progressRef  = useRef(0);
//   const lerpRef      = useRef(0);
//   const lerpRafRef   = useRef(null);

//   const textStageRefs = useRef(
//     TEXT_STAGES.map(() => ({ wrap: null, eyebrow: null, h1: null, p: null }))
//   );

//   // ── vh fix ──────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const set = () => {
//       document.documentElement.style.setProperty(
//         "--vh",
//         `${window.innerHeight * 0.01}px`
//       );
//       setPinHeight(getPinHeight());
//     };
//     set();
//     window.addEventListener("resize", set, { passive: true });
//     return () => window.removeEventListener("resize", set);
//   }, []);

//   // ── Force pin-spacer background ──────────────────────────────────────────────
//   useEffect(() => {
//     const interval = setInterval(() => {
//       document.querySelectorAll(".gsap-pin-spacer").forEach((el) => {
//         el.style.backgroundColor = BG_COLOR;
//       });
//     }, 100);
//     setTimeout(() => clearInterval(interval), 3000);
//     return () => clearInterval(interval);
//   }, []);

//   // ── drawFrame ────────────────────────────────────────────────────────────────
//   const drawFrame = useCallback((index) => {
//     const idx    = Math.max(0, Math.min(index, FRAME_COUNT - 1));
//     const bitmap = framesRef.current[idx];
//     const canvas = canvasRef.current;
//     if (!bitmap || !canvas) return;
//     if (idx === lastFrameRef.current) return;
//     lastFrameRef.current = idx;

//     const ctx = canvas.getContext("2d", { alpha: false });
//     const { width: cw, height: ch } = canvas;
//     ctx.imageSmoothingEnabled = true;
//     ctx.imageSmoothingQuality = "high";

//     const bw = bitmap.width, bh = bitmap.height;

//     // object-fit: cover behaviour
//     const scale = Math.max(cw / bw, ch / bh);
//     const dw    = Math.ceil(bw * scale);
//     const dh    = Math.ceil(bh * scale);
//     const dx    = Math.round((cw - dw) / 2);
//     const dy    = Math.round((ch - dh) / 2);

//     ctx.fillStyle = BG_COLOR;
//     ctx.fillRect(0, 0, cw, ch);
//     ctx.drawImage(bitmap, dx, dy, dw, dh);
//   }, []);

//   // ── Resize canvas ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const resize = () => {
//       const sticky = stickyRef.current;

//       // Use stickyRef dimensions — stable against Android toolbar dvh changes
//       const w = (sticky?.clientWidth  > 0 ? sticky.clientWidth  : window.innerWidth);
//       const h = (sticky?.clientHeight > 0 ? sticky.clientHeight : window.innerHeight);

//       // Internal pixel buffer (retina-aware, capped per device type)
//       canvas.width  = Math.round(w * DPR_CAP);
//       canvas.height = Math.round(h * DPR_CAP);

//       // Explicit CSS px — prevents "100%" mismatch when dvh fluctuates
//       canvas.style.width  = `${w}px`;
//       canvas.style.height = `${h}px`;

//       lastFrameRef.current = -1;

//       if (framesRef.current.length) {
//         const vidP = Math.min(progressRef.current / VIDEO_END, 1);
//         drawFrame(Math.round(vidP * (FRAME_COUNT - 1)));
//       }
//     };

//     resize();
//     const ro = new ResizeObserver(resize);
//     ro.observe(canvas);
//     if (stickyRef.current) ro.observe(stickyRef.current);
//     return () => ro.disconnect();
//   }, [drawFrame]);

//   // ── Preload frames ───────────────────────────────────────────────────────────
//   useEffect(() => {
//     let cancelled = false;
//     const load = async () => {
//       const urls = Array.from({ length: FRAME_COUNT }, (_, i) =>
//         `${FRAME_PREFIX}${pad(i + 1, FRAME_PAD)}.${FRAME_EXT}`
//       );
//       const bitmaps  = new Array(FRAME_COUNT);
//       let loaded     = 0;
//       let firstDrawn = false;

//       for (let i = 0; i < urls.length; i += BATCH_SIZE) {
//         if (cancelled) return;
//         const slice = urls.slice(i, i + BATCH_SIZE);
//         await Promise.all(
//           slice.map(async (url, j) => {
//             try {
//               const res  = await fetch(url);
//               const blob = await res.blob();
//               bitmaps[i + j] = await createImageBitmap(blob, {
//                 colorSpaceConversion: "none",
//                 premultiplyAlpha    : "none",
//               });
//             } catch (e) {
//               console.warn("Frame load failed:", url, e);
//             }
//             loaded++;
//             setLoadPct(Math.round((loaded / FRAME_COUNT) * 100));
//             if (!firstDrawn && bitmaps[0]) {
//               firstDrawn        = true;
//               framesRef.current = bitmaps;
//               drawFrame(0);
//               setReady(true);
//             }
//           })
//         );
//       }
//       if (cancelled) return;
//       framesRef.current = bitmaps;
//       setReady(true);
//     };
//     load().catch(console.error);
//     return () => { cancelled = true; };
//   }, [drawFrame]);

//   // ── applyTextStages ──────────────────────────────────────────────────────────
//   const applyTextStages = useCallback((p) => {
//     let currentActive = 0;

//     TEXT_STAGES.forEach((_, i) => {
//       const refs   = textStageRefs.current[i];
//       if (!refs.wrap) return;

//       const isFirst = i === 0;
//       const isLast  = i === TEXT_STAGES.length - 1;
//       const start   = i * SEGMENT;
//       const local   = (p - start) / SEGMENT;

//       let opacity = 0, yH1 = 32, yEye = 20, yP = 44;

//       if (p < start) {
//         opacity = 0; yH1 = 32; yEye = 20; yP = 44;
//       } else if (isFirst && p < SEGMENT * ENTER_FRAC) {
//         const t = easeOut3(p / (SEGMENT * ENTER_FRAC));
//         opacity = t;
//         yH1     = 32 * (1 - t);
//         yEye    = 20 * (1 - t);
//         yP      = 44 * (1 - t);
//         currentActive = 0;
//       } else if (local <= ENTER_FRAC && !isFirst) {
//         const t = easeOut3(local / ENTER_FRAC);
//         opacity = t;
//         yH1     = 32 * (1 - t);
//         yEye    = 20 * (1 - t);
//         yP      = 44 * (1 - t);
//       } else if (isLast) {
//         opacity = 1; yH1 = 0; yEye = 0; yP = 0;
//         currentActive = i;
//       } else if (local <= EXIT_FRAC) {
//         opacity = 1; yH1 = 0; yEye = 0; yP = 0;
//         currentActive = i;
//       } else {
//         const exitT = easeIn3(clamp((local - EXIT_FRAC) / (1 - EXIT_FRAC)));
//         opacity = 1 - exitT;
//         yH1     = -22 * exitT;
//         yEye    = -14 * exitT;
//         yP      = -14 * exitT;
//       }

//       refs.wrap.style.opacity = opacity;
//       if (refs.eyebrow) refs.eyebrow.style.transform = `translateY(${yEye}px)`;
//       if (refs.h1)      refs.h1.style.transform      = `translateY(${yH1}px)`;
//       if (refs.p)       refs.p.style.transform       = `translateY(${yP}px)`;
//     });

//     setActiveIdx(currentActive);
//   }, []);

//   // ── Lerp loop ────────────────────────────────────────────────────────────────
//   const startLerp = useCallback(() => {
//     const tick = () => {
//       const target = progressRef.current;
//       const diff   = target - lerpRef.current;

//       if (Math.abs(diff) < 0.5 / FRAME_COUNT) {
//         lerpRef.current    = target;
//         lerpRafRef.current = null;
//         const p      = target;
//         const videoP = Math.min(p / VIDEO_END, 1);
//         drawFrame(Math.round(videoP * (FRAME_COUNT - 1)));
//         applyTextStages(p);
//         return;
//       }

//       const ease = Math.abs(diff) > 0.2 ? 0.12 : 0.08;
//       lerpRef.current += diff * ease;
//       const p = lerpRef.current;

//       const videoP = Math.min(p / VIDEO_END, 1);
//       drawFrame(Math.round(videoP * (FRAME_COUNT - 1)));
//       applyTextStages(p);

//       lerpRafRef.current = requestAnimationFrame(tick);
//     };
//     if (!lerpRafRef.current)
//       lerpRafRef.current = requestAnimationFrame(tick);
//   }, [drawFrame, applyTextStages]);

//   // ── ScrollTrigger ────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!ready) return;

//     textStageRefs.current.forEach((refs, i) => {
//       if (!refs.wrap) return;
//       refs.wrap.style.willChange = "opacity";
//       const visible = i === 0;
//       refs.wrap.style.opacity    = visible ? "1" : "0";
//       const eyeY = visible ? "0px" : "20px";
//       const h1Y  = visible ? "0px" : "32px";
//       const pY   = visible ? "0px" : "44px";
//       if (refs.eyebrow) {
//         refs.eyebrow.style.transform  = `translateY(${eyeY})`;
//         refs.eyebrow.style.willChange = "transform";
//       }
//       if (refs.h1) {
//         refs.h1.style.transform  = `translateY(${h1Y})`;
//         refs.h1.style.willChange = "transform";
//       }
//       if (refs.p) {
//         refs.p.style.transform  = `translateY(${pY})`;
//         refs.p.style.willChange = "transform";
//       }
//     });

//     if (triggerRef.current) {
//       triggerRef.current.kill();
//       triggerRef.current = null;
//     }

//     triggerRef.current = ScrollTrigger.create({
//       trigger            : pinWrapRef.current,
//       start              : "top top",
//       end                : "bottom bottom",
//       pin                : stickyRef.current,
//       pinSpacing         : true,
//       anticipatePin      : 1,
//       invalidateOnRefresh: true,
//       fastScrollEnd      : true,
//       onUpdate(self) {
//         progressRef.current = gsap.utils.clamp(0, 1, self.progress);
//         startLerp();
//       },
//     });

//     // Force pin-spacer background after GSAP creates it
//     setTimeout(() => {
//       document.querySelectorAll(".gsap-pin-spacer").forEach((el) => {
//         el.style.backgroundColor = BG_COLOR;
//       });
//     }, 50);

//     ScrollTrigger.refresh();

//     return () => {
//       if (triggerRef.current) {
//         triggerRef.current.kill();
//         triggerRef.current = null;
//       }
//       if (lerpRafRef.current) cancelAnimationFrame(lerpRafRef.current);
//     };
//   }, [ready, startLerp]);

//   // ── Refresh on resize / orientation ─────────────────────────────────────────
//   // FIX: Only refresh ScrollTrigger when the viewport WIDTH actually changes
//   // (real resize / orientation change). Mobile browsers fire plain "resize"
//   // events when the address bar shows/hides during scroll — that only changes
//   // HEIGHT. Refreshing on those mid-scroll recalculates pin start/end against
//   // a transitional viewport size, which is what caused the visible gap
//   // between this section and AerialMapSection when scrolling UP on mobile.
//   useEffect(() => {
//     let lastWidth = window.innerWidth;

//     const refresh = () => {
//       if (window.innerWidth !== lastWidth) {
//         lastWidth = window.innerWidth;
//         ScrollTrigger.refresh(true);
//       }
//     };

//     window.addEventListener("resize", refresh);
//     window.addEventListener("orientationchange", refresh);
//     return () => {
//       window.removeEventListener("resize", refresh);
//       window.removeEventListener("orientationchange", refresh);
//     };
//   }, []);

//   useEffect(() => {
//     if (triggerRef.current) ScrollTrigger.refresh();
//   }, [pinHeight]);

//   // ── JSX ─────────────────────────────────────────────────────────────────────
//   return (
//     <>
//       <style>{`
//         .hb-heading {
//           font-size: clamp(2rem, 5vw, 3.25rem);
//           font-weight: 300;
//           width: 100%;
//           max-width: 18ch;
//           line-height: 1.08;
//           letter-spacing: -0.02em;
//           color: #ffffff;
//           white-space: pre-line;
//           text-shadow: 0 4px 32px rgba(0,0,0,0.4);
//           margin: 0 auto 1.25rem;
//         }
//         .hb-eyebrow {
//           font-size: clamp(0.6rem, 1vw, 0.75rem);
//           font-weight: 500;
//           letter-spacing: 0.2em;
//           text-transform: uppercase;
//           color: rgba(163, 201, 110, 0.85);
//           margin: 0 auto 1rem;
//           display: block;
//           width: 100%;
//           max-width: 18ch;
//           text-shadow: 0 1px 8px rgba(0,0,0,0.3);
//         }
//         .hb-sub {
//           font-size: clamp(0.78rem, 1.2vw, 1rem);
//           font-weight: 300;
//           line-height: 1.7;
//           color: rgba(255, 255, 255, 0.68);
//           width: 100%;
//           max-width: 32ch;
//           margin: 0 auto;
//           text-shadow: 0 1px 12px rgba(0,0,0,0.3);
//         }
//         .gsap-pin-spacer {
//           background-color: #163f1f !important;
//         }

//         /* Loading bar */
//         .hb-loader {
//           position: absolute;
//           inset: 0;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           justify-content: center;
//           z-index: 50;
//           background: ${BG_COLOR};
//           gap: 16px;
//           transition: opacity 0.4s ease;
//         }
//         .hb-loader-bar-wrap {
//           width: min(240px, 60vw);
//           height: 2px;
//           background: rgba(255,255,255,0.12);
//           border-radius: 2px;
//           overflow: hidden;
//         }
//         .hb-loader-bar {
//           height: 100%;
//           background: rgba(163, 201, 110, 0.85);
//           border-radius: 2px;
//           transition: width 0.2s ease;
//         }
//         .hb-loader-pct {
//           font-size: 0.7rem;
//           letter-spacing: 0.15em;
//           color: rgba(255,255,255,0.4);
//           font-weight: 400;
//         }
//       `}</style>

//       <div
//         ref={pinWrapRef}
//         className="overflow-hidden"
//         style={{
//           height         : pinHeight,
//           position       : "relative",
//           zIndex         : 30,
//           backgroundColor: BG_COLOR,
//         }}
//       >
//         <div
//           ref={stickyRef}
//           className="relative w-full"
//           style={{
//             // FIX: was "100dvh". dvh live-resizes as the mobile toolbar
//             // shows/hides, which desynced this element's actual rendered
//             // height from the 400vh/600vh scroll distance GSAP pinned it
//             // against — producing the gap on scroll-up. svh ("small"
//             // viewport height) assumes the toolbar is always visible and
//             // never changes mid-scroll, so the pin math stays consistent.
//             height         : "100svh",
//             overflow       : "hidden",
//             backgroundColor: BG_COLOR,
//             position       : "relative",
//           }}
//         >
//           {/* Canvas — size set explicitly via JS, not 100% */}
//           <canvas
//             ref={canvasRef}
//             style={{
//               position      : "absolute",
//               inset         : 0,
//               opacity       : ready ? 1 : 0,
//               transition    : "opacity 0.4s ease",
//               imageRendering: "crisp-edges",
//               display       : "block",
//               backgroundColor: BG_COLOR,
//               // width & height set explicitly by resize() in JS
//             }}
//           />

//           {/* Loading screen — shown until ready */}
//           {!ready && (
//             <div className="hb-loader">
//               <div className="hb-loader-bar-wrap">
//                 <div
//                   className="hb-loader-bar"
//                   style={{ width: `${loadPct}%` }}
//                 />
//               </div>
//               <span className="hb-loader-pct">{loadPct}%</span>
//             </div>
//           )}

//           {/* Top vignette */}
//           <div
//             className="absolute top-0 left-0 w-full pointer-events-none"
//             style={{
//               height    : "22%",
//               zIndex    : 10,
//               background: `linear-gradient(to bottom, rgba(14,42,20,0.5) 0%, transparent 100%)`,
//             }}
//           />

//           {/* Logo */}
//           <div className="absolute top-0 left-0 right-0 z-30 flex justify-center pt-8 md:pt-10 px-6">
//             <img
//               src={logo_img}
//               alt="GrowFarms – Live with Nature"
//               className="h-12 md:h-14 lg:h-16 w-auto object-contain"
//             />
//           </div>

//           {/* Text stages */}
//           <div
//             className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
//             style={{ paddingBottom: "8vh" }}
//           >
//             <div className="relative w-full text-center px-6">
//               {TEXT_STAGES.map((stage, i) => (
//                 <div
//                   key={i}
//                   ref={(el) => { if (el) textStageRefs.current[i].wrap = el; }}
//                   style={{
//                     position    : i === 0 ? "relative" : "absolute",
//                     top         : i === 0 ? "auto"     : 0,
//                     left        : 0,
//                     right       : 0,
//                     opacity     : i === 0 ? 1          : 0,
//                     pointerEvents: "none",
//                   }}
//                 >
//                   <span
//                     ref={(el) => { if (el) textStageRefs.current[i].eyebrow = el; }}
//                     className="hb-eyebrow"
//                   >
//                     Grow Farms
//                   </span>
//                   <h1
//                     ref={(el) => { if (el) textStageRefs.current[i].h1 = el; }}
//                     className="hb-heading"
//                   >
//                     {stage.heading}
//                   </h1>
//                   <p
//                     ref={(el) => { if (el) textStageRefs.current[i].p = el; }}
//                     className="hb-sub"
//                   >
//                     {stage.sub}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Bottom gradient — blends into AerialMapSection */}
//           <div
//             className="absolute bottom-0 left-0 w-full pointer-events-none"
//             style={{
//               height   : "clamp(80px, 35%, 220px)",
//               background: `linear-gradient(180deg,
//                 rgba(22,63,31,0)   0%,
//                 rgba(22,63,31,0.4) 40%,
//                 rgba(22,63,31,0.8) 70%,
//                 ${BG_COLOR}        100%)`,
//               zIndex: 20,
//             }}
//           />
//         </div>
//       </div>
//     </>
//   );
// };

// export default HomeBanner;

import React, { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import logo_img from "../assets/images/grow-farms-logo.png";

gsap.registerPlugin(ScrollTrigger);

// ─── constants ────────────────────────────────────────────────────────────────
const BG_COLOR = "#163f1f";

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

// ─── Module-level frame cache ─────────────────────────────────────────────────
// Component के बाहर है — React Router navigation के बाद भी persist करता है।
// दूसरी बार Home आने पर 114 frames फिर से fetch नहीं होते।
let FRAME_CACHE = null;

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

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(bitmap, dx, dy, dw, dh);
  }, []);

  // ── Resize canvas ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const pr     = Math.min(window.devicePixelRatio || 1, 2);
      const sticky = stickyRef.current;

      const w = sticky ? sticky.clientWidth  : window.innerWidth;
      const h = sticky ? sticky.clientHeight : window.innerHeight;

      canvas.width  = Math.round(w * pr);
      canvas.height = Math.round(h * pr);

      // ── FIX: resize के बाद lastFrameRef reset करो
      // ताकि drawFrame same index को skip न करे
      lastFrameRef.current = -1;

      if (framesRef.current.length) {
        const vidP = Math.min(progressRef.current / VIDEO_END, 1);
        drawFrame(Math.round(vidP * (FRAME_COUNT - 1)));
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    if (stickyRef.current) ro.observe(stickyRef.current);
    return () => ro.disconnect();
  }, [drawFrame]);

  // ── Preload frames ───────────────────────────────────────────────────────────
  useEffect(() => {
    // ── FIX: Cache hit — दूसरी बार Home आने पर instant ready
    if (FRAME_CACHE) {
      framesRef.current = FRAME_CACHE;
      drawFrame(0);
      setReady(true);
      setLoadPct(100);
      return;
    }

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

      // ── FIX: Load complete होने पर module cache में save करो
      FRAME_CACHE        = bitmaps;
      framesRef.current  = bitmaps;
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

    // ── FIX: Mount होने पर ScrollTrigger refresh — route change के बाद
    // pinWrapRef का layout recalculate होना जरूरी है
    ScrollTrigger.refresh();

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

    // ── FIX: पुराना trigger kill करो (safety — अगर effect twice चले)
    if (triggerRef.current) {
      triggerRef.current.kill();
      triggerRef.current = null;
    }

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
      // ── FIX: Unmount पर सिर्फ अपना trigger kill करो
      // ScrollTrigger.getAll().kill() मत करो — दूसरे sections के
      // triggers (AerialMap, Testimonial, etc.) भी मर जाएंगे
      if (triggerRef.current) {
        triggerRef.current.kill();
        triggerRef.current = null;
      }

      // ── FIX: RAF cancel करो — stale tick loop memory leak से बचाओ
      if (lerpRafRef.current) {
        cancelAnimationFrame(lerpRafRef.current);
        lerpRafRef.current = null;
      }

      // ── FIX: सभी refs को reset करो
      // अगर ये reset नहीं हुए तो remount पर drawFrame और
      // applyTextStages को लगेगा "कुछ बदला नहीं" और skip हो जाएगा
      lastFrameRef.current = -1;
      progressRef.current  = 0;
      lerpRef.current      = 0;
    };
  }, [ready, startLerp]);

  // ── Refresh on resize / orientation ─────────────────────────────────────────
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
          text-align: center;
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
          text-align: center;
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
          text-align: center;
        }
      `}</style>

      <div
        ref={pinWrapRef}
        className="overflow-hidden"
        style={{
          height         : pinHeight,
          position       : "relative",
          zIndex         : 30,
          backgroundColor: BG_COLOR,
        }}
      >
        <div
          ref={stickyRef}
          className="relative w-full"
          style={{
            height         : "100dvh",
            overflow       : "hidden",
            backgroundColor: BG_COLOR,
          }}
        >
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            style={{
              position       : "absolute",
              inset          : 0,
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

          {/* Text stages */}
          <div
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
            style={{ paddingBottom: "clamp(5rem, 10vh, 8rem)" }}
          >
            <div className="relative w-full" style={{ maxWidth: "700px" }}>
              {TEXT_STAGES.map((stage, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    if (textStageRefs.current[i])
                      textStageRefs.current[i].wrap = el;
                  }}
                  style={{
                    position  : i === 0 ? "relative" : "absolute",
                    inset     : i === 0 ? "auto" : "0",
                    textAlign : "center",
                    opacity   : i === 0 ? 1 : 0,
                    willChange: "opacity",
                    padding   : "0 1.5rem",
                  }}
                >
                  <h1
                    ref={(el) => {
                      if (textStageRefs.current[i])
                        textStageRefs.current[i].h1 = el;
                    }}
                    className="hb-heading"
                    style={{
                      willChange: "transform",
                      transform : i === 0 ? "translateY(0px)" : "translateY(32px)",
                    }}
                  >
                    {stage.heading}
                  </h1>
                  <p
                    ref={(el) => {
                      if (textStageRefs.current[i])
                        textStageRefs.current[i].p = el;
                    }}
                    className="hb-sub"
                    style={{
                      willChange: "transform",
                      transform : i === 0 ? "translateY(0px)" : "translateY(44px)",
                    }}
                  >
                    {stage.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom gradient */}
          <div
            className="absolute bottom-0 left-0 w-full pointer-events-none"
            style={{
              height : "clamp(80px, 35%, 220px)",
              background: `linear-gradient(180deg,
                rgba(22,63,31,0)   0%,
                rgba(22,63,31,0.4) 40%,
                rgba(22,63,31,0.8) 70%,
                ${BG_COLOR}        100%)`,
              zIndex: 20,
            }}
          />

          {/* Loading overlay */}
          {!ready && (
            <div
              className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4"
              style={{ backgroundColor: BG_COLOR }}
            >
              <div
                style={{
                  width       : "clamp(140px, 30vw, 200px)",
                  height      : "2px",
                  background  : "rgba(255,255,255,0.12)",
                  borderRadius: "2px",
                  overflow    : "hidden",
                }}
              >
                <div
                  style={{
                    height     : "100%",
                    width      : `${loadPct}%`,
                    background : "rgba(163, 201, 110, 0.85)",
                    borderRadius: "2px",
                    transition : "width 0.2s ease",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize  : "clamp(0.6rem, 1vw, 0.7rem)",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  color     : "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                }}
              >
                {loadPct}%
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HomeBanner;