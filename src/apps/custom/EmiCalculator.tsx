import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, Download, FileText, Loader2, MessageCircle, RotateCcw, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";
import { useToolPricing } from "@/hooks/useToolPricing";
import { useModernTheme } from "@/components/modern/theme";
import { AppIcon } from "@/components/store/AppIcon";
import { CreditCostBadge } from "@/components/tools/CreditCostBadge";
import { resolveToolMedia } from "@/lib/toolMedia";
import { cn } from "@/lib/utils";
import { AmbientGlow, CONTROL, LABEL, SyncChip, UNBOUNDED, WorksWellWith, initialsOf } from "../flagship/studioUi";
import { useWorkspace } from "../lib/workspace";
import { docFromCalc } from "../output/buildDoc";
import { usePreparedPdf } from "../output/usePreparedPdf";
import { saveFile } from "../output/save";
import { OutputPanel } from "../shell/OutputPanel";
import { num } from "../shell/Fields";
import { HistoryList, addHistory, type HistoryItem } from "../shell/HistoryList";
import { useAppStore, uid } from "../lib/store";
import { runApp, NeedsCredits, errorText } from "../lib/api";
import { downloadText } from "../lib/files";
import type { CalcOutput } from "../types";
import { emi } from "../defs/calculators";

/*
 * EMI Calculator's own screen — the refined neo-brutalist look (ambient glow, dark gradient
 * "Your answer" card, homepage-style sliders, visual-first cross-sell) instead of the generic
 * CalcApp engine every other calculator still uses. All the maths (`emi.calc`) and the field
 * list, sample and related apps come from src/apps/defs/calculators.ts — only this file's own
 * layout and styling are new.
 */

type Values = Record<string, string>;

const blank = (): Values => Object.fromEntries(emi.fields.map((f) => [f.key, f.default ?? ""]));

function summaryText(name: string, v: Values, out: CalcOutput) {
  const given = emi.fields
    .filter((f) => (v[f.key] ?? "").trim())
    .map((f) => `${f.label}: ${v[f.key]}`)
    .join("\n");
  const res = out.results.map((r) => `${r.label}: ${r.value}`).join("\n");
  return `${name}\n\n${given}\n\n${res}${out.note ? `\n\n${out.note}` : ""}`;
}

const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

const AMOUNT_CHIPS = [
  { label: "₹5L", value: "500000" },
  { label: "₹10L", value: "1000000" },
  { label: "₹25L", value: "2500000" },
  { label: "₹50L", value: "5000000" },
];

const PILL = "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/20";

function NumberWithSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
}) {
  const n = num(value);
  const sliderValue = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="mt-1.5 flex items-center gap-2">
        {prefix && <span className="text-sm font-semibold text-black/40 dark:text-white/40">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn("h-10 w-full px-3 text-sm font-semibold text-[#111111] outline-none dark:text-white", CONTROL)}
        />
        {suffix && <span className="text-sm font-semibold text-black/40 dark:text-white/40">{suffix}</span>}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-black/10 accent-[#111111] dark:bg-white/15 dark:accent-[#F472D0]"
      />
    </div>
  );
}

function CrossSellCard({ tool }: { tool: CatalogTool }) {
  const media = useMemo(() => resolveToolMedia(tool.id, tool.category, tool), [tool]);
  const [imgFailed, setImgFailed] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);
  const hasPreview = !!media.previewImageUrl && !imgFailed;
  return (
    <Link
      to={`/tool/${tool.id}`}
      className="group relative flex min-h-[200px] w-[85%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl text-white transition hover:-translate-y-0.5 sm:w-auto sm:shrink"
    >
      <div className="absolute inset-0">
        {hasPreview ? (
          <img
            src={media.previewImageUrl!}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
            className={cn("h-full w-full", media.previewFit === "contain" ? "bg-[#111111] object-contain p-2" : "object-cover")}
          />
        ) : (
          <>
            <div className="h-full w-full bg-gradient-to-br from-[#18181B] via-[#111111] to-[#1F1523]" />
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#F472D0]/25 blur-2xl" aria-hidden />
          </>
        )}
        {hasPreview && <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" aria-hidden />}
      </div>
      <div className="relative flex items-center justify-between p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10 text-xs font-bold">
          {media.iconUrl && !iconFailed ? (
            <img src={media.iconUrl} alt="" loading="lazy" onError={() => setIconFailed(true)} className="h-full w-full object-cover" />
          ) : (
            initialsOf(tool.name)
          )}
        </span>
        <span className="truncate rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">{tool.category}</span>
      </div>
      <div className="relative p-4 pt-0">
        <p className="font-bold">{tool.name}</p>
        <p className="mt-1 line-clamp-2 text-xs text-white/70">{tool.description}</p>
        <span className="relative mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#111111]">Try it →</span>
      </div>
    </Link>
  );
}

