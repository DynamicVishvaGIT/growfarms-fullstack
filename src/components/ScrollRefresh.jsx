import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "../hooks/useSmoothScroll";

/**
 * useScrollRefresh
 *
 * React Router navigation के बाद GSAP ScrollTrigger को
 * recalculate करता है और scroll position reset करता है।
 *
 * App.jsx में एक बार use करो:
 *   const App = () => {
 *     useScrollRefresh();
 *     ...
 *   }
 */
const ScrollRefresh = () => {
  const location = useLocation();

  useEffect(() => {
    // ── Scroll top पर reset करो, Lenis के through
    // Raw window.scrollTo सिर्फ native scrollbar move करता है — Lenis का
    // अपना internal state (targetScroll/animatedScroll/isScrolling) अलग
    // रहता है। अगर navigation के वक्त Lenis अभी भी mid-inertia था
    // (isScrolling === "smooth"), उसका RAF loop अगले tick पर page को वापस
    // पुराने (stale) target की तरफ खींच सकता है — reset से fight करते हुए.
    // lenis.scrollTo(0, {immediate:true}) उस loop को रोकता है और state को
    // synchronously resync करता है। Fallback सिर्फ defensive है (normal
    // mount order में Lenis useSmoothScroll() से पहले ही बन चुका होता है)।
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }

    // ── ScrollTrigger.refresh(true) — true मतलब "hard refresh"
    // यह सभी triggers को kill और recreate नहीं करता —
    // सिर्फ measurements (start/end positions) recalculate करता है
    // setTimeout नहीं — GSAP internally rAF use करता है
    ScrollTrigger.refresh(true);
  }, [location.pathname]);

  return null;
};

export default ScrollRefresh;