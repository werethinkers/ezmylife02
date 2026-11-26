import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, Check, Copy, Download, FileText, FileType2, Loader2, Mail, MoreHorizontal, Send, Share2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BilingualMarkdown } from "../output/bilingual";
import { buildBrandAssetsZip } from "../output/assetPack";
import { markdownToBlocks } from "../output/markdown";
import { extractPalette } from "../output/palette";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { downloadText, downloadWord } from "../lib/files";
import { useWorkspace } from "../lib/workspace";
import { useOutputChoice } from "../output/choice";
import { docFromText } from "../output/buildDoc";
import { usePreparedPdf } from "../output/usePreparedPdf";
import { PdfView } from "../output/PdfView";
import { SectionEditor } from "../output/sectionEditor";
import { saveFile } from "../output/save";
import type { PdfDoc } from "../output/types";
import { sendHandoff, type BrandContext } from "../lib/handoff";
import { useWorkContext } from "../lib/context";
import { cn } from "@/lib/utils";

/** Markdown stripped back to something that reads correctly in WhatsApp or an email body. */
function plainText(md: string): string {
  return md
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|\s)\*(?!\s)(.+?)\*/g, "$1$2")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/`/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Most mail clients cut a mailto body somewhere past 2,000 characters. */
const MAILTO_BODY_LIMIT = 1800;

/**
 * Shows an AI result with the same actions everywhere: copy, PDF, Word, Markdown,
 * WhatsApp, email, refine with an instruction, and send it on to another app.
 * The PDF is made in the background as soon as the result is there, so every format is
 * ready at once; the person's "How do you want your result?" choice decides what opens first.
 */
export function OutputPanel({
  toolId,
  text,
  title,
  fileName,
  onRefine,
  refining,
  refineChips,
  sendTo,
  className,
  editable,
  onEdit,
  pdfDoc,
  brand,
  logoUrls,
}: {
  toolId: string;
  text: string;
  title: string;
  fileName: string;
  onRefine?: (instruction: string) => void;
  refining?: boolean;
  refineChips?: string[];
  sendTo?: string[];
  className?: string;
  editable?: boolean;
  onEdit?: (t: string) => void;
  /** A ready-made PDF document (calculators build theirs from numbers). Default: made from `text`. */
  pdfDoc?: PdfDoc;
  /** Carried to the destination app alongside the text, for "Use in…" (see ../lib/handoff). */
  brand?: BrandContext;
  /** Ready logo concept images (if any), included in the "Download Brand Assets" .zip's logos/ folder. */
  logoUrls?: string[];
}) {
  const [copied, setCopied] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();
  const { ctx } = useWorkContext();
  const { data: catalog = [] } = useToolsCatalog();
  const targets = (sendTo ?? []).map((id) => catalog.find((t) => t.id === id && t.is_live)).filter(Boolean) as typeof catalog;
  const fromName = catalog.find((t) => t.id === toolId)?.name ?? "another app";
  const clientEmail = ctx.client?.email?.trim() || undefined;
  const { profile } = useWorkspace();
  const [choice] = useOutputChoice(toolId);
  // Any written result can be a PDF, including apps that don't ask the question up front.
  const offersPdf = true;
  const doc = useMemo(
    () => (offersPdf ? pdfDoc ?? docFromText({ toolId, text, appName: title, fileName, profile }) : null),
    [offersPdf, pdfDoc, toolId, text, title, fileName, profile],
  );
  const prepared = usePreparedPdf(doc);
  const [view, setView] = useState<"text" | "pdf">(choice === "pdf" && offersPdf ? "pdf" : "text");
  useEffect(() => setView(choice === "pdf" && offersPdf ? "pdf" : "text"), [choice, offersPdf]);
  const showPdf = view === "pdf" && !editing;
  const savePdf = () => {
    if (prepared.state === "ready") void saveFile(prepared.pdf.blob, `${fileName}.pdf`, title);
    else if (prepared.state === "error") toast.error("The PDF could not be made on this device. Use Word instead.");
    else toast.info("Your PDF is nearly ready — try again in a moment.");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed — select the text and copy it manually.");
    }
  };

  // Only offered once there's a real colour palette to pack (any result with one gets it, not
  // just the Brand Identity Kit) — everything else in the .zip is built from that same palette.
  const hasPalette = useMemo(() => extractPalette(markdownToBlocks(text).blocks).palette.length >= 2, [text]);
  const [packing, setPacking] = useState(false);
  const downloadAssets = async () => {
    setPacking(true);
    try {
      const blob = await buildBrandAssetsZip({ text, brandName: title, logoUrls });
      await saveFile(blob, `${fileName}-brand-assets.zip`, title);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not build the assets pack.");
    } finally {
      setPacking(false);
    }
  };

  const refine = (i: string) => {
    const v = i.trim();
    if (!v || !onRefine) return;
    onRefine(v);
    setInstruction("");
  };

  const whatsapp = () => {
    const plain = text.replace(/\*\*(.+?)\*\*/g, "*$1*").replace(/^#+\s*/gm, "").slice(0, 3500);
    window.open(`https://wa.me/?text=${encodeURIComponent(plain)}`, "_blank", "noopener,noreferrer");
  };

  /** Opens the person's mail app with the result in the body, to the saved client if there is one. */
  const email = async (to = "") => {
    const body = plainText(text);
    const long = body.length > MAILTO_BODY_LIMIT;
    if (long) {
      try {
        await navigator.clipboard.writeText(body);
        toast.success("Full document copied — paste it into the email that just opened.");
      } catch {
        toast.info("This document is long, so the email may be cut short. Attach the Word file instead.");
      }
    }
    const qs = new URLSearchParams({ subject: title, body: long ? `${body.slice(0, MAILTO_BODY_LIMIT)}\n\n…` : body });
    window.location.href = `mailto:${encodeURIComponent(to)}?${qs.toString().replace(/\+/g, "%20")}`;
  };

  const emailAsAttachment = () => {
    downloadWord(text, fileName, title);
    toast.success("Word file saved — attach it to the email that just opened.");
    window.location.href = `mailto:${encodeURIComponent(clientEmail ?? "")}?${new URLSearchParams({
      subject: title,
      body: `Dear Sir / Madam,\n\nPlease find the ${title.toLowerCase()} attached.\n\nRegards,\n`,
    })
      .toString()
      .replace(/\+/g, "%20")}`;
  };

  return (
    <div className={cn("overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-block", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-lime px-4 py-2.5">
        <p className="flex min-w-0 items-center gap-2 text-[15px] font-bold">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun text-xs" aria-hidden>3</span>
          <span className="truncate">Your result · {title}</span>
        </p>
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Save or share">
          <span className="mr-1 hidden items-center gap-1.5 text-xs font-bold lg:inline-flex"><span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-card text-[10px]" aria-hidden>4</span>Save or share:</span>

          {/* Always visible, on every screen size: the two most-used actions. */}
          {offersPdf && (
            <Button
              size="sm"
              variant={choice === "pdf" ? "default" : "ghost"}
              className="min-h-[44px] min-w-[44px] gap-1.5"
              onClick={savePdf}
              aria-label="Download as PDF"
              title="Download as PDF"
            >
              {prepared.state === "making" && !prepared.previous ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              <span>PDF</span>
            </Button>
          )}
          <Button size="sm" variant="ghost" className="min-h-[44px] min-w-[44px] gap-1.5" onClick={copy} aria-label={copied ? "Copied to clipboard" : "Copy result to clipboard"} title="Copy">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </Button>

          {/* sm and up: every other action, each labelled and with a 44px target. On narrow phones
              these move into the single "More" menu below instead, so nothing is icon-only guesswork. */}
          <div className="hidden items-center gap-1.5 sm:flex">
            {choice === "word" && (
              <Button size="sm" className="min-h-[44px] min-w-[44px] gap-1.5" onClick={() => downloadWord(text, fileName, title)} aria-label="Download as Word document" title="Download as Word document">
                <FileType2 className="h-3.5 w-3.5" />
                <span>Word</span>
              </Button>
            )}
            {editable && onEdit && (
              <Button
                size="sm"
                variant={editing ? "secondary" : "ghost"}
                className="min-h-[44px] min-w-[44px] gap-1.5"
                onClick={() => setEditing((e) => !e)}
                aria-label={editing ? "Finish editing the result" : "Edit the result as text"}
                title={editing ? "Done editing" : "Edit"}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{editing ? "Done" : "Edit"}</span>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="min-h-[44px] min-w-[44px] gap-1.5" aria-label="Save as a file" title="Save as a file">
                  <Download className="h-3.5 w-3.5" />
                  <span>Save</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadWord(text, fileName, title)}>Word document (.doc)</DropdownMenuItem>
                {offersPdf && (
                  <DropdownMenuItem onClick={savePdf}>
                    <FileText className="mr-2 h-3.5 w-3.5" /> PDF document
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => downloadText(text, `${fileName}.md`, "text/markdown")}>Markdown (.md)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadText(text.replace(/[*#`]/g, ""), `${fileName}.txt`)}>Plain text (.txt)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant={choice === "whatsapp" ? "default" : "ghost"}
              className="min-h-[44px] min-w-[44px] gap-1.5"
              onClick={whatsapp}
              aria-label="Share on WhatsApp"
              title="Share on WhatsApp"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="min-h-[44px] min-w-[44px] gap-1.5" aria-label="Email this result" title="Email">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {clientEmail && (
                  <>
                    <DropdownMenuItem onClick={() => void email(clientEmail)}>Email to {clientEmail}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => void email()}>Email in the message body</DropdownMenuItem>
                <DropdownMenuItem onClick={emailAsAttachment}>Email as a Word attachment</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {targets.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="min-h-[44px] min-w-[44px] gap-1.5" aria-label="Use this result in another app" title="Use in…">
                    <Send className="h-3.5 w-3.5" />
                    <span>Use in…</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs">Open another app with this result</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {targets.map((t) => (
                    <DropdownMenuItem
                      key={t.id}
                      onClick={() => {
                        sendHandoff({ from: toolId, fromName, to: t.id, text, brand });
                        navigate(`/tool/${t.id}`);
                      }}
                    >
                      {t.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {hasPalette && (
              <Button
                size="sm"
                variant="ghost"
                className="min-h-[44px] min-w-[44px] gap-1.5"
                onClick={downloadAssets}
                disabled={packing}
                aria-label="Download brand assets as a zip file"
                title="Download Brand Assets (.zip)"
              >
                {packing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                <span>Assets (.zip)</span>
              </Button>
            )}
          </div>

          {/* Below sm: the rest collapse into one labelled, 44px overflow menu instead of a row of bare icons. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="min-h-[44px] min-w-[44px] gap-1.5 sm:hidden" aria-label="More save and share options" title="More">
                <MoreHorizontal className="h-3.5 w-3.5" />
                <span>More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="sm:hidden">
              {choice === "word" && <DropdownMenuItem onClick={() => downloadWord(text, fileName, title)}>Download as Word document</DropdownMenuItem>}
              {editable && onEdit && <DropdownMenuItem onClick={() => setEditing((e) => !e)}>{editing ? "Done editing" : "Edit the result as text"}</DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">Save as a file</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => downloadWord(text, fileName, title)}>Word document (.doc)</DropdownMenuItem>
              {offersPdf && <DropdownMenuItem onClick={savePdf}>PDF document</DropdownMenuItem>}
              <DropdownMenuItem onClick={() => downloadText(text, `${fileName}.md`, "text/markdown")}>Markdown (.md)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadText(text.replace(/[*#`]/g, ""), `${fileName}.txt`)}>Plain text (.txt)</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={whatsapp}>Share on WhatsApp</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">Email</DropdownMenuLabel>
              {clientEmail && <DropdownMenuItem onClick={() => void email(clientEmail)}>Email to {clientEmail}</DropdownMenuItem>}
              <DropdownMenuItem onClick={() => void email()}>Email in the message body</DropdownMenuItem>
              <DropdownMenuItem onClick={emailAsAttachment}>Email as a Word attachment</DropdownMenuItem>
              {targets.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs">Use this result in</DropdownMenuLabel>
                  {targets.map((t) => (
                    <DropdownMenuItem
                      key={t.id}
                      onClick={() => {
                        sendHandoff({ from: toolId, fromName, to: t.id, text, brand });
                        navigate(`/tool/${t.id}`);
                      }}
                    >
                      {t.name}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              {hasPalette && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={downloadAssets} disabled={packing}>
                    Download Brand Assets (.zip)
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {offersPdf && !editing && (
        <div className="flex gap-1 border-b-2 border-ink/10 px-4 pt-3 sm:px-6" role="tablist" aria-label="Show the result as">
          {(["text", "pdf"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                "-mb-0.5 rounded-t-lg border-2 border-b-0 px-3 py-1 text-xs font-bold",
                view === v ? "border-ink bg-card" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "text" ? "Text" : "PDF pages"}
            </button>
          ))}
        </div>
      )}
      {/* No inner scrollbox on mobile — the result flows in the page's own scroll there; on
          larger screens, where this sits beside the form instead of below it, it keeps its own
          scroll so a long result doesn't stretch the page past the form. */}
      <div className="px-4 py-4 sm:max-h-[70vh] sm:overflow-y-auto sm:px-6">
        {showPdf ? (
          <PdfView prepared={prepared} fileName={fileName} title={title} />
        ) : editing && onEdit ? (
          <SectionEditor text={text} onChange={onEdit} />
        ) : (
          <BilingualMarkdown text={text} />
        )}
      </div>

      {onRefine && (
        <div className="space-y-2 border-t-2 border-ink bg-sand px-4 py-3">
          {refineChips && refineChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {refineChips.map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={refining}
                  onClick={() => refine(c)}
                  className="rounded-full border-2 border-ink bg-card px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-sun disabled:opacity-50"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              refine(instruction);
            }}
          >
            <Input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ask for changes — e.g. make it shorter, add a Hindi version"
              disabled={refining}
              className="h-9"
              aria-label="Change request"
            />
            <Button type="submit" size="sm" className="h-9 gap-1.5" disabled={refining || !instruction.trim()}>
              {refining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              Revise
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">Each change rewrites the whole result and costs the app's price again, same as the first run.</p>
        </div>
      )}
    </div>
  );
}
