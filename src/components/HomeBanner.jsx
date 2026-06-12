import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import logo_img from "../assets/images/grow-farms-logo.png";
import cloude_1  from "../assets/images/cloude_1.png";
import logo      from "../assets/images/logo_1.png";
import video     from "../assets/video/video_scroll_seekable.mp4";

gsap.registerPlugin(ScrollTrigger);

// ── Scroll budget breakdown ──────────────────────────────────────────────────
// 700vh total:
//   0   → 300vh  (progress 0.00 → 0.43)  →  video scrubs
//   300 → 700vh  (progress 0.43 → 1.00)  →  clouds slide in over 4 full scrolls
//
// Why 700vh?
//   Video phase : 300vh  (3 viewport-height scroll steps, feels natural)
//   Cloud phase : 400vh  (4 viewport-height scroll steps, one per 25% of cloud)
// ─────────────────────────────────────────────────────────────────────────────
const PIN_HEIGHT = "700vh";

// Progress split points
const VIDEO_END  = 3 / 7;   // 300vh / 700vh ≈ 0.4286 — video finishes here
const CLOUD_START = VIDEO_END;
const CLOUD_RANGE = 1 - CLOUD_START; // 4/7 ≈ 0.5714 — cloud window

// Inline-style cloud update — avoids gsap.set() allocation on every frame
const applyCloudStyle = (el, xPercent, opacity) => {
  if (!el) return;
  el.style.transform = `translateX(${xPercent}%)`;
  el.style.opacity   = opacity;
};

