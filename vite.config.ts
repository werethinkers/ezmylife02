import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mcpPlugin(), mode === "development" && componentTagger()].filter(Boolean),

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
          if (/node_modules\/(recharts|d3-[a-z-]+|victory-vendor|recharts-scale|decimal\.js-light)\//.test(id)) return "charts";
          return undefined;
        },
      },
    },
  },
}));
