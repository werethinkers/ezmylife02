import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Copy, Download, FileText, Loader2, Printer, Send, Share2, Wand2 } from "lucide-react";
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
import { Markdown } from "@/components/common/Markdown";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { downloadText, downloadWord, printMarkdown } from "../lib/files";
import { sendHandoff } from "../lib/handoff";
import { cn } from "@/lib/utils";

/**
 * Shows an AI result with the same actions everywhere: copy, Word, Markdown, print/PDF,
 * WhatsApp, refine with an instruction, and send it on to another app.
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
}) {
  const [copied, setCopied] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();
  const { data: catalog = [] } = useToolsCatalog();
  const targets = (sendTo ?? []).map((id) => catalog.find((t) => t.id === id && t.is_live)).filter(Boolean) as typeof catalog;
  const fromName = catalog.find((t) => t.id === toolId)?.name ?? "another app";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed — select the text and copy it manually.");
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

  return (
    <div className={cn("overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-block", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-lime px-4 py-2.5">
        <p className="flex min-w-0 items-center gap-2 text-[15px] font-bold">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun text-xs" aria-hidden>3</span>
          <span className="truncate">Your result · {title}</span>
        </p>
        <div className="flex flex-wrap items-center gap-1" aria-label="Save or share">
          <span className="mr-1 hidden items-center gap-1.5 text-xs font-bold lg:inline-flex"><span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-card text-[10px]" aria-hidden>4</span>Save or share:</span>
          <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </Button>
          {editable && onEdit && (
            <Button size="sm" variant={editing ? "secondary" : "ghost"} className="h-8 gap-1.5" onClick={() => setEditing((e) => !e)}>
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{editing ? "Done" : "Edit"}</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 gap-1.5">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Save</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => downloadWord(text, fileName, title)}>Word document (.doc)</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (!printMarkdown(text, title)) toast.error("Allow pop-ups to print or save as PDF.");
                }}
              >
                <Printer className="mr-2 h-3.5 w-3.5" /> Print / Save as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadText(text, `${fileName}.md`, "text/markdown")}>Markdown (.md)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadText(text.replace(/[*#`]/g, ""), `${fileName}.txt`)}>Plain text (.txt)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={whatsapp}>
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>
          {targets.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Use in…</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs">Open another app with this result</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {targets.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => {
                      sendHandoff({ from: toolId, fromName, to: t.id, text });
                      navigate(`/tool/${t.id}`);
                    }}
                  >
                    {t.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto px-4 py-4 sm:px-6">
        {editing && onEdit ? (
          <textarea
            className="min-h-[50vh] w-full resize-y rounded-xl border-2 border-ink bg-background p-3 font-mono text-xs leading-relaxed"
            value={text}
            onChange={(e) => onEdit(e.target.value)}
            aria-label="Edit result"
          />
        ) : (
          <Markdown>{text}</Markdown>
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
          <p className="text-xs text-muted-foreground">Each change is one more run at the app's price.</p>
        </div>
      )}
    </div>
  );
}
