import React, { useEffect, useRef } from "react";
import ContactBanner from "../assets/images/Contact_banner.png";
import logo_img from "../assets/images/grow-farms-logo.png";
import CardVector from "../assets/images/Vector__4_.png";
import contectSideimg from "../assets/images/Contact.jpg";

import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const infoCards = [
  {
    icon: Mail,
    title: "Mail us 24/7",
    lines: ["pbminfo@admin.com", "pbmadmin@info.com"],
  },
  {
    icon: Phone,
    title: "Call us 24/7",
    lines: [
      "Phone : (+55) 654 - 545 - 5418",
      "Mobile : (+01) 654 - 545 - 1235",
    ],
  },
  {
    icon: MapPin,
    title: "Our Locations",
    lines: ["4821 Ride Top, Anch St, Alaska", "997998, USA main city."],
  },
];

const Contact = () => {
  const sectionRef = useRef(null);
  const cardRefs = useRef([]);
  const imageRef = useRef(null);
  const formRef = useRef(null);
  const fieldRefs = useRef([]);
  const buttonRef = useRef(null);
  const mapRef = useRef(null);

  cardRefs.current = [];
  fieldRefs.current = [];

  const addCardRef = (el) => {
    if (el && !cardRefs.current.includes(el)) cardRefs.current.push(el);
  };
  const addFieldRef = (el) => {
    if (el && !fieldRefs.current.includes(el)) fieldRefs.current.push(el);
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRefs.current,
        { opacity: 0, y: 50, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        },
      );

      gsap.fromTo(
        imageRef.current,
        { opacity: 0, x: -60, scale: 1.05 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: imageRef.current,
            start: "top 85%",
          },
        },
      );

      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: formRef.current,
            start: "top 85%",
          },
        },
      );

      gsap.fromTo(
        fieldRefs.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: formRef.current,
            start: "top 75%",
          },
        },
      );

      // Map reveal — scale up from slightly small
      gsap.fromTo(
        mapRef.current,
        { opacity: 0, scale: 0.97, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: mapRef.current,
            start: "top 85%",
          },
        },
      );

      cardRefs.current.forEach((card) => {
        const bubble = card.querySelector(".arrow-bubble");
        if (!bubble) return;
        gsap.to(bubble, {
          y: -8,
          duration: 1.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleBubbleEnter = (e) => {
    gsap.to(e.currentTarget, {
      scale: 1.15,
      rotate: 45,
      duration: 0.35,
      ease: "back.out(2)",
    });
  };
  const handleBubbleLeave = (e) => {
    gsap.to(e.currentTarget, {
      scale: 1,
      rotate: 0,
      duration: 0.35,
      ease: "power2.out",
    });
  };

  const handleButtonEnter = () => {
    gsap.to(buttonRef.current, {
      scale: 1.03,
      paddingRight: 36,
      duration: 0.3,
      ease: "power2.out",
    });
  };
  const handleButtonLeave = () => {
    gsap.to(buttonRef.current, {
      scale: 1,
      paddingRight: 28,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    gsap.fromTo(
      buttonRef.current,
      { scale: 0.94 },
      { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.4)" },
    );
  };

  return (
    <section className="relative w-full overflow-hidden">
      {/* Banner Wrapper */}
      <div className="relative w-full h-[70vh] sm:h-[75vh] md:h-[80vh] overflow-hidden">
        <img
          src={ContactBanner}
          alt="Contact Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-center pt-6 md:pt-8 px-6 md:px-10">
          <img
            src={logo_img}
            alt="GrowFarms – Live with Nature"
            className="h-12 md:h-14 lg:h-16 w-auto object-contain"
          />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
          <h1
            className="text-white font-light tracking-[0.10em] text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
            style={{ textShadow: "0 4px 20px rgba(0,0,0,0.45)" }}
          >
            Contact Us
          </h1>
          <p className="text-white font-light">
            Get in Touch and Start Your Journey with Nature.
          </p>
        </div>

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

      <section
        ref={sectionRef}
        className="w-full px-4 py-10 sm:px-6 sm:py-14 lg:px-10 lg:py-16"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:gap-8">
          {/* Info Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {infoCards.map(({ icon: Icon, title, lines }) => (
              <div
                key={title}
                ref={addCardRef}
                className="relative px-6 py-10 shadow-sm sm:px-7"
              >
                <img
                  src={CardVector}
                  alt="cardVector"
                  className="absolute inset-0 h-full w-full"
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1e3a2b]">
                      <Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
                    </span>
                    <h3 className="text-lg font-semibold text-[#16281c] sm:text-xl">
                      {title}
                    </h3>
                  </div>

                  <div className="mt-5 border-t border-gray-100 pt-5">
                    {lines.map((line) => (
                      <p
                        key={line}
                        className="text-[13px] leading-6 text-gray-500 sm:text-sm"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={`${title} - open`}
                  onMouseEnter={handleBubbleEnter}
                  onMouseLeave={handleBubbleLeave}
                  className="
                    arrow-bubble absolute
                    -bottom-2 right-6
                    z-20 flex h-11 w-11
                    items-center justify-center
                    rounded-full bg-white
                    text-[#1e3a2b]
                    shadow-md ring-1 ring-black/5
                    sm:right-0
                  "
                >
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>

          {/* Image + Form Panel */}
          <div className="flex flex-col mt-5 overflow-hidden rounded-[2rem] bg-white lg:flex-row">
            <div
              ref={imageRef}
              className="relative h-72 w-full sm:h-96 lg:h-[100vh] lg:w-[40%]"
            >
              <img
                src={contectSideimg}
                alt="Aerial view of a green homestead and vegetable gardens"
                className="h-full w-full object-cover"
              />
            </div>

            <div
              ref={formRef}
              className="relative w-full px-6 py-8 sm:px-10 sm:py-10 lg:w-[60%] lg:px-12 lg:py-12"
            >
              <span
                ref={addFieldRef}
                className="inline-block rounded-full bg-[#f3f0e8] px-4 py-1.5 text-xs font-medium tracking-wide text-[#16281c]"
              >
                Get To Contact Us
              </span>

              <h2
                ref={addFieldRef}
                className="mt-4 font-serif text-3xl leading-tight text-[#1e3a2b] sm:text-4xl"
              >
                Have a any Questions?
                <br />
                Get in Touch!
              </h2>

              <form
                onSubmit={handleSubmit}
                className="relative mt-7 flex flex-col gap-4"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    ref={addFieldRef}
                    type="text"
                    placeholder="First Name"
                    autoFocus
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#1e3a2b] transition"
                  />
                  <input
                    ref={addFieldRef}
                    type="text"
                    placeholder="Last Number"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#1e3a2b] transition"
                  />
                  <input
                    ref={addFieldRef}
                    type="email"
                    placeholder="Email Address"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#1e3a2b] transition"
                  />
                  <input
                    ref={addFieldRef}
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#1e3a2b] transition"
                  />
                </div>

                <textarea
                  ref={addFieldRef}
                  placeholder="Messages"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#1e3a2b] transition"
                />

                <button
                  ref={buttonRef}
                  type="submit"
                  onMouseEnter={handleButtonEnter}
                  onMouseLeave={handleButtonLeave}
                  className="mt-1 flex w-fit items-center gap-2 rounded-full bg-[#315537] py-3.5 pl-7 pr-7 text-sm font-medium text-white shadow-md transition-colors hover:bg-[#16281c]"
                >
                  Send Massage
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
      {/* Map Section */}
      <div
        // ref={mapRef}
        className="overflow-hidden shadow-sm"
      >
        {/* Iframe */}
        <div className="relative h-[420px] w-full sm:h-[500px]">
          <iframe
            src="https://www.google.com/maps?q=Mumbai,Maharashtra,India&output=embed"
            width="100%"
            height="500px"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mumbai Map"
          />
        </div>
      </div>
    </section>
  );
};

export default Contact;
