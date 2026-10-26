import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Horizontal "shelf" in the App Store style: snap-scrolls, peeks the next card at the
 * right edge, and shows ‹ › buttons on larger screens when there is more to see.
 */
export function Shelf({
  title,
  subtitle,
  seeAllTo,
  children,
  className,
}: {
  /** Leave empty when the page already shows a heading above the shelf. */
  title?: string;
  subtitle?: string;
  seeAllTo?: string;
  children: ReactNode;
  className?: string;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = () => {
    const el = rail.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };

  useEffect(() => {
    update();
    const el = rail.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  const page = (dir: 1 | -1) => {
    const el = rail.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className={cn("min-w-0", className)}>
      <div className={cn("flex items-end justify-between gap-3", title ? "mb-4" : "mb-2 justify-end")}>
        <div className={cn("min-w-0", !title && "hidden")}>
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
          {subtitle && <p className="mt-1 text-[15px] text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {seeAllTo && (
            <Link to={seeAllTo} className="rounded-full border-2 border-ink bg-card px-3 py-1 text-sm font-bold shadow-[2px_2px_0_0_hsl(var(--ink))] hover:bg-sun">
              See all
            </Link>
          )}
          <div className="hidden gap-1.5 md:flex">
            <button
              type="button"
              aria-label={`Scroll ${title || "shelf"} left`}
              onClick={() => page(-1)}
              disabled={edge.start}
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-card transition hover:bg-sun disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={`Scroll ${title || "shelf"} right`}
              onClick={() => page(1)}
              disabled={edge.end}
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-card transition hover:bg-sun disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={rail}
        onScroll={update}
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:-mx-1 md:px-1"
      >
        {children}
      </div>
    </section>
  );
}
