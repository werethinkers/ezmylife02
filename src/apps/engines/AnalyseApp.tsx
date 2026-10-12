import { useRef, useState } from "react";
import { FileAudio, FileText, Image as ImageIcon, Loader2, Paperclip, RotateCcw, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { AppShell } from "../shell/AppShell";
import { HistoryList } from "../shell/HistoryList";
import { StepLabel } from "../shell/StepLabel";
import { NeedsCredits, errorText } from "../lib/api";
import { imageToDataUrl, openPdf, pdfPageImage, pdfPageText, slug } from "../lib/files";
import type { FormValues } from "../types";
import type { AnalyseDef } from "../flagship/types";
import { runFlagship } from "../flagship/api";
import { FieldGrid, ResultView, YouGet, card, emptyValues, inputsOf, missingFields } from "../flagship/parts";
import { useResults } from "../flagship/useResults";

interface Item {
  name: string;
  kind: "text" | "image" | "audio";
  /** Text, or a data: URL for images and audio. */
  data: string;
  note?: string;
}

const TEXT_BUDGET = 110_000; // characters of document text sent (~28k tokens)
const MAX_PICS = 8;
const MAX_AUDIO_MB = 10;
const SCANNED_PAGES = 6; // scanned PDFs: pages read as pictures

const readAsDataUrl = (f: File) =>
  new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = () => rej(new Error(`Could not read ${f.name}.`));
    fr.readAsDataURL(f);
  });

