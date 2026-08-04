import React from 'react'
import logo_img from "../assets/images/grow-farms-logo.png";

const FooterSection = () => {
  return (
     <footer className="relative w-full sub_font overflow-hidden bg-[#224E28]">


  {/* Watermark — contained, no overflow */}
  <p
    className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap
      font-bold leading-none pointer-events-none select-none z-0"
    style={{
      fontSize: "clamp(3rem, 10vw, 9rem)",
      color: "#2B5F33",
      letterSpacing: "0.1em",     
    }}
  >
    GROW FARMS
  </p>

  {/* Content */}
  <div
    className="relative z-10 mx-auto w-full max-w-7xl px-8 md:px-16"  
    style={{ padding: "clamp(3rem, 5vw, 5rem) clamp(1.5rem, 6vw, 5rem)" }}
  >
    {/* Main Grid */}
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_1fr_1.6fr] gap-8 md:gap-12
      items-start mb-10 md:mb-14">

      {/* Logo */}
      <div className="flex flex-col items-start">
        <img
          src={logo_img}
          alt="Grow Farms"
          className="h-[70px] w-auto object-contain"
        />
      </div>

      {/* Navigation */}
      <div>
        <h3
          className="mb-4 text-white"
          style={{ fontSize: "1.05rem", fontWeight: 500, letterSpacing: "0.02em" }}
        >
          Navigation
        </h3>
        <ul className="space-y-2.5">
          {["Home", "About us", "Testimonials", "Blog"].map((item) => (
            <li key={item}>
              
             <a   href="#"
                className="text-white/65 text-sm hover:text-white transition-colors duration-200"
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Projects */}
      <div>
        <h3
          className="mb-4 text-white"
          style={{ fontSize: "1.05rem", fontWeight: 500, letterSpacing: "0.02em" }}
        >
          Our Projects
        </h3>
        <ul className="space-y-2.5">
          {["Sky Breeze", "Sarasview"].map((item) => (
            <li key={item}>
              
              <a  href="#"
                className="text-white/65 text-sm hover:text-white transition-colors duration-200"
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Address */}
      <div>
        <h3
          className="mb-4 text-white"
          style={{ fontSize: "1.05rem", fontWeight: 500, letterSpacing: "0.02em" }}
        >
          Reach to us
        </h3>
        <p className="text-white/65 text-sm leading-7 max-w-[300px]">
          Grow Farms 305, The Landmark, Next to Hotel Three Star,
          Sector 7, Kharghar, Navi Mumbai, Maharashtra 410210
        </p>
      </div>

    </div>

    {/* Divider + Copyright */}
    <div className="relative bottom-5 lg:bottom-15 ">
      <p className="text-center text-[10px] text-white tracking-widest uppercase">
        ©2026 Grow Farms. All rights reserved.
      </p>
    </div>

  </div>
</footer>
  )
}

export default FooterSection
