import { useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, RotateCcw, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useModernTheme } from "@/components/modern/theme";
import { AppIcon } from "@/components/store/AppIcon";
import { CreditCostBadge } from "@/components/tools/CreditCostBadge";
import { cn } from "@/lib/utils";
import { HistoryList } from "../shell/HistoryList";
import { FieldInput } from "../shell/Fields";
import { NeedsCredits, errorText } from "../lib/api";
import { slug } from "../lib/files";
import type { Field, FormValues } from "../types";
import type { PlanDef } from "../flagship/types";
import { runFlagship } from "../flagship/api";
import { ResultView, emptyValues, inputsOf, missingFields } from "../flagship/parts";
import { AmbientGlow, CONTROL, HINT, LABEL, SyncChip, UNBOUNDED, WhatYouGet, WorksWellWith, splitLabel } from "../flagship/studioUi";
import { OutputChoice } from "../output/OutputChoice";
import { useResults } from "../flagship/useResults";

/** Plan builder and pack maker: a few short pages of questions, then one full result. */
export default function PlanApp({ toolId, def }: { toolId: string; def: PlanDef }) {
  const { data: catalog = [] } = useToolsCatalog();
  const appName = catalog.find((t) => t.id === toolId)?.name ?? "Result";
  const appCategory = catalog.find((t) => t.id === toolId)?.category;
  const { dark } = useModernTheme();
  const r = useResults(toolId);
  const [values, setValues] = useState<FormValues>(() => emptyValues(def.fields));
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState<"final" | "refine" | null>(null);

  const pageFields = def.fields.filter((f) => def.pages[page]?.keys.includes(f.key));
  const last = page === def.pages.length - 1;
  const titleFor = () => (Object.values(values).find((v) => typeof v === "string" && v.trim()) as string | undefined) ?? appName;
  const showPreview = busy === "final" || !r.output;

  const next = () => {
    const miss = missingFields(pageFields, values);
    if (miss.length) return toast.error(`Please fill: ${miss.map((f) => f.label).join(", ")}`);
    setPage((p) => Math.min(p + 1, def.pages.length - 1));
  };

  const generate = async (instruction?: string) => {
    const miss = missingFields(def.fields, values);
    if (miss.length) return toast.error(`Please fill: ${miss.map((f) => f.label).join(", ")}`);
    setBusy(instruction ? "refine" : "final");
    try {
      const { output } = await runFlagship<string>(toolId, "final", {
        inputs: inputsOf(def.fields, values),
        ...(instruction ? { previous: r.output, instruction } : {}),
      });
      r.save(titleFor(), output, values, instruction ? undefined : r.newId());
    } catch (e) {
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={cn("ez-modern", dark && "dark")}>
      <div className="relative overflow-hidden bg-[#FAF7F2] dark:bg-[#0D0D0F]">
        <AmbientGlow />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Hero */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <AppIcon toolId={toolId} category={appCategory} name={appName} size="sm" />
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-[#111111] dark:text-white sm:text-3xl" style={UNBOUNDED}>
                  {appName}
                </h1>
                <p className="mt-1.5 max-w-2xl text-[16px] text-black/60 dark:text-white/60">{def.intro}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <CreditCostBadge toolId={toolId} className="!border-[1.5px] !border-[#111111] !bg-[#FACC15] dark:!border-white/70" />
              <SyncChip state={r.store.syncState} />
            </div>
          </header>

          {def.steps && def.steps.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ol aria-label="How to use it" className="flex snap-x gap-2 overflow-x-auto pb-1 text-[13px] font-semibold text-[#111111] no-scrollbar dark:text-white">
                {def.steps.map((s, i) => (
                  <li
                    key={s}
                    className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 dark:border-white/15 dark:bg-[#16161A]"
                  >
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
          <div className={cn("mt-6 grid gap-6", showPreview ? "grid-cols-1 lg:grid-cols-12 items-stretch" : "grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]")}>
            <div className={cn("space-y-4", showPreview && "lg:col-span-7")}>
              <form
                className="rounded-2xl border-[1.5px] border-[#111111] bg-white p-6 shadow-[4px_4px_0_#111111] dark:border-white/20 dark:bg-[#16161A] dark:shadow-[4px_4px_0_rgba(255,255,255,0.12)]"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (last) void generate();
                  else next();
                }}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[15px] font-bold text-[#111111] dark:text-white">{def.pages[page]?.title}</p>
                  <span className="text-xs font-semibold text-black/40 dark:text-white/40">
                    {page + 1} of {def.pages.length}
                  </span>
                </div>
                <div className="mb-5 flex gap-1.5" aria-hidden>
                  {def.pages.map((p, i) => (
                    <span key={p.title} className={cn("h-1.5 flex-1 rounded-full", i <= page ? "bg-[#F472D0]" : "bg-black/10 dark:bg-white/10")} />
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
                  {pageFields.map((f: Field) => {
                    const { label, hint } = splitLabel(f.label);
                    return (
                      <div key={f.key} className={cn(f.half ? "sm:col-span-1" : "sm:col-span-2")}>
                        <FieldInput
                          field={{ ...f, half: false, label, help: f.help ?? hint }}
                          idPrefix={toolId}
                          value={values[f.key]}
                          onChange={(x) => setValues({ ...values, [f.key]: x })}
                          controlClassName={CONTROL}
                          labelClassName={LABEL}
                          hintClassName={HINT}
                        />
                      </div>
                    );
                  })}
                </div>

                {page === 0 && def.sample && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-3 gap-1.5 text-[#111111] hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                    disabled={!!busy}
                    onClick={() => setValues({ ...values, ...def.sample })}
                  >
                    <Wand2 className="h-3.5 w-3.5" /> Fill in an example
                  </Button>
                )}

                {last && <OutputChoice toolId={toolId} className="mt-5" />}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-[#111111] hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                      onClick={() => {
                        setValues(emptyValues(def.fields));
                        setPage(0);
                        r.reset();
                      }}
                      disabled={!!busy}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Start again
                    </Button>
                    {page > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-[#111111] hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                        onClick={() => setPage((p) => p - 1)}
                        disabled={!!busy}
                      >
                        <ArrowLeft className="h-4 w-4" /> Back
                      </Button>
                    )}
                  </div>
                  {last ? (
                    <Button
                      type="submit"
                      className="gap-2 rounded-full border-[1.5px] border-[#111111] bg-[#F472D0] px-5 text-[#111111] shadow-[3px_3px_0_#111111] hover:bg-[#F472D0]/90 dark:border-white/70"
                      disabled={!!busy}
                    >
                      {busy === "final" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {def.cta} · {def.credits} credits
                    </Button>
                  ) : (
                    <Button type="submit" className="gap-1.5 rounded-full border-[1.5px] border-[#111111] bg-[#111111] px-5 text-white hover:opacity-90 dark:border-white/70">
                      Next <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
            <div id={`${toolId}-output`} className={cn("min-w-0 scroll-mt-24", showPreview && "lg:col-span-5")}>
              {showPreview ? (
                <WhatYouGet items={def.youGet} working={busy === "final"} />
              ) : (
                <ResultView
                  toolId={toolId}
                  def={def}
                  text={r.output}
                  title={appName}
                  fileName={`${def.fileName}-${slug(titleFor())}`}
                  onRefine={(i) => void generate(i)}
                  refining={busy === "refine"}
                  onEdit={r.setOutput}
                />
              )}
            </div>
          </div>

          {def.related && def.related.length > 0 && <WorksWellWith ids={def.related} />}
        </div>
      </div>
    </div>
  );
}
