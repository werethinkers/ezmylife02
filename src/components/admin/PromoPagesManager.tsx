import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, ExternalLink, Copy, Sparkles, Trash2, Rocket, Upload, Download, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface ToolRow { id: string; name: string; description: string; }
interface PromoRow {
  id: string; tool_id: string; slug: string; is_published: boolean;
  hero_eyebrow: string | null; hero_title: string | null; hero_title_accent: string | null;
  hero_subtitle: string | null; hero_image_url: string | null;
  hero_chips: any; cta_label: string | null; cta_sublabel: string | null;
  rating: number | null; reviews_count: number | null; social_proof: string | null;
  trust_logos: any; features: any; how_it_works: any; testimonials: any; stats: any;
  final_cta_title: string | null; final_cta_subtitle: string | null; footer_badges: any;
  seo_title: string | null; seo_description: string | null; og_image_url: string | null;
  gallery_images: any;
  updated_at: string;
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const emptyChip = { label: "" };
const emptyFeature = { title: "", body: "" };
const emptyStep = { title: "", body: "" };
const emptyTesti = { name: "", role: "", quote: "", rating: 5 };
const emptyLogo = { name: "", url: "" };
const emptyBadge = { icon: "shield", title: "", body: "" };

export default function PromoPagesManager() {
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [pages, setPages] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PromoRow | null>(null);
  const [creatingForTool, setCreatingForTool] = useState<string>("");
  const [creatingSlug, setCreatingSlug] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: t }, { data: p }] = await Promise.all([
      supabase.from("tools_catalog").select("id, name, description").order("name"),
      supabase.from("tool_promo_pages").select("*").order("updated_at", { ascending: false }),
    ]);
    setTools((t as ToolRow[]) ?? []);
    setPages((p as unknown as PromoRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const toolById = useMemo(() => Object.fromEntries(tools.map(t => [t.id, t])), [tools]);

  const handleCreate = async () => {
    if (!creatingForTool || !creatingSlug) {
      toast.error("Pick a tool and a slug");
      return;
    }
    const tool = toolById[creatingForTool];
    const { data, error } = await supabase.from("tool_promo_pages").insert({
      tool_id: creatingForTool,
      slug: creatingSlug,
      hero_title: tool?.name ?? "",
      hero_subtitle: tool?.description ?? "",
      cta_label: `Try ${tool?.name ?? "it"} Now`,
      hero_chips: [],
      trust_logos: [],
      features: [],
      how_it_works: [],
      testimonials: [],
      stats: {},
      footer_badges: [],
    }).select("*").maybeSingle();
    if (error) { toast.error(error.message); return; }
    toast.success("Promo page created");
    setCreatingForTool(""); setCreatingSlug("");
    await loadAll();
    if (data) setEditing(data as unknown as PromoRow);
  };

  const handleSave = async (p: PromoRow) => {
    const { error } = await supabase.from("tool_promo_pages").update({
      slug: p.slug, is_published: p.is_published,
      hero_eyebrow: p.hero_eyebrow, hero_title: p.hero_title, hero_title_accent: p.hero_title_accent,
      hero_subtitle: p.hero_subtitle, hero_image_url: p.hero_image_url, hero_chips: p.hero_chips,
      cta_label: p.cta_label, cta_sublabel: p.cta_sublabel,
      rating: p.rating, reviews_count: p.reviews_count, social_proof: p.social_proof,
      trust_logos: p.trust_logos, features: p.features, how_it_works: p.how_it_works,
      testimonials: p.testimonials, stats: p.stats,
      final_cta_title: p.final_cta_title, final_cta_subtitle: p.final_cta_subtitle,
      footer_badges: p.footer_badges,
      seo_title: p.seo_title, seo_description: p.seo_description, og_image_url: p.og_image_url,
      gallery_images: p.gallery_images ?? [],
    }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    await loadAll();
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promo page?")) return;
    const { error } = await supabase.from("tool_promo_pages").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    await loadAll();
  };

  const togglePublish = async (p: PromoRow) => {
    const { error } = await supabase.from("tool_promo_pages")
      .update({ is_published: !p.is_published }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success(!p.is_published ? "Launched" : "Unpublished");
    await loadAll();
  };

  const handleAIGenerate = async (toolId: string) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-promo-page", { body: { tool_id: toolId } });
      if (error) throw error;
      toast.success("Draft generated — review and save");
      await loadAll();
      const fresh = (await supabase.from("tool_promo_pages").select("*").eq("tool_id", toolId).maybeSingle()).data;
      if (fresh) setEditing(fresh as unknown as PromoRow);
    } catch (e: any) {
      toast.error(e.message ?? "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; ok: number; failed: number; current?: string } | null>(null);

  const handleBulkGenerate = async (mode: "missing" | "all") => {
    if (mode === "all" && !confirm(`Regenerate promo pages for ALL ${tools.length} tools (this will overwrite existing pages)?`)) return;
    if (mode === "missing" && toolsWithoutPage.length === 0) { toast.info("Every tool already has a promo page"); return; }

    setBulkRunning(true);
    setBulkProgress({ done: 0, total: mode === "all" ? tools.length : toolsWithoutPage.length, ok: 0, failed: 0 });
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");

      const url = `https://vrsadzjyugbusfazdgyi.supabase.co/functions/v1/bulk-generate-promo-pages`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode, publish: true, generate_image: true, force: mode === "all" }),
      });
      if (!resp.ok || !resp.body) throw new Error(await resp.text());
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const ln of lines) {
          if (!ln.trim()) continue;
          try {
            const evt = JSON.parse(ln);
            if (evt.type === "tick") {
              setBulkProgress({ done: evt.done, total: evt.total, ok: evt.ok, failed: evt.failed });
            } else if (evt.type === "progress") {
              setBulkProgress(p => p ? { ...p, current: `${evt.name} · ${evt.status}` } : p);
            } else if (evt.type === "done") {
              toast.success(`Generated ${evt.ok} pages · ${evt.failed} failed`);
            }
          } catch { /* ignore */ }
        }
      }
      await loadAll();
    } catch (e: any) {
      toast.error(e.message ?? "Bulk generate failed");
    } finally {
      setBulkRunning(false);
      setTimeout(() => setBulkProgress(null), 2000);
    }
  };

  const handleExportCSV = () => {
    if (pages.length === 0) { toast.info("No promo pages to export"); return; }
    const origin = window.location.origin;
    const header = ["tool_id", "tool_name", "slug", "status", "url", "updated_at"];
    const rows = pages.map(p => [
      p.tool_id,
      (toolById[p.tool_id]?.name ?? "").replace(/"/g, '""'),
      p.slug,
      p.is_published ? "live" : "draft",
      `${origin}/promo/${p.slug}`,
      p.updated_at,
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? "")}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `promo-pages-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${pages.length} links`);
  };

  const toolsWithoutPage = tools.filter(t => !pages.some(p => p.tool_id === t.id));

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;


  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> Bulk PDP generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Generate complete promo (PDP) pages for every tool — AI copy + Gemini hero image + published. Uses your Gemini API keys.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleBulkGenerate("missing")} disabled={bulkRunning}>
              {bulkRunning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Generate for missing ({toolsWithoutPage.length})
            </Button>
            <Button variant="outline" onClick={() => handleBulkGenerate("all")} disabled={bulkRunning}>
              <Wand2 className="h-4 w-4 mr-1" /> Regenerate ALL ({tools.length})
            </Button>
            <Button variant="secondary" onClick={handleExportCSV} disabled={pages.length === 0}>
              <Download className="h-4 w-4 mr-1" /> Export CSV of links ({pages.length})
            </Button>
          </div>
          {bulkProgress && (
            <div className="rounded-md border border-border/60 bg-card/60 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Progress: {bulkProgress.done} / {bulkProgress.total}</span>
                <span className="text-muted-foreground">✓ {bulkProgress.ok} · ✗ {bulkProgress.failed}</span>
              </div>
              <div className="h-1.5 w-full rounded bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${bulkProgress.total ? (bulkProgress.done / bulkProgress.total) * 100 : 0}%` }} />
              </div>
              {bulkProgress.current && <div className="text-muted-foreground truncate">{bulkProgress.current}</div>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>

        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5" /> New Promo Page</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1">
            <Label className="text-xs">Tool</Label>
            <Select value={creatingForTool} onValueChange={(v) => {
              setCreatingForTool(v);
              const tool = toolById[v];
              if (tool) setCreatingSlug(slugify(tool.name));
            }}>
              <SelectTrigger><SelectValue placeholder="Pick a tool" /></SelectTrigger>
              <SelectContent>
                {toolsWithoutPage.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[220px]">
            <Label className="text-xs">Slug</Label>
            <Input value={creatingSlug} onChange={(e) => setCreatingSlug(slugify(e.target.value))} placeholder="anglepro" />
          </div>
          <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-1" /> Create</Button>
          {creatingForTool && (
            <Button variant="outline" disabled={generating} onClick={() => handleAIGenerate(creatingForTool)}>
              <Sparkles className="h-4 w-4 mr-1" /> {generating ? "Generating…" : "AI draft & create"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All Promo Pages</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No promo pages yet.</TableCell></TableRow>
              )}
              {pages.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{toolById[p.tool_id]?.name ?? p.tool_id}</TableCell>
                  <TableCell><code className="text-xs">/promo/{p.slug}</code></TableCell>
                  <TableCell>
                    {p.is_published
                      ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Live</Badge>
                      : <Badge variant="secondary">Draft</Badge>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => togglePublish(p)}>{p.is_published ? "Unpublish" : "Launch"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`/promo/${p.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/promo/${p.slug}`);
                      toast.success("Link copied");
                    }}><Copy className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editing && <PromoEditorDialog page={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
    </div>
  );
}

// ---- Editor dialog ----
function PromoEditorDialog({ page, onClose, onSave }: { page: PromoRow; onClose: () => void; onSave: (p: PromoRow) => void; }) {
  const [draft, setDraft] = useState<PromoRow>(page);
  const upd = <K extends keyof PromoRow>(k: K, v: PromoRow[K]) => setDraft(d => ({ ...d, [k]: v }));

  const updArr = (k: keyof PromoRow, idx: number, key: string, val: any) => {
    const arr = [...(draft[k] as any[] ?? [])];
    arr[idx] = { ...arr[idx], [key]: val };
    upd(k, arr as any);
  };
  const addRow = (k: keyof PromoRow, blank: any) => {
    upd(k, [...((draft[k] as any[]) ?? []), { ...blank }] as any);
  };
  const removeRow = (k: keyof PromoRow, idx: number) => {
    const arr = [...((draft[k] as any[]) ?? [])];
    arr.splice(idx, 1);
    upd(k, arr as any);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>Edit promo page · /promo/{draft.slug}</span>
            <div className="flex items-center gap-2 text-sm">
              <Switch checked={draft.is_published} onCheckedChange={(v) => upd("is_published", v)} />
              <span>{draft.is_published ? "Live" : "Draft"}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="hero" className="w-full">
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="trust">Trust</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="how">How it works</TabsTrigger>
            <TabsTrigger value="testi">Testimonials</TabsTrigger>
            <TabsTrigger value="seo">SEO / Footer</TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="space-y-3 pt-4">
            <Field label="Slug"><Input value={draft.slug} onChange={(e) => upd("slug", slugify(e.target.value))} /></Field>
            <Field label="Hero eyebrow"><Input value={draft.hero_eyebrow ?? ""} onChange={(e) => upd("hero_eyebrow", e.target.value)} placeholder="AI POWERED" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hero title"><Input value={draft.hero_title ?? ""} onChange={(e) => upd("hero_title", e.target.value)} /></Field>
              <Field label="Title accent (gradient)"><Input value={draft.hero_title_accent ?? ""} onChange={(e) => upd("hero_title_accent", e.target.value)} /></Field>
            </div>
            <Field label="Subtitle"><Textarea rows={3} value={draft.hero_subtitle ?? ""} onChange={(e) => upd("hero_subtitle", e.target.value)} /></Field>
            <Field label="Hero image"><ImageUploadField value={draft.hero_image_url ?? ""} onChange={(v) => upd("hero_image_url", v)} folder={`promo/${draft.tool_id}/hero`} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CTA label"><Input value={draft.cta_label ?? ""} onChange={(e) => upd("cta_label", e.target.value)} placeholder="Try AnglePro Now" /></Field>
              <Field label="CTA sublabel (auto if blank)"><Input value={draft.cta_sublabel ?? ""} onChange={(e) => upd("cta_sublabel", e.target.value)} placeholder="1 CREDIT to start" /></Field>
            </div>

            <RepeatList
              title="Hero chips"
              rows={draft.hero_chips ?? []}
              onAdd={() => addRow("hero_chips", emptyChip)}
              onRemove={(i) => removeRow("hero_chips", i)}
              render={(row, i) => (
                <Input value={row.label ?? ""} placeholder="Multiple Angles" onChange={(e) => updArr("hero_chips", i, "label", e.target.value)} />
              )}
            />
          </TabsContent>

          <TabsContent value="trust" className="space-y-3 pt-4">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Rating"><Input type="number" step="0.01" value={draft.rating ?? ""} onChange={(e) => upd("rating", e.target.value ? Number(e.target.value) : null)} /></Field>
              <Field label="Reviews count"><Input type="number" value={draft.reviews_count ?? ""} onChange={(e) => upd("reviews_count", e.target.value ? Number(e.target.value) : null)} /></Field>
              <Field label="Social proof"><Input value={draft.social_proof ?? ""} onChange={(e) => upd("social_proof", e.target.value)} placeholder="Loved by e-commerce sellers" /></Field>
            </div>
            <RepeatList
              title="Trust logos"
              rows={draft.trust_logos ?? []}
              onAdd={() => addRow("trust_logos", emptyLogo)}
              onRemove={(i) => removeRow("trust_logos", i)}
              render={(row, i) => (
                <div className="grid grid-cols-2 gap-2">
                  <Input value={row.name ?? ""} placeholder="Shopify" onChange={(e) => updArr("trust_logos", i, "name", e.target.value)} />
                  <Input value={row.url ?? ""} placeholder="https://logo.png" onChange={(e) => updArr("trust_logos", i, "url", e.target.value)} />
                </div>
              )}
            />
            <Field label='Stats value (e.g. "50,000+")'><Input value={(draft.stats as any)?.value ?? ""} onChange={(e) => upd("stats", { ...(draft.stats as any ?? {}), value: e.target.value })} /></Field>
            <Field label="Stats label"><Input value={(draft.stats as any)?.label ?? ""} onChange={(e) => upd("stats", { ...(draft.stats as any ?? {}), label: e.target.value })} placeholder="Happy Users" /></Field>
          </TabsContent>

          <TabsContent value="features" className="pt-4">
            <RepeatList
              title="Features"
              rows={draft.features ?? []}
              onAdd={() => addRow("features", emptyFeature)}
              onRemove={(i) => removeRow("features", i)}
              render={(row, i) => (
                <div className="space-y-2">
                  <Input value={row.title ?? ""} placeholder="Save Time & Money" onChange={(e) => updArr("features", i, "title", e.target.value)} />
                  <Textarea rows={2} value={row.body ?? ""} placeholder="Skip expensive photoshoots..." onChange={(e) => updArr("features", i, "body", e.target.value)} />
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="how" className="pt-4">
            <RepeatList
              title="How it works (3 steps)"
              rows={draft.how_it_works ?? []}
              onAdd={() => addRow("how_it_works", emptyStep)}
              onRemove={(i) => removeRow("how_it_works", i)}
              render={(row, i) => (
                <div className="space-y-2">
                  <Input value={row.title ?? ""} placeholder="Upload Image" onChange={(e) => updArr("how_it_works", i, "title", e.target.value)} />
                  <Textarea rows={2} value={row.body ?? ""} placeholder="Upload any product image (PNG, JPG up to 10MB)." onChange={(e) => updArr("how_it_works", i, "body", e.target.value)} />
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="testi" className="pt-4">
            <RepeatList
              title="Testimonials"
              rows={draft.testimonials ?? []}
              onAdd={() => addRow("testimonials", emptyTesti)}
              onRemove={(i) => removeRow("testimonials", i)}
              render={(row, i) => (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <Input value={row.name ?? ""} placeholder="Name" onChange={(e) => updArr("testimonials", i, "name", e.target.value)} />
                    <Input value={row.role ?? ""} placeholder="Role" onChange={(e) => updArr("testimonials", i, "role", e.target.value)} />
                    <Input type="number" min={1} max={5} value={row.rating ?? 5} onChange={(e) => updArr("testimonials", i, "rating", Number(e.target.value))} />
                  </div>
                  <Textarea rows={2} value={row.quote ?? ""} placeholder="Quote..." onChange={(e) => updArr("testimonials", i, "quote", e.target.value)} />
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="seo" className="space-y-3 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Final CTA title"><Input value={draft.final_cta_title ?? ""} onChange={(e) => upd("final_cta_title", e.target.value)} /></Field>
              <Field label="Final CTA subtitle"><Input value={draft.final_cta_subtitle ?? ""} onChange={(e) => upd("final_cta_subtitle", e.target.value)} /></Field>
            </div>
            <RepeatList
              title="Footer badges (4 recommended)"
              rows={draft.footer_badges ?? []}
              onAdd={() => addRow("footer_badges", emptyBadge)}
              onRemove={(i) => removeRow("footer_badges", i)}
              render={(row, i) => (
                <div className="grid grid-cols-3 gap-2">
                  <Input value={row.icon ?? ""} placeholder="shield | clock | credit | x" onChange={(e) => updArr("footer_badges", i, "icon", e.target.value)} />
                  <Input value={row.title ?? ""} placeholder="Secure & Private" onChange={(e) => updArr("footer_badges", i, "title", e.target.value)} />
                  <Input value={row.body ?? ""} placeholder="Your data is safe..." onChange={(e) => updArr("footer_badges", i, "body", e.target.value)} />
                </div>
              )}
            />
            <Field label="SEO title"><Input value={draft.seo_title ?? ""} onChange={(e) => upd("seo_title", e.target.value)} /></Field>
            <Field label="SEO description"><Textarea rows={2} value={draft.seo_description ?? ""} onChange={(e) => upd("seo_description", e.target.value)} /></Field>
            <Field label="OG image"><ImageUploadField value={draft.og_image_url ?? ""} onChange={(v) => upd("og_image_url", v)} folder={`promo/${draft.tool_id}/og`} /></Field>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(draft)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

function ImageUploadField({ value, onChange, folder }: { value: string; onChange: (v: string) => void; folder: string }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${folder}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("tool-media").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("tool-media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://... or upload" />
        <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
          <label className="cursor-pointer">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="ml-1">Upload</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
        </Button>
      </div>
      {value && <img src={value} alt="preview" className="h-24 rounded border border-border object-cover" />}
    </div>
  );
}

const RepeatList = ({ title, rows, onAdd, onRemove, render }: {
  title: string; rows: any[]; onAdd: () => void; onRemove: (i: number) => void;
  render: (row: any, i: number) => React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <Label className="text-xs">{title}</Label>
      <Button size="sm" variant="outline" onClick={onAdd}><Plus className="h-3 w-3 mr-1" /> Add</Button>
    </div>
    {rows.length === 0 && <p className="text-xs text-muted-foreground">No items yet.</p>}
    {rows.map((row, i) => (
      <div key={i} className="flex items-start gap-2 rounded-md border border-border/60 p-2">
        <div className="flex-1">{render(row, i)}</div>
        <Button size="sm" variant="ghost" onClick={() => onRemove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    ))}
  </div>
);
