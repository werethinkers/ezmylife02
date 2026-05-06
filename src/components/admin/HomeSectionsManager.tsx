import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

type Section = "hot" | "trending" | "featured" | "most_used";

const SECTIONS: { value: Section; label: string; emoji: string }[] = [
  { value: "hot", label: "Hot", emoji: "🔥" },
  { value: "trending", label: "Trending", emoji: "📈" },
  { value: "featured", label: "Featured", emoji: "⭐" },
  { value: "most_used", label: "Most Used", emoji: "🏆" },
];

interface Row {
  id: string;
  name: string;
  category: string;
  is_live: boolean;
  home_section: string | null;
  display_order: number;
}

export const HomeSectionsManager = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterSection, setFilterSection] = useState<string>("all");

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ["admin-home-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tools_catalog")
        .select("id, name, category, is_live, home_section, display_order")
        .eq("is_live", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const grouped = useMemo(() => {
    const g: Record<Section, Row[]> = { hot: [], trending: [], featured: [], most_used: [] };
    tools.forEach((t) => {
      if (t.home_section && g[t.home_section as Section]) g[t.home_section as Section].push(t);
    });
    return g;
  }, [tools]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tools.filter((t) => {
      if (filterSection === "all") {
        // ok
      } else if (filterSection === "none") {
        if (t.home_section) return false;
      } else if (t.home_section !== filterSection) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    });
  }, [tools, search, filterSection]);

  const update = async (id: string, value: string) => {
    const home_section = value === "none" ? null : value;
    const { error } = await supabase
      .from("tools_catalog")
      .update({ home_section })
      .eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Updated", description: home_section ? `Pinned to ${home_section}` : "Removed from home" });
    qc.invalidateQueries({ queryKey: ["admin-home-sections"] });
    qc.invalidateQueries({ queryKey: ["tools-catalog"] });
  };

  return (
    <div className="space-y-6">
      {/* Group preview */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SECTIONS.map((s) => (
          <Card key={s.value}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span>{s.emoji}</span> {s.label}
                <Badge variant="outline" className="ml-auto">{grouped[s.value].length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {grouped[s.value].length === 0 ? (
                <p className="text-xs text-muted-foreground">No tools pinned</p>
              ) : (
                <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                  {grouped[s.value].map((t) => (
                    <li key={t.id} className="truncate">• {t.name}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Pin tools to Home sections</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Choose which tools appear in each carousel on the public Tools page. Tools without a section won't show in any carousel.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tools…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterSection} onValueChange={setFilterSection}>
              <SelectTrigger className="md:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tools</SelectItem>
                <SelectItem value="none">Not pinned</SelectItem>
                {SECTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.emoji} {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading…</p>
          ) : (
            <div className="border rounded-lg divide-y max-h-[600px] overflow-y-auto">
              {filtered.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 hover:bg-muted/40">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.category} · {t.id}
                    </p>
                  </div>
                  <Select value={t.home_section ?? "none"} onValueChange={(v) => update(t.id, v)}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Not pinned —</SelectItem>
                      {SECTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.emoji} {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No tools match.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HomeSectionsManager;
