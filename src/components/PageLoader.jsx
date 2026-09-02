import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import logo from "/logo_1.png";

// ─────────────────────────────────────────────────────────────
// Split-panel page loader.
//
// The intro draws a ring around the mark while a counter tracks
// real asset progress; the exit un-draws the ring, wipes the
// accent lines vertically, then splits the two panels apart to
// reveal the page underneath.
//
// Props:
//   loading     : boolean — show/hide the loader
//   onReveal    : fn      — fired as the panels start splitting.
//                           The page must be visible by then, since
//                           it is what the split reveals.
//   onDone      : fn      — fired once the loader has fully left.
//   minDuration : ms      — floor, so the intro is always seen (default 2000)
//   maxDuration : ms      — ceiling, in case an asset never resolves (default 7000)
// ─────────────────────────────────────────────────────────────

const PANEL_BG = "#163f1f"; // matches HomeBanner/AerialMapSection, so the seam is invisible
const ACCENT = "#a3c96e";

const PageLoader = ({
  loading = true,
  onReveal,
  onDone,
  minDuration = 2000,
  maxDuration = 7000,
}) => {
  const [gone, setGone] = useState(false);

  const rootRef = useRef(null);
  const circleRef = useRef(null);
  const counterRef = useRef(null);

  // Keep the callbacks in a ref so the timeline effect never re-runs on an
  // inline-arrow prop identity change (which would restart the loader).
  const cbRef = useRef({ onReveal, onDone });
  useEffect(() => {
    cbRef.current = { onReveal, onDone };
  });

  useLayoutEffect(() => {
    if (!loading) return;

    const root = rootRef.current;
    const circle = circleRef.current;
    const counterEl = counterRef.current;
    let ticker = null;

    const ctx = gsap.context(() => {
      const len = circle.getTotalLength();
      gsap.set(circle, { strokeDasharray: len, strokeDashoffset: len });

      // ── Intro ──────────────────────────────────────────────────────────
      gsap
        .timeline()
        .fromTo(
          root.querySelectorAll("[data-fade]"),
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.09 },
        )
        .to(circle, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" }, 0.1);

      // ── Progress ───────────────────────────────────────────────────────
      // `target` is the real figure (share of images decoded); `shown`
      // chases it so the number always moves smoothly instead of jumping.
      const startedAt = performance.now();
      const state = { shown: 0 };
      let target = 0;
      let pageLoaded = document.readyState === "complete";

      const onWindowLoad = () => (pageLoaded = true);
      window.addEventListener("load", onWindowLoad);

      let exited = false;
      const runExit = () => {
        if (exited) return;
        exited = true;
        gsap.ticker.remove(ticker);
        buildExit();
      };

      ticker = () => {
        const images = Array.from(document.images);
        const decoded = images.filter((img) => img.complete).length;
        const assetPct = images.length ? decoded / images.length : 1;
        const elapsed = performance.now() - startedAt;

        // Pace against both real asset progress and elapsed time, and take
        // whichever is further behind — so a warm cache still gets a readable
        // ramp instead of snapping to 96 in three frames.
        const timePct = Math.min(1, elapsed / minDuration);
        const ready = pageLoaded && elapsed >= minDuration;

        let next = ready ? 100 : Math.min(assetPct, timePct) * 96;
        if (elapsed >= maxDuration) next = 100;

        // Images mount progressively, so the raw share can dip. Never go back.
        target = Math.max(target, next);

        state.shown += (target - state.shown) * 0.09;
        const v = Math.min(100, Math.round(state.shown + 0.4));
        if (counterEl) counterEl.textContent = String(v).padStart(3, "0");

        if (target === 100 && v >= 100) runExit();
      };
      gsap.ticker.add(ticker);

      // ── Exit ───────────────────────────────────────────────────────────
      function buildExit() {
        const panels = root.querySelectorAll("[data-panel]");
        const panelLines = root.querySelectorAll("[data-panel-line]");
        const midLines = root.querySelectorAll("[data-line-mid]");

        gsap
          .timeline({
            onComplete: () => {
              cbRef.current.onDone?.();
              setGone(true);
            },
          })
          // ring un-draws
          .to(circle, { strokeDashoffset: len, duration: 1.2, ease: "expo.inOut" })
          // accent lines wipe vertically, in opposite directions
          .to(
            panelLines,
            {
              yPercent: gsap.utils.wrap([100, -100]),
              duration: 1.3,
              ease: "expo.inOut",
              stagger: 0.1,
            },
            "<",
          )
          .to(
            midLines,
            {
              yPercent: gsap.utils.wrap([-100, 100]),
              duration: 1.5,
              ease: "power4.inOut",
              stagger: 0.1,
            },
            "<",
          )
          // mark + counter fade out
          .to(
            root.querySelectorAll("[data-fade]"),
            { opacity: 0, duration: 0.45, ease: "sine.out" },
            "<+0.55",
          )
          // …and the panels split apart to reveal the page
          .to(
            panels,
            {
              xPercent: gsap.utils.wrap([-100, 100]),
              duration: 1.4,
              ease: "expo.inOut",
              onStart: () => cbRef.current.onReveal?.(),
            },
            ">-0.15",
          );
      }

      return () => window.removeEventListener("load", onWindowLoad);
    }, rootRef);

    return () => {
      if (ticker) gsap.ticker.remove(ticker);
      ctx.revert();
    };
  }, [loading, minDuration, maxDuration]);

  if (gone) return null;

  return (
    <>
      <style>{`
        .gf-loader {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          overflow: hidden;
          pointer-events: auto;
        }
        .gf-panel {
          position: relative;
          width: 50%;
          height: 100%;
          background: ${PANEL_BG};
        }
        /* Inner column carrying the thick accent line, 15% in from each edge */
        .gf-panel-inner {
          position: absolute;
          top: 0;
          width: 15%;
          height: 100%;
        }
        .gf-panel-inner.is-l { left: 0; }
        .gf-panel-inner.is-r { right: 0; }

        .gf-line { position: absolute; top: 0; height: 100%; }
        .gf-line.is-thick { width: 3px; background: ${ACCENT}; opacity: 0.5; }
        .gf-line.is-hair  { width: 1px; background: rgba(255,255,255,0.22); }
        .gf-line.at-r { right: 0; }
        .gf-line.at-l { left: 0; }

        .gf-center {
          position: absolute;
          inset: 0;
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .gf-mark { position: relative; width: clamp(96px, 13vw, 150px); aspect-ratio: 1; }
        .gf-mark svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .gf-mark img {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 42%;
          object-fit: contain;
        }
        .gf-word {
          margin-top: 1.6rem;
          color: rgba(255,255,255,0.9);
          font-size: 0.7rem;
          letter-spacing: 0.42em;
          text-indent: 0.42em;
          text-transform: uppercase;
        }
        .gf-counter {
          position: absolute;
          right: clamp(1.25rem, 4vw, 3.5rem);
          bottom: clamp(1.25rem, 4vw, 3rem);
          z-index: 4;
          color: #fff;
          font-size: clamp(2.75rem, 9vw, 7rem);
          line-height: 0.85;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
        }
        .gf-counter sup {
          font-size: 0.24em;
          vertical-align: super;
          letter-spacing: 0.1em;
          opacity: 0.6;
        }
        .gf-tag {
          position: absolute;
          left: clamp(1.25rem, 4vw, 3.5rem);
          bottom: clamp(1.6rem, 4vw, 3.4rem);
          z-index: 4;
          color: rgba(255,255,255,0.45);
          font-size: 0.62rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
        }
        @media (prefers-reduced-motion: reduce) {
          .gf-loader { display: none; }
        }
      `}</style>

      <div className="gf-loader" ref={rootRef} role="status" aria-label="Loading">
        {/* Left panel */}
        <div className="gf-panel" data-panel>
          <div className="gf-panel-inner is-l">
            <div className="gf-line is-thick at-r" data-panel-line />
          </div>
          <div className="gf-line is-hair at-r" data-line-mid />
        </div>

        {/* Right panel */}
        <div className="gf-panel" data-panel>
          <div className="gf-panel-inner is-r">
            <div className="gf-line is-thick at-l" data-panel-line />
          </div>
          <div className="gf-line is-hair at-l" data-line-mid />
        </div>

        {/* Mark + ring */}
        <div className="gf-center">
          <div className="gf-mark" data-fade>
            <svg viewBox="0 0 200 200" aria-hidden="true">
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
              />
              <circle
                ref={circleRef}
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke={ACCENT}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <img src={logo} alt="" />
          </div>
          <p className="gf-word" data-fade>
            Live with Nature
          </p>
        </div>

        <span className="gf-tag" data-fade>
          GrowFarms
        </span>
        <div className="gf-counter" data-fade>
          <span ref={counterRef}>000</span>
          <sup>%</sup>
        </div>
      </div>
    </>
  );
};

export default PageLoader;
