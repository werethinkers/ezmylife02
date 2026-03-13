import { useState, useEffect } from "react";
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
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, Upload, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface CatalogTool {
  id: string;
  name: string;
  description: string;
  category: string;
  tool_types: string[];
  source: string;
  is_live: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  "Image Processing", "Business & Finance", "Content Creation", "Education",
  "Social Media", "Design", "Productivity", "AI Tools", "Development", "Other"
];

const SOURCES = ["business", "featured"];

const emptyTool: Omit<CatalogTool, "created_at" | "updated_at"> = {
  id: "",
  name: "",
  description: "",
  category: "Other",
  tool_types: [],
  source: "featured",
  is_live: false,
};

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
  const [toolTypesInput, setToolTypesInput] = useState("");

  const fetchTools = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tools_catalog")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load tools");
    } else {
      setTools((data as CatalogTool[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTools(); }, []);

  const filteredTools = tools.filter(t => {
    const matchesSearch = !search || 
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterLive === "all" || 
      (filterLive === "live" && t.is_live) || 
      (filterLive === "draft" && !t.is_live);
    return matchesSearch && matchesFilter;
  });

  const openAdd = () => {
    setEditingTool({ ...emptyTool });
    setToolTypesInput("");
    setIsNew(true);
    setDialogOpen(true);
  };

  const openEdit = (tool: CatalogTool) => {
    setEditingTool({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      tool_types: tool.tool_types,
      source: tool.source,
      is_live: tool.is_live,
    });
    setToolTypesInput(tool.tool_types.join(", "));
    setIsNew(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingTool || !editingTool.id || !editingTool.name) {
      toast.error("ID and Name are required");
      return;
    }
    setSaving(true);
    const toolTypes = toolTypesInput.split(",").map(s => s.trim()).filter(Boolean);
    const payload = {
      id: editingTool.id,
      name: editingTool.name,
      description: editingTool.description,
      category: editingTool.category,
      tool_types: toolTypes,
      source: editingTool.source,
      is_live: editingTool.is_live,
    };

    if (isNew) {
      const { error } = await supabase.from("tools_catalog").insert(payload);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Tool added successfully");
        setDialogOpen(false);
        fetchTools();
      }
    } else {
      const { error } = await supabase
        .from("tools_catalog")
        .update({
          name: payload.name,
          description: payload.description,
          category: payload.category,
          tool_types: payload.tool_types,
          source: payload.source,
          is_live: payload.is_live,
        })
        .eq("id", editingTool.id);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Tool updated successfully");
        setDialogOpen(false);
        fetchTools();
      }
    }
    setSaving(false);
  };

  const toggleLive = async (tool: CatalogTool) => {
    const { error } = await supabase
      .from("tools_catalog")
      .update({ is_live: !tool.is_live })
      .eq("id", tool.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${tool.name} is now ${!tool.is_live ? "live" : "draft"}`);
      fetchTools();
    }
  };

  const confirmDelete = async () => {
    if (!toolToDelete) return;
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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{tools.length}</p>
            <p className="text-xs text-muted-foreground">Total Tools</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{liveCount}</p>
            <p className="text-xs text-muted-foreground">Live</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{draftCount}</p>
            <p className="text-xs text-muted-foreground">Draft</p>
          </CardContent>
        </Card>
      </div>

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
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openAdd} className="gap-2">
              <Plus className="h-4 w-4" /> Add Tool
            </Button>
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
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTools.map(tool => (
                <TableRow key={tool.id}>
                  <TableCell className="font-medium text-sm">{tool.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{tool.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{tool.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={tool.source === "business" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"}>
                      {tool.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleLive(tool)}
                      className="flex items-center gap-1.5"
                    >
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
              ))}
              {filteredTools.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
            <div className="space-y-4">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={editingTool.category}
                    onValueChange={v => setEditingTool({ ...editingTool, category: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
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
              <div className="space-y-2">
                <Label>Tool Types (comma-separated)</Label>
                <Input
                  value={toolTypesInput}
                  onChange={e => setToolTypesInput(e.target.value)}
                  placeholder="e.g. ai, image, productivity"
                />
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : isNew ? "Add Tool" : "Save Changes"}
            </Button>
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
            Are you sure you want to delete <strong>{toolToDelete?.name}</strong>? This action cannot be undone.
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
