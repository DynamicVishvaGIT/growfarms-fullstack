import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
const useScrollRefresh = () => {
  const location = useLocation();

  useEffect(() => {
    // ── Scroll top पर reset करो
    // GSAP pin calculations scroll position पर depend करते हैं;
    // अगर scroll mid-page पर है तो trigger offsets गलत calculate होंगे
    window.scrollTo(0, 0);

    // ── ScrollTrigger.refresh(true) — true मतलब "hard refresh"
    // यह सभी triggers को kill और recreate नहीं करता —
    // सिर्फ measurements (start/end positions) recalculate करता है
    // setTimeout नहीं — GSAP internally rAF use करता है
    ScrollTrigger.refresh(true);
  }, [location.pathname]);
};

export default useScrollRefresh;