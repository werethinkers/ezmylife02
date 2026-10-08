import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ensureMermaid } from "@/lib/startupLibs";
import { AppShell } from "../shell/AppShell";
import { useAppStore } from "../lib/store";
import { useRun } from "../lib/api";
import { downloadBlob, downloadText } from "../lib/files";
import { APPS } from "../registry";
import { takeHandoff } from "../lib/handoff";

const TYPES = ["Flowchart", "Sequence diagram", "Mind map", "Timeline", "Gantt chart", "Org / class diagram", "ER diagram", "Pie chart"];
const START = "flowchart TD\n  A[Customer orders on WhatsApp] --> B{In stock?}\n  B -- Yes --> C[Pack & send]\n  B -- No --> D[Order from supplier]\n  D --> C";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mermaidApi = () => (window as any).mermaid as { render: (id: string, code: string) => Promise<{ svg: string }> } | undefined;

export default function SmartDiagram({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const store = useAppStore<{ code: string; title: string; savedAt?: number }>(toolId, { code: START, title: "Order flow" });
  const [desc, setDesc] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [svg, setSvg] = useState("");
  const [err, setErr] = useState("");
  const { busy, run } = useRun(toolId);
  const seq = useRef(0);
  const code = store.data.code ?? START;

  // A mind map (or any text) sent from another app.
  useEffect(() => {
    const h = takeHandoff(toolId);
    if (!h) return;
    if (/^\s*(mindmap|flowchart|graph|sequenceDiagram|timeline|gantt|pie|classDiagram|erDiagram)/.test(h.text)) store.update({ code: h.text, title: `From ${h.fromName}` });
    else setDesc(h.text.slice(0, 3000));
    toast.success(`Brought in from ${h.fromName}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId]);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try {
        await ensureMermaid();
        const m = mermaidApi();
        if (!m) throw new Error("Diagram engine did not load.");
        const { svg: out } = await m.render(`ez-diagram-${++seq.current}`, code);
        if (alive) {
          setSvg(out);
          setErr("");
        }
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message.split("\n")[0] : "This diagram code has an error.");
        document.querySelectorAll('[id^="dez-diagram-"]').forEach((n) => n.remove());
      }
    }, 350);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [code]);

  const generate = async () => {
    if (!desc.trim()) return toast.error("Describe what the diagram should show.");
    const out = await run<{ mermaid: string; title?: string }>({ inputs: { Description: desc, "Diagram type": type } });
    if (out?.mermaid) store.update({ code: out.mermaid.replace(/```(mermaid)?/g, "").trim(), title: out.title ?? desc.slice(0, 40) });
  };

  const png = () => {
    if (!svg) return;
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    img.onload = () => {
      const c = document.createElement("canvas");
      const s = 2;
      c.width = (img.naturalWidth || 1200) * s;
      c.height = (img.naturalHeight || 800) * s;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => b && downloadBlob(b, "diagram.png"));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} syncState={store.syncState} wide steps={["Describe it", "Generate", "Tweak the code, download"]}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
            <div className="space-y-1">
              <Label htmlFor="sd-desc" className="text-xs">Describe the diagram</Label>
              <Textarea id="sd-desc" rows={5} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Hiring process: job post → screening call → interview → trial day → offer; rejected candidates get a polite email" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className={`rounded-full border px-2.5 py-1 text-xs ${type === t ? "border-primary bg-primary/10" : "border-border text-muted-foreground"}`}>{t}</button>
              ))}
            </div>
            <Button className="w-full gap-2" onClick={generate} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate diagram</Button>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <Label htmlFor="sd-code" className="text-xs">Diagram code (Mermaid) — edit it directly</Label>
            <Textarea id="sd-code" rows={12} className="mt-1 font-mono text-xs" value={code} onChange={(e) => store.update({ code: e.target.value })} spellCheck={false} />
            {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
          </div>
        </div>
        <div className="min-w-0 rounded-2xl border border-border/60 bg-white p-4 dark:bg-white">
          <div className="mb-2 flex justify-end gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" disabled={!svg} onClick={() => downloadText(svg, "diagram.svg", "image/svg+xml")}><Download className="h-3.5 w-3.5" /> SVG</Button>
            <Button size="sm" variant="outline" className="gap-1.5" disabled={!svg} onClick={png}><Download className="h-3.5 w-3.5" /> PNG</Button>
          </div>
          <div className="flex min-h-[420px] items-center justify-center overflow-auto [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      </div>
    </AppShell>
  );
}
