import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";
import { X, ArrowUpRight } from "lucide-react";
import { getLenis } from "../hooks/useSmoothScroll";
import {
  validateName,
  validateEmail,
  validatePhone,
  validateMessage,
  compactErrors,
  fieldClass,
} from "../lib/validation";
import { submitEnquiry, toFormErrors } from "../lib/api";

const EMPTY_FORM = { name: "", email: "", phone: "", message: "" };

// Order matters: used to focus the first invalid field on submit.
const FIELD_ORDER = ["name", "email", "phone", "message"];

function validateField(field, values) {
  switch (field) {
    case "name":
      return validateName(values.name);
    case "email":
      return validateEmail(values.email);
    case "phone":
      return validatePhone(values.phone);
    case "message":
      return validateMessage(values.message, { required: false, min: 10 });
    default:
      return "";
  }
}

function Field({ as: Tag = "input", rowRef, error, name, ...props }) {
  const id = `enquiry-${name}`;
  return (
    <div ref={rowRef}>
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

export default function EnquiryModal({ open, onClose, property }) {
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const overlayRef = useRef(null);
  const backdropRef = useRef(null);
  const cardRef = useRef(null);
  const rowsRef = useRef([]);

  // The overlay stays mounted so the exit animation can play out; `prevOpen`
  // tells us whether this run is an open, a close, or the initial idle state.
  const prevOpen = useRef(open);

  // ── Open / close animation ────────────────────────────────────────────────
  useLayoutEffect(() => {
    const wasOpen = prevOpen.current;
    prevOpen.current = open;

    const ctx = gsap.context(() => {
      const overlay = overlayRef.current;
      const rows = rowsRef.current.filter(Boolean);

      if (open) {
        gsap.set(overlay, { visibility: "visible" });
        const tl = gsap
          .timeline()
          .fromTo(
            backdropRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.35, ease: "power2.out" },
          )
          .fromTo(
            cardRef.current,
            { opacity: 0, y: 44, scale: 0.94 },
            { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" },
            "-=0.22",
          );

        if (rows.length) {
          tl.fromTo(
            rows,
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.055 },
            "-=0.3",
          );
        }
      } else if (wasOpen) {
        gsap
          .timeline({
            onComplete: () => {
              gsap.set(overlay, { visibility: "hidden" });
              setForm(EMPTY_FORM);
              setErrors({});
              setTouched({});
              setSendError("");
            },
          })
          .to(cardRef.current, {
            opacity: 0,
            y: 28,
            scale: 0.96,
            duration: 0.3,
            ease: "power2.in",
          })
          .to(
            backdropRef.current,
            { opacity: 0, duration: 0.25, ease: "power2.in" },
            "-=0.2",
          );
      } else {
        // Initial render — sit hidden without animating.
        gsap.set(overlay, { visibility: "hidden" });
        gsap.set([backdropRef.current, cardRef.current], { opacity: 0 });
      }
    }, overlayRef);

    return () => ctx.revert();
  }, [open]);

  // ── Lock page scroll (including Lenis) while open ─────────────────────────
  useEffect(() => {
    if (!open) return;
    const lenis = getLenis();
    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      lenis?.start();
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // ── Escape to close ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ── Validation ────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);

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

  const shake = () => {
    gsap.fromTo(
      cardRef.current,
      { x: -8 },
      { x: 0, duration: 0.45, ease: "elastic.out(1, 0.35)" },
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;

    setSendError("");

    const next = compactErrors({
      name: validateName(form.name),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      message: validateMessage(form.message, { required: false, min: 10 }),
    });

    setErrors(next);
    setTouched(Object.fromEntries(FIELD_ORDER.map((f) => [f, true])));

    if (Object.keys(next).length) {
      shake();
      const firstBad = FIELD_ORDER.find((f) => next[f]);
      cardRef.current?.querySelector(`[name="${firstBad}"]`)?.focus();
      return;
    }

    setSending(true);
    try {
      await submitEnquiry({
        source: "enquiry_modal",
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim() || undefined,
        // `property` is the map pin this modal was opened from.
        project_slug: property?.slug || property?.id || undefined,
        subject: property?.label || property?.title || undefined,
      });
      // The visitor is confirmed on the Thank You page rather than in place, so
      // close this modal on the way out and let the route carry the news.
      onClose();
      navigate("/thank-you", {
        replace: true,
        state: {
          source: "enquiry_modal",
          name: form.name.trim(),
          subject: property?.label || property?.title || undefined,
        },
      });
    } catch (err) {
      const fieldErrors = toFormErrors(err);
      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
        const firstBad = FIELD_ORDER.find((f) => fieldErrors[f]);
        if (firstBad) cardRef.current?.querySelector(`[name="${firstBad}"]`)?.focus();
      } else {
        setSendError(err.message || "Something went wrong. Please try again.");
      }
      shake();
    } finally {
      setSending(false);
    }
  };

  const title = property?.label ?? "";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6"
      style={{ pointerEvents: open ? "auto" : "none" }}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      aria-label={`Enquire about ${title}`}
    >
      <div
        ref={backdropRef}
        onClick={onClose}
        className="absolute inset-0"
        style={{
          background: "rgba(12,26,15,0.55)",
          backdropFilter: "blur(6px)",
        }}
      />

      <div
        ref={cardRef}
        className="relative max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-[#f7faf7] p-6 sm:p-8"
        style={{ boxShadow: "0 24px 70px rgba(0,0,0,0.35)" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close enquiry form"
          className="group absolute top-4 right-4 flex h-9 w-9 cursor-pointer items-center
            justify-center overflow-hidden rounded-full border border-gray-200 bg-white
            shadow-md transition-all duration-500 hover:scale-110 hover:rotate-180 active:scale-95"
        >
          <span
            className="absolute inset-0 scale-0 rounded-full bg-[#315537]
              transition-transform duration-500 group-hover:scale-100"
          />
          <X
            className="relative z-10 h-3.5 w-3.5 text-gray-600 transition-colors duration-500 group-hover:text-white"
            strokeWidth={2.5}
          />
        </button>

        <div ref={(el) => (rowsRef.current[0] = el)}>
          <span className="inline-block rounded-full bg-[#e4ede6] px-4 py-1.5 text-xs font-medium tracking-wide text-[#16281c]">
            Enquire Now
          </span>
          <h3
            className="mt-4 text-[#1a3d22]"
            style={{ fontSize: "clamp(1.4rem, 3vw, 1.85rem)", fontWeight: 600 }}
          >
            Interested in {title}?
          </h3>
          <p className="sub_font mt-2 text-sm leading-relaxed text-[#3d5040]">
            Share your details and our team will get back to you with plot
            availability and pricing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <Field
            rowRef={(el) => (rowsRef.current[1] = el)}
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.name}
            placeholder="Full Name"
            autoComplete="name"
            maxLength={60}
          />
          <Field
            rowRef={(el) => (rowsRef.current[2] = el)}
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
            rowRef={(el) => (rowsRef.current[3] = el)}
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
          <Field
            as="textarea"
            rowRef={(el) => (rowsRef.current[4] = el)}
            name="message"
            value={form.message}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.message}
            placeholder="Message (optional)"
            rows={4}
            maxLength={1000}
          />

          {sendError && (
            <p className="text-xs text-red-600" role="alert">
              {sendError}
            </p>
          )}

          <button
            ref={(el) => (rowsRef.current[5] = el)}
            type="submit"
            disabled={sending}
            className="mt-1 flex w-fit cursor-pointer items-center gap-2 rounded-full bg-[#315537]
              py-3.5 pr-7 pl-7 text-sm font-medium text-white shadow-md transition-colors hover:bg-[#16281c]
              disabled:cursor-not-allowed disabled:opacity-70"
          >
            {sending ? "Sending…" : "Send Enquiry"}
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </form>
      </div>
    </div>
  );
}
