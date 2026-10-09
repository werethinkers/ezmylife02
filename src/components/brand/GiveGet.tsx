import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** "You give → You get → Time" in plain words, so the purpose of an app is clear at a glance. */
export function GiveGet({
  give,
  get,
  time = "about a minute",
  className,
}: {
  give: string;
  get: string;
  time?: string | null;
  className?: string;
}) {
  const cell = "min-w-0 flex-1 basis-[8rem]";
  const label = "block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground";
  const value = "mt-0.5 block text-[15px] font-semibold leading-snug text-ink";
  return (
    <div className={cn("flex flex-wrap items-stretch gap-3 rounded-2xl border-2 border-ink bg-card p-3.5 shadow-block-sm", className)}>
      <div className={cell}>
        <span className={label}>You give</span>
        <span className={value}>{give}</span>
      </div>
      <ArrowRight className="hidden h-5 w-5 shrink-0 self-center text-ink sm:block" aria-hidden />
      <div className={cell}>
        <span className={label}>You get</span>
        <span className={value}>{get}</span>
      </div>
      {time && (
        <div className={cn(cell, "basis-[6rem] sm:flex-none")}>
          <span className={label}>Time</span>
          <span className={value}>{time}</span>
        </div>
      )}
    </div>
  );
}
