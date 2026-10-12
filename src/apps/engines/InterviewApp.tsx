import { useEffect, useRef, useState } from "react";
import { BookOpen, Loader2, MessageCircleHeart, RotateCcw, Send, SkipForward, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { cn } from "@/lib/utils";
import { AppShell } from "../shell/AppShell";
import { HistoryList } from "../shell/HistoryList";
import { StepLabel } from "../shell/StepLabel";
import { useAppStore } from "../lib/store";
import { NeedsCredits, errorText } from "../lib/api";
import { slug } from "../lib/files";
import type { FormValues } from "../types";
import type { InterviewDef } from "../flagship/types";
import { runFlagship } from "../flagship/api";
import { FieldGrid, ResultView, VoiceButton, YouGet, card, emptyValues, inputsOf, missingFields } from "../flagship/parts";
import { useResults } from "../flagship/useResults";

interface Msg {
  role: "user" | "assistant";
  content: string;
}
interface Draft {
  values?: FormValues;
  messages?: Msg[];
  started?: boolean;
  savedAt?: number;
}

/** A warm guided interview, typed or spoken, that becomes a finished book or document. The interview is free. */
export default function InterviewApp({ toolId, def }: { toolId: string; def: InterviewDef }) {
  const { data: catalog = [] } = useToolsCatalog();
  const appName = catalog.find((t) => t.id === toolId)?.name ?? "Result";
  const r = useResults(toolId);
  // The interview in progress is saved too, so people can stop and come back later.
  const draft = useAppStore<Draft>(`${toolId}.draft`, {});
  const values = draft.data.values ?? emptyValues(def.fields);
  const messages = draft.data.messages ?? [];
  const started = !!draft.data.started;
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState<"next" | "final" | "refine" | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const answers = messages.filter((m) => m.role === "user").length;
  const canFinish = answers >= def.minAnswers;
  const full = answers >= def.maxAnswers;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, busy]);

  const setValues = (v: FormValues) => draft.update((d) => ({ ...d, values: v }));
  const titleFor = () => (Object.values(values).find((v) => typeof v === "string" && v.trim()) as string | undefined) ?? appName;

  const ask = async (history: Msg[]) => {
    setBusy("next");
    try {
      const { output, done } = await runFlagship<string>(toolId, "next", { inputs: inputsOf(def.fields, values), messages: history });
      draft.update((d) => ({ ...d, started: true, messages: done || !output ? history : [...history, { role: "assistant", content: output }] }));
    } catch (e) {
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const start = () => {
    const miss = missingFields(def.fields, values);
    if (miss.length) return toast.error(`Please fill: ${miss.map((f) => f.label).join(", ")}`);
    void ask([]);
  };

  const send = (skip = false) => {
    const text = skip ? "(I'd rather skip this one.)" : answer.trim();
    if (!text || busy) return;
    const history: Msg[] = [...messages, { role: "user", content: text }];
    draft.update((d) => ({ ...d, messages: history }));
    setAnswer("");
    if (history.filter((m) => m.role === "user").length >= def.maxAnswers) return;
    void ask(history);
  };

  const finish = async (instruction?: string) => {
    setBusy(instruction ? "refine" : "final");
    try {
      const { output } = await runFlagship<string>(toolId, "final", {
        inputs: inputsOf(def.fields, values),
        messages,
        ...(instruction ? { previous: r.output, instruction } : {}),
      });
      r.save(titleFor(), output, { values, messages }, instruction ? undefined : r.newId());
    } catch (e) {
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const restart = () => {
    draft.update({ values: emptyValues(def.fields), messages: [], started: false });
    r.reset();
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} steps={def.steps} related={def.related} syncState={r.store.syncState} wide>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
        <div className="space-y-4">
          {!started ? (
            <form
              className={card}
              onSubmit={(e) => {
                e.preventDefault();
                start();
              }}
            >
              <StepLabel n={2}>A few details before we begin</StepLabel>
              <FieldGrid toolId={toolId} fields={def.fields} values={values} onChange={setValues} sample={def.sample} disabled={!!busy} />
              <Button type="submit" className="mt-5 gap-2" disabled={!!busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircleHeart className="h-4 w-4" />} Start the interview (free)
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                {def.voice ? "Type or speak your answers. " : ""}The interview is free and saved as you go. You pay {def.credits} credits only when you make the finished result.
              </p>
            </form>
          ) : (
            <div className={cn(card, "flex flex-col p-0 sm:p-0")}>
              <div className="flex items-center justify-between border-b-2 border-ink px-4 py-2.5">
                <p className="text-[15px] font-bold">Interview</p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {answers} answer{answers === 1 ? "" : "s"} · {canFinish ? "ready when you are" : `${def.minAnswers - answers} more to go`}
                </p>
              </div>
              <div className="max-h-[55vh] space-y-3 overflow-y-auto p-4" aria-live="polite">
                {messages.map((m, i) => (
                  <div key={i} className={cn("max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[15px]", m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-sand")}>
                    {m.content}
                  </div>
                ))}
                {busy === "next" && (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking of the next question…
                  </p>
                )}
                <div ref={endRef} />
              </div>
              <form
                className="border-t-2 border-ink p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                {full ? (
                  <p className="text-sm font-semibold">That's everything we need. Make your result when you're ready.</p>
                ) : (
                  <div className="flex items-end gap-2">
                    {def.voice && <VoiceButton onText={(t) => setAnswer((a) => (a ? `${a} ${t}` : t))} />}
                    <Textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      rows={2}
                      placeholder={def.voice ? "Type, or tap the mic and speak…" : "Type your answer…"}
                      className="min-h-12 resize-none"
                      aria-label="Your answer"
                      disabled={busy === "next"}
                    />
                    <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={!!busy || !answer.trim()} aria-label="Send answer">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {!full && (
                    <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" onClick={() => send(true)} disabled={!!busy}>
                      <SkipForward className="h-3.5 w-3.5" /> Skip question
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" onClick={restart} disabled={!!busy}>
                    <RotateCcw className="h-3.5 w-3.5" /> Start over
                  </Button>
                </div>
              </form>
            </div>
          )}
          {started && (
            <Button className="w-full gap-2" size="lg" onClick={() => void finish()} disabled={!canFinish || !!busy}>
              {busy === "final" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
              {def.cta} · {def.credits} credits
            </Button>
          )}
          <HistoryList
            items={r.history}
            activeId={r.activeId}
            onOpen={(h) => {
              r.open(h);
              if (h.inputs?.messages) draft.update({ values: h.inputs.values, messages: h.inputs.messages, started: true });
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
              onRefine={(i) => void finish(i)}
              refining={busy === "refine"}
              onEdit={r.setOutput}
            />
          )}
          {!r.output && busy !== "final" && (
            <p className="mt-3 flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Your own words and details go into it. Nothing about you is made up.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
