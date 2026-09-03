import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Port 5174 keeps the admin panel clear of the public site on 5173.
export default defineConfig({
  // The panel ships inside the public site at growfarms.com/admin rather than
  // on its own subdomain, so every built asset URL needs that prefix. main.jsx
  // reads the same value back out of import.meta.env.BASE_URL for the router,
  // so this line is the only place the sub-path is written down.
  base: "/admin/",
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    host: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
