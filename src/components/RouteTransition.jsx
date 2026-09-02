import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { gsap } from "gsap";

/**
 * Curtain transition between routes.
 *
 * On a route change the two panels are placed closed *synchronously* in a
 * layout effect — before the browser paints the new page — so the incoming
 * route is never briefly visible. They then split apart with the same
 * expo.inOut used by PageLoader, so entering a page reads as one continuous
 * gesture with the initial load.
 *
 * Mount it inside the Router, above <Routes>.
 */
const RouteTransition = ({ enabled = true }) => {
  const { pathname } = useLocation();
  const rootRef = useRef(null);
  const isFirst = useRef(true);

  useLayoutEffect(() => {
    // The initial load is PageLoader's job — don't double up on it.
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (!enabled) return;

    const root = rootRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const panels = root.querySelectorAll("[data-rt-panel]");
      const lines = root.querySelectorAll("[data-rt-line]");

      gsap.set(root, { visibility: "visible" });
      gsap.set(panels, { xPercent: 0 });
      gsap.set(lines, { yPercent: 0, opacity: 1 });

      gsap
        .timeline({
          onComplete: () => gsap.set(root, { visibility: "hidden" }),
        })
        .to(lines, {
          yPercent: gsap.utils.wrap([-100, 100]),
          duration: 0.9,
          ease: "power4.inOut",
          stagger: 0.08,
        })
        .to(
          panels,
          {
            xPercent: gsap.utils.wrap([-100, 100]),
            duration: 1.15,
            ease: "expo.inOut",
          },
          0.12,
        );
    }, rootRef);

    return () => ctx.revert();
  }, [pathname, enabled]);

  return (
    <>
      <style>{`
        .rt-wrap {
          position: fixed;
          inset: 0;
          z-index: 9990;
          display: flex;
          overflow: hidden;
          pointer-events: none;
          visibility: hidden;
        }
        .rt-panel {
          position: relative;
          width: 50%;
          height: 100%;
          background: #163f1f;
        }
        .rt-line {
          position: absolute;
          top: 0;
          width: 3px;
          height: 100%;
          background: #a3c96e;
          opacity: 0.5;
        }
        .rt-line.at-r { right: 0; }
        .rt-line.at-l { left: 0; }
      `}</style>

      <div className="rt-wrap" ref={rootRef} aria-hidden="true">
        <div className="rt-panel" data-rt-panel>
          <div className="rt-line at-r" data-rt-line />
        </div>
        <div className="rt-panel" data-rt-panel>
          <div className="rt-line at-l" data-rt-line />
        </div>
      </div>
    </>
  );
};

export default RouteTransition;
