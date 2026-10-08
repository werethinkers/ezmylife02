import { useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, ImagePlus, Loader2, Printer, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "../shell/AppShell";
import { useAppStore, uid } from "../lib/store";
import { useRun } from "../lib/api";
import { APPS } from "../registry";
import { DEFAULT_PRICES } from "../prices";

interface Page {
  text: string;
  illustration: string;
  image?: string;
}
interface Story {
  id: string;
  title: string;
  pages: Page[];
  at: number;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default function StoryBook({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const store = useAppStore<{ stories: Story[]; savedAt?: number }>(toolId, { stories: [] });
  const [form, setForm] = useState({ theme: "", age: "4–6 years", characters: "", lesson: "", pages: "8", language: "English" });
  const [story, setStory] = useState<Story | null>(null);
  const [page, setPage] = useState(0);
  const write = useRun(toolId);
  const draw = useRun("storybook-illustration");

  const saveStory = (s: Story) => store.update((d) => ({ stories: [s, ...(d.stories ?? []).filter((x) => x.id !== s.id)].slice(0, 12) }));

  const create = async () => {
    if (!form.theme.trim()) return toast.error("What should the story be about?");
    const out = await write.run<{ title: string; pages: Page[] }>({
      inputs: { Theme: form.theme, "Age group": form.age, Characters: form.characters, "Lesson / value": form.lesson, "Number of pages": form.pages, Language: form.language },
    });
    if (out?.pages?.length) {
      const s = { id: uid(), title: out.title || form.theme, pages: out.pages.slice(0, 16), at: Date.now() };
      setStory(s);
      setPage(0);
      saveStory(s);
    } else if (out) toast.error("The story came back incomplete — please try again with a little more detail.");
  };

  const illustrate = async () => {
    if (!story) return;
    const pg = story.pages[page];
    const out = await draw.run<string>({ prompt: `Children's picture-book illustration, soft colours, no text in the image. ${pg.illustration}`, style: "storybook watercolour", aspect: "4:3" });
    if (out) {
      // Images are kept in this browser only (they are large); the story text syncs to your account.
      const pages = story.pages.map((p, i) => (i === page ? { ...p, image: out } : p));
      setStory({ ...story, pages });
    }
  };

  const print = () => {
    if (!story) return;
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return toast.error("Allow pop-ups to print.");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(story.title)}</title><style>body{font-family:Georgia,serif;max-width:720px;margin:auto;padding:24px}h1{text-align:center;margin:40vh 0}section{page-break-before:always;padding-top:24px}img{max-width:100%;border-radius:12px}p{font-size:18px;line-height:1.6}</style></head><body><h1>${esc(story.title)}</h1>${story.pages.map((p, i) => `<section>${p.image ? `<img src="${p.image}" alt="">` : ""}<p>${esc(p.text).replace(/\n/g, "<br>")}</p><small>${i + 1}</small></section>`).join("")}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const cur = story?.pages[page];

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} syncState={store.syncState}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div className="space-y-4">
          <form className="space-y-3 rounded-2xl border border-border/60 bg-card p-4" onSubmit={(e) => { e.preventDefault(); void create(); }}>
            <div className="space-y-1"><Label htmlFor="sb-theme" className="text-xs">Story about *</Label><Textarea id="sb-theme" rows={2} value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} placeholder="A little elephant who is afraid of water" /></div>
            <div className="space-y-1"><Label htmlFor="sb-char" className="text-xs">Characters</Label><Input id="sb-char" value={form.characters} onChange={(e) => setForm({ ...form, characters: e.target.value })} placeholder="Gajju the elephant, his friend Mina the parrot" /></div>
            <div className="space-y-1"><Label htmlFor="sb-lesson" className="text-xs">Lesson / value</Label><Input id="sb-lesson" value={form.lesson} onChange={(e) => setForm({ ...form, lesson: e.target.value })} placeholder="Courage, kindness, sharing…" /></div>
            <div className="grid grid-cols-3 gap-2">
              {([["age", "Age", ["2–4 years", "4–6 years", "6–8 years", "8–12 years"]], ["pages", "Pages", ["4", "6", "8", "10", "12"]], ["language", "Language", ["English", "Hindi", "Hinglish", "Gujarati"]]] as const).map(([k, l, opts]) => (
                <div key={k} className="space-y-1">
                  <Label htmlFor={`sb-${k}`} className="text-xs">{l}</Label>
                  <select id={`sb-${k}`} className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}>
                    {opts.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <Button type="submit" className="w-full gap-2" disabled={write.busy}>{write.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Write the story</Button>
          </form>
          {(store.data.stories ?? []).length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-3">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your stories</p>
              <ul className="mt-2 space-y-1">
                {(store.data.stories ?? []).map((s) => (
                  <li key={s.id} className="flex items-center gap-1">
                    <button type="button" className="min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted" onClick={() => { setStory(s); setPage(0); }}>{s.title}</button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Delete story" onClick={() => store.update((d) => ({ stories: (d.stories ?? []).filter((x) => x.id !== s.id) }))}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="min-w-0">
          {write.busy ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-border/60 bg-card text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Writing your story…</div>
          ) : story && cur ? (
            <div className="overflow-hidden rounded-3xl border border-border/60 bg-[hsl(40_60%_97%)] text-stone-800 dark:bg-stone-900 dark:text-stone-100">
              <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5 dark:border-white/10">
                <p className="truncate font-serif text-lg font-bold">{story.title}</p>
                <Button size="sm" variant="ghost" className="gap-1.5" onClick={print}><Printer className="h-3.5 w-3.5" /> Print book</Button>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2 md:p-8">
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-white/70 dark:bg-white/5">
                  {draw.busy ? <Loader2 className="h-6 w-6 animate-spin" /> : cur.image ? <img src={cur.image} alt={cur.illustration} className="h-full w-full object-cover" /> : (
                    <div className="p-4 text-center">
                      <p className="text-xs italic opacity-70">{cur.illustration}</p>
                      <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={illustrate}><ImagePlus className="h-3.5 w-3.5" /> Illustrate · {DEFAULT_PRICES["storybook-illustration"]} credits</Button>
                    </div>
                  )}
                </div>
                <p className="whitespace-pre-wrap font-serif text-lg leading-relaxed">{cur.text}</p>
              </div>
              <div className="flex items-center justify-between border-t border-black/5 px-4 py-2.5 dark:border-white/10">
                <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /> Back</Button>
                <span className="text-xs">Page {page + 1} of {story.pages.length}</span>
                <Button size="sm" variant="ghost" disabled={page >= story.pages.length - 1} onClick={() => setPage(page + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              <BookOpen className="mb-2 h-8 w-8 text-primary/60" /> Your book opens here. Writing the story is {def.credits} credits; each illustration is optional.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
