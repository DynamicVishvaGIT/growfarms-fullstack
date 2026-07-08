import React, { useState, useEffect, useRef } from "react";

const DATA = [
  "fcx0LV7C2pE",
  "DxA4B7bJpRk",
  "AYSdZFo1Yxw",
  "1xkuNlpQhvc",
  "d8ul6Akvu7o",
  "TJfRcYy5y1M",
];

const N = DATA.length;
const halfAngleRad = Math.PI / N;

// Desktop values — untouched
const W_PX = 700;
const GAP_PX = 30;
const Z_PX = (-1 * (W_PX / 2 + GAP_PX)) / Math.tan(halfAngleRad);

// Mobile values
const MW_PX = 260;
const MGAP_PX = 12;
const MZ_PX = (-1 * (MW_PX / 2 + MGAP_PX)) / Math.tan(halfAngleRad);

function getScreenType() {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "laptop";
  return "desktop";
}

export default function Carousel3D() {
  const [paused, setPaused] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [screenType, setScreenType] = useState(getScreenType);
  const [centerIndex, setCenterIndex] = useState(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const onResize = () => setScreenType(getScreenType());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Detects which card is currently front-facing in the 3D rotation by
  // comparing rendered widths (perspective makes the front-most card
  // appear widest). Throttled to ~10fps since this doesn't need to be
  // pixel-perfect every frame — it's just driving a highlight.
  useEffect(() => {
    let rafId;
    let lastCheck = 0;

    const loop = (time) => {
      if (time - lastCheck > 100) {
        lastCheck = time;
        let maxWidth = -Infinity;
        let maxIdx = null;

        cardRefs.current.forEach((el, i) => {
          if (!el) return;
          const w = el.getBoundingClientRect().width;
          if (w > maxWidth) {
            maxWidth = w;
            maxIdx = i;
          }
        });

        if (maxIdx !== null) {
          setCenterIndex((prev) => (prev !== maxIdx ? maxIdx : prev));
        }
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const mobile = screenType === "mobile";
  const laptop = screenType === "laptop";

  const cardW = mobile ? MW_PX : W_PX;
  const zVal = mobile ? MZ_PX : Z_PX;
  const persp = mobile ? 600 : 1000;

  const cardH = mobile ? 190 : laptop ? 300 : 400;
  const sceneHeight = mobile ? "35vh" : laptop ? "50vh" : "70vh";

  const handleCardClick = (i, e) => {
    e.stopPropagation();
    setPlayingIndex(i);
    setPaused(true);
  };

  const handleSceneClick = () => {
    setPaused((prev) => {
      const next = !prev;
      if (!next) setPlayingIndex(null);
      return next;
    });
  };

  return (
    <>
      <style>{`
        .c3d-scene {
          display: grid;
          width: 100%;
          height: ${sceneHeight};
          overflow: hidden;
          perspective: ${persp}px;
          cursor: default;
        }

        .c3d-a3d {
          display: grid;
          place-self: center;
          transform-style: preserve-3d;
          animation: rotateRing 28s linear infinite;
          animation-play-state: ${paused ? "paused" : "running"};
        }

        @keyframes rotateRing {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }

        .c3d-card {
          grid-area: 1 / 1;
          width: ${cardW}px;
          height: ${cardH}px;
          border-radius: 1.25rem;
          overflow: hidden;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          box-shadow: 0 18px 45px rgba(0,0,0,0.22);
          background: #fff;
          display: block;
          position: relative;
          cursor: default;
          outline: 0px solid #fff;
          outline-offset: 0px;
          transition: box-shadow 0.25s ease, outline-width 0.25s ease, filter 0.25s ease;
        }

        /* outline (not box-shadow) avoids a Safari/WebKit rendering bug
           where box-shadow can fail to draw, or get clipped, on elements
           that have backface-visibility: hidden inside a preserve-3d
           parent. Outline is composited separately and isn't affected. */
        .c3d-card.active {
          outline-width: 4px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.5);
          filter: brightness(1.03);
        }

        /* Highlight for whichever card is currently front-facing during
           rotation. Kept independent of .active (click-to-play state) —
           deliberately not touching  here, since the inline
           transform on each card (rotateY/translateZ/scale) always wins
           over anything set via a class. */
        .c3d-card.centered {
          outline-width: 3px;
          outline-color: rgba(255, 255, 255, 0.85);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.32);
        }

        .c3d-card-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: transparent;
          cursor: pointer;
          display: grid;
          place-items: center;
        }

        .c3d-play-hint {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(0,0,0,0.55);
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 1.3rem;
          backdrop-filter: blur(2px);
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }

        .c3d-card-overlay:hover .c3d-play-hint {
          opacity: 1;
        }

        .c3d-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        @media (prefers-reduced-motion: reduce) {
          .c3d-a3d {
            animation-duration: 80s;
          }
        }
      `}</style>

      <div
        className="c3d-scene"
        onClick={handleSceneClick}
        title={paused ? "Click outside to resume" : "Click a card to play"}
      >

        <div className="c3d-a3d">
          {DATA.map((videoId, i) => {
            const angleDeg = (360 / N) * i;
            const isPlaying = playingIndex === i;
            const isCentered = centerIndex === i;

            return (
              <div
                key={videoId}
                ref={(el) => (cardRefs.current[i] = el)}
                className={`c3d-card${isPlaying ? " active" : ""}${
                  isCentered ? " centered" : ""
                }`}
                style={{
                  // scale is applied HERE, inline, because a transform set
                  // via the .active CSS class would be silently overridden
                  // by this inline style (inline always wins for the same
                  // property) — so a class-based scale never actually shows.
                  transform: `rotateY(${angleDeg}deg) translateZ(${zVal}px) scale(${
                    isPlaying ? 1.05 : 1
                  })`,
                }}
              >
                {!isPlaying && (
                  <div
                    className="c3d-card-overlay"
                    onClick={(e) => handleCardClick(i, e)}
                  >
                    <span className="c3d-play-hint">▶</span>
                  </div>
                )}

                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?${
                    isPlaying
                      ? "autoplay=1&mute=0&controls=1"
                      : "mute=1&controls=0"
                  }&loop=1&playlist=${videoId}`}
                  title={`Video ${i + 1}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}