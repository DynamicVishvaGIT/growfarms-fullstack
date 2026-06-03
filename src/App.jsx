import useSmoothScroll from './hooks/useSmoothScroll';
import Home from './pages/Home';

const App = () => {
    // ✅ One call here — applies smooth scroll to entire site
  useSmoothScroll();

  return (
    <>
    <Home/> 
    </>
  )
}

export default App