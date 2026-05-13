import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image as ImageIcon, Save, Crop, Sparkles } from "lucide-react";
import ImageCropDialog from "./ImageCropDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CatalogRow {
  id: string;
  name: string;
  icon_url: string | null;
  icon_fit: "cover" | "contain" | null;
  preview_image_url: string | null;
  preview_image_fit: "cover" | "contain" | null;
  rating: number | null;
  review_count: number | null;
}

const uploadFile = async (toolId: string, file: File, prefix: string) => {
  const path = `${toolId}/${prefix}_${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from("tool-media").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("tool-media").getPublicUrl(path);
  return data.publicUrl;
};

const ToolRow = ({ tool, onChanged }: { tool: CatalogRow; onChanged: () => void }) => {
  const { toast } = useToast();
  const [rating, setRating] = useState<string>(tool.rating?.toString() ?? "");
  const [reviews, setReviews] = useState<string>(tool.review_count?.toString() ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [iconUrl, setIconUrl] = useState(tool.icon_url);
  const [previewUrl, setPreviewUrl] = useState(tool.preview_image_url);
  const [fit, setFit] = useState<"cover" | "contain">((tool.preview_image_fit as any) ?? "cover");
  const [iconFit, setIconFit] = useState<"cover" | "contain">((tool.icon_fit as any) ?? "cover");

  const updateFit = async (next: "cover" | "contain") => {
    setFit(next);
    await supabase.from("tools_catalog").update({ preview_image_fit: next }).eq("id", tool.id);
    onChanged();
  };

  const updateIconFit = async (next: "cover" | "contain") => {
    setIconFit(next);
    await (supabase.from("tools_catalog") as any).update({ icon_fit: next }).eq("id", tool.id);
    onChanged();
  };

  const [cropState, setCropState] = useState<{ kind: "icon" | "preview"; src: string } | null>(null);

  const handleUpload = async (kind: "icon" | "preview", blob: Blob, filename = "image.jpg") => {
    setBusy(kind);
    try {
      const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
      const url = await uploadFile(tool.id, file, kind);
      const patch: any = kind === "icon" ? { icon_url: url } : { preview_image_url: url };
      const { error } = await supabase.from("tools_catalog").update(patch).eq("id", tool.id);
      if (error) throw error;
      if (kind === "icon") setIconUrl(url); else setPreviewUrl(url);
      if (kind === "preview") {
        await supabase.from("tool_media").delete().eq("tool_id", tool.id).eq("kind", "image");
        await supabase.from("tool_media").insert({ tool_id: tool.id, kind: "image", url, sort_order: 0 });
      }
      toast({ title: "Uploaded", description: `${kind === "icon" ? "Icon" : "Preview image"} updated.` });
      onChanged();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const openCropFromFile = (kind: "icon" | "preview", file: File) => {
    const reader = new FileReader();
    reader.onload = () => setCropState({ kind, src: reader.result as string });
    reader.readAsDataURL(file);
  };

  const autoGenerate = async (kind: "icon" | "preview") => {
    setBusy(kind);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/bulk-generate-tool-art`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ mode: "selected", tool_ids: [tool.id], kinds: [kind], force: true }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      // Drain stream
      const reader = resp.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const ln of lines) {
          if (!ln.trim()) continue;
          const ev = JSON.parse(ln);
          if (ev.type === "progress" && ev.status === "ok" && ev.url) {
            if (ev.kind === "icon") setIconUrl(ev.url); else setPreviewUrl(ev.url);
          } else if (ev.type === "progress" && ev.status === "error") {
            throw new Error(ev.error);
          }
        }
      }
      toast({ title: "Generated", description: `${kind === "icon" ? "Icon" : "Preview"} created with AI.` });
      onChanged();
    } catch (e: any) {
      toast({ title: "AI generation failed", description: String(e).slice(0, 200), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };


  const openCropFromUrl = async (kind: "icon" | "preview", url: string) => {
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => setCropState({ kind, src: reader.result as string });
      reader.readAsDataURL(blob);
    } catch {
      toast({ title: "Cannot load image", description: "Re-upload to crop.", variant: "destructive" });
    }
  };

  const saveMeta = async () => {
    setBusy("meta");
    try {
      const r = rating === "" ? null : Number(rating);
      const rc = reviews === "" ? null : Math.round(Number(reviews));
      const { error } = await supabase
        .from("tools_catalog")
        .update({ rating: r, review_count: rc })
        .eq("id", tool.id);
      if (error) throw error;
      toast({ title: "Saved", description: "Rating & reviews updated." });
      onChanged();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span className="truncate max-w-[200px]">{tool.name}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{tool.id}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="h-12 w-12 rounded-lg border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {iconUrl ? <img src={iconUrl} alt="" className={`w-full h-full ${iconFit === "contain" ? "object-contain p-1" : "object-cover"}`} /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
          </div>
          <div className="flex flex-col gap-1">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && openCropFromFile("icon", e.target.files[0])} />
              <Button size="sm" variant="outline" asChild disabled={busy === "icon"}>
                <span>{busy === "icon" ? <Loader2 className="h-3 w-3 animate-spin" /> : (iconUrl ? "Replace" : "Upload")}</span>
              </Button>
            </label>
            {iconUrl && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openCropFromUrl("icon", iconUrl)}>
                <Crop className="h-3 w-3 mr-1" />Adjust
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary" onClick={() => autoGenerate("icon")} disabled={busy === "icon"}>
              <Sparkles className="h-3 w-3 mr-1" />AI
            </Button>
            <div className="inline-flex rounded-md border overflow-hidden text-xs">
              <button type="button" onClick={() => updateIconFit("cover")} className={`px-2 py-1 ${iconFit === "cover" ? "bg-primary text-primary-foreground" : "bg-background"}`}>Fill</button>
              <button type="button" onClick={() => updateIconFit("contain")} className={`px-2 py-1 ${iconFit === "contain" ? "bg-primary text-primary-foreground" : "bg-background"}`}>Fit</button>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="h-12 w-20 rounded-lg border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {previewUrl ? <img src={previewUrl} alt="" className={`w-full h-full ${fit === "contain" ? "object-contain" : "object-cover"}`} /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
          </div>
          <div className="flex flex-col gap-1">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && openCropFromFile("preview", e.target.files[0])} />
              <Button size="sm" variant="outline" asChild disabled={busy === "preview"}>
                <span>{busy === "preview" ? <Loader2 className="h-3 w-3 animate-spin" /> : (previewUrl ? "Replace" : "Upload")}</span>
              </Button>
            </label>
            {previewUrl && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openCropFromUrl("preview", previewUrl)}>
                <Crop className="h-3 w-3 mr-1" />Adjust
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary" onClick={() => autoGenerate("preview")} disabled={busy === "preview"}>
              <Sparkles className="h-3 w-3 mr-1" />AI
            </Button>
            <div className="inline-flex rounded-md border overflow-hidden text-xs">
              <button type="button" onClick={() => updateFit("cover")} className={`px-2 py-1 ${fit === "cover" ? "bg-primary text-primary-foreground" : "bg-background"}`}>Fill</button>
              <button type="button" onClick={() => updateFit("contain")} className={`px-2 py-1 ${fit === "contain" ? "bg-primary text-primary-foreground" : "bg-background"}`}>Fit</button>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Input type="number" step="0.01" min="0" max="5" className="w-20" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="4.8" />
      </TableCell>
      <TableCell>
        <Input type="number" min="0" className="w-24" value={reviews} onChange={(e) => setReviews(e.target.value)} placeholder="8700" />
      </TableCell>
      <TableCell>
        <Button size="sm" onClick={saveMeta} disabled={busy === "meta"}>
          {busy === "meta" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
          Save
        </Button>
      </TableCell>
      <td className="hidden">
        <ImageCropDialog
          open={!!cropState}
          onOpenChange={(v) => !v && setCropState(null)}
          imageSrc={cropState?.src ?? null}
          aspect={cropState?.kind === "icon" ? 1 : 4 / 3}
          outputWidth={cropState?.kind === "icon" ? 512 : 1200}
          outputHeight={cropState?.kind === "icon" ? 512 : 900}
          fitMode={cropState?.kind === "icon" ? iconFit : fit}
          title={cropState?.kind === "icon" ? "Adjust icon (512×512)" : "Adjust preview image (1200×900)"}
          onCropped={async (blob) => {
            if (cropState) await handleUpload(cropState.kind, blob, `${cropState.kind}.jpg`);
          }}
        />
      </td>
    </TableRow>
  );
};

