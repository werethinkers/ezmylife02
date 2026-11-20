// Single source of truth for tool icon + preview image resolution.
// Order: original preview in public/app-previews (see src/data/previewManifest.ts) → catalog DB asset → AI-generated icon map → null (component shows placeholder).
import { getToolIconUrl } from "@/data/toolIconMap";
import { appPreviewUrl } from "@/data/previewManifest";
import { appIconUrl } from "@/data/screenshotManifest";
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
  const ownIcon = appIconUrl(toolId);
  return {
    iconUrl: ownIcon ?? catalog?.icon_url ?? aiIcon,
    previewImageUrl: appPreviewUrl(toolId) ?? catalog?.preview_image_url ?? null,
    iconFit: ownIcon ? "cover" : ((catalog?.icon_fit as "cover" | "contain") ?? "cover"),
    previewFit: appPreviewUrl(toolId) ? "cover" : ((catalog?.preview_image_fit as "cover" | "contain") ?? "cover"),
  };
}
