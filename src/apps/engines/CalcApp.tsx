import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, ExternalLink, FileText, Loader2, MessageCircle, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useToolPricing } from "@/hooks/useToolPricing";
import { cn } from "@/lib/utils";
import { AppShell } from "../shell/AppShell";
import { OutputPanel } from "../shell/OutputPanel";
import { useWorkspace } from "../lib/workspace";
import { docFromCalc } from "../output/buildDoc";
import { usePreparedPdf } from "../output/usePreparedPdf";
import { saveFile } from "../output/save";
import { FieldInput } from "../shell/Fields";
import { StepLabel } from "../shell/StepLabel";
import { HistoryList, addHistory, type HistoryItem } from "../shell/HistoryList";
import { useAppStore, uid } from "../lib/store";
import { runApp, NeedsCredits, errorText } from "../lib/api";
import { downloadText } from "../lib/files";
import type { CalcDef, CalcOutput, Source } from "../types";

type Values = Record<string, string>;

const blank = (def: CalcDef): Values => Object.fromEntries(def.fields.map((f) => [f.key, f.default ?? ""]));

/** Plain-text copy of a result, for copy, WhatsApp and history. */
function summaryText(name: string, def: CalcDef, v: Values, out: CalcOutput) {
  const given = def.fields
    .filter((f) => (v[f.key] ?? "").trim())
    .map((f) => `${f.label}: ${v[f.key]}`)
    .join("\n");
  const res = out.results.map((r) => `${r.label}: ${r.value}`).join("\n");
  return `${name}\n\n${given}\n\n${res}${out.note ? `\n\n${out.note}` : ""}`;
}

