import { cn } from "@/lib/utils";

/** The EZYOURLIFE wordmark: a sun dot and the name, with the "Think it → done" line under it. */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-ink", className)}>
      <span aria-hidden className="relative h-9 w-9 shrink-0 rounded-full border-2 border-ink bg-sun shadow-[3px_3px_0_0_hsl(var(--ink))]">
        <span className="absolute inset-[6px] rounded-full border-2 border-ink bg-pink" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[19px] font-extrabold tracking-tight">EZYOURLIFE</span>
        {!compact && <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Think it → done</span>}
      </span>
    </span>
  );
}
