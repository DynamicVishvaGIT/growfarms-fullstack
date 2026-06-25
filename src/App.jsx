import { useState } from "react";
import ExploreButton from "./components/ExploreButton";
// import PageLoader from "./components/PageLoader";
import useSmoothScroll from "./hooks/useSmoothScroll";
import Home from "./pages/Home";

const App = () => {
  const [loading, setLoading] = useState(true);

  // ✅ One call here — applies smooth scroll to entire site
  useSmoothScroll();

  return (
    <>
          <ExploreButton />
          <Home />
    </>
  );
};

export default App;