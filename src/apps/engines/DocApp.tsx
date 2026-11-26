import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useModernTheme } from "@/components/modern/theme";
import { AppIcon } from "@/components/store/AppIcon";
import { CreditCostBadge } from "@/components/tools/CreditCostBadge";
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

/*
 * Form → AI document, with revise, save, share and history. Used by most business apps — the
 * refined neo-brutalist look (ambient glow, soft homepage-style inputs, a document-preview frame
 * for the right column) lives here instead of the generic AppShell, so it rolls out to every one
 * of these apps at once. All generation/validation/profile-sync/history logic is unchanged.
 */

function initialValues(def: DocAppDef, profile: WorkspaceProfile): FormValues {
  const v: FormValues = {};
  for (const f of def.fields) {
    if (f.type === "rows") v[f.key] = f.defaultRows ? f.defaultRows.map((r) => ({ ...r })) : [];
    else v[f.key] = (f.profile && profile[f.profile]) || f.default || "";
  }
  return v;
}

export default function DocApp({ toolId, def }: { toolId: string; def: DocAppDef }) {
  const ws = useWorkspace();
  const { data: catalog = [] } = useToolsCatalog();
  const tool = catalog.find((t) => t.id === toolId);
  const appName = tool?.name ?? "Result";
  const { dark } = useModernTheme();
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
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <AppIcon toolId={toolId} category={tool?.category} name={appName} size="sm" />
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-[#111111] dark:text-white sm:text-3xl" style={UNBOUNDED}>
                  {appName}
                </h1>
                <p className="mt-1.5 max-w-2xl text-[16px] text-black/60 dark:text-white/60">{def.intro}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <CreditCostBadge toolId={toolId} className="!border-[1.5px] !border-[#111111] !bg-[#C8E967] dark:!border-white/70" />
              <SyncChip state={store.syncState} />
            </div>
          </header>

          {def.steps && def.steps.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ol aria-label="How to use it" className="flex snap-x gap-2 overflow-x-auto pb-1 text-[13px] font-semibold text-[#111111] no-scrollbar dark:text-white">
                {def.steps.map((s, i) => (
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
          <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <form
                className="rounded-2xl border-[1.5px] border-[#111111] bg-white p-6 shadow-[4px_4px_0_#111111] dark:border-white/20 dark:bg-[#16161A] dark:shadow-[4px_4px_0_rgba(255,255,255,0.12)]"
                onSubmit={(e) => {
                  e.preventDefault();
                  void generate();
                }}
              >
                <p className="mb-4 text-[15px] font-bold text-[#111111] dark:text-white" style={UNBOUNDED}>
                  Fill in your details
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {def.fields.map((f) => (
                    <FieldInput
                      key={f.key}
                      field={f}
                      idPrefix={toolId}
                      value={values[f.key]}
                      onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                      variant="soft"
                    />
                  ))}
                </div>
                {def.preview && <div className="mt-4">{def.preview(values)}</div>}
                <OutputChoice toolId={toolId} className="mt-5" tone="soft" />
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Button
                    type="submit"
                    className="gap-2 rounded-full border-[1.5px] border-[#111111] bg-[#F472D0] px-6 text-[#111111] shadow-[3px_3px_0_#111111] hover:bg-[#F472D0]/90 dark:border-white/70"
                    disabled={!!busy}
                  >
                    {busy === "generate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {def.cta}
                  </Button>
                  {def.sample && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 rounded-full text-[#111111] hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                      onClick={() => setValues((v) => ({ ...v, ...def.sample }))}
                      disabled={!!busy}
                    >
                      <Wand2 className="h-3.5 w-3.5" /> Fill in an example
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 rounded-full text-[#111111] hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                    onClick={() => setValues(initialValues(def, ws.profile))}
                    disabled={!!busy}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Clear
                  </Button>
                </div>
              </form>
              {hasProfileFields && (
                <WorkspaceCard
                  onApply={applyProfile}
                  pill
                  className="border border-black/12 bg-white shadow-none dark:border-white/15 dark:bg-[#16161A]"
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

            <div id={`${toolId}-output`} className="min-w-0 scroll-mt-24 lg:sticky lg:top-24 lg:col-span-5">
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
                <div className="overflow-hidden rounded-2xl border-[1.5px] border-[#111111] bg-white dark:border-white/20 dark:bg-[#16161A]">
                  <div className="flex items-center justify-between border-b border-black/10 bg-[#FAF7F2] px-4 py-2.5 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center gap-1.5" aria-hidden>
                      <span className="h-2.5 w-2.5 rounded-full bg-[#F472D0]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FACC15]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#C8E967]" />
                    </div>
                    <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-black/60 dark:border-white/15 dark:bg-white/10 dark:text-white/60">
                      {appName} preview
                    </span>
                  </div>
                  {busy === "generate" ? (
                    <div className="space-y-3 p-6" aria-busy="true" aria-live="polite">
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
                    <div className="relative flex min-h-[380px] flex-col items-center justify-center overflow-hidden p-6">
                      <div className="absolute inset-6 flex flex-col gap-3 opacity-[0.06] dark:opacity-[0.08]" aria-hidden>
                        <div className="h-4 w-1/2 rounded bg-[#111111] dark:bg-white" />
                        <div className="h-2.5 w-2/3 rounded bg-[#111111] dark:bg-white" />
                        <div className="mt-2 h-24 w-full rounded-lg bg-[#111111] dark:bg-white" />
                        <div className="h-2.5 w-full rounded bg-[#111111] dark:bg-white" />
                        <div className="h-2.5 w-5/6 rounded bg-[#111111] dark:bg-white" />
                        <div className="mt-auto h-6 w-1/3 self-end rounded bg-[#111111] dark:bg-white" />
                      </div>
                      <div className="relative flex flex-col items-center text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-black/10 bg-[#FAF7F2] dark:border-white/15 dark:bg-white/5">
                          <Sparkles className="h-6 w-6 text-[#111111] dark:text-white" aria-hidden />
                        </span>
                        <p className="mt-3 font-bold text-[#111111] dark:text-white">Your result appears here</p>
                        <p className="mt-1 max-w-sm text-sm text-black/50 dark:text-white/50">
                          Fill in what you know — anything you leave out is marked as a [placeholder] for you to complete. Nothing is invented about your business.
                        </p>
                      </div>
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
