import { useMemo, useState } from "react";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { categoriesOf, inCategory } from "@/data/goals";
import { ToolLandscapeCard } from "./ToolLandscapeCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { ReactNode } from "react";

interface ExploreMoreToolsProps {
  onPreview?: (tool: { toolId: string; title: string; description: string; category: string; isLive: boolean; icon: ReactNode }) => void;
}

export const ExploreMoreTools = ({ onPreview }: ExploreMoreToolsProps) => {
  const { data: catalog = [] } = useToolsCatalog();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");

  const liveTools = useMemo(() => catalog.filter((t) => t.is_live), [catalog]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    liveTools.forEach((t) => categoriesOf(t).forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [liveTools]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = liveTools.filter((t) => {
      if (category !== "all" && !inCategory(t, category)) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "oldest":
          return a.created_at.localeCompare(b.created_at);
        case "newest":
        default:
          return b.created_at.localeCompare(a.created_at);
      }
    });
    return list;
  }, [liveTools, search, category, sort]);

  return (
    <section className="mt-16">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2 mb-2">
          <span>🧭</span> Explore More AI Apps
        </h2>
        <p className="text-sm text-muted-foreground">
          Browse the full catalog. Filter by category or search to find what you need.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="md:w-56 h-11">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="md:w-48 h-11">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="name">Name (A–Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No tools match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((t) => (
            <ToolLandscapeCard
              key={t.id}
              toolId={t.id}
              name={t.name}
              description={t.description}
              category={t.category}
              isLive={t.is_live}
              iconUrl={t.icon_url ?? null}
              onPreview={
                onPreview
                  ? () =>
                      onPreview({
                        toolId: t.id,
                        title: t.name,
                        description: t.description,
                        category: t.category,
                        isLive: t.is_live,
                        icon: null,
                      })
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default ExploreMoreTools;
