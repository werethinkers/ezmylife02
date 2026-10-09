import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/common/Markdown";
import { useRun } from "../lib/api";

/** A compact Q&A box for apps that pair a tool with an AI tutor. */
export function MiniChat({ toolId, title, suggestions, contextNote }: { toolId: string; title: string; suggestions: string[]; contextNote?: string }) {
  const [msgs, setMsgs] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [q, setQ] = useState("");
  const { busy, run } = useRun(toolId);
  const ask = async (text: string) => {
    if (!text.trim() || busy) return;
    const next = [...msgs, { role: "user" as const, content: text.trim() }];
    setMsgs(next);
    setQ("");
    const out = await run<string>({ messages: next.slice(-8), context: contextNote });
    setMsgs(out ? [...next, { role: "assistant", content: out }] : msgs);
    if (!out) setQ(text);
  };
  return (
    <div className="flex flex-col rounded-2xl border-2 border-ink bg-card">
      <p className="border-b border-border/50 px-4 py-2.5 text-sm font-semibold">{title}</p>
      <div className="max-h-[50vh] min-h-[160px] space-y-3 overflow-y-auto p-4 text-sm" aria-live="polite">
        {!msgs.length && <div className="flex flex-wrap gap-1.5">{suggestions.map((s) => <button key={s} type="button" onClick={() => ask(s)} className="rounded-full border border-border/70 px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground">{s}</button>)}</div>}
        {msgs.map((m, i) => <div key={i} className={m.role === "user" ? "ml-8 rounded-2xl bg-primary px-3 py-2 text-primary-foreground" : "mr-4 rounded-2xl bg-muted/60 px-3 py-2"}>{m.role === "user" ? m.content : <Markdown className="text-sm prose-p:my-1">{m.content}</Markdown>}</div>)}
        {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <form className="flex gap-2 border-t border-border/50 p-2.5" onSubmit={(e) => { e.preventDefault(); void ask(q); }}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask a question…" className="h-9" aria-label="Question" />
        <Button type="submit" size="icon" className="h-9 w-9" disabled={busy || !q.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
