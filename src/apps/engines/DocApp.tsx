import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useToolPricing } from "@/hooks/useToolPricing";
import { useModernTheme } from "@/components/modern/theme";
import { cn } from "@/lib/utils";
import { AmbientGlow, SyncChip, UNBOUNDED, WorksWellWith } from "../flagship/studioUi";
import { OutputPanel } from "../shell/OutputPanel";
import { OutputChoice } from "../output/OutputChoice";
import { FieldInput, serializeValues } from "../shell/Fields";
import { WorkspaceCard } from "../shell/WorkspaceCard";
import { HistoryList, addHistory, type HistoryItem } from "../shell/HistoryList";
import { useAppStore, uid } from "../lib/store";
import { useWorkspace, type WorkspaceProfile } from "../lib/workspace";
import { takeHandoff } from "../lib/handoff";
import { ctxValue, usePrefill } from "../lib/context";
import { runApp, NeedsCredits, errorText } from "../lib/api";
import { slug } from "../lib/files";
import type { DocAppDef, FormValues } from "../types";

function initialValues(def: DocAppDef, profile: WorkspaceProfile): FormValues {
  const v: FormValues = {};
  for (const f of def.fields) {
    if (f.type === "rows") v[f.key] = f.defaultRows ? f.defaultRows.map((r) => ({ ...r })) : [];
    else v[f.key] = (f.profile && profile[f.profile]) || f.default || "";
  }
  return v;
}

// The eyebrow pill's short kind word, from the tool's category — "Finance & Accounting" becomes
// "FINANCE TOOL", "HR & Staffing" becomes "HR TOOL", and so on for every doc-engine category.
const kindWord = (category?: string) => `${(category ? category.split(/\s*&\s*/)[0] : "Business").toUpperCase()} TOOL`;

const CARD = "rounded-3xl border border-black/[0.08] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#16161A] sm:p-7";
const GHOST_PILL = "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[#111111] transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10";

