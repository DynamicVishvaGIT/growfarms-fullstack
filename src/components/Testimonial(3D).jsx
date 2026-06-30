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
  const [activeIndex, setActiveIndex] = useState(null);
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

  const handleCardClick = (i, e) => {
    e.stopPropagation(); // don't let this bubble up and just toggle the ring
    setActiveIndex(i);
    setPaused(true); // freeze rotation so the playing video stays in view
  };

  const handleSceneClick = () => {
    // clicking empty space resumes rotation and stops any active video
    setPaused((p) => !p);
    setActiveIndex(null);
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
        }

        .c3d-card.active {
          box-shadow: 0 0 0 3px #fff, 0 18px 45px rgba(0,0,0,0.35);
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
        title={paused ? "Click to resume" : "Click to pause"}
      >
        <div className="c3d-a3d">
          {DATA.map((videoId, i) => {
            const angleDeg = (360 / N) * i;
            const isActive = activeIndex === i;

            return (
              <div
                key={videoId}
                className={`c3d-card${isActive ? " active" : ""}`}
                style={{
                  transform: `rotateY(${angleDeg}deg) translateZ(${zVal}px)`,
                }}
                onClick={(e) => handleCardClick(i, e)}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?${
                    isActive
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