import { useEffect, useState } from "react";
import { Download, Loader2, Monitor, Smartphone, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "../shell/AppShell";
import { useAppStore } from "../lib/store";
import { useRun } from "../lib/api";
import { downloadText } from "../lib/files";
import { APPS } from "../registry";

interface Proj {
  html: string;
  css: string;
  js: string;
  savedAt?: number;
}

const START: Proj = {
  html: '<main class="card">\n  <h1>Hello from EZYOURLIFE</h1>\n  <p>Edit the HTML, CSS and JS tabs — or ask the AI below.</p>\n  <button id="btn">Click me</button>\n</main>',
  css: "body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f5f7fb}\n.card{background:#fff;padding:32px;border-radius:16px;box-shadow:0 10px 30px #0001;max-width:420px}\nbutton{background:#4f46e5;color:#fff;border:0;padding:10px 16px;border-radius:10px;cursor:pointer}",
  js: 'document.getElementById("btn")?.addEventListener("click", () => alert("It works!"));',
};

const page = (p: Proj) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${p.css}</style></head><body>${p.html}<script>${p.js.replace(/<\/script/gi, "<\\/script")}</scr` + `ipt></body></html>`;

export default function HtmlEditor({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const store = useAppStore<Proj>(toolId, START);
  const p = { html: store.data.html ?? "", css: store.data.css ?? "", js: store.data.js ?? "" };
  const [tab, setTab] = useState<"html" | "css" | "js">("html");
  const [doc, setDoc] = useState(page(p));
  const [ask, setAsk] = useState("");
  const [mobile, setMobile] = useState(false);
  const { busy, run } = useRun(toolId);

  useEffect(() => {
    const t = setTimeout(() => setDoc(page(p)), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.html, p.css, p.js]);

  const ai = async () => {
    if (!ask.trim()) return toast.error("Tell the AI what to build or change.");
    const out = await run<{ html: string; css: string; js: string; note?: string }>({ inputs: { Instruction: ask, HTML: p.html.slice(0, 12000), CSS: p.css.slice(0, 8000), JavaScript: p.js.slice(0, 8000) } });
    if (out?.html !== undefined) {
      store.update({ html: out.html ?? "", css: out.css ?? "", js: out.js ?? "" });
      setAsk("");
      if (out.note) toast.success(out.note);
    }
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} syncState={store.syncState} wide>
      <form className="mb-4 flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-3 sm:flex-row" onSubmit={(e) => { e.preventDefault(); void ai(); }}>
        <Input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="e.g. Make a landing page for my bakery with a menu and WhatsApp order button" aria-label="Instruction for AI" />
        <Button type="submit" disabled={busy} className="gap-1.5 sm:w-auto">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Ask AI</Button>
      </form>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/50 p-2">
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList><TabsTrigger value="html">HTML</TabsTrigger><TabsTrigger value="css">CSS</TabsTrigger><TabsTrigger value="js">JS</TabsTrigger></TabsList>
            </Tabs>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => store.update(START)}>Reset</Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => downloadText(page(p), "page.html", "text/html")}><Download className="h-3.5 w-3.5" /> .html</Button>
            </div>
          </div>
          <textarea
            value={p[tab]}
            onChange={(e) => store.update({ [tab]: e.target.value } as Partial<Proj>)}
            spellCheck={false}
            className="min-h-[50vh] flex-1 resize-none bg-[#0f172a] p-3 font-mono text-xs leading-relaxed text-slate-100 outline-none"
            aria-label={`${tab.toUpperCase()} code`}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const el = e.currentTarget;
                const s = el.selectionStart;
                const v = el.value.slice(0, s) + "  " + el.value.slice(el.selectionEnd);
                store.update({ [tab]: v } as Partial<Proj>);
                requestAnimationFrame(() => el.setSelectionRange(s + 2, s + 2));
              }
            }}
          />
        </div>
        <div className="flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/50 p-2 text-xs text-muted-foreground">
            Live preview
            <div className="flex gap-1">
              <Button size="icon" variant={mobile ? "ghost" : "secondary"} className="h-7 w-7" onClick={() => setMobile(false)} aria-label="Desktop preview"><Monitor className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant={mobile ? "secondary" : "ghost"} className="h-7 w-7" onClick={() => setMobile(true)} aria-label="Mobile preview"><Smartphone className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <div className="flex flex-1 justify-center bg-muted/30">
            <iframe title="Preview" srcDoc={doc} sandbox="allow-scripts allow-modals allow-forms" className="h-full min-h-[50vh] border-0 bg-white" style={{ width: mobile ? 390 : "100%" }} />
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">One charge covers 30 minutes of editing; each "Ask AI" is one run. The preview runs in a locked sandbox.</p>
    </AppShell>
  );
}