const HomeBanner = () => {
  const [navOpen, setNavOpen] = useState(false);
  const [ready,   setReady]   = useState(false);

  const pinWrapRef  = useRef(null);
  const stickyRef   = useRef(null);
  const videoRef    = useRef(null);
  const triggerRef  = useRef(null);

  // RAF throttle refs — prevent flooding the browser with seek calls
  const rafPendingRef    = useRef(false);
  const pendingTargetRef = useRef(0);

  // Prevent setupTriggers() from running twice
  // (both loadedmetadata + canplaythrough can fire on iOS)
  const setupDoneRef = useRef(false);

  // Device detection
  const isIOS    = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isMobile = isIOS || /Android/i.test(navigator.userAgent);

  // Seek threshold — lower = more responsive scrubbing.
  // iOS needs a slightly larger gap to avoid decode queue stalls.
  const SEEK_THRESHOLD = isIOS ? 0.04 : isMobile ? 0.033 : 0.016;

  // Four cloud containers — mobile and desktop variants for left and right
  const cloudLMobRef  = useRef(null);
  const cloudLDeskRef = useRef(null);
  const cloudRMobRef  = useRef(null);
  const cloudRDeskRef = useRef(null);

  // ── Dynamic --vh fix ─────────────────────────────────────────────────────
  // On mobile, the browser URL bar shrinks/expands on scroll, making
  // 100vh unreliable. We compute the real viewport height once and on resize.
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVh();
    window.addEventListener("resize", setVh, { passive: true });
    return () => window.removeEventListener("resize", setVh);
  }, []);

  // ── RAF-throttled seek ──────────────────────────────────────────────────

  const seekVideo = (videoEl, target) => {
    pendingTargetRef.current = target;
    if (rafPendingRef.current) return; // already a frame queued, just update target
    rafPendingRef.current = true;

    requestAnimationFrame(() => {
      rafPendingRef.current = false;
      const delta = Math.abs(videoEl.currentTime - pendingTargetRef.current);
      if (delta > SEEK_THRESHOLD) {
        // fastSeek is less precise but much faster on Safari / Firefox
        if (typeof videoEl.fastSeek === "function") {
          videoEl.fastSeek(pendingTargetRef.current);
        } else {
          videoEl.currentTime = pendingTargetRef.current;
        }
      }
    });
  };

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    let destroyed = false;

    const setupTriggers = () => {
      if (destroyed) return;

      const dur = videoEl.duration;
      if (!dur || isNaN(dur)) return;

      videoEl.currentTime = 0;
      setReady(true);

      // ── Initial cloud state: hidden, fully off-screen ──
      [cloudLMobRef, cloudLDeskRef].forEach(({ current: el }) => {
        if (el) {
          el.style.transform  = "translateX(-130%)";
          el.style.opacity    = "0";
          el.style.willChange = "transform, opacity";
        }
      });
      [cloudRMobRef, cloudRDeskRef].forEach(({ current: el }) => {
        if (el) {
          el.style.transform  = "translateX(130%)";
          el.style.opacity    = "0";
          el.style.willChange = "transform, opacity";
        }
      });

      // Kill any existing trigger before creating a new one
      if (triggerRef.current) {
        triggerRef.current.kill();
        triggerRef.current = null;
      }

      triggerRef.current = ScrollTrigger.create({
        trigger      : pinWrapRef.current,
        start        : "top top",
        end          : "bottom bottom",
        pin          : stickyRef.current,
        anticipatePin: 1,
        pinSpacing   : false, // wrapper already has 700vh; don't add extra spacer

        onUpdate(self) {
          const p = self.progress; // 0.0 → 1.0 across 700vh

          // ── Video scrub: 0 → VIDEO_END (0→300vh) maps to full video ──
          // Clamp to dur - 0.1: safety margin so we never overshoot the
          // last real frame (browser duration can float slightly above actual).
          const videoP = Math.min(p / VIDEO_END, 1);
          const target = Math.min(Math.max(videoP * dur, 0), dur - 0.1);
          seekVideo(videoEl, target);

          // ── Clouds: CLOUD_START → 1.0 (300vh → 700vh = 4 full scrolls) ──
          // Linear — each viewport-height scroll moves clouds exactly 25%.
          // Scroll 1 → 25% in  |  Scroll 2 → 50% in
          // Scroll 3 → 75% in  |  Scroll 4 → fully in
          const rawCloud = Math.max((p - CLOUD_START) / CLOUD_RANGE, 0);
          const cloudP   = Math.min(rawCloud, 1); // linear, no easing

          applyCloudStyle(cloudLMobRef.current,  -130 + cloudP * 130, cloudP);
          applyCloudStyle(cloudLDeskRef.current, -130 + cloudP * 130, cloudP);
          applyCloudStyle(cloudRMobRef.current,   130 - cloudP * 130, cloudP);
          applyCloudStyle(cloudRDeskRef.current,  130 - cloudP * 130, cloudP);
        },
      });
    };

    // ── Video setup ─────────────────────────────────────────────────────────
    // Guard: both loadedmetadata and canplaythrough can fire on iOS Safari.
    // setupDoneRef ensures we only run setup once regardless of which fires.
    const trySetup = () => {
      if (destroyed || setupDoneRef.current) return;
      const dur = videoEl.duration;
      if (!dur || isNaN(dur)) return; // not ready yet, wait for next event
      setupDoneRef.current = true;

      videoEl
        .play()
        .then(() => {
          videoEl.pause();
          videoEl.currentTime = 0;
          setupTriggers();
        })
        .catch(() => {
          // Autoplay blocked (common on desktop) — still set up triggers
          setupTriggers();
        });
    };

    if (videoEl.readyState >= 1 && !isNaN(videoEl.duration)) {
      trySetup();
    } else {
      // loadedmetadata fires first and is enough on most browsers
      videoEl.addEventListener("loadedmetadata", trySetup, { once: true });
      // canplaythrough is the reliable fallback on iOS Safari
      videoEl.addEventListener("canplaythrough", trySetup, { once: true });
    }

    return () => {
      destroyed = true;
      rafPendingRef.current = false;
      videoEl.removeEventListener("loadedmetadata", trySetup);
      videoEl.removeEventListener("canplaythrough", trySetup);
      if (triggerRef.current) {
        triggerRef.current.kill();
        triggerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* ── 700vh scroll budget ── */}
      <div
        ref={pinWrapRef}
        className="overflow-visible"
        style={{ height: PIN_HEIGHT, position: "relative", zIndex: 30 }}
      >

        {/* ── Sticky viewport ──
            height uses --vh custom property so it matches the real
            visual viewport on mobile (not affected by URL bar resize).
            overflow:visible is explicit — GSAP pin can apply overflow:hidden
            which would clip clouds that start off-screen at ±130%.
        ── */}
        <div
          ref={stickyRef}
          className="relative w-full"
          style={{
            height  : "calc(var(--vh, 1vh) * 100)",
            overflow: "visible",
          }}
        >

          {/* ── Video ──
              - webkit-playsinline needed for older iOS versions
              - x-webkit-airplay="deny" prevents AirPlay popup on iOS
              - preload="auto" tells browser to buffer the whole file
              - touchAction: none stops iOS from treating video
                area as a scroll-capture zone
          ── */}
          <video
            ref={videoRef}
            src={video}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity    : ready ? 1 : 0,
              transition : "opacity 0.4s ease",
              willChange : "opacity",
              touchAction: "none",
            }}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            webkit-playsinline="true"
            x-webkit-airplay="deny"
          />

          {/* ── Fallback dark-green bg shown until video is ready ── */}
          <div
            className="absolute inset-0"
            style={{
              background: "#163f1f",
              zIndex    : ready ? -1 : 0,
            }}
          />

          {/* ── Bottom gradient overlay ── */}
          <div
            className="absolute bottom-0 left-0 w-full pointer-events-none"
            style={{
              height    : "38%",
              zIndex    : 10,
              background: `linear-gradient(
                to top,
                rgba(22, 63, 31, 0.95) 0%,
                rgba(28, 82, 40, 0.72) 35%,
                rgba(28, 82, 40, 0.28) 65%,
                transparent 100%
              )`,
            }}
          />

          {/* ── Logo ── */}
          <div className="absolute top-0 left-0 right-0 z-30 flex justify-center pt-8 md:pt-10 px-6">
            <img
              src={logo_img}
              alt="GrowFarms – Live with Nature"
              className="h-12 md:h-14 lg:h-16 w-auto object-contain"
            />
          </div>

          {/* ── Hero text ── */}
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

          {/* ── CLOUD ELEMENTS ── */}

          {/* Left — mobile */}
          <div
            ref={cloudLMobRef}
            className="absolute pointer-events-none md:hidden"
            style={{
              bottom   : "-5%",
              left     : "-10%",
              width    : "280px",
              zIndex   : 40,
              opacity  : 0,
              transform: "translateX(-130%)",
            }}
          >
            <img
              src={cloude_1}
              alt=""
              className="w-full h-auto object-contain"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>

          {/* Left — desktop */}
          <div
            ref={cloudLDeskRef}
            className="absolute pointer-events-none hidden md:block"
            style={{
              bottom   : "-28%",
              left     : "-40%",
              width    : "clamp(700px, 100vw, 1800px)",
              zIndex   : 40,
              opacity  : 0,
              transform: "translateX(-130%)",
            }}
          >
            <img
              src={cloude_1}
              alt=""
              className="w-full h-auto object-contain"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>

          {/* Right — mobile */}
          <div
            ref={cloudRMobRef}
            className="absolute pointer-events-none md:hidden"
            style={{
              bottom   : "-5%",
              right    : "-10%",
              width    : "280px",
              zIndex   : 40,
              opacity  : 0,
              transform: "translateX(130%)",
            }}
          >
            <img src={cloude_1} alt="" className="w-full h-auto object-contain" />
          </div>

          {/* Right — desktop */}
          <div
            ref={cloudRDeskRef}
            className="absolute pointer-events-none hidden md:block"
            style={{
              bottom   : "-28%",
              right    : "-40%",
              width    : "clamp(700px, 100vw, 1800px)",
              zIndex   : 40,
              opacity  : 0,
              transform: "translateX(130%)",
            }}
          >
            <img src={cloude_1} alt="" className="w-full h-auto object-contain" />
          </div>

        </div>{/* /sticky */}
      </div>{/* /pin-wrap */}
    </>
  );
};

export default HomeBanner;