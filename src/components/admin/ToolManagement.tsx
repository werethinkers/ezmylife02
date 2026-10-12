import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, ExternalLink, Upload, Crown, GripVertical, Gift } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ToolFileUploader } from "./ToolFileUploader";
import { useToolViewCounts } from "@/hooks/useToolViewCounts";
import { ToolViewChart } from "./ToolViewChart";
import { GroupingPicker } from "./GroupingPicker";
import { useRefreshGroupings } from "@/hooks/useCategoryRows";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CatalogTool {
  id: string;
  name: string;
  description: string;
  category: string;
  tool_types: string[];
  /** Other categories it is also listed under (absent until the database update is applied). */
  extra_categories?: string[];
  source: string;
  is_live: boolean;
  has_uploaded_files: boolean;
  is_premium: boolean;
  is_free: boolean;
  display_order: number;
  dedicated_route: string | null;
  icon_url: string | null;
  created_at: string;
  updated_at: string;
}

const SOURCES = ["business", "featured"];

const emptyTool: Omit<CatalogTool, "created_at" | "updated_at"> = {
  id: "",
  name: "",
  description: "",
  category: "",
  tool_types: [],
  extra_categories: [],
  source: "featured",
  is_live: false,
  has_uploaded_files: false,
  is_premium: false,
  is_free: false,
  display_order: 0,
  dedicated_route: null,
  icon_url: null,
};

// --- Sortable card component ---
function SortableToolCard({ tool }: { tool: CatalogTool }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tool.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-card border rounded-md text-sm"
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className="font-medium truncate flex-1">{tool.name}</span>
      {tool.is_free && <Badge variant="outline" className="text-xs gap-1"><Gift className="h-3 w-3" />FREE</Badge>}
      <Badge variant="outline" className="text-xs">{tool.category}</Badge>
    </div>
  );
}

