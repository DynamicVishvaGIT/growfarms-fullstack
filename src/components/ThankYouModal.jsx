import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { Check, X } from "lucide-react";
import { getLenis } from "../hooks/useSmoothScroll";

/**
 * The confirmation a visitor sees once an enquiry has actually been accepted.
 *
 * Both public forms redirect to the Thank You page rather than confirming in
 * place, so this modal is the only thing that tells the visitor their message
 * landed. It opens on arrival and stays until dismissed; closing it leaves the
 * visitor on the Thank You page, which says the same thing more quietly.
 *
 * The open/close choreography deliberately mirrors EnquiryModal — the same
 * backdrop, the same card, the same spring on the tick — so a redirect reads
 * as the end of that form rather than as a different piece of UI.
 */
export default function ThankYouModal({ open, onClose, heading, body }) {
  const overlayRef = useRef(null);
  const backdropRef = useRef(null);
  const cardRef = useRef(null);
  const closeRef = useRef(null);

  // The overlay stays mounted so the exit animation can play out; `prevOpen`
  // tells us whether this run is an open, a close, or the initial idle state.
  const prevOpen = useRef(open);

  // ── Open / close animation ──────────────────────────────────────────────
  useLayoutEffect(() => {
    const wasOpen = prevOpen.current;
    prevOpen.current = open;

    const ctx = gsap.context(() => {
      const overlay = overlayRef.current;

      if (open) {
        gsap.set(overlay, { visibility: "visible" });
        gsap
          .timeline()
          .fromTo(
            backdropRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.3, ease: "power2.out" },
          )
          .fromTo(
            cardRef.current,
            { opacity: 0, y: 28, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" },
            "-=0.15",
          )
          .fromTo(
            "[data-tick]",
            { scale: 0 },
            { scale: 1, duration: 0.5, ease: "back.out(2)" },
            "-=0.25",
          );
      } else if (wasOpen) {
        gsap
          .timeline({
            onComplete: () => gsap.set(overlay, { visibility: "hidden" }),
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

  // ── Lock page scroll (including Lenis) while open ────────────────────────
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

  // ── Escape to close, and move focus onto the dialog on arrival ───────────
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6"
      style={{ pointerEvents: open ? "auto" : "none" }}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      aria-label={heading}
    >
      <div
        ref={backdropRef}
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(12,26,15,0.55)", backdropFilter: "blur(6px)" }}
      />

      <div
        ref={cardRef}
        className="relative max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-[#f7faf7] p-6 sm:p-8"
        style={{ boxShadow: "0 24px 70px rgba(0,0,0,0.35)" }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close confirmation"
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

        <div className="flex flex-col items-center py-10 text-center">
          <div
            data-tick
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#315537]"
          >
            <Check className="h-8 w-8 text-white" strokeWidth={3} />
          </div>

          <h2 className="text-2xl text-[#1a3d22]" style={{ fontWeight: 600 }}>
            {heading}
          </h2>

          <p className="sub_font mt-2 max-w-[340px] text-sm leading-relaxed text-[#3d5040]">
            {body}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-7 cursor-pointer rounded-full bg-[#315537] px-8 py-3 text-sm
              font-medium text-white transition-colors hover:bg-[#16281c]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
