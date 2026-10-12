import { Briefcase, Megaphone, ShoppingBag, Camera, IndianRupee, Scale, GraduationCap, BookOpen, Home, HeartPulse, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { studioTabOf } from "@/data/studios";

const ICONS: Record<string, LucideIcon> = {
  business: Briefcase,
  marketing: Megaphone,
  ecommerce: ShoppingBag,
  creators: Camera,
  money: IndianRupee,
  legal: Scale,
  careers: GraduationCap,
  education: BookOpen,
  family: Home,
  health: HeartPulse,
};
const COLOURS = ["bg-pink", "bg-sun", "bg-teal", "bg-lime", "bg-sky", "bg-coral"];
const ACCENTS = ["bg-sun", "bg-pink", "bg-lime", "bg-teal", "bg-pink", "bg-sun"];

/** A made-up cover for a studio: its group colour, a paper sheet with the name on it, and the group icon. */
export function StudioThumb({ toolId, name, className }: { toolId: string; name: string; className?: string }) {
  const info = studioTabOf(toolId);
  const i = info?.index ?? 0;
  const Icon = (info && ICONS[info.tab.id]) || Sparkles;
  return (
    <div className={cn("relative h-full w-full overflow-hidden", COLOURS[i % COLOURS.length], className)} aria-hidden>
      <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full border-2 border-ink", ACCENTS[i % ACCENTS.length])} />
      <div className="absolute -bottom-8 left-6 h-20 w-20 rotate-12 rounded-2xl border-2 border-ink bg-card/60" />
      <div className="absolute inset-x-[14%] bottom-0 top-[22%] -rotate-2 rounded-t-xl border-2 border-b-0 border-ink bg-card p-3 shadow-block-sm">
        <div className="flex items-center gap-2">
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-ink", ACCENTS[i % ACCENTS.length])}>
            <Icon className="h-4 w-4" />
          </span>
          <p className="line-clamp-2 text-[13px] font-extrabold leading-tight">{name}</p>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-ink/15" />
          <div className="h-1.5 w-5/6 rounded-full bg-ink/15" />
          <div className="h-1.5 w-2/3 rounded-full bg-ink/15" />
        </div>
      </div>
      <span className="absolute left-2.5 bottom-2.5 rounded-full border-2 border-ink bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sun">Studio</span>
    </div>
  );
}
