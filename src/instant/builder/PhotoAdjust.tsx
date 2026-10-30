import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// A small photo editor for cards and websites: move, zoom (slider or two-finger pinch), turn, pick a shape,
// or show the whole photo instead of cropping it. The result is a new photo of the chosen shape, so what
// people see here is what the design shows: the designs fill their frame, and a photo already cut to
// the right shape isn't cropped a second time (the usual way a face gets cut off).

const ASPECTS = [
  { id: "free", label: "Original", ratio: null },
  { id: "1:1", label: "Square", ratio: 1 },
  { id: "3:4", label: "Tall", ratio: 3 / 4 },
  { id: "4:3", label: "Wide", ratio: 4 / 3 },
  { id: "16:9", label: "Banner", ratio: 16 / 9 },
] as const;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// The slider's low end shrinks the photo smaller than its frame (useful when a wide or tall picture
// doesn't fit and padding around it, rather than a crop, is what looks right); 1 is "just fills the
// frame" (or "shows the whole photo" when that's on) and above 1 zooms in, same as before.
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

type Props = {
  open: boolean; src: string | null; onClose: () => void; onApply: (dataUrl: string) => void;
  /** Aspect to start on when the dialog opens, e.g. "1:1" for a logo. Defaults to "free" (the photo's own shape). */
  defaultAspect?: (typeof ASPECTS)[number]["id"];
};

