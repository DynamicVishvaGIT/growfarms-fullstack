import { useState, useRef, useLayoutEffect, useEffect } from "react";
import gsap from "gsap";
import { ChevronLeft, ChevronRight, Sprout, Pause, Play } from "lucide-react";
import pali_img_1 from "../assets/images/Why_Pali_1.png";
import pali_img_2 from "../assets/images/Why_Pali_2.png";
import pali_img_3 from "../assets/images/Why_Pali_3.png";

const SLIDES = [
  {
    title: "Smart Investment",
    description:
      "Buying Farm Land In Pali Supports The Local Community. It Can Create Jobs And Help Growth.",
    image: pali_img_1,
  },
  {
    title: "Helps The Local Area",
    description:
      "Buying Farm Land In Pali Supports The Local Community. It Can Create Jobs And Help Job Growth.",
    image: pali_img_2,
  },
  {
    title: "Sustainable Land",
    description:
      "Every Acre In Pali Is Farmed Responsibly, Protecting Soil Health For Generations To Come.",
    image: pali_img_3,
  },
  {
    title: "Long Term Value",
    description:
      "Farmland In Pali Has Steadily Appreciated, Making It A Reliable Store Of Value Over Time.",
    image: pali_img_1,
  },
  {
    title: "Trusted Partnership",
    description:
      "Our Local Team Manages Every Plot Directly, So You Invest With Full Transparency.",
    image: pali_img_2,
  },
];

