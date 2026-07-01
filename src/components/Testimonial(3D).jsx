import React, { useState, useEffect } from "react";

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
  const [playingIndex, setPlayingIndex] = useState(null); // single source of truth
  const [screenType, setScreenType] = useState(getScreenType);

  useEffect(() => {
    const onResize = () => setScreenType(getScreenType());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const mobile = screenType === "mobile";
  const laptop = screenType === "laptop";

  const cardW = mobile ? MW_PX : W_PX;
  const zVal = mobile ? MZ_PX : Z_PX;
  const persp = mobile ? 600 : 1000;

  const cardH = mobile ? 190 : laptop ? 300 : 400;
  const sceneHeight = mobile ? "35vh" : laptop ? "50vh" : "70vh";

  // Click a card -> play its video immediately, pause the ring
  const handleCardClick = (i, e) => {
    e.stopPropagation();
    setPlayingIndex(i);
    setPaused(true);
  };

  // Click outside a card -> toggle pause/resume.
  // Resuming always stops whatever video was playing, so the ring
  // never spins with a video still active behind it.
  const handleSceneClick = () => {
    setPaused((prev) => {
      const next = !prev;
      if (!next) setPlayingIndex(null); // resuming -> stop video
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
          cursor: pointer;
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
          transition: box-shadow 0.25s ease;
        }

        .c3d-card.active {
          box-shadow: 0 0 0 3px #fff, 0 18px 45px rgba(0,0,0,0.35);
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

            return (
              <div
                key={videoId}
                className={`c3d-card${isPlaying ? " active" : ""}`}
                style={{
                  transform: `rotateY(${angleDeg}deg) translateZ(${zVal}px)`,
                }}
              >
                {/* Overlay only exists while NOT playing — catches the
                    click since clicks landing inside the iframe never
                    bubble to React (cross-origin document). Once playing,
                    the overlay is removed so YouTube's own controls work. */}
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