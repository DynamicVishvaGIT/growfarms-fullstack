import React, { useEffect, useRef, useState } from "react";
import DetailsBanner from "../assets/images/Details_Banner.png";
import Hospital from "../assets/images/hospital.png";
import School from "../assets/images/School.png";
import College from "../assets/images/College.png";
import Store from "../assets/images/local_market.png";
import Highway from "../assets/images/Highway.png";
import WhyPaliSection from "../components/WhyPaliSection";
import FAQSection from "../components/FAQSection";
import TestimonialSection from "../components/TestimonialSection";
import HowToBuyFarmLand from "../components/HowToBuyFarmLand";
import LandPackages from "../components/LandPackages";
import RoadIcon from "../assets/images/By_Road.png";
import TrainIcon from "../assets/images/By_Train.png";
import AirIcon from "../assets/images/By_Air.png";
import Amenity1 from "../assets/images/aminities_1.png";
import Amenity2 from "../assets/images/aminities_2.png";
import Amenity3 from "../assets/images/aminities_3.png";
import Amenity4 from "../assets/images/aminities_4.png";
import Amenity5 from "../assets/images/aminities_5.png";
import Amenity6 from "../assets/images/aminities_6.png";
import Amenity7 from "../assets/images/aminities_7.png";
import Amenity8 from "../assets/images/aminities_8.png";

/* ---------------------------------------------------------------------
   Content — edit copy here without touching markup
--------------------------------------------------------------------- */
const ABOUT_BLOCKS = [
  {
    heading: "About Sarasview Project",
    body: "Sarasview by Grow Farms is a sprawling 140-acre residential farmland development located in the peaceful surroundings of Aptavane Village, just 2 km away from the historic Pali city in Maharashtra. This project provides an ideal opportunity for nature lovers and investors alike to own a piece of pristine land. It offers scenic river-touch plots, making it a perfect retreat for those who seek tranquility, yet desire modern conveniences close by.",
  },
  {
    heading: "Why Choose Sarasview?",
    body: "Pali is becoming a preferred destination for families, investors, and weekend home buyers because it offers a peaceful environment while staying well-connected to major cities. Unlike crowded urban areas, Pali provides open spaces, cleaner air, and a nature-centric lifestyle without sacrificing convenience.",
  },
];

const FACILITIES = [
  { img: Hospital, label: "Hospital" },
  { img: School, label: "School" },
  { img: College, label: "College" },
  { img: Store, label: "Local Market" },
  { img: Highway, label: "Highway" },
];

const ROUTES = [
  {
    icon: RoadIcon,
    label: "By Road",
    body: "Pali is approximately 112 kilometers away from Mumbai. You can drive by car or hire a taxi. State transport buses and private buses also operate between Mumbai and Pali.",
  },
  {
    icon: TrainIcon,
    label: "By Train",
    body: "Pali is approximately 112 kilometers away from Mumbai. You can drive by car or hire a taxi. State transport buses and private buses also operate between Mumbai and Pali.",
  },
  {
    icon: AirIcon,
    label: "By Air",
    body: "Pali is approximately 112 kilometers away from Mumbai. You can drive by car or hire a taxi. State transport buses and private buses also operate between Mumbai and Pali.",
  },
];

/* ---------------------------------------------------------------------
   useReveal — tiny IntersectionObserver hook for scroll-triggered
   fade/slide-in animations. Returns a ref to attach and a boolean
   for whether the element has entered the viewport.

   Shared by every section below — declared once here so nothing in
   this file redeclares it.
--------------------------------------------------------------------- */
const useReveal = (threshold = 0.2) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
};

/* ---------------------------------------------------------------------
   AboutBlock — self-contained so each block gets its own reveal ref
--------------------------------------------------------------------- */
const AboutBlock = ({ heading, body }) => {
  const [ref, visible] = useReveal(0.15);

  return (
    <div
      ref={ref}
      className="text-center transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(28px)",
      }}
    >
      <h2
        className="
          text-white
          font-medium
          tracking-wide
          text-2xl
          sm:text-3xl
          md:text-[2rem]
        "
        style={{ letterSpacing: "-0.005em" }}
      >
        {heading}
      </h2>

      <p
        className="
          mt-4
          sm:mt-5
          text-white/80
          text-[13px]
          sm:text-[14px]
          md:text-[15px]
          leading-[1.85]
          sub_font
        "
        style={{ letterSpacing: "0.01em" }}
      >
        {body}
      </p>
    </div>
  );
};