const BulkArtPanel = ({ rows, onDone }: { rows: CatalogRow[]; onDone: () => void }) => {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [force, setForce] = useState(false);
  const [doIcons, setDoIcons] = useState(true);
  const [doPreviews, setDoPreviews] = useState(true);
  const [progress, setProgress] = useState<{ done: number; total: number; current?: string }>({ done: 0, total: 0 });
  const [errors, setErrors] = useState<{ name: string; kind: string; error: string }[]>([]);

  const missingIcons = rows.filter((r) => !r.icon_url).length;
  const missingPreviews = rows.filter((r) => !r.preview_image_url).length;

  const run = async () => {
    if (!doIcons && !doPreviews) return;
    setRunning(true);
    setErrors([]);
    setProgress({ done: 0, total: 0 });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/bulk-generate-tool-art`;
      const kinds: string[] = [];
      if (doIcons) kinds.push("icon");
      if (doPreviews) kinds.push("preview");
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ mode: force ? "all" : "missing", kinds, force, limit: 300 }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const reader = resp.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      const errs: { name: string; kind: string; error: string }[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const ln of lines) {
          if (!ln.trim()) continue;
          let ev: any;
          try { ev = JSON.parse(ln); } catch { continue; }
          if (ev.type === "start") setProgress({ done: 0, total: ev.total });
          else if (ev.type === "tick") setProgress((p) => ({ ...p, done: ev.done, total: ev.total }));
          else if (ev.type === "progress") {
            setProgress((p) => ({ ...p, current: `${ev.name} (${ev.kind}) — ${ev.status}` }));
            if (ev.status === "error") errs.push({ name: ev.name, kind: ev.kind, error: ev.error });
          }
        }
      }
      setErrors(errs);
      toast({ title: "Generation complete", description: `${errs.length === 0 ? "All done." : `${errs.length} errors — see list.`}` });
      onDone();
    } catch (e: any) {
      toast({ title: "Bulk generation failed", description: String(e).slice(0, 200), variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-4 mb-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Auto-generate art with AI</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Uses Gemini 2.5 Flash Image (cheapest, fastest) with your stored keys. Preview images are styled like Startup Analyser so visitors instantly understand each tool.
          </p>
          <p className="text-xs mt-2">
            <span className="font-medium">{missingIcons}</span> tools missing icon · <span className="font-medium">{missingPreviews}</span> tools missing preview
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2"><Switch id="bk-i" checked={doIcons} onCheckedChange={setDoIcons} /><Label htmlFor="bk-i">Icons</Label></div>
          <div className="flex items-center gap-2"><Switch id="bk-p" checked={doPreviews} onCheckedChange={setDoPreviews} /><Label htmlFor="bk-p">Previews</Label></div>
          <div className="flex items-center gap-2"><Switch id="bk-f" checked={force} onCheckedChange={setForce} /><Label htmlFor="bk-f" className="text-destructive">Regenerate all (overwrite)</Label></div>
          <Button onClick={run} disabled={running || (!doIcons && !doPreviews)}>
            {running ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate {force ? "ALL" : "missing"}</>}
          </Button>
        </div>
      </div>
      {(running || progress.total > 0) && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{progress.current ?? "Starting…"}</span>
            <span>{progress.done} / {progress.total}</span>
          </div>
          <div className="h-2 rounded-full bg-background overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}
      {errors.length > 0 && (
        <div className="mt-3 max-h-40 overflow-y-auto text-xs">
          <p className="font-medium text-destructive mb-1">Errors:</p>
          {errors.map((e, i) => (
            <div key={i} className="text-destructive/80 truncate">• {e.name} ({e.kind}): {e.error}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ToolMediaManager = () => {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tools_catalog")
      .select("id, name, icon_url, icon_fit, preview_image_url, preview_image_fit, rating, review_count")
      .order("name");
    setRows((data as CatalogRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
  }, [rows, filter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool Media · Icon, Preview Image, Rating & Reviews</CardTitle>
        <Input placeholder="Filter by name or id..." value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-sm mt-3" />
      </CardHeader>
      <CardContent>
        {!loading && <BulkArtPanel rows={rows} onDone={load} />}
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Big Preview Image</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => <ToolRow key={t.id} tool={t} onChanged={load} />)}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-3">{filtered.length} tools</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default ToolMediaManager;
