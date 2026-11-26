import { useMemo, type ReactNode } from "react";
import { markdownToBlocks } from "./markdown";
import { contrastText, extractPalette, roledSwatches } from "./palette";
import { extractFonts, extractTagline, useGoogleFonts } from "./typography";

/*
 * "Brand in action": 3 instant, CSS-only mock-ups built from the kit's own colours, fonts and
 * (once made) a chosen logo concept — a visiting card, an Instagram post and a shop signboard.
 * No AI call, no cost: pure client-side styling, so it's always free and instant.
 */

function Mock({ label, aspect, bg, fg, children }: { label: string; aspect: string; bg: string; fg: string; children: ReactNode }) {
  return (
    <figure className="overflow-hidden rounded-xl border-2 border-ink">
      <div className={`flex ${aspect} flex-col`} style={{ background: bg, color: fg }}>
        {children}
      </div>
      <figcaption className="border-t border-black/10 bg-card px-2.5 py-1.5 text-center text-[11px] font-semibold text-muted-foreground dark:border-white/10">{label}</figcaption>
    </figure>
  );
}

export function BrandMockups({ text, category, fallbackName, logoUrl }: { text: string; category?: string; fallbackName: string; logoUrl?: string }) {
  const parsed = useMemo(() => {
    const { title, blocks } = markdownToBlocks(text);
    const { palette } = extractPalette(blocks);
    return { title, roled: roledSwatches(palette), fonts: extractFonts(text), tagline: extractTagline(text) };
  }, [text]);
  useGoogleFonts(parsed.fonts);

  if (parsed.roled.length < 2) return null;
  const byRole = new Map(parsed.roled.map((r) => [r.role, r.swatch.hex]));
  const primary = byRole.get("Primary") ?? parsed.roled[0].swatch.hex;
  const secondary = byRole.get("Secondary") ?? primary;
  const accent = byRole.get("Accent") ?? primary;
  const background = byRole.get("Background") ?? "#ffffff";
  const brandName = parsed.title || fallbackName;
  const tagline = parsed.tagline ?? category ?? "";
  const headingFont = parsed.fonts.heading ? `"${parsed.fonts.heading}", Unbounded, sans-serif` : undefined;
  const bodyFont = parsed.fonts.body ? `"${parsed.fonts.body}", Hind, sans-serif` : undefined;
  const Logo = ({ size = "h-9 w-9" }: { size?: string }) =>
    logoUrl ? (
      <img src={logoUrl} alt="" className={`${size} shrink-0 rounded-lg bg-white/85 object-contain p-1`} />
    ) : (
      <span className={`${size} shrink-0 rounded-lg border-2`} style={{ borderColor: contrastText(primary) }} aria-hidden />
    );

  return (
    <div className="space-y-3">
      <p className="text-[15px] font-bold">Brand in action</p>
      <div className="grid gap-4 rounded-2xl border border-black/5 p-3 sm:grid-cols-3 sm:p-4" style={{ background }}>
        <Mock label="Visiting card" aspect="aspect-[7/4] justify-between p-4" bg={primary} fg={contrastText(primary)}>
          <Logo />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold" style={{ fontFamily: headingFont }}>
              {brandName}
            </p>
            {category && <p className="truncate text-[11px] opacity-80">{category}</p>}
            {tagline && (
              <p className="mt-1 truncate text-xs italic opacity-90" style={{ fontFamily: headingFont }}>
                {tagline}
              </p>
            )}
            <p className="mt-2 text-[10px] opacity-70" style={{ fontFamily: bodyFont }}>
              +91 00000 00000 · hello@{brandName.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com
            </p>
          </div>
        </Mock>

        <Mock label="Instagram post" aspect="aspect-square items-center justify-center gap-2 p-5 text-center" bg={secondary} fg={contrastText(secondary)}>
          <Logo size="h-14 w-14" />
          <p className="text-xl font-bold leading-tight" style={{ fontFamily: headingFont }}>
            {brandName}
          </p>
          {tagline && (
            <p className="text-sm" style={{ fontFamily: bodyFont }}>
              {tagline}
            </p>
          )}
          <span className="mt-1 rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: accent, color: contrastText(accent) }}>
            New launch
          </span>
        </Mock>

        <Mock label="Shop signboard" aspect="aspect-[16/6] items-center justify-center gap-3 px-4" bg={accent} fg={contrastText(accent)}>
          <Logo size="h-10 w-10" />
          <p className="truncate text-2xl font-bold tracking-wide" style={{ fontFamily: headingFont, color: contrastText(accent) }}>
            {brandName.toUpperCase()}
          </p>
        </Mock>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Instant previews from your kit's own colours{logoUrl ? " and logo" : ""} — not the finished artwork, just a feel for how the brand looks in use.
      </p>
    </div>
  );
}
