import { cn } from "@/lib/utils";
import { CARD } from "./styles";

export interface MetricCell {
  value: string;
  label: string;
  /** Orange value text — used for the "100 free credits" cell. */
  accent?: boolean;
}

/** Play Store–style 3-column strip: price, output, and the starter-credits line, all real per-item facts. */
export function MetricsStrip({ cells, className }: { cells: MetricCell[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-3 divide-x divide-zinc-200 py-3 dark:divide-zinc-800", CARD, className)}>
      {cells.map((c) => (
        <div key={c.label} className="min-w-0 px-2 text-center">
          <div className={cn("truncate font-display text-sm font-bold md:text-base", c.accent ? "text-orange-600" : "text-zinc-900 dark:text-white")}>{c.value}</div>
          <div className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
