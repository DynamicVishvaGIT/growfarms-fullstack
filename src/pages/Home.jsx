import AerialMapSection from "../components/AerialMapSection";
import HomeBanner from "../components/HomeBanner";
import ParallaxSection from "../components/ParallaxSection";
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

   
    </div>
  );
};

export default GrowFarmsHero;