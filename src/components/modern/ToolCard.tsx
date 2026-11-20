import { useMemo, useState } from "react";
import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { usePricingMap } from "@/hooks/usePricingMap";
import { resolveToolMedia } from "@/lib/toolMedia";
import { giveGetFor } from "@/data/goals";
import { useQuickLook } from "@/components/store/QuickLook";
import { cn } from "@/lib/utils";
import { ShowcaseCard } from "./ShowcaseCard";
import { creditsLabel, toolGradient } from "./styles";

const initials = (name: string) =>
  name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "AI";

/**
 * What fills an app card: the app's original preview, over a panel in its goal's gradient with its
 * icon and what it does. The panel shows when there is no preview or it fails to load.
 */
export function ToolMedia({ tool, className }: { tool: CatalogTool; className?: string }) {
  const media = useMemo(() => resolveToolMedia(tool.id, tool.category, tool), [tool]);
  const info = giveGetFor(tool.category, { toolTypes: tool.tool_types });
  const [failed, setFailed] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);
  return (
    <div className={cn("relative h-full w-full", className)}>
      <div className={cn("flex h-full w-full flex-col p-3 pt-12 text-ink border-b-2 border-ink/20", toolGradient(tool))}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-ink/30 bg-white/30 font-display text-sm font-bold">
          {media.iconUrl && !iconFailed ? (
            <img src={media.iconUrl} alt="" loading="lazy" onError={() => setIconFailed(true)} className="h-full w-full bg-white object-cover" />
          ) : (
            initials(tool.name)
          )}
        </span>
        <p className="mt-2.5 line-clamp-3 text-[11px] font-semibold leading-snug text-ink/80">
          {tool.description?.trim() || `You give ${info.give} → you get ${info.get}`}
        </p>
      </div>
      {media.previewImageUrl && !failed && (
        <img
          src={media.previewImageUrl}
          alt={`${tool.name}: what the app looks like`}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn("absolute inset-0 h-full w-full", media.previewFit === "contain" ? "bg-white object-contain p-2" : "object-cover")}
        />
      )}
    </div>
  );
}

/** An app or studio in the modern catalogue. Tapping it opens the app's store page. */
export function ToolCard({ tool, rank, chip, size, className }: { tool: CatalogTool; rank?: number; chip?: string; size?: "md" | "lg"; className?: string }) {
  const { openQuickLook } = useQuickLook();
  const { costOf } = usePricingMap();
  return (
    <ShowcaseCard
      media={<ToolMedia tool={tool} />}
      title={tool.name}
      price={creditsLabel(costOf(tool.id))}
      chip={chip ?? tool.category}
      rank={rank}
      gradient={toolGradient(tool)}
      action="Try it"
      onOpen={() => openQuickLook(tool.id)}
      label={`${tool.name}, see details`}
      size={size}
      className={className}
    />
  );
}
