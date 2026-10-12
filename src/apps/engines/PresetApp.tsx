import { useEffect, useRef, useState } from "react";
import { Check, Download, Loader2, Lock, Upload, X, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AppShell } from "../shell/AppShell";
import { StepLabel } from "../shell/StepLabel";
import { Sources } from "./CalcApp";
import { downloadBlob, slug } from "../lib/files";
import { loadImage, zipFiles } from "../lib/convert";
import { checks, cropRect, inkCrop, kbRuleText, prepare, render, sizeRuleText, type Crop, type Prepared } from "../lib/presetImage";
import type { PresetDef, PresetItem } from "../types";

/** Exam and ID form uploads: one card per file the form asks for, each made to the official rules. */
export default function PresetApp({ toolId, def }: { toolId: string; def: PresetDef }) {
  const [done, setDone] = useState<Record<string, Prepared>>({});
  const ready = def.items.filter((it) => done[it.key]);

  const all = async () => {
    const files = ready.map((it) => ({ name: `${slug(def.exam)}-${it.key}.jpg`, blob: done[it.key].blob }));
    const zip = await zipFiles(files, `${slug(def.exam)}-uploads.zip`);
    downloadBlob(zip.blob, zip.name);
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} steps={def.steps} related={def.related}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-sand/60 px-4 py-3">
          <p className="text-sm">
            <span className="font-bold">{def.exam}:</span> {def.items.map((it) => it.label.toLowerCase()).join(", ")}. Each file is made to the size and KB limit in the official notice.
          </p>
          {def.items.length > 1 && (
            <Button type="button" className="gap-2" disabled={ready.length < 2} onClick={() => void all()}>
              <Download className="h-4 w-4" /> Download all ({ready.length}/{def.items.length})
            </Button>
          )}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {def.items.map((it, i) => (
            <ItemCard
              key={it.key}
              n={i + 1}
              exam={def.exam}
              item={it}
              onReady={(p) => setDone((d) => {
                const next = { ...d };
                if (p) next[it.key] = p;
                else delete next[it.key];
                return next;
              })}
            />
          ))}
        </div>
        {def.note && <p className="text-sm text-muted-foreground">{def.note}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <Sources list={def.sources} />
          <p className="flex items-start gap-1.5 rounded-2xl border-2 border-ink/20 bg-card p-4 text-sm text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Your photos stay on this device and are never uploaded. Rules can change with each new notice: check the one for your exam before you submit.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function ItemCard({ n, exam, item, onReady }: { n: number; exam: string; item: PresetItem; onReady: (p: Prepared | null) => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>({ zoom: 1, cx: 0.5, cy: 0.5 });
  const [clean, setClean] = useState(item.mode === "ink");
  const [out, setOut] = useState<Prepared | null>(null);
  const [outUrl, setOutUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const aspect = item.width && item.height ? item.width / item.height : item.aspect ?? 1;

  const open = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Add a photo (JPG, PNG or WebP). For an iPhone HEIC photo, turn it into JPG first.");
      return;
    }
    try {
      const im = await loadImage(f);
      setImg(im);
      setCrop(item.mode === "ink" ? inkCrop(im, aspect) : { zoom: 1, cx: 0.5, cy: 0.4 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "This photo could not be opened.");
    }
  };

  // Live preview of the framed part.
  useEffect(() => {
    if (!img || !preview.current) return;
    const c = preview.current;
    const w = 320;
    const h = Math.round(w / aspect);
    const src = render(img, item, crop, { clean }, { w: w * 2, h: h * 2 });
    c.width = src.width;
    c.height = src.height;
    c.getContext("2d")?.drawImage(src, 0, 0);
  }, [img, crop, clean, item, aspect]);

  // Make the final file shortly after the frame stops moving.
  useEffect(() => {
    if (!img) return;
    setBusy(true);
    setError("");
    const t = setTimeout(async () => {
      try {
        const p = await prepare(img, item, crop, { clean });
        setOut(p);
        onReady(p);
      } catch (e) {
        setOut(null);
        onReady(null);
        setError(e instanceof Error ? e.message : "Could not make this file.");
      } finally {
        setBusy(false);
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, crop, clean, item]);

  useEffect(() => {
    if (!out) return setOutUrl("");
    const u = URL.createObjectURL(out.blob);
    setOutUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [out]);

  const move = (dx: number, dy: number) => {
    if (!img || !drag.current || !preview.current) return;
    const r = cropRect(img, aspect, crop);
    const box = preview.current.getBoundingClientRect();
    const sx = r.w / box.width / img.width;
    const sy = r.h / box.height / img.height;
    setCrop((c) => ({ ...c, cx: Math.min(1, Math.max(0, drag.current!.cx - dx * sx)), cy: Math.min(1, Math.max(0, drag.current!.cy - dy * sy)) }));
  };

  const result = out ? checks(item, out) : [];
  const allOk = result.length > 0 && result.every((c) => c.ok);

  return (
    <section className="rounded-2xl border-2 border-ink bg-card p-4 shadow-block sm:p-5" aria-label={item.label}>
      <StepLabel n={n}>{item.label}</StepLabel>
      <div className="-mt-2 mb-3 flex flex-wrap gap-1.5 text-xs font-semibold">
        <span className="rounded-full border-2 border-ink/30 px-2 py-0.5">{sizeRuleText(item)}</span>
        <span className="rounded-full border-2 border-ink/30 px-2 py-0.5">{kbRuleText(item)}</span>
        <span className="rounded-full border-2 border-ink/30 px-2 py-0.5">JPG</span>
        {item.background && <span className="rounded-full border-2 border-ink/30 px-2 py-0.5">{item.background}</span>}
      </div>

      {!img ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void open(e.dataTransfer.files[0]);
          }}
          className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink/50 bg-sand/60 px-4 py-8 text-center hover:border-ink hover:bg-sun/20"
        >
          <Upload className="h-6 w-6" aria-hidden />
          <span className="mt-2 font-bold">{item.mode === "photo" ? "Add your photo" : `Add a photo of your ${item.label.toLowerCase()}`}</span>
          <span className="mt-1 text-xs text-muted-foreground">{item.mode === "ink" ? "Sign on plain white paper and take a clear photo from above" : "A recent photo, face straight to the camera"}</span>
        </button>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <canvas
              ref={preview}
              className="w-full cursor-move touch-none rounded-lg border-2 border-ink bg-white"
              style={{ aspectRatio: String(aspect) }}
              aria-label="Drag to move the picture inside the frame"
              onPointerDown={(e) => {
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                drag.current = { x: e.clientX, y: e.clientY, cx: crop.cx, cy: crop.cy };
              }}
              onPointerMove={(e) => drag.current && move(e.clientX - drag.current.x, e.clientY - drag.current.y)}
              onPointerUp={() => (drag.current = null)}
            />
            <p className="mt-1 text-xs text-muted-foreground">Drag to move. This is exactly what will be saved.</p>
            <div className="mt-2 flex items-center gap-2">
              <ZoomIn className="h-4 w-4 shrink-0" aria-hidden />
              <Slider value={[crop.zoom]} min={1} max={4} step={0.02} onValueChange={([z]) => setCrop((c) => ({ ...c, zoom: z }))} aria-label="Zoom" />
            </div>
            {item.mode === "ink" && (
              <div className="mt-2 flex items-center gap-2">
                <Switch id={`${exam}-${item.key}-clean`} checked={clean} onCheckedChange={setClean} />
                <Label htmlFor={`${exam}-${item.key}-clean`} className="text-sm">
                  Make the paper white
                </Label>
              </div>
            )}
            <Button type="button" variant="ghost" size="sm" className="mt-1 gap-1 px-2" onClick={() => { setImg(null); setOut(null); onReady(null); }}>
              <X className="h-3.5 w-3.5" /> Use a different photo
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            {busy ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Making the file…
              </p>
            ) : error ? (
              <p className="text-destructive">{error}</p>
            ) : out ? (
              <>
                <ul className="space-y-1" aria-label="Checks">
                  {result.map((c) => (
                    <li key={c.label} className={cn("flex items-start gap-1.5", c.ok ? "text-emerald-700 dark:text-emerald-400" : "text-destructive")}>
                      {c.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <X className="mt-0.5 h-4 w-4 shrink-0" />} {c.label}
                    </li>
                  ))}
                </ul>
                {outUrl && <img src={outUrl} alt={`Final ${item.label.toLowerCase()}`} className="max-h-28 rounded border border-ink/30" />}
                <Button type="button" size="sm" className="gap-1.5" disabled={!allOk} onClick={() => downloadBlob(out.blob, `${slug(exam)}-${item.key}.jpg`)}>
                  <Download className="h-3.5 w-3.5" /> Download {item.label.toLowerCase()}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      )}
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => { void open(e.target.files?.[0]); e.target.value = ""; }} />

      {item.handwrite && (
        <div className="mt-3 rounded-xl border-2 border-dashed border-ink/40 bg-sand/60 p-3 text-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Write this by hand, then take the photo</p>
          <p className="mt-1 font-medium">{item.handwrite}</p>
        </div>
      )}
      {item.rules.length > 0 && (
        <ul className="mt-3 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
          {item.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
