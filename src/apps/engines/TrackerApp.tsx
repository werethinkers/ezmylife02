import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, Download, FileUp, Loader2, Pencil, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { AppShell } from "../shell/AppShell";
import { OutputPanel } from "../shell/OutputPanel";
import { FieldInput, serializeValues } from "../shell/Fields";
import { useAppStore, uid } from "../lib/store";
import { runApp, NeedsCredits, errorText } from "../lib/api";
import { downloadText, parseCsv, toCsv } from "../lib/files";
import { takeHandoff } from "../lib/handoff";
import type { FormValues, TrackerColumn, TrackerDef, TrackerRow } from "../types";
import { cn } from "@/lib/utils";

interface TrackerData {
  rows: TrackerRow[];
  settings: FormValues;
  insights?: string;
  savedAt?: number;
}

const today = () => new Date().toISOString().slice(0, 10);

function cellText(col: TrackerColumn, row: TrackerRow): string {
  if (col.computed) {
    const v = col.computed(row);
    return typeof v === "number" ? (col.type === "money" ? `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : v.toLocaleString("en-IN", { maximumFractionDigits: 2 })) : v;
  }
  const v = row[col.key] ?? "";
  if (col.type === "money" && v !== "") return `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  if (col.type === "rating" && v) return "★".repeat(Number(v)) + "☆".repeat(Math.max(0, 5 - Number(v)));
  if (col.type === "check") return v === "yes" ? "Yes" : "No";
  if (col.type === "date" && v) return new Date(v + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
  return v;
}

/** Logbook-style app: add, edit, import/export rows, live totals and AI insights on the data. */
export default function TrackerApp({ toolId, def }: { toolId: string; def: TrackerDef }) {
  const { data: catalog = [] } = useToolsCatalog();
  const appName = catalog.find((t) => t.id === toolId)?.name ?? "Tracker";
  const store = useAppStore<TrackerData>(toolId, { rows: [], settings: {} });
  const rows = store.data.rows ?? [];
  const inputCols = def.columns.filter((c) => !c.computed);
  const blank = (): Record<string, string> =>
    Object.fromEntries(inputCols.map((c) => [c.key, c.type === "date" ? today() : c.type === "select" ? c.options?.[0] ?? "" : c.type === "check" ? "no" : ""]));
  const [draft, setDraft] = useState<Record<string, string>>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [busy, setBusy] = useState<"ai" | "refine" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Rows sent from another app (CSV text) are offered as an import.
  useEffect(() => {
    const h = takeHandoff(toolId);
    if (h) importCsvText(h.text, `from ${h.fromName}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId]);

  const setRows = (next: TrackerRow[]) => store.update({ rows: next });

  const save = () => {
    const missing = inputCols.filter((c) => c.required && !(draft[c.key] ?? "").trim());
    if (missing.length) {
      toast.error(`Please fill: ${missing.map((c) => c.label).join(", ")}`);
      return;
    }
    if (editingId) setRows(rows.map((r) => (r.id === editingId ? { ...r, ...draft } : r)));
    else setRows([{ id: uid(), ...draft } as TrackerRow, ...rows]);
    setDraft(blank());
    setEditingId(null);
  };

  const importCsvText = (text: string, label = "file") => {
    const grid = parseCsv(text);
    if (grid.length < 2) {
      toast.error("No rows found. The first line should be the column names.");
      return;
    }
    const header = grid[0].map((h) => h.trim().toLowerCase());
    const idx = (c: TrackerColumn) => header.findIndex((h) => h === c.label.toLowerCase() || h === c.key.toLowerCase());
    const map = inputCols.map((c) => [c, idx(c)] as const);
    if (map.every(([, i]) => i < 0)) {
      toast.error(`Column names didn't match. Use: ${inputCols.map((c) => c.label).join(", ")}`);
      return;
    }
    const added = grid.slice(1).map((line) => {
      const r: TrackerRow = { id: uid() } as TrackerRow;
      for (const [c, i] of map) r[c.key] = i >= 0 ? (line[i] ?? "").trim() : "";
      return r;
    });
    setRows([...added, ...rows]);
    toast.success(`Imported ${added.length} ${def.itemName}${added.length === 1 ? "" : "s"} ${label}`);
  };

  const exportCsv = () => {
    const cols = def.columns.map((c) => ({ key: c.key, label: c.label }));
    const data = rows.map((r) => Object.fromEntries(def.columns.map((c) => [c.key, c.computed ? c.computed(r) : r[c.key] ?? ""])));
    downloadText(toCsv(data, cols), `${def.fileName}-${today()}.csv`, "text/csv");
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q ? rows.filter((r) => def.columns.some((c) => cellText(c, r).toLowerCase().includes(q))) : rows;
    if (sort) {
      const col = def.columns.find((c) => c.key === sort.key);
      if (col) {
        const val = (r: TrackerRow) => {
          const v = col.computed ? col.computed(r) : r[col.key];
          const n = typeof v === "number" ? v : parseFloat(String(v));
          return ["number", "money", "rating"].includes(col.type) && Number.isFinite(n) ? n : String(v ?? "").toLowerCase();
        };
        list = [...list].sort((a, b) => (val(a) > val(b) ? sort.dir : val(a) < val(b) ? -sort.dir : 0));
      }
    }
    return list;
  }, [rows, query, sort, def.columns]);

  const summary = def.summary?.(rows) ?? [];

  const insights = async (refineWith?: string) => {
    if (!rows.length) {
      toast.error(`Add a few ${def.itemName}s first.`);
      return;
    }
    setBusy(refineWith ? "refine" : "ai");
    try {
      const cols = def.columns.map((c) => ({ key: c.key, label: c.label }));
      const data = rows.slice(0, 400).map((r) => Object.fromEntries(def.columns.map((c) => [c.key, c.computed ? c.computed(r) : r[c.key] ?? ""])));
      const context = `Today: ${today()}\nRows: ${rows.length}${rows.length > 400 ? " (first 400 shown)" : ""}\n\n${toCsv(data, cols)}`.slice(0, 28000);
      const inputs = { ...serializeValues(def.settings ?? [], store.data.settings ?? {}), ...Object.fromEntries(summary.map((s) => [s.label, s.value])) };
      const text = await runApp<string>(toolId, {
        inputs,
        context,
        ...(refineWith ? { action: "refine", previous: store.data.insights, instruction: refineWith } : { action: "generate" }),
      });
      store.update({ insights: text });
    } catch (e) {
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const toggleSort = (key: string) => setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }));

  return (
    <AppShell toolId={toolId} intro={def.intro} steps={def.steps} related={def.related} syncState={store.syncState} wide>
      {summary.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {summary.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border/60 bg-card p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p
                className={cn(
                  "mt-1 text-lg font-bold tabular-nums",
                  s.tone === "bad" && "text-destructive",
                  s.tone === "warn" && "text-amber-600 dark:text-amber-400",
                  s.tone === "good" && "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Entry form */}
      <form
        className="rounded-2xl border border-border/60 bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <p className="mb-3 text-sm font-semibold">{editingId ? `Edit ${def.itemName}` : `Add ${def.itemName}`}</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {inputCols.map((c) => (
            <div key={c.key} className="space-y-1">
              <Label htmlFor={`${toolId}-${c.key}`} className="text-xs">
                {c.label}
                {c.required && <span className="text-destructive">*</span>}
              </Label>
              {c.type === "select" || c.type === "rating" ? (
                <select
                  id={`${toolId}-${c.key}`}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={draft[c.key] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [c.key]: e.target.value }))}
                >
                  {c.type === "rating" && <option value="">—</option>}
                  {(c.type === "rating" ? ["5", "4", "3", "2", "1"] : c.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {c.type === "rating" ? `${o} ★` : o}
                    </option>
                  ))}
                </select>
              ) : c.type === "check" ? (
                <label className="flex h-10 items-center gap-2 text-sm">
                  <Checkbox
                    id={`${toolId}-${c.key}`}
                    checked={draft[c.key] === "yes"}
                    onCheckedChange={(v) => setDraft((d) => ({ ...d, [c.key]: v ? "yes" : "no" }))}
                  />
                  Yes
                </label>
              ) : (
                <Input
                  id={`${toolId}-${c.key}`}
                  type={c.type === "number" || c.type === "money" ? "number" : c.type === "date" ? "date" : c.type === "time" ? "time" : "text"}
                  inputMode={c.type === "number" || c.type === "money" ? "decimal" : undefined}
                  step="any"
                  value={draft[c.key] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [c.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="submit" size="sm" className="gap-1.5">
            {editingId ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {editingId ? "Save changes" : `Add ${def.itemName}`}
          </Button>
          {editingId && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingId(null);
                setDraft(blank());
              }}
            >
              <X className="mr-1 h-3.5 w-3.5" /> Cancel
            </Button>
          )}
        </div>
      </form>

      {/* Toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="h-9 pl-9" aria-label="Search rows" />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) importCsvText(await f.text());
            e.target.value = "";
          }}
        />
        <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={() => fileRef.current?.click()}>
          <FileUp className="h-3.5 w-3.5" /> Import CSV
        </Button>
        <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={exportCsv} disabled={!rows.length}>
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
        {!rows.length && (
          <Button size="sm" variant="ghost" className="h-9" onClick={() => setRows(def.sample.map((s) => ({ id: uid(), ...s }) as TrackerRow))}>
            Load sample data
          </Button>
        )}
        {rows.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-9 text-destructive">
                Clear all
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all {rows.length} rows?</AlertDialogTitle>
                <AlertDialogDescription>Export a CSV first if you may need them. This can't be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep them</AlertDialogCancel>
                <AlertDialogAction onClick={() => setRows([])}>Delete all</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Table */}
      <div className="mt-3 overflow-x-auto rounded-2xl border border-border/60 bg-card">
        {shown.length ? (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                {def.columns.map((c) => (
                  <th key={c.key} className={cn("px-3 py-2 font-medium", c.minor && "hidden md:table-cell")}>
                    <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort(c.key)}>
                      {c.label}
                      <ArrowDownUp className={cn("h-3 w-3", sort?.key === c.key ? "opacity-100" : "opacity-30")} />
                    </button>
                  </th>
                ))}
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const tone = def.rowTone?.(r);
                return (
                  <tr key={r.id} className={cn("border-t border-border/50", tone === "bad" && "bg-destructive/5", tone === "warn" && "bg-amber-500/5")}>
                    {def.columns.map((c) => (
                      <td key={c.key} className={cn("px-3 py-2 align-top", c.minor && "hidden md:table-cell", ["number", "money"].includes(c.type) && "tabular-nums")}>
                        {c.type === "check" && !c.computed ? (
                          <Checkbox
                            checked={r[c.key] === "yes"}
                            onCheckedChange={(v) => setRows(rows.map((x) => (x.id === r.id ? { ...x, [c.key]: v ? "yes" : "no" } : x)))}
                            aria-label={c.label}
                          />
                        ) : (
                          cellText(c, r)
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        aria-label="Edit"
                        onClick={() => {
                          setEditingId(r.id);
                          setDraft(Object.fromEntries(inputCols.map((c) => [c.key, r[c.key] ?? ""])));
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Delete" onClick={() => setRows(rows.filter((x) => x.id !== r.id))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {rows.length ? "No rows match your search." : `No ${def.itemName}s yet. Add one above, import a CSV, or load sample data to try it.`}
          </p>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {rows.length} {def.itemName}
        {rows.length === 1 ? "" : "s"} · each use (30 minutes) is one charge at this app's price; AI reports are charged per report.
      </p>

      {/* AI insights */}
      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">{def.aiLabel}</p>
          <p className="text-xs text-muted-foreground">The AI reads your rows (and the settings below) and writes a short, practical report.</p>
          {def.settings && def.settings.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {def.settings.map((f) => (
                <FieldInput
                  key={f.key}
                  field={f}
                  idPrefix={`${toolId}-set`}
                  value={(store.data.settings ?? {})[f.key]}
                  onChange={(v) => store.update((d) => ({ settings: { ...(d.settings ?? {}), [f.key]: v } }))}
                />
              ))}
            </div>
          )}
          <Button className="w-full gap-2" onClick={() => insights()} disabled={!!busy || !rows.length}>
            {busy === "ai" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {def.aiLabel}
          </Button>
        </div>
        <div className="min-w-0">
          {busy === "ai" ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-border/60 bg-card text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reading your data…
            </div>
          ) : store.data.insights ? (
            <OutputPanel
              toolId={toolId}
              text={store.data.insights}
              title={`${appName} — AI report`}
              fileName={`${def.fileName}-report-${today()}`}
              onRefine={(i) => insights(i)}
              refining={busy === "refine"}
              sendTo={def.related}
            />
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              Your AI report will appear here.
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
