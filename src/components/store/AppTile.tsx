import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { useToolMedia } from "@/hooks/useToolMedia";
import { giveGetFor, goalOf } from "@/data/goals";
import { AppIcon } from "./AppIcon";
import { PricePill } from "./PricePill";
import { useQuickLook } from "./QuickLook";
import { cn } from "@/lib/utils";
import { STUDIO_IDS } from "@/data/studios";
import { GiveGetStrip, StepsBand } from "./GiveGetStrip";
import { useTilt } from "@/components/ui/tilt-card";

/**
 * Large app card in the Setapp style: icon and name, what you get, the price pill, and the
 * whole original preview sitting at the bottom edge of a card tinted with the app's goal colour.
 *
 * `layout` picks how the card is sized. On a shelf it is a flex child of a scrolling
 * rail, so it takes a percentage of that rail to peek the next card. In a grid the
 * cell already sets the width — a percentage there would be a fraction of the cell
 * and shrink the card, so grid cards fill their cell instead.
 */
export function AppTile({
  tool,
  className,
  layout = "shelf",
}: {
  tool: CatalogTool;
  className?: string;
  layout?: "shelf" | "grid";
}) {
  const { openQuickLook } = useQuickLook();
  const media = useToolMedia(tool.id, tool.category);
  const goal = goalOf(tool.category);
  const info = giveGetFor(tool.category, { toolTypes: tool.tool_types });
  const tilt = useTilt<HTMLDivElement>();
  return (
    <div
      {...tilt}
      role="button"
      tabIndex={0}
      onClick={() => openQuickLook(tool.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openQuickLook(tool.id);
        }
      }}
      aria-label={`${tool.name}, quick look`}
      style={{ background: `color-mix(in srgb, ${goal.color} 38%, hsl(var(--card)))` }}
      className={cn(
        "block-card block-lift fx-tilt group flex cursor-pointer flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        layout === "shelf"
          ? "w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[31%] xl:w-[23.5%]"
          : "w-full",
        className,
      )}
    >
      {media.previewImageUrl ? (
        <img
          src={media.previewImageUrl}
          alt={`${tool.name}: what the app looks like`}
          loading="lazy"
          className={cn("aspect-[16/9] w-full border-b-2 border-ink bg-card transition-transform duration-500 group-hover:scale-[1.03]", media.previewFit === "contain" ? "object-contain" : "object-cover")}
        />
      ) : (
        <StepsBand give={info.give} get={info.get} color={goal.color} />
      )}
      <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-3.5">
        <div className="flex items-center gap-3">
          <AppIcon toolId={tool.id} category={tool.category} name={tool.name} size="sm" className="rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-[17px] font-bold leading-tight">{tool.name}</p>
            <p className="mt-0.5 truncate text-[12.5px] font-semibold text-ink/80">{STUDIO_IDS.has(tool.id) ? `Studio · ${goal.name}` : goal.name}</p>
          </div>
        </div>
        <p className="line-clamp-2 min-h-[2.6rem] text-[14.5px] leading-snug text-ink/90">{tool.description || `You get ${info.get}.`}</p>
        <GiveGetStrip give={info.give} get={info.get} />
        <div className="mt-auto flex items-center gap-2.5 pt-1">
          <span className="inline-flex h-9 items-center rounded-xl border-2 border-ink bg-card px-4 text-sm font-bold shadow-block-sm transition-[background-color,transform] group-hover:-translate-y-px group-hover:bg-sun">See what it does <span aria-hidden className="ml-1 inline-block transition-transform group-hover:translate-x-1">→</span></span>
          <PricePill toolId={tool.id} />
        </div>
      </div>
    </div>
  );
}

/** Compact row: icon, name, what you get, price pill. Optional rank number on the left. */
export function AppRow({ tool, rank, className }: { tool: CatalogTool; rank?: number; className?: string }) {
  const { openQuickLook } = useQuickLook();
  const info = giveGetFor(tool.category, { toolTypes: tool.tool_types });
  const tilt = useTilt<HTMLDivElement>();
  return (
    <div
      {...tilt}
      role="button"
      tabIndex={0}
      onClick={() => openQuickLook(tool.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openQuickLook(tool.id);
        }
      }}
      aria-label={`${tool.name}, quick look`}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border-2 border-transparent p-2 transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-ink hover:bg-card hover:shadow-block-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {rank != null && (
        <span className="w-7 shrink-0 text-center font-display text-lg font-bold tabular-nums text-muted-foreground">{String(rank).padStart(2, "0")}</span>
      )}
      <AppIcon toolId={tool.id} category={tool.category} name={tool.name} size="sm" />
      <div className="min-w-0 flex-1 py-1">
        <p className="flex items-center gap-1.5 text-[15px] font-bold">
          <span className="truncate">{tool.name}</span>
          {STUDIO_IDS.has(tool.id) && <span className="shrink-0 rounded-full border-2 border-ink bg-sun px-1.5 text-[10px] font-bold leading-4">Studio</span>}
        </p>
        <p className="truncate text-[13px] text-muted-foreground">You get {info.get}</p>
      </div>
      <PricePill toolId={tool.id} />
    </div>
  );
}
