import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import ExploreButton from "./components/ExploreButton";
import PageLoader from "./components/PageLoader";
import useScrollRefresh from "./hooks/useSmoothScroll";

import Home from "./pages/Home";
import About from "./pages/About";
import Blogs from "./pages/Blogs";
import Testimonials from "./pages/Testimonials";
import Contact from "./pages/Contact";
import Details from "./pages/Details";
import ScrollRefresh from "./components/ScrollRefresh";

const App = () => {
  const [loading, setLoading] = useState(true);

  useSmoothScroll();

  // ✅ React Router change के बाद GSAP refresh
  ScrollRefresh();

  return (
    <>
      {/* Loader */}
      <PageLoader
        loading={loading}
        onDone={() => setLoading(false)}
        duration={2800}
      />

      {/* Main Website */}
      <div
        style={{
          visibility: loading ? "hidden" : "visible",
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
        </Routes>
      </div>
    </>
  );
};

export default App;