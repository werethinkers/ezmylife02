import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Plus, Trash2, Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppShell } from "../shell/AppShell";
import { useAppStore } from "../lib/store";
import { downloadBlob, downloadText, slug } from "../lib/files";

/*
 * A study mind map: one topic in the centre, branches for its main ideas, points under each
 * branch for the detail. Everything happens in the browser — nothing is sent anywhere — so a
 * student can plan a chapter or an essay between classes and come back to find it saved.
 */

type Point = { id: string; label: string };
type Branch = { id: string; label: string; color: ColorKey; points: Point[] };
type MapData = { topic: string; branches: Branch[]; savedAt?: number };

const COLOR_KEYS = ["pink", "sun", "teal", "sky", "lime", "coral"] as const;
type ColorKey = (typeof COLOR_KEYS)[number];

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const EXAMPLE: MapData = {
  topic: "Cell structure",
  branches: [
    { id: uid(), label: "Cell membrane", color: "pink", points: [{ id: uid(), label: "Controls what enters and leaves" }, { id: uid(), label: "Made of a lipid bilayer" }] },
    { id: uid(), label: "Nucleus", color: "sun", points: [{ id: uid(), label: "Holds DNA" }, { id: uid(), label: "Controls cell activity" }] },
    { id: uid(), label: "Mitochondria", color: "teal", points: [{ id: uid(), label: "Releases energy (respiration)" }, { id: uid(), label: "\"Powerhouse of the cell\"" }] },
    { id: uid(), label: "Cytoplasm", color: "sky", points: [{ id: uid(), label: "Jelly-like substance" }, { id: uid(), label: "Where reactions happen" }] },
    { id: uid(), label: "Ribosomes", color: "lime", points: [{ id: uid(), label: "Make proteins" }] },
  ],
};

const COLOR_CLASS: Record<ColorKey, string> = { pink: "bg-pink", sun: "bg-sun", teal: "bg-teal", sky: "bg-sky", lime: "bg-lime", coral: "bg-coral" };

function useThemeColors() {
  const [vars, setVars] = useState<Record<string, string>>({});
  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const read = (name: string) => style.getPropertyValue(name).trim();
    setVars({
      ink: read("--ink") || "0 0% 7%",
      card: read("--card") || "0 0% 100%",
      pink: read("--pink"),
      sun: read("--sun"),
      teal: read("--teal"),
      sky: read("--sky"),
      lime: read("--lime"),
      coral: read("--coral"),
    });
  }, []);
  const hsl = (key: string) => `hsl(${vars[key] || "0 0% 70%"})`;
  return { hsl, ready: Object.keys(vars).length > 0 };
}

function wrap(text: string, maxChars = 15, maxLines = 2): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
    if (lines.length === maxLines - 1 && cur.length > maxChars) break;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) lines.length = maxLines;
  const last = lines[lines.length - 1];
  if (last && (words.join(" ").length > lines.join(" ").length)) lines[lines.length - 1] = last.length > maxChars - 1 ? `${last.slice(0, maxChars - 1)}…` : `${last}…`;
  return lines.length ? lines : [""];
}

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

