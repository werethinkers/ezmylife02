import { FileText, MessageCircle, Monitor, FileType2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FORMAT_TEXT, formatsFor, useOutputChoice } from "./choice";
import type { OutputFormat } from "./types";

const ICON: Record<OutputFormat, typeof FileText> = {
  text: Monitor,
  pdf: FileText,
  word: FileType2,
  whatsapp: MessageCircle,
};

/**
 * "How do you want your result?" — shown beside an app's run button.
 * Every format is made anyway; this picks the one that opens first. Remembered per app.
 */
export function OutputChoice({
  toolId,
  className,
  compact,
  tone = "block",
}: {
  toolId: string;
  className?: string;
  compact?: boolean;
  /** "soft" is the refined neo-brutalist look (no thick ink border) — opt-in, so every other
   * caller keeps today's bordered look unchanged. */
  tone?: "block" | "soft";
}) {
  const formats = formatsFor(toolId);
  const [choice, setChoice] = useOutputChoice(toolId);
  if (formats.length < 2) return null;
  const soft = tone === "soft";
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className={cn("mb-2 text-sm font-semibold", soft && "text-[#111111] dark:text-white")}>How do you want your result?</legend>
      <div className={cn("grid gap-2", "grid-cols-2")} role="radiogroup" aria-label="How do you want your result?">
        {formats.map((f) => {
          const Icon = ICON[f];
          const on = f === choice;
          return (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setChoice(f)}
              className={cn(
                "flex min-w-0 items-start gap-2 rounded-xl px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                soft
                  ? on
                    ? "border-[1.5px] border-[#111111] bg-[#C8E967]/30 dark:border-white/70 dark:bg-white/10"
                    : "border border-black/12 bg-[#FAF7F2] dark:border-white/15 dark:bg-[#1F1F24]"
                  : cn("border-2 border-ink", on ? "bg-lime shadow-block-sm" : "bg-card hover:bg-sand"),
              )}
            >
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", soft && "text-[#111111] dark:text-white")} aria-hidden />
              <span className="min-w-0">
                <span className={cn("block text-[13px] font-bold leading-tight", soft && "text-[#111111] dark:text-white")}>{FORMAT_TEXT[f].label}</span>
                {!compact && <span className="block text-[11px] leading-snug text-muted-foreground">{FORMAT_TEXT[f].line}</span>}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">All of them are made together, at the same price, so you can switch after.</p>
    </fieldset>
  );
}
