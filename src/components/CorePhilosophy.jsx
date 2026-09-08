/**
 * GrowFarms – Core Philosophy Section
 * Stack : React + Tailwind CSS (v3) + GSAP + ScrollTrigger
 */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useApiData from '../hooks/useApiData';
import { getPhilosophyCards } from '../lib/api';

gsap.registerPlugin(ScrollTrigger);

/* ── icons ── */
const MissionIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
    <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
  </svg>
);

const VisionIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ValuesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a9 9 0 0 1 9 9c0 3.5-2 6.5-5 8l-4 3-4-3C5 17.5 3 14.5 3 11a9 9 0 0 1 9-9z" />
    <path d="M12 6v6l3 3" />
  </svg>
);

const FALLBACK_CARDS = [
  {
    icon_key: 'mission',
    Icon: MissionIcon,
    title: 'Mission',
    body: 'To build lasting trust with customers and stakeholders through quality products and services. We drive growth and consistency to maintain a leading market reputation.',
  },
  {
    icon_key: 'vision',
    Icon: VisionIcon,
    title: 'Vision',
    body: 'Cultivating a future where agricultural investment is accessible, transparent, and environmentally restorative for generations to come.',
  },
  {
    icon_key: 'values',
    Icon: ValuesIcon,
    title: 'Values',
    body: 'Integrity in every transaction, consistency in our delivery, and an unwavering respect for the land that provides our wealth.',
  },
];

const ICONS = { mission: MissionIcon, vision: VisionIcon, values: ValuesIcon };

/** Deduplicate API rows — keep only first occurrence of each icon_key */
function dedupeByKey(rows) {
  const seen = new Set();
  return rows.filter((r) => {
    if (seen.has(r.icon_key)) return false;
    seen.add(r.icon_key);
    return true;
  });
}

export default function CorePhilosophy() {
  const { data: cards } = useApiData(
    async (signal) => {
      const rows = await getPhilosophyCards(signal);
      if (!rows?.length) return null;

      const unique = dedupeByKey(rows);          // ← fix duplicate rows
      return unique.map((r, i) => ({
        Icon: ICONS[r.icon_key] || FALLBACK_CARDS[i % FALLBACK_CARDS.length].Icon,
        title: r.title,
        body: r.body || '',
      }));
    },
    FALLBACK_CARDS,
  );

  const sectionRef  = useRef(null);
  const headingRef  = useRef(null);
  const subtitleRef = useRef(null);
  const cardsRef    = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [headingRef.current, subtitleRef.current],
        { opacity: 0, y: -36 },
        {
          opacity: 1, y: 0, duration: 0.82, ease: 'power3.out', stagger: 0.14,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
        }
      );

      gsap.fromTo(
        cardsRef.current,
        { opacity: 0, y: 60 },
        {
          opacity: 1, y: 0, duration: 0.78, ease: 'power3.out', stagger: 0.16,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', once: true },
        }
      );

      cardsRef.current.forEach((card) => {
        if (!card) return;
        const enter = () =>
          gsap.to(card, { y: -8, scale: 1.02, duration: 0.35, ease: 'power2.out',
            boxShadow: '0 24px 48px rgba(0,0,0,0.13)' });
        const leave = () =>
          gsap.to(card, { y: 0, scale: 1, duration: 0.35, ease: 'power2.out',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)' });
        card.addEventListener('mouseenter', enter);
        card.addEventListener('mouseleave', leave);
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-8 sm:py-8 lg:py-8 px-5 sm:px-8 lg:px-8 xl:px-10"
    >
      {/* dot texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="max-w-[1200px] mx-auto">

        {/* ── heading block ── */}
        <div className="text-center mb-12 sm:mb-14 lg:mb-16">
          <h2
            ref={headingRef}
            className="text-[2rem] sm:text-[2.5rem] lg:text-[2.9rem] font-semibold text-white mb-4"
          >
            Core Philosophy
          </h2>
          <p
            ref={subtitleRef}
            className="text-white/60 text-[0.95rem] sm:text-[1rem]"
            style={{ opacity: 0 }}
          >
            The pillars that sustain our growth and your investment.
          </p>
        </div>

        {/* ── cards grid — no items-start so rows stretch to equal height ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {cards.map(({ Icon, title, body }, i) => (
            <div
              key={title}
              ref={(el) => (cardsRef.current[i] = el)}
              className="bg-white rounded-2xl p-7 sm:p-[50px] flex flex-col gap-5 cursor-default overflow-hidden"
              style={{
                opacity: 0,
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                willChange: 'transform',
              }}
            >
              {/* icon badge */}
              <div className="w-10 h-10 rounded-full bg-[#EEF3EA] flex items-center justify-center text-[#2D5016] flex-shrink-0">
                <Icon />
              </div>

              {/* title */}
              <h3 className="text-[#2D5016] text-[1.35rem] sm:text-[1.45rem] font-semibold leading-tight">
                {title}
              </h3>

              {/* body — flex-1 pushes it to fill remaining card height */}
              <p className="text-gray-500 text-[0.88rem] sm:text-[0.92rem] leading-relaxed flex-1">
                {body}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}