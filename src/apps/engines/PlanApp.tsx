import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import type { LogoState } from "../output/logoConcepts";

// A required text field whose only content is one character or one character repeated (e.g. "x", "xxx")
// is not meaningful enough to generate from — catches this before spending an AI call and a credit on it.
const TRIVIAL_TEXT = /^(.)\1*$/;
const meaninglessFields = (fields: Field[], v: FormValues) =>
  fields.filter((f) => {
    if (!f.required || (f.type !== "text" && f.type !== "textarea")) return false;
    const s = typeof v[f.key] === "string" ? (v[f.key] as string).trim() : "";
    return s.length > 0 && (s.length < 2 || TRIVIAL_TEXT.test(s));
  });

/** Plan builder and pack maker: a few short pages of questions, then one full result. */
export default function PlanApp({ toolId, def }: { toolId: string; def: PlanDef }) {
  const { data: catalog = [] } = useToolsCatalog();
  const appName = catalog.find((t) => t.id === toolId)?.name ?? "Result";
  const appCategory = catalog.find((t) => t.id === toolId)?.category;
  const { dark } = useModernTheme();
  const r = useResults(toolId);
  const draft = r.draft as { values?: FormValues; page?: number } | undefined;
  const [values, setValues] = useState<FormValues>(() => ({ ...emptyValues(def.fields), ...draft?.values }));
  const [page, setPage] = useState(() => draft?.page ?? 0);
  const [busy, setBusy] = useState<"final" | "refine" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  // The 3 auto-generated logo concepts per result, keyed by result id. Kept in memory only (not
  // saved to the device/account, unlike the draft and history above) — each is a full image, and
  // bundling several of those into the same saved blob as the draft/history risks a storage-quota
  // write failure taking those down with it. The worst case of not persisting is just that leaving
  // and coming back regenerates them; the guard inside LogoConcepts still stops a re-render from
  // doing that while this component stays mounted.
  const [logos, setLogos] = useState<Record<string, LogoState>>({});
  // Belt-and-suspenders against double submission: checked synchronously, so even two clicks that
  // land before React re-renders the disabled button can't both start a (paid) generation.
  const busyRef = useRef(false);
  // Once the person has typed anything locally, stop overwriting it with a draft that arrives
  // from the account sync (which only matters for restoring on load, e.g. on another device).
  const touchedRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const pageFields = def.fields.filter((f) => def.pages[page]?.keys.includes(f.key));
  const last = page === def.pages.length - 1;
  const titleFor = () => (Object.values(values).find((v) => typeof v === "string" && v.trim()) as string | undefined) ?? appName;
  const showPreview = busy === "final" || !r.output;

  // "Give me 10 more names" only makes sense when the customer actually asked for name ideas
  // (left the name field as "need a name" or blank) — a tool declares that by its field's own hint.
  const nameField = def.fields.find((f) => /need a name/i.test(f.label));
  const needsName = !nameField || !values[nameField.key] || /need\s*a?\s*name/i.test(String(values[nameField.key]));
  const refineChips = nameField && !needsName ? def.refineChips?.filter((c) => !/\bmore names\b/i.test(c)) : def.refineChips;

  // Restores a draft that finishes syncing from the account after this page has already mounted.
  useEffect(() => {
    if (touchedRef.current || !draft) return;
    if (draft.values) setValues({ ...emptyValues(def.fields), ...draft.values });
    if (typeof draft.page === "number") setPage(draft.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // Autosaves Step 1 / Step 2 inputs (debounced) so leaving by accident — the header "← Back",
  // closing the tab, a crash — and reopening this app restores them, same as a saved result.
  useEffect(() => {
    if (!touchedRef.current || r.output) return;
    const t = setTimeout(() => r.saveDraft({ values, page }), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, page]);

  const setField = (key: string, x: string | FormValues[string]) => {
    touchedRef.current = true;
    setValues({ ...values, [key]: x });
    setFormError(null);
    if (fieldErrors[key]) {
      setFieldErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  };

  /** Puts the first invalid field on screen, focused, instead of leaving the person to find it. */
  const scrollToField = (key: string) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(`${toolId}-${key.replace(/\W+/g, "-")}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    });
  };

  /** Shared by next() and generate(): checks a set of fields, highlights and reports the bad ones
   *  (missing first, then present-but-meaningless), without deciding what to do about it. */
  const validate = (fields: Field[], allowTrivial: boolean): Field[] => {
    const miss = missingFields(fields, values);
    const trivial = allowTrivial ? [] : meaninglessFields(fields, values);
    const bad = [...miss, ...trivial.filter((f) => !miss.some((m) => m.key === f.key))];
    if (!bad.length) return bad;
    const errs: Record<string, string> = {};
    for (const f of miss) errs[f.key] = "This is needed.";
    for (const f of trivial) if (!errs[f.key]) errs[f.key] = "Tell us a bit more here — a few real words.";
    setFieldErrors((e) => ({ ...e, ...errs }));
    const msg = miss.length ? `Please fill: ${miss.map((f) => splitLabel(f.label).label).join(", ")}` : "Tell us a bit more about your business.";
    setFormError(msg);
    toast.error(msg);
    return bad;
  };

  const next = () => {
    const bad = validate(pageFields, false);
    if (bad.length) return scrollToField(bad[0].key);
    setPage((p) => Math.min(p + 1, def.pages.length - 1));
    // So Step 2's fields are visible right away, not wherever the page happened to be scrolled
    // to after filling in Step 1 (easy to miss on a long mobile page otherwise).
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const generate = async (instruction?: string) => {
    if (busyRef.current) return;
    const bad = validate(def.fields, !!instruction);
    if (bad.length) {
      // The first invalid field may be on an earlier page — jump there so it's actually visible.
      const badPage = def.pages.findIndex((p) => p.keys.includes(bad[0].key));
      if (badPage !== -1 && badPage !== page) setPage(badPage);
      scrollToField(bad[0].key);
      return;
    }
    busyRef.current = true;
    setFormError(null);
    setFieldErrors({});
    setBusy(instruction ? "refine" : "final");
    // On a small screen the loading checklist sits below the form, off-screen until you scroll —
    // bring it into view the moment generation starts, so it reads the same as the desktop layout
    // (where it's already visible beside the form) instead of looking like nothing happened.
    if (!instruction) requestAnimationFrame(() => document.getElementById(`${toolId}-output`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    try {
      const { output } = await runFlagship<string>(toolId, "final", {
        inputs: inputsOf(def.fields, values),
        // One id per submission, so a retried or duplicated request never gets charged twice server-side.
        request_id: r.newId(),
        ...(instruction ? { previous: r.output, instruction } : {}),
      });
      r.save(titleFor(), output, values, instruction ? undefined : r.newId());
      if (!instruction) r.clearDraft();
    } catch (e) {
      // NeedsCredits already opened the sign-in / buy-credits dialog — nothing was charged, nothing to show here.
      if (!(e instanceof NeedsCredits)) {
        const msg = errorText(e);
        setFormError(msg);
        toast.error(msg);
      }
    } finally {
      setBusy(null);
      busyRef.current = false;
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
              <ol
                aria-label="How to use it"
                className="flex flex-wrap gap-2 text-[13px] font-semibold text-[#111111] sm:flex-nowrap sm:snap-x sm:overflow-x-auto sm:pb-1 sm:no-scrollbar dark:text-white"
              >
                {def.steps.map((s, i) => {
                  // The last step is "get the result": done once there is one, current while the
                  // form is still on an earlier page. Keeps this row, the top progress bar and the
                  // "page X of Y" count all agreeing on where the person actually is.
                  const stepIndex = r.output ? def.steps.length - 1 : Math.min(page, def.steps.length - 1);
                  const done = i < stepIndex;
                  const current = i === stepIndex;
                  return (
                    <li
                      key={s}
                      aria-current={current ? "step" : undefined}
                      className={cn(
                        "flex shrink-0 snap-start items-center gap-2 rounded-full border px-3 py-1.5",
                        current
                          ? "border-[#111111] bg-[#FACC15] dark:border-white/70 dark:bg-[#FACC15]/90 dark:text-[#111111]"
                          : done
                            ? "border-[#111111]/30 bg-[#C8E967]/30 dark:border-white/25 dark:bg-white/10"
                            : "border-black/10 bg-white text-black/55 dark:border-white/15 dark:bg-[#16161A] dark:text-white/50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                          current ? "bg-[#111111] text-white dark:bg-white dark:text-[#111111]" : done ? "bg-[#111111] text-white dark:bg-white/70 dark:text-[#111111]" : "bg-black/10 text-black/50 dark:bg-white/10 dark:text-white/50",
                        )}
                      >
                        {done ? <Check className="h-3 w-3" /> : i + 1}
                      </span>
                      {s}
                    </li>
                  );
                })}
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
                ref={formRef}
                className="rounded-2xl border-[1.5px] border-[#111111] bg-white p-6 shadow-[4px_4px_0_#111111] dark:border-white/20 dark:bg-[#16161A] dark:shadow-[4px_4px_0_rgba(255,255,255,0.12)]"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!last) return next();
                  if (r.output) return setConfirmRegenerate(true);
                  void generate();
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
                          onChange={(x) => setField(f.key, x)}
                          controlClassName={CONTROL}
                          labelClassName={LABEL}
                          hintClassName={HINT}
                          error={fieldErrors[f.key]}
                        />
                      </div>
                    );
                  })}
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="mt-4 flex items-start gap-2 rounded-xl border-[1.5px] border-red-600/60 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-400/50 dark:bg-red-950/40 dark:text-red-300"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {page === 0 && def.sample && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-3 gap-1.5 text-[#111111] hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                    disabled={!!busy}
                    onClick={() => {
                      touchedRef.current = true;
                      setValues({ ...values, ...def.sample });
                    }}
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
                        setFormError(null);
                        setFieldErrors({});
                        touchedRef.current = false;
                        r.reset();
                        r.clearDraft();
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
                        <ArrowLeft className="h-4 w-4" /> Previous step
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
                      {r.output ? "Make a new version" : def.cta} · {def.credits} credits
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
                  refineChips={refineChips}
                  resultId={r.activeId}
                  logoState={r.activeId ? logos[r.activeId] : undefined}
                  onLogoStateChange={(id, state) => setLogos((m) => ({ ...m, [id]: state }))}
                  category={typeof values.category === "string" ? values.category : undefined}
                  onSectionPatched={(next) => {
                    r.setOutput(next);
                    r.save(titleFor(), next, values);
                  }}
                />
              )}
            </div>
          </div>

          {def.related && def.related.length > 0 && <WorksWellWith ids={def.related} />}
        </div>
      </div>

      <AlertDialog open={confirmRegenerate} onOpenChange={setConfirmRegenerate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make a new version?</AlertDialogTitle>
            <AlertDialogDescription>
              This makes a brand new result and costs {def.credits} credits, the same as the first run. Your current result stays saved in History below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmRegenerate(false);
                void generate();
              }}
            >
              Make a new version · {def.credits} credits
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