/** Upload documents, photos, a recording or pasted text, and get a deep report. */
export default function AnalyseApp({ toolId, def }: { toolId: string; def: AnalyseDef }) {
  const { data: catalog = [] } = useToolsCatalog();
  const appName = catalog.find((t) => t.id === toolId)?.name ?? "Report";
  const r = useResults(toolId);
  const [values, setValues] = useState<FormValues>(() => emptyValues(def.fields));
  const [items, setItems] = useState<Item[]>([]);
  const [pasted, setPasted] = useState("");
  const [reading, setReading] = useState<{ name: string; pct: number } | null>(null);
  const [busy, setBusy] = useState<"final" | "refine" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const kinds = def.upload.kinds;

  const accept = [
    kinds.includes("pdf") ? ".pdf,application/pdf,.txt,.md,.csv,text/plain,text/csv" : "",
    kinds.includes("photo") ? "image/*" : "",
    kinds.includes("audio") ? "audio/*" : "",
  ]
    .filter(Boolean)
    .join(",");

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      try {
        if (f.type.startsWith("image/") && kinds.includes("photo")) {
          if (items.filter((i) => i.kind === "image").length >= MAX_PICS) {
            toast.error(`Up to ${MAX_PICS} photos.`);
            continue;
          }
          setItems((x) => [...x, { name: f.name, kind: "image", data: "" }]);
          const url = await imageToDataUrl(f, 1600, 0.82);
          setItems((x) => x.map((i) => (i.name === f.name && !i.data ? { ...i, data: url } : i)));
        } else if (f.type.startsWith("audio/") && kinds.includes("audio")) {
          if (f.size > MAX_AUDIO_MB * 1024 * 1024) {
            toast.error(`Recordings up to ${MAX_AUDIO_MB} MB. Trim it, or paste a transcript instead.`);
            continue;
          }
          const url = await readAsDataUrl(f);
          setItems((x) => [...x.filter((i) => i.kind !== "audio"), { name: f.name, kind: "audio", data: url }]);
        } else if ((f.type === "application/pdf" || /\.pdf$/i.test(f.name)) && kinds.includes("pdf")) {
          setReading({ name: f.name, pct: 0 });
          const doc = await openPdf(f);
          const total = Math.min(doc.numPages, 300);
          let text = "";
          for (let p = 1; p <= total; p++) {
            text += `\n--- Page ${p} ---\n${await pdfPageText(doc, p)}`;
            setReading({ name: f.name, pct: Math.round((p / total) * 100) });
          }
          if (text.replace(/--- Page \d+ ---/g, "").trim().length < 40 * total) {
            // Little or no selectable text: a scan. Read the first pages as pictures instead.
            const pics: Item[] = [];
            for (let p = 1; p <= Math.min(total, SCANNED_PAGES); p++) pics.push({ name: `${f.name} p${p}`, kind: "image", data: await pdfPageImage(doc, p, 1500) });
            setItems((x) => [...x, ...pics]);
            if (total > SCANNED_PAGES) toast.info(`${f.name} is a scan, so its first ${SCANNED_PAGES} pages are read as pictures.`);
          } else {
            setItems((x) => [...x, { name: f.name, kind: "text", data: text, note: `${total} pages` }]);
          }
        } else if (/\.(txt|md|csv)$/i.test(f.name) || f.type.startsWith("text/")) {
          const data = await f.text();
          setItems((x) => [...x, { name: f.name, kind: "text", data }]);
        } else {
          toast.error(`${f.name}: ${def.upload.label} only.`);
        }
      } catch (e) {
        toast.error(errorText(e));
      } finally {
        setReading(null);
      }
    }
  };

  const textItems = items.filter((i) => i.kind === "text");
  const context = () => {
    const parts = [...textItems.map((i) => `### ${i.name}\n${i.data}`), pasted.trim() ? `### Pasted text\n${pasted.trim()}` : ""].filter(Boolean);
    if (!parts.length) return undefined;
    const per = Math.floor(TEXT_BUDGET / parts.length);
    return parts.map((p) => p.slice(0, per)).join("\n\n");
  };
  const totalText = textItems.reduce((n, i) => n + i.data.length, 0) + pasted.length;
  const hasInput = items.some((i) => i.data) || pasted.trim().length > 0;

  const run = async (instruction?: string) => {
    const miss = missingFields(def.fields, values);
    if (miss.length) return toast.error(`Please fill: ${miss.map((f) => f.label).join(", ")}`);
    if (def.upload.required && !hasInput) return toast.error(`Add ${def.upload.label.toLowerCase()} first.`);
    setBusy(instruction ? "refine" : "final");
    try {
      const { output } = await runFlagship<string>(toolId, "final", {
        inputs: inputsOf(def.fields, values),
        context: context(),
        images: items.filter((i) => i.kind === "image" && i.data).map((i) => i.data),
        audio: items.find((i) => i.kind === "audio")?.data,
        ...(instruction ? { previous: r.output, instruction } : {}),
      });
      const title = (items[0]?.name ?? (Object.values(values).find((v) => typeof v === "string" && v.trim()) as string | undefined) ?? appName).replace(/\.[a-z0-9]+$/i, "");
      r.save(title, output, values, instruction ? undefined : r.newId());
    } catch (e) {
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const Icon = (k: Item["kind"]) => (k === "image" ? ImageIcon : k === "audio" ? FileAudio : FileText);

  return (
    <AppShell toolId={toolId} intro={def.intro} steps={def.steps} related={def.related} syncState={r.store.syncState} wide>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-4">
          <form
            className={card}
            onSubmit={(e) => {
              e.preventDefault();
              void run();
            }}
          >
            <StepLabel n={2}>{def.upload.label}</StepLabel>
            <p className="-mt-2 mb-3 text-sm text-muted-foreground">{def.upload.hint}</p>
            {kinds.some((k) => k !== "text") && (
              <>
                <input ref={fileRef} type="file" multiple accept={accept} className="hidden" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink/50 bg-sand/60 px-4 py-6 text-sm font-semibold hover:border-ink hover:bg-sand"
                >
                  <Paperclip className="h-5 w-5" /> Add files
                  <span className="text-xs font-normal text-muted-foreground">
                    {[kinds.includes("pdf") && "PDF or text", kinds.includes("photo") && "photos", kinds.includes("audio") && `a recording up to ${MAX_AUDIO_MB} MB`].filter(Boolean).join(", ")} · read in your browser
                  </span>
                </button>
              </>
            )}
            {reading && (
              <div className="mt-3 space-y-1">
                <p className="truncate text-xs">Reading {reading.name}…</p>
                <Progress value={reading.pct} className="h-1.5" />
              </div>
            )}
            {items.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {items.map((it, i) => {
                  const I = Icon(it.kind);
                  return (
                    <li key={`${it.name}-${i}`} className="flex items-center gap-2 rounded-lg border-2 border-ink/20 bg-sand px-2 py-1.5 text-xs">
                      {it.kind === "image" && it.data ? <img src={it.data} alt="" className="h-7 w-7 rounded object-cover" /> : <I className="h-4 w-4 shrink-0" />}
                      <span className="min-w-0 flex-1 truncate">{it.name}</span>
                      {!it.data && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {it.note && <span className="text-muted-foreground">{it.note}</span>}
                      <button type="button" onClick={() => setItems((x) => x.filter((_, j) => j !== i))} aria-label={`Remove ${it.name}`}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {kinds.includes("text") && (
              <div className="mt-3 space-y-1.5">
                <label htmlFor={`${toolId}-paste`} className="text-sm font-semibold">
                  {kinds.length > 1 ? "Or paste text" : "Paste the text"}
                </label>
                <Textarea id={`${toolId}-paste`} rows={5} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="Paste here…" />
              </div>
            )}
            {totalText > TEXT_BUDGET && <p className="mt-2 text-[11px] text-amber-600">Long documents: about the first {Math.round(TEXT_BUDGET / 1000)}k characters are read.</p>}
            {def.fields.length > 0 && (
              <div className="mt-5 border-t-2 border-ink/10 pt-4">
                <FieldGrid toolId={toolId} fields={def.fields} values={values} onChange={setValues} sample={def.sample} disabled={!!busy} />
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button type="submit" className="gap-2" disabled={!!busy || !!reading}>
                {busy === "final" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {def.cta} · {def.credits} credits
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setItems([]);
                  setPasted("");
                  setValues(emptyValues(def.fields));
                  r.reset();
                }}
                disabled={!!busy}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Files are read on your device and sent only to make this report. They are not stored.</p>
          </form>
          <HistoryList
            items={r.history}
            activeId={r.activeId}
            onOpen={(h) => {
              r.open(h);
              if (h.inputs) setValues({ ...emptyValues(def.fields), ...h.inputs });
            }}
            onDelete={r.remove}
          />
        </div>
        <div id={`${toolId}-output`} className="min-w-0 scroll-mt-24">
          {busy === "final" || !r.output ? (
            <YouGet items={def.youGet} working={busy === "final"} />
          ) : (
            <ResultView
              toolId={toolId}
              def={def}
              text={r.output}
              title={appName}
              fileName={`${def.fileName}-${slug(r.history.find((h) => h.id === r.activeId)?.title ?? appName)}`}
              onRefine={(i) => void run(i)}
              refining={busy === "refine"}
              onEdit={r.setOutput}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
