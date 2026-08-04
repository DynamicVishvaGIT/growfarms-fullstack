import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    id: 1,
    question: "Can I use Spline for free?",
    answer:
      "Yes, totally! The Basic plan is free. You can have unlimited personal files and file viewers. Maximum 1 team project can be created with 2 team files and 2 editors. You also have access to the Spline Library and can publish your scenes with a Spline logo.",
  },
  {
    id: 2,
    question: "Why should I upgrade to Super or Super Team?",
    answer:
      "Upgrading gives you access to advanced features like custom domains, no Spline branding, unlimited team projects, priority support, and much more to power your professional workflow.",
  },
  {
    id: 3,
    question: "What payment methods can I use?",
    answer:
      "We accept all major credit and debit cards (Visa, Mastercard, Amex), as well as PayPal. All payments are securely processed and encrypted.",
  },
  {
    id: 4,
    question: "How does team billing work?",
    answer:
      "Team billing is calculated per seat. Each member added to your team will be charged at the same rate as your plan. You'll be billed at the start of each billing cycle for the total number of seats.",
  },
  {
    id: 5,
    question: "How can I cancel my subscription?",
    answer:
      "You can cancel your subscription at any time from your account settings under Billing. Your plan will remain active until the end of the current billing period.",
  },
  {
    id: 6,
    question: "Can I change from monthly to yearly?",
    answer:
      "Yes! You can switch from monthly to yearly billing at any time. The switch will take effect at the start of your next billing cycle and you'll enjoy a discounted annual rate.",
  },
  {
    id: 7,
    question: "How can I ask other questions about pricing?",
    answer:
      "Feel free to reach out to our support team via the in-app chat or email us at support@spline.design. We're happy to help with any pricing or billing questions.",
  },
  {
    id: 8,
    question: "Interested in Spline for Education?",
    answer:
      "We offer special plans for students and educators. Apply through our Education program page and get access to premium features at no cost or a significantly reduced rate.",
  },
];

/* ── Standalone icon — one SVG, two lines, vertical controlled by GSAP ── */
function AccordionIcon({ iconRef, hBarRef, vBarRef }) {
  return (
    <span
      ref={iconRef}
      className="relative flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full"
      style={{ background: "rgba(255,255,255,0.10)" }}
    >
      {/* Horizontal bar — always visible */}
      <span
        ref={hBarRef}
        className="absolute rounded-full"
        style={{
          width: 14, height: 2,
          background: "rgba(255,255,255,0.85)",
          top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
        }}
      />
      {/* Vertical bar — GSAP scales to 0 when open */}
      <span
        ref={vBarRef}
        className="absolute rounded-full"
        style={{
          width: 2, height: 14,
          background: "rgba(255,255,255,0.85)",
          top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          transformOrigin: "center center",
        }}
      />
    </span>
  );
}

