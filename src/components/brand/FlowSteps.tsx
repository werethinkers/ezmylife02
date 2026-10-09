import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The same four steps for every app, website and card, so people always know where they are.
 * The wording matches what really happens: apps only use credits when they give you a result,
 * websites and cards are paid once when you publish.
 */
export type Flow = "app" | "website" | "card";

export const FLOW_STEPS: Record<Flow, string[]> = {
  app: ["See what it does", "Use it", "Get your result", "Save or share"],
  website: ["Pick a design", "Add your details", "Pay once", "Go live"],
  card: ["Pick a design", "Add your details", "Pay once", "Send it"],
};

export function FlowSteps({ flow, step, className }: { flow: Flow; step: 1 | 2 | 3 | 4; className?: string }) {
  const steps = FLOW_STEPS[flow];
  return (
    <ol aria-label="Steps" className={cn("grid grid-cols-4 gap-1.5 sm:gap-2", className)}>
      {steps.map((t, i) => {
        const n = i + 1;
        const done = n < step;
        const now = n === step;
        return (
          <li
            key={t}
            aria-current={now ? "step" : undefined}
            className={cn(
              "flex min-w-0 flex-col gap-1.5 border-t-[5px] pt-2 text-[12px] font-semibold leading-tight sm:flex-row sm:items-center sm:gap-2 sm:text-sm",
              done ? "border-teal text-ink" : now ? "border-ink text-ink" : "border-sand text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-bold",
                done ? "border-ink bg-teal" : now ? "border-ink bg-sun" : "border-muted-foreground/60",
              )}
              aria-hidden
            >
              {done ? <Check className="h-3.5 w-3.5" /> : n}
            </span>
            <span className="min-w-0">{t}</span>
          </li>
        );
      })}
    </ol>
  );
}
