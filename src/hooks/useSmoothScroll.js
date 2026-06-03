import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenisInstance = null;

export const getLenis = () => lenisInstance;

const useSmoothScroll = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration       : 1.2,          // scroll duration feel (higher = slower/smoother)
      easing         : (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo ease-out
      orientation    : "vertical",
      smoothWheel    : true,
      wheelMultiplier: 1,
      touchMultiplier: 2,            // slightly faster on touch for mobile feel
    });

    lenisInstance = lenis;

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis via GSAP ticker for frame-perfect sync
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    // Prevent GSAP ticker from lagging behind on blur/focus
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      lenisInstance = null;
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);
};

export default useSmoothScroll;