import React from "react";
import AboutBanner from "../assets/images/About_Banner.png";
import logo_img from "../assets/images/grow-farms-logo.png";

const About = () => {
  return (
    <section className="relative w-full overflow-hidden">

      {/* Banner Wrapper */}
      <div className="relative w-full h-[70vh] sm:h-[75vh] md:h-[90vh] overflow-hidden">

        {/* Banner Image — positioned to show house, hide bottom flowers */}
        <img
          src={AboutBanner}
          alt="About Banner"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 20%" }}
        />


        {/* Top Bar: Logo (center) + Inquire (top-right) */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-center pt-6 md:pt-8 px-6 md:px-10">

        

          {/* Logo — centered */}
          <img
            src={logo_img}
            alt="GrowFarms – Live with Nature"
            className="h-12 md:h-14 lg:h-16 w-auto object-contain"
          />

       
    
        </div>

        {/* "Blog" title — vertically & horizontally centered */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <h1
            className="text-white font-light tracking-[0.25em] text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
            style={{ textShadow: "0 4px 20px rgba(0,0,0,0.45)" }}
          >
            About Us 
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

export default About;