import { useCallback, useEffect, useRef, type HTMLAttributes, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * From 21st.dev "Optimized Tilt Card" (sh20raj), adapted to Ezyourlife: the card tilts a little
 * towards the pointer and a white sheen follows it. No new colours: the card keeps its own fill,
 * ink outline and hard shadow. The look lives in `.fx-tilt` (src/index.css); this only feeds it
 * the pointer position as CSS variables, once per frame.
 *
 * Mouse only: on touch screens and with reduced motion nothing moves, so taps stay instant.
 */
const MAX_TILT = 6;

export function useTilt<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
  }, []);

  const set = useCallback((px: number, py: number, rx: number, ry: number) => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty("--px", `${px}%`);
      el.style.setProperty("--py", `${py}%`);
      el.style.setProperty("--rx", `${rx}deg`);
      el.style.setProperty("--ry", `${ry}deg`);
    });
  }, []);

  const onMouseMove = useCallback((e: MouseEvent<T>) => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) return;
    const r = el.getBoundingClientRect();
    const px = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    const py = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
    set(px, py, ((py - 50) / 50) * -MAX_TILT, ((px - 50) / 50) * MAX_TILT);
  }, [set]);

  const onMouseLeave = useCallback(() => set(50, 50, 0, 0), [set]);

  return { ref, onMouseMove, onMouseLeave };
}

/** A plain div with the tilt and sheen. Pass the card's own classes (block-card, colours...). */
export function TiltCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const tilt = useTilt<HTMLDivElement>();
  return (
    <div {...props} {...tilt} className={cn("fx-tilt", className)}>
      {children}
    </div>
  );
}
