import { defineConfig } from "vite";

export default defineConfig({
  build: { rollupOptions: { input: { app: "index.html", privacy: "privacy.html" } } },
  server: { strictPort: true }
});