/* ---------------------------------------------------------------------
   FacilityCard — reveal + hover lift + icon bounce
--------------------------------------------------------------------- */
const FacilityCard = ({ img, label, index }) => {
  const [ref, visible] = useReveal(0.2);

  return (
    <div
      ref={ref}
      className="
        group
        flex
        flex-col
        items-center
        justify-center
        gap-4
        rounded-2xl
        border
        border-[#315537]/25
        bg-white
        px-4
        py-8
        cursor-pointer
        transition-all
        duration-500
        ease-out
        hover:border-[#315537]/60
        hover:shadow-lg
        hover:shadow-[#315537]/10
        hover:-translate-y-2
      "
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(0px) scale(1)"
          : "translateY(24px) scale(0.96)",
        transitionDelay: visible ? `${index * 90}ms` : "0ms",
      }}
    >
      <img
        src={img}
        alt={label}
        className="
          w-12 h-12 sm:w-20 sm:h-15
          object-contain
          transition-transform
          duration-500
          ease-out
          group-hover:scale-110
          group-hover:-rotate-3
        "
      />
      <span
        className="
          text-sm sm:text-[15px]
          font-semibold
          sub_font
          transition-colors
          duration-300
        "
        style={{ color: "#315537" }}
      >
        {label}
      </span>
    </div>
  );
};

/* ---------------------------------------------------------------------
   RouteCard — "How to reach Pali" cards
--------------------------------------------------------------------- */
const RouteCard = ({ icon, label, body, index }) => {
  const [ref, visible] = useReveal(0.25);

  return (
    <div
      ref={ref}
      className="group flex flex-col items-center text-center px-4 transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(24px)",
        transitionDelay: visible ? `${index * 140}ms` : "0ms",
      }}
    >
      <div
        className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 bg-white transition-all duration-300 ease-out group-hover:scale-110 group-hover:shadow-lg"
        style={{ borderColor: "#315537" }}
      >
        <img
          src={icon}
          alt={label}
          className="w-8 h-8 sm:w-10 sm:h-10 object-contain transition-transform duration-300 ease-out group-hover:-translate-y-0.5"
          draggable={false}
        />
      </div>

      <h3
        className="mt-5 sm:mt-6 font-medium tracking-wide text-xl sm:text-2xl"
        style={{
          color: "#315537",
        }}
      >
        {label}
      </h3>

      <p
        className="mt-3 sm:mt-4 sub-font text-[13px] sm:text-[14px] leading-[1.85] text-gray-600 sub_font max-w-xs"
        style={{ letterSpacing: "0.01em" ,color: "#315537",}}
      >
        {body}
      </p>
    </div>
  );
};