/** Form → AI document, with revise, save, share and history. Used by most business apps. */
export default function DocApp({ toolId, def }: { toolId: string; def: DocAppDef }) {
  const ws = useWorkspace();
  const { data: catalog = [] } = useToolsCatalog();
  const tool = catalog.find((t) => t.id === toolId);
  const appName = tool?.name ?? "Result";
  const { dark } = useModernTheme();
  const { creditCost } = useToolPricing(toolId);
  const store = useAppStore<{ history: HistoryItem[]; savedAt?: number }>(toolId, { history: [] });
  const [values, setValues] = useState<FormValues>(() => initialValues(def, ws.profile));
  const [output, setOutput] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"generate" | "refine" | null>(null);

  // Prefill from the business profile once it loads (only empty fields).
  useEffect(() => {
    setValues((prev) => {
      const next = { ...prev };
      for (const f of def.fields) if (f.profile && !prev[f.key] && ws.profile[f.profile]) next[f.key] = ws.profile[f.profile] as string;
      return next;
    });
  }, [ws.profile, def.fields]);

  // Client / invoice details from the shared workspace context.
  usePrefill((ctx) => {
    setValues((prev) => {
      const next = { ...prev };
      for (const f of def.fields) {
        if (!f.ctxKey || prev[f.key]) continue;
        const v = ctxValue(ctx, f.ctxKey);
        if (v) next[f.key] = v;
      }
      return next;
    });
  });

  // Text sent from another app ("Use in…").
  useEffect(() => {
    const h = takeHandoff(toolId);
    if (!h) return;
    const target = def.fields.find((f) => f.acceptsHandoff) ?? def.fields.find((f) => f.type === "textarea");
    if (target) {
      setValues((v) => ({ ...v, [target.key]: h.text.slice(0, 6000) }));
      toast.success(`Brought in your result from ${h.fromName}`);
    }
  }, [toolId, def.fields]);

  const computed = useMemo(() => def.compute?.(values) ?? {}, [def, values]);
  const missing = def.fields.filter((f) => f.required && !(typeof values[f.key] === "string" ? (values[f.key] as string).trim() : (values[f.key] as unknown[])?.length));

  const titleFor = () => {
    const first = def.fields.map((f) => values[f.key]).find((v) => typeof v === "string" && v.trim()) as string | undefined;
    return (first ?? appName).slice(0, 60);
  };

  const generate = async () => {
    if (missing.length) {
      toast.error(`Please fill: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    setBusy("generate");
    try {
      const inputs = { ...serializeValues(def.fields, values), ...computed };
      const text = await runApp<string>(toolId, { inputs, action: "generate" });
      const item: HistoryItem = { id: uid(), at: Date.now(), title: titleFor(), output: text, inputs: values };
      setOutput(text);
      setActiveId(item.id);
      store.update((d) => ({ history: addHistory(d.history, item) }));
      requestAnimationFrame(() => document.getElementById(`${toolId}-output`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const refine = async (instruction: string) => {
    setBusy("refine");
    try {
      const inputs = { ...serializeValues(def.fields, values), ...computed };
      const text = await runApp<string>(toolId, { inputs, action: "refine", previous: output, instruction });
      setOutput(text);
      const item: HistoryItem = { id: activeId ?? uid(), at: Date.now(), title: titleFor(), output: text, inputs: values };
      setActiveId(item.id);
      store.update((d) => ({ history: addHistory(d.history, item) }));
    } catch (e) {
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const applyProfile = (p: WorkspaceProfile) =>
    setValues((prev) => {
      const next = { ...prev };
      for (const f of def.fields) if (f.profile && p[f.profile]) next[f.key] = p[f.profile] as string;
      return next;
    });

  const hasProfileFields = def.fields.some((f) => f.profile);

  return (
    <div className={cn("ez-modern", dark && "dark")}>
      <div className="relative overflow-hidden bg-[#FAF7F2] dark:bg-[#0D0D0F]">
        <AmbientGlow />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Hero */}
          <header>
            <span className="inline-flex items-center rounded-full border border-black/15 bg-[#C8E967] px-3 py-1 text-xs font-bold uppercase text-[#111111]">
              {kindWord(tool?.category)} · {creditCost === 0 ? "FREE" : `${creditCost} CREDIT${creditCost === 1 ? "" : "S"}`}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-[#111111] dark:text-white sm:text-3xl" style={UNBOUNDED}>
              {appName}
            </h1>
            <p className="mt-1.5 max-w-2xl text-[16px] text-black/60 dark:text-white/60">{def.intro}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-black/50 dark:text-white/50">
              <SyncChip state={store.syncState} />
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Credits only when it works
              </span>
            </div>
          </header>

          {/* Workspace */}
          <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-4 lg:col-span-7">
              <form
                className={CARD}
                onSubmit={(e) => {
                  e.preventDefault();
                  void generate();
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-black/55 dark:text-white/50">Fill in your details</p>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {def.fields.map((f) => (
                    <FieldInput key={f.key} field={f} idPrefix={toolId} value={values[f.key]} onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))} variant="soft" />
                  ))}
                </div>
                {def.preview && <div className="mt-4">{def.preview(values)}</div>}
                <OutputChoice toolId={toolId} className="mt-5" tone="soft" />
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={!!busy}
                    className="inline-flex items-center gap-2 rounded-full bg-[#F472D0] px-6 py-3 text-sm font-semibold text-[#111111] transition hover:brightness-95 disabled:opacity-60"
                  >
                    {busy === "generate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {def.cta}
                  </button>
                  {def.sample && (
                    <button type="button" className={GHOST_PILL} disabled={!!busy} onClick={() => setValues((v) => ({ ...v, ...def.sample }))}>
                      <Wand2 className="h-3.5 w-3.5" /> Fill in an example
                    </button>
                  )}
                  <button type="button" className={GHOST_PILL} disabled={!!busy} onClick={() => setValues(initialValues(def, ws.profile))}>
                    <RotateCcw className="h-3.5 w-3.5" /> Clear
                  </button>
                </div>
              </form>
              {hasProfileFields && (
                <WorkspaceCard
                  pill
                  className="border border-black/[0.08] bg-white shadow-none dark:border-white/10 dark:bg-[#16161A]"
                  onApply={applyProfile}
                />
              )}
              <HistoryList
                items={store.data.history ?? []}
                activeId={activeId}
                onOpen={(h) => {
                  setOutput(h.output);
                  setActiveId(h.id);
                  if (h.inputs) setValues({ ...initialValues(def, ws.profile), ...h.inputs });
                }}
                onDelete={(id) => {
                  store.update((d) => ({ history: (d.history ?? []).filter((h) => h.id !== id) }));
                  if (id === activeId) {
                    setOutput("");
                    setActiveId(null);
                  }
                }}
              />
            </div>

            <div id={`${toolId}-output`} className="min-w-0 lg:col-span-5 lg:sticky lg:top-24 lg:self-start" aria-live="polite">
              {output ? (
                <OutputPanel
                  toolId={toolId}
                  text={output}
                  title={appName}
                  fileName={`${def.fileName}-${slug(titleFor())}`}
                  onRefine={refine}
                  refining={busy === "refine"}
                  refineChips={def.refineChips ?? ["Make it shorter", "More formal", "Translate to Hindi", "Add more detail"]}
                  sendTo={def.related}
                  editable
                  onEdit={setOutput}
                />
              ) : (
                <div className="overflow-hidden rounded-3xl border border-black/[0.08] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#16161A]">
                  <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#FAF7F2] px-4 py-2.5 dark:border-white/10 dark:bg-white/5">
                    <span className="flex gap-1" aria-hidden>
                      <span className="h-2.5 w-2.5 rounded-full bg-[#F472D0]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FACC15]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#C8E967]" />
                    </span>
                    <span className="truncate text-xs font-semibold text-black/50 dark:text-white/50">{appName} preview</span>
                  </div>
                  {busy === "generate" ? (
                    <div className="space-y-3 p-6" aria-busy="true">
                      <p className="flex items-center gap-2 text-sm text-black/50 dark:text-white/50">
                        <Loader2 className="h-4 w-4 animate-spin" /> Writing — usually 5–20 seconds…
                      </p>
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-11/12" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : (
                    <div className="relative flex min-h-[260px] flex-col items-center justify-center gap-2 overflow-hidden p-8 text-center">
                      <div className="pointer-events-none absolute inset-6 space-y-2.5 opacity-[0.06]" aria-hidden>
                        <div className="h-3 w-3/4 rounded bg-[#111111] dark:bg-white" />
                        <div className="h-3 w-full rounded bg-[#111111] dark:bg-white" />
                        <div className="h-3 w-5/6 rounded bg-[#111111] dark:bg-white" />
                        <div className="h-3 w-2/3 rounded bg-[#111111] dark:bg-white" />
                      </div>
                      <Sparkles className="relative h-6 w-6 text-black/30 dark:text-white/30" />
                      <p className="relative text-sm text-black/50 dark:text-white/50">
                        Fill in what you know — anything you leave out is marked as a [placeholder] for you to complete. Nothing is invented about your business.
                      </p>
                    </div>
                  )}
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
