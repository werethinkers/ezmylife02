import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { AppShell } from "../shell/AppShell";
import { OutputPanel } from "../shell/OutputPanel";
import { OutputChoice } from "../output/OutputChoice";
import { FieldInput, serializeValues } from "../shell/Fields";
import { WorkspaceCard } from "../shell/WorkspaceCard";
import { ResultPlaceholder, StepLabel } from "../shell/StepLabel";
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

/** Form → AI document, with revise, save, share and history. Used by most business apps. */
export default function DocApp({ toolId, def }: { toolId: string; def: DocAppDef }) {
  const ws = useWorkspace();
  const { data: catalog = [] } = useToolsCatalog();
  const appName = catalog.find((t) => t.id === toolId)?.name ?? "Result";
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
    <AppShell toolId={toolId} intro={def.intro} steps={def.steps} related={def.related} syncState={store.syncState}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-4">
          <form
            className="rounded-2xl border-2 border-ink bg-card p-4 shadow-block sm:p-5"
            onSubmit={(e) => {
              e.preventDefault();
              void generate();
            }}
          >
            <StepLabel n={2}>Fill in your details</StepLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {def.fields.map((f) => (
                <FieldInput
                  key={f.key}
                  field={f}
                  idPrefix={toolId}
                  value={values[f.key]}
                  onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                />
              ))}
            </div>
            {def.preview && <div className="mt-4">{def.preview(values)}</div>}
            <OutputChoice toolId={toolId} className="mt-5" />
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button type="submit" className="gap-2" disabled={!!busy}>
                {busy === "generate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {def.cta}
              </Button>
              {def.sample && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
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
                className="gap-1.5"
                onClick={() => setValues(initialValues(def, ws.profile))}
                disabled={!!busy}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear
              </Button>
            </div>
          </form>
          {hasProfileFields && <WorkspaceCard onApply={applyProfile} />}
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

        <div id={`${toolId}-output`} className="min-w-0 scroll-mt-24">
          {busy === "generate" ? (
            <div className="space-y-3 rounded-2xl border-2 border-ink bg-card p-6" aria-busy="true" aria-live="polite">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Writing — usually 5–20 seconds…
              </p>
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : output ? (
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
            <ResultPlaceholder>
                Fill in what you know — anything you leave out is marked as a [placeholder] for you to complete. Nothing is invented about your business.
              </ResultPlaceholder>
          )}
        </div>
      </div>
    </AppShell>
  );
}
