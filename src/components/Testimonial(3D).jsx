import React, { useState, useEffect } from "react";

const DATA = [
  "forest",
  "mountains",
  "river",
  "waterfall",
  "lake",
  "sunset nature",
  "beach nature",
];

const N = DATA.length;
const halfAngleRad = Math.PI / N;

// Desktop values — untouched
const W_PX = 600;
const GAP_PX = 30;
const Z_PX = -1 * (W_PX / 2 + GAP_PX) / Math.tan(halfAngleRad);

// Mobile values
const MW_PX = 260;
const MGAP_PX = 12;
const MZ_PX = -1 * (MW_PX / 2 + MGAP_PX) / Math.tan(halfAngleRad);

function isMobileNow() {
  return typeof window !== "undefined" && window.innerWidth < 640;
}

export default function Carousel3D() {
  const [paused, setPaused] = useState(false);
  const [mobile, setMobile] = useState(isMobileNow);

  useEffect(() => {
    const onResize = () => setMobile(isMobileNow());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const cardW  = mobile ? MW_PX  : W_PX;
  const cardH  = mobile ? 190    : 400;
  const zVal   = mobile ? MZ_PX  : Z_PX;
  const persp  = mobile ? 600    : 1100;

  return (
    <>
      <style>{`
        .c3d-scene {
          display: grid;
          width: 100%;
          height: ${mobile ? "35vh" : "70vh"};
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

        .c3d-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        @media (prefers-reduced-motion: reduce) {
          .c3d-a3d { animation-duration: 80s; }
        }
      `}</style>

      <div
        className="c3d-scene"
        onClick={() => setPaused((p) => !p)}
        title={paused ? "Click to resume" : "Click to pause"}
      >
        <div className="c3d-a3d">
          {DATA.map((code, i) => {
            const angleDeg = (360 / N) * i;
            return (
              <div
                key={code}
                className="c3d-card"
                style={{
                  transform: `rotateY(${angleDeg}deg) translateZ(${zVal}px)`,
                }}
              >
                <img
                  // src={`https://source.unsplash.com/900x700/?${code}`}
                  alt={`Testimonial ${i + 1}`}
                  loading="lazy"
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}