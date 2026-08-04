import React, { useEffect, useState } from "react";
import BlogBanner from "../assets/images/Blog_Banner_2.jpeg";
import logo_img from "../assets/images/grow-farms-logo.png";

const Blogs = () => {
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Banner Wrapper — h-full so absolutely positioned children have a
          real containing block to size against (was h-auto, which collapses
          to 0 since every child here is position:absolute) */}
      <div className="relative w-full h-full">
        {/* Banner Image — slow Ken Burns zoom on mount */}
        <img
          src={BlogBanner}
          alt="Blog Banner"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3000ms] ease-out"
          style={{
            transform: heroVisible ? "scale(1.05)" : "scale(1.15)",
          }}
        />

        {/* Top Bar: Logo (center) + Inquire (top-right) */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-center pt-6 md:pt-8 px-6 md:px-10">
          {/* Logo — centered */}
          <img
            src={logo_img}
            alt="GrowFarms – Live with Nature"
            className="h-12 md:h-14 lg:h-16 w-auto transition-all duration-700 ease-out"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0px)" : "translateY(-12px)",
            }}
          />

         
        </div>

        {/* "Blog" title — vertically & horizontally centered */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <h1
            className="text-white font-light tracking-[0.25em] text-3xl sm:text-4xl md:text-5xl lg:text-6xl transition-all duration-1000 ease-out"
            style={{
              textShadow: "0 4px 20px rgba(0,0,0,0.45)",
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0px)" : "translateY(20px)",
            }}
          >
            Blog
          </h1>
        </div>

        {/* Bottom Green Gradient Fade */}
        <div
          className="absolute bottom-0 left-0 w-full pointer-events-none z-20"
          style={{
            height: "clamp(90px, 28%, 240px)",
            background: `linear-gradient(
              180deg,
              rgba(49,85,55,0) 0%,
              rgba(49,85,55,0.30) 35%,
              rgba(49,85,55,0.70) 70%,
              #315537 100%
            )`,
          }}
        />
      </div>
    </section>
  );
};

export default Blogs;