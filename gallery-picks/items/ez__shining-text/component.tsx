/*
 * Shining text
 * Ezyourlife original (src/components/ui/shining-text.tsx), adapted from a 21st.dev idea. Needs the cn helper from src/lib/utils.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * From 21st.dev "Shining Text" (preetsuthar17): a band of light sweeps across the words.
 * Adapted to Ezyourlife: plain CSS (no motion library), ink text with a sun-coloured sweep,
 * and it stands still for people who ask for reduced motion.
 */
export function ShiningText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn("shining-text bg-clip-text text-transparent", className)}
      style={{
        backgroundImage: "linear-gradient(110deg, hsl(var(--ink)) 35%, hsl(var(--sun)) 50%, hsl(var(--ink)) 65%)",
        backgroundSize: "250% 100%",
      }}
    >
      {children}
    </span>
  );
}
