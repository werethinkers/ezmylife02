import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const sentence = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** "You give → You get" in two small boxes, so a card says what goes in and what comes out. */
export function GiveGetStrip({ give, get, className }: { give: string; get: string; className?: string }) {
  const box = "min-w-0 flex-1 rounded-xl border-2 border-ink bg-card px-2.5 py-1.5";
  const label = "block text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground";
  const value = "block text-[13.5px] font-semibold leading-tight text-ink line-clamp-2";
  return (
    <div className={cn("flex items-stretch gap-1.5", className)}>
      <div className={box}>
        <span className={label}>You give</span>
        <span className={value}>{sentence(give)}</span>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 self-center" aria-hidden />
      <div className={box}>
        <span className={label}>You get</span>
        <span className={value}>{sentence(get)}</span>
      </div>
    </div>
  );
}

/** For an app with no original picture yet: the steps and the finished result, in the same 16:9 shape as a picture. */
export function StepsBand({ give, get, color, className }: { give: string; get: string; color: string; className?: string }) {
  const step = "grid grid-cols-[28px_1fr] min-h-[2.6rem] items-center gap-2.5 rounded-xl border-2 border-ink bg-card px-2.5 py-1 text-[13.5px] font-semibold leading-tight";
  const n = "flex h-7 w-7 items-center justify-center rounded-lg border-2 border-ink bg-sun font-display text-[13px] font-extrabold text-ink";
  return (
    <div className={cn("flex aspect-[16/9] w-full flex-col justify-center gap-1.5 border-b-2 border-ink px-4", className)} style={{ background: `color-mix(in srgb, ${color} 62%, hsl(var(--card)))` }}>
      <div className={step}>
        <span className={n}>1</span>
        <span className="line-clamp-2">Add {give}</span>
      </div>
      <div className={step}>
        <span className={n}>2</span>
        <span>Tap once. Takes about a minute.</span>
      </div>
      <div className="flex min-h-[2.6rem] items-center justify-between gap-2 rounded-xl border-2 border-dashed border-ink bg-card px-2.5 py-1 text-[13.5px] font-semibold leading-tight">
        <span className="line-clamp-2">Finished: {get}</span>
        <span aria-hidden className="shrink-0 font-bold">✓</span>
      </div>
    </div>
  );
}
