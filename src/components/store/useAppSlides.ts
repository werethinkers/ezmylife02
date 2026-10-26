import { useMemo } from "react";
import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { goalOf, giveGetFor } from "@/data/goals";
import { resolveToolMedia } from "@/lib/toolMedia";
import { usePricingMap } from "@/hooks/usePricingMap";
import type { HeroSlide } from "./HeroCarousel";

/** Turn apps into slides for the big carousel: the goal colour, the whole preview, what you get, the price. */
export function useAppSlides(tools: CatalogTool[], eyebrow: (t: CatalogTool) => string = (t) => goalOf(t.category).name): HeroSlide[] {
  const { costOf } = usePricingMap();
  return useMemo(
    () =>
      tools.map((t) => {
        const media = resolveToolMedia(t.id, t.category, t);
        const cost = costOf(t.id);
        return {
          key: t.id,
          eyebrow: eyebrow(t),
          title: t.name,
          line: t.description || `You get ${giveGetFor(t.category, { toolTypes: t.tool_types }).get}.`,
          color: goalOf(t.category).color,
          image: media.previewImageUrl ?? undefined,
          to: `/promo/${t.id}`,
          cta: "See what it does",
          price: `${cost} credit${cost === 1 ? "" : "s"}`,
        } satisfies HeroSlide;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tools, costOf],
  );
}
