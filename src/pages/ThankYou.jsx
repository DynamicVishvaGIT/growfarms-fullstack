import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import ContactBanner from "../assets/images/Contact_banner.png";
import logo_img from "../assets/images/grow-farms-logo.png";
import ThankYouModal from "../components/ThankYouModal";

/**
 * Where both public forms land once the server has accepted an enquiry.
 *
 * The confirmation modal opens on arrival; the page underneath repeats it, so
 * dismissing the modal — or landing here from a bookmark or a back-button —
 * still leaves the visitor somewhere that makes sense.
 */

/** What each form calls itself when it redirects here. */
const BODY_COPY = {
  contact_page: "Your message has been sent. Our team will be in touch with you shortly.",
  enquiry_modal: "Your enquiry has been received. Our team will reach out to you shortly.",
};

const FALLBACK_BODY =
  "Your submission has been received. Our team will be in touch with you shortly.";

const ThankYou = () => {
  const { state } = useLocation();

  // A direct visit has no navigation state, so every field here is optional.
  const source = state?.source;
  const subject = state?.subject;
  const firstName = state?.name ? String(state.name).trim().split(/\s+/)[0] : "";

  const heading = firstName ? `Thank you, ${firstName}!` : "Thank you!";

  const body =
    source === "enquiry_modal" && subject
      ? `Your enquiry about ${subject} has been received. Our team will reach out to you shortly.`
      : BODY_COPY[source] || FALLBACK_BODY;

  const [modalOpen, setModalOpen] = useState(true);

  return (
    <section className="relative w-full overflow-hidden">
      {/* Banner Wrapper */}
      <div className="relative w-full h-[55vh] sm:h-[60vh] md:h-[65vh] overflow-hidden">
        <img
          src={ContactBanner}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-center pt-6 md:pt-8 px-6 md:px-10">
          <Link to="/" aria-label="GrowFarms home">
            <img
              src={logo_img}
              alt="GrowFarms – Live with Nature"
              className="h-12 md:h-14 lg:h-16 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <h1
            className="text-white font-light tracking-[0.10em] text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
            style={{ textShadow: "0 4px 20px rgba(0,0,0,0.45)" }}
          >
            Thank You
          </h1>
          <p className="text-white font-light">
            We have received your details and will be in touch soon.
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

      <section className="w-full px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] bg-white px-6 py-12 text-center sm:px-10 sm:py-16">
          <h2
            className="text-[#1a3d22]"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.1rem)", fontWeight: 600 }}
          >
            {heading}
          </h2>

          <p className="sub_font mx-auto mt-4 max-w-[460px] text-sm leading-relaxed text-[#3d5040] sm:text-base">
            {body}
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="flex w-fit items-center gap-2 rounded-full bg-[#315537] py-3.5 pl-7 pr-7
                text-sm font-medium text-white shadow-md transition-colors hover:bg-[#16281c]"
            >
              Back to Home
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>

            <Link
              to="/details"
              className="flex w-fit items-center gap-2 rounded-full border border-[#315537] py-3.5 pl-7 pr-7
                text-sm font-medium text-[#315537] transition-colors hover:bg-[#e4ede6]"
            >
              Explore Farmlands
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      <ThankYouModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        heading={heading}
        body={body}
      />
    </section>
  );
};

export default ThankYou;
