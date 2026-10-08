import { useMemo, useState } from "react";
import { BookA, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AppShell } from "../shell/AppShell";
import { useAppStore } from "../lib/store";
import { useRun } from "../lib/api";
import { APPS } from "../registry";

interface Entry {
  word: string;
  script?: string;
  meaning: string;
  context?: string;
}

const norm = (w: string) => w.replace(/[।॥,.;:!?"'()[\]{}“”‘’—–-]/g, "").toLowerCase();

export default function HoverDictionary({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const store = useAppStore<{ text: string; dict: Record<string, Entry>; lang: string; savedAt?: number }>(toolId, { text: "", dict: {}, lang: "Hindi" });
  const [editing, setEditing] = useState(!store.data.text);
  const [picked, setPicked] = useState<string[]>([]);
  const { busy, run } = useRun(toolId);
  const dict = store.data.dict ?? {};
  const text = store.data.text ?? "";
  const tokens = useMemo(() => text.split(/(\s+)/), [text]);

  const lookup = async (words: string[]) => {
    const list = Array.from(new Set(words.map(norm).filter((w) => w.length > 1 && !dict[w]))).slice(0, 40);
    if (!list.length) return toast.info("Those words are already looked up — tap them.");
    const out = await run<{ entries: Entry[] }>({ inputs: { Words: list.join(", "), "Meaning language": store.data.lang ?? "Hindi", "Passage (for context)": text.slice(0, 2000) } });
    if (out?.entries) {
      const next = { ...dict };
      out.entries.forEach((e) => (next[norm(e.word)] = e));
      store.update({ dict: next });
      setPicked([]);
    }
  };

  const keyWords = () => {
    const counts = new Map<string, number>();
    text.split(/\s+/).map(norm).filter((w) => w.length > 3).forEach((w) => counts.set(w, (counts.get(w) ?? 0) + 1));
    return [...counts.keys()].slice(0, 40);
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} syncState={store.syncState} steps={["Paste a passage", "Tap words you don't know", "Look them up — one run for up to 40 words"]}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          {editing ? (
            <>
              <Textarea rows={12} value={text} onChange={(e) => store.update({ text: e.target.value })} placeholder="Paste a passage — e.g. a gatha with its Hindi meaning, or any text with difficult words" className="font-serif text-base" aria-label="Passage" />
              <Button className="mt-3" onClick={() => setEditing(false)} disabled={!text.trim()}>Start reading</Button>
            </>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit passage</Button>
                <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={store.data.lang} onChange={(e) => store.update({ lang: e.target.value })} aria-label="Meaning language">{["Hindi", "English", "Gujarati"].map((l) => <option key={l}>{l}</option>)}</select>
                <Button size="sm" className="gap-1.5" disabled={busy || !picked.length} onClick={() => lookup(picked)}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookA className="h-3.5 w-3.5" />} Look up {picked.length || ""} selected</Button>
                <Button size="sm" variant="ghost" className="gap-1.5" disabled={busy} onClick={() => lookup(keyWords())}><Sparkles className="h-3.5 w-3.5" /> All key words</Button>
              </div>
              <p className="font-serif text-lg leading-loose">
                {tokens.map((t, i) => {
                  if (/^\s+$/.test(t)) return t;
                  const k = norm(t);
                  const e = dict[k];
                  if (e)
                    return (
                      <Popover key={i}>
                        <PopoverTrigger asChild><button type="button" className="rounded underline decoration-primary decoration-dotted underline-offset-4 hover:bg-primary/10">{t}</button></PopoverTrigger>
                        <PopoverContent className="w-72 text-sm">
                          <p className="font-semibold">{e.word}{e.script && e.script !== e.word ? ` · ${e.script}` : ""}</p>
                          <p className="mt-1">{e.meaning}</p>
                          {e.context && <p className="mt-1 text-xs text-muted-foreground">{e.context}</p>}
                        </PopoverContent>
                      </Popover>
                    );
                  const on = picked.includes(k);
                  return <button key={i} type="button" onClick={() => setPicked((p) => (on ? p.filter((x) => x !== k) : [...p, k]))} className={`rounded ${on ? "bg-amber-300/40" : "hover:bg-muted"}`}>{t}</button>;
                })}
              </p>
            </>
          )}
        </div>
        <aside className="rounded-2xl border border-border/60 bg-card p-3">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your word list ({Object.keys(dict).length})</p>
          <dl className="mt-2 max-h-[60vh] space-y-2 overflow-y-auto px-1 text-sm">
            {Object.values(dict).reverse().map((e) => <div key={e.word}><dt className="font-medium">{e.word}</dt><dd className="text-xs text-muted-foreground">{e.meaning}</dd></div>)}
            {!Object.keys(dict).length && <p className="text-xs text-muted-foreground">Words you look up are saved here and stay underlined in every passage.</p>}
          </dl>
        </aside>
      </div>
    </AppShell>
  );
}