const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/** Numbers in, answer out — worked out in the browser as you type. The AI only explains, on request. */
export default function CalcApp({ toolId, def }: { toolId: string; def: CalcDef }) {
  const { data: catalog = [] } = useToolsCatalog();
  const appName = catalog.find((t) => t.id === toolId)?.name ?? "Calculator";
  const { creditCost } = useToolPricing(toolId);
  const store = useAppStore<{ history: HistoryItem[]; savedAt?: number }>(toolId, { history: [] });
  const [values, setValues] = useState<Values>(() => ({ ...blank(def), ...def.sample }));
  const [dirty, setDirty] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [busy, setBusy] = useState(false);
  const [allRows, setAllRows] = useState(false);
  const [copied, setCopied] = useState(false);
  const activeId = useRef<string | null>(null);

  const out = useMemo(() => {
    try {
      return def.calc(values);
    } catch {
      return { error: "Check the numbers you entered." };
    }
  }, [def, values]);
  const ok = !("error" in out);

  // A new answer makes the old explanation stale.
  useEffect(() => setExplanation(""), [values]);

  // Saved to history by itself a moment after you stop typing (one entry per calculation you keep editing).
  useEffect(() => {
    if (!dirty || !ok) return;
    const t = setTimeout(() => {
      const main = out.results.find((r) => r.main) ?? out.results[0];
      const item: HistoryItem = {
        id: activeId.current ?? uid(),
        at: Date.now(),
        title: main ? `${main.label}: ${main.value}` : appName,
        output: summaryText(appName, def, values, out),
        inputs: values,
      };
      activeId.current = item.id;
      store.update((d) => ({ history: addHistory(d.history, item) }));
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, dirty, ok]);

  const set = (k: string, v: string) => {
    setDirty(true);
    setValues((p) => ({ ...p, [k]: v }));
  };

  const copy = async () => {
    if (!ok) return;
    try {
      await navigator.clipboard.writeText(summaryText(appName, def, values, out));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy was blocked by the browser.");
    }
  };

  const whatsapp = () => {
    if (!ok) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(summaryText(appName, def, values, out))}`, "_blank", "noopener");
  };

  const csv = () => {
    if (!ok || !out.table) return;
    const lines = [out.table.columns, ...out.table.rows].map((r) => r.map(csvCell).join(","));
    downloadText(lines.join("\n"), `${def.fileName}.csv`, "text/csv");
  };

  const explain = async () => {
    if (!ok) return;
    setBusy(true);
    try {
      const inputs: Record<string, string> = {};
      for (const f of def.fields) if ((values[f.key] ?? "").trim()) inputs[f.label] = values[f.key];
      for (const r of out.results) inputs[`Result — ${r.label}`] = r.value;
      if (out.note) inputs["Note shown with the result"] = out.note;
      if (out.table) inputs["Breakdown (first rows)"] = [out.table.columns.join(" | "), ...out.table.rows.slice(0, 12).map((r) => r.join(" | "))].join("\n");
      const text = await runApp<string>(toolId, { inputs, action: "generate" });
      setExplanation(text);
      requestAnimationFrame(() => document.getElementById(`${toolId}-explain`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const { profile } = useWorkspace();
  const statement = useMemo(
    () =>
      ok
        ? docFromCalc({ toolId, appName, fileName: def.fileName, profile, fields: def.fields, values, out, explanation })
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ok, out, explanation, appName, profile],
  );
  // The Statement PDF is made in the background once typing stops, so the button is instant.
  const statementPdf = usePreparedPdf(statement, { wait: 1200 });
  const savePdf = () => {
    if (statementPdf.state === "ready") void saveFile(statementPdf.pdf.blob, `${def.fileName}.pdf`, appName);
    else if (statementPdf.state === "error") toast.error("The PDF could not be made on this device.");
    else toast.info("Your PDF is nearly ready — try again in a moment.");
  };
  const rows = ok && out.table ? (allRows ? out.table.rows : out.table.rows.slice(0, 10)) : [];
  const splitTotal = ok && out.split ? out.split.reduce((a, s) => a + Math.max(0, s.value), 0) : 0;
  const main = ok ? out.results.find((r) => r.main) : undefined;
  const rest = ok ? out.results.filter((r) => r !== main) : [];

  return (
    <AppShell toolId={toolId} intro={def.intro} steps={def.steps} related={def.related} syncState={store.syncState}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-4">
          <form className="rounded-2xl border-2 border-ink bg-card p-4 shadow-block sm:p-5" onSubmit={(e) => e.preventDefault()}>
            <StepLabel n={2}>Enter your numbers</StepLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {def.fields.map((f) => (
                <FieldInput key={f.key} field={f} idPrefix={toolId} value={values[f.key]} onChange={(v) => set(f.key, String(v))} />
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  activeId.current = null;
                  setValues({ ...blank(def), ...def.sample });
                }}
              >
                <Wand2 className="h-3.5 w-3.5" /> Fill in an example
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  activeId.current = null;
                  setValues(blank(def));
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear
              </Button>
            </div>
          </form>
          {def.sources && def.sources.length > 0 && <Sources list={def.sources} />}
          <HistoryList
            items={store.data.history ?? []}
            onOpen={(h) => {
              activeId.current = h.id;
              if (h.inputs) setValues({ ...blank(def), ...h.inputs });
            }}
            onDelete={(id) => store.update((d) => ({ history: (d.history ?? []).filter((h) => h.id !== id) }))}
          />
        </div>

        <div className="min-w-0 space-y-4">
          <section className="rounded-2xl border-2 border-ink bg-card p-4 shadow-block sm:p-5" aria-live="polite">
            <StepLabel n={3}>Your answer</StepLabel>
            {!ok ? (
              <p className="rounded-xl border-2 border-dashed border-ink/40 bg-sand/60 p-6 text-center text-sm text-muted-foreground">{out.error}</p>
            ) : (
              <>
                {main && (
                  <div className="rounded-xl border-2 border-ink bg-sun/40 p-4">
                    <p className="text-sm font-semibold text-ink/80">{main.label}</p>
                    <p className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{main.value}</p>
                  </div>
                )}
                {rest.length > 0 && (
                  <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {rest.map((r) => (
                      <div key={r.label} className="rounded-xl border-2 border-ink/20 bg-background px-3 py-2">
                        <dt className="text-xs font-semibold text-muted-foreground">{r.label}</dt>
                        <dd className={cn("text-lg font-bold", r.tone === "good" && "text-emerald-700 dark:text-emerald-400", r.tone === "warn" && "text-amber-700 dark:text-amber-400", r.tone === "bad" && "text-destructive")}>
                          {r.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {out.split && splitTotal > 0 && (
                  <div className="mt-4">
                    <div className="flex h-4 overflow-hidden rounded-full border-2 border-ink" role="img" aria-label={out.split.map((s) => `${s.label} ${Math.round((s.value / splitTotal) * 100)}%`).join(", ")}>
                      {out.split.map((s, i) => (
                        <div key={s.label} className={i === 0 ? "bg-teal" : i === 1 ? "bg-sun" : "bg-coral"} style={{ width: `${(Math.max(0, s.value) / splitTotal) * 100}%` }} />
                      ))}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      {out.split.map((s, i) => (
                        <span key={s.label} className="flex items-center gap-1.5">
                          <span className={cn("h-2.5 w-2.5 rounded-full border border-ink", i === 0 ? "bg-teal" : i === 1 ? "bg-sun" : "bg-coral")} />
                          {s.label} · {Math.round((Math.max(0, s.value) / splitTotal) * 100)}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {out.note && <p className="mt-3 text-sm text-muted-foreground">{out.note}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => void copy()}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={savePdf}>
                    {statementPdf.state === "making" && !statementPdf.previous ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} PDF
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={whatsapp}>
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </Button>
                  {out.table && (
                    <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={csv}>
                      <Download className="h-3.5 w-3.5" /> Table (CSV for Excel)
                    </Button>
                  )}
                  <Button type="button" size="sm" className="gap-1.5" onClick={() => void explain()} disabled={busy}>
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Explain in plain words · {creditCost} credit{creditCost === 1 ? "" : "s"}
                  </Button>
                </div>
              </>
            )}
          </section>

          {ok && out.table && out.table.rows.length > 0 && (
            <section className="rounded-2xl border-2 border-ink bg-card p-4 sm:p-5">
              <h2 className="mb-3 text-[15px] font-bold">Breakdown</h2>
              <div className="overflow-x-auto rounded-xl border-2 border-ink">
                <table className="w-full min-w-[420px] text-sm">
                  <thead className="border-b-2 border-ink bg-sand text-left text-xs">
                    <tr>
                      {out.table.columns.map((c) => (
                        <th key={c} className="px-3 py-2 font-bold">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-ink/15">
                        {r.map((cell, j) => (
                          <td key={j} className={cn("px-3 py-1.5", j > 0 && "tabular-nums")}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {out.table.rows.length > 10 && (
                <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setAllRows((s) => !s)}>
                  {allRows ? "Show fewer" : `Show all ${out.table.rows.length} rows`}
                </Button>
              )}
            </section>
          )}

          {explanation && (
            <div id={`${toolId}-explain`} className="scroll-mt-24">
              <OutputPanel toolId={toolId} text={explanation} title={appName} fileName={`${def.fileName}-explained`} sendTo={def.related} pdfDoc={statement ?? undefined} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export function Sources({ list }: { list: Source[] }) {
  return (
    <section className="rounded-2xl border-2 border-ink/20 bg-card p-4 text-sm">
      <h2 className="font-bold">Where the rules come from</h2>
      <ul className="mt-1.5 space-y-1">
        {list.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 font-medium underline underline-offset-2">
              {s.label} <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            </a>
            <span className="text-xs text-muted-foreground"> · checked {s.checked}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
