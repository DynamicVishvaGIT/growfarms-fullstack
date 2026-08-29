import { useEffect, useRef } from "react";
import home_banner_3 from "../assets/images/home_banner_3.jpg";
import green_bottom_img from "../assets/images/green_img.png";

const ParallaxSection = () => {
  const parallaxRef = useRef(null);

  useEffect(() => {
    const section = parallaxRef.current?.closest("section");

    const handleScroll = () => {
      if (!parallaxRef.current || !section) return;
      const rect = section.getBoundingClientRect();
      parallaxRef.current.style.transform = `translateY(${-rect.top * 0.3}px)`;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative w-full overflow-hidden">
      <div
        className="relative w-full overflow-hidden"
        style={{ height: "clamp(420px, 100svh, 960px)" }}
      >

        {/* Parallax Background */}
        <div
          ref={parallaxRef}
          style={{
            position: "absolute",
            top: "-15%",
            left: 0,
            right: 0,
            bottom: "-15%",
            backgroundImage: `url(${home_banner_3})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            willChange: "transform",
          }}
        />

        {/* Top gradient */}
        <div
          className="absolute top-0 left-0 w-full pointer-events-none z-10"
          style={{
            height: "28%",
            background: "linear-gradient(180deg, #315537 0%, rgba(49, 85, 55, 0) 100%)",
          }}
        />

      {/* Bottom gradient */}
        <div
          className="absolute bottom-0 left-0 w-full pointer-events-none z-20"
          style={{
            height: "30%", // ← was 20%, increase to 30% for smoother blend
            background: "linear-gradient(180deg, rgba(49, 85, 55, 0) 0%, #315537 100%)",
          }}
        />
        {/* Content */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 sm:px-6 text-center">
          <p
            className="text-white max-w-xs sm:max-w-lg md:max-w-2xl"
            style={{
              fontSize: "clamp(1.2rem, 4vw, 3rem)",
              lineHeight: 1.4,
              fontStyle: "italic",
              fontFamily: "'Inter', serif",
              textShadow: "0 2px 24px rgba(0,0,0,0.45)",
              letterSpacing: "0.01em",
              marginBottom: "clamp(1.5rem, 4vw, 2.5rem)",
            }}
          >
            "The City Gives Success.
            <br />
            Nature Gives Peace."
          </p>

          {/* Explore More Button */}
          <div className="relative flex items-center justify-center">
            <div
              className="absolute rounded-full border border-white/40 animate-pulse"
              style={{
                width: "clamp(70px, 12vw, 90px)",
                height: "clamp(70px, 12vw, 90px)",
              }}
            />
            <button
              className="rounded-full backdrop-blur-md border border-white/30
                text-white sub_font font-medium transition-all duration-300 hover:scale-105
                leading-snug"
              style={{
                width: "clamp(56px, 10vw, 70px)",
                height: "clamp(56px, 10vw, 70px)",
                fontSize: "clamp(10px, 1.8vw, 12px)",
                background: "rgba(255,255,255,0.12)",
              }}
            >
              Explore
              <br />
              More
            </button>
          </div>
        </div>

        {/* Bottom green hills */}
        <img
          src={green_bottom_img}
          alt=""
          draggable={false}
          className="absolute bottom-0 left-0 z-10 w-full object-cover object-top pointer-events-none select-none"
          style={{ height: "clamp(193px, 35vw, 687px)" }}
        />

      </div>
    </section>
  );
};

export default ParallaxSection;