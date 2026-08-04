import home_banner_2 from "../assets/images/home_banner_2.jpg";
import { useEffect, useRef, useState } from "react";
import AerialMapSection from "../components/AerialMapSection";
import HomeBanner from "../components/HomeBanner";
import logo_img from "../assets/images/grow-farms-logo.png";
import ParallaxSection from "../components/ParallaxSection";
import FooterSection from "../components/FooterSection";
import TestimonialSection from "../components/TestimonialSection";

const GrowFarmsHero = () => {
  return (
    <div className="relative w-full overflow-x-hidden">

      {/* ══════════════════════════════════════
          SECTION 1 — Hero
      ══════════════════════════════════════ */}
      <HomeBanner />

         {/* ══════════════════════════════════════
         SECTION 2 — Aerial Map Banner
        ══════════════════════════════════════ */}
       <AerialMapSection />

      {/* ══════════════════════════════════════
          SECTION 3 — Testimonial
      ══════════════════════════════════════ */}
      <TestimonialSection />


      {/* ══════════════════════════════════════
       SECTION 4 — Parallax Quote Banner
     ══════════════════════════════════════ */}
      <ParallaxSection />

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
   
    </div>
  );
};

export default GrowFarmsHero;