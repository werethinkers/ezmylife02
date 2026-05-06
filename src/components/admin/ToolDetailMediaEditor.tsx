import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Upload, Loader2, Image as ImageIcon, Video } from "lucide-react";
import { toast } from "sonner";

interface MediaRow {
  id: string;
  tool_id: string;
  kind: string;
  url: string;
  alt: string | null;
  sort_order: number;
}

const MAX_IMAGES = 4;
const MAX_VIDEOS = 1;

export const ToolDetailMediaEditor = ({ toolId }: { toolId: string }) => {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tool_media")
      .select("*")
      .eq("tool_id", toolId)
      .order("sort_order");
    setItems(((data as MediaRow[]) || []).filter((i) => i.kind !== "icon"));
    setLoading(false);
  };

  useEffect(() => { load(); }, [toolId]);

  const images = items.filter((i) => i.kind === "image" || i.kind === "gif");
  const videos = items.filter((i) => i.kind === "video");

  const upload = async (file: File, kind: "image" | "video") => {
    if (kind === "image" && images.length >= MAX_IMAGES) {
      toast.error(`Max ${MAX_IMAGES} images. Remove one first.`);
      return;
    }
    if (kind === "video" && videos.length >= MAX_VIDEOS) {
      toast.error(`Max ${MAX_VIDEOS} video. Remove it first.`);
      return;
    }
    setBusy(true);
    try {
      const path = `${toolId}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("tool-media").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("tool-media").getPublicUrl(path);
      const sort_order = items.length;
      const { error: insErr } = await supabase.from("tool_media").insert({
        tool_id: toolId, kind, url: pub.publicUrl, alt: file.name, sort_order,
      });
      if (insErr) throw insErr;
      toast.success(`${kind === "video" ? "Video" : "Image"} added`);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    await supabase.from("tool_media").delete().eq("id", id);
    await load();
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-xs text-muted-foreground">
        Upload up to <strong>{MAX_IMAGES} images</strong> and <strong>{MAX_VIDEOS} video</strong> for the tool's app-store style detail page.
      </div>

      {/* Images */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Images ({images.length}/{MAX_IMAGES})</Label>
          <Input
            type="file"
            accept="image/*"
            disabled={busy || images.length >= MAX_IMAGES}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "image"); e.target.value = ""; }}
            className="w-auto"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {images.map((i) => (
            <div key={i.id} className="relative group rounded-lg overflow-hidden border border-border aspect-[3/4] bg-muted">
              <img src={i.url} alt={i.alt || ""} className="w-full h-full object-cover" />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition"
                onClick={() => remove(i.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {images.length === 0 && (
            <div className="col-span-full text-center text-xs text-muted-foreground py-6 border border-dashed rounded-lg">
              No images uploaded
            </div>
          )}
        </div>
      </div>

      {/* Video */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="flex items-center gap-2"><Video className="h-4 w-4" /> Video ({videos.length}/{MAX_VIDEOS})</Label>
          <Input
            type="file"
            accept="video/*"
            disabled={busy || videos.length >= MAX_VIDEOS}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "video"); e.target.value = ""; }}
            className="w-auto"
          />
        </div>
        {videos.map((v) => (
          <div key={v.id} className="relative group rounded-lg overflow-hidden border border-border bg-muted">
            <video src={v.url} controls className="w-full max-h-64" />
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-1 right-1 h-7 w-7"
              onClick={() => remove(v.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {videos.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-6 border border-dashed rounded-lg">
            No video uploaded
          </div>
        )}
      </div>

      {busy && (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
        </p>
      )}
    </div>
  );
};

export default ToolDetailMediaEditor;
