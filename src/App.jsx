import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import ExploreButton from "./components/ExploreButton";
import ScrollRefresh from "./components/ScrollRefresh";
import PageLoader from "./components/PageLoader";
import RouteTransition from "./components/RouteTransition";

import useSmoothScroll from "./hooks/useSmoothScroll";

import Home from "./pages/Home";
import About from "./pages/About";
import Blogs from "./pages/Blogs";
import Testimonials from "./pages/Testimonials";
import Contact from "./pages/Contact";
import Details from "./pages/Details";

import FooterSection from "./components/FooterSection";
import BlogDetails from "./components/BlogDetails";

const App = () => {
  // `revealed` flips as the loader panels start splitting — the page has to be
  // painted by then, because it is what the split reveals.
  const [revealed, setRevealed] = useState(false);

  // useSmoothScroll();

  return (
    <>
      <ScrollRefresh />

      <PageLoader
        onReveal={() => {
          setRevealed(true);
          ScrollTrigger.refresh();
        }}
        onDone={() => {
          ScrollTrigger.refresh();
        }}
        minDuration={2000}
      />

      <RouteTransition />

      <main
        style={{
          visibility: revealed ? "visible" : "hidden",
        }}
      >
        <ExploreButton />

        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/about" element={<About />} />

          <Route path="/blogs" element={<Blogs />} />

          <Route path="/testimonials" element={<Testimonials />} />

          <Route path="/contact" element={<Contact />} />

          <Route path="/details" element={<Details />} />

          <Route path="/blog-details" element={<BlogDetails />} />
        </Routes>

        <FooterSection />
      </main>
    </>
  );
};

export default App;
