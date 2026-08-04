import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenisInstance = null;

export const getLenis = () => lenisInstance;


const useSmoothScroll = () => {

  useEffect(() => {

    // prevent duplicate Lenis instance
    if (lenisInstance) return;


    const lenis = new Lenis({
      duration: 1.2,

      easing: (t) =>
        Math.min(1, 1.001 - Math.pow(2, -10 * t)),

      orientation: "vertical",

      smoothWheel: true,

      wheelMultiplier: 1,

      touchMultiplier: 2,
    });


    lenisInstance = lenis;

    // Lenis scroll update GSAP
    const handleScroll = () => {
      ScrollTrigger.update();
    };

    lenis.on("scroll", handleScroll);

    // IMPORTANT
    // Keep same reference for cleanup
    const raf = (time) => {
      lenis.raf(time * 1000);
    };


    gsap.ticker.add(raf);


    gsap.ticker.lagSmoothing(0);



    return () => {


      // remove exact ticker
      gsap.ticker.remove(raf);



      lenis.off(
        "scroll",
        handleScroll
      );



      lenis.destroy();



      lenisInstance = null;



      ScrollTrigger.refresh(true);

    };


  }, []);


};


export default useSmoothScroll;