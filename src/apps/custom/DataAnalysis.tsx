import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FileUp, Loader2, Sparkles, Table2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "../shell/AppShell";
import { OutputPanel } from "../shell/OutputPanel";
import { useRun } from "../lib/api";
import { parseCsv } from "../lib/files";
import { takeHandoff } from "../lib/handoff";
import { APPS } from "../registry";

const toNum = (v: string) => {
  const n = parseFloat(v.replace(/[₹,%\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};

export default function DataAnalysis({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const [grid, setGrid] = useState<string[][]>([]);
  const [name, setName] = useState("");
  const [paste, setPaste] = useState("");
  const [x, setX] = useState(0);
  const [y, setY] = useState(-1);
  const [kind, setKind] = useState<"bar" | "line">("bar");
  const [question, setQuestion] = useState("");
  const [report, setReport] = useState("");
  const { busy, run } = useRun(toolId);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = (text: string, n: string) => {
    const g = parseCsv(text);
    if (g.length < 2) return toast.error("Need a header row and at least one data row.");
    setGrid(g);
    setName(n);
    setReport("");
  };

  useEffect(() => {
    const h = takeHandoff(toolId);
    if (h) setPaste(h.text);
  }, [toolId]);

  const header = grid[0] ?? [];
  const rows = grid.slice(1);
  const stats = useMemo(
    () =>
      header.map((h, c) => {
        const vals = rows.map((r) => r[c] ?? "");
        const nums = vals.map(toNum).filter((v): v is number => v !== null);
        const numeric = nums.length >= Math.max(1, vals.filter(Boolean).length * 0.8);
        const filled = vals.filter((v) => v.trim()).length;
        if (numeric && nums.length) {
          const sum = nums.reduce((a, b) => a + b, 0);
          return { h, numeric, filled, sum, mean: sum / nums.length, min: Math.min(...nums), max: Math.max(...nums), unique: new Set(vals).size };
        }
        const counts: Record<string, number> = {};
        vals.forEach((v) => v && (counts[v] = (counts[v] ?? 0) + 1));
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
        return { h, numeric: false, filled, unique: Object.keys(counts).length, top };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grid],
  );

  const yCol = y >= 0 ? y : stats.findIndex((s) => s.numeric);
  const chartData = useMemo(() => {
    if (yCol < 0) return [];
    const agg = new Map<string, number>();
    rows.forEach((r) => {
      const k = (r[x] ?? "").slice(0, 30) || "—";
      agg.set(k, (agg.get(k) ?? 0) + (toNum(r[yCol] ?? "") ?? 0));
    });
    return [...agg.entries()].slice(0, 60).map(([k, v]) => ({ k, v: Math.round(v * 100) / 100 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, x, yCol]);

  const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const analyse = async () => {
    const summary = stats
      .map((s) => ("mean" in s && s.numeric ? `${s.h}: numeric, ${s.filled} values, sum ${fmt(s.sum!)}, mean ${fmt(s.mean!)}, min ${fmt(s.min!)}, max ${fmt(s.max!)}` : `${s.h}: text, ${s.unique} distinct${"top" in s && s.top?.length ? `, most common ${s.top.map(([v, c]) => `${v} (${c})`).join(", ")}` : ""}`))
      .join("\n");
    const sample = [header, ...rows.slice(0, 40)].map((r) => r.join(", ")).join("\n");
    const out = await run<string>({ inputs: { Dataset: name, Rows: String(rows.length), Columns: String(header.length), Question: question }, context: `Column summary:\n${summary}\n\nFirst rows:\n${sample}`.slice(0, 25000) });
    if (out) setReport(out);
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} wide steps={["Add a CSV", "Explore charts", "Get the AI analysis"]}>
      {!grid.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-6 text-center hover:border-primary/50">
            <FileUp className="h-8 w-8 text-primary" />
            <span className="mt-2 font-medium">Upload a CSV file</span>
            <span className="mt-1 text-xs text-muted-foreground">Excel / Google Sheets: File ▸ Download ▸ CSV. Read in your browser.</span>
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) load(await f.text(), f.name); e.target.value = ""; }} />
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <Textarea rows={7} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"…or paste CSV here\nMonth,Sales,Expenses\nJan,120000,80000"} aria-label="Paste CSV" />
            <Button className="mt-2 w-full" variant="outline" onClick={() => load(paste, "Pasted data")} disabled={!paste.trim()}><Table2 className="mr-2 h-4 w-4" /> Use pasted data</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm"><strong>{name}</strong> · {rows.length} rows · {header.length} columns</p>
            <Button size="sm" variant="ghost" onClick={() => { setGrid([]); setReport(""); }}>Use other data</Button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.slice(0, 8).map((s) => (
              <div key={s.h} className="rounded-2xl border border-border/60 bg-card p-3">
                <p className="truncate text-xs font-semibold">{s.h}</p>
                {s.numeric && "mean" in s ? (
                  <p className="mt-1 text-xs text-muted-foreground">Sum <span className="font-semibold text-foreground">{fmt(s.sum!)}</span><br />Avg {fmt(s.mean!)} · {fmt(s.min!)}–{fmt(s.max!)}</p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">{s.unique} distinct · {s.filled} filled</p>
                )}
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <label className="flex items-center gap-1">Group by <select className="h-8 rounded-md border border-input bg-background px-2" value={x} onChange={(e) => setX(+e.target.value)}>{header.map((h, i) => <option key={i} value={i}>{h}</option>)}</select></label>
              <label className="flex items-center gap-1">Sum of <select className="h-8 rounded-md border border-input bg-background px-2" value={yCol} onChange={(e) => setY(+e.target.value)}>{stats.map((s, i) => s.numeric && <option key={i} value={i}>{s.h}</option>)}</select></label>
              <div className="ml-auto flex gap-1">{(["bar", "line"] as const).map((k) => <Button key={k} size="sm" variant={kind === k ? "secondary" : "ghost"} onClick={() => setKind(k)} className="capitalize">{k}</Button>)}</div>
            </div>
            {chartData.length ? (
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  {kind === "bar" ? (
                    <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} /><XAxis dataKey="k" tick={{ fontSize: 11 }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v) => fmt(v)} /><Tooltip formatter={(v: number) => fmt(v)} /><Bar dataKey="v" name={header[yCol]} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart>
                  ) : (
                    <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} /><XAxis dataKey="k" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v) => fmt(v)} /><Tooltip formatter={(v: number) => fmt(v)} /><Line dataKey="v" name={header[yCol]} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} /></LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : <p className="py-10 text-center text-sm text-muted-foreground">No numeric column to chart.</p>}
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
            <table className="w-full min-w-[600px] text-xs">
              <thead className="bg-muted/40 text-left"><tr>{header.map((h, i) => <th key={i} className="px-2 py-1.5">{h}</th>)}</tr></thead>
              <tbody>{rows.slice(0, 50).map((r, i) => <tr key={i} className="border-t border-border/40">{header.map((_, c) => <td key={c} className="px-2 py-1">{r[c]}</td>)}</tr>)}</tbody>
            </table>
            {rows.length > 50 && <p className="p-2 text-center text-xs text-muted-foreground">Showing 50 of {rows.length} rows</p>}
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
            <div className="space-y-2 rounded-2xl border border-border/60 bg-card p-4">
              <Textarea rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Optional: what do you want to know? e.g. Which products are losing money?" aria-label="Question" />
              <Button className="w-full gap-2" onClick={analyse} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Analyse with AI</Button>
              <p className="text-[11px] text-muted-foreground">The AI gets the column summary and the first 40 rows — not your whole file.</p>
            </div>
            {report ? <OutputPanel toolId={toolId} text={report} title="Data analysis" fileName="data-analysis" sendTo={def.related} /> : <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-border/70 text-sm text-muted-foreground">AI findings appear here.</div>}
          </div>
        </div>
      )}
    </AppShell>
  );
}