export default function MindMapMaker({ toolId }: { toolId: string }) {
  const store = useAppStore<MapData>(toolId, EXAMPLE);
  const data = store.data.topic ? store.data : EXAMPLE;
  const { topic, branches } = data;
  const { hsl, ready } = useThemeColors();
  const svgRef = useRef<SVGSVGElement>(null);
  const [newBranch, setNewBranch] = useState("");

  const setTopic = (topic: string) => store.update({ topic });
  const addBranch = () => {
    const label = newBranch.trim();
    if (!label) return;
    const color = COLOR_KEYS[branches.length % COLOR_KEYS.length];
    store.update({ branches: [...branches, { id: uid(), label, color, points: [] }] });
    setNewBranch("");
  };
  const removeBranch = (id: string) => store.update({ branches: branches.filter((b) => b.id !== id) });
  const renameBranch = (id: string, label: string) => store.update({ branches: branches.map((b) => (b.id === id ? { ...b, label } : b)) });
  const addPoint = (branchId: string, label: string) => {
    if (!label.trim()) return;
    store.update({ branches: branches.map((b) => (b.id === branchId ? { ...b, points: [...b.points, { id: uid(), label: label.trim() }] } : b)) });
  };
  const removePoint = (branchId: string, pointId: string) =>
    store.update({ branches: branches.map((b) => (b.id === branchId ? { ...b, points: b.points.filter((p) => p.id !== pointId) } : b)) });
  const resetExample = () => store.update({ ...EXAMPLE, topic: `${EXAMPLE.topic}` });

  // Layout: topic in the middle, branches on a ring around it, points one ring further out.
  // Square canvas, radii clamped to the canvas so the outer ring never clips the edge.
  const W = 1000, H = 1000, cx = W / 2, cy = H / 2;
  const maxR = Math.min(cx, cy) - 90;
  const layout = useMemo(() => {
    const n = branches.length;
    const branchR = Math.min(n <= 3 ? 190 : n <= 6 ? 220 : 250, maxR * 0.55);
    const nodes = branches.map((b, i) => {
      const angle = n ? (360 / n) * i : 0;
      const pos = polar(cx, cy, branchR, angle);
      const arc = Math.min(50, 360 / Math.max(n, 1) - 8);
      const points = b.points.map((p, j, arr) => {
        const spread = arr.length > 1 ? arc : 0;
        const pAngle = angle - spread / 2 + (arr.length > 1 ? (spread / (arr.length - 1)) * j : 0);
        const pr = Math.min(branchR + (p.label.length > 16 ? 150 : 120), maxR);
        return { ...p, ...polar(cx, cy, pr, pAngle) };
      });
      return { ...b, x: pos.x, y: pos.y, points };
    });
    return nodes;
  }, [branches, cx, cy, maxR]);

  const exportPng = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--background").trim() || "40 38% 95%"})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => b && downloadBlob(b, `${slug(topic || "mind-map")}.png`));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => toast.error("Could not export the image. Try again.");
    img.src = url;
  };

  const copyOutline = async () => {
    const lines = [topic, ...branches.flatMap((b) => [`- ${b.label}`, ...b.points.map((p) => `  - ${p.label}`)])];
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Outline copied — paste it into your notes.");
    } catch {
      downloadText(text, `${slug(topic || "mind-map")}.txt`);
    }
  };

  return (
    <AppShell
      toolId={toolId}
      intro="Plan a chapter, an essay or a revision topic as a mind map. Add branches and points — it draws itself, and saves as you go."
      related={["flashcard-maker", "quiz-maker", "study-planner", "smart-diagram-ai"]}
      syncState={store.syncState}
      wide
      steps={["Type your topic", "Add branches and points", "Export or copy it"]}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        {/* Editor */}
        <div className="space-y-4">
          <div className="block-card space-y-2 bg-card p-4">
            <Label htmlFor="mm-topic" className="text-xs">Topic</Label>
            <Input id="mm-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. French Revolution" className="border-2 border-ink font-display font-bold" />
          </div>

          <div className="block-card space-y-3 bg-card p-4">
            <Label className="text-xs">Branches (the main ideas)</Label>
            <div className="flex gap-2">
              <Input
                value={newBranch}
                onChange={(e) => setNewBranch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addBranch()}
                placeholder="Add a branch, e.g. Causes"
                className="border-2 border-ink"
              />
              <Button type="button" onClick={addBranch} className="shrink-0 gap-1.5"><Plus className="h-4 w-4" /> Add</Button>
            </div>

            <div className="space-y-3">
              {branches.map((b) => (
                <BranchEditor key={b.id} branch={b} onRename={(l) => renameBranch(b.id, l)} onRemove={() => removeBranch(b.id)} onAddPoint={(l) => addPoint(b.id, l)} onRemovePoint={(id) => removePoint(b.id, id)} />
              ))}
              {branches.length === 0 && <p className="text-sm text-muted-foreground">No branches yet — add your first main idea above.</p>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="gap-1.5 border-2 border-ink" onClick={copyOutline}><Copy className="h-3.5 w-3.5" /> Copy as outline</Button>
            <Button type="button" variant="outline" className="gap-1.5 border-2 border-ink" onClick={exportPng}><Download className="h-3.5 w-3.5" /> Save as image</Button>
            <Button type="button" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={resetExample}><RotateCcw className="h-3.5 w-3.5" /> Load example</Button>
          </div>
        </div>

        {/* Map */}
        <div className="block-card min-w-0 bg-card p-2 sm:p-4">
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" style={{ minHeight: 360 }} role="img" aria-label={`Mind map for ${topic || "your topic"}`}>
            <rect x={0} y={0} width={W} height={H} fill="none" />
            {ready &&
              layout.map((b) => (
                <g key={b.id}>
                  <line x1={cx} y1={cy} x2={b.x} y2={b.y} stroke={hsl("ink")} strokeWidth={2} strokeOpacity={0.55} />
                  {b.points.map((p) => (
                    <line key={p.id} x1={b.x} y1={b.y} x2={p.x} y2={p.y} stroke={hsl("ink")} strokeWidth={1.5} strokeOpacity={0.35} strokeDasharray="3 3" />
                  ))}
                </g>
              ))}
            {ready && (
              <TopicNode x={cx} y={cy} label={topic || "Your topic"} fill={hsl("sun")} stroke={hsl("ink")} />
            )}
            {ready &&
              layout.map((b) => (
                <g key={`n-${b.id}`}>
                  <BranchNode x={b.x} y={b.y} label={b.label} fill={hsl(b.color)} stroke={hsl("ink")} />
                  {b.points.map((p) => (
                    <PointNode key={p.id} x={p.x} y={p.y} label={p.label} fill={hsl("card")} stroke={hsl("ink")} />
                  ))}
                </g>
              ))}
          </svg>
        </div>
      </div>
    </AppShell>
  );
}

