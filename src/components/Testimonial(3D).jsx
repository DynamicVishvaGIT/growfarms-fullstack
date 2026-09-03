import { useState, useEffect, useRef } from "react";
import useApiData from "../hooks/useApiData";
import { getTestimonials } from "../lib/api";
import { useProject } from "../context/projectContext";

const FALLBACK_DATA = [
  "fcx0LV7C2pE",
  "DxA4B7bJpRk",
  "AYSdZFo1Yxw",
  "1xkuNlpQhvc",
  "d8ul6Akvu7o",
  "TJfRcYy5y1M",
];

const W_PX = 700;
const GAP_PX = 30;
const MW_PX = 260;
const MGAP_PX = 12;

/**
 * The ring geometry depends on how many cards are on it, so it is derived
 * from the live list rather than fixed at module load. With the original six
 * testimonials this produces exactly the same numbers as before.
 */
function ringGeometry(count) {
  const n = Math.max(2, count);
  const halfAngleRad = Math.PI / n;
  return {
    n,
    zDesktop: (-1 * (W_PX / 2 + GAP_PX)) / Math.tan(halfAngleRad),
    zMobile: (-1 * (MW_PX / 2 + MGAP_PX)) / Math.tan(halfAngleRad),
  };
}

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
  const [isVisible, setIsVisible] = useState(false);
  const cardRefs = useRef([]);
  const sceneRef = useRef(null);

  const project = useProject();

  const { data: videos } = useApiData(
    async (signal) => {
      // A project page plays that project's own reel when it has one; the home
      // page and any project without its own get the shared list.
      const rows = project?.testimonials?.length
        ? project.testimonials
        : await getTestimonials(signal);
      const ids = (rows || []).map((r) => r.youtube_id).filter(Boolean);
      return ids.length ? ids : null;
    },
    FALLBACK_DATA,
    [project?.id],
  );

  const { n: N, zDesktop, zMobile } = ringGeometry(videos.length);

  useEffect(() => {
    const onResize = () => setScreenType(getScreenType());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Only run the centered-card detection (and the ring rotation, see CSS
  // below) while the carousel is actually on screen. Previously this loop
  // ran unconditionally forever, forcing 6 layout reads every ~100ms even
  // while scrolled far away — that constant main-thread work compounded
  // with the CSS 3D rotation's paint cost and was measurably dropping
  // frame rate (and, on slower machines, making scroll feel like it had
  // stalled) specifically while this section was in view.
  useEffect(() => {
    const node = sceneRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let rafId;
    let lastCheck = 0;

    const loop = (time) => {
      if (time - lastCheck > 300) {
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
  }, [isVisible]);

  const mobile = screenType === "mobile";
  const laptop = screenType === "laptop";

  const cardW = mobile ? MW_PX : W_PX;
  const zVal = mobile ? zMobile : zDesktop;
  const persp = mobile ? 600 : 1000;

  const cardH = mobile ? 190 : laptop ? 300 : 400;
  const sceneHeight = mobile ? "35vh" : laptop ? "50vh" : "70vh";

  const handleCardClick = (i) => {
    setPlayingIndex(i);
    setPaused(true);
  };

  const handleBgClick = () => {
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
          position: relative;
          display: grid;
          width: 100%;
          height: ${sceneHeight};
          perspective: ${persp}px;
          cursor: default;
        }

        /* Invisible full-area bg captures pause/resume clicks
           so the giant transformed bounding box of c3d-a3d
           never needs to be the event target */
        .c3d-scene-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          cursor: pointer;
        }

        .c3d-a3d {
          display: grid;
          place-self: center;
          transform-style: preserve-3d;
          animation: rotateRing 28s linear infinite;
          animation-play-state: ${paused || !isVisible ? "paused" : "running"};
          position: relative;
          z-index: 1;
          /* Disable the huge transformed hitbox — cards re-enable individually */
          pointer-events: none;
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
          background: #000;
          display: block;
          position: relative;
          cursor: pointer;
          outline: 0px solid transparent;
          outline-offset: 0px;
          transition: box-shadow 0.25s ease, outline-width 0.25s ease, filter 0.25s ease;
          /* Re-enable pointer events per-card */
          pointer-events: auto;
          will-change: transform;
          z-index: 1;
        }

        .c3d-card.active {
          outline: 4px solid rgba(255,255,255,0.9);
          box-shadow: 0 25px 60px rgba(0,0,0,0.5);
          filter: brightness(1.03);
          /* Lift active card above all siblings */
          z-index: 1000;
        }

        .c3d-card.centered {
          outline: 3px solid rgba(255,255,255,0.85);
          box-shadow: 0 20px 50px rgba(0,0,0,0.32);
        }

        /* Thumbnail image fills card */
        .c3d-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          pointer-events: none;
        }

        /* Play button overlay — only on non-playing cards */
        .c3d-card-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: rgba(0,0,0,0);
          display: grid;
          place-items: center;
          transition: background 0.2s ease;
        }

        .c3d-card-overlay:hover {
          background: rgba(0,0,0,0.15);
        }

        .c3d-play-hint {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(0,0,0,0.6);
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

        /* iframe only renders for the active card */
        .c3d-iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }

        @media (prefers-reduced-motion: reduce) {
          .c3d-a3d {
            animation-duration: 80s;
          }
        }
      `}</style>

      <div className="c3d-scene" ref={sceneRef}>
        {/* Background layer handles pause/resume — avoids relying on
            the giant transformed bounding box of c3d-a3d as event target */}
        <div
          className="c3d-scene-bg"
          onClick={handleBgClick}
          title={paused ? "Click to resume" : "Click to pause"}
        />

        <div className="c3d-a3d">
          {videos.map((videoId, i) => {
            const angleDeg = (360 / N) * i;
            const isPlaying = playingIndex === i;
            const isCentered = centerIndex === i;

            return (
              <div
                key={videoId}
                ref={(el) => (cardRefs.current[i] = el)}
                className={`c3d-card${isPlaying ? " active" : ""}${
                  !isPlaying && isCentered ? " centered" : ""
                }`}
                style={{
                  transform: `rotateY(${angleDeg}deg) translateZ(${zVal}px) scale(${
                    isPlaying ? 1.05 : 1
                  })`,
                }}
              >
                {isPlaying ? (
                  /* Only ONE iframe at a time — avoids 6 stacked interactive iframes */
                  <iframe
                    className="c3d-iframe"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&loop=1&playlist=${videoId}`}
                    title={`Video ${i + 1}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <>
                    {/* Thumbnail instead of idle iframe — no stacked hitboxes */}
                    <img
                      className="c3d-thumb"
                      src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                      alt={`Video ${i + 1}`}
                    />
                    <div
                      className="c3d-card-overlay"
                      onClick={() => handleCardClick(i)}
                    >
                      <span className="c3d-play-hint">▶</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}