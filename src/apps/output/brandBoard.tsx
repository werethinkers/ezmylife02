import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { markdownToBlocks } from "./markdown";
import { extractPalette, roledSwatches, type PaletteSwatch } from "./palette";
import { extractFonts, extractTagline, useGoogleFonts } from "./typography";

/*
 * "Visual Brand Board": the colour palette and font pairing a Brand Identity Kit result promises,
 * shown as something to look at rather than a table to read — click a swatch to copy its hex,
 * see the brand name and a line of body copy actually set in the two recommended fonts. Built
 * straight from the result's own Markdown, so it only appears when there's a real palette to
 * show (any flagship app whose result has a colour-palette table gets one; the rest render nothing).
 */

function Swatch({ role, swatch }: { role: string; swatch: PaletteSwatch }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(swatch.hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard blocked (no permission, insecure context) — nothing more to do here */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="group flex flex-col overflow-hidden rounded-xl border-2 border-ink text-left transition hover:-translate-y-0.5"
      aria-label={`${role}, ${swatch.hex.toUpperCase()} — copy hex code`}
    >
      <span className="h-16 w-full sm:h-20" style={{ backgroundColor: swatch.hex }} aria-hidden />
      <span className="flex items-center justify-between gap-1 bg-card px-2.5 py-2">
        <span className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{role}</span>
          <span className="block truncate text-sm font-bold">{swatch.hex.toUpperCase()}</span>
        </span>
        {copied ? <Check className="h-3.5 w-3.5 shrink-0 text-teal" aria-hidden /> : <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden />}
      </span>
    </button>
  );
}

export function BrandBoard({ text, fallbackName }: { text: string; fallbackName: string }) {
  const parsed = useMemo(() => {
    const { title, blocks } = markdownToBlocks(text);
    const { palette } = extractPalette(blocks);
    return { title, palette, fonts: extractFonts(text), tagline: extractTagline(text) };
  }, [text]);
  useGoogleFonts(parsed.fonts);

  if (parsed.palette.length < 2) return null;
  const roled = roledSwatches(parsed.palette);
  const brandName = parsed.title || fallbackName;
  const headingFont = parsed.fonts.heading ? `"${parsed.fonts.heading}", Unbounded, sans-serif` : undefined;
  const bodyFont = parsed.fonts.body ? `"${parsed.fonts.body}", Hind, sans-serif` : undefined;

  return (
    <div className="space-y-4 rounded-2xl border-2 border-ink bg-card p-4 shadow-block sm:p-5">
      <p className="text-[15px] font-bold">Visual Brand Board</p>
      <div className={cn("grid gap-2.5", roled.length >= 3 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2")}>
        {roled.map(({ role, swatch }) => (
          <Swatch key={role} role={role} swatch={swatch} />
        ))}
      </div>
      {(parsed.fonts.heading || parsed.fonts.body) && (
        <div className="rounded-xl border-2 border-ink/15 bg-sand/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Font pairing{parsed.fonts.heading && parsed.fonts.body ? ` — ${parsed.fonts.heading} + ${parsed.fonts.body}` : ` — ${parsed.fonts.heading ?? parsed.fonts.body}`}
          </p>
          <p className="mt-2 text-2xl font-bold leading-tight" style={{ fontFamily: headingFont }}>
            {brandName}
          </p>
          {parsed.tagline && (
            <p className="text-base" style={{ fontFamily: headingFont }}>
              {parsed.tagline}
            </p>
          )}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: bodyFont }}>
            A short line of body copy, set in the recommended font — so you can see how it actually reads before you commit to it anywhere.
          </p>
        </div>
      )}
    </div>
  );
}
