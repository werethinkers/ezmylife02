import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * From 21st.dev "Animated Grid" (rmahammad), adapted to Ezyourlife: a slow-drifting graph-paper
 * grid in ink, with every fourth line in a goal colour, fading out at the edges. CSS only (the
 * `.fx-grid` rules in src/index.css), decorative, and still for reduced motion. No glow blob:
 * the design keeps flat colour.
 *
 * Put it inside a `relative` section; content after it needs `relative` to sit on top.
 */
export function AnimatedGrid({
  accent = "var(--sun)",
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & { /** An HSL triple variable, e.g. "var(--pink)". */ accent?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("fx-grid pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{ ["--grid-accent" as string]: accent, ...style }}
      {...props}
    />
  );
}
