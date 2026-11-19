// Furniture Sheets: small UI parts in the Ezyourlife look (cream page, white cards, 2px ink outlines,
// hard shadows). Rows of items stay on one line and scroll sideways. Accordions start closed.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Camera, ImagePlus, Maximize2, Minimize2, Minus, Plus, ScanLine, Search, Sparkles, Trash2, UploadCloud, X } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Mat, Part } from "./lib";

// ─── One line, scrolls sideways ────────────────────────────────────────────────────────────
export function HScroll({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("no-scrollbar flex flex-nowrap items-stretch gap-3 overflow-x-auto pb-2 [scroll-snap-type:x_proximity]", className)}>{children}</div>;
}

// ─── Accordion panel (closed by default; the parent keeps one open at a time) ────────────
export function Panel({ id, title, hint, icon, children }: { id: string; title: string; hint?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <AccordionItem value={id} className="overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-block-sm data-[state=open]:shadow-block">
      <AccordionTrigger className="px-4 py-3.5 text-left hover:no-underline">
        <span className="flex min-w-0 items-center gap-3">
          {icon && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-sun">{icon}</span>}
          <span className="min-w-0">
            <span className="block font-display text-[15px] font-bold leading-tight">{title}</span>
            {hint && <span className="mt-0.5 block text-[13px] font-normal text-muted-foreground">{hint}</span>}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="border-t-2 border-ink/10 px-4 pb-4 pt-4">{children}</AccordionContent>
    </AccordionItem>
  );
}

// ─── Merlin search bar (same pill as the home page) ─────────────────────────────────────
export function MerlinBar({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      role="search"
      className={cn("flex items-center gap-2.5 rounded-full border-2 border-ink bg-card py-1.5 pl-2.5 pr-1.5 shadow-block focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", className)}
    >
      <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun">
        <Sparkles className="h-[18px] w-[18px]" />
      </span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 min-w-0 flex-1 border-0 bg-transparent px-1 text-[17px] font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      {value ? (
        <button type="button" onClick={() => onChange("")} aria-label="Clear search" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand hover:bg-sun">
          <X className="h-4 w-4" />
        </button>
      ) : (
        <span aria-hidden className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground"><Search className="h-4 w-4" /></span>
      )}
    </form>
  );
}

// ─── Photo drop zone: drag, browse, paste, camera ───────────────────────────────────────────
export function Dropzone({ onFiles, busy, max = 12 }: { onFiles: (files: File[]) => void; busy?: boolean; max?: number }) {
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const cam = useRef<HTMLInputElement>(null);

  const take = useCallback((list: FileList | File[] | null) => {
    const files = Array.from(list ?? []);
    const ok = files.filter((f) => /^image\//.test(f.type)).slice(0, max);
    setErr(files.length && !ok.length ? "Use JPG, PNG or WebP pictures." : files.length > max ? `Only the first ${max} pictures were added.` : "");
    if (ok.length) onFiles(ok);
  }, [onFiles, max]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = Array.from(e.clipboardData?.files ?? []);
      if (f.length) take(f);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [take]);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files); }}
        className={cn("block-card flex flex-col items-center gap-3 border-dashed p-6 text-center transition-colors", drag ? "bg-sun" : "bg-card")}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-ink bg-teal shadow-block-sm">
          <UploadCloud className="h-7 w-7" />
        </span>
        <div>
          <p className="font-display text-lg font-bold">Drop furniture photos here</p>
          <p className="mt-1 text-sm text-muted-foreground">Sofa, chair, table, bed, cabinet, trim. One photo or many. You can also paste a picture.</p>
        </div>
        <div className="no-scrollbar flex max-w-full flex-nowrap gap-2 overflow-x-auto">
          <Button type="button" disabled={busy} onClick={() => input.current?.click()} className="shrink-0">
            <ImagePlus className="mr-2 h-4 w-4" /> Choose photos
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => cam.current?.click()} className="shrink-0 border-2 border-ink">
            <Camera className="mr-2 h-4 w-4" /> Take a photo
          </Button>
        </div>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { take(e.target.files); e.target.value = ""; }} />
        <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { take(e.target.files); e.target.value = ""; }} />
      </div>
      {err && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {err}
        </p>
      )}
    </div>
  );
}

