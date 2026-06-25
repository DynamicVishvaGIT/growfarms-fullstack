import { useEffect, useState } from "react";
import logo from "/logo_1.png";

// ─────────────────────────────────────────────────────────────
// Usage in App.jsx / main entry:
//
//   import PageLoader from "./components/PageLoader";
//
//   const App = () => {
//     const [loading, setLoading] = useState(true);
//     return (
//       <>
//         <PageLoader loading={loading} onDone={() => setLoading(false)} />
//         {!loading && <YourApp />}
//       </>
//     );
//   };
//
// Props:
//   loading  : boolean  — show/hide the loader
//   onDone   : fn       — called after the exit animation finishes
//   duration : number   — ms to auto-dismiss (default 2800)
// ─────────────────────────────────────────────────────────────

const PageLoader = ({ loading = true, onDone, duration = 2800 }) => {
  const [phase, setPhase] = useState("enter"); // enter | hold | exit | gone

  useEffect(() => {
    if (!loading) return;

    // 1. Enter phase — runs CSS in animation (600ms)
    const holdTimer = setTimeout(() => setPhase("hold"), 600);

    // 2. Start exit after duration
    const exitTimer = setTimeout(() => setPhase("exit"), duration);

    // 3. Unmount after exit animation (500ms)
    const goneTimer = setTimeout(() => {
      setPhase("gone");
      onDone?.();
    }, duration + 500);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(goneTimer);
    };
  }, [loading, duration, onDone]);

  if (phase === "gone") return null;

  return (
    <>
      <style>{`
        @keyframes pl-fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pl-fadeout {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(1.04); }
        }
        @keyframes pl-ping-1 {
          0%   { transform: scale(1);    opacity: 0.7; }
          100% { transform: scale(2.2);  opacity: 0;   }
        }
        @keyframes pl-ping-2 {
          0%   { transform: scale(1);    opacity: 0.45; }
          100% { transform: scale(2.8);  opacity: 0;    }
        }
        @keyframes pl-ping-3 {
          0%   { transform: scale(1);    opacity: 0.25; }
          100% { transform: scale(3.4);  opacity: 0;    }
        }
        @keyframes pl-progress {
          0%   { width: 0%; }
          60%  { width: 75%; }
          85%  { width: 90%; }
          100% { width: 100%; }
        }
        @keyframes pl-label-in {
          from { opacity: 0; letter-spacing: 0.3em; }
          to   { opacity: 1; letter-spacing: 0.14em; }
        }
        @keyframes pl-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scaleY(0.6); }
          40%            { opacity: 1;   transform: scaleY(1); }
        }

        .pl-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(160deg, #0e2a14 0%, #163f1f 55%, #0a1f0d 100%);
          animation: pl-fadein 0.4s ease forwards;
        }
        .pl-overlay.exit {
          animation: pl-fadeout 0.5s ease forwards;
        }

        /* ── Ripple rings ── */
        .pl-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.18);
          width: 100%;
          height: 100%;
        }
        .pl-ring-1 { animation: pl-ping-1 2.4s ease-out infinite; }
        .pl-ring-2 { animation: pl-ping-2 2.4s ease-out infinite 0.5s; }
        .pl-ring-3 { animation: pl-ping-3 2.4s ease-out infinite 1s; }

        /* ── Glass button ── */
        .pl-glass-outer {
          position: relative;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1.5px solid rgba(255,255,255,0.22);
        }
        .pl-logo-ring {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.12);
        }

        /* ── Label ── */
        .pl-label {
          margin-top: 1.25rem;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-shadow: 0 2px 12px rgba(0,0,0,0.3);
          user-select: none;
          animation: pl-label-in 0.8s ease 0.3s both;
          font-family: inherit;
        }

        /* ── Loading dots ── */
        .pl-dots {
          display: flex;
          gap: 5px;
          margin-top: 0.5rem;
        }
        .pl-dot {
          width: 4px;
          height: 14px;
          border-radius: 2px;
          background: rgba(163,201,110,0.85);
          animation: pl-dot 1.2s ease-in-out infinite;
        }
        .pl-dot:nth-child(1) { animation-delay: 0s; }
        .pl-dot:nth-child(2) { animation-delay: 0.15s; }
        .pl-dot:nth-child(3) { animation-delay: 0.3s; }
        .pl-dot:nth-child(4) { animation-delay: 0.45s; }
        .pl-dot:nth-child(5) { animation-delay: 0.6s; }

        /* ── Progress bar ── */
        .pl-bar-track {
          position: absolute;
          bottom: 2.5rem;
          left: 50%;
          transform: translateX(-50%);
          width: clamp(140px, 30vw, 200px);
          height: 2px;
          background: rgba(255,255,255,0.12);
          border-radius: 2px;
          overflow: hidden;
        }
        .pl-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #a3c96e, #5dca90);
          border-radius: 2px;
          animation: pl-progress var(--pl-dur, 2.8s) cubic-bezier(0.4,0,0.2,1) forwards;
        }

        /* ── Corner brand text ── */
        .pl-brand {
          position: absolute;
          bottom: 2rem;
          right: 2rem;
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          user-select: none;
          font-family: inherit;
        }
      `}</style>

      <div className={`pl-overlay${phase === "exit" ? " exit" : ""}`}>

        {/* Ripple rings container */}
        <div style={{ position: "relative", width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="pl-ring pl-ring-1" />
          <div className="pl-ring pl-ring-2" />
          <div className="pl-ring pl-ring-3" />

          {/* Glassmorphism button — exactly matches your Explore button */}
          <div className="pl-glass-outer">
            <div className="pl-logo-ring">
              <img
                src={logo}
                alt="GrowFarms"
                style={{ width: 28, height: 28, objectFit: "contain" }}
              />
            </div>
          </div>
        </div>

        {/* Label */}
        <p className="pl-label">Loading</p>

        {/* Animated dots */}
        <div className="pl-dots" aria-hidden="true">
          <span className="pl-dot" />
          <span className="pl-dot" />
          <span className="pl-dot" />
          <span className="pl-dot" />
          <span className="pl-dot" />
        </div>

        {/* Brand */}
        <span className="pl-brand">GrowFarms</span>
      </div>
    </>
  );
};

export default PageLoader;