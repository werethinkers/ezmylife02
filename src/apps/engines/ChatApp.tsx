import { useEffect, useRef, useState } from "react";
import { Bot, FileText, Loader2, Paperclip, RotateCcw, Send, User, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Markdown } from "@/components/common/Markdown";
import { AppShell } from "../shell/AppShell";
import { useAppStore } from "../lib/store";
import { runApp, NeedsCredits, errorText } from "../lib/api";
import { fileText, downloadText } from "../lib/files";
import { takeHandoff } from "../lib/handoff";
import type { ChatAppDef } from "../types";

interface Msg {
  role: "user" | "assistant";
  content: string;
}
interface Doc {
  name: string;
  text: string;
}

const DOC_BUDGET = 60_000;

/** Chat with an assistant, optionally grounded in the user's own PDFs / text files. */
export default function ChatApp({ toolId, def }: { toolId: string; def: ChatAppDef }) {
  const store = useAppStore<{ messages: Msg[]; savedAt?: number }>(toolId, { messages: [] });
  const messages = store.data.messages ?? [];
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [reading, setReading] = useState<{ name: string; pct: number } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, busy]);

  useEffect(() => {
    const h = takeHandoff(toolId);
    if (h) {
      if (def.documents) setDocs((d) => [...d, { name: `From ${h.fromName}`, text: h.text }]);
      else setInput(h.text.slice(0, 2500));
      toast.success(`Brought in your result from ${h.fromName}`);
    }
  }, [toolId, def.documents]);

  const used = docs.reduce((n, d) => n + d.text.length, 0);

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      if (f.size > 40 * 1024 * 1024) {
        toast.error(`${f.name} is larger than 40 MB.`);
        continue;
      }
      try {
        setReading({ name: f.name, pct: 0 });
        const text = await fileText(f, (d, t) => setReading({ name: f.name, pct: Math.round((d / t) * 100) }));
        if (!text.trim()) toast.warning(`${f.name} has no selectable text (it may be scanned). Try the OCR app first.`);
        else setDocs((d) => [...d, { name: f.name, text }]);
      } catch (e) {
        toast.error(errorText(e));
      } finally {
        setReading(null);
      }
    }
  };

  const context = () => {
    if (!docs.length) return undefined;
    const per = Math.floor(DOC_BUDGET / docs.length);
    return docs.map((d) => `### Document: ${d.name}\n${d.text.slice(0, per)}`).join("\n\n");
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    store.update({ messages: next });
    setInput("");
    setBusy(true);
    try {
      const reply = await runApp<string>(toolId, { messages: next.slice(-10), context: context() });
      store.update({ messages: [...next, { role: "assistant", content: reply }] });
    } catch (e) {
      if (e instanceof NeedsCredits) {
        store.update({ messages });
        setInput(q);
      } else {
        store.update({ messages: [...next, { role: "assistant", content: `⚠️ ${errorText(e)}` }] });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} steps={def.steps} related={def.related} syncState={store.syncState}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <div className="flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" style={{ maxHeight: "65vh" }} aria-live="polite">
            {!messages.length && (
              <div className="py-6 text-center">
                <Bot className="mx-auto h-9 w-9 text-primary/70" />
                <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{def.welcome}</p>
                <div className="mx-auto mt-4 flex max-w-xl flex-wrap justify-center gap-2">
                  {def.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-border/70 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/60"}`}>
                  {m.role === "user" ? <span className="whitespace-pre-wrap">{m.content}</span> : <Markdown className="text-sm prose-p:my-1">{m.content}</Markdown>}
                </div>
                {m.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
              </p>
            )}
            <div ref={endRef} />
          </div>
          <form
            className="border-t border-border/50 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <div className="flex items-end gap-2">
              {def.documents && (
                <Button type="button" size="icon" variant="outline" className="h-10 w-10 shrink-0" onClick={() => fileRef.current?.click()} aria-label="Add documents">
                  <Paperclip className="h-4 w-4" />
                </Button>
              )}
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                rows={1}
                placeholder="Type your question… (Enter to send, Shift+Enter for a new line)"
                className="max-h-40 min-h-10 resize-none"
                aria-label="Your message"
              />
              <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={busy || !input.trim()} aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Each answer is one run at this app's price. Answers can be wrong — check important facts.</p>
          </form>
        </div>

        <aside className="space-y-3">
          {def.documents && (
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <p className="text-sm font-semibold">Your documents</p>
              <p className="mt-1 text-xs text-muted-foreground">{def.documentHint ?? "Add PDFs or text files. They are read in your browser and sent only with your questions."}</p>
              <input ref={fileRef} type="file" multiple accept=".pdf,.txt,.md,.csv,application/pdf,text/plain" className="hidden" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
              {reading && (
                <div className="mt-3 space-y-1">
                  <p className="truncate text-xs">Reading {reading.name}…</p>
                  <Progress value={reading.pct} className="h-1.5" />
                </div>
              )}
              <ul className="mt-3 space-y-1.5">
                {docs.map((d, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5 text-xs">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate">{d.name}</span>
                    <span className="text-muted-foreground">{Math.round(d.text.length / 1000)}k</span>
                    <button type="button" onClick={() => setDocs((x) => x.filter((_, j) => j !== i))} aria-label={`Remove ${d.name}`}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <Button size="sm" variant="outline" className="mt-3 w-full gap-1.5" onClick={() => fileRef.current?.click()}>
                <Paperclip className="h-3.5 w-3.5" /> Add files
              </Button>
              {used > DOC_BUDGET && <p className="mt-2 text-[11px] text-amber-600">Large documents: the first ~{Math.round(DOC_BUDGET / 1000)}k characters (shared across files) are used per question.</p>}
            </div>
          )}
          {messages.length > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => downloadText(messages.map((m) => `**${m.role === "user" ? "You" : "Assistant"}:** ${m.content}`).join("\n\n"), `${toolId}-chat.md`, "text/markdown")}>
                Save chat
              </Button>
              <Button size="sm" variant="ghost" className="flex-1 gap-1.5" onClick={() => store.update({ messages: [] })}>
                <RotateCcw className="h-3.5 w-3.5" /> New chat
              </Button>
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
