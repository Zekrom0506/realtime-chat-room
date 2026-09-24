import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// during development the React app runs on port 5173 and the
// backend runs on port 5000, so we forward /api and /ws to the backend
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
      },
      "/ws": {
        target: "ws://localhost:5000",
        ws: true,
      },
    },
  },
});
