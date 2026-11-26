import { useEffect, useRef, useState } from "react";
import { Camera, Check, Download, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useModernTheme } from "@/components/modern/theme";
import { AppIcon } from "@/components/store/AppIcon";
import { CreditCostBadge } from "@/components/tools/CreditCostBadge";
import { cn } from "@/lib/utils";
import { NeedsCredits, errorText } from "../lib/api";
import { dataUrlToBlob, downloadBlob, imageToDataUrl } from "../lib/files";
import { takeHandoff } from "../lib/handoff";
import { FieldInput } from "../shell/Fields";
import type { Field, FormValues } from "../types";
import type { StudioDef } from "../flagship/types";
import { runFlagship } from "../flagship/api";
import { emptyValues, inputsOf, missingFields } from "../flagship/parts";
import { AmbientGlow, CONTROL, HINT, LABEL, UNBOUNDED, WhatYouGet, WorksWellWith } from "../flagship/studioUi";

const CARD = "rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-[#16161A]";

interface Shot {
  key: string;
  label: string;
  status: "waiting" | "making" | "done" | "failed";
  url?: string;
}

/** One photo in, several finished pictures out, charged per picture that is made. */
export default function StudioApp({ toolId, def }: { toolId: string; def: StudioDef }) {
  const { data: catalog = [] } = useToolsCatalog();
  const appName = catalog.find((t) => t.id === toolId)?.name ?? "Result";
  const appCategory = catalog.find((t) => t.id === toolId)?.category;
  const { dark } = useModernTheme();
  const [photo, setPhoto] = useState<string | null>(null);
  const [values, setValues] = useState<FormValues>(() => emptyValues(def.fields));
  const [picked, setPicked] = useState<string[]>(def.variants.slice(0, Math.min(3, def.variants.length)).map((v) => v.key));
  const [shots, setShots] = useState<Shot[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Brand context sent from another app ("Use in…", e.g. Brand Identity Kit) — matched onto
  // whichever of this tool's own fields look like a brand-name / colours field, by label, so it
  // works for any studio tool that has them (not hardcoded to Packaging Design Studio).
  useEffect(() => {
    const h = takeHandoff(toolId);
    if (!h?.brand) return;
    const brandField = def.fields.find((f) => /\bbrand\b/i.test(f.label) && f.type !== "select");
    const colourField = def.fields.find((f) => /colou?rs?\b/i.test(f.label));
    setValues((v) => ({
      ...v,
      ...(brandField ? { [brandField.key]: h.brand!.name } : {}),
      ...(colourField && h.brand!.colors.length ? { [colourField.key]: h.brand!.colors.join(", ") } : {}),
    }));
    if (h.brand.logoUrl) setPhoto(h.brand.logoUrl);
    toast.success(`Brought in your brand from ${h.fromName}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId]);

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

  const showPreview = !shots.length;

  return (
    <div className={cn("ez-modern", dark && "dark")}>
      <div className="relative overflow-hidden bg-[#FAF7F2] dark:bg-[#0D0D0F]">
        <AmbientGlow />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <AppIcon toolId={toolId} category={appCategory} name={appName} size="sm" />
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-[#111111] dark:text-white sm:text-3xl" style={UNBOUNDED}>
                  {appName}
                </h1>
                <p className="mt-1.5 max-w-2xl text-[16px] text-black/60 dark:text-white/60">{def.intro}</p>
              </div>
            </div>
            <CreditCostBadge toolId={toolId} className="!border-[1.5px] !border-[#111111] !bg-[#FACC15] dark:!border-white/70" />
          </header>

          <div className={cn("mt-6 grid gap-6", showPreview ? "grid-cols-1 lg:grid-cols-12 items-stretch" : "grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]")}>
            <div className={cn("space-y-4", showPreview && "lg:col-span-7")}>
              <div className={CARD}>
                <p className={cn("mb-3", LABEL)}>{def.photo.label}</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void addPhoto(e.target.files?.[0]); e.target.value = ""; }} />
                {photo ? (
                  <div className="relative overflow-hidden rounded-xl border border-black/10 dark:border-white/15">
                    <img src={photo} alt="Your photo" className="max-h-72 w-full bg-[#F3F4F6] object-contain dark:bg-[#1F1F24]" />
                    <Button size="icon" variant="secondary" className="absolute right-2 top-2 h-8 w-8" onClick={() => setPhoto(null)} aria-label="Remove photo">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full flex-col items-center gap-1 rounded-xl border border-dashed border-black/20 bg-[#F3F4F6] px-4 py-8 text-sm font-semibold text-[#111111] hover:border-[#111111] dark:border-white/20 dark:bg-[#1F1F24] dark:text-white"
                  >
                    <Camera className="h-6 w-6" /> Add a photo
                    <span className={cn("font-normal", HINT)}>{def.photo.hint}</span>
                  </button>
                )}
                {def.fields.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
                    {def.fields.map((f) => (
                      <div key={f.key} className={cn(f.half ? "sm:col-span-1" : "sm:col-span-2")}>
                        <FieldInput
                          field={{ ...f, half: false }}
                          idPrefix={toolId}
                          value={values[f.key]}
                          onChange={(x) => setValues({ ...values, [f.key]: x })}
                          controlClassName={CONTROL}
                          labelClassName={LABEL}
                          hintClassName={HINT}
                        />
                      </div>
                    ))}
                    {def.sample && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-[#111111] hover:bg-black/5 dark:text-white dark:hover:bg-white/10 sm:col-span-2 sm:w-fit"
                        disabled={busy}
                        onClick={() => setValues({ ...values, ...def.sample })}
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Fill in an example
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className={CARD}>
                <p className={cn("mb-3", LABEL)}>Pick the pictures to make</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {def.variants.map((v) => {
                    const on = picked.includes(v.key);
                    return (
                      <button
                        key={v.key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(v.key)}
                        className={cn(
                          "flex items-start gap-2 rounded-xl border p-2.5 text-left text-sm transition-colors",
                          on ? "border-[#111111] bg-[#FACC15]/30 dark:border-white/70 dark:bg-[#FACC15]/15" : "border-black/10 hover:border-[#111111] dark:border-white/15 dark:hover:border-white/50",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                            on ? "border-[#111111] bg-[#111111] text-white dark:border-white dark:bg-white dark:text-[#111111]" : "border-black/30 dark:border-white/30",
                          )}
                        >
                          {on && <Check className="h-3 w-3" />}
                        </span>
                        <span>
                          <span className="block font-semibold text-[#111111] dark:text-white">{v.label}</span>
                          <span className={HINT}>{v.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <Button
                  className="mt-4 w-full gap-2 rounded-full border-[1.5px] border-[#111111] bg-[#F472D0] text-[#111111] shadow-[3px_3px_0_#111111] hover:bg-[#F472D0]/90 dark:border-white/70"
                  size="lg"
                  onClick={make}
                  disabled={busy || !picked.length}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Make {picked.length} picture{picked.length === 1 ? "" : "s"} · {picked.length * def.credits} credits
                </Button>
                <p className={cn("mt-2", HINT)}>{def.credits} credits a picture, charged only for pictures that come out. Your photo is not stored.</p>
              </div>
            </div>
            <div id={`${toolId}-output`} className={cn("min-w-0 scroll-mt-24", showPreview && "lg:col-span-5")}>
              {showPreview ? (
                <WhatYouGet items={def.youGet} working={false} sample={false} />
              ) : (
                <div className={CARD}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className={cn("text-[15px] font-bold", LABEL)}>Your pictures</p>
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
                      <figure key={s.key} className="overflow-hidden rounded-xl border border-black/10 bg-[#F3F4F6] dark:border-white/15 dark:bg-[#1F1F24]">
                        <div className="flex aspect-square items-center justify-center">
                          {s.url ? (
                            <img src={s.url} alt={s.label} className="h-full w-full object-cover" />
                          ) : s.status === "failed" ? (
                            <p className={cn("p-4 text-center", HINT)}>Not made. You were not charged.</p>
                          ) : (
                            <Loader2 className={cn("h-6 w-6", s.status === "making" ? "animate-spin" : "opacity-30")} />
                          )}
                        </div>
                        <figcaption className="flex items-center justify-between gap-2 border-t border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#111111] dark:border-white/15 dark:bg-[#16161A] dark:text-white">
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

          {def.related && def.related.length > 0 && <WorksWellWith ids={def.related} />}
        </div>
      </div>
    </div>
  );
}