/* ---------------------------------------------------------------------
   ReachPali — "How to reach Pali" section
--------------------------------------------------------------------- */
const ReachPali = () => {
  const [headingRef, headingVisible] = useReveal(0.3);

  return (
    <section className="relative w-full bg-white">
      {/* Top gradient — blends into the green section above */}
      <div
        className="absolute top-0 left-0 w-full pointer-events-none z-10"
        style={{
          height: "clamp(70px, 18%, 0px)",
          background:
            "linear-gradient(180deg, #315537 0%, rgba(49,85,55,0.5) 45%, rgba(49,85,55,0) 100%)",
        }}
      />

      {/* Bottom gradient — blends into the green section below */}
      <div
        className="absolute bottom-0 left-0 w-full pointer-events-none z-10"
        style={{
          height: "clamp(70px, 18%, 0px)",
          background:
            "linear-gradient(0deg, #315537 0%, rgba(49,85,55,0.5) 45%, rgba(49,85,55,0) 100%)",
        }}
      />

      <div className="relative px-5 sm:px-8 py-24 sm:py-28 md:py-32">
        <h2
          ref={headingRef}
          className="text-center font-medium tracking-wide text-3xl sm:text-4xl md:text-[2.5rem] transition-all duration-700 ease-out"
          style={{
            color: "#315537",
            opacity: headingVisible ? 1 : 0,
            transform: headingVisible ? "translateY(0px)" : "translateY(-16px)",
          }}
        >
          How to reach Pali
        </h2>

        <div className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-14 sm:gap-8 md:gap-12">
          {ROUTES.map((route, index) => (
            <RouteCard key={route.label} {...route} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};


const INTRO_PARAGRAPHS = [
  "Skybreez Is More Than A Land Development Project. It Is A Professionally Planned 114-Acre Community Designed To Create A Secure And Sustainable Ownership Experience.",
  "Many Buyers Hesitate Because Of Unclear Documentation, Poor Infrastructure, And Unplanned Developments. Skybreez Addresses These Concerns By Offering A Structured Environment And Transparent Processes.",
];

const AMENITIES = [
  { img: Amenity1, label: "Water Facility" },
  { img: Amenity2, label: "Electricity Connection" },
  { img: Amenity3, label: "Gate Community" },
  { img: Amenity4, label: "Plantation at your farm" },
  { img: Amenity5, label: "24 x 7 Security" },
  { img: Amenity6, label: "Title Clear Project" },
  { img: Amenity7, label: "Common Garden" },
  { img: Amenity8, label: "Tar Road" },
];


/* ---------------------------------------------------------------------
   AmenityCard — reveal + hover lift + icon nudge
--------------------------------------------------------------------- */
const AmenityCard = ({ img, label, index }) => {
  const [ref, visible] = useReveal(0.2);

  return (
    <div
      ref={ref}
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl bg-white px-4 py-8 cursor-default transition-all duration-500 ease-out hover:shadow-xl hover:shadow-black/10 hover:-translate-y-2"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(0px) scale(1)"
          : "translateY(24px) scale(0.96)",
        transitionDelay: visible ? `${index * 70}ms` : "0ms",
      }}
    >
      <img
        src={img}
        alt={label}
        className="w-12 h-12 sm:w-14 sm:h-14 object-contain transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-3"
        draggable={false}
      />
      <span
        className="text-center text-sm sm:text-[15px] font-semibold sub_font leading-snug transition-colors duration-300"
        style={{ color: "#315537" }}
      >
        {label}
      </span>
    </div>
  );
};

// WhyInvestPali
const WhyInvestPali = () => {
  const [headingRef, headingVisible] = useReveal(0.3);
  const [introRef, introVisible] = useReveal(0.2);
  const [amenitiesHeadingRef, amenitiesHeadingVisible] = useReveal(0.3);

  return (
    <section className="relative w-full" style={{ background: "#315537" }}>
      <div className="px-5 max-w-6xl m-auto sm:px-8 py-16 sm:py-20 md:py-14">
        {/* Heading */}
        <h2
          ref={headingRef}
          className="text-center text-white font-medium tracking-wide text-3xl sm:text-4xl md:text-[2.5rem] transition-all duration-700 ease-out"
          style={{
            opacity: headingVisible ? 1 : 0,
            transform: headingVisible ? "translateY(0px)" : "translateY(-16px)",
          }}
        >
          Why Should Invest In Pali
        </h2>

        {/* Intro copy */}
        <div
          ref={introRef}
          className="mt-6 sm:mt-8 mx-auto max-w-3xl flex flex-col gap-4 transition-all duration-700 ease-out"
          style={{
            opacity: introVisible ? 1 : 0,
            transform: introVisible ? "translateY(0px)" : "translateY(16px)",
          }}
        >
          {INTRO_PARAGRAPHS.map((paragraph, i) => (
            <p
              key={i}
              className="text-center text-white/85 text-[13px] sm:text-[14px] md:text-[15px] leading-[1.85] sub_font"
              style={{ letterSpacing: "0.01em" }}
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Amenities heading */}
        <h3
          ref={amenitiesHeadingRef}
          className="mt-16 sm:mt-20 md:mt-24 text-center text-white font-medium tracking-wide text-2xl sm:text-3xl transition-all duration-700 ease-out"
          style={{
            opacity: amenitiesHeadingVisible ? 1 : 0,
            transform: amenitiesHeadingVisible
              ? "translateY(0px)"
              : "translateY(-12px)",
          }}
        >
          Aminities
        </h3>

        {/* Amenities grid */}
        <div className="mt-10 sm:mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {AMENITIES.map((amenity, index) => (
            <AmenityCard key={amenity.label} {...amenity} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Details = () => {
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    // trigger hero title animation shortly after mount
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);


  return (
    <section className="relative w-full min-h-screen">
      {/* Banner Wrapper */}
      <div
        className="
          relative w-full
          h-[70vh]
          sm:h-[75vh]
          md:h-[80vh]
        "
      >
        {/* Banner Image */}
        <img
          src={DetailsBanner}
          alt="Details Banner"
          className="
            absolute inset-0
            w-full h-full
            object-cover
            object-center
            transition-transform
            duration-[3000ms]
            ease-out
          "
          style={{
            transform: heroVisible ? "scale(1.05)" : "scale(1.15)",
          }}
        />

        {/* Content */}
        <div
          className="
            absolute
            inset-0
            z-10
            flex
            items-center
            justify-center
            pb-24
            sm:pb-28
            md:pb-10
            px-5
            text-center
          "
        >
          <h1
            className="
              text-white
              font-light
              tracking-wide
              text-3xl
              sm:text-4xl
              md:text-5xl
              lg:text-6xl
              transition-all
              duration-1000
              ease-out
            "
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              textShadow: "0 4px 20px rgba(0,0,0,0.45)",
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0px)" : "translateY(20px)",
            }}
          >
            Sarasview
          </h1>
        </div>

        {/* Bottom Gradient */}
        <div
          className="
            absolute
            bottom-0
            left-0
            w-full
            pointer-events-none
            z-20
          "
          style={{
            height: "clamp(90px, 25%, 220px)",
            background: `
              linear-gradient(
                180deg,
                rgba(49,85,55,0) 0%,
                rgba(49,85,55,0.25) 35%,
                rgba(49,85,55,0.65) 70%,
                #315537 100%
              )
            `,
          }}
        />
      </div>

      {/* ── About Sarasview ── */}
      <div className="relative w-full" style={{ background: "#315537" }}>
        <div
          className="
            mx-auto
            max-w-5xl
            px-5
            sm:px-8
            py-14
            sm:py-16
            md:py-20
            flex
            flex-col
            gap-12
            sm:gap-14
            md:gap-16
          "
        >
          {ABOUT_BLOCKS.map((block) => (
            <AboutBlock key={block.heading} {...block} />
          ))}
        </div>
      </div>

      {/* ── Local Facilities ── */}
      <div className="relative w-full bg-white">
        <div
          className="
            mx-auto
            max-w-6xl
            px-5
            sm:px-8
            py-14
            sm:py-16
            md:py-20
          "
        >
          <h2
            className="
              text-center
              font-medium
              tracking-wide
              text-2xl
              sm:text-3xl
              md:text-[2rem]
            "
            style={{
              color: "#315537",
              letterSpacing: "-0.005em",
            }}
          >
            Local Facilities
          </h2>

          <div
            className="
              mt-10
              sm:mt-12
              grid
              grid-cols-2
              sm:grid-cols-3
              md:grid-cols-5
              gap-4
              sm:gap-5
            "
          >
            {FACILITIES.map(({ img, label }, index) => (
              <FacilityCard key={label} img={img} label={label} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* why pali */}
      <WhyPaliSection />

      {/* ReachPali */}
      <ReachPali />

      {/* WhyInvestPali */}
      <WhyInvestPali/>

      {/* LandPackages */}
      <LandPackages/>

      {/* HowBuy */}
      <HowToBuyFarmLand/>

      {/* Testimonial */}
      <TestimonialSection/>


      {/* FAQSection */}
      <FAQSection/>

    </section>
  );
};

export default Details;