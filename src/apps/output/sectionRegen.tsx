import { useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NeedsCredits, errorText } from "../lib/api";
import { uid } from "../lib/store";
import { runFlagship } from "../flagship/api";

/*
 * Redo one ## section of a result for 2 credits, instead of the whole thing for the app's full
 * price — works on any flagship result (the section names come straight from its own headings),
 * so it isn't special-cased to the Brand Identity Kit even though that's what asked for it.
 */

function extractSectionHeadings(markdown: string): string[] {
  return markdown
    .split("\n")
    .filter((l) => /^#{2,3}\s+/.test(l))
    .map((l) => l.replace(/^#{2,3}\s+/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean);
}

/** Splices a freshly regenerated "## Heading\n...body" block in over the old one, by heading name. */
function replaceSection(markdown: string, heading: string, replacement: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^#{2,3}\\s*${escaped}\\s*$`, "im");
  const m = markdown.match(re);
  if (!m || m.index === undefined) return markdown;
  const rest = markdown.slice(m.index + m[0].length);
  const end = rest.search(/\n#{1,6}\s/);
  const sectionEnd = m.index + m[0].length + (end === -1 ? rest.length : end);
  return `${markdown.slice(0, m.index)}${replacement.trim()}\n${markdown.slice(sectionEnd)}`.replace(/\n{3,}/g, "\n\n");
}

export function SectionRegen({ toolId, text, onPatched }: { toolId: string; text: string; onPatched: (next: string) => void }) {
  const sections = useMemo(() => extractSectionHeadings(text), [text]);
  const [open, setOpen] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const regenerate = async (heading: string) => {
    setBusy(heading);
    try {
      const { output } = await runFlagship<string>(toolId, "section", {
        section: heading,
        previous: text,
        ...(instruction.trim() ? { instruction: instruction.trim() } : {}),
        request_id: uid(),
      });
      onPatched(replaceSection(text, heading, output));
      toast.success(`"${heading}" updated — 2 credits.`);
      setOpen(null);
      setInstruction("");
    } catch (e) {
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  if (sections.length < 2) return null;

  return (
    <div className="space-y-2.5 rounded-2xl border-2 border-ink/15 bg-sand/30 p-4">
      <div>
        <p className="text-[13px] font-bold">Regenerate one section</p>
        <p className="text-[11px] text-muted-foreground">2 credits each — only that section changes; the rest of the kit stays exactly as it is. A full new version above costs the app's price again.</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sections.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => setOpen(open === h ? null : h)}
            disabled={busy === h}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
              open === h ? "border-ink bg-card" : "border-ink/30 bg-card/50 hover:border-ink",
            )}
          >
            {busy === h && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}
            {h}
          </button>
        ))}
      </div>
      {open && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void regenerate(open);
          }}
        >
          <Input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder='Optional: e.g. "make it punchier"'
            className="h-9 min-w-0 flex-1"
            disabled={busy === open}
            aria-label={`Instruction for regenerating ${open}`}
          />
          <Button type="submit" size="sm" className="h-9 gap-1.5" disabled={busy === open}>
            {busy === open ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Regenerate "{open}" · 2 credits
          </Button>
        </form>
      )}
    </div>
  );
}
