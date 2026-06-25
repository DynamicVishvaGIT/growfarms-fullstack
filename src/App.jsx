import { useState } from "react";
import ExploreButton from "./components/ExploreButton";
import PageLoader from "./components/PageLoader";
import useSmoothScroll from "./hooks/useSmoothScroll";
import Home from "./pages/Home";

const App = () => {
  const [loading, setLoading] = useState(true);

  useSmoothScroll();

  return (
    <>
      {/* ── Loader overlay ── */}
      <PageLoader
        loading={loading}
        onDone={() => setLoading(false)}
        duration={2800}
      />

      {/*
        ── Main site ──
        Always rendered in the DOM so HomeBanner's frames start
        preloading immediately behind the loader.
        visibility:hidden keeps it fully painted but invisible
        until the loader is done — zero white flash.
      */}
      <div
        style={{
          visibility: loading ? "hidden" : "visible",
        }}
      >
        <ExploreButton />
        <Home />
      </div>
    </>
  );
};

export default App;