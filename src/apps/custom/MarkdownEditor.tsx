import { useRef, useState } from "react";
import { Bold, Eye, Heading2, Italic, List, ListOrdered, Loader2, Pencil, Quote, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/common/Markdown";

export const AI_ACTIONS = ["Fix grammar", "Rewrite more clearly", "Make shorter", "Expand with detail", "Make it formal", "Translate to Hindi", "Translate to English", "Continue writing"];

/**
 * Markdown writing surface with a formatting bar, preview, word count and AI actions on the
 * selection (or the whole text when nothing is selected).
 */
export function MarkdownEditor({
  value,
  onChange,
  onAi,
  busy,
  actions = AI_ACTIONS,
  appendActions = ["Continue writing"],
  placeholder,
  minHeight = "55vh",
}: {
  appendActions?: string[];
  value: string;
  onChange: (v: string) => void;
  onAi: (instruction: string, text: string, isSelection: boolean) => Promise<string | null>;
  busy: boolean;
  actions?: string[];
  placeholder?: string;
  minHeight?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  const [custom, setCustom] = useState("");
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  const wrap = (before: string, after = before, linePrefix = false) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = value.slice(s, e) || "text";
    const next = linePrefix
      ? value.slice(0, s) + sel.split("\n").map((l, i) => before.replace("1", String(i + 1)) + l).join("\n") + value.slice(e)
      : value.slice(0, s) + before + sel + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => el.focus());
  };

  const ai = async (instruction: string) => {
    const el = ref.current;
    const s = el?.selectionStart ?? 0;
    const e = el?.selectionEnd ?? 0;
    const isSel = e > s;
    const target = isSel ? value.slice(s, e) : value;
    const appends = appendActions.includes(instruction);
    if (!target.trim() && !appends) return;
    const out = await onAi(instruction, appends && !isSel ? value.slice(-6000) : target, isSel);
    if (out === null) return;
    if (instruction === "Continue writing") onChange(`${value.trimEnd()}\n\n${out.trim()}`);
    else if (appends) onChange(`${value.trimEnd()}\n\n---\n\n**${instruction} (AI):**\n\n${out.trim()}`);
    else if (isSel) onChange(value.slice(0, s) + out.trim() + value.slice(e));
    else onChange(out.trim());
  };

  const tool = (label: string, Icon: typeof Bold, fn: () => void) => (
    <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={fn} aria-label={label} title={label} disabled={preview}>
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-ink bg-card">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/50 p-1.5">
        {tool("Bold", Bold, () => wrap("**"))}
        {tool("Italic", Italic, () => wrap("*"))}
        {tool("Heading", Heading2, () => wrap("## ", "", true))}
        {tool("Bullet list", List, () => wrap("- ", "", true))}
        {tool("Numbered list", ListOrdered, () => wrap("1. ", "", true))}
        {tool("Quote", Quote, () => wrap("> ", "", true))}
        <Button type="button" size="sm" variant={preview ? "secondary" : "ghost"} className="ml-auto h-8 gap-1.5" onClick={() => setPreview(!preview)}>
          {preview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {preview ? "Write" : "Preview"}
        </Button>
      </div>
      {preview ? (
        <div className="overflow-y-auto p-5" style={{ minHeight }}><Markdown>{value || "_Nothing yet_"}</Markdown></div>
      ) : (
        <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="flex-1 resize-y bg-transparent p-5 font-serif text-base leading-relaxed outline-none" style={{ minHeight }} aria-label="Editor" />
      )}
      <div className="space-y-2 border-t border-border/50 p-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {busy && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {actions.map((a) => (
            <button key={a} type="button" disabled={busy || preview} onClick={() => ai(a)} className="rounded-full border-2 border-ink/30 bg-card px-2.5 py-1 text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-sun disabled:opacity-50">
              {a}
            </button>
          ))}
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (custom.trim()) void ai(custom.trim()).then(() => setCustom("")); }}>
          <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Or tell the AI what to do with the selected text…" className="h-8 text-sm" disabled={busy || preview} aria-label="Custom AI instruction" />
          <Button type="submit" size="sm" className="h-8 gap-1.5" disabled={busy || preview || !custom.trim()}><Wand2 className="h-3.5 w-3.5" /> Go</Button>
        </form>
        <p className="text-[11px] text-muted-foreground">{words} words · select text to change just that part · each AI action is one run</p>
      </div>
    </div>
  );
}
