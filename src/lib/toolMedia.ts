// Single source of truth for tool icon + preview image resolution.
// Order: catalog DB asset → AI-generated icon map → null (component shows placeholder).
import { getToolIconUrl } from "@/data/toolIconMap";
import type { CatalogTool } from "@/hooks/useToolsCatalog";

export interface ToolMedia {
  iconUrl: string | null;
  previewImageUrl: string | null;
  iconFit: "cover" | "contain";
  previewFit: "cover" | "contain";
}

export function resolveToolMedia(
  toolId: string,
  category?: string | null,
  catalog?: Partial<CatalogTool> | null,
): ToolMedia {
  const aiIcon = getToolIconUrl(toolId, category ?? "") ?? null;
  return {
    iconUrl: catalog?.icon_url ?? aiIcon,
    previewImageUrl: catalog?.preview_image_url ?? null,
    iconFit: (catalog?.icon_fit as "cover" | "contain") ?? "cover",
    previewFit: (catalog?.preview_image_fit as "cover" | "contain") ?? "cover",
  };
}
