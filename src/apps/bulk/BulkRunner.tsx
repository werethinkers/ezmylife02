import { useRef, useState } from "react";
import { CheckCircle2, Download, FileDown, FileUp, Loader2, Play, Square, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet, useRefreshWallet } from "@/hooks/useWallet";
import { useToolPricing } from "@/hooks/useToolPricing";
import { runWithCredits } from "@/lib/credits";
import { emitCreditPrompt } from "@/lib/creditPrompt";
import { RowsEditor } from "../shell/Fields";
import { useWorkspace } from "../lib/workspace";
import { NeedsCredits, errorText } from "../lib/api";
import { downloadBlob, downloadText, parseCsv, toCsv } from "../lib/files";
import type { BulkResult, FilesBulk, RowsBulk } from "./types";

interface Item {
  label: string;
  status: "waiting" | "running" | "done" | "failed" | "skipped";
  error?: string;
  result?: BulkResult;
}

/** Runs one app over many inputs (rows of a table/CSV, or many files) and zips the results. */
export function BulkRunner({ toolId, spec, appName }: { toolId: string; spec: RowsBulk | FilesBulk; appName: string }) {
  const { user } = useAuth();
  const { total: balance } = useWallet();
  const refresh = useRefreshWallet();
  const { creditCost } = useToolPricing(toolId);
  const { profile } = useWorkspace();
  const max = spec.max ?? 50;
  const blankRow = () => Object.fromEntries((spec.mode === "rows" ? spec.columns : []).map((c) => [c.key, ""]));
  const [rows, setRows] = useState<Record<string, string>[]>(() => [blankRow()]);
  const [files, setFiles] = useState<File[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const stop = useRef(false);
  const csvRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const inputs = spec.mode === "rows" ? rows.filter((r) => Object.values(r).some((v) => v?.trim())) : files;
  const perItem = creditCost * (spec.unitsPerItem ?? 1);
  const estimate = inputs.length * perItem;

  const template = () => {
    if (spec.mode !== "rows") return;
    const ex = Object.fromEntries(spec.columns.map((c) => [c.key, c.example ?? ""]));
    downloadText(toCsv([ex], spec.columns), `${toolId}-bulk-template.csv`, "text/csv");
  };

  const importCsv = async (f: File) => {
    if (spec.mode !== "rows") return;
    const grid = parseCsv(await f.text());
    if (grid.length < 2) return toast.error("The CSV needs a header row and at least one row.");
    const head = grid[0].map((h) => h.trim().toLowerCase());
    const idx = spec.columns.map((c) => head.findIndex((h) => h === c.label.toLowerCase() || h === c.key.toLowerCase()));
    if (idx.every((i) => i < 0)) return toast.error(`Columns not recognised. Download the template to see the headings.`);
    const next = grid.slice(1, max + 1).map((line) => Object.fromEntries(spec.columns.map((c, j) => [c.key, idx[j] >= 0 ? (line[idx[j]] ?? "").trim() : ""])));
    setRows(next);
    if (grid.length - 1 > max) toast.warning(`Only the first ${max} rows were kept.`);
  };

  const start = async () => {
    if (!user) return emitCreditPrompt({ kind: "login" });
    if (!inputs.length) return toast.error(spec.mode === "rows" ? "Add at least one row." : "Add at least one file.");
    if (spec.mode === "rows") {
      const missing = spec.columns.filter((c) => c.required);
      const bad = (inputs as Record<string, string>[]).findIndex((r) => missing.some((c) => !r[c.key]?.trim()));
      if (bad >= 0) return toast.error(`Row ${bad + 1} is missing: ${missing.filter((c) => !(inputs as Record<string, string>[])[bad][c.key]?.trim()).map((c) => c.label).join(", ")}`);
    }
    if (estimate > balance) return emitCreditPrompt({ kind: "buy", required: estimate, balance });

    stop.current = false;
    setRunning(true);
    const list: Item[] = inputs.map((x) => ({ label: spec.mode === "rows" ? Object.values(x as Record<string, string>).find((v) => v?.trim())?.slice(0, 60) ?? "row" : (x as File).name, status: "waiting" as const }));
    setItems([...list]);
    const env = { toolId, profile };
    for (let i = 0; i < inputs.length; i++) {
      if (stop.current) {
        for (let j = i; j < list.length; j++) list[j] = { ...list[j], status: "skipped" };
        break;
      }
      list[i] = { ...list[i], status: "running" };
      setItems([...list]);
      try {
        const work = () => (spec.mode === "rows" ? spec.run(inputs[i] as Record<string, string>, env) : spec.run(inputs[i] as File, env));
        const result = spec.chargeLocal
          ? (await runWithCredits(toolId, work, { onInsufficient: (required, bal) => emitCreditPrompt({ kind: "buy", required, balance: bal }) })).result
          : await work();
        list[i] = { ...list[i], status: "done", result };
      } catch (e) {
        const outOfCredits = e instanceof NeedsCredits || (e instanceof Error && e.message === "insufficient_credits");
        list[i] = { ...list[i], status: "failed", error: outOfCredits ? "Not enough credits" : errorText(e) };
        if (outOfCredits) {
          for (let j = i + 1; j < list.length; j++) list[j] = { ...list[j], status: "skipped" };
          setItems([...list]);
          break;
        }
      }
      setItems([...list]);
    }
    setRunning(false);
    refresh();
    const ok = list.filter((x) => x.status === "done").length;
    toast.success(`${ok} of ${list.length} done${ok < list.length ? " — failed items were not charged" : ""}`);
  };

  const downloadAll = async () => {
    const done = items.filter((x) => x.status === "done" && x.result);
    if (!done.length) return;
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    const used = new Set<string>();
    const rowsOut: Record<string, string | number>[] = [];
    for (const it of done) {
      const r = it.result!;
      if (r.text !== undefined || r.blob) {
        let name = `${r.name}.${r.ext ?? "txt"}`;
        for (let n = 2; used.has(name); n++) name = `${r.name}-${n}.${r.ext ?? "txt"}`;
        used.add(name);
        zip.file(name, r.blob ?? r.text!);
      }
      if (r.csvRow) rowsOut.push(r.csvRow);
    }
    if (rowsOut.length) {
      const keys = Array.from(new Set(rowsOut.flatMap((r) => Object.keys(r))));
      zip.file("results.csv", toCsv(rowsOut, keys.map((k) => ({ key: k, label: k }))));
    }
    const md = done.filter((x) => x.result?.ext === "md").map((x) => `# ${x.label}\n\n${x.result!.text}`).join("\n\n---\n\n");
    if (md) zip.file("all-results.md", md);
    downloadBlob(await zip.generateAsync({ type: "blob" }), `${toolId}-bulk-${new Date().toISOString().slice(0, 10)}.zip`);
  };

  const doneCount = items.filter((x) => x.status === "done").length;
  const pct = items.length ? Math.round((items.filter((x) => x.status !== "waiting" && x.status !== "running").length / items.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {spec.note && <p className="text-sm text-muted-foreground">{spec.note}</p>}

      {spec.mode === "rows" ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={template}><FileDown className="h-3.5 w-3.5" /> CSV template</Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => csvRef.current?.click()} disabled={running}><FileUp className="h-3.5 w-3.5" /> Upload CSV</Button>
            <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importCsv(f); e.target.value = ""; }} />
            <span className="self-center text-xs text-muted-foreground">or type rows below · up to {max}</span>
          </div>
          <RowsEditor columns={spec.columns.map((c) => ({ key: c.key, label: c.label + (c.required ? " *" : ""), placeholder: c.example }))} rows={rows} onChange={(r) => setRows(r.slice(0, max))} />
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); setFiles((f) => [...f, ...Array.from(e.dataTransfer.files)].slice(0, max)); }}
            className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border px-4 py-6 text-center hover:border-primary/50"
            disabled={running}
          >
            <Upload className="h-6 w-6 text-primary" />
            <span className="mt-1 text-sm font-medium">Drop files or click to choose</span>
            <span className="text-xs text-muted-foreground">Up to {max} files</span>
          </button>
          <input ref={fileRef} type="file" multiple accept={spec.accept} className="hidden" onChange={(e) => { setFiles((f) => [...f, ...Array.from(e.target.files ?? [])].slice(0, max)); e.target.value = ""; }} />
          {files.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{files.length} file{files.length === 1 ? "" : "s"}: {files.slice(0, 5).map((f) => f.name).join(", ")}{files.length > 5 ? "…" : ""} <button type="button" className="ml-1 text-primary" onClick={() => setFiles([])}>Clear</button></p>}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 p-3 text-sm">
        <span>
          {inputs.length} item{inputs.length === 1 ? "" : "s"} × {perItem} credit{perItem === 1 ? "" : "s"} = <strong>up to {estimate} credits</strong>
          <span className="ml-1 text-xs text-muted-foreground">(you have {balance}; failed items are free)</span>
        </span>
        {running ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => (stop.current = true)}><Square className="h-3.5 w-3.5" /> Stop after this one</Button>
        ) : (
          <Button size="sm" className="gap-1.5" onClick={start} disabled={!inputs.length}><Play className="h-3.5 w-3.5" /> Run {inputs.length || ""} in bulk</Button>
        )}
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          <Progress value={pct} className="h-2" />
          <ul className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border/60 p-2 text-sm">
            {items.map((it, i) => (
              <li key={i} className="flex items-center gap-2">
                {it.status === "running" ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : it.status === "done" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : it.status === "failed" ? <XCircle className="h-4 w-4 text-destructive" /> : <span className="h-4 w-4 rounded-full border border-border" />}
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{it.error ?? it.status}</span>
              </li>
            ))}
          </ul>
          <Button className="w-full gap-2" onClick={downloadAll} disabled={!doneCount || running}><Download className="h-4 w-4" /> Download {doneCount} result{doneCount === 1 ? "" : "s"} (ZIP)</Button>
          <p className="text-center text-[11px] text-muted-foreground">{appName}: results stay in your browser until you download them.</p>
        </div>
      )}
    </div>
  );
}