// ─── Before / after slider (drag, click, or arrow keys) ───────────────────────────────────
export function Compare({ before, after, beforeLabel = "Photo", afterLabel = "Result" }: { before: string; after: string; beforeLabel?: string; afterLabel?: string }) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const set = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (r) setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={box}
      className="relative aspect-[3/2] w-full touch-none select-none overflow-hidden rounded-2xl border-2 border-ink bg-card"
      onPointerDown={(e) => { drag.current = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); set(e.clientX); }}
      onPointerMove={(e) => drag.current && set(e.clientX)}
      onPointerUp={() => { drag.current = false; }}
    >
      <img src={after} alt={afterLabel} draggable={false} className="absolute inset-0 h-full w-full object-contain" />
      <div className="absolute inset-0 bg-card" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt={beforeLabel} draggable={false} className="h-full w-full object-contain" />
      </div>
      <span className="absolute left-3 top-3 rounded-full border-2 border-ink bg-card px-2.5 py-0.5 text-xs font-bold">{beforeLabel}</span>
      <span className="absolute right-3 top-3 rounded-full border-2 border-ink bg-sun px-2.5 py-0.5 text-xs font-bold">{afterLabel}</span>
      <div className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: `${pos}%` }}>
        <button
          type="button"
          role="slider"
          aria-label="Compare photo and result"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
            if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
          }}
          className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink bg-sun shadow-block-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ScanLine className="h-4 w-4 rotate-90" />
        </button>
      </div>
    </div>
  );
}

