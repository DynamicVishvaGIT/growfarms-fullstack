import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./styles/index.css";
import App from "./App";

// The panel is served from a sub-path (see `base` in vite.config.js), so the
// router has to strip that prefix before matching. Reading it back from
// BASE_URL keeps dev (localhost:5174/admin) and production on one source of
// truth; change the sub-path in vite.config.js alone.
const basename = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
