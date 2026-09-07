import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import DetailsBanner from "../assets/images/Details_Banner.jpg";

import Hospital from "../assets/images/hospital.png";
import School from "../assets/images/school.png";
import College from "../assets/images/College.png";
import Store from "../assets/images/local_market.png";
import Highway from "../assets/images/Highway.png";

import FAQSection from "../components/FAQSection";
import AboutSarasview from "../components/Aboutsarasview";
import WhyChoose from "../components/WhyChoose";
import TestimonialSection from "../components/TestimonialSection";
import HowToBuyFarmLand from "../components/HowToBuyFarmLand";
import LandPackages from "../components/LandPackages";
import InvestInPaliSection from "../components/InvestInPaliSection";
import Amenitiessection from "../components/Amenitiessection";

import useApiData from "../hooks/useApiData";
import { getProject, getFeaturedProject } from "../lib/api";
import ProjectProvider from "../context/ProjectProvider";

import RoadIcon from "../assets/images/By_Road.png";
import TrainIcon from "../assets/images/By_Train.png";
import AirIcon from "../assets/images/By_Air.png";

/* ---------------------------------------------------------------------
   Content
--------------------------------------------------------------------- */

const FALLBACK_FACILITIES = [
  { img: Hospital, label: "Hospital" },
  { img: School, label: "School" },
  { img: College, label: "College" },
  { img: Store, label: "Local Market" },
  { img: Highway, label: "Highway" },
];


/* ---------------------------------------------------------------------
   useReveal
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
      {
        threshold,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
};

/* ---------------------------------------------------------------------
   Facility Card
--------------------------------------------------------------------- */

const FacilityCard = ({ img, label, index }) => {
  const [ref, visible] = useReveal(0.2);

  return (
    <div
      ref={ref}
      className="
        group
        flex flex-col
        items-center justify-center
        gap-3 sm:gap-4
        rounded-2xl
        px-3 py-6
        sm:px-4 sm:py-8
        cursor-pointer
        transition-all duration-500 ease-out
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
          w-10 h-10
          sm:w-16 sm:h-16
          md:w-20 md:h-20
          object-contain
          transition-transform duration-500 ease-out
          group-hover:scale-110
          group-hover:-rotate-3
        "
      />

      <span
        className="
          text-xs
          sm:text-sm
          md:text-[15px]
          font-semibold
          sub_font
          text-center
          transition-colors duration-300
        "
        style={{ color: "white" }}
      >
        {label}
      </span>
    </div>
  );
};

/* ---------------------------------------------------------------------
   Details Page
--------------------------------------------------------------------- */

const Details = () => {
  const [heroVisible, setHeroVisible] = useState(false);
  const { slug } = useParams();

  // No slug (a bare /details link) falls back to the featured project, which
  // keeps every existing link working exactly as before.
  const { data: project } = useApiData(
    (signal) => (slug ? getProject(slug, signal) : getFeaturedProject(signal)),
    null,
    [slug],
  );

  const facilities =
    project?.facilities?.length
      ? project.facilities.map((f) => ({ img: f.icon_image_url, label: f.name }))
      : FALLBACK_FACILITIES;

  const bannerImage = project?.hero_image_url || DetailsBanner;
  const projectTitle = project?.title || "Sarasview";

  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ProjectProvider project={project}>
    <section className="relative w-full min-h-screen overflow-x-hidden">
      {/* ---------------------------------------------------------------
          Banner
      ---------------------------------------------------------------- */}

      <div
        className="
          relative
          w-full
          overflow-hidden
          h-[60vh]
          sm:h-[70vh]
          md:h-screen
        "
      >
        {/* Banner Image */}
        <img
          src={bannerImage}
          alt={projectTitle}
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

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/20 z-[5]" />

        {/* Title */}
        <div
          className="
            absolute inset-0
            z-10
            flex items-center justify-center
            pb-20
            sm:pb-24
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
              textShadow: "0 4px 20px rgba(0,0,0,0.5)",
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible
                ? "translateY(0px)"
                : "translateY(20px)",
            }}
          >
            {projectTitle}
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
            height: "clamp(120px, 40%, 280px)",
            background: `
              linear-gradient(
                180deg,
                rgba(49,85,55,0) 0%,
                rgba(49,85,55,0.3) 30%,
                rgba(49,85,55,0.7) 65%,
                #315537 100%
              )
            `,
          }}
        />
      </div>

      {/* ---------------------------------------------------------------
          Content
      ---------------------------------------------------------------- */}

      <AboutSarasview />

      <WhyChoose />

      {/* ---------------------------------------------------------------
          Local Facilities
      ---------------------------------------------------------------- */}

      <div className="relative w-full bg-[#315537]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-12 sm:py-16">
          <h2
            className="
              text-center
              font-medium
              tracking-wide
              text-2xl
              sm:text-3xl
              md:text-[2rem]
              text-white
            "
            style={{
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
              grid-cols-3
              sm:grid-cols-5
              gap-3
              sm:gap-4
              md:gap-5
            "
          >
            {facilities.map(({ img, label }, index) => (
              <FacilityCard
                key={label}
                img={img}
                label={label}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------
          Remaining Sections
      ---------------------------------------------------------------- */}

      <InvestInPaliSection />

      <Amenitiessection />

      <LandPackages />

      <HowToBuyFarmLand />

      <TestimonialSection />

      <FAQSection />
    </section>
    </ProjectProvider>
  );
};

export default Details;