import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { useToolMedia } from "@/hooks/useToolMedia";
import { giveGetFor, goalOf } from "@/data/goals";
import { AppIcon } from "./AppIcon";
import { PricePill } from "./PricePill";
import { useQuickLook } from "./QuickLook";
import { cn } from "@/lib/utils";

/**
 * Large app card: preview, icon, name, what you get, and the price pill.
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
      className={cn(
        "block-card block-lift group cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        layout === "shelf"
          ? "w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[31%] xl:w-[23.5%]"
          : "w-full",
        className,
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden border-b-2 border-ink" style={{ background: goal.color }}>
        {media.previewImageUrl ? (
          <img
            src={media.previewImageUrl}
            alt=""
            loading="lazy"
            className={cn("h-full w-full", media.previewFit === "contain" ? "object-contain" : "object-cover")}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <AppIcon toolId={tool.id} category={tool.category} name={tool.name} size="lg" className="shadow-block-sm" />
          </div>
        )}
        <span className="absolute left-2.5 top-2.5 rounded-full border-2 border-ink bg-card px-2 py-0.5 text-[11px] font-bold">{goal.name}</span>
      </div>
      <div className="flex items-start gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold leading-tight">{tool.name}</p>
          <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">You get {info.get}</p>
        </div>
        <PricePill toolId={tool.id} />
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
        <p className="truncate text-[15px] font-bold">{tool.name}</p>
        <p className="truncate text-[13px] text-muted-foreground">You get {info.get}</p>
      </div>
      <PricePill toolId={tool.id} />
    </div>
  );
}
