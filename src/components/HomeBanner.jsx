import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import logo_img from "../assets/images/grow-farms-logo.png";
import cloude_1  from "../assets/images/cloude_1.png";
import logo      from "../assets/images/logo_1.png";
import video     from "../assets/video/video_scroll_seekable.mp4";

gsap.registerPlugin(ScrollTrigger);

/*
  SCROLL LAYOUT  (total = 400vh)
  ──────────────────────────────────────────────
   0vh → 300vh  video scrub   (75% of scroll)
  300vh → 400vh  clouds slide in from both sides
  ──────────────────────────────────────────────
  FIX 1: Mobile left cloud was `fixed` → changed to `absolute`
  FIX 2: Cleanup only kills this component's own ScrollTrigger
  FIX 3: Added loadedmetadata fallback for duration
  FIX 4: Abort flag to prevent setState on unmounted component
  FIX 5: Wider seek threshold on mobile to reduce jank
*/

const PIN_HEIGHT = "400vh";

const HomeBanner = () => {
  const [navOpen, setNavOpen] = useState(false);
  const [ready,   setReady]   = useState(false);

  const pinWrapRef      = useRef(null);
  const stickyRef       = useRef(null);
  const videoRef        = useRef(null);
  const triggerRef      = useRef(null);

  // Four cloud divs — each gets its own ref so GSAP can target individually
  const cloudLMobRef  = useRef(null);
  const cloudLDeskRef = useRef(null);
  const cloudRMobRef  = useRef(null);
  const cloudRDeskRef = useRef(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // FIX 4: abort flag so we don't setState after unmount
    let destroyed = false;

    // Ease-in-out-quad for smooth cloud animation
    const easeInOutQuad = (t) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    // FIX 5: wider seek threshold on mobile (avoids jank from too-frequent seeks)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const SEEK_THRESHOLD = isMobile ? 0.05 : 0.016;

    const setupTriggers = () => {
      if (destroyed) return;

      const dur = videoEl.duration;

      // FIX 3: if duration still not available here, bail cleanly
      if (!dur || isNaN(dur)) return;

      videoEl.currentTime = 0;
      if (!destroyed) setReady(true);

      // ── Initial cloud state: hidden off-screen ──────────
      [cloudLMobRef, cloudLDeskRef].forEach(({ current }) => {
        if (current) gsap.set(current, { xPercent: -130, opacity: 0 });
      });
      [cloudRMobRef, cloudRDeskRef].forEach(({ current }) => {
        if (current) gsap.set(current, { xPercent: 130, opacity: 0 });
      });

      // Kill only this component's trigger before recreating
      if (triggerRef.current) triggerRef.current.kill();

      triggerRef.current = ScrollTrigger.create({
        trigger      : pinWrapRef.current,
        start        : "top top",
        end          : "bottom bottom",
        pin          : stickyRef.current,
        anticipatePin: 1,

        // FIX 5: use pinSpacing instead of fighting overflow in onRefresh
        pinSpacing: true,

        onUpdate(self) {
          const p = self.progress; // 0 → 1

          // ── Video: maps progress 0→0.75 to full duration ──
          const videoP  = Math.min(p / 0.75, 1);
          const target  = Math.min(Math.max(videoP * dur, 0), dur - 0.05);
          if (Math.abs(videoEl.currentTime - target) > SEEK_THRESHOLD) {
            videoEl.currentTime = target;
          }

          // ── Clouds: progress 0.75→1.0 ─────────────────────
          const rawCloud = Math.max((p - 0.75) / 0.25, 0); // 0→1
          const cloudP   = easeInOutQuad(rawCloud);

          // Left clouds: xPercent -130 → 0
          [cloudLMobRef, cloudLDeskRef].forEach(({ current }) => {
            if (!current) return;
            gsap.set(current, {
              xPercent: -130 + cloudP * 130,
              opacity : cloudP,
            });
          });

          // Right clouds: xPercent 130 → 0
          [cloudRMobRef, cloudRDeskRef].forEach(({ current }) => {
            if (!current) return;
            gsap.set(current, {
              xPercent: 130 - cloudP * 130,
              opacity : cloudP,
            });
          });
        },
      });
    };

    // FIX 3: try both readyState and loadedmetadata for duration availability
    const trySetup = () => {
      const dur = videoEl.duration;
      if (dur && !isNaN(dur)) {
        setupTriggers();
      } else {
        videoEl.addEventListener("loadedmetadata", setupTriggers, { once: true });
      }
    };

    const onReady = () => {
      videoEl.play().then(() => {
        videoEl.pause();
        videoEl.currentTime = 0;
        trySetup();
      }).catch(() => {
        // Autoplay blocked (common on iOS without interaction)
        // Still set up triggers; seeking will work once user scrolls
        trySetup();
      });
    };

    if (videoEl.readyState >= 4) {
      onReady();
    } else {
      videoEl.addEventListener("canplaythrough", onReady, { once: true });
    }

    // FIX 2: only kill this component's own trigger, not ALL triggers
    return () => {
      destroyed = true;
      videoEl.removeEventListener("canplaythrough", onReady);
      videoEl.removeEventListener("loadedmetadata", setupTriggers);
      if (triggerRef.current) {
        triggerRef.current.kill();
        triggerRef.current = null;
      }
    };
  }, []);

  return (
    <>
      {/* ── 400vh scroll budget ── */}
      <div
        ref={pinWrapRef}
        className="overflow-visible"
        style={{ height: PIN_HEIGHT, position: "relative", zIndex: 30 }}
      >

        {/* ── Sticky viewport ── */}
        <div
          ref={stickyRef}
          className="relative w-full overflow-visible"
          style={{ height: "100vh" }}
        >
          {/* ── Video ── */}
          <video
            ref={videoRef}
            src={video}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity   : ready ? 1 : 0,
              transition: "opacity 0.4s ease",
              willChange: "opacity",
            }}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
          />

          {/* Fallback dark green bg until video loads */}
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

          {/* ── Hero text + nav ── */}
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

            {/* Nav + Explore */}
            <div className="flex flex-col items-center">
              <nav
                className={`flex items-center gap-1 rounded-full px-4 py-2
                  bg-white/85 backdrop-blur-md
                  shadow-[0_8px_32px_rgba(0,0,0,0.18)]
                  transition-all duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)]
                  ${navOpen
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 -translate-y-4 scale-95 pointer-events-none absolute"
                  }`}
              >
                {["Home", "About Us", "Blogs", "Testimonials", "Contact Us"].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="text-[#2a2a2a] font-medium rounded-full
                      hover:bg-black/7 transition-colors duration-200 whitespace-nowrap
                      text-[0.72rem] px-2 py-1
                      md:text-[0.88rem] md:px-3 md:py-1.5"
                  >
                    {item}
                  </a>
                ))}
              </nav>

              <div className="mt-6">
                {navOpen ? (
                  <button
                    onClick={() => setNavOpen(false)}
                    aria-label="Close menu"
                    className="w-[44px] h-[44px] rounded-full
                      border border-white/30 bg-white/15 backdrop-blur-md
                      flex items-center justify-center
                      cursor-pointer hover:bg-white/25 hover:rotate-90
                      transition-all duration-200"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="2.2" strokeLinecap="round">
                      <line x1="5" y1="5" x2="19" y2="19" />
                      <line x1="19" y1="5" x2="5" y2="19" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => setNavOpen(true)}
                    aria-label="Open navigation"
                    className="flex flex-col items-center cursor-pointer border-none bg-transparent"
                  >
                    <div className="relative flex items-center justify-center">
                      <span
                        className="absolute w-[64px] h-[64px] rounded-full border-2 border-white/50 animate-ping"
                        style={{ animationDuration: "2.4s" }}
                      />
                      <div
                        className="w-[50px] h-[50px] rounded-full flex items-center justify-center
                          transition-transform duration-[280ms] hover:scale-105"
                        style={{
                          background    : "rgba(255,255,255,0.22)",
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-full bg-white flex items-center justify-center"
                          style={{ boxShadow: "inset 0 2px 8px rgba(0,0,0,0.1)" }}
                        >
                          <img src={logo} alt="logo" className="w-5 h-5 object-contain" />
                        </div>
                      </div>
                    </div>
                    <span
                      className="mt-3 text-white tracking-[0.14em]"
                      style={{
                        fontSize  : "1rem",
                        fontWeight: "400",
                        textShadow: "0 2px 12px rgba(0,0,0,0.3)",
                        userSelect: "none",
                      }}
                    >
                      Explore
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Left — mobile  ✅ FIX: was `fixed`, now `absolute` */}
          <div
            ref={cloudLMobRef}
            className="absolute pointer-events-none md:hidden"
            style={{ bottom: "-5%", left: "-10%", width: "280px", zIndex: 40 }}
          >
            <img src={cloude_1} alt="" className="w-full h-auto object-contain"
              style={{ transform: "scaleX(-1)" }} />
          </div>

          {/* Left — desktop */}
          <div
            ref={cloudLDeskRef}
            className="absolute pointer-events-none hidden md:block"
            style={{ bottom: "-28%", left: "-40%", width: "clamp(700px, 100vw, 1800px)", zIndex: 40 }}
          >
            <img src={cloude_1} alt="" className="w-full h-auto object-contain"
              style={{ transform: "scaleX(-1)" }} />
          </div>

          {/* Right — mobile */}
          <div
            ref={cloudRMobRef}
            className="absolute pointer-events-none md:hidden"
            style={{ bottom: "-5%", right: "-10%", width: "280px", zIndex: 40 }}
          >
            <img src={cloude_1} alt="" className="w-full h-auto object-contain" />
          </div>

          {/* Right — desktop */}
          <div
            ref={cloudRDeskRef}
            className="absolute pointer-events-none hidden md:block"
            style={{ bottom: "-28%", right: "-40%", width: "clamp(700px,100vw,1800px)", zIndex: 40 }}
          >
            <img src={cloude_1} alt="" className="w-full h-auto object-contain" />
          </div>

        </div>{/* /sticky */}
      </div>{/* /pin-wrap */}
    </>
  );
};

export default HomeBanner;