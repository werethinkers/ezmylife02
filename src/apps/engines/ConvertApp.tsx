import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Download, FileDown, Loader2, Lock, RotateCcw, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AppShell } from "../shell/AppShell";
import { FieldInput } from "../shell/Fields";
import { ResultPlaceholder, StepLabel } from "../shell/StepLabel";
import { useAppStore, uid } from "../lib/store";
import { downloadBlob } from "../lib/files";
import { formatBytes, runConverter, zipFiles, type ConvertResult } from "../lib/convert";
import type { ConvertDef } from "../types";

const MAX_BYTES = 100 * 1024 * 1024;
const MAX_FILES = 50;

interface Done {
  id: string;
  at: number;
  inputs: string[];
  summary: string;
  outputs: string[];
}

const defaults = (def: ConvertDef) => Object.fromEntries((def.options ?? []).map((f) => [f.key, f.default ?? ""]));

/** Add files → pick settings → convert in the browser → download. Files are never uploaded. */
export default function ConvertApp({ toolId, def }: { toolId: string; def: ConvertDef }) {
  const store = useAppStore<{ history: Done[]; savedAt?: number }>(toolId, { history: [] });
  const [files, setFiles] = useState<File[]>([]);
  const [opts, setOpts] = useState<Record<string, string>>(() => defaults(def));
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<[number, number]>([0, 0]);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // A new set of files or settings makes the old result stale.
  useEffect(() => setResult(null), [files, opts]);

  const accepts = useCallback(
    (f: File) => {
      const rules = def.accept.split(",").map((s) => s.trim().toLowerCase());
      const name = f.name.toLowerCase();
      const type = (f.type || "").toLowerCase();
      return rules.some((r) => (r.startsWith(".") ? name.endsWith(r) : r.endsWith("/*") ? type.startsWith(r.slice(0, -1)) : type === r));
    },
    [def.accept],
  );

  const add = (list: FileList | File[] | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const ok = incoming.filter(accepts);
    const wrong = incoming.length - ok.length;
    const big = ok.filter((f) => f.size > MAX_BYTES);
    const usable = ok.filter((f) => f.size <= MAX_BYTES);
    if (wrong) toast.error(`${wrong} file${wrong === 1 ? " was" : "s were"} skipped: this app takes ${def.acceptLabel}.`);
    if (big.length) toast.error(`${big.map((f) => f.name).join(", ")}: larger than 100 MB.`);
    setFiles((prev) => {
      const next = def.multiple ? [...prev, ...usable] : usable.slice(0, 1);
      if (next.length > MAX_FILES) toast.error(`Up to ${MAX_FILES} files at a time.`);
      return next.slice(0, MAX_FILES);
    });
  };

  const move = (i: number, by: number) =>
    setFiles((prev) => {
      const j = i + by;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const convert = async () => {
    if (!files.length) {
      toast.error(`Add ${def.multiple ? "your files" : "a file"} first.`);
      return;
    }
    setBusy(true);
    setProgress([0, files.length]);
    try {
      const res = await runConverter(def.converter, files, opts, (d, t) => setProgress([d, t]));
      setResult(res);
      const item: Done = { id: uid(), at: Date.now(), inputs: files.map((f) => f.name).slice(0, 20), summary: res.summary, outputs: res.files.map((f) => f.name).slice(0, 20) };
      store.update((d) => ({ history: [item, ...(d.history ?? [])].slice(0, 15) }));
      if (res.files.length === 1) downloadBlob(res.files[0].blob, res.files[0].name);
      requestAnimationFrame(() => document.getElementById(`${toolId}-output`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "This file could not be converted.");
    } finally {
      setBusy(false);
    }
  };

  const downloadAll = async () => {
    if (!result) return;
    const zip = await zipFiles(result.files, `${def.fileName}.zip`);
    downloadBlob(zip.blob, zip.name);
  };

  const order = def.multiple && ["images-to-pdf", "merge-pdf"].includes(def.converter);
  const total = files.reduce((a, f) => a + f.size, 0);

  return (
    <AppShell toolId={toolId} intro={def.intro} steps={def.steps} related={def.related} syncState={store.syncState}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-ink bg-card p-4 shadow-block sm:p-5">
            <StepLabel n={2}>Add {def.acceptLabel}</StepLabel>
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                add(e.dataTransfer.files);
              }}
              className={cn(
                "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
                dragging ? "border-ink bg-sun/40" : "border-ink/50 bg-sand/60 hover:border-ink hover:bg-sun/20",
              )}
            >
              <Upload className="h-7 w-7" aria-hidden />
              <span className="mt-2 font-bold">Tap to add {def.multiple ? "files" : "a file"}, or drop {def.multiple ? "them" : "it"} here</span>
              <span className="mt-1 text-xs text-muted-foreground">{def.acceptLabel} · up to 100 MB each</span>
            </button>
            <input
              ref={input}
              type="file"
              className="hidden"
              accept={def.accept}
              multiple={def.multiple}
              onChange={(e) => {
                add(e.target.files);
                e.target.value = "";
              }}
            />

            {files.length > 0 && (
              <ul className="mt-3 space-y-1.5" aria-label="Files added">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg border border-ink/20 bg-background px-2 py-1.5 text-sm">
                    {order && <span className="w-5 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>}
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(f.size)}</span>
                    {order && (
                      <>
                        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${f.name} up`}>
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(i, 1)} disabled={i === files.length - 1} aria-label={`Move ${f.name} down`}>
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {files.length > 1 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {files.length} files · {formatBytes(total)}
                {order && " · the order here is the order in the result"}
              </p>
            )}

            {(def.options ?? []).length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(def.options ?? []).map((f) => (
                  <FieldInput key={f.key} field={f} idPrefix={toolId} value={opts[f.key]} onChange={(v) => setOpts((p) => ({ ...p, [f.key]: String(v) }))} />
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button type="button" className="gap-2" onClick={() => void convert()} disabled={busy || !files.length}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                {def.cta}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setFiles([]);
                  setOpts(defaults(def));
                }}
                disabled={busy}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear
              </Button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" aria-hidden /> Your files stay on this device. Nothing is uploaded.
            </p>
          </div>

          {(store.data.history ?? []).length > 0 && (
            <section className="rounded-2xl border-2 border-ink/20 bg-card p-4">
              <h2 className="text-sm font-bold">Recent conversions</h2>
              <p className="text-xs text-muted-foreground">Only the file names are kept, not the files.</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {(store.data.history ?? []).slice(0, 8).map((h) => (
                  <li key={h.id} className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{h.inputs.join(", ")}</span>
                      <span className="block text-xs text-muted-foreground">{h.summary}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{new Date(h.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </li>
                ))}
              </ul>
              <Button type="button" variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs" onClick={() => store.update(() => ({ history: [] }))}>
                Clear list
              </Button>
            </section>
          )}
        </div>

        <div id={`${toolId}-output`} className="min-w-0 scroll-mt-24">
          {busy ? (
            <div className="space-y-3 rounded-2xl border-2 border-ink bg-card p-6" aria-busy="true" aria-live="polite">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Working on it… {progress[1] > 1 && `${progress[0]} of ${progress[1]}`}
              </p>
              <Progress value={progress[1] ? (progress[0] / progress[1]) * 100 : 5} />
            </div>
          ) : result ? (
            <div className="rounded-2xl border-2 border-ink bg-card p-4 shadow-block sm:p-5">
              <StepLabel n={3}>Download {def.outputLabel}</StepLabel>
              <p className="text-sm font-semibold" role="status">{result.summary}.</p>
              {result.files.length === 1 && <p className="text-xs text-muted-foreground">The download started by itself. Use the button if it didn't.</p>}
              <ul className="mt-3 space-y-1.5">
                {result.files.slice(0, 200).map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg border border-ink/20 bg-background px-2 py-1.5 text-sm">
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(f.blob.size)}</span>
                    <Button type="button" size="sm" variant="outline" className="h-7 gap-1 px-2" onClick={() => downloadBlob(f.blob, f.name)}>
                      <Download className="h-3.5 w-3.5" /> Save
                    </Button>
                  </li>
                ))}
              </ul>
              {result.files.length > 1 && (
                <Button type="button" className="mt-3 gap-2" onClick={() => void downloadAll()}>
                  <Download className="h-4 w-4" /> Download all as ZIP
                </Button>
              )}
              {result.text && (
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-sm font-bold">The text</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 px-2"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(result.text ?? "");
                          toast.success("Copied");
                        } catch {
                          toast.error("Copy was blocked. Select the text and copy it instead.");
                        }
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy all
                    </Button>
                  </div>
                  <textarea readOnly value={result.text} className="h-80 w-full resize-y rounded-xl border-2 border-ink/30 bg-background p-3 font-mono text-xs" aria-label="Text from the PDF" />
                </div>
              )}
            </div>
          ) : (
            <ResultPlaceholder title={`You'll get ${def.outputLabel}`}>Add {def.acceptLabel.toLowerCase()} on the left, then press “{def.cta}”.</ResultPlaceholder>
          )}
        </div>
      </div>
    </AppShell>
  );
}
