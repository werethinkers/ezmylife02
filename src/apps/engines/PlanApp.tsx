import { useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { cn } from "@/lib/utils";
import { AppShell } from "../shell/AppShell";
import { HistoryList } from "../shell/HistoryList";
import { StepLabel } from "../shell/StepLabel";
import { NeedsCredits, errorText } from "../lib/api";
import { slug } from "../lib/files";
import type { FormValues } from "../types";
import type { PlanDef } from "../flagship/types";
import { runFlagship } from "../flagship/api";
import { FieldGrid, ResultView, YouGet, card, emptyValues, inputsOf, missingFields } from "../flagship/parts";
import { OutputChoice } from "../output/OutputChoice";
import { useResults } from "../flagship/useResults";

/** Plan builder and pack maker: a few short pages of questions, then one full result. */
export default function PlanApp({ toolId, def }: { toolId: string; def: PlanDef }) {
  const { data: catalog = [] } = useToolsCatalog();
  const appName = catalog.find((t) => t.id === toolId)?.name ?? "Result";
  const r = useResults(toolId);
  const [values, setValues] = useState<FormValues>(() => emptyValues(def.fields));
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState<"final" | "refine" | null>(null);

  const pageFields = def.fields.filter((f) => def.pages[page]?.keys.includes(f.key));
  const last = page === def.pages.length - 1;
  const titleFor = () => (Object.values(values).find((v) => typeof v === "string" && v.trim()) as string | undefined) ?? appName;

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
    <AppShell toolId={toolId} intro={def.intro} steps={def.steps} related={def.related} syncState={r.store.syncState} wide>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-4">
          <form
            className={card}
            onSubmit={(e) => {
              e.preventDefault();
              if (last) void generate();
              else next();
            }}
          >
            <StepLabel n={2}>
              {def.pages[page]?.title}
              <span className="ml-auto text-xs font-semibold text-muted-foreground">
                {page + 1} of {def.pages.length}
              </span>
            </StepLabel>
            <div className="mb-4 flex gap-1" aria-hidden>
              {def.pages.map((p, i) => (
                <span key={p.title} className={cn("h-1.5 flex-1 rounded-full", i <= page ? "bg-ink" : "bg-ink/15")} />
              ))}
            </div>
            <FieldGrid toolId={toolId} fields={pageFields} values={values} onChange={setValues} sample={page === 0 ? def.sample : undefined} disabled={!!busy} />
            {last && <OutputChoice toolId={toolId} className="mt-5" />}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {page > 0 && (
                <Button type="button" variant="outline" className="gap-1.5" onClick={() => setPage((p) => p - 1)} disabled={!!busy}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              )}
              {last ? (
                <Button type="submit" className="gap-2" disabled={!!busy}>
                  {busy === "final" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {def.cta} · {def.credits} credits
                </Button>
              ) : (
                <Button type="submit" className="gap-1.5">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setValues(emptyValues(def.fields));
                  setPage(0);
                  r.reset();
                }}
                disabled={!!busy}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Start again
              </Button>
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
        <div id={`${toolId}-output`} className="min-w-0 scroll-mt-24">
          {busy === "final" || !r.output ? (
            <YouGet items={def.youGet} working={busy === "final"} />
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
    </AppShell>
  );
}
