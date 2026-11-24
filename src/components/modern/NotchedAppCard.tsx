import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { resolveToolMedia } from "@/lib/toolMedia";
import { appPagePath } from "@/lib/appLink";
import { usePricingMap } from "@/hooks/usePricingMap";
import { creditsLabel, toolGradient } from "@/components/modern/styles";

/**
 * Project-card-style app card for horizontal-scroll rows.
 * Adapts the NotchedProjectCard pattern from 21st.dev (@maudbenaddi) to the
 * EZ design system: ink border, sun/pink arrow disc, gradient fallback cover.
 *
 * Place inside a ScrollRow – the width is controlled by the row's CSS variable.
 */

const DISC = 56;    // arrow disc diameter, px
const BLOCK = 72;   // notch block size, px  (radius = BLOCK - DISC/2 = 44)
const FILLET = 22;  // curve where the notch meets the cover edges, px

export function NotchedAppCard({ tool, className }: { tool: CatalogTool; className?: string }) {
  const navigate = useNavigate();
  const { costOf } = usePricingMap();
  const media = useMemo(() => resolveToolMedia(tool.id, tool.category, tool), [tool]);
  const [imgFailed, setImgFailed] = useState(false);
  const price = creditsLabel(costOf(tool.id));

  // The notch layers are painted in the page background colour so they appear
  // "cut out." Use a CSS variable so the card reacts to dark-mode transitions.
  const surface = "hsl(var(--background))";

  return (
    <button
      type="button"
      onClick={() => navigate(appPagePath(tool))}
      aria-label={`Open ${tool.name}`}
      className={cn(
        "group flex flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {/* ── Cover ───────────────────────────────────────────── */}
      <div className="relative">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] border-2 border-ink bg-card">
          {media.previewImageUrl && !imgFailed ? (
            <img
              src={media.previewImageUrl}
              alt={tool.name}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className={cn(
                "absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.05]",
                media.previewFit === "contain" ? "bg-white object-contain p-2" : "object-cover",
              )}
            />
          ) : (
            /* Gradient fallback when no preview image is available */
            <div className={cn("absolute inset-0 flex items-end p-4", toolGradient(tool))}>
              <span className="font-display text-lg font-bold leading-snug text-ink">{tool.name}</span>
            </div>
          )}
        </div>

        {/* Notch: a filled square paints over the card's bottom-right corner,
            making it look like a rounded chunk was bitten out. */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0"
          style={{ width: BLOCK, height: BLOCK, borderTopLeftRadius: BLOCK - DISC / 2, background: surface }}
        />
        {/* Fillet curves so the cut meets the cover's edges smoothly */}
        {([{ bottom: BLOCK, right: 0 }, { bottom: 0, right: BLOCK }] as const).map((pos, i) => (
          <div
            key={i}
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              ...pos,
              width: FILLET,
              height: FILLET,
              background: `radial-gradient(circle at top left, transparent ${FILLET - 0.5}px, ${surface} ${FILLET}px)`,
            }}
          />
        ))}

        {/* Arrow disc nested in the notch */}
        <span
          aria-hidden
          className="absolute bottom-0 right-0 flex items-center justify-center rounded-full border-2 border-ink bg-sun shadow-block-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-pink"
          style={{ width: DISC, height: DISC }}
        >
          <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>

      {/* ── Below the cover ─────────────────────────────────── */}
      <div className="mt-3 min-w-0 w-full">
        <h3 className="truncate font-display text-[15px] font-bold leading-snug text-foreground">
          {tool.name}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md border border-ink/20 bg-sand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink/70">
            {tool.category}
          </span>
          {price && (
            <span className="text-[11px] font-bold text-muted-foreground">{price}</span>
          )}
        </div>
      </div>
    </button>
  );
}
