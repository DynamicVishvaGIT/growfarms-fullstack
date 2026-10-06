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

  // ── Page की height बदलते ही ScrollTrigger को फिर से measure करवाओ
  // Live पर API data और /uploads की images देर से आती हैं — sections बाद में
  // लंबे/छोटे होते हैं, जबकि triggers के start/end पहले ही नप चुके होते हैं।
  // तब animations गलत scroll position पर चलती हैं (बहुत पहले, या कभी नहीं)।
  // Body का ResizeObserver हर ऐसे बदलाव को पकड़ता है; image `load` event
  // capture phase में सुनते हैं क्योंकि वह bubble नहीं करता।
  useEffect(() => {
    let timer;
    let lastHeight = document.documentElement.scrollHeight;

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const height = document.documentElement.scrollHeight;
        // Pin spacers खुद height बदलते हैं — वही height दोबारा refresh न करे
        if (height === lastHeight) return;
        lastHeight = height;
        ScrollTrigger.refresh();
      }, 150);
    };

    const onLoad = (e) => {
      if (e.target instanceof HTMLImageElement) schedule();
    };

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    observer?.observe(document.body);
    document.addEventListener("load", onLoad, true);

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
      document.removeEventListener("load", onLoad, true);
    };
  }, []);

  return null;
};

export default ScrollRefresh;