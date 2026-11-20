import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Adapted from 21st.dev neobrutalism "Marquee" (ekmas): an endless strip between two ink rules.
// The items are rendered twice so the -50% loop in tailwind's `marquee` keyframe has no seam.
export function Marquee({ items, className, itemClassName }: { items: ReactNode[]; className?: string; itemClassName?: string }) {
  const row = (hidden: boolean) =>
    items.map((item, i) => (
      <span key={`${hidden ? "b" : "a"}-${i}`} aria-hidden={hidden || undefined} className={cn("mx-3 inline-flex shrink-0 items-center gap-3", itemClassName)}>
        {item}
        <span className="text-sun" aria-hidden>
          ✦
        </span>
      </span>
    ));
  return (
    <div className={cn("relative flex w-full overflow-hidden border-y-2 border-ink bg-card", className)}>
      <div className="flex w-max animate-marquee whitespace-nowrap py-3 motion-reduce:animate-none">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
