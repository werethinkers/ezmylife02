import { Link } from "react-router-dom";
import { HardHat, Sun, Route, Hammer, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTilt } from "@/components/ui/tilt-card";

const ICONS: Record<string, LucideIcon> = { sites: HardHat, solar: Sun, roads: Route, build: Hammer };

/** Same look as a studio card (AppTile), for apps that are not in the catalogue yet. */
export function SiteTile({
  name, get, to, colour, accent = "bg-sun", icon = "sites", soon,
}: {
  name: string; get: string; to?: string; colour: string; accent?: string; icon?: keyof typeof ICONS; soon?: boolean;
}) {
  const Icon = ICONS[icon] ?? HardHat;
  const tilt = useTilt<HTMLAnchorElement>();
  const body = (
    <>
      <div className={cn("relative aspect-[16/9] overflow-hidden border-b-2 border-ink", colour, soon && "opacity-80")} aria-hidden>
        <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full border-2 border-ink transition-transform duration-500 group-hover:scale-125", accent)} />
        <div className="absolute -bottom-8 left-6 h-20 w-20 rotate-12 rounded-2xl border-2 border-ink bg-card/60" />
        <div className="absolute inset-x-[14%] bottom-0 top-[22%] -rotate-2 rounded-t-xl border-2 border-b-0 border-ink bg-card p-3 shadow-block-sm transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:rotate-0">
          <div className="flex items-center gap-2">
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-ink", accent)}><Icon className="h-4 w-4" /></span>
            <p className="line-clamp-2 text-[13px] font-extrabold leading-tight">{name}</p>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-ink/15" />
            <div className="h-1.5 w-5/6 rounded-full bg-ink/15" />
            <div className="h-1.5 w-2/3 rounded-full bg-ink/15" />
          </div>
        </div>
        <span className="absolute left-2.5 bottom-2.5 rounded-full border-2 border-ink bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sun">Studio</span>
        <span className="absolute left-2.5 top-2.5 rounded-full border-2 border-ink bg-card px-2 py-0.5 text-[11px] font-bold">Run your sites</span>
      </div>
      <div className="flex items-start gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold leading-tight">{name}</p>
          <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">You get {get}</p>
        </div>
        <span className={cn("inline-flex h-8 min-w-[70px] shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-ink px-2.5 text-xs font-bold", soon ? "bg-sand" : "bg-pink")}>
          {soon ? "Soon" : "Free demo"}
        </span>
      </div>
    </>
  );
  const cls = "block-card group block overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  return soon || !to ? (
    <div className={cn(cls, "cursor-default")} aria-label={`${name}, coming soon`}>{body}</div>
  ) : (
    <Link {...tilt} to={to} className={cn(cls, "block-lift fx-tilt")} aria-label={`${name}, open the demo`}>{body}</Link>
  );
}
