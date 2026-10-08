import { useRef, useState } from "react";
import { FileUp, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppShell } from "../shell/AppShell";
import { OutputPanel } from "../shell/OutputPanel";
import { useRun } from "../lib/api";
import { openPdf, pdfPageText } from "../lib/files";
import { APPS } from "../registry";

const pdfDate = (s?: string) => {
  const m = s?.match(/D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?/);
  if (!m) return s || "";
  const d = new Date(Date.UTC(+m[1], +(m[2] ?? 1) - 1, +(m[3] ?? 1), +(m[4] ?? 0), +(m[5] ?? 0)));
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

export default function PdfMetadata({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const [meta, setMeta] = useState<Record<string, string> | null>(null);
  const [sample, setSample] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { busy, run } = useRun(toolId);

  const open = async (f: File) => {
    setLoading(true);
    setReport("");
    try {
      const doc = await openPdf(f);
      const { info } = await doc.getMetadata();
      const p1 = await doc.getPage(1);
      const vp = p1.getViewport({ scale: 1 });
      let text = "";
      for (let i = 1; i <= Math.min(3, doc.numPages); i++) text += `\n--- Page ${i} ---\n${await pdfPageText(doc, i)}`;
      setSample(text.trim());
      setMeta({
        "File name": f.name,
        "File size": `${(f.size / 1024 / 1024).toFixed(2)} MB`,
        Pages: String(doc.numPages),
        "Page size": `${Math.round((vp.width / 72) * 25.4)} × ${Math.round((vp.height / 72) * 25.4)} mm`,
        Title: info?.Title ?? "",
        Author: info?.Author ?? "",
        Subject: info?.Subject ?? "",
        Keywords: info?.Keywords ?? "",
        "Created with": info?.Creator ?? "",
        "PDF producer": info?.Producer ?? "",
        Created: pdfDate(info?.CreationDate),
        Modified: pdfDate(info?.ModDate),
        "PDF version": info?.PDFFormatVersion ?? "",
        "Searchable text": text.replace(/--- Page \d+ ---/g, "").trim().length > 40 ? "Yes" : "No (likely scanned)",
      });
    } catch {
      toast.error("That file couldn't be read as a PDF.");
    } finally {
      setLoading(false);
    }
  };

  const analyse = async () => {
    if (!meta) return;
    const out = await run<string>({ inputs: meta, context: sample.slice(0, 15000) });
    if (out) setReport(out);
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related}>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-[140px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-6 hover:border-primary/50">
            {loading ? <Loader2 className="h-7 w-7 animate-spin text-primary" /> : <FileUp className="h-7 w-7 text-primary" />}
            <span className="mt-2 font-medium">Choose a PDF</span>
            <span className="text-xs text-muted-foreground">Metadata is read in your browser — free.</span>
          </button>
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void open(f); e.target.value = ""; }} />
          {meta && (
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <table className="w-full text-sm">
                <tbody>{Object.entries(meta).map(([k, v]) => <tr key={k} className="border-b border-border/40 last:border-0"><td className="w-2/5 py-1.5 pr-2 text-muted-foreground">{k}</td><td className="break-all py-1.5">{v || <span className="text-muted-foreground">—</span>}</td></tr>)}</tbody>
              </table>
              <Button className="mt-4 w-full gap-2" onClick={analyse} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Analyse with AI</Button>
            </div>
          )}
        </div>
        {report ? <OutputPanel toolId={toolId} text={report} title="Document analysis" fileName="pdf-analysis" sendTo={def.related} /> : <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">The AI reads the metadata and first pages, and tells you what the document is and what stands out.</div>}
      </div>
    </AppShell>
  );
}
