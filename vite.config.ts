import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// Writes one HTML page per app at the end of a build, so search engines see each app (docs/launch-plan.md).
import { appPages } from "./scripts/prerender-apps.mjs";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), appPages()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: process.env.ANALYZE === "1",
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Only group whole libraries; small shared helpers (e.g. clsx) stay with the code that
        // uses them, so the 380 KB charts library is no longer pulled into every page.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return "react-vendor";
          if (/node_modules\/(clsx|tailwind-merge|class-variance-authority|prop-types|react-is|tiny-invariant|eventemitter3)\//.test(id)) return "ui-utils";
          if (id.includes("@tanstack")) return "query";
          if (id.includes("framer-motion") || id.includes("motion-dom") || id.includes("motion-utils")) return "motion";
          if (id.includes("@supabase")) return "supabase";
          // No manual "charts" chunk: grouping recharts/d3 created a cross-chunk import cycle that threw
          // "Cannot access 'P' before initialization" at startup and left every page blank. Rollup
          // already keeps recharts in the lazy chunks of the pages that use it.
          return undefined;
        },
      },
    },
  },
}));
