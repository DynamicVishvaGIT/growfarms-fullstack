import { useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContactBanner from "../assets/images/Contact_banner.png";
import logo_img from "../assets/images/grow-farms-logo.png";
import CardVector from "../assets/images/Vector__4_.png";
import contectSideimg from "../assets/images/Contact.jpg";

import { Mail, Phone, MapPin, Clock, MessageCircle, ArrowUpRight } from "lucide-react";
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

/** Icon components keyed by the name stored against each contact card. */
const CARD_ICONS = {
  mail: Mail,
  phone: Phone,
  map: MapPin,
  clock: Clock,
  message: MessageCircle,
};

const FALLBACK_INFO_CARDS = [
  {
    icon: "mail",
    Icon: Mail,
    title: "Mail us 24/7",
    lines: ["pbminfo@admin.com", "pbmadmin@info.com"],
    href: "mailto:pbminfo@admin.com",
  },
  {
    icon: "phone",
    Icon: Phone,
    title: "Call us 24/7",
    lines: [
      "Phone : (+55) 654 - 545 - 5418",
      "Mobile : (+01) 654 - 545 - 1235",
    ],
    href: "tel:+556545455418",
  },
  {
    icon: "map",
    Icon: MapPin,
    title: "Our Locations",
    lines: ["4821 Ride Top, Anch St, Alaska", "997998, USA main city."],
    // Kept in step with the other two so the design's third bubble is still
    // there when the backend is unreachable.
    href: "https://www.google.com/maps/search/?api=1&query=4821%20Ride%20Top%2C%20Anch%20St%2C%20Alaska",
  },
];

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

/**
 * A card the admin left with no lines of its own borrows them from
 * Settings → Contact details, which is the same pair the footer shows.
 */
function linesFromSettings(icon, settings) {
  if (!settings) return [];
  if (icon === "mail") {
    return [settings.contact_email_1, settings.contact_email_2].filter(Boolean);
  }
  if (icon === "phone") {
    return [settings.contact_phone_1, settings.contact_phone_2].filter(Boolean);
  }
  if (icon === "map" && settings.contact_address) {
    return splitAddress(settings.contact_address);
  }
  return [];
}

const EMAIL_IN_TEXT = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_IN_TEXT = /\+?\d[\d\s().-]{6,}/;

/**
 * Where a card's arrow bubble goes. An explicit link from the admin wins;
 * otherwise a mail card opens its first address, a phone card dials its first
 * number, and an address card opens the map — the saved map link if there is
 * one, else a Maps search for the address itself.
 */
function cardHref(card, settings) {
  if (card.link) return card.link.trim();

  const first = card.lines[0] || "";

  if (card.icon === "mail") {
    const match = first.match(EMAIL_IN_TEXT);
    return match ? `mailto:${match[0]}` : "";
  }

  if (card.icon === "phone") {
    const match = first.match(PHONE_IN_TEXT);
    return match ? `tel:${match[0].replace(/[^\d+]/g, "")}` : "";
  }

  if (card.icon === "map") {
    if (settings?.google_map_link) return settings.google_map_link;
    const address = settings?.contact_address || card.lines.join(", ");
    return address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : "";
  }

  return "";
}

const FALLBACK_MAP = {
  embed: "https://www.google.com/maps?q=Mumbai,Maharashtra,India&output=embed",
  link: "",
};

const Contact = () => {
  /* ---------- Page-wide ref (scopes the GSAP context) ---------- */
  const pageRef = useRef(null);

  // Admin -> Contact Page owns the cards; Settings -> Contact details fills in
  // any card whose lines were left blank, which is what the footer reads too.
  const { data: infoCards } = useApiData(async (signal) => {
    const [settings, grouped] = await Promise.all([
      getSettings(signal),
      getContent("contact", signal),
    ]);
    if (!settings && !grouped) return null;

    const stored = contentBlock(grouped, "contact", "info_cards")?.extra_data?.cards;

    // With no saved cards the page still shows the designed three, filled from
    // Settings — the same arrangement the site shipped with.
    const source = stored?.length
      ? stored
      : FALLBACK_INFO_CARDS.map((c) => ({ icon: c.icon, title: c.title, lines: [], link: "" }));

    const cards = source
      .map((card, i) => {
        const icon = card.icon || FALLBACK_INFO_CARDS[i]?.icon || "mail";
        const lines = card.lines?.length ? card.lines : linesFromSettings(icon, settings);
        const resolved = { ...card, icon, lines };
        return {
          icon,
          Icon: CARD_ICONS[icon] || Mail,
          title: card.title || FALLBACK_INFO_CARDS[i]?.title || "",
          lines: lines.length ? lines : FALLBACK_INFO_CARDS[i]?.lines || [],
          href: cardHref(resolved, settings),
        };
      })
      // A card with neither a heading nor a line would render as an empty
      // shape, so drop it rather than leave a gap in the row.
      .filter((c) => c.title || c.lines.length);

    return cards.length ? cards : null;
  }, FALLBACK_INFO_CARDS);

  const { data: mapSettings } = useApiData(async (signal) => {
    const settings = await getSettings(signal);
    if (!settings) return null;
    return {
      embed: settings.google_map_embed || FALLBACK_MAP.embed,
      link: settings.google_map_link || "",
    };
  }, FALLBACK_MAP);

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
            {infoCards.map(({ Icon, title, lines, href }, i) => (
              <div
                key={`${title}-${i}`}
                ref={addCardRef}
                // The vector shape stretches to whatever the card ends up
                // being, so the text below only has to wrap rather than fit:
                // `min-w-0` lets it, and the padding keeps it clear of the
                // arrow bubble in the cut-out corner.
                className="relative flex min-w-0 flex-col px-6 pb-12 pt-10 shadow-sm sm:px-7"
              >
                <img
                  src={CardVector}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full"
                />

                <div className="relative z-10 min-w-0">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1e3a2b]">
                      <Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
                    </span>
                    <h3 className="min-w-0 hyphens-auto break-words text-lg font-semibold text-[#16281c] sm:text-xl">
                      {title}
                    </h3>
                  </div>

                  <div className="mt-5 min-w-0 border-t border-gray-100 pr-10 pt-5 sm:pr-12">
                    {lines.map((line, lineIndex) => (
                      <p
                        key={`${line}-${lineIndex}`}
                        // An address or a long address line has to break
                        // inside the word if that is what it takes — spilling
                        // outside the card shape is the one thing it must not
                        // do.
                        className="break-words [overflow-wrap:anywhere] text-[13px] leading-6 text-gray-500 sm:text-sm"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                {href && (
                  <a
                    href={href}
                    // Only an off-site map link leaves the tab; mailto: and
                    // tel: hand off to the visitor's own apps.
                    target={/^https?:/i.test(href) ? "_blank" : undefined}
                    rel={/^https?:/i.test(href) ? "noreferrer" : undefined}
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
                  </a>
                )}
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
      <div ref={mapRef} className="relative overflow-hidden shadow-sm">
        {/* Iframe */}
        <div className="relative h-[420px] w-full sm:h-[500px]">
          <iframe
            src={mapSettings.embed}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Our location on Google Maps"
            className="h-full w-full"
          />

          {/* Only shown once a map link is saved in the admin panel. */}
          {mapSettings.link && (
            <a
              href={mapSettings.link}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-6 right-6 z-10 flex items-center gap-2 rounded-full bg-[#315537] px-6 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-[#16281c]"
            >
              Open in Google Maps
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default Contact;