export default function EmiCalculator({ toolId }: { toolId: string }) {
  const { data: catalog = [] } = useToolsCatalog();
  const tool = catalog.find((t) => t.id === toolId);
  const appName = tool?.name ?? "EMI Calculator";
  const { dark } = useModernTheme();
  const { creditCost } = useToolPricing(toolId);
  const store = useAppStore<{ history: HistoryItem[]; savedAt?: number }>(toolId, { history: [] });
  const [values, setValues] = useState<Values>(() => ({ ...blank(), ...emi.sample }));
  const [dirty, setDirty] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [busy, setBusy] = useState(false);
  const [allRows, setAllRows] = useState(false);
  const [copied, setCopied] = useState(false);
  const activeId = useRef<string | null>(null);

  const out = useMemo(() => {
    try {
      return emi.calc(values);
    } catch {
      return { error: "Check the numbers you entered." };
    }
  }, [values]);
  const ok = !("error" in out);

  useEffect(() => setExplanation(""), [values]);

  useEffect(() => {
    if (!dirty || !ok) return;
    const t = setTimeout(() => {
      const main = out.results.find((r) => r.main) ?? out.results[0];
      const item: HistoryItem = {
        id: activeId.current ?? uid(),
        at: Date.now(),
        title: main ? `${main.label}: ${main.value}` : appName,
        output: summaryText(appName, values, out),
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
      await navigator.clipboard.writeText(summaryText(appName, values, out));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy was blocked by the browser.");
    }
  };

  const whatsapp = () => {
    if (!ok) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(summaryText(appName, values, out))}`, "_blank", "noopener");
  };

  const csv = () => {
    if (!ok || !out.table) return;
    const lines = [out.table.columns, ...out.table.rows].map((r) => r.map(csvCell).join(","));
    downloadText(lines.join("\n"), `${emi.fileName}.csv`, "text/csv");
  };

  const explain = async () => {
    if (!ok) return;
    setBusy(true);
    try {
      const inputs: Record<string, string> = {};
      for (const f of emi.fields) if ((values[f.key] ?? "").trim()) inputs[f.label] = values[f.key];
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
    () => (ok ? docFromCalc({ toolId, appName, fileName: emi.fileName, profile, fields: emi.fields, values, out, explanation }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ok, out, explanation, appName, profile],
  );
  const statementPdf = usePreparedPdf(statement, { wait: 1200 });
  const savePdf = () => {
    if (statementPdf.state === "ready") void saveFile(statementPdf.pdf.blob, `${emi.fileName}.pdf`, appName);
    else if (statementPdf.state === "error") toast.error("The PDF could not be made on this device.");
    else toast.info("Your PDF is nearly ready — try again in a moment.");
  };

  const rows = ok && out.table ? (allRows ? out.table.rows : out.table.rows.slice(0, 10)) : [];
  const splitTotal = ok && out.split ? out.split.reduce((a, s) => a + Math.max(0, s.value), 0) : 0;
  const main = ok ? out.results.find((r) => r.main) : undefined;
  const rest = ok ? out.results.filter((r) => r !== main) : [];
  const tenureMax = values.unit === "Months" ? 360 : 30;

  return (
    <div className={cn("ez-modern", dark && "dark")}>
      <div className="relative overflow-hidden bg-[#FAF7F2] dark:bg-[#0D0D0F]">
        <AmbientGlow />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Hero */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <AppIcon toolId={toolId} category={tool?.category} name={appName} size="sm" />
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-[#111111] dark:text-white sm:text-3xl" style={UNBOUNDED}>
                  {appName}
                </h1>
                <p className="mt-1.5 max-w-2xl text-[16px] text-black/60 dark:text-white/60">{emi.intro}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <CreditCostBadge toolId={toolId} className="!border-[1.5px] !border-[#111111] !bg-[#C8E967] dark:!border-white/70" />
              <SyncChip state={store.syncState} />
            </div>
          </header>

          {emi.steps && emi.steps.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ol aria-label="How to use it" className="flex snap-x gap-2 overflow-x-auto pb-1 text-[13px] font-semibold text-[#111111] no-scrollbar dark:text-white">
                {emi.steps.map((s, i) => (
                  <li key={s} className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 dark:border-white/15 dark:bg-[#16161A]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FACC15] text-[11px] font-bold text-[#111111]">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-black/50 dark:text-white/50">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Credits only when it works
              </span>
            </div>
          )}

          {/* Workspace */}
          <div className="mt-6 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-4 lg:col-span-5">
              <div className="flex h-full flex-col justify-between rounded-2xl border-[1.5px] border-[#111111] bg-white p-6 shadow-[4px_4px_0_#111111] dark:border-white/20 dark:bg-[#16161A] dark:shadow-[4px_4px_0_rgba(255,255,255,0.12)]">
                <div>
                  <p className="text-[15px] font-bold text-[#111111] dark:text-white" style={UNBOUNDED}>
                    Enter your numbers
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {AMOUNT_CHIPS.map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => set("amount", c.value)}
                        className="rounded-full border border-black/10 bg-[#F3F4F6] px-3 py-1.5 text-xs font-semibold text-[#111111] transition hover:border-[#111111] dark:border-white/15 dark:bg-[#1F1F24] dark:text-white dark:hover:border-white"
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 space-y-5">
                    <NumberWithSlider label="Loan amount (₹)" value={values.amount} onChange={(v) => set("amount", v)} min={50000} max={10000000} step={10000} prefix="₹" />
                    <NumberWithSlider label="Interest rate (% a year)" value={values.rate} onChange={(v) => set("rate", v)} min={1} max={20} step={0.1} suffix="%" />
                    <div className="grid grid-cols-2 gap-3">
                      <NumberWithSlider label="Tenure" value={values.tenure} onChange={(v) => set("tenure", v)} min={1} max={tenureMax} step={1} />
                      <div>
                        <label className={LABEL}>Tenure in</label>
                        <select
                          value={values.unit || "Years"}
                          onChange={(e) => set("unit", e.target.value)}
                          className={cn("mt-1.5 h-10 w-full px-3 text-sm font-semibold text-[#111111] outline-none dark:text-white", CONTROL)}
                        >
                          <option>Years</option>
                          <option>Months</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 rounded-full text-[#111111] hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                    onClick={() => {
                      activeId.current = null;
                      setValues({ ...blank(), ...emi.sample });
                    }}
                  >
                    <Wand2 className="h-3.5 w-3.5" /> Fill in an example
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 rounded-full text-[#111111] hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                    onClick={() => {
                      activeId.current = null;
                      setValues(blank());
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Clear
                  </Button>
                </div>
              </div>
              <HistoryList
                items={store.data.history ?? []}
                onOpen={(h) => {
                  activeId.current = h.id;
                  if (h.inputs) setValues({ ...blank(), ...h.inputs });
                }}
                onDelete={(id) => store.update((d) => ({ history: (d.history ?? []).filter((h) => h.id !== id) }))}
              />
            </div>

            <div className="min-w-0 lg:col-span-7" aria-live="polite">
              <div className="flex h-full flex-col justify-between rounded-2xl bg-gradient-to-br from-[#18181B] via-[#111111] to-[#1F1523] p-6 text-white">
                <div>
                  <p className="text-[15px] font-bold" style={UNBOUNDED}>
                    Your answer
                  </p>
                  {!ok ? (
                    <p className="mt-4 rounded-xl border border-white/15 bg-white/5 p-6 text-center text-sm text-white/60">{out.error}</p>
                  ) : (
                    <>
                      {main && (
                        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs font-semibold text-white/60">{main.label}</p>
                          <div className="mt-1 flex flex-wrap items-baseline gap-2">
                            <p className="text-3xl font-extrabold tracking-tight text-[#FACC15] sm:text-4xl" style={UNBOUNDED}>
                              {main.value}
                            </p>
                            <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">Reducing balance</span>
                          </div>
                        </div>
                      )}
                      {rest.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {rest.map((r) => (
                            <div key={r.label} className="rounded-xl border border-white/10 bg-white/[0.06] p-3.5">
                              <p className="text-[11px] font-semibold text-white/50">{r.label}</p>
                              <p className="mt-1 text-base font-bold tabular-nums">{r.value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {out.split && splitTotal > 0 && (
                        <div className="mt-4">
                          <div className="flex h-3 overflow-hidden rounded-full bg-white/10" role="img" aria-label={out.split.map((s) => `${s.label} ${Math.round((s.value / splitTotal) * 100)}%`).join(", ")}>
                            {out.split.map((s, i) => (
                              <div key={s.label} style={{ width: `${(Math.max(0, s.value) / splitTotal) * 100}%`, backgroundColor: i === 0 ? "#C8E967" : "#F472D0" }} />
                            ))}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/70">
                            {out.split.map((s, i) => (
                              <span key={s.label} className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: i === 0 ? "#C8E967" : "#F472D0" }} />
                                {s.label} · {Math.round((Math.max(0, s.value) / splitTotal) * 100)}%
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {out.note && <p className="mt-3 text-xs text-white/50">{out.note}</p>}
                    </>
                  )}
                </div>
                {ok && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" className={PILL} onClick={() => void copy()}>
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
                    </button>
                    <button type="button" className={PILL} onClick={savePdf}>
                      {statementPdf.state === "making" && !statementPdf.previous ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} PDF
                    </button>
                    <button type="button" className={PILL} onClick={whatsapp}>
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </button>
                    {out.table && (
                      <button type="button" className={PILL} onClick={csv}>
                        <Download className="h-3.5 w-3.5" /> CSV
                      </button>
                    )}
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#F472D0] px-5 py-2.5 text-xs font-semibold text-[#111111] transition hover:bg-[#F472D0]/90 disabled:opacity-60"
                      onClick={() => void explain()}
                      disabled={busy}
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Explain in plain words · {creditCost} credit{creditCost === 1 ? "" : "s"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full-width year-by-year breakdown */}
          {ok && out.table && out.table.rows.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-[15px] font-bold text-[#111111] dark:text-white" style={UNBOUNDED}>
                Year-by-year breakdown
              </h2>
              <section className="overflow-hidden rounded-2xl border border-black/12 bg-white dark:border-white/12 dark:bg-[#16161A]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead className="bg-[#FAF7F2] text-left text-xs dark:bg-white/5">
                      <tr>
                        {out.table.columns.map((c, i) => (
                          <th key={c} className={cn("px-4 py-3 font-bold text-[#111111] dark:text-white", i > 0 && "text-right")}>
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.08] dark:divide-white/10">
                      {rows.map((r, i) => (
                        <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                          {r.map((cell, j) => (
                            <td key={j} className={cn("px-4 py-2.5 text-[#111111]/80 dark:text-white/80", j > 0 && "text-right tabular-nums")}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {out.table.rows.length > 10 && (
                  <div className="flex justify-center border-t border-black/10 p-3 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setAllRows((s) => !s)}
                      className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-semibold text-[#111111] transition hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                    >
                      {allRows ? "Show fewer" : `Show all ${out.table.rows.length} rows`}
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}

          {explanation && (
            <div id={`${toolId}-explain`} className="mt-6 scroll-mt-24">
              <OutputPanel toolId={toolId} text={explanation} title={appName} fileName={`${emi.fileName}-explained`} sendTo={emi.related} pdfDoc={statement ?? undefined} />
            </div>
          )}

          {emi.related && emi.related.length > 0 && <WorksWellWith ids={emi.related} cols={3} />}
        </div>
      </div>
    </div>
  );
}
