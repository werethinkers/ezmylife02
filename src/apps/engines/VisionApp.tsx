import { useEffect, useRef, useState } from "react";
import { Download, ImagePlus, Loader2, ScanText, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { AppShell } from "../shell/AppShell";
import { OutputPanel } from "../shell/OutputPanel";
import { HistoryList, addHistory, type HistoryItem } from "../shell/HistoryList";
import { useAppStore, uid } from "../lib/store";
import { runApp, NeedsCredits, errorText } from "../lib/api";
import { downloadText, imageToDataUrl, openPdf, pdfPageImage, toCsv } from "../lib/files";
import type { VisionAppDef } from "../types";

interface Fields {
  document_type?: string;
  fields?: { label: string; value: string }[];
  line_items?: Record<string, string>[];
}

const MAX = { ocr: 3, "auto-text-extractor": 4 } as Record<string, number>;

/** Photos / scanned PDFs → text (OCR) or structured fields, read by a vision model. */
export default function VisionApp({ toolId, def }: { toolId: string; def: VisionAppDef }) {
  const { data: catalog = [] } = useToolsCatalog();
  const appName = catalog.find((t) => t.id === toolId)?.name ?? "Result";
  const store = useAppStore<{ history: HistoryItem[]; savedAt?: number }>(toolId, { history: [] });
  const max = MAX[toolId] ?? 6;
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [fields, setFields] = useState<Fields | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (files.length) void add(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  const add = async (files: File[]) => {
    setLoading(true);
    try {
      const out: { name: string; url: string }[] = [];
      for (const f of files) {
        if (out.length + images.length >= max) break;
        if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) {
          const doc = await openPdf(f);
          for (let p = 1; p <= doc.numPages && out.length + images.length < max; p++) out.push({ name: `${f.name} · p${p}`, url: await pdfPageImage(doc, p) });
          if (doc.numPages + images.length > max) toast.info(`Using the first pages only — up to ${max} pages per run.`);
        } else if (f.type.startsWith("image/")) {
          out.push({ name: f.name, url: await imageToDataUrl(f, 2000) });
        } else toast.error(`${f.name}: use a photo (JPG/PNG) or a PDF.`);
      }
      setImages((x) => [...x, ...out].slice(0, max));
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setLoading(false);
    }
  };

  const run = async () => {
    if (!images.length) return toast.error("Add a photo or PDF first.");
    setBusy(true);
    try {
      const out = await runApp<string | Fields>(toolId, { images: images.map((i) => i.url), inputs: note ? { "Extra instructions": note } : undefined });
      const id = uid();
      if (def.mode === "fields" && typeof out === "object") {
        setFields(out);
        setText("");
        store.update((d) => ({ history: addHistory(d.history, { id, at: Date.now(), title: out.document_type || images[0].name, output: JSON.stringify(out) }) }));
      } else {
        const t = typeof out === "string" ? out : JSON.stringify(out, null, 2);
        setText(t);
        setFields(null);
        store.update((d) => ({ history: addHistory(d.history, { id, at: Date.now(), title: images[0].name, output: t }) }));
      }
      setActiveId(id);
    } catch (e) {
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const fieldsCsv = (f: Fields) => {
    const a = toCsv((f.fields ?? []).map((x) => ({ Field: x.label, Value: x.value })), [{ key: "Field", label: "Field" }, { key: "Value", label: "Value" }]);
    const items = f.line_items?.filter((r) => Object.values(r).some(Boolean)) ?? [];
    if (!items.length) return a;
    const cols = Object.keys(items[0]).map((k) => ({ key: k, label: k }));
    return `${a}\n\n${toCsv(items, cols)}`;
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} steps={def.steps} related={def.related} syncState={store.syncState}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-ink bg-card p-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void add(Array.from(e.dataTransfer.files));
              }}
              className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border px-4 py-8 text-center transition-colors hover:border-primary/50"
            >
              {loading ? <Loader2 className="h-7 w-7 animate-spin text-primary" /> : <ImagePlus className="h-7 w-7 text-primary" />}
              <span className="mt-2 text-sm font-medium">Add photos or a PDF</span>
              <span className="mt-1 text-xs text-muted-foreground">Drop, click, or paste a screenshot · up to {max} pages per run</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple capture={undefined} className="hidden" onChange={(e) => { void add(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {images.map((im, i) => (
                  <div key={i} className="relative overflow-hidden rounded-lg border border-border/60">
                    <img src={im.url} alt={im.name} className="aspect-[3/4] w-full object-cover" />
                    <button type="button" onClick={() => setImages((x) => x.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-background/90 p-1" aria-label={`Remove ${im.name}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 space-y-1">
              <Label htmlFor={`${toolId}-note`} className="text-xs">{def.instructionsLabel ?? "Anything specific? (optional)"}</Label>
              <Input id={`${toolId}-note`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. only the table on page 2; keep Hindi as is" />
            </div>
            <Button className="mt-4 w-full gap-2" onClick={run} disabled={busy || loading || !images.length}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanText className="h-4 w-4" />}
              {def.cta}
            </Button>
          </div>
          <HistoryList
            items={store.data.history ?? []}
            activeId={activeId}
            onOpen={(h) => {
              setActiveId(h.id);
              if (def.mode === "fields") {
                try {
                  setFields(JSON.parse(h.output));
                  setText("");
                } catch {
                  setText(h.output);
                }
              } else setText(h.output);
            }}
            onDelete={(id) => store.update((d) => ({ history: (d.history ?? []).filter((h) => h.id !== id) }))}
          />
        </div>
        <div className="min-w-0">
          {busy ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl border-2 border-ink bg-card text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reading your document…
            </div>
          ) : fields ? (
            <div className="rounded-2xl border-2 border-ink bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-4 py-2.5">
                <p className="text-sm font-semibold">{fields.document_type ? `Detected: ${fields.document_type}` : "Extracted fields"}</p>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => downloadText(fieldsCsv(fields), `${def.fileName}.csv`, "text/csv")}>
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => downloadText(JSON.stringify(fields, null, 2), `${def.fileName}.json`, "application/json")}>
                    JSON
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto p-4">
                <table className="w-full text-sm">
                  <tbody>
                    {(fields.fields ?? []).map((f, i) => (
                      <tr key={i} className="border-b border-border/40 last:border-0">
                        <td className="w-2/5 py-1.5 pr-3 text-muted-foreground">{f.label}</td>
                        <td className="py-1.5 font-medium">
                          <input
                            className="w-full bg-transparent outline-none focus:underline"
                            value={f.value}
                            onChange={(e) => setFields((x) => x && { ...x, fields: (x.fields ?? []).map((y, j) => (j === i ? { ...y, value: e.target.value } : y)) })}
                            aria-label={f.label}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(fields.line_items ?? []).filter((r) => Object.values(r).some(Boolean)).length > 0 && (
                  <>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Line items</p>
                    <table className="mt-2 w-full min-w-[420px] text-sm">
                      <thead className="text-left text-xs text-muted-foreground">
                        <tr>{Object.keys(fields.line_items![0]).map((k) => <th key={k} className="py-1 pr-2 capitalize">{k}</th>)}</tr>
                      </thead>
                      <tbody>
                        {fields.line_items!.map((r, i) => (
                          <tr key={i} className="border-t border-border/40">
                            {Object.keys(fields.line_items![0]).map((k) => <td key={k} className="py-1 pr-2">{r[k]}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
                <p className="mt-3 text-[11px] text-muted-foreground">Check values against the original — click any value to correct it before exporting.</p>
              </div>
            </div>
          ) : text ? (
            <OutputPanel toolId={toolId} text={text} title={appName} fileName={def.fileName} sendTo={def.related} editable onEdit={setText} />
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              The extracted text appears here.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
