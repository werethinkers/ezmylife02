import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Search, Plus, Trash2, X, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface HomeSection {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  display_order: number;
  is_active: boolean;
}
interface Tool { id: string; name: string; category: string; is_live: boolean }
interface Assignment { tool_id: string; section_id: string; position: number }

export const HomeSectionsManager = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const { data: sections = [] } = useQuery({
    queryKey: ["home-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_sections")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return (data ?? []) as HomeSection[];
    },
  });

  const { data: tools = [] } = useQuery({
    queryKey: ["home-sections-tools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tools_catalog")
        .select("id, name, category, is_live")
        .eq("is_live", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Tool[];
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["section-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tool_section_assignments").select("tool_id, section_id, position");
      if (error) throw error;
      return (data ?? []) as Assignment[];
    },
  });

  const currentSection = activeSectionId
    ? sections.find((s) => s.id === activeSectionId)
    : sections[0];
  const currentId = currentSection?.id;

  // Ordered list of tool IDs assigned to the current section
  const currentOrdered = useMemo(() => {
    if (!currentId) return [] as Assignment[];
    return assignments
      .filter((a) => a.section_id === currentId)
      .sort((a, b) => a.position - b.position);
  }, [assignments, currentId]);

  const inCurrent = useMemo(() => new Set(currentOrdered.map((a) => a.tool_id)), [currentOrdered]);

  const countsBySection = useMemo(() => {
    const m = new Map<string, number>();
    assignments.forEach((a) => m.set(a.section_id, (m.get(a.section_id) ?? 0) + 1));
    return m;
  }, [assignments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((t) =>
      t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
    );
  }, [tools, search]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["section-assignments"] });
    qc.invalidateQueries({ queryKey: ["home-sections"] });
    qc.invalidateQueries({ queryKey: ["home-sections-public"] });
  };

  const toggleAssignment = async (toolId: string) => {
    if (!currentId) return;
    if (inCurrent.has(toolId)) {
      const { error } = await supabase
        .from("tool_section_assignments")
        .delete()
        .eq("tool_id", toolId)
        .eq("section_id", currentId);
      if (error) return toast({ title: "Remove failed", description: error.message, variant: "destructive" });
    } else {
      const nextPos = currentOrdered.length;
      const { error } = await supabase
        .from("tool_section_assignments")
        .insert({ tool_id: toolId, section_id: currentId, position: nextPos });
      if (error) return toast({ title: "Add failed", description: error.message, variant: "destructive" });
    }
    invalidateAll();
  };

  const moveTool = async (toolId: string, direction: -1 | 1) => {
    if (!currentId) return;
    const idx = currentOrdered.findIndex((a) => a.tool_id === toolId);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= currentOrdered.length) return;
    const a = currentOrdered[idx];
    const b = currentOrdered[swapIdx];
    // Swap positions
    const updates = await Promise.all([
      supabase.from("tool_section_assignments")
        .update({ position: b.position })
        .eq("tool_id", a.tool_id).eq("section_id", currentId),
      supabase.from("tool_section_assignments")
        .update({ position: a.position })
        .eq("tool_id", b.tool_id).eq("section_id", currentId),
    ]);
    const err = updates.find((u) => u.error)?.error;
    if (err) return toast({ title: "Reorder failed", description: err.message, variant: "destructive" });
    invalidateAll();
  };

  const normalizePositions = async () => {
    if (!currentId) return;
    // Rewrite positions to 0..n-1 in current order (helps when positions are non-contiguous)
    await Promise.all(
      currentOrdered.map((a, i) =>
        supabase.from("tool_section_assignments")
          .update({ position: i })
          .eq("tool_id", a.tool_id).eq("section_id", currentId)
      )
    );
    invalidateAll();
    toast({ title: "Order normalized" });
  };

  const createSection = async () => {
    if (!newSlug.trim() || !newTitle.trim()) return;
    const { error } = await supabase.from("home_sections").insert({
      slug: newSlug.trim().toLowerCase().replace(/\s+/g, "_"),
      title: newTitle.trim(),
      display_order: sections.length + 1,
    });
    if (error) return toast({ title: "Create failed", description: error.message, variant: "destructive" });
    setNewSlug(""); setNewTitle("");
    invalidateAll();
    toast({ title: "Section created" });
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Delete this section and all its tool assignments?")) return;
    const { error } = await supabase.from("home_sections").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    if (activeSectionId === id) setActiveSectionId(null);
    invalidateAll();
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("home_sections").update({ is_active }).eq("id", id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    invalidateAll();
  };

  const renameSection = async (id: string, title: string) => {
    const { error } = await supabase.from("home_sections").update({ title }).eq("id", id);
    if (error) return toast({ title: "Rename failed", description: error.message, variant: "destructive" });
    invalidateAll();
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const reorderSections = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex((s) => s.id === active.id);
    const newIdx = sections.findIndex((s) => s.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(sections, oldIdx, newIdx);
    qc.setQueryData(["home-sections"], next.map((s, i) => ({ ...s, display_order: i + 1 })));
    const updates = await Promise.all(
      next.map((s, i) =>
        supabase.from("home_sections").update({ display_order: i + 1 }).eq("id", s.id)
      )
    );
    const err = updates.find((u) => u.error)?.error;
    if (err) toast({ title: "Reorder failed", description: err.message, variant: "destructive" });
    invalidateAll();
  };

  const reorderTools = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!currentId || !over || active.id === over.id) return;
    const oldIdx = currentOrdered.findIndex((a) => a.tool_id === active.id);
    const newIdx = currentOrdered.findIndex((a) => a.tool_id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(currentOrdered, oldIdx, newIdx);
    qc.setQueryData(["section-assignments"], (prev: Assignment[] = []) => {
      const others = prev.filter((a) => a.section_id !== currentId);
      const updated = next.map((a, i) => ({ ...a, position: i }));
      return [...others, ...updated];
    });
    const updates = await Promise.all(
      next.map((a, i) =>
        supabase.from("tool_section_assignments")
          .update({ position: i })
          .eq("tool_id", a.tool_id).eq("section_id", currentId)
      )
    );
    const err = updates.find((u) => u.error)?.error;
    if (err) toast({ title: "Reorder failed", description: err.message, variant: "destructive" });
    invalidateAll();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Home sections</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create as many sections as you want (Hot, Trending, etc.). The same tool can live in multiple sections.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            {sections.map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  currentId === s.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                }`}
              >
                <button
                  onClick={() => setActiveSectionId(s.id)}
                  className="flex-1 text-left flex items-center gap-3 min-w-0"
                >
                  <Input
                    value={s.title}
                    onChange={(e) => renameSection(s.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 max-w-xs"
                  />
                  <span className="text-xs text-muted-foreground truncate">/{s.slug}</span>
                </button>
                <Badge variant="outline">{countsBySection.get(s.id) ?? 0} tools</Badge>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <Switch checked={s.is_active} onCheckedChange={(v) => toggleActive(s.id, v)} />
                </div>
                <Button size="icon" variant="ghost" onClick={() => deleteSection(s.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Input
              placeholder="slug (e.g. hot)"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              className="max-w-xs"
            />
            <Input
              placeholder="Display title (e.g. Hot Right Now)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1"
            />
            <Button onClick={createSection}>
              <Plus className="h-4 w-4 mr-2" /> Add section
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentSection && (
        <Card>
          <CardHeader>
            <CardTitle>
              Assign tools to <span className="text-primary">{currentSection.title}</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Click any tool to add or remove it from this section. A tool can be in many sections.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tools…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {currentOrdered.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    In this section · drag-free reorder ({currentOrdered.length})
                  </p>
                  <Button size="sm" variant="ghost" onClick={normalizePositions} className="h-7 text-xs">
                    Normalize order
                  </Button>
                </div>
                <div className="border rounded-lg divide-y">
                  {currentOrdered.map((a, i) => {
                    const t = tools.find((tt) => tt.id === a.tool_id);
                    const name = t?.name ?? a.tool_id;
                    const cat = t?.category ?? "";
                    return (
                      <div key={a.tool_id} className="flex items-center gap-2 p-2.5">
                        <span className="text-xs font-mono text-muted-foreground w-6 text-right">{i + 1}.</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{cat} · {a.tool_id}</p>
                        </div>
                        <Button
                          size="icon" variant="ghost"
                          disabled={i === 0}
                          onClick={() => moveTool(a.tool_id, -1)}
                          aria-label="Move up"
                          className="h-7 w-7"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon" variant="ghost"
                          disabled={i === currentOrdered.length - 1}
                          onClick={() => moveTool(a.tool_id, 1)}
                          aria-label="Move down"
                          className="h-7 w-7"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon" variant="ghost"
                          onClick={() => toggleAssignment(a.tool_id)}
                          aria-label="Remove from section"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">
              {filtered.map((t) => {
                const isIn = inCurrent.has(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleAssignment(t.id)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.category} · {t.id}</p>
                    </div>
                    <Badge variant={isIn ? "default" : "outline"}>{isIn ? "In section" : "Add"}</Badge>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HomeSectionsManager;