const COUNT = SLIDES.length;
const AUTOPLAY_MS = 2000;
// Card proportions from the design spec (471 x 602.38) — locked in as an
// aspect-ratio so the card scales correctly at any viewport width instead
// of relying on a fixed pixel height.
const CARD_ASPECT = "aspect-[0.7818]";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function WhyPaliSection() {
  const [active, setActive] = useState(1); // "Helps The Local Area" centered, like the screenshot
  const [isPlaying, setIsPlaying] = useState(() => !prefersReducedMotion());
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const prevBtnRef = useRef(null);
  const nextBtnRef = useRef(null);
  const cardRefs = useRef([]); // copy block (title/description) per slide
  const slideRefs = useRef([]); // whole slide wrapper per slide, for tilt
  const progressBarRef = useRef(null);

  const isDraggingRef = useRef(false);
  const draggedRef = useRef(false);
  const dragXRef = useRef(0);
  const startXRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  const autoplayTimeoutRef = useRef(null);
  const progressTweenRef = useRef(null);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const getOffset = (index) => {
    let diff = index - active;
    if (diff > COUNT / 2) diff -= COUNT;
    if (diff < -COUNT / 2) diff += COUNT;
    return diff;
  };

  const goTo = (index) => setActive(((index % COUNT) + COUNT) % COUNT);
  const next = () => goTo(active + 1);
  const prev = () => goTo(active - 1);

  // ---------- Autoplay + progress bar ----------
  const startProgress = (durationMs = AUTOPLAY_MS) => {
    if (!progressBarRef.current) return;
    progressTweenRef.current?.kill();
    gsap.set(progressBarRef.current, { scaleX: 0 });
    progressTweenRef.current = gsap.to(progressBarRef.current, {
      scaleX: 1,
      duration: durationMs / 1000,
      ease: "none",
    });
  };

  const scheduleNext = (durationMs) => {
    clearTimeout(autoplayTimeoutRef.current);
    autoplayTimeoutRef.current = setTimeout(next, durationMs);
  };

  const pauseAutoplay = () => {
    clearTimeout(autoplayTimeoutRef.current);
    progressTweenRef.current?.pause();
  };

  const resumeAutoplay = () => {
    const tween = progressTweenRef.current;
    if (tween) {
      const remaining = Math.max((1 - tween.progress()) * AUTOPLAY_MS, 300);
      tween.resume();
      scheduleNext(remaining);
    } else {
      scheduleNext(AUTOPLAY_MS);
    }
  };

  const togglePlay = () => {
    setIsPlaying((prevPlaying) => {
      const next = !prevPlaying;
      if (next) resumeAutoplay();
      else pauseAutoplay();
      return next;
    });
  };

  useEffect(() => {
    startProgress();
    if (isPlayingRef.current) scheduleNext(AUTOPLAY_MS);
    else progressTweenRef.current?.pause();
    return () => clearTimeout(autoplayTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // ---------- Entrance animation ----------
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(".why-pali-heading", {
        opacity: 0,
        y: -24,
        duration: 0.8,
        ease: "power3.out",
      });
      gsap.from(trackRef.current, {
        opacity: 0,
        scale: 0.94,
        duration: 0.9,
        delay: 0.15,
        ease: "power3.out",
      });
      gsap.from([prevBtnRef.current, nextBtnRef.current], {
        opacity: 0,
        duration: 0.6,
        delay: 0.5,
        stagger: 0.12,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

// Pop the active card's copy in + animate the stat counter whenever the slide changes
  useEffect(() => {
    const el = cardRefs.current[active];
    if (el) {
      gsap.fromTo(
        el,
        { y: 18, opacity: 0.7 },
        { y: 0, opacity: 1, duration: 0.55, ease: "back.out(1.6)" },
      );
    }
  }, [active]);


  // ---------- Cursor tilt on the active card ----------
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const wrapper = slideRefs.current[active];
    const target = wrapper?.querySelector("[data-tilt-target]");
    if (!target) return;

    const rotateXTo = gsap.quickTo(target, "rotateX", {
      duration: 0.6,
      ease: "power3.out",
    });
    const rotateYTo = gsap.quickTo(target, "rotateY", {
      duration: 0.6,
      ease: "power3.out",
    });
    const scaleTo = gsap.quickTo(target, "scale", {
      duration: 0.6,
      ease: "power3.out",
    });

    const handleMove = (e) => {
      const rect = target.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rotateYTo(px * 10);
      rotateXTo(py * -10);
      scaleTo(1.025);
    };
    const handleLeave = () => {
      rotateXTo(0);
      rotateYTo(0);
      scaleTo(1);
    };

    target.addEventListener("mousemove", handleMove);
    target.addEventListener("mouseleave", handleLeave);
    return () => {
      target.removeEventListener("mousemove", handleMove);
      target.removeEventListener("mouseleave", handleLeave);
      gsap.set(target, { rotateX: 0, rotateY: 0, scale: 1 });
    };
  }, [active]);

  // ---------- Magnetic nav buttons ----------
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const cleanups = [prevBtnRef, nextBtnRef].map((ref) => {
      const el = ref.current;
      if (!el) return () => {};
      const xTo = gsap.quickTo(el, "x", { duration: 0.3, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.3, ease: "power3.out" });
      const handleMove = (e) => {
        const rect = el.getBoundingClientRect();
        xTo((e.clientX - rect.left - rect.width / 2) * 0.35);
        yTo((e.clientY - rect.top - rect.height / 2) * 0.35);
      };
      const handleLeave = () => {
        xTo(0);
        yTo(0);
      };
      el.addEventListener("mousemove", handleMove);
      el.addEventListener("mouseleave", handleLeave);
      return () => {
        el.removeEventListener("mousemove", handleMove);
        el.removeEventListener("mouseleave", handleLeave);
      };
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);

  // ---------- Drag / swipe (mouse + touch via Pointer Events) ----------
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    draggedRef.current = false;
    startXRef.current = e.clientX;
    setDragging(true);
    pauseAutoplay();
    trackRef.current?.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 5) draggedRef.current = true;
    dragXRef.current = delta;
    setDragX(delta);
  };

  const endDrag = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setDragging(false);
    const width = trackRef.current?.offsetWidth || 1;
    const threshold = width * 0.12;
    const delta = dragXRef.current;
    dragXRef.current = 0;
    setDragX(0);

    if (delta > threshold) prev();
    else if (delta < -threshold) next();
    else if (isPlayingRef.current) resumeAutoplay();
  };

  const handleSlideClick = (i) => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    if (i !== active) goTo(i);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") prev();
    else if (e.key === "ArrowRight") next();
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-clip px-4 py-20 sm:py-10"
      onMouseEnter={pauseAutoplay}
      onMouseLeave={() => {
        if (isPlayingRef.current) resumeAutoplay();
      }}
    >
      <h2 className="why-pali-heading text-center font-serif text-4xl font-bold text-white sm:text-5xl">
        Why Pali?
      </h2>

      <div
        ref={trackRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Why Pali"
        tabIndex={0}
        className={`relative mx-auto mt-14 max-w-5xl touch-pan-y select-none rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => isDraggingRef.current && endDrag()}
        onKeyDown={handleKeyDown}
        onFocus={pauseAutoplay}
        onBlur={() => {
          if (isPlayingRef.current) resumeAutoplay();
        }}
      >
        {/* Sizer: an invisible element that carries the same responsive width
            as each card and locks the aspect ratio, so it — not a fixed px
            height — determines how tall the track is at every breakpoint. */}
        <div
          className={`invisible mx-auto w-[78%] ${CARD_ASPECT} sm:w-[60%] md:w-[50%] lg:w-[42%]`}
        />

        {SLIDES.map((slide, i) => {
          const offset = getOffset(i);
          const abs = Math.abs(offset);
          const isActive = offset === 0;
          const isAdjacent = abs === 1;
          const isHoveredAdjacent = isAdjacent && hoveredIndex === i;

          let scale = 1;
          let opacity = 1;
          let zIndex = 30;
          let brightness = 1;
          let pointerEvents = "auto";

          if (isAdjacent) {
            scale = isHoveredAdjacent ? 0.76 : 0.72;
            opacity = isHoveredAdjacent ? 0.7 : 0.5;
            zIndex = 20;
            brightness = isHoveredAdjacent ? 0.8 : 0.65;
          } else if (abs > 1) {
            scale = 0.55;
            opacity = 0;
            zIndex = 0;
            pointerEvents = "none";
          }

          return (
            <div
              key={slide.title}
              ref={(el) => (slideRefs.current[i] = el)}
              className={`absolute left-1/2 top-0 w-[78%] ${CARD_ASPECT} sm:w-[60%] md:w-[50%] lg:w-[42%] ${
                dragging
                  ? ""
                  : "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              }`}
              style={{
                transform: `translate(-50%, 0) translateX(calc(${offset * 64}% + ${dragX}px)) scale(${scale})`,
                opacity,
                zIndex,
                pointerEvents,
                cursor: isAdjacent ? "pointer" : dragging ? "grabbing" : "grab",
                perspective: 1000,
              }}
              onClick={() => handleSlideClick(i)}
              onMouseEnter={() => isAdjacent && setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex((h) => (h === i ? null : h))}
            >
              <div
                data-tilt-target
                className="relative h-full w-full overflow-hidden rounded-[20px] shadow-2xl"
                style={{ filter: `brightness(${brightness})` }}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="h-full w-full object-center"
                  draggable={false}
                />

                {/* Gradient Overlay */}
                <div
                  className="absolute inset-x-0 bottom-0 h-1/2 w-full pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(360deg, #FFFFFF 0%, rgba(255,255,255,0.8) 25.58%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)",
                  }}
                />

               

                <div
                  ref={(el) => (cardRefs.current[i] = el)}
                  className="absolute left-4 right-4 bottom-4 z-10 p-5 sm:left-6 sm:right-6 sm:p-6"
                >
                  <h3 className="font-serif text-lg font-bold text-[#33493d] sm:text-xl">
                    {slide.title}
                  </h3>

                  <p className="mt-1.5 sub_font text-sm leading-relaxed text-gray-600 sm:text-[15px]">
                    {slide.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        ref={prevBtnRef}
        onClick={() => {
          prev();
        }}
        aria-label="Previous slide"
        className="absolute left-3 top-[50%] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 text-white transition-colors hover:bg-white hover:text-[#33493d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-6 md:left-10 lg:left-16"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        ref={nextBtnRef}
        onClick={() => {
          next();
        }}
        aria-label="Next slide"
        className="absolute right-3 top-[50%] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 text-white transition-colors hover:bg-white hover:text-[#33493d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6 md:right-10 lg:right-16"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Story-style progress dots + play/pause */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label="Choose slide"
        >
          {SLIDES.map((slide, i) => (
            <button
              key={slide.title}
              role="tab"
              aria-selected={i === active}
              aria-label={`Go to slide ${i + 1}: ${slide.title}`}
              onClick={() => goTo(i)}
              className="group relative h-1.5 w-8 overflow-hidden rounded-full bg-white/25 transition-colors hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {i === active && (
                <span
                  ref={progressBarRef}
                  className="absolute inset-y-0 left-0 block h-full w-full origin-left rounded-full bg-white"
                />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause autoplay" : "Resume autoplay"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/40 text-white/80 transition-colors hover:border-white hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5 translate-x-[1px]" />
          )}
        </button>
      </div>
    </section>
  );
}
