import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { useToolMedia } from "@/hooks/useToolMedia";
import { giveGetFor, goalOf } from "@/data/goals";
import { AppIcon } from "./AppIcon";
import { PricePill } from "./PricePill";
import { useQuickLook } from "./QuickLook";
import { cn } from "@/lib/utils";
import { STUDIO_IDS } from "@/data/studios";
import { StudioThumb } from "./StudioThumb";

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
  return (
    <div
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
        "block-card block-lift group flex cursor-pointer flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        layout === "shelf"
          ? "w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[31%] xl:w-[23.5%]"
          : "w-full",
        className,
      )}
    >
      <div className="flex items-center gap-3.5 px-5 pt-5">
        <AppIcon toolId={tool.id} category={tool.category} name={tool.name} size="md" className="rounded-2xl" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-lg font-bold leading-tight">{tool.name}</p>
          <p className="mt-0.5 truncate text-[13px] font-medium text-ink/70">{STUDIO_IDS.has(tool.id) ? `Studio · ${goal.name}` : goal.name}</p>
        </div>
      </div>
      <p className="line-clamp-3 min-h-[4.2rem] px-5 pt-3.5 text-[15px] leading-snug text-ink/85">You get {info.get}.</p>
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-3.5">
        <span className="inline-flex h-9 items-center rounded-xl border-2 border-ink bg-card/60 px-4 text-sm font-bold transition-colors group-hover:bg-card">See what it does</span>
        <PricePill toolId={tool.id} />
      </div>
      <div className="relative mt-auto ml-6 aspect-[16/9] overflow-hidden rounded-tl-2xl border-2 border-b-0 border-r-0 border-ink bg-card transition-transform duration-200 group-hover:-translate-y-2">
        {media.previewImageUrl ? (
          <img
            src={media.previewImageUrl}
            alt={`${tool.name}: what the app looks like`}
            loading="lazy"
            className={cn("h-full w-full", media.previewFit === "contain" ? "object-contain" : "object-cover")}
          />
        ) : STUDIO_IDS.has(tool.id) ? (
          <StudioThumb toolId={tool.id} name={tool.name} />
        ) : (
          <div className="flex h-full items-center justify-center bg-card">
            <AppIcon toolId={tool.id} category={tool.category} name={tool.name} size="lg" className="shadow-block-sm" />
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact row: icon, name, what you get, price pill. Optional rank number on the left. */
export function AppRow({ tool, rank, className }: { tool: CatalogTool; rank?: number; className?: string }) {
  const { openQuickLook } = useQuickLook();
  const info = giveGetFor(tool.category, { toolTypes: tool.tool_types });
  return (
    <div
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
        "flex cursor-pointer items-center gap-3 rounded-xl border-2 border-transparent p-2 transition-colors hover:border-ink hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
