import { useEffect, useState, type RefObject } from "react";
import { Check, Copy, Eye, FileText, FileType2, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { downloadWord, slug } from "../lib/files";
import { useWorkspace } from "../lib/workspace";
import { letterheadFrom } from "./buildDoc";
import { TEMPLATE_ACCENT, todayText, useOutputChoice } from "./choice";
import { blocksFromElement, blocksToMarkdown } from "./fromElement";
import { PdfView } from "./PdfView";
import { saveFile } from "./save";
import type { OutputFormat, PdfDoc, TemplateId } from "./types";
import { usePreparedPdf } from "./usePreparedPdf";

const plain = (md: string) =>
  md
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/^\|.*\|$/gm, (l) => (/^\|\s*-/.test(l) ? "" : l.replace(/^\|\s*|\s*\|$/g, "").replace(/\s*\|\s*/g, " · ")))
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * "Get it as: PDF · Word · WhatsApp · Text" for apps with their own page.
 * Reads the app's result from the screen (or takes a ready document), and keeps the PDF made
 * in the background so every format is ready at once. The person's last choice is shown first.
 */
export function SaveBar({
  toolId,
  appName,
  template = "document",
  target,
  doc: givenDoc,
  className,
}: {
  toolId: string;
  appName: string;
  template?: TemplateId;
  /** The part of the page that holds the result. */
  target?: RefObject<HTMLElement>;
  /** A ready-made document (Invoice Generator builds its own). */
  doc?: PdfDoc | null;
  className?: string;
}) {
  const { profile } = useWorkspace();
  const [choice, setChoice] = useOutputChoice(toolId);
  const [read, setRead] = useState<{ title?: string; blocks: PdfDoc["blocks"] } | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  // Re-read the screen a moment after it stops changing.
  useEffect(() => {
    const el = target?.current;
    if (!el || givenDoc !== undefined) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const r = blocksFromElement(el);
        setRead((prev) => (JSON.stringify(prev) === JSON.stringify(r) ? prev : r));
      }, 900);
    };
    update();
    const mo = new MutationObserver(update);
    mo.observe(el, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["value", "aria-checked", "data-state"] });
    el.addEventListener("input", update, true);
    el.addEventListener("change", update, true);
    return () => {
      clearTimeout(t);
      mo.disconnect();
      el.removeEventListener("input", update, true);
      el.removeEventListener("change", update, true);
    };
  }, [target, givenDoc]);

  const hasContent = !!givenDoc || (read?.blocks.length ?? 0) > 1;
  const fileName = `${slug(appName)}-${new Date().toISOString().slice(0, 10)}`;
  const doc: PdfDoc | null =
    givenDoc !== undefined
      ? givenDoc
      : hasContent && read
        ? {
            template,
            title: appName,
            kicker: appName,
            date: todayText(),
            accent: TEMPLATE_ACCENT[template],
            landscape: template === "register",
            letterhead: letterheadFrom(profile),
            blocks: read.title && read.title !== appName ? [{ t: "h", level: 2, text: read.title }, ...read.blocks] : read.blocks,
            fileName,
          }
        : null;
  const prepared = usePreparedPdf(doc, { wait: 1200 });
  const markdown = doc ? blocksToMarkdown(doc.title, doc.blocks) : "";

  const act = async (f: OutputFormat) => {
    setChoice(f);
    if (!doc) return toast.info("Fill in the app first — then your PDF, Word file and message are ready.");
    if (f === "pdf") {
      if (prepared.state === "ready") void saveFile(prepared.pdf.blob, `${doc.fileName}.pdf`, appName);
      else if (prepared.state === "error") toast.error("The PDF could not be made on this device. Try Word instead.");
      else toast.info("Your PDF is nearly ready — try again in a moment.");
    } else if (f === "word") downloadWord(markdown, doc.fileName, appName);
    else if (f === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(plain(markdown).slice(0, 3500))}`, "_blank", "noopener,noreferrer");
    else {
      try {
        await navigator.clipboard.writeText(plain(markdown).replace(/\*(.+?)\*/g, "$1"));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        toast.error("Copy was blocked by the browser.");
      }
    }
  };

  const opts: { f: OutputFormat; label: string; icon: typeof FileText }[] = [
    { f: "pdf", label: "PDF", icon: FileText },
    { f: "word", label: "Word", icon: FileType2 },
    { f: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { f: "text", label: copied ? "Copied" : "Copy text", icon: copied ? Check : Copy },
  ];

  return (
    <div data-pdf-skip className={cn("rounded-2xl border-2 border-ink bg-card p-3 shadow-block-sm sm:p-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-1 text-sm font-bold">Get your result as:</p>
        {opts.map(({ f, label, icon: Icon }) => (
          <Button key={f} size="sm" variant={choice === f ? "default" : "outline"} className="h-8 gap-1.5" onClick={() => void act(f)} disabled={!hasContent}>
            {f === "pdf" && prepared.state === "making" && !prepared.previous ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
            {label}
          </Button>
        ))}
        {hasContent && (
          <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => setShowPdf((s) => !s)} aria-expanded={showPdf}>
            <Eye className="h-3.5 w-3.5" /> {showPdf ? "Hide PDF pages" : "See PDF pages"}
          </Button>
        )}
      </div>
      {!hasContent && <p className="mt-1.5 text-xs text-muted-foreground">Fill in the app — your PDF, Word file and WhatsApp message get ready as you go.</p>}
      {showPdf && doc && (
        <div className="mt-3">
          <PdfView prepared={prepared} fileName={doc.fileName} title={appName} />
        </div>
      )}
    </div>
  );
}
