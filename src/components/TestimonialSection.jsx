import React from 'react'
import landscape_img from "../assets/images/home_banner_3.jpg" // use your aerial image

const TestimonialSection = () => {
  return (
    <section
      className="relative w-full overflow-visible"
      style={{ backgroundColor: "#315537" }} // fallback color if image fails to load
    >
      {/* Aerial background image */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
     
      />

      {/* Top overlay — starts at EXACT #315537 to match ParallaxSection bottom */}
      <div
        className="absolute top-0 left-0 w-full pointer-events-none overflow-visible"
        style={{
          height: "20%",
          background: "linear-gradient(180deg, #315537 0%, rgba(49,85,55,0.92) 40%, rgba(49,85,55,0.55) 80%, rgba(49,85,55,0) 100%)",
          zIndex: 1,
        }}
      />

      {/* Bottom overlay — fades back to green */}
      <div
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{
          height: "45%",
          background: "linear-gradient(180deg, rgba(49,85,55,0) 0%, rgba(49,85,55,0.85) 60%, #315537 100%)",
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        className="relative flex flex-col items-center px-4 sm:px-6 pt-16 pb-16 md:pt-20 md:pb-20"
        style={{ zIndex: 2 }}
      >
        <h2
          className="text-white text-center"
          style={{
            fontSize: "clamp(1.6rem, 3vw, 3rem)",
            fontWeight: 400,
            letterSpacing: "0.06em",
          }}
        >
          Testimonial
        </h2>
        <p
          className="text-white/75 mt-3 text-center max-w-xl"
          style={{ fontSize: "clamp(0.85rem, 1.1vw, 1rem)" }}
        >
          A place that grows in value while giving peace today.
        </p>

      <h6>Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusamus minus neque accusantium quibusdam sequi veritatis, deleniti doloribus quia fugit et autem incidunt exercitationem minima, quos rem nobis voluptatibus ex praesentium.</h6>

       <a   href="#"
          className="text-white/80 hover:text-white transition-colors"
          style={{
            fontSize: "clamp(0.85rem, 1vw, 1rem)",
            letterSpacing: "0.1em",
            textDecoration: "underline",
            textUnderlineOffset: "5px",
            fontFamily: "'Georgia', serif",
          }}
        >
          View All
        </a>
      </div>
    </section>
  )
}

export default TestimonialSection