import { useEffect, useRef, useState } from "react";
import { Download, FileUp, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "../shell/AppShell";
import { useAppStore } from "../lib/store";
import { useRun } from "../lib/api";
import { downloadText, fileText, toCsv } from "../lib/files";
import { takeHandoff } from "../lib/handoff";
import { APPS } from "../registry";

interface Term {
  term: string;
  definition: string;
  example?: string;
}

export default function Glossary({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const store = useAppStore<{ terms: Term[]; source: string; savedAt?: number }>(toolId, { terms: [], source: "" });
  const [text, setText] = useState("");
  const [lang, setLang] = useState("English");
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { busy, run } = useRun(toolId);
  const terms = store.data.terms ?? [];

  useEffect(() => {
    const h = takeHandoff(toolId);
    if (h) setText(h.text);
  }, [toolId]);

  const extract = async () => {
    if (text.trim().length < 50) return toast.error("Paste a longer passage or add a file.");
    const out = await run<{ terms: Term[] }>({ inputs: { "Definition language": lang }, context: text.slice(0, 25000) });
    if (out?.terms) store.update({ terms: out.terms, source: text.slice(0, 80) });
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} syncState={store.syncState}>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
          <Textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a chapter, article or notes…" aria-label="Source text" />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()} disabled={reading}>{reading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />} From PDF / text file</Button>
            <input ref={fileRef} type="file" accept=".pdf,.txt,.md" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; setReading(true); try { setText((await fileText(f)).slice(0, 60000)); } catch (err) { toast.error(String(err)); } finally { setReading(false); } }} />
            <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Definition language">{["English", "Hindi", "Gujarati", "Marathi"].map((l) => <option key={l}>{l}</option>)}</select>
            <Button className="ml-auto gap-2" onClick={extract} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Build glossary</Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Up to ~25,000 characters are read per run.</p>
        </div>
        <div className="min-w-0 rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
            <p className="text-sm font-semibold">{terms.length ? `${terms.length} terms` : "Glossary"}</p>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" disabled={!terms.length} className="gap-1.5" onClick={() => downloadText(toCsv(terms as unknown as Record<string, unknown>[], [{ key: "term", label: "Term" }, { key: "definition", label: "Definition" }, { key: "example", label: "Example" }]), "glossary.csv", "text/csv")}><Download className="h-3.5 w-3.5" /> CSV</Button>
              <Button size="sm" variant="ghost" disabled={!terms.length} onClick={() => downloadText(terms.map((t) => `${t.term}\t${t.definition}`).join("\n"), "flashcards-anki.txt")}>Flashcards</Button>
            </div>
          </div>
          <dl className="max-h-[65vh] divide-y divide-border/50 overflow-y-auto">
            {terms.map((t, i) => (
              <div key={i} className="px-4 py-2.5">
                <dt className="font-semibold">{t.term}</dt>
                <dd className="text-sm text-muted-foreground">{t.definition}</dd>
                {t.example && <dd className="mt-0.5 text-xs italic text-muted-foreground">“{t.example}”</dd>}
              </div>
            ))}
            {!terms.length && <p className="p-8 text-center text-sm text-muted-foreground">Key terms with definitions appear here.</p>}
          </dl>
        </div>
      </div>
    </AppShell>
  );
}
