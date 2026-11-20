import { createElement, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// One row of cards that scrolls sideways, as on the Play Store, used for every card list on the site.
// Phones swipe; wider screens also get round ‹ › buttons on the row's edges (arrow style adapted from
// the 21st.dev theme-aware carousel). Card widths per screen size live in index.css (.ez-row-*).
const SIZES = {
  card: "ez-row-card",
  app: "ez-row-app",
  wide: "ez-row-wide",
  step: "ez-row-step",
} as const;

export function ScrollRow({
  children,
  size = "card",
  as = "div",
  label,
  className,
}: {
  children: ReactNode;
  size?: keyof typeof SIZES;
  as?: "div" | "ul" | "ol";
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, children]);

  const page = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  const arrow =
    "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink bg-card text-ink shadow-block-sm transition hover:bg-sun focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex";

  return (
    <div className="relative min-w-0">
      {createElement(
        as,
        {
          ref,
          onScroll: update,
          "aria-label": label,
          className: cn("ez-row", SIZES[size], className),
        },
        children,
      )}
      {!edge.start && (
        <button type="button" aria-label={`Scroll ${label ?? "row"} left`} onClick={() => page(-1)} className={cn(arrow, "-left-2")}>
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {!edge.end && (
        <button type="button" aria-label={`Scroll ${label ?? "row"} right`} onClick={() => page(1)} className={cn(arrow, "-right-2")}>
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
