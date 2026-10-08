import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileUp, Loader2, Search, Sparkles, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "../shell/AppShell";
import { OutputPanel } from "../shell/OutputPanel";
import { useRun } from "../lib/api";
import { openPdf, pdfPageImage, pdfPageText } from "../lib/files";
import { APPS } from "../registry";

const ASKS = ["Summarise this page", "Explain simply", "Key points as bullets", "Translate to Hindi", "Translate to English"];

export default function PdfReader({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [doc, setDoc] = useState<any>(null);
  const [name, setName] = useState("");
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [img, setImg] = useState("");
  const [rendering, setRendering] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<number[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const texts = useRef<Map<number, string>>(new Map());
  const fileRef = useRef<HTMLInputElement>(null);
  const { busy, run } = useRun(toolId);

  const textOf = async (n: number) => {
    if (!texts.current.has(n)) texts.current.set(n, await pdfPageText(doc, n));
    return texts.current.get(n)!;
  };

  useEffect(() => {
    if (!doc) return;
    let alive = true;
    setRendering(true);
    pdfPageImage(doc, page, 1400 * zoom)
      .then((u) => alive && setImg(u))
      .catch(() => toast.error("Could not render this page."))
      .finally(() => alive && setRendering(false));
    return () => {
      alive = false;
    };
  }, [doc, page, zoom]);

  const open = async (f: File) => {
    try {
      texts.current = new Map();
      setDoc(await openPdf(f));
      setName(f.name);
      setPage(1);
      setAnswer("");
      setHits([]);
    } catch {
      toast.error("That file couldn't be opened as a PDF.");
    }
  };

  const search = async () => {
    if (!q.trim() || !doc) return;
    const found: number[] = [];
    for (let i = 1; i <= doc.numPages && i <= 500; i++) if ((await textOf(i)).toLowerCase().includes(q.toLowerCase())) found.push(i);
    setHits(found);
    if (found.length) setPage(found[0]);
    else toast.info("No matches (scanned pages have no searchable text).");
  };

  const ask = async (instruction: string) => {
    const t = await textOf(page);
    if (!t.trim()) return toast.error("This page has no selectable text (it may be scanned). Try the OCR app.");
    const out = await run<string>({ inputs: { Request: instruction, Document: name, Page: String(page) }, context: t.slice(0, 20000) });
    if (out) setAnswer(out);
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} wide>
      {!doc ? (
        <button type="button" onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void open(f); }} className="flex min-h-[300px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-6 hover:border-primary/50">
          <FileUp className="h-8 w-8 text-primary" />
          <span className="mt-2 font-medium">Open a PDF</span>
          <span className="mt-1 text-xs text-muted-foreground">Stays in your browser — only the page you ask about is sent to the AI.</span>
        </button>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
          <div className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card">
            <div className="flex flex-wrap items-center gap-1 border-b border-border/50 p-2">
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
              <Input type="number" value={page} min={1} max={doc.numPages} onChange={(e) => setPage(Math.min(doc.numPages, Math.max(1, +e.target.value || 1)))} className="h-8 w-16 text-center" aria-label="Page number" />
              <span className="text-xs text-muted-foreground">/ {doc.numPages}</span>
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled={page >= doc.numPages} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(Math.max(0.6, zoom - 0.2))} aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(Math.min(2.4, zoom + 0.2))} aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></Button>
              <form className="ml-auto flex gap-1" onSubmit={(e) => { e.preventDefault(); void search(); }}>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-8 w-32 sm:w-44" aria-label="Search the PDF" />
                <Button size="icon" variant="ghost" className="h-8 w-8" type="submit" aria-label="Search"><Search className="h-4 w-4" /></Button>
              </form>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => fileRef.current?.click()}>Open another</Button>
            </div>
            {hits.length > 0 && <div className="flex flex-wrap gap-1 border-b border-border/50 p-2 text-xs">Found on: {hits.slice(0, 40).map((h) => <button key={h} type="button" onClick={() => setPage(h)} className={`rounded px-1.5 ${h === page ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{h}</button>)}</div>}
            <div className="flex max-h-[78vh] min-h-[60vh] justify-center overflow-auto bg-muted/30 p-3">
              {rendering && !img ? <Loader2 className="mt-20 h-6 w-6 animate-spin" /> : <img src={img} alt={`Page ${page}`} className="h-fit shadow-lg" style={{ width: `${zoom * 100}%`, maxWidth: "none" }} />}
            </div>
          </div>
          <aside className="space-y-3">
            <div className="space-y-2 rounded-2xl border border-border/60 bg-card p-3">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="text-xs text-muted-foreground">Ask AI about page {page}</p>
              <div className="flex flex-wrap gap-1.5">{ASKS.map((a) => <button key={a} type="button" disabled={busy} onClick={() => ask(a)} className="rounded-full border border-border/70 px-2.5 py-1 text-xs hover:border-primary/50 disabled:opacity-50">{a}</button>)}</div>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (question.trim()) void ask(question.trim()); }}>
                <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Your question about this page" className="h-9" aria-label="Question" />
                <Button type="submit" size="sm" className="h-9" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}</Button>
              </form>
            </div>
            {answer && <OutputPanel toolId={toolId} text={answer} title={`Page ${page}`} fileName={`page-${page}`} sendTo={def.related} />}
          </aside>
        </div>
      )}
      <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void open(f); e.target.value = ""; }} />
    </AppShell>
  );
}
