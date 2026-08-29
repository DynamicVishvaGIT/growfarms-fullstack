import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import ExploreButton from "./components/ExploreButton";
import ScrollRefresh from "./components/ScrollRefresh";
import PageLoader from "./components/PageLoader";

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

  const [loading,setLoading] = useState(true);

  // useSmoothScroll();

  return (
    <>
      <ScrollRefresh />

      <PageLoader
        loading={loading}
        onDone={()=>{
          setLoading(false);

          setTimeout(()=>{
            ScrollTrigger.refresh();
          },100);

        }}
        duration={2800}
      />


      <main
        style={{
          visibility: loading ? "hidden":"visible"
        }}
      >

        <ExploreButton />

        <Routes>

          <Route path="/" element={<Home/>}/>

          <Route path="/about" element={<About/>}/>

          <Route path="/blogs" element={<Blogs/>}/>

          <Route path="/testimonials" element={<Testimonials/>}/>

          <Route path="/contact" element={<Contact/>}/>

          <Route path="/details" element={<Details/>}/>

          <Route path="/blog-details" element={<BlogDetails/>}/>

        </Routes>


        <FooterSection />

      </main>

    </>
  );
};


export default App;