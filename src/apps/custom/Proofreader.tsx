import { useState } from "react";
import { Check, Copy, Loader2, SpellCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "../shell/AppShell";
import { useRun } from "../lib/api";
import { APPS } from "../registry";

interface Result {
  corrected: string;
  changes: { original: string; fix: string; reason: string }[];
}

export default function Proofreader({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const [text, setText] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const { busy, run } = useRun(toolId);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const check = async () => {
    if (!text.trim()) return toast.error("Paste some text first.");
    const out = await run<Result>({ inputs: { Text: text.slice(0, 6000) } });
    if (out) setRes({ corrected: out.corrected ?? text, changes: Array.isArray(out.changes) ? out.changes : [] });
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} steps={["Paste text", "Check", "Accept the corrected version"]}>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-ink bg-card p-4">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={14} placeholder="Paste or type your text — English, हिन्दी or Hinglish…" aria-label="Text to check" maxLength={6000} />
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{words} words · {text.length}/6000</span>
            <Button onClick={check} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <SpellCheck className="h-4 w-4" />} Check text
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {res ? (
            <>
              <div className="rounded-2xl border-2 border-ink bg-card">
                <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
                  <p className="text-sm font-semibold">Corrected text</p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={async () => { await navigator.clipboard.writeText(res.corrected); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => { setText(res.corrected); toast.success("Replaced your text"); }}>Use this</Button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap p-4 text-sm leading-relaxed">{res.corrected}</p>
              </div>
              <div className="rounded-2xl border-2 border-ink bg-card p-4">
                <p className="text-sm font-semibold">{res.changes.length ? `${res.changes.length} change${res.changes.length === 1 ? "" : "s"}` : "No mistakes found 🎉"}</p>
                <ul className="mt-2 space-y-2">
                  {res.changes.map((c, i) => (
                    <li key={i} className="rounded-lg border-2 border-ink/20 bg-sand p-2 text-sm">
                      <span className="text-destructive line-through">{c.original}</span> → <span className="font-medium text-emerald-600 dark:text-emerald-400">{c.fix}</span>
                      {c.reason && <p className="mt-0.5 text-xs text-muted-foreground">{c.reason}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl border-2 border-dashed border-ink/60 bg-sand/60 p-6 text-center text-sm text-muted-foreground">
              Corrections appear here, with the reason for each change.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