export function PhotoAdjust({ open, src, onClose, onApply, defaultAspect = "free" }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [rot, setRot] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]["id"]>(defaultAspect);
  const [whole, setWhole] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open || !src) return;
    setImg(null); setFailed(false); setErr(""); setRot(0); setZoom(1); setPos({ x: 0, y: 0 }); setAspect(defaultAspect); setWhole(false);
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => setImg(im);
    im.onerror = () => setFailed(true);
    im.src = src;
  }, [open, src, defaultAspect]);

  // Geometry. "iw x ih" is the photo as shown after turning; the frame is the shape the result will have.
  const g = useMemo(() => {
    const turned = rot % 180 !== 0;
    const nw = img?.naturalWidth || 1, nh = img?.naturalHeight || 1;
    const iw = turned ? nh : nw, ih = turned ? nw : nh;
    const ratio = ASPECTS.find((a) => a.id === aspect)?.ratio ?? iw / ih;
    const maxW = Math.min(300, Math.max(200, (typeof window !== "undefined" ? window.innerWidth : 360) - 96)), maxH = 320;
    let fW = maxW, fH = fW / ratio;
    if (fH > maxH) { fH = maxH; fW = fH * ratio; }
    const base = whole ? Math.min(fW / iw, fH / ih) : Math.max(fW / iw, fH / ih);
    const scale = base * zoom;
    const maxX = Math.max(0, (iw * scale - fW) / 2), maxY = Math.max(0, (ih * scale - fH) / 2);
    return { nw, nh, iw, ih, ratio, fW, fH, scale, px: clamp(pos.x, -maxX, maxX), py: clamp(pos.y, -maxY, maxY) };
  }, [img, rot, aspect, whole, zoom, pos]);

  // Dragging with one finger moves the photo; two fingers pinch to zoom.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinch = useRef<{ d: number; z: number } | null>(null);
  const live = useRef({ px: 0, py: 0, zoom: 1 });
  live.current = { px: g.px, py: g.py, zoom };
  const dist = () => { const [a, b] = [...pointers.current.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
  const rebase = () => {
    const [only] = [...pointers.current.values()];
    drag.current = pointers.current.size === 1 && only ? { x: only.x, y: only.y, px: live.current.px, py: live.current.py } : null;
    pinch.current = pointers.current.size === 2 ? { d: dist(), z: live.current.zoom } : null;
  };

  const apply = () => {
    if (!img) return;
    try {
      const rad = (rot * Math.PI) / 180;
      const outW = clamp(Math.ceil(g.fW / g.scale), 320, 1400), outH = Math.round(outW / g.ratio), r = outW / g.fW;
      const c = document.createElement("canvas"); c.width = outW; c.height = outH;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("no canvas");
      if (whole || g.scale < Math.max(g.fW / g.iw, g.fH / g.ih)) {
        // Shrunk smaller than the frame (or showing the whole photo): fill the gap with the photo's
        // own colours, blurred where the browser can, instead of a flat bar or a transparent hole.
        const px1 = document.createElement("canvas"); px1.width = px1.height = 1;
        const p = px1.getContext("2d"); p?.drawImage(img, 0, 0, 1, 1);
        const d = p?.getImageData(0, 0, 1, 1).data;
        ctx.fillStyle = d ? `rgb(${d[0]},${d[1]},${d[2]})` : "#111"; ctx.fillRect(0, 0, outW, outH);
        if ("filter" in ctx) {
          ctx.save(); ctx.filter = "blur(28px)";
          ctx.translate(outW / 2, outH / 2); ctx.rotate(rad);
          const cover = Math.max(outW / g.iw, outH / g.ih) * 1.2; ctx.scale(cover, cover);
          ctx.drawImage(img, -g.nw / 2, -g.nh / 2); ctx.restore();
        }
      }
      ctx.save();
      ctx.translate(outW / 2 + g.px * r, outH / 2 + g.py * r); ctx.rotate(rad); ctx.scale(g.scale * r, g.scale * r);
      ctx.drawImage(img, -g.nw / 2, -g.nh / 2);
      ctx.restore();
      const webp = c.toDataURL("image/webp", 0.86);
      onApply(webp.startsWith("data:image/webp") ? webp : c.toDataURL("image/jpeg", 0.86));
    } catch {
      setErr("This photo can't be adjusted here. Add it again from your phone, then adjust it.");
    }
  };

  const chip = (on: boolean) => cn("rounded-full border-2 px-3 py-1.5 text-xs font-bold", on ? "border-ink bg-ink text-cream" : "border-ink/30 bg-card");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Adjust your photo</DialogTitle>
          <DialogDescription>Drag to move it, pinch or use the slider to zoom in or out — zoom out if the photo doesn't fit. The card shows exactly this shape.</DialogDescription>
        </DialogHeader>
        {failed ? (
          <p className="text-sm text-destructive" role="alert">This photo couldn't be opened for adjusting. Add it again, then try once more.</p>
        ) : (
          <div className="grid justify-items-center gap-3">
            <div
              className="relative touch-none select-none overflow-hidden rounded-xl border-2 border-ink bg-muted"
              style={{ width: g.fW, height: g.fH, cursor: "grab" }}
              aria-label="Photo preview. Drag to move."
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); rebase(); }}
              onPointerMove={(e) => {
                if (!pointers.current.has(e.pointerId)) return;
                pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                if (pointers.current.size === 2 && pinch.current) setZoom(clamp(pinch.current.z * (dist() / pinch.current.d), MIN_ZOOM, MAX_ZOOM));
                else if (drag.current) setPos({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) });
              }}
              onPointerUp={(e) => { pointers.current.delete(e.pointerId); rebase(); }}
              onPointerCancel={(e) => { pointers.current.delete(e.pointerId); rebase(); }}
            >
              {img && (
                <img
                  src={img.src} alt="" draggable={false}
                  style={{ position: "absolute", left: "50%", top: "50%", width: g.nw, height: g.nh, maxWidth: "none", transform: `translate(${g.px}px, ${g.py}px) translate(-50%, -50%) rotate(${rot}deg) scale(${g.scale})` }}
                />
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Shape">
              {ASPECTS.map((a) => (
                <button key={a.id} type="button" aria-pressed={aspect === a.id} className={chip(aspect === a.id)} onClick={() => { setAspect(a.id); setPos({ x: 0, y: 0 }); }}>{a.label}</button>
              ))}
            </div>

            <div className="flex w-full items-center gap-3">
              <ZoomOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              <Slider min={MIN_ZOOM} max={MAX_ZOOM} step={0.01} value={[zoom]} onValueChange={(v) => setZoom(clamp(v[0] ?? 1, MIN_ZOOM, MAX_ZOOM))} aria-label="Zoom" />
              <ZoomIn className="h-5 w-5 shrink-0" aria-hidden="true" />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => { setRot((r) => (r + 270) % 360); setPos({ x: 0, y: 0 }); }}><RotateCcw className="h-4 w-4" /> Turn left</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => { setRot((r) => (r + 90) % 360); setPos({ x: 0, y: 0 }); }}><RotateCw className="h-4 w-4" /> Turn right</Button>
              <button type="button" aria-pressed={whole} className={chip(whole)} onClick={() => { setWhole((w) => !w); setPos({ x: 0, y: 0 }); }}>Show the whole photo</button>
            </div>
            {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" disabled={!img || failed} onClick={apply}>Use this photo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
