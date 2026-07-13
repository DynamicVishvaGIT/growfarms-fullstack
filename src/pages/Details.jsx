import React from "react";
import DetailsBanner from "../assets/images/Details_Banner.png";

const Details = () => {
  return (
    <section className="relative w-full overflow-hidden">

      {/* Banner Wrapper */}
      <div
        className="
          relative w-full
          h-[70vh]
          sm:h-[75vh]
          md:h-[80vh]
          overflow-hidden
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
          "
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
            "
            style={{
              textShadow: "0 4px 20px rgba(0,0,0,0.45)",
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

    </section>
  );
};

export default Details;