import { useEffect, useRef, useState } from "react";
import { ClipboardCheck, Loader2, PlayCircle, RotateCcw, Send, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/common/Markdown";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { cn } from "@/lib/utils";
import { AppShell } from "../shell/AppShell";
import { HistoryList } from "../shell/HistoryList";
import { StepLabel } from "../shell/StepLabel";
import { useAppStore } from "../lib/store";
import { NeedsCredits, errorText } from "../lib/api";
import { slug } from "../lib/files";
import type { FormValues } from "../types";
import type { CoachDef } from "../flagship/types";
import { runFlagship } from "../flagship/api";
import { FieldGrid, ResultView, VoiceButton, YouGet, card, emptyValues, inputsOf, missingFields } from "../flagship/parts";
import { OutputChoice } from "../output/OutputChoice";
import { useResults } from "../flagship/useResults";

interface Msg {
  role: "user" | "assistant";
  content: string;
}
interface Session {
  values?: FormValues;
  messages?: Msg[];
  ticket?: string;
  savedAt?: number;
}

const speakable = (md: string) => md.replace(/[#*_`>|-]/g, " ").replace(/\s+/g, " ").trim();

/** A paid coaching session: guided chat, typed or spoken, that ends with a scored summary. */
export default function CoachApp({ toolId, def }: { toolId: string; def: CoachDef }) {
  const { data: catalog = [] } = useToolsCatalog();
  const appName = catalog.find((t) => t.id === toolId)?.name ?? "Session";
  const r = useResults(toolId);
  const session = useAppStore<Session>(`${toolId}.session`, {});
  const values = session.data.values ?? emptyValues(def.fields);
  const messages = session.data.messages ?? [];
  const ticket = session.data.ticket;
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<"start" | "turn" | "wrap" | null>(null);
  const [aloud, setAloud] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const turns = messages.filter((m) => m.role === "user").length;
  const full = turns >= def.turns;
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, busy]);
  useEffect(() => () => (canSpeak ? window.speechSynthesis.cancel() : undefined), [canSpeak]);

  const say = (text: string) => {
    if (!aloud || !canSpeak) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(speakable(text).slice(0, 1200));
    u.lang = /[ऀ-ॿ]/.test(text) ? "hi-IN" : "en-IN";
    window.speechSynthesis.speak(u);
  };

  const setValues = (v: FormValues) => session.update((d) => ({ ...d, values: v }));

  const start = async () => {
    const miss = missingFields(def.fields, values);
    if (miss.length) return toast.error(`Please fill: ${miss.map((f) => f.label).join(", ")}`);
    setBusy("start");
    try {
      const res = await runFlagship<string>(toolId, "start", { inputs: inputsOf(def.fields, values) });
      session.update((d) => ({ ...d, ticket: res.ticket, messages: [{ role: "assistant", content: res.output }] }));
      r.reset();
      say(res.output);
    } catch (e) {
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy || !ticket || full) return;
    const history: Msg[] = [...messages, { role: "user", content: t }];
    session.update((d) => ({ ...d, messages: history }));
    setInput("");
    setBusy("turn");
    try {
      const { output } = await runFlagship<string>(toolId, "turn", { ticket, inputs: inputsOf(def.fields, values), messages: history });
      session.update((d) => ({ ...d, messages: [...history, { role: "assistant", content: output }] }));
      say(output);
    } catch (e) {
      session.update((d) => ({ ...d, messages }));
      setInput(t);
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const wrap = async () => {
    setBusy("wrap");
    try {
      const { output } = await runFlagship<string>(toolId, "wrap", { ticket, inputs: inputsOf(def.fields, values), messages });
      const title = (Object.values(values).find((v) => typeof v === "string" && v.trim()) as string | undefined) ?? appName;
      r.save(title, output, { values, messages }, r.newId());
      session.update((d) => ({ ...d, ticket: undefined }));
    } catch (e) {
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const newSession = () => {
    session.update({ values, messages: [], ticket: undefined });
    r.reset();
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} steps={def.steps} related={def.related} syncState={r.store.syncState} priceNote="per session" wide>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-4">
          {!ticket && !messages.length ? (
            <form
              className={card}
              onSubmit={(e) => {
                e.preventDefault();
                void start();
              }}
            >
              <StepLabel n={2}>Set up your session</StepLabel>
              <FieldGrid toolId={toolId} fields={def.fields} values={values} onChange={setValues} sample={def.sample} disabled={!!busy} />
              <OutputChoice toolId={toolId} className="mt-5" />
              <Button type="submit" className="mt-5 gap-2" disabled={!!busy}>
                {busy === "start" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                {def.cta} · {def.credits} credits
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                One session is up to {def.turns} replies{def.voice ? ", typed or spoken" : ""}, then a written summary you keep. Charged once, when the session starts.
              </p>
            </form>
          ) : (
            <div className={cn(card, "flex flex-col p-0 sm:p-0")}>
              <div className="flex items-center justify-between gap-2 border-b-2 border-ink px-4 py-2.5">
                <p className="text-[15px] font-bold">Session</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {turns} of {def.turns} replies
                  </span>
                  {canSpeak && (
                    <Button size="icon" variant={aloud ? "default" : "ghost"} className="h-8 w-8" onClick={() => setAloud((a) => !a)} aria-pressed={aloud} aria-label={aloud ? "Stop reading replies aloud" : "Read replies aloud"}>
                      {aloud ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
              <div className="max-h-[58vh] space-y-3 overflow-y-auto p-4" aria-live="polite">
                {messages.map((m, i) => (
                  <div key={i} className={cn("max-w-[88%] rounded-2xl px-3.5 py-2 text-[15px]", m.role === "user" ? "ml-auto whitespace-pre-wrap bg-primary text-primary-foreground" : "bg-sand")}>
                    {m.role === "user" ? m.content : <Markdown className="text-[15px] prose-p:my-1">{m.content}</Markdown>}
                  </div>
                ))}
                {busy === "turn" && (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                  </p>
                )}
                {messages.length <= 1 && ticket && (
                  <div className="flex flex-wrap gap-2">
                    {def.suggestions.map((s) => (
                      <button key={s} type="button" onClick={() => void send(s)} className="rounded-full border-2 border-ink/30 px-3 py-1.5 text-xs font-semibold hover:border-ink hover:bg-sun">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={endRef} />
              </div>
              {ticket ? (
                <form
                  className="border-t-2 border-ink p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send(input);
                  }}
                >
                  {full ? (
                    <p className="text-sm font-semibold">That's the end of this session. Get your summary below.</p>
                  ) : (
                    <div className="flex items-end gap-2">
                      {def.voice && <VoiceButton onText={(t) => setInput((a) => (a ? `${a} ${t}` : t))} />}
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void send(input);
                          }
                        }}
                        rows={2}
                        placeholder={def.voice ? "Type, or tap the mic and speak…" : "Type your reply…"}
                        className="min-h-12 resize-none"
                        aria-label="Your reply"
                      />
                      <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={!!busy || !input.trim()} aria-label="Send">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </form>
              ) : (
                <p className="border-t-2 border-ink p-3 text-sm text-muted-foreground">This session has ended.</p>
              )}
            </div>
          )}
          {(ticket || messages.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {ticket && (
                <Button className="flex-1 gap-2" onClick={wrap} disabled={!!busy || turns < 1}>
                  {busy === "wrap" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />} Finish and get my summary
                </Button>
              )}
              <Button variant="outline" className="gap-1.5" onClick={newSession} disabled={!!busy}>
                <RotateCcw className="h-4 w-4" /> New session
              </Button>
            </div>
          )}
          <HistoryList items={r.history} activeId={r.activeId} onOpen={r.open} onDelete={r.remove} />
        </div>
        <div id={`${toolId}-output`} className="min-w-0 scroll-mt-24">
          {busy === "wrap" || !r.output ? (
            <YouGet items={def.youGet} working={busy === "wrap"} title="What each session gives you" />
          ) : (
            <ResultView toolId={toolId} def={def} text={r.output} title={appName} fileName={`${def.fileName}-${slug(r.history.find((h) => h.id === r.activeId)?.title ?? appName)}`} onEdit={r.setOutput} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