function BranchEditor({ branch, onRename, onRemove, onAddPoint, onRemovePoint }: { branch: Branch; onRename: (label: string) => void; onRemove: () => void; onAddPoint: (label: string) => void; onRemovePoint: (id: string) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-2 rounded-xl border-2 border-ink p-3">
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 shrink-0 rounded-full border border-ink ${COLOR_CLASS[branch.color]}`} aria-hidden />
        <Input value={branch.label} onChange={(e) => onRename(e.target.value)} className="h-8 border-ink/30 px-2 text-sm font-semibold" />
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={onRemove} aria-label={`Remove ${branch.label}`}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ul className="space-y-1 pl-5">
        {branch.points.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span className="min-w-0 truncate">• {p.label}</span>
            <button type="button" onClick={() => onRemovePoint(p.id)} className="shrink-0 text-xs text-muted-foreground/70 hover:text-destructive" aria-label={`Remove point ${p.label}`}>
              remove
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-1.5 pl-5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onAddPoint(draft);
              setDraft("");
            }
          }}
          placeholder="Add a point"
          className="h-8 border-ink/30 text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0 border-ink/30 px-2"
          onClick={() => {
            onAddPoint(draft);
            setDraft("");
          }}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function TopicNode({ x, y, label, fill, stroke }: { x: number; y: number; label: string; fill: string; stroke: string }) {
  const lines = wrap(label, 16, 2);
  const w = Math.max(150, Math.max(...lines.map((l) => l.length)) * 10 + 32);
  const h = 30 + lines.length * 22;
  return (
    <g>
      <rect x={x - w / 2 + 3} y={y - h / 2 + 3} width={w} height={h} rx={16} fill={stroke} opacity={0.9} />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={16} fill={fill} stroke={stroke} strokeWidth={2.5} />
      {lines.map((l, i) => (
        <text key={i} x={x} y={y - ((lines.length - 1) * 11) + i * 22 + 2} textAnchor="middle" dominantBaseline="middle" fontFamily="Unbounded, Hind, sans-serif" fontWeight={700} fontSize={16} fill={stroke}>
          {l}
        </text>
      ))}
    </g>
  );
}

function BranchNode({ x, y, label, fill, stroke }: { x: number; y: number; label: string; fill: string; stroke: string }) {
  const lines = wrap(label, 14, 2);
  const w = Math.max(110, Math.max(...lines.map((l) => l.length)) * 8.5 + 24);
  const h = 24 + lines.length * 18;
  return (
    <g>
      <rect x={x - w / 2 + 2} y={y - h / 2 + 2} width={w} height={h} rx={12} fill={stroke} opacity={0.85} />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={12} fill={fill} stroke={stroke} strokeWidth={2} />
      {lines.map((l, i) => (
        <text key={i} x={x} y={y - ((lines.length - 1) * 9) + i * 18 + 1} textAnchor="middle" dominantBaseline="middle" fontFamily="Hind, sans-serif" fontWeight={700} fontSize={13} fill={stroke}>
          {l}
        </text>
      ))}
    </g>
  );
}

function PointNode({ x, y, label, fill, stroke }: { x: number; y: number; label: string; fill: string; stroke: string }) {
  const lines = wrap(label, 18, 2);
  const w = Math.max(90, Math.max(...lines.map((l) => l.length)) * 6.6 + 18);
  const h = 18 + lines.length * 14;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={8} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {lines.map((l, i) => (
        <text key={i} x={x} y={y - ((lines.length - 1) * 7) + i * 14 + 1} textAnchor="middle" dominantBaseline="middle" fontFamily="Hind, sans-serif" fontSize={10.5} fill={stroke}>
          {l}
        </text>
      ))}
    </g>
  );
}
