import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { useToolMedia } from "@/hooks/useToolMedia";
import { AppIcon } from "./AppIcon";
import { PricePill } from "./PricePill";
import { useQuickLook } from "./QuickLook";
import { cn } from "@/lib/utils";

/** Large shelf card: preview image, squircle icon, name, category and price pill. */
export function AppTile({ tool, className }: { tool: CatalogTool; className?: string }) {
  const { openQuickLook } = useQuickLook();
  const media = useToolMedia(tool.id, tool.category);
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
        "group w-[78%] shrink-0 snap-start cursor-pointer rounded-[1.75rem] border border-border/60 bg-card p-3 shadow-sm transition-all hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[46%] lg:w-[31%] xl:w-[23.5%]",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-primary/15 to-accent/15">
        {media.previewImageUrl && (
          <img
            src={media.previewImageUrl}
            alt=""
            loading="lazy"
            className={cn(
              "h-full w-full transition-transform duration-500 motion-safe:group-hover:scale-[1.03]",
              media.previewFit === "contain" ? "object-contain" : "object-cover",
            )}
          />
        )}
      </div>
      <div className="flex items-center gap-3 px-1 pb-1 pt-3">
        <AppIcon toolId={tool.id} category={tool.category} name={tool.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{tool.name}</p>
          <p className="truncate text-xs text-muted-foreground">{tool.category}</p>
        </div>
        <PricePill toolId={tool.id} />
      </div>
    </div>
  );
}

/** Compact row: icon, name, category, price pill. Optional rank number on the left. */
export function AppRow({ tool, rank, className }: { tool: CatalogTool; rank?: number; className?: string }) {
  const { openQuickLook } = useQuickLook();
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
        "flex cursor-pointer items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {rank != null && (
        <span className="w-7 shrink-0 text-center font-display text-lg font-bold tabular-nums text-muted-foreground">
          {String(rank).padStart(2, "0")}
        </span>
      )}
      <AppIcon toolId={tool.id} category={tool.category} name={tool.name} size="sm" />
      <div className="min-w-0 flex-1 border-b border-border/50 py-2">
        <p className="truncate text-sm font-semibold">{tool.name}</p>
        <p className="truncate text-xs text-muted-foreground">{tool.category}</p>
      </div>
      <PricePill toolId={tool.id} />
    </div>
  );
}
