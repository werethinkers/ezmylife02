import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Download, Loader2, Network, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "../shell/AppShell";
import { useAppStore } from "../lib/store";
import { useRun } from "../lib/api";
import { downloadText } from "../lib/files";
import { sendHandoff } from "../lib/handoff";
import { APPS } from "../registry";

interface Node {
  label: string;
  children?: Node[];
}

const COLORS = ["bg-sky-500/10 border-sky-500/40", "bg-emerald-500/10 border-emerald-500/40", "bg-amber-500/10 border-amber-500/40", "bg-rose-500/10 border-rose-500/40", "bg-violet-500/10 border-violet-500/40", "bg-teal-500/10 border-teal-500/40", "bg-orange-500/10 border-orange-500/40"];

const toMd = (n: Node, d = 0): string => `${d === 0 ? "# " : `${"  ".repeat(d - 1)}- `}${n.label}\n${(n.children ?? []).map((c) => toMd(c, d + 1)).join("")}`;
const toMermaid = (n: Node) => {
  const clean = (s: string) => s.replace(/[()[\]{}]/g, " ").trim() || "…";
  const walk = (x: Node, d: number): string => `${"  ".repeat(d + 1)}${d === 0 ? `root((${clean(x.label)}))` : clean(x.label)}\n${(x.children ?? []).map((c) => walk(c, d + 1)).join("")}`;
  return `mindmap\n${walk(n, 0)}`;
};

function Branch({ node, path, color, onChange, onRemove }: { node: Node; path: string; color: string; onChange: (n: Node) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(true);
  const kids = node.children ?? [];
  return (
    <li className="relative pl-5 before:absolute before:left-0 before:top-4 before:h-px before:w-4 before:bg-border">
      <div className="group flex items-center gap-1 py-1">
        {kids.length ? (
          <button type="button" onClick={() => setOpen(!open)} aria-label={open ? "Collapse" : "Expand"} className="text-muted-foreground">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : <span className="w-3.5" />}
        <input value={node.label} onChange={(e) => onChange({ ...node, label: e.target.value })} className={`min-w-0 rounded-lg border px-2 py-1 text-sm ${color}`} style={{ width: `${Math.max(6, node.label.length + 2)}ch` }} aria-label={`Branch ${path}`} />
        <button type="button" className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100" aria-label="Add sub-branch" onClick={() => onChange({ ...node, children: [...kids, { label: "New idea" }] })}><Plus className="h-3.5 w-3.5" /></button>
        <button type="button" className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100" aria-label="Remove branch" onClick={onRemove}><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      {open && kids.length > 0 && (
        <ul className="ml-2 border-l border-border">
          {kids.map((c, i) => (
            <Branch key={i} node={c} path={`${path}.${i + 1}`} color={color} onChange={(n) => onChange({ ...node, children: kids.map((k, j) => (j === i ? n : k)) })} onRemove={() => onChange({ ...node, children: kids.filter((_, j) => j !== i) })} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function MindMap({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const navigate = useNavigate();
  const store = useAppStore<{ map: Node | null; savedAt?: number }>(toolId, { map: null });
  const [topic, setTopic] = useState("");
  const { busy, run } = useRun(toolId);
  const map = store.data.map;

  const build = async () => {
    if (!topic.trim()) return toast.error("Enter a topic or paste some text.");
    const out = await run<{ root: string; branches: Node[] }>({ inputs: { "Topic or text": topic.slice(0, 6000) } });
    if (out?.root) store.update({ map: { label: out.root, children: out.branches ?? [] } });
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} syncState={store.syncState} wide>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
          <Textarea rows={6} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="A topic (e.g. 'Starting a cloud kitchen') or paste notes / a chapter to map" aria-label="Topic or text" />
          <Button className="w-full gap-2" onClick={build} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Build mind map</Button>
          <Button variant="outline" className="w-full" onClick={() => store.update({ map: { label: topic.trim() || "Central idea", children: [{ label: "Idea 1" }, { label: "Idea 2" }] } })}>Start a blank map (free)</Button>
          <p className="text-xs text-muted-foreground">Click any box to rename it; hover for + (add) and delete. Changes are saved automatically.</p>
        </div>
        <div className="min-w-0 overflow-x-auto rounded-2xl border border-border/60 bg-card p-4">
          {busy ? (
            <p className="flex min-h-[360px] items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mapping…</p>
          ) : map ? (
            <>
              <div className="mb-3 flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => downloadText(toMd(map), "mind-map.md", "text/markdown")}><Download className="h-3.5 w-3.5" /> Outline</Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { sendHandoff({ from: toolId, fromName: "MindMap", to: "smart-diagram-ai", text: toMermaid(map) }); navigate("/tool/smart-diagram-ai"); }}><Network className="h-3.5 w-3.5" /> Open as diagram</Button>
              </div>
              <div className="min-w-max">
                <input value={map.label} onChange={(e) => store.update({ map: { ...map, label: e.target.value } })} className="rounded-xl border-2 border-primary bg-primary/10 px-3 py-2 text-base font-bold" style={{ width: `${Math.max(10, map.label.length + 3)}ch` }} aria-label="Central idea" />
                <ul className="ml-4 mt-1 border-l border-border">
                  {(map.children ?? []).map((c, i) => (
                    <Branch key={i} node={c} path={`${i + 1}`} color={COLORS[i % COLORS.length]} onChange={(n) => store.update({ map: { ...map, children: (map.children ?? []).map((k, j) => (j === i ? n : k)) } })} onRemove={() => store.update({ map: { ...map, children: (map.children ?? []).filter((_, j) => j !== i) } })} />
                  ))}
                </ul>
                <Button size="sm" variant="ghost" className="ml-4 mt-2 gap-1.5" onClick={() => store.update({ map: { ...map, children: [...(map.children ?? []), { label: "New branch" }] } })}><Plus className="h-3.5 w-3.5" /> Add branch</Button>
              </div>
            </>
          ) : (
            <p className="flex min-h-[360px] items-center justify-center text-center text-sm text-muted-foreground">Your mind map appears here.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
