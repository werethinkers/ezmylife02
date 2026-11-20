import { Check } from "lucide-react";
import { FLOW_STEPS, type Flow } from "@/components/brand/FlowSteps";
import { cn } from "@/lib/utils";

/** The same four steps as <FlowSteps> (same words), drawn in the modern look. */
export function ModernSteps({ flow, step, className }: { flow: Flow; step: 1 | 2 | 3 | 4; className?: string }) {
  return (
    <ol
      aria-label="Steps"
      className={cn("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 [&::-webkit-scrollbar]:hidden", className)}
    >
      {FLOW_STEPS[flow].map((t, i) => {
        const n = i + 1;
        const done = n < step;
        const now = n === step;
        return (
          <li
            key={t}
            aria-current={now ? "step" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border-2 px-3 py-2 text-xs font-semibold sm:min-w-0 sm:whitespace-normal",
              now ? "border-ink bg-sun text-ink shadow-block-sm" : "border-ink/20 bg-card text-muted-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink text-[10px] font-bold",
                now ? "bg-ink text-cream" : done ? "bg-lime text-ink" : "bg-card text-muted-foreground",
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
