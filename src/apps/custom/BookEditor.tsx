import { useState } from "react";
import { ArrowDown, ArrowUp, Download, FileCode, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "../shell/AppShell";
import { useAppStore, uid } from "../lib/store";
import { useRun } from "../lib/api";
import { downloadText, downloadWord, markdownToHtml } from "../lib/files";
import { APPS } from "../registry";
import { MarkdownEditor } from "./MarkdownEditor";

interface Chapter {
  id: string;
  title: string;
  text: string;
}
interface Book {
  title: string;
  author: string;
  synopsis: string;
  goal: string;
  chapters: Chapter[];
  savedAt?: number;
}

const ACTIONS = ["Outline this chapter", "Continue writing", "Rewrite more vividly", "Tighten the prose", "Fix grammar", "Suggest what happens next", "Translate to Hindi"];
const wc = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export default function BookEditor({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const htmlMode = toolId === "book-editor-html";
  const store = useAppStore<Book>(toolId, { title: "My book", author: "", synopsis: "", goal: "30000", chapters: [{ id: "c1", title: "Chapter 1", text: "" }] });
  const b = store.data;
  const chapters = b.chapters?.length ? b.chapters : [{ id: "c1", title: "Chapter 1", text: "" }];
  const [activeId, setActiveId] = useState(chapters[0].id);
  const active = chapters.find((c) => c.id === activeId) ?? chapters[0];
  const { busy, run } = useRun(toolId);
  const total = chapters.reduce((n, c) => n + wc(c.text), 0);
  const goal = parseInt(b.goal || "0", 10) || 0;

  const setChapters = (cs: Chapter[]) => store.update({ chapters: cs });
  const patch = (id: string, p: Partial<Chapter>) => setChapters(chapters.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const move = (i: number, d: number) => {
    const cs = [...chapters];
    const [x] = cs.splice(i, 1);
    cs.splice(i + d, 0, x);
    setChapters(cs);
  };

  const bookMd = () => `# ${b.title}\n\n${b.author ? `_by ${b.author}_\n\n` : ""}${chapters.map((c) => `## ${c.title}\n\n${c.text}`).join("\n\n---\n\n")}`;
  const bookHtml = () =>
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${b.title.replace(/</g, "&lt;")}</title><style>body{font-family:Georgia,serif;max-width:680px;margin:auto;padding:32px 20px;line-height:1.75;color:#222}h1{text-align:center;font-size:2.4em;margin:20vh 0 8px}h2{margin-top:3em;page-break-before:always}nav a{display:block;color:#555}hr{border:0;margin:3em}</style></head><body><h1>${b.title.replace(/</g, "&lt;")}</h1>${b.author ? `<p style="text-align:center"><em>by ${b.author.replace(/</g, "&lt;")}</em></p>` : ""}<nav><h3>Contents</h3>${chapters.map((c, i) => `<a href="#ch${i + 1}">${c.title.replace(/</g, "&lt;")}</a>`).join("")}</nav>${chapters.map((c, i) => `<section id="ch${i + 1}">${markdownToHtml(`## ${c.title}\n\n${c.text}`)}</section>`).join("")}</body></html>`;

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} syncState={store.syncState} wide>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)]">
        <aside className="space-y-3">
          <div className="space-y-2 rounded-2xl border-2 border-ink bg-card p-3">
            <Input value={b.title} onChange={(e) => store.update({ title: e.target.value })} className="font-semibold" aria-label="Book title" />
            <Input value={b.author} onChange={(e) => store.update({ author: e.target.value })} placeholder="Author" aria-label="Author" />
            <textarea value={b.synopsis} onChange={(e) => store.update({ synopsis: e.target.value })} rows={3} placeholder="One-paragraph synopsis (helps the AI stay consistent)" className="w-full rounded-xl border-2 border-input bg-card p-2 text-sm" aria-label="Synopsis" />
            <div className="flex items-center gap-2 text-xs">Goal <Input value={b.goal} onChange={(e) => store.update({ goal: e.target.value })} type="number" className="h-7 w-24" aria-label="Word goal" /> words</div>
            {goal > 0 && <><Progress value={Math.min(100, (total / goal) * 100)} className="h-1.5" /><p className="text-[11px] text-muted-foreground">{total.toLocaleString("en-IN")} / {goal.toLocaleString("en-IN")} words</p></>}
          </div>
          <div className="rounded-2xl border-2 border-ink bg-card p-2">
            <ol className="space-y-0.5">
              {chapters.map((c, i) => (
                <li key={c.id} className={`group flex items-center gap-1 rounded-lg ${c.id === active.id ? "bg-muted" : ""}`}>
                  <button type="button" className="min-w-0 flex-1 px-2 py-1.5 text-left text-sm" onClick={() => setActiveId(c.id)}>
                    <span className="block truncate">{c.title || `Chapter ${i + 1}`}</span>
                    <span className="text-[11px] text-muted-foreground">{wc(c.text)} words</span>
                  </button>
                  <div className="hidden gap-0.5 group-hover:flex">
                    {i > 0 && <button type="button" onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>}
                    {i < chapters.length - 1 && <button type="button" onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>}
                    {chapters.length > 1 && <button type="button" onClick={() => { setChapters(chapters.filter((x) => x.id !== c.id)); if (c.id === active.id) setActiveId(chapters[0].id); }} aria-label="Delete chapter"><Trash2 className="h-3.5 w-3.5" /></button>}
                  </div>
                </li>
              ))}
            </ol>
            <Button size="sm" variant="ghost" className="mt-1 w-full gap-1.5" onClick={() => { const c = { id: uid(), title: `Chapter ${chapters.length + 1}`, text: "" }; setChapters([...chapters, c]); setActiveId(c.id); }}><Plus className="h-3.5 w-3.5" /> Add chapter</Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => downloadWord(bookMd(), b.title || "book", b.title)}><Download className="h-3.5 w-3.5" /> Word</Button>
            <Button size="sm" variant="outline" onClick={() => downloadText(bookMd(), `${b.title || "book"}.md`, "text/markdown")}>Markdown</Button>
            {htmlMode && <Button size="sm" variant="outline" className="col-span-2 gap-1.5" onClick={() => downloadText(bookHtml(), `${b.title || "book"}.html`, "text/html")}><FileCode className="h-3.5 w-3.5" /> Web book (.html)</Button>}
          </div>
        </aside>
        <div className="min-w-0 space-y-3">
          <Input value={active.title} onChange={(e) => patch(active.id, { title: e.target.value })} className="h-11 text-lg font-semibold" aria-label="Chapter title" />
          <MarkdownEditor
            value={active.text}
            onChange={(v) => patch(active.id, { text: v })}
            busy={busy}
            actions={ACTIONS}
            appendActions={["Continue writing", "Outline this chapter", "Suggest what happens next"]}
            minHeight="60vh"
            placeholder="Write your chapter here…"
            onAi={(instruction, t) =>
              run<string>({
                inputs: {
                  Instruction: instruction,
                  Book: `${b.title}${b.synopsis ? ` — ${b.synopsis}` : ""}`.slice(0, 1500),
                  "Chapter title": active.title,
                  "Previous chapter (end)": (chapters[chapters.findIndex((c) => c.id === active.id) - 1]?.text ?? "").slice(-1500),
                  Chapter: t.slice(0, 6000),
                },
              })
            }
          />
          {htmlMode && <details className="rounded-2xl border-2 border-ink bg-card p-3"><summary className="cursor-pointer text-sm font-medium">HTML of this chapter</summary><pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border-2 border-ink/20 bg-sand p-2 text-xs">{markdownToHtml(`## ${active.title}\n\n${active.text}`)}</pre></details>}
        </div>
      </div>
    </AppShell>
  );
}
