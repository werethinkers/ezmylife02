import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cardUrl } from "@/lib/cardPromo";

/*
 * The printed visiting card, 90 x 55 mm, in the site look (cream, ink outlines, sun and pink blocks).
 * Sizes are in millimetres so the screen preview and the print sheet match.
 */

export interface CardStyle {
  name: string;
  title: string;
  tagline: string;
  signature: string | null;
  offer: string;
  perApp: number;
}

const FONT_DISPLAY = { fontFamily: "Unbounded, system-ui, sans-serif" } as const;
const exact = { WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties;
const frame: React.CSSProperties = { width: "90mm", height: "55mm", boxSizing: "border-box", overflow: "hidden", position: "relative", ...exact };

export const PromoCardFront = forwardRef<HTMLDivElement, { code: string; style: CardStyle; expires?: string | null }>(
  ({ code, style, expires }, ref) => (
    <div ref={ref} className="bg-background text-ink" style={{ ...frame, border: "0.6mm solid #1a1a2e", borderRadius: "3mm", padding: "4mm" }}>
      <div className="flex h-full gap-[3mm]">
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <p style={{ ...FONT_DISPLAY, fontSize: "2.6mm", letterSpacing: "0.3mm" }} className="font-bold">EZYOURLIFE</p>
            <p style={{ ...FONT_DISPLAY, fontSize: "5.4mm", lineHeight: 1.1, marginTop: "1.5mm" }} className="font-bold">
              <span className="bg-sun px-[1mm]" style={exact}>{style.offer}</span>
              <br />free AI credits
            </p>
            <p style={{ fontSize: "2.7mm", lineHeight: 1.25, marginTop: "1.5mm" }}>{style.tagline}</p>
          </div>
          <div>
            {style.signature ? (
              <img src={style.signature} alt="" style={{ height: "9mm", maxWidth: "36mm", objectFit: "contain", mixBlendMode: "multiply" }} />
            ) : (
              <div style={{ height: "9mm" }} />
            )}
            <div style={{ borderTop: "0.3mm solid #1a1a2e", paddingTop: "0.8mm", fontSize: "2.5mm", lineHeight: 1.2 }}>
              <b>{style.name}</b>
              {style.title && <span> · {style.title}</span>}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center justify-center" style={{ width: "28mm" }}>
          <div className="bg-white" style={{ border: "0.5mm solid #1a1a2e", borderRadius: "2mm", padding: "1.6mm", boxShadow: "0.9mm 0.9mm 0 #1a1a2e", ...exact }}>
            <QRCodeSVG value={cardUrl(code, "https://ezyourlife.com")} size={100} level="M" style={{ width: "20mm", height: "20mm", display: "block" }} />
          </div>
          <p style={{ ...FONT_DISPLAY, fontSize: "2.3mm", marginTop: "2.4mm" }} className="font-bold">Scan to claim</p>
        </div>
      </div>
      {expires && (
        <p style={{ position: "absolute", right: "4mm", bottom: "1.6mm", fontSize: "1.9mm" }} className="text-muted-foreground">
          Claim by {expires}
        </p>
      )}
    </div>
  ),
);
PromoCardFront.displayName = "PromoCardFront";

export const PromoCardBack = forwardRef<HTMLDivElement, { code: string; style: CardStyle; expires?: string | null }>(
  ({ code, style, expires }, ref) => (
    <div ref={ref} className="bg-sun text-ink" style={{ ...frame, border: "0.6mm solid #1a1a2e", borderRadius: "3mm", padding: "4mm" }}>
      <p style={{ ...FONT_DISPLAY, fontSize: "3.4mm" }} className="font-bold">3 steps. No payment.</p>
      <ol style={{ fontSize: "2.8mm", lineHeight: 1.35, marginTop: "1.8mm", paddingLeft: "4mm", listStyle: "decimal" }}>
        <li>Scan the code with your phone camera</li>
        <li>Create your free EZYOURLIFE account, or log in</li>
        <li>Your {style.offer} gift credits are added. Pick any app and go</li>
      </ol>
      <div className="bg-white" style={{ ...exact, marginTop: "2.4mm", border: "0.4mm solid #1a1a2e", borderRadius: "1.6mm", padding: "1mm 2mm", display: "inline-block" }}>
        <span style={{ fontSize: "2mm" }}>Your code </span>
        <b style={{ fontSize: "3.2mm", letterSpacing: "0.4mm", fontFamily: "ui-monospace, monospace" }}>{code}</b>
      </div>
      <p style={{ position: "absolute", left: "4mm", right: "4mm", bottom: "2.6mm", fontSize: "1.9mm", lineHeight: 1.3 }}>
        ezyourlife.com/card · Works once, on one account. Gift credits work on each app up to {style.perApp} times, Bulk Mode
        included; after that, free or bought credits are used.{expires ? ` Claim by ${expires}.` : ""}
      </p>
    </div>
  ),
);
PromoCardBack.displayName = "PromoCardBack";
