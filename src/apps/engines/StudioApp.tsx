import { useRef, useState } from "react";
import { Camera, Check, Download, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppShell } from "../shell/AppShell";
import { StepLabel, ResultPlaceholder } from "../shell/StepLabel";
import { NeedsCredits, errorText } from "../lib/api";
import { dataUrlToBlob, downloadBlob, imageToDataUrl } from "../lib/files";
import type { FormValues } from "../types";
import type { StudioDef } from "../flagship/types";
import { runFlagship } from "../flagship/api";
import { FieldGrid, card, emptyValues, inputsOf, missingFields } from "../flagship/parts";

interface Shot {
  key: string;
  label: string;
  status: "waiting" | "making" | "done" | "failed";
  url?: string;
}

/** One photo in, several finished pictures out, charged per picture that is made. */
export default function StudioApp({ toolId, def }: { toolId: string; def: StudioDef }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [values, setValues] = useState<FormValues>(() => emptyValues(def.fields));
  const [picked, setPicked] = useState<string[]>(def.variants.slice(0, Math.min(3, def.variants.length)).map((v) => v.key));
  const [shots, setShots] = useState<Shot[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addPhoto = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Choose a photo (JPG, PNG, WebP or HEIC converted to JPG).");
    try {
      setPhoto(await imageToDataUrl(f, 1536, 0.88));
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  const toggle = (k: string) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const make = async () => {
    if (def.photo.required && !photo) return toast.error(`Add ${def.photo.label.toLowerCase()} first.`);
    const miss = missingFields(def.fields, values);
    if (miss.length) return toast.error(`Please fill: ${miss.map((f) => f.label).join(", ")}`);
    if (!picked.length) return toast.error("Pick at least one picture to make.");
    const list: Shot[] = def.variants.filter((v) => picked.includes(v.key)).map((v) => ({ key: v.key, label: v.label, status: "waiting" }));
    setShots(list);
    setBusy(true);
    requestAnimationFrame(() => document.getElementById(`${toolId}-output`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    const inputs = inputsOf(def.fields, values);
    // One at a time: each picture is its own charge, and a stop (no credits) leaves the rest untouched.
    for (const s of list) {
      setShots((x) => x.map((y) => (y.key === s.key ? { ...y, status: "making" } : y)));
      try {
        const { output } = await runFlagship<string>(toolId, "variant", { variant: s.key, inputs, images: photo ? [photo] : [] });
        setShots((x) => x.map((y) => (y.key === s.key ? { ...y, status: "done", url: output } : y)));
      } catch (e) {
        setShots((x) => x.map((y) => (y.key === s.key ? { ...y, status: "failed" } : y)));
        if (e instanceof NeedsCredits) break;
        toast.error(`${s.label}: ${errorText(e)}`);
      }
    }
    setBusy(false);
  };

  const saveAll = async () => {
    for (const s of shots.filter((x) => x.url)) downloadBlob(await dataUrlToBlob(s.url as string), `${toolId}-${s.key}.png`);
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} steps={def.steps} related={def.related} priceNote="per picture" wide>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-4">
          <div className={card}>
            <StepLabel n={2}>{def.photo.label}</StepLabel>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void addPhoto(e.target.files?.[0]); e.target.value = ""; }} />
            {photo ? (
              <div className="relative overflow-hidden rounded-xl border-2 border-ink">
                <img src={photo} alt="Your photo" className="max-h-72 w-full bg-sand object-contain" />
                <Button size="icon" variant="secondary" className="absolute right-2 top-2 h-8 w-8" onClick={() => setPhoto(null)} aria-label="Remove photo">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-ink/50 bg-sand/60 px-4 py-8 text-sm font-semibold hover:border-ink hover:bg-sand">
                <Camera className="h-6 w-6" /> Add a photo
                <span className="text-xs font-normal text-muted-foreground">{def.photo.hint}</span>
              </button>
            )}
            {def.fields.length > 0 && (
              <div className="mt-4">
                <FieldGrid toolId={toolId} fields={def.fields} values={values} onChange={setValues} sample={def.sample} disabled={busy} />
              </div>
            )}
          </div>
          <div className={card}>
            <StepLabel n={3}>Pick the pictures to make</StepLabel>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {def.variants.map((v) => {
                const on = picked.includes(v.key);
                return (
                  <button
                    key={v.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(v.key)}
                    className={cn("flex items-start gap-2 rounded-xl border-2 p-2.5 text-left text-sm transition-colors", on ? "border-ink bg-sun" : "border-ink/25 hover:border-ink")}
                  >
                    <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 border-ink", on && "bg-ink text-white")}>{on && <Check className="h-3 w-3" />}</span>
                    <span>
                      <span className="block font-semibold">{v.label}</span>
                      <span className="text-xs text-muted-foreground">{v.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <Button className="mt-4 w-full gap-2" size="lg" onClick={make} disabled={busy || !picked.length}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Make {picked.length} picture{picked.length === 1 ? "" : "s"} · {picked.length * def.credits} credits
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">{def.credits} credits a picture, charged only for pictures that come out. Your photo is not stored.</p>
          </div>
        </div>
        <div id={`${toolId}-output`} className="min-w-0 scroll-mt-24">
          {!shots.length ? (
            <ResultPlaceholder title="Your pictures appear here">
              <ul className="mt-1 space-y-0.5 text-left">
                {def.youGet.map((s) => (
                  <li key={s}>• {s}</li>
                ))}
              </ul>
            </ResultPlaceholder>
          ) : (
            <div className={card}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[15px] font-bold">Your pictures</p>
                <div className="flex gap-1">
                  {shots.some((s) => s.url) && (
                    <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={saveAll}>
                      <Download className="h-3.5 w-3.5" /> Save all
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => setShots([])} disabled={busy}>
                    <RotateCcw className="h-3.5 w-3.5" /> Clear
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {shots.map((s) => (
                  <figure key={s.key} className="overflow-hidden rounded-xl border-2 border-ink bg-sand">
                    <div className="flex aspect-square items-center justify-center">
                      {s.url ? (
                        <img src={s.url} alt={s.label} className="h-full w-full object-cover" />
                      ) : s.status === "failed" ? (
                        <p className="p-4 text-center text-xs text-muted-foreground">Not made. You were not charged.</p>
                      ) : (
                        <Loader2 className={cn("h-6 w-6", s.status === "making" ? "animate-spin" : "opacity-30")} />
                      )}
                    </div>
                    <figcaption className="flex items-center justify-between gap-2 border-t-2 border-ink bg-card px-3 py-2 text-sm font-semibold">
                      {s.label}
                      {s.url && (
                        <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={async () => downloadBlob(await dataUrlToBlob(s.url as string), `${toolId}-${s.key}.png`)}>
                          <Download className="h-3.5 w-3.5" /> Save
                        </Button>
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
