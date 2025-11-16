import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // Local development server only
  server: {
    host: "0.0.0.0",
    port: 5173,

    // ❗ LOCAL ONLY — remove backend:8000 mapping
    proxy: {
      // This helps ONLY in local dev
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true
      }
    }
  },

  // Build settings
  build: {
    outDir: "dist",
    sourcemap: false
  }
});
