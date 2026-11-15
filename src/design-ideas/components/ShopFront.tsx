import { cn } from "@/lib/utils";
import { Awning } from "./Awning";
import type { Shop } from "../data";

/** One shop on the lane: awning, painted board, a line, and how many apps hang inside. */
export function ShopFront({ shop, count, samples, active, onOpen }: { shop: Shop; count: number; samples: string[]; active: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={active}
      aria-label={`${shop.name}, ${count} apps. Open the shop.`}
      className={cn("group flex w-full flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", "transition-transform hover:-translate-y-1")}
    >
      <Awning color={shop.color} />
      <div className={cn("flex flex-1 flex-col gap-3 border-2 border-t-0 border-ink bg-card px-3 pb-4 pt-5", active && "bg-secondary")} style={{ boxShadow: "var(--shadow-block-sm)" }}>
        <span className="self-center rounded-md border-2 border-ink px-3 py-1.5 font-display text-[15px] font-bold leading-tight text-ink" style={{ background: shop.color }}>
          {shop.name}
        </span>
        <p className="text-center text-[14px] leading-snug text-muted-foreground">{shop.line}</p>
        <ul className="flex flex-wrap justify-center gap-1.5">
          {samples.map((s) => (
            <li key={s} className="max-w-full truncate rounded-full border-2 border-ink bg-background px-2 py-0.5 text-[12px] font-semibold">
              {s}
            </li>
          ))}
        </ul>
        <span className="mt-auto text-center text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
          {count > 0 ? `${count} apps inside` : "Opening soon"} · <span className="text-ink underline decoration-2 underline-offset-2 group-hover:marker">Step in</span>
        </span>
      </div>
    </button>
  );
}
