import { useEffect, useRef, useState } from "react";
import { Download, ImagePlus, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "../shell/AppShell";
import { runApp, NeedsCredits, errorText } from "../lib/api";
import { dataUrlToBlob, downloadBlob, imageToDataUrl, slug } from "../lib/files";
import type { ImageAppDef } from "../types";
import { cn } from "@/lib/utils";

interface Creation {
  id: string;
  prompt: string;
  result_url: string | null;
  created_at: string;
}

/** Text (and optional reference photo) → AI image, with a saved gallery. */
export default function ImageGenApp({ toolId, def }: { toolId: string; def: ImageAppDef }) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(def.styles[0] ?? "");
  const [aspect, setAspect] = useState(def.aspects[0] ?? "1:1");
  const [ref, setRef] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [gallery, setGallery] = useState<Creation[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_creations")
      .select("id, prompt, result_url, created_at")
      .eq("user_id", user.id)
      .eq("tool_type", toolId)
      .order("created_at", { ascending: false })
      .limit(24)
      .then(({ data }) => setGallery((data as Creation[]) ?? []));
  }, [user, toolId]);

  const generate = async () => {
    if (!prompt.trim()) return toast.error(`${def.promptLabel} first.`);
    setBusy(true);
    setCurrent(null);
    try {
      const fullPrompt = `${def.promptPrefix ? `${def.promptPrefix} ` : ""}${prompt.trim()}`;
      const url = await runApp<string>(toolId, { prompt: fullPrompt, style, aspect, images: ref ? [ref] : undefined });
      setCurrent(url);
      if (user) {
        const { data } = await supabase
          .from("user_creations")
          .insert({ user_id: user.id, tool_type: toolId, prompt: prompt.trim(), title: prompt.trim().slice(0, 80), result_url: url, status: "completed", metadata: { style, aspect } })
          .select("id, prompt, result_url, created_at")
          .single();
        if (data) setGallery((g) => [data as Creation, ...g]);
      }
    } catch (e) {
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const save = async (url: string, name: string) => downloadBlob(await dataUrlToBlob(url), `${slug(name)}.png`);

  return (
    <AppShell toolId={toolId} intro={def.intro} steps={def.steps} related={def.related}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <form
          className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 sm:p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void generate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor={`${toolId}-prompt`} className="text-xs">{def.promptLabel}</Label>
            <Textarea id={`${toolId}-prompt`} rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={def.promptPlaceholder} maxLength={1800} />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {def.ideas.map((i) => (
                <button key={i} type="button" onClick={() => setPrompt(i)} className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-foreground">
                  {i.length > 42 ? `${i.slice(0, 40)}…` : i}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium">Style</p>
            <div className="flex flex-wrap gap-1.5">
              {def.styles.map((s) => (
                <button key={s} type="button" aria-pressed={style === s} onClick={() => setStyle(s)} className={cn("rounded-full border px-3 py-1 text-xs", style === s ? "border-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/50")}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium">Shape</p>
            <div className="flex flex-wrap gap-1.5">
              {def.aspects.map((a) => (
                <button key={a} type="button" aria-pressed={aspect === a} onClick={() => setAspect(a)} className={cn("rounded-full border px-3 py-1 text-xs", aspect === a ? "border-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/50")}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          {def.allowReference && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium">Reference photo (optional)</p>
              {ref ? (
                <div className="relative w-28 overflow-hidden rounded-lg border border-border/60">
                  <img src={ref} alt="Reference" className="aspect-square w-full object-cover" />
                  <button type="button" className="absolute right-1 top-1 rounded-full bg-background/90 p-1" onClick={() => setRef(null)} aria-label="Remove reference">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                  <ImagePlus className="h-3.5 w-3.5" /> Add photo
                </Button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setRef(await imageToDataUrl(f, 1280));
                  e.target.value = "";
                }}
              />
            </div>
          )}
          <Button type="submit" className="w-full gap-2" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate image
          </Button>
          <p className="text-[11px] text-muted-foreground">Each image is one AI generation (charged only if an image comes back). Images may not be perfect — try again with more detail.</p>
        </form>

        <div className="min-w-0 space-y-4">
          <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/20">
            {busy ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Creating your image (10–30 s)…
              </p>
            ) : current ? (
              <div className="w-full">
                <img src={current} alt={prompt} className="max-h-[70vh] w-full object-contain" />
                <div className="flex justify-end gap-2 border-t border-border/50 p-2">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => save(current, prompt)}>
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                </div>
              </div>
            ) : (
              <p className="p-6 text-center text-sm text-muted-foreground">Your image appears here.</p>
            )}
          </div>
          {gallery.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your images</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {gallery.map((g) =>
                  g.result_url ? (
                    <div key={g.id} className="group relative overflow-hidden rounded-xl border border-border/60">
                      <button type="button" className="block w-full" onClick={() => setCurrent(g.result_url)} aria-label={`Open ${g.prompt}`}>
                        <img src={g.result_url} alt={g.prompt} loading="lazy" className="aspect-square w-full object-cover" />
                      </button>
                      <button
                        type="button"
                        className="absolute right-1 top-1 hidden rounded-full bg-background/90 p-1 group-hover:block"
                        aria-label="Delete image"
                        onClick={async () => {
                          await supabase.from("user_creations").delete().eq("id", g.id);
                          setGallery((x) => x.filter((y) => y.id !== g.id));
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
