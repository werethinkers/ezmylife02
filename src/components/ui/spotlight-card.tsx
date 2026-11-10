import { useRef, useState, type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * From 21st.dev "Spotlight Card" (preetsuthar17): a soft glow follows the pointer over the card.
 * Adapted to Ezyourlife: no fixed colours or radius, so it wears whatever card it wraps. The glow is
 * a warm sun tint; it never blocks clicks and is skipped on touch screens (no hover there).
 */
export function SpotlightCard({
  children, className, style, glow = "hsl(var(--sun) / 0.45)",
}: { children: ReactNode; className?: string; style?: CSSProperties; glow?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [on, setOn] = useState(false);
  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      style={style}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 hidden transition-opacity duration-500 motion-reduce:hidden [@media(hover:hover)]:block"
        style={{ opacity: on ? 1 : 0, background: `radial-gradient(260px circle at ${pos.x}px ${pos.y}px, ${glow}, transparent 75%)` }}
      />
      {children}
    </div>
  );
}