function FAQItem({ faq, index, isOpen, onToggle }) {
  const itemRef     = useRef(null);
  const bodyRef     = useRef(null);
  const cardRef     = useRef(null);
  const questionRef = useRef(null);
  const iconRef     = useRef(null);
  const hBarRef     = useRef(null);
  const vBarRef     = useRef(null);
  const heightRef   = useRef(0);
  const rafRef      = useRef(null);

  const prefersReduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 1. Scroll reveal ─────────────────────────────────────────── */
  useEffect(() => {
    if (prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        itemRef.current,
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0,
          duration: 0.6,
          delay: index * 0.06,
          ease: "power3.out",
          scrollTrigger: {
            trigger: itemRef.current,
            start: "top 91%",
            toggleActions: "play none none none",
          },
        }
      );
    }, itemRef);
    return () => ctx.revert();
  }, [index]);

  /* ── 2. Open / close ─────────────────────────────────────────── */
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    if (isOpen) {
      /* measure */
      gsap.set(body, { height: "auto", opacity: 1 });
      const h = body.offsetHeight;
      gsap.set(body, { height: 0, opacity: 0 });
      heightRef.current = h;

      gsap.to(body, { height: h, opacity: 1, duration: 0.46, ease: "power3.out" ,});

      /* card background lift */
      gsap.to(cardRef.current, {
        background: "rgba(255,255,255,0.07)",
        duration: 0.3,
      });

      /* question → white */
      gsap.to(questionRef.current, { color: "#ffffff", duration: 0.22 });

      /* icon: circle brighter, vertical bar scales to 0 (→ minus) */
      gsap.to(iconRef.current, {
        background: "rgba(255,255,255,0.22)",
        duration: 0.25,
      });
      gsap.to(vBarRef.current, {
        scaleY: 0,
        duration: 0.28,
        ease: "power2.inOut",
      });
      gsap.to(hBarRef.current, {
        width: 14,
        background: "#ffffff",
        duration: 0.25,
      });
    } else {
      gsap.to(body, { height: 0, opacity: 0, duration: 0.35, ease: "power3.in" });

      gsap.to(cardRef.current, {
        background: "rgba(255,255,255,0.03)",
        duration: 0.3,
      });

      gsap.to(questionRef.current, { color: "#e8ede8", duration: 0.22 });

      gsap.to(iconRef.current, {
        background: "rgba(255,255,255,0.10)",
        duration: 0.25,
      });
      /* bring vertical bar back */
      gsap.to(vBarRef.current, {
        scaleY: 1,
        duration: 0.3,
        ease: "back.out(2)",
      });
      gsap.to(hBarRef.current, {
        background: "rgba(255,255,255,0.85)",
        duration: 0.25,
      });
    }
  }, [isOpen]);

  /* ── 3. Card mouse-move tilt ─────────────────────────────────── */
  const handleMouseMove = useCallback((e) => {
    if (prefersReduced()) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card) return;
      const { left, top, width, height } = card.getBoundingClientRect();
      const x = (e.clientX - left) / width  - 0.5;
      const y = (e.clientY - top)  / height - 0.5;
      gsap.to(card, {
        rotateX: -y * 3,
        rotateY:  x * 5,
        transformPerspective: 1000,
        duration: 0.4,
        ease: "power2.out", 
        force3D: false,  // ← add this
      });
    });     
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    gsap.to(cardRef.current, {
      rotateX: 0, rotateY: 0,
      duration: 0.55,
      ease: "elastic.out(1, 0.5)",
       force3D: false,  // ← add this
    });
    if (!isOpen) {
      gsap.to(questionRef.current, { color: "#e8ede8", duration: 0.2 });
      gsap.to(iconRef.current, { background: "rgba(255,255,255,0.10)", scale: 1, duration: 0.2 });
    }
  }, [isOpen]);

  const handleMouseEnter = useCallback(() => {
    if (!isOpen) {
      gsap.to(questionRef.current, { color: "#ffffff", duration: 0.18 });
    }
    gsap.to(iconRef.current, { scale: 1.12, duration: 0.2, ease: "back.out(2)" });
  }, [isOpen]);

  /* ── 4. Icon ripple on click ─────────────────────────────────── */
  const handleIconClick = useCallback((e) => {
    e.stopPropagation();
    const el = iconRef.current;
    if (!el) return;
    const ripple = document.createElement("span");
    ripple.style.cssText = `
      position:absolute;inset:0;border-radius:50%;
      background:rgba(255,255,255,0.3);
      transform:scale(0.4);pointer-events:none;
    `;
    el.style.position = "relative";
    el.appendChild(ripple);
    gsap.to(ripple, {
      scale: 2.2, opacity: 0, duration: 0.5, ease: "power2.out",
      onComplete: () => ripple.remove(),
    });
    onToggle();
  }, [onToggle]);

  return (
    <div
      ref={itemRef}
      className="w-full"
      style={{ opacity: 0 }}
    >
      <div
        ref={cardRef}
        className="w-full cursor-pointer"
        style={{
          borderRadius: 16,
          background: "rgba(255,255,255,0.03)",
          padding: "0 24px",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      
        onClick={onToggle}
      >
        {/* Question row */}
        <div className="flex w-full items-center justify-between gap-4 py-[22px]">
          <span
            ref={questionRef}
            className="text-sm font-normal leading-snug sm:text-[15px]"
            style={{ color: "#e8ede8" }}
          >
            {faq.question}
          </span>

          <AccordionIcon
            iconRef={iconRef}
            hBarRef={hBarRef}
            vBarRef={vBarRef}
          />
        </div>

        {/* Answer — GSAP height tween */}
        <div ref={bodyRef} style={{ height: 0, opacity: 0 }}>
          <p
            className="pb-6 text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.60)" }}
          >
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openId, setOpenId] = useState(1);
  const sectionRef          = useRef(null);
  const headingRef          = useRef(null);

  const toggle = useCallback((id) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  /* heading reveal */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: -20, letterSpacing: "0.35em" },
        {
          opacity: 1, y: 0, letterSpacing: "0.08em",
          duration: 0.75, ease: "power3.out",
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full mb-14 "
    >
      {/* Heading */}
      <h2
        ref={headingRef}
        className="mb-10 text-center text-white md:mb-12"
        style={{
          fontSize: "clamp(2rem, 5vw, 3rem)",
          fontWeight: 700,
          letterSpacing: "0.35em",
          opacity: 0,
        }}
      >
        FAQ
      </h2>

      {/* List */}
      <div className="mx-auto flex w-full max-w-[1235px] flex-col gap-[10px] px-4 sm:px-6 lg:px-8">
        {faqs.map((faq, i) => (
          <FAQItem
            key={faq.id}
            faq={faq}
            index={i}
            isOpen={openId === faq.id}
            onToggle={() => toggle(faq.id)}
          />
        ))}
      </div>
    </section>
  );
}