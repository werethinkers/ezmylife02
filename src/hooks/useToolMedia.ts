// Single source of truth for tool icon + preview lookups.
// Always reads from the cached tools_catalog so the SAME tool shows the
// SAME icon and preview image on every page (Home, AI Apps, search results,
// Tool Viewer, admin thumbnails, etc.).
import { useMemo } from "react";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { resolveToolMedia, type ToolMedia } from "@/lib/toolMedia";

export function useToolMedia(
  toolId: string | undefined | null,
  category?: string | null,
): ToolMedia {
  const { data: catalog = [] } = useToolsCatalog();

  return useMemo(() => {
    if (!toolId) {
      return { iconUrl: null, previewImageUrl: null, iconFit: "cover", previewFit: "cover" };
    }
    const entry = catalog.find((c) => c.id === toolId) ?? null;
    return resolveToolMedia(toolId, category ?? entry?.category ?? "", entry);
  }, [toolId, category, catalog]);
}