export const ToolManagement = () => {
  const [tools, setTools] = useState<CatalogTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLive, setFilterLive] = useState<"all" | "live" | "draft">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Omit<CatalogTool, "created_at" | "updated_at"> | null>(null);
  const [toolToDelete, setToolToDelete] = useState<CatalogTool | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const refreshGroupings = useRefreshGroupings();
  const [dialogTab, setDialogTab] = useState<"details" | "files">("details");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const fetchTools = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tools_catalog")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load tools");
    } else {
      setTools((data as unknown as CatalogTool[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTools(); }, []);

  // Live tools only, sorted by display_order — for drag-drop section
  const liveToolsOrdered = useMemo(
    () => tools.filter((t) => t.is_live).sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
    [tools]
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = liveToolsOrdered.findIndex((t) => t.id === active.id);
    const newIndex = liveToolsOrdered.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(liveToolsOrdered, oldIndex, newIndex);
    // Optimistic UI
    setTools((prev) => {
      const map = new Map(prev.map((t) => [t.id, t]));
      reordered.forEach((t, idx) => {
        const cur = map.get(t.id);
        if (cur) map.set(t.id, { ...cur, display_order: idx });
      });
      return Array.from(map.values());
    });

    // Batch update display_order
    const updates = reordered.map((t, idx) =>
      supabase.from("tools_catalog").update({ display_order: idx } as never).eq("id", t.id)
    );
    const results = await Promise.all(updates);
    const failed = results.filter((r) => r.error);
    if (failed.length > 0) {
      toast.error("Failed to save new order");
      fetchTools();
    } else {
      toast.success("Order saved");
    }
  };

  const filteredTools = tools.filter(t => {
    const matchesSearch = !search || 
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.extra_categories ?? []).some((c) => c.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filterLive === "all" || 
      (filterLive === "live" && t.is_live) || 
      (filterLive === "draft" && !t.is_live);
    return matchesSearch && matchesFilter;
  });

  const openAdd = () => {
    setEditingTool({ ...emptyTool });
    setIsNew(true);
    setDialogTab("details");
    setDialogOpen(true);
  };

  const openEdit = (tool: CatalogTool) => {
    setEditingTool({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      tool_types: tool.tool_types ?? [],
      extra_categories: tool.extra_categories ?? [],
      source: tool.source,
      is_live: tool.is_live,
      has_uploaded_files: tool.has_uploaded_files,
      is_premium: tool.is_premium,
      is_free: tool.is_free,
      display_order: tool.display_order,
      dedicated_route: tool.dedicated_route,
      icon_url: tool.icon_url ?? null,
    });
    setIsNew(false);
    setDialogTab("details");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingTool || !editingTool.id || !editingTool.name) {
      toast.error("ID and Name are required");
      return;
    }
    if (!editingTool.category) {
      toast.error("Pick a main category so the app shows up in the right group");
      return;
    }
    setSaving(true);
    // The "also in" column only exists once the database update is applied; leave it out until then.
    const hasExtraColumn = tools.some((t) => "extra_categories" in t);
    const payload = {
      id: editingTool.id,
      name: editingTool.name,
      description: editingTool.description,
      category: editingTool.category,
      tool_types: editingTool.tool_types,
      ...(hasExtraColumn ? { extra_categories: (editingTool.extra_categories ?? []).filter((c) => c !== editingTool.category) } : {}),
      source: editingTool.source,
      is_live: editingTool.is_live,
      is_premium: editingTool.is_premium,
      is_free: editingTool.is_free,
      dedicated_route: editingTool.dedicated_route || null,
      icon_url: editingTool.icon_url || null,
    };

    if (isNew) {
      const { error } = await supabase.from("tools_catalog").insert(payload as never);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Tool added successfully");
        refreshGroupings();
        setDialogOpen(false);
        fetchTools();
      }
    } else {
      const { id, ...updatePayload } = payload;
      const { error } = await supabase
        .from("tools_catalog")
        .update(updatePayload as never)
        .eq("id", editingTool.id);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Tool updated successfully");
        refreshGroupings();
        setDialogOpen(false);
        fetchTools();
      }
    }
    setSaving(false);
  };

  const toggleLive = async (tool: CatalogTool) => {
    const { error } = await supabase
      .from("tools_catalog")
      .update({ is_live: !tool.is_live } as never)
      .eq("id", tool.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${tool.name} is now ${!tool.is_live ? "live" : "draft"}`);
      fetchTools();
    }
  };

  const toggleFree = async (tool: CatalogTool) => {
    const { error } = await supabase
      .from("tools_catalog")
      .update({ is_free: !tool.is_free } as never)
      .eq("id", tool.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${tool.name} is now ${!tool.is_free ? "FREE" : "premium"}`);
      fetchTools();
    }
  };

  const confirmDelete = async () => {
    if (!toolToDelete) return;
    if (toolToDelete.has_uploaded_files) {
      const { data: files } = await supabase.storage
        .from("tool-uploads")
        .list(toolToDelete.id);
      if (files && files.length > 0) {
        await supabase.storage
          .from("tool-uploads")
          .remove(files.map(f => `${toolToDelete.id}/${f.name}`));
      }
    }
    const { error } = await supabase.from("tools_catalog").delete().eq("id", toolToDelete.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Tool deleted");
      setDeleteDialogOpen(false);
      setToolToDelete(null);
      fetchTools();
    }
  };

  const liveCount = tools.filter(t => t.is_live).length;
  const draftCount = tools.filter(t => !t.is_live).length;
  const uploadedCount = tools.filter(t => t.has_uploaded_files).length;
  const freeCount = tools.filter(t => t.is_free).length;

  const toolIds = useMemo(() => tools.map((t) => t.id), [tools]);
  const { data: viewStats } = useToolViewCounts(toolIds);
  const toolNameMap = useMemo(() => new Map(tools.map((t) => [t.id, t.name])), [tools]);
  const totalViews = useMemo(
    () => Array.from(viewStats?.values() ?? []).reduce((s, v) => s + v.view_count, 0),
    [viewStats]
  );

  return (
    <div className="space-y-6">
      {/* Stats — live tools only */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-500">{liveCount}</p><p className="text-xs text-muted-foreground">Live Tools</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-500">{uploadedCount}</p><p className="text-xs text-muted-foreground">With Files</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-500">{totalViews.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Views</p></CardContent></Card>
      </div>

      {/* Per-tool view chart */}
      <ToolViewChart stats={viewStats ?? new Map()} toolNames={toolNameMap} />

      {/* Drag-drop ordering */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GripVertical className="h-4 w-4" /> Live Tool Order (drag to reorder)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Drag the cards below to set the order live tools appear in the Featured grid on /tools.
          </p>
          {liveToolsOrdered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No live tools yet.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={liveToolsOrdered.map((t) => t.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {liveToolsOrdered.map((t) => (
                    <SortableToolCard key={t.id} tool={t} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-3 items-center flex-1 w-full sm:w-auto">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tools..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterLive} onValueChange={(v: "all" | "live" | "draft") => setFilterLive(v)}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Add Tool</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tools Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Free</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTools.map(tool => {
                const stat = viewStats?.get(tool.id);
                return (
                <TableRow key={tool.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{tool.name}</span>
                      {tool.is_premium && <Crown className="h-3.5 w-3.5 text-yellow-500" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{tool.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge variant="outline" className="text-xs">{tool.category}</Badge>
                      {(tool.extra_categories ?? []).length > 0 && (
                        <Badge variant="secondary" className="text-xs" title={(tool.extra_categories ?? []).join(", ")}>+{(tool.extra_categories ?? []).length}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {tool.has_uploaded_files ? (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 text-xs gap-1">
                        <Upload className="h-3 w-3" /> Uploaded
                      </Badge>
                    ) : tool.dedicated_route ? (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-500 text-xs">
                        Internal App
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">{tool.source}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch checked={tool.is_free} onCheckedChange={() => toggleFree(tool)} />
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggleLive(tool)} className="flex items-center gap-1.5">
                      {tool.is_live ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 cursor-pointer gap-1">
                          <Eye className="h-3 w-3" /> Live
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600 hover:bg-yellow-500/10 cursor-pointer gap-1">
                          <EyeOff className="h-3 w-3" /> Draft
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {stat ? (
                      <div className="leading-tight">
                        <div className="font-semibold">{stat.view_count.toLocaleString()}</div>
                        <div className="text-muted-foreground">{stat.unique_visitors.toLocaleString()} unique</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(tool.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(tool)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => { setToolToDelete(tool); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`/tool/${tool.id}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
              {filteredTools.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    {loading ? "Loading tools..." : "No tools found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Add New Tool" : "Edit Tool"}</DialogTitle>
          </DialogHeader>
          {editingTool && (
            <Tabs value={dialogTab} onValueChange={(v) => setDialogTab(v as "details" | "files")}>
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                <TabsTrigger value="files" className="flex-1" disabled={isNew && !editingTool.id}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Files
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Tool ID (slug)</Label>
                  <Input
                    value={editingTool.id}
                    onChange={e => setEditingTool({ ...editingTool, id: e.target.value })}
                    placeholder="e.g. my-new-tool"
                    disabled={!isNew}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editingTool.name}
                    onChange={e => setEditingTool({ ...editingTool, name: e.target.value })}
                    placeholder="My New Tool"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editingTool.description}
                    onChange={e => setEditingTool({ ...editingTool, description: e.target.value })}
                    placeholder="What does this tool do?"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon URL (optional)</Label>
                  <div className="flex gap-2 items-start">
                    <Input
                      value={editingTool.icon_url ?? ""}
                      onChange={e => setEditingTool({ ...editingTool, icon_url: e.target.value || null })}
                      placeholder="https://example.com/icon.png"
                    />
                    {editingTool.icon_url && (
                      <img
                        src={editingTool.icon_url}
                        alt="preview"
                        className="h-10 w-10 rounded-md border object-contain bg-muted"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Public URL of the tool's icon. Leave blank to use the default.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select
                      value={editingTool.source}
                      onValueChange={v => setEditingTool({ ...editingTool, source: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <GroupingPicker
                  value={{ category: editingTool.category, extra: editingTool.extra_categories ?? [], tags: editingTool.tool_types ?? [] }}
                  onChange={(g) => setEditingTool({ ...editingTool, category: g.category, extra_categories: g.extra, tool_types: g.tags })}
                  allTools={tools}
                />
                <div className="space-y-2">
                  <Label>Dedicated Route (optional, for internal apps)</Label>
                  <Input
                    value={editingTool.dedicated_route || ""}
                    onChange={e => setEditingTool({ ...editingTool, dedicated_route: e.target.value || null })}
                    placeholder="e.g. /startup-analyser"
                  />
                  <p className="text-xs text-muted-foreground">
                    For tools coded into the app (like Startup Analyser). Leave empty for uploaded or embedded tools.
                  </p>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Switch
                    checked={editingTool.is_free}
                    onCheckedChange={v => setEditingTool({ ...editingTool, is_free: v })}
                  />
                  <div>
                    <Label className="cursor-pointer flex items-center gap-1.5">
                      <Gift className="h-3.5 w-3.5 text-blue-500" />
                      {editingTool.is_free ? "Free — anyone can use" : "Requires subscription"}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Free tools bypass the premium check entirely
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Switch
                    checked={editingTool.is_premium}
                    onCheckedChange={v => setEditingTool({ ...editingTool, is_premium: v })}
                  />
                  <div>
                    <Label className="cursor-pointer flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5 text-yellow-500" />
                      {editingTool.is_premium ? "Premium tool" : "Standard tool"}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Marks tool as premium-tier
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Switch
                    checked={editingTool.is_live}
                    onCheckedChange={v => setEditingTool({ ...editingTool, is_live: v })}
                  />
                  <div>
                    <Label className="cursor-pointer">
                      {editingTool.is_live ? "Live — visible to all users" : "Draft — only visible to admin for testing"}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Keep as draft to test the tool before publishing
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="files" className="mt-4">
                {editingTool.id ? (
                  <ToolFileUploader
                    toolId={editingTool.id}
                    onUploadComplete={fetchTools}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Save the tool first to upload files
                  </p>
                )}
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            {dialogTab === "details" && (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : isNew ? "Add Tool" : "Save Changes"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tool</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{toolToDelete?.name}</strong>?
            {toolToDelete?.has_uploaded_files && " All uploaded files will also be deleted."}
            {" "}This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
