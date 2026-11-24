import { Check } from "lucide-react";
import { FLOW_STEPS, type Flow } from "@/components/brand/FlowSteps";
import { cn } from "@/lib/utils";

/** The same four steps as <FlowSteps> (same words), drawn in the modern look. */
export function ModernSteps({ flow, step, className }: { flow: Flow; step: 1 | 2 | 3 | 4; className?: string }) {
  return (
    <ol aria-label="Steps" className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}>
      {FLOW_STEPS[flow].map((t, i) => {
        const n = i + 1;
        const done = n < step;
        const now = n === step;
        return (
          <li
            key={t}
            aria-current={now ? "step" : undefined}
            className={cn(
              "flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold",
              now
                ? "border-orange-500 bg-orange-50 text-orange-900 dark:border-orange-700 dark:bg-orange-950/40 dark:text-orange-200"
                : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                now ? "bg-primary text-primary-foreground" : done ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
              )}
            >
              {done ? <Check className="h-3 w-3" /> : n}
            </span>
            <span className="min-w-0">{t}</span>
          </li>
        );
      })}
    </ol>
  );
}
