import { useRef, useState } from "react";
import { Crop, Download, FileUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppShell } from "../shell/AppShell";
import { dataUrlToBlob, downloadBlob, openPdf, pdfPageImage } from "../lib/files";
import { APPS } from "../registry";

export default function PdfImages({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [doc, setDoc] = useState<any>(null);
  const [name, setName] = useState("");
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [quality, setQuality] = useState(2000);
  const [working, setWorking] = useState("");
  const [crop, setCrop] = useState<{ page: number; url: string } | null>(null);
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const open = async (f: File) => {
    try {
      const d = await openPdf(f);
      setDoc(d);
      setName(f.name.replace(/\.pdf$/i, ""));
      setSel(new Set());
      const n = Math.min(d.numPages, 150);
      const out: string[] = [];
      for (let i = 1; i <= n; i++) {
        setWorking(`Loading page ${i} of ${n}…`);
        out.push(await pdfPageImage(d, i, 360));
        if (i % 6 === 0 || i === n) setThumbs([...out]);
      }
    } catch {
      toast.error("That file couldn't be opened as a PDF.");
    } finally {
      setWorking("");
    }
  };

  const exportPages = async (pages: number[]) => {
    if (!pages.length) return;
    if (pages.length === 1) {
      setWorking("Rendering…");
      downloadBlob(await dataUrlToBlob(await pdfPageImage(doc, pages[0], quality)), `${name}-page-${pages[0]}.jpg`);
      setWorking("");
      return;
    }
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    for (const [i, p] of pages.entries()) {
      setWorking(`Rendering ${i + 1} of ${pages.length}…`);
      zip.file(`${name}-page-${p}.jpg`, await dataUrlToBlob(await pdfPageImage(doc, p, quality)));
    }
    setWorking("Zipping…");
    downloadBlob(await zip.generateAsync({ type: "blob" }), `${name}-pages.zip`);
    setWorking("");
  };

  const pos = (e: React.PointerEvent) => {
    const r = imgRef.current!.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) };
  };

  const saveCrop = () => {
    if (!crop || !rect || rect.w < 0.02 || rect.h < 0.02) return toast.error("Drag over the chart or figure first.");
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = Math.round(rect.w * img.naturalWidth);
      c.height = Math.round(rect.h * img.naturalHeight);
      c.getContext("2d")!.drawImage(img, rect.x * img.naturalWidth, rect.y * img.naturalHeight, c.width, c.height, 0, 0, c.width, c.height);
      c.toBlob((b) => b && downloadBlob(b, `${name}-p${crop.page}-figure.png`), "image/png");
    };
    img.src = crop.url;
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} wide>
      {!doc ? (
        <button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-6 hover:border-primary/50">
          <FileUp className="h-8 w-8 text-primary" /><span className="mt-2 font-medium">Open a PDF</span><span className="text-xs text-muted-foreground">Everything happens in your browser. Free, no credits.</span>
        </button>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{name} · {doc.numPages} pages</p>
            <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={quality} onChange={(e) => setQuality(+e.target.value)} aria-label="Image quality">
              <option value={1200}>Screen (1200 px)</option><option value={2000}>High (2000 px)</option><option value={3200}>Print (3200 px)</option>
            </select>
            <Button size="sm" variant="outline" onClick={() => setSel(sel.size === thumbs.length ? new Set() : new Set(thumbs.map((_, i) => i + 1)))}>{sel.size === thumbs.length ? "Select none" : "Select all"}</Button>
            <Button size="sm" className="gap-1.5" disabled={!sel.size || !!working} onClick={() => exportPages([...sel].sort((a, b) => a - b))}><Download className="h-3.5 w-3.5" /> Download {sel.size || ""} page{sel.size === 1 ? "" : "s"}</Button>
            <Button size="sm" variant="ghost" onClick={() => { setDoc(null); setThumbs([]); }}>Other PDF</Button>
            {working && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> {working}</span>}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {thumbs.map((t, i) => (
              <div key={i} className={`overflow-hidden rounded-xl border-2 bg-card ${sel.has(i + 1) ? "border-primary" : "border-transparent"}`}>
                <button type="button" className="block w-full" onClick={() => setSel((s) => { const n = new Set(s); if (n.has(i + 1)) n.delete(i + 1); else n.add(i + 1); return n; })} aria-pressed={sel.has(i + 1)}>
                  <img src={t} alt={`Page ${i + 1}`} loading="lazy" className="aspect-[3/4] w-full bg-white object-contain" />
                </button>
                <div className="flex items-center justify-between px-2 py-1 text-xs">
                  <span>p{i + 1}</span>
                  <button type="button" className="flex items-center gap-1 text-primary" onClick={async () => { setRect(null); setCrop({ page: i + 1, url: await pdfPageImage(doc, i + 1, quality) }); }}><Crop className="h-3 w-3" /> Crop</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void open(f); e.target.value = ""; }} />
      {crop && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 p-3 sm:p-6" role="dialog" aria-label="Crop a figure">
          <div className="mb-2 flex items-center gap-2 text-white">
            <p className="text-sm">Drag over a chart or figure on page {crop.page}</p>
            <Button size="sm" className="ml-auto gap-1.5" onClick={saveCrop}><Download className="h-3.5 w-3.5" /> Save figure</Button>
            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setCrop(null)} aria-label="Close"><X className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-1 items-start justify-center overflow-auto">
            <div className="relative touch-none select-none">
              <img
                ref={imgRef} src={crop.url} alt="" draggable={false} className="max-h-[80vh] w-auto bg-white"
                onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); start.current = pos(e); setRect({ ...start.current, w: 0, h: 0 }); }}
                onPointerMove={(e) => { if (!start.current) return; const p = pos(e); setRect({ x: Math.min(p.x, start.current.x), y: Math.min(p.y, start.current.y), w: Math.abs(p.x - start.current.x), h: Math.abs(p.y - start.current.y) }); }}
                onPointerUp={() => (start.current = null)}
              />
              {rect && <div className="pointer-events-none absolute border-2 border-primary bg-primary/10" style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%` }} />}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
