import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small numbered label that ties a part of an app screen to the 4-step flow. */
export function StepLabel({ n, children, className }: { n: number; children: ReactNode; className?: string }) {
  return (
    <p className={cn("mb-4 flex items-center gap-2 text-[15px] font-bold", className)}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun text-xs" aria-hidden>
        {n}
      </span>
      {children}
    </p>
  );
}

/** The empty result area every app shows before its first run. */
export function ResultPlaceholder({ title = "Your result appears here", children, className }: { title?: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/60 bg-sand/60 p-8 text-center", className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-card">
        <Sparkles className="h-6 w-6" aria-hidden />
      </span>
      <p className="mt-3 font-bold">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
