import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Download, Image as ImageIcon, QrCode, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Content, Product, Theme } from "./types";
import { fill, waShare } from "./util";
import { downloadCanvas, drawQrPoster, drawShareCard, FORMATS, type Format } from "./shareImage";

/** Everything a creator needs to send their page out: WhatsApp, native share, link, image, QR. */
/** url: the page itself (QR, image). link: what gets sent, the share page with its own preview when set up. */
export function ShareKit({ product, theme, content, url, slug, link }: { product: Product; theme: Theme; content: Content; url: string; slug: string; link?: string | null }) {
  const sendUrl = link || url;
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const [fmt, setFmt] = useState<Format>(["business", "menu", "profile"].includes(product.family) ? "4:5" : "9:16");
  const [img, setImg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const message = fill(product.share, { ...content, link: sendUrl });
  const qrCanvas = () => qrRef.current?.querySelector("canvas") ?? null;

  useEffect(() => {
    let live = true;
    setBusy(true);
    drawShareCard(product, theme, content, url, fmt, qrCanvas()).then((cv) => { if (live) setImg(cv.toDataURL("image/png")); }).finally(() => live && setBusy(false));
    return () => { live = false; };
  }, [product, theme, content, url, fmt]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(sendUrl); toast({ title: "Link copied" }); }
    catch { toast({ title: "Copy this link", description: sendUrl }); }
  };
  const nativeShare = async () => {
    try {
      const cv = await drawShareCard(product, theme, content, url, fmt, qrCanvas());
      const blob: Blob | null = await new Promise((r) => cv.toBlob(r, "image/png"));
      const file = blob ? new File([blob], `${slug}.png`, { type: "image/png" }) : null;
      if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text: message });
      else if (navigator.share) await navigator.share({ text: message });
      else { await copy(); }
    } catch { /* user closed the share sheet */ }
  };
  const downloadCard = async () => downloadCanvas(await drawShareCard(product, theme, content, url, fmt, qrCanvas()), `${slug}-${fmt.replace(/[^0-9a-z]/gi, "")}.png`);
  const downloadQr = () => { const q = qrCanvas(); if (q) downloadCanvas(q, `${slug}-qr.png`); };
  const downloadPoster = async () => { const q = qrCanvas(); if (q) downloadCanvas(await drawQrPoster(product, theme, content, url, q), `${slug}-qr-poster.png`); };

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <a href={waShare(message)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 h-14 rounded-2xl bg-[#25D366] text-[#06260F] font-semibold text-base">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.7.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" /></svg>
          Share on WhatsApp
        </a>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-12 rounded-xl" onClick={nativeShare}><Share2 className="h-4 w-4 mr-2" /> More apps</Button>
          <Button variant="outline" className="h-12 rounded-xl" onClick={copy}><Copy className="h-4 w-4 mr-2" /> Copy link</Button>
        </div>
        <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm break-all font-mono">{sendUrl}</div>
        <details className="text-sm text-muted-foreground"><summary className="cursor-pointer">What people receive on WhatsApp</summary><p className="whitespace-pre-wrap mt-2 rounded-xl bg-muted/40 p-3">{message}</p></details>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center gap-2 font-semibold"><ImageIcon className="h-4 w-4" /> Share image</div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FORMATS) as Format[]).map((k) => (
            <button key={k} type="button" onClick={() => setFmt(k)} aria-pressed={fmt === k}
              className={"px-3 py-1.5 rounded-full border text-sm font-medium " + (fmt === k ? "bg-foreground text-background border-foreground" : "bg-background")}>{k}</button>
          ))}
        </div>
        <div className="rounded-2xl border bg-muted/30 p-3 grid place-items-center min-h-[220px]">
          {img ? <img src={img} alt="Share image preview" className={"rounded-lg shadow-lg max-h-[420px] w-auto " + (busy ? "opacity-60" : "")} /> : <span className="text-sm text-muted-foreground">Drawing…</span>}
        </div>
        <Button className="h-12 rounded-xl" onClick={downloadCard}><Download className="h-4 w-4 mr-2" /> Download image</Button>
        <p className="text-xs text-muted-foreground">9:16 fits WhatsApp Status and Instagram Stories. 1:1 and 4:5 fit feed posts.</p>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center gap-2 font-semibold"><QrCode className="h-4 w-4" /> QR code</div>
        <div className="flex items-center gap-4">
          <div ref={qrRef} className="rounded-xl bg-white p-2 border shrink-0">
            <QRCodeCanvas value={`${url}?src=qr`} size={600} level="Q" marginSize={2} fgColor="#111111" style={{ width: 112, height: 112 }} />
          </div>
          <div className="grid gap-2 flex-1">
            <Button variant="outline" className="h-11 rounded-xl" onClick={downloadQr}><Download className="h-4 w-4 mr-2" /> QR code (PNG)</Button>
            <Button variant="outline" className="h-11 rounded-xl" onClick={downloadPoster}><Download className="h-4 w-4 mr-2" /> Printable A5 poster</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
