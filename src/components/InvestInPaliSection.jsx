import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import palilandscape from "../assets/images/newlandscapeimg.png"

gsap.registerPlugin(ScrollTrigger);

const InvestInPaliSection = () => {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const paragraphRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Timeline for coordinated entrance animations
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      });

      // 1. Heading slide in from left
      tl.fromTo(
        headingRef.current,
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 1, ease: 'power3.out' }
      )
      // 2. Paragraph fade in from right
      .fromTo(
        paragraphRef.current,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 1, ease: 'power3.out' },
        '-=0.7'
      )
      // 3. Bottom landscape image smooth fade & slight parallax lift
      .fromTo(
        imageRef.current,
        { opacity: 0, y: 60, scale: 1.05 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power2.out' },
        '-=0.8'
      );
    }, sectionRef);

    return () => ctx.revert(); // Clean up GSAP animations on unmount
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full text-white overflow-hidden flex flex-col justify-between pt-0 md:pt-24 lg:pt-5"
    >
      {/* Upper Content Grid Container */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Heading */}
        <div className="md:col-span-6 lg:col-span-5">
          <h2
            ref={headingRef}
            className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.15] text-[#D4AF37] mt-10 tracking-wide font-medium"
          >
            Why should <br className="hidden sm:block" />
            invest in Pali
          </h2>
        </div>

        {/* Right Column: Paragraph Text */}
        <div className="md:col-span-6 lg:col-span-7 md:pt-2 lg:pt-4">
          <p
            ref={paragraphRef}
            className="text-gray-200 text-sm sm:text-base md:text-[15px] lg:text-base leading-relaxed sm:leading-loose font-light max-w-2xl"
          >
            Sarasview by Grow Farms is a sprawling 140-acre residential farmland
            development located in the peaceful surroundings of Aptavane Village,
            just 2 km away from the historic Pali city in Maharashtra. This project
            provides an ideal opportunity for nature lovers and investors alike to own
            a piece of pristine land. It offers scenic river-touch plots, making it a
            perfect retreat for those who seek tranquility, yet desire modern
            conveniences close by.
          </p>
        </div>

      </div>

      {/* Bottom Landscape Image Container with Blend Gradient */}
      {/* <div className="relative w-full mt-12 sm:mt-16 md:mt-24 pointer-events-none"> */}
        {/* Top Gradient Overlay to blend seamlessly into the background */}



        {/* Landscape Image */}
        <div ref={imageRef} className="w-full overflow-hidden">
          <img
          src={palilandscape}
          alt="Valley and landscape"
          className="w-full h-[200px]  sm:h-[420px] md:h-[500px] lg:h-[380px] object-cover object-bottom"
          />

                {/* Top landscape image, fading into the dark green background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#254229]/10 to-[#254229]" />
        </div>
         
        {/* <div className="absolute bottm-0 left-0 w-full h-24 sm:h-36 md:h-20 bg-gradient-to-b from-[#2D4D32] via-[#2D4D32]/70 to-transparent z-10" /> */}
      {/* </div> */}
    </section>
  );
};

export default InvestInPaliSection;