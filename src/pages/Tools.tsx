import { useState, useMemo, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useHomeSections } from "@/hooks/useHomeSections";
import { EnhancedToolCard } from "@/components/tools/EnhancedToolCard";
import { ToolQuickPreview } from "@/components/tools/ToolQuickPreview";
import { ToolsHero } from "@/components/tools/ToolsHero";
import { ToolSection } from "@/components/tools/ToolSection";
import { ToolLandscapeCard } from "@/components/tools/ToolLandscapeCard";
import { ExploreMoreTools } from "@/components/tools/ExploreMoreTools";
import { ToolsEmptyState } from "@/components/tools/ToolsEmptyState";
import { ToolsChatbot } from "@/components/ToolsChatbot";
import { expandedTools } from "@/data/expandedTools";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { Sparkles } from "lucide-react";

interface PreviewTool {
  id?: string;
  toolId?: string;
  name?: string;
  title?: string;
  description: string;
  category?: string;
  isLive: boolean;
  icon: ReactNode;
}

const Tools = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTool, setPreviewTool] = useState<PreviewTool | null>(null);

  const { data: catalogTools = [] } = useToolsCatalog();
  const { hot, trending, featured, mostUsed } = useHomeSections();
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const favoriteTools = useMemo(
    () => catalogTools.filter((t) => t.is_live && favorites.has(t.id)),
    [catalogTools, favorites]
  );

  const catalogById = useMemo(() => {
    const m = new Map<string, typeof catalogTools[number]>();
    catalogTools.forEach((t) => m.set(t.id, t));
    return m;
  }, [catalogTools]);

  // Global search across catalog + expanded
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    type R = {
      id: string;
      name: string;
      description: string;
      category: string;
      isLive: boolean;
      isFree: boolean;
      icon: ReactNode;
    };
    const out = new Map<string, R>();
    catalogTools.forEach((t) => {
      if (!t.is_live) return;
      if (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      ) {
        out.set(t.id, {
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          isLive: t.is_live,
          isFree: !!t.is_free,
          icon: <Sparkles className="h-8 w-8" />,
        });
      }
    });
    expandedTools.forEach((t) => {
      if (out.has(t.id)) return;
      if (!t.isLive) return;
      if (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q)
      ) {
        out.set(t.id, {
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.department,
          isLive: t.isLive,
          isFree: false,
          icon: t.icon,
        });
      }
    });
    return Array.from(out.values());
  }, [searchQuery, catalogTools]);

  const isSearching = searchQuery.trim().length > 0;

  const handlePreview = useCallback((tool: PreviewTool) => {
    setPreviewTool(tool);
    setPreviewOpen(true);
  }, []);

  const renderCard = (t: { id: string; name: string; description: string; category: string; isLive: boolean; iconUrl?: string | null }) => {
    const c = catalogById.get(t.id);
    return (
      <ToolLandscapeCard
        key={t.id}
        toolId={t.id}
        name={t.name}
        description={t.description}
        category={t.category}
        isLive={t.isLive}
        iconUrl={t.iconUrl ?? c?.icon_url ?? null}
        previewImageUrl={c?.preview_image_url ?? null}
        previewImageFit={(c?.preview_image_fit as "cover" | "contain") ?? "cover"}
        rating={c?.rating ?? null}
        reviewCount={c?.review_count ?? null}
        onPreview={() =>
          handlePreview({
            toolId: t.id,
            title: t.name,
            description: t.description,
            category: t.category,
            isLive: t.isLive,
            icon: <Sparkles className="h-8 w-8" />,
          })
        }
      />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="200+ Live AI Apps (2,000+ Coming Soon) — Browse Without Signup | EZYOURLIFE"
        description="Browse 200+ live AI apps today (2,000+ launching within a year) — no signup needed. The Future's First AI App Store."
        path="/ai-apps"
        keywords="free ai apps, no signup ai apps, ezyourlife ai apps"
      />
      <Navbar />

      <ToolsHero searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="container mx-auto px-4 py-10">
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <h2 className="text-xl font-semibold">
                  Search results for "{searchQuery}"
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({searchResults.length} found)
                  </span>
                </h2>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-sm text-primary hover:underline"
                >
                  Clear search
                </button>
              </div>
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {searchResults.map((tool, index) => (
                    <EnhancedToolCard
                      key={tool.id}
                      id={tool.id}
                      toolId={tool.id}
                      name={tool.name}
                      description={tool.description}
                      category={tool.category}
                      isLive={tool.isLive}
                      isFree={tool.isFree}
                      iconUrl={catalogById.get(tool.id)?.icon_url ?? null}
                      icon={tool.icon}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <ToolsEmptyState
                  onClearFilters={() => setSearchQuery("")}
                  hasActiveFilters={true}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="sections"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {user && favoriteTools.length > 0 && (
                <ToolSection title="Favourite Apps" emoji="❤️" direction="ltr">
                  {favoriteTools.map((t) => renderCard({
                    id: t.id, name: t.name, description: t.description,
                    category: t.category, isLive: t.is_live, iconUrl: t.icon_url,
                  }))}
                </ToolSection>
              )}
              <ToolSection title="Hot Tools" emoji="🔥" direction="ltr">
                {hot.map(renderCard)}
              </ToolSection>
              <ToolSection title="Trending Tools" emoji="📈" direction="rtl">
                {trending.map(renderCard)}
              </ToolSection>
              <ToolSection title="Featured AI Apps" emoji="⭐" direction="ltr">
                {featured.map(renderCard)}
              </ToolSection>
              <ToolSection title="Most Used Tools" emoji="🏆" direction="rtl">
                {mostUsed.map(renderCard)}
              </ToolSection>
              <ExploreMoreTools onPreview={handlePreview} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ToolQuickPreview open={previewOpen} onOpenChange={setPreviewOpen} tool={previewTool} />
      <ToolsChatbot />
      <SEOFooter />
    </div>
  );
};

export default Tools;