// ─── Zoom and pan viewer ────────────────────────────────────────────────────────────────────────
export function Viewer({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [z, setZ] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [full, setFull] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => { setZ(1); setPan({ x: 0, y: 0 }); }, [src]);
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === wrap.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const zoom = (d: number) => { setZ((v) => { const n = Math.min(6, Math.max(1, v + d)); if (n === 1) setPan({ x: 0, y: 0 }); return n; }); };
  const toggleFull = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void wrap.current?.requestFullscreen?.(); };

  return (
    <div ref={wrap} className={cn("relative overflow-hidden rounded-2xl border-2 border-ink bg-card", full && "rounded-none border-0", className)}>
      <div
        className={cn("flex h-full w-full touch-none items-center justify-center", z > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in")}
        onWheel={(e) => { if (e.ctrlKey || e.metaKey || z > 1) { e.preventDefault(); zoom(e.deltaY < 0 ? 0.4 : -0.4); } }}
        onDoubleClick={() => zoom(z > 1 ? -5 : 1.5)}
        onPointerDown={(e) => { if (z > 1) { drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } }}
        onPointerMove={(e) => { const d = drag.current; if (d) setPan({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y }); }}
        onPointerUp={() => { drag.current = null; }}
      >
        <img src={src} alt={alt} draggable={false} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${z})` }} className="max-h-full max-w-full select-none object-contain transition-transform duration-75" />
      </div>
      <div className="absolute bottom-3 right-3 flex gap-1.5 rounded-full border-2 border-ink bg-card p-1 shadow-block-sm">
        <button type="button" aria-label="Zoom out" onClick={() => zoom(-0.5)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-sun"><Minus className="h-4 w-4" /></button>
        <span className="flex min-w-[3rem] items-center justify-center text-xs font-bold">{Math.round(z * 100)}%</span>
        <button type="button" aria-label="Zoom in" onClick={() => zoom(0.5)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-sun"><Plus className="h-4 w-4" /></button>
        <button type="button" aria-label={full ? "Exit full screen" : "Full screen"} onClick={toggleFull} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-sun">
          {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Editable parts and materials ─────────────────────────────────────────────────────────────
const cell = "h-9 rounded-lg border-2 border-ink/20 bg-background px-2 text-[14px] focus-visible:ring-1";

export function BomEditor({ parts, materials, onParts, onMaterials }: { parts: Part[]; materials: Mat[]; onParts: (p: Part[]) => void; onMaterials: (m: Mat[]) => void }) {
  const setPart = (i: number, patch: Partial<Part>) => onParts(parts.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const setMat = (i: number, patch: Partial<Mat>) => onMaterials(materials.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const renumber = (list: Part[]) => list.map((p, i) => ({ ...p, item: i + 1 }));
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-bold">Parts list ({parts.length})</p>
        <div className="no-scrollbar overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-y-1.5 text-left text-sm">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <th className="w-8">No</th><th>Component</th><th>Material</th><th>Finish</th><th className="w-16">Qty</th><th>Notes</th><th className="w-9" />
              </tr>
            </thead>
            <tbody>
              {parts.map((p, i) => (
                <tr key={i}>
                  <td className="pr-1 font-bold">{p.item}</td>
                  <td className="pr-1"><Input className={cell} value={p.component} onChange={(e) => setPart(i, { component: e.target.value })} aria-label={`Part ${p.item} component`} /></td>
                  <td className="pr-1"><Input className={cell} value={p.material} onChange={(e) => setPart(i, { material: e.target.value })} aria-label={`Part ${p.item} material`} /></td>
                  <td className="pr-1"><Input className={cell} value={p.finish} onChange={(e) => setPart(i, { finish: e.target.value })} aria-label={`Part ${p.item} finish`} /></td>
                  <td className="pr-1"><Input className={cell} value={String(p.qty)} onChange={(e) => setPart(i, { qty: e.target.value })} aria-label={`Part ${p.item} quantity`} /></td>
                  <td className="pr-1"><Input className={cell} value={p.notes} onChange={(e) => setPart(i, { notes: e.target.value })} aria-label={`Part ${p.item} notes`} /></td>
                  <td>
                    <button type="button" aria-label={`Remove part ${p.item}`} onClick={() => onParts(renumber(parts.filter((_, j) => j !== i)))} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-coral hover:text-ink">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-1 border-2 border-ink" onClick={() => onParts([...parts, { item: parts.length + 1, component: "", material: "", finish: "", qty: 1, notes: "" }])}>
          <Plus className="mr-1.5 h-4 w-4" /> Add a part
        </Button>
      </div>
      <div>
        <p className="mb-2 text-sm font-bold">Materials and finishes ({materials.length})</p>
        <div className="space-y-1.5">
          {materials.map((m, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Input className={cn(cell, "w-16 shrink-0 font-bold")} value={m.code} onChange={(e) => setMat(i, { code: e.target.value })} aria-label={`Material ${i + 1} code`} />
              <Input className={cn(cell, "min-w-0 flex-1")} value={m.name} onChange={(e) => setMat(i, { name: e.target.value })} aria-label={`Material ${i + 1} name`} />
              <Input className={cn(cell, "hidden w-40 shrink-0 sm:block")} value={m.note} placeholder="Note" onChange={(e) => setMat(i, { note: e.target.value })} aria-label={`Material ${i + 1} note`} />
              <button type="button" aria-label={`Remove material ${m.code}`} onClick={() => onMaterials(materials.filter((_, j) => j !== i))} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-coral hover:text-ink">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2 border-2 border-ink" onClick={() => onMaterials([...materials, { code: `M${String(materials.length + 1).padStart(2, "0")}`, name: "", note: "" }])}>
          <Plus className="mr-1.5 h-4 w-4" /> Add a material
        </Button>
      </div>
    </div>
  );
}

export const Field = ({ label, children, className }: { label: string; children: ReactNode; className?: string }) => (
  <label className={cn("block", className)}>
    <span className="mb-1 block text-[13px] font-bold">{label}</span>
    {children}
  </label>
);
