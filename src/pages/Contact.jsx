import { useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContactBanner from "../assets/images/Contact_banner.png";
import logo_img from "../assets/images/grow-farms-logo.png";
import CardVector from "../assets/images/Vector__4_.png";
import contectSideimg from "../assets/images/Contact.jpg";

import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  validateName,
  validateEmail,
  validatePhone,
  validateMessage,
  compactErrors,
  fieldClass,
} from "../lib/validation";
import { submitEnquiry, toFormErrors, getSettings, getContent, contentBlock } from "../lib/api";
import useApiData from "../hooks/useApiData";

gsap.registerPlugin(ScrollTrigger);

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
};

// Order matters: used to focus the first invalid field on submit.
const FIELD_ORDER = ["firstName", "lastName", "email", "phone", "message"];

function validateField(field, values) {
  switch (field) {
    case "firstName":
      return validateName(values.firstName, "first name");
    case "lastName":
      return validateName(values.lastName, "last name");
    case "email":
      return validateEmail(values.email);
    case "phone":
      return validatePhone(values.phone);
    case "message":
      return validateMessage(values.message, { required: true, min: 10 });
    default:
      return "";
  }
}

function Field({ as: Tag = "input", error, name, className = "", ...props }) {
  const id = `contact-${name}`;
  return (
    <div className={className}>
      <Tag
        id={id}
        name={name}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClass(!!error, Tag === "textarea" ? "resize-none" : "")}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const FALLBACK_INFO_CARDS = [
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

/** Icon components keyed by the name stored against each contact card. */
const CARD_ICONS = { mail: Mail, phone: Phone, map: MapPin };

/**
 * The location card is designed as two lines. Split a stored one-line address
 * near its middle comma so it keeps that shape whatever the admin types.
 */
function splitAddress(address) {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return [address];
  const mid = Math.ceil(parts.length / 2);
  return [parts.slice(0, mid).join(", "), parts.slice(mid).join(", ")];
}

const FALLBACK_MAP_EMBED =
  "https://www.google.com/maps?q=Mumbai,Maharashtra,India&output=embed";

const Contact = () => {
  /* ---------- Page-wide ref (scopes the GSAP context) ---------- */
  const pageRef = useRef(null);

  // Contact details live in Settings; the three-card layout itself comes from
  // the contact page's content block, so both stay editable.
  const { data: infoCards } = useApiData(async (signal) => {
    const [settings, grouped] = await Promise.all([
      getSettings(signal),
      getContent("contact", signal),
    ]);
    if (!settings && !grouped) return null;

    const stored = contentBlock(grouped, "contact", "info_cards")?.extra_data?.cards;

    if (settings) {
      const emails = [settings.contact_email_1, settings.contact_email_2].filter(Boolean);
      const phones = [settings.contact_phone_1, settings.contact_phone_2].filter(Boolean);
      const address = settings.contact_address;

      if (emails.length || phones.length || address) {
        return [
          {
            icon: Mail,
            title: stored?.[0]?.title || "Mail us 24/7",
            lines: emails.length ? emails : FALLBACK_INFO_CARDS[0].lines,
          },
          {
            icon: Phone,
            title: stored?.[1]?.title || "Call us 24/7",
            lines: phones.length ? phones : FALLBACK_INFO_CARDS[1].lines,
          },
          {
            icon: MapPin,
            title: stored?.[2]?.title || "Our Locations",
            // The footer renders the address as one line; the card splits it
            // across two the way the design does.
            lines: address ? splitAddress(address) : FALLBACK_INFO_CARDS[2].lines,
          },
        ];
      }
    }

    if (stored?.length) {
      return stored.map((c, i) => ({
        icon: CARD_ICONS[c.icon] || FALLBACK_INFO_CARDS[i]?.icon || Mail,
        title: c.title,
        lines: c.lines || [],
      }));
    }

    return null;
  }, FALLBACK_INFO_CARDS);

  const { data: mapEmbed } = useApiData(async (signal) => {
    const settings = await getSettings(signal);
    return settings?.google_map_embed || null;
  }, FALLBACK_MAP_EMBED);

  /* ---------- Section-level refs — same granularity as About.jsx ---------- */
  const cardsWrapRef = useRef(null); // whole info-cards grid, one block
  const imageRef = useRef(null); // side image panel
  const formRef = useRef(null); // form panel (heading + inputs together)
  const mapRef = useRef(null); // map section

  // Kept for the floating arrow-bubble query below (not used for stagger reveal)
  const cardRefs = useRef([]);
  const buttonRef = useRef(null);
  const formElRef = useRef(null); // the <form> element itself, for validation UX
  cardRefs.current = [];
  const addCardRef = (el) => el && cardRefs.current.push(el);

  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  /* ---------- GSAP ScrollTrigger — About.jsx-style section reveals ---------- */
  useLayoutEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          isMobile: "(max-width: 639px)",
          isDesktop: "(min-width: 640px)",
        },
        (context) => {
          const { isMobile } = context.conditions;
          const travel = isMobile ? 28 : 44;
          const dur = isMobile ? 0.65 : 0.85;

          // Shared helper — always fromTo so final state is explicit
          // (identical to the reveal() helper in About.jsx)
          const reveal = (el, extraFrom = {}, extraTo = {}, startPos = "top 85%") => {
            if (!el) return;
            gsap.fromTo(
              el,
              { y: travel, opacity: 0, ...extraFrom },
              {
                y: 0,
                opacity: 1,
                duration: dur,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: el,
                  start: startPos,
                  once: true,
                },
                ...extraTo,
              }
            );
          };

          reveal(cardsWrapRef.current, {}, {}, "top 82%");
          reveal(
            imageRef.current,
            { x: isMobile ? 0 : -60, y: isMobile ? travel : 0, scale: 1.05 },
            { x: 0, scale: 1, duration: 1 },
            "top 85%"
          );
          reveal(formRef.current, {}, {}, "top 85%");
          reveal(mapRef.current, { scale: 0.97 }, { scale: 1, duration: 1 }, "top 88%");

          // Continuous float on the arrow bubbles — unrelated to scroll reveal,
          // kept as an interactive/ambient animation like About's mouse parallax
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

          // Refresh after layout settles (identical to About.jsx)
          const images = pageRef.current
            ? Array.from(pageRef.current.querySelectorAll("img"))
            : [];
          let loaded = 0;
          const onLoad = () => {
            loaded += 1;
            if (loaded >= images.length) ScrollTrigger.refresh();
          };
          images.forEach((img) => {
            if (img.complete) onLoad();
            else {
              img.addEventListener("load", onLoad, { once: true });
              img.addEventListener("error", onLoad, { once: true });
            }
          });

          let resizeTimer;
          const onResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
          };
          window.addEventListener("resize", onResize);

          return () => {
            window.removeEventListener("resize", onResize);
            clearTimeout(resizeTimer);
            images.forEach((img) => {
              img.removeEventListener("load", onLoad);
              img.removeEventListener("error", onLoad);
            });
          };
        }
      );
    }, pageRef);

    return () => ctx.revert(); // kills all ScrollTriggers created inside ctx
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

  /* ---------- Form state + validation ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    if (sendError) setSendError("");

    // Only re-validate live once the field has been visited, so the user is
    // not scolded mid-keystroke on their first pass through the form.
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, next) }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, form) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;

    const next = compactErrors(
      Object.fromEntries(FIELD_ORDER.map((f) => [f, validateField(f, form)])),
    );

    setErrors(next);
    setTouched(Object.fromEntries(FIELD_ORDER.map((f) => [f, true])));

    if (Object.keys(next).length) {
      gsap.fromTo(
        formElRef.current,
        { x: -8 },
        { x: 0, duration: 0.45, ease: "elastic.out(1, 0.35)" },
      );
      const firstBad = FIELD_ORDER.find((f) => next[f]);
      formElRef.current?.querySelector(`[name="${firstBad}"]`)?.focus();
      return;
    }

    gsap.fromTo(
      buttonRef.current,
      { scale: 0.94 },
      { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.4)" },
    );

    setSending(true);
    setSendError("");

    try {
      await submitEnquiry({
        source: "contact_page",
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
      });

      // Confirmation lives on the Thank You page. `replace` keeps the filled-in
      // form out of the back stack, so Back cannot walk into a second submit.
      navigate("/thank-you", {
        replace: true,
        state: { source: "contact_page", name: form.firstName.trim() },
      });
    } catch (err) {
      // The API keys its errors by snake_case field names; map them back onto
      // the camelCase names this form uses.
      const fieldErrors = toFormErrors(err, {
        first_name: "firstName",
        last_name: "lastName",
      });

      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
        const firstBad = FIELD_ORDER.find((f) => fieldErrors[f]);
        if (firstBad) formElRef.current?.querySelector(`[name="${firstBad}"]`)?.focus();
      } else {
        setSendError(err.message || "Something went wrong. Please try again.");
      }

      gsap.fromTo(
        formElRef.current,
        { x: -8 },
        { x: 0, duration: 0.45, ease: "elastic.out(1, 0.35)" },
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <section ref={pageRef} className="relative w-full overflow-hidden">
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

      <section className="w-full px-4 py-10 sm:px-6 sm:py-14 lg:px-10 lg:py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:gap-8">
          {/* Info Cards */}
          <div
            ref={cardsWrapRef}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
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
              <span className="inline-block rounded-full bg-[#f3f0e8] px-4 py-1.5 text-xs font-medium tracking-wide text-[#16281c]">
                Get To Contact Us
              </span>

              <h2 className="mt-4 font-serif text-3xl leading-tight text-[#1e3a2b] sm:text-4xl">
                Have a any Questions?
                <br />
                Get in Touch!
              </h2>

              <form
                ref={formElRef}
                onSubmit={handleSubmit}
                className="relative mt-7 flex flex-col gap-4"
                noValidate
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.firstName}
                    placeholder="First Name"
                    autoComplete="given-name"
                    autoFocus
                    maxLength={60}
                  />
                  <Field
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.lastName}
                    placeholder="Last Name"
                    autoComplete="family-name"
                    maxLength={60}
                  />
                  <Field
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.email}
                    placeholder="Email Address"
                    autoComplete="email"
                    maxLength={254}
                  />
                  <Field
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.phone}
                    placeholder="Phone Number"
                    autoComplete="tel"
                    maxLength={20}
                  />
                </div>

                <Field
                  as="textarea"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.message}
                  placeholder="Messages"
                  rows={4}
                  maxLength={1000}
                />

                <button
                  ref={buttonRef}
                  type="submit"
                  disabled={sending}
                  onMouseEnter={handleButtonEnter}
                  onMouseLeave={handleButtonLeave}
                  className="mt-1 cursor-pointer flex w-fit items-center gap-2 rounded-full bg-[#315537] py-3.5 pl-7 pr-7 text-sm font-medium text-white shadow-md transition-colors hover:bg-[#16281c] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {sending ? "Sending…" : "Send Message"}
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </button>

                {sendError && (
                  <p role="alert" className="text-sm text-red-600">
                    {sendError}
                  </p>
                )}

              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <div ref={mapRef} className="overflow-hidden shadow-sm">
        {/* Iframe */}
        <div className="relative h-[420px] w-full sm:h-[500px]">
          <iframe
            src={mapEmbed}
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