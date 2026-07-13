import React from 'react'
import Carousel3D from '../components/Testimonial(3D)'

const TestimonialSection = () => {
  return (
    <section
      className="relative w-full"
      style={{ backgroundColor: "#315537" }}
    >
      {/* background overlay — non-interactive */}
      <div className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Content */}
      <div
        className="relative flex flex-col items-center pt-16 pb-16 md:pt-20 md:pb-20"
        style={{ zIndex: 900, pointerEvents: "none" }}  
      >
        <h2
          className="text-white text-center"
          style={{
            fontSize: "clamp(1.6rem, 3vw, 3rem)",
            fontWeight: 400,
            letterSpacing: "0.06em",
            pointerEvents: "none",  
          }}
        >
          Testimonial
        </h2>
        <p
          className="text-white/75 mt-3 text-center max-w-xl"
          style={{ fontSize: "clamp(0.85rem, 1.1vw, 1rem)", pointerEvents: "none" }}
        >
          A place that grows in value while giving peace today.
        </p>

        {/* Re-enable pointer events only on the carousel itself */}
        <div style={{ pointerEvents: "auto", width: "100%" }}>
          <Carousel3D />
        </div>

        {/* Re-enable on the link */}
        <a
          href="#"
          className="text-white/80 hover:text-white transition-colors"
          style={{
            fontSize: "clamp(0.85rem, 1vw, 1rem)",
            letterSpacing: "0.1em",
            textDecoration: "underline",
            textUnderlineOffset: "5px",
            pointerEvents: "auto", 
          }}
        >
          View All
        </a>
      </div>
    </section>
  )
}

export default TestimonialSection