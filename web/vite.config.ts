import { defineConfig } from "vite";

// Dev: Vite on :5173 proxies /api to the engine on :5300.
// Build: writes index.html + assets/ into ../site without wiping app.html, studio.html, brand/ or classic.html.
export default defineConfig({
  base: "/",
  // polling avoids EBUSY crashes from the native file watcher on Windows
  server: { port: 5173, watch: { usePolling: true, interval: 300 }, proxy: { "/api": "http://127.0.0.1:5300", "/app.html": "http://127.0.0.1:5300", "/research": "http://127.0.0.1:5300" } },
  build: { outDir: "../site", emptyOutDir: false, assetsDir: "assets", target: "es2022", chunkSizeWarningLimit: 900 },
  worker: { format: "es" },
});
