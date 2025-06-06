import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "build",
    rollupOptions: {
      input: {
        popup: "./index.html",
        fullscreen: "./fullscreen.html",
        verify: "./verify.html",
        profile: "./profile.html",
        background: "./src/background.ts",
        periodicSync: "./src/periodicSync.ts",
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
