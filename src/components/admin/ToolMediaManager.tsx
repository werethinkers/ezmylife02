import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload, Loader2 } from "lucide-react";

interface MediaRow {
  id: string;
  tool_id: string;
  kind: string;
  url: string;
  alt: string | null;
  sort_order: number;
}

export const ToolMediaManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<MediaRow[]>([]);
  const [toolId, setToolId] = useState("");
  const [kind, setKind] = useState<"image" | "video" | "gif">("image");
  const [alt, setAlt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("tool_media").select("*").order("tool_id").order("sort_order");
    setItems((data as MediaRow[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const upload = async () => {
    if (!toolId || !file) {
      toast({ title: "Missing", description: "Tool ID and file required.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const path = `${toolId}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("tool-media").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("tool-media").getPublicUrl(path);
      const { error: insErr } = await supabase.from("tool_media").insert({
        tool_id: toolId, kind, url: pub.publicUrl, alt, sort_order: items.filter(i => i.tool_id === toolId).length,
      });
      if (insErr) throw insErr;
      toast({ title: "Added", description: "Media uploaded." });
      setFile(null); setAlt("");
      await load();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    await supabase.from("tool_media").delete().eq("id", id);
    await load();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Add tool media</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>Tool ID</Label>
              <Input placeholder="e.g. content-generator" value={toolId} onChange={(e) => setToolId(e.target.value)} />
            </div>
            <div>
              <Label>Kind</Label>
              <Select value={kind} onValueChange={(v: any) => setKind(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="gif">GIF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Alt text</Label>
              <Input value={alt} onChange={(e) => setAlt(e.target.value)} />
            </div>
          </div>
          <Input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button onClick={upload} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Existing media ({items.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((m) => (
              <div key={m.id} className="rounded-lg border border-border/50 overflow-hidden bg-muted">
                <div className="aspect-video">
                  {m.kind === "video"
                    ? <video src={m.url} muted loop autoPlay playsInline className="w-full h-full object-cover" />
                    : <img src={m.url} alt={m.alt ?? ""} className="w-full h-full object-cover" />}
                </div>
                <div className="p-2 text-xs flex items-center justify-between">
                  <span className="truncate">{m.tool_id}</span>
                  <Button size="icon" variant="ghost" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ToolMediaManager;
