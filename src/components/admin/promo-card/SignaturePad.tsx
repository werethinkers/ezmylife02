import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/*
 * Sign with a finger, stylus or mouse, or upload a photo of a real signature.
 * Gives back a transparent PNG (ink only) cropped to the strokes, ready to print on the card.
 */

const W = 560;
const H = 200;

/** Crops transparent margins so the signature fills its space on the card. */
function trim(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const { width, height } = canvas;
  const px = ctx.getImageData(0, 0, width, height).data;
  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (px[(y * width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 <= x0 || y1 <= y0) return null;
  const pad = 6;
  const out = document.createElement("canvas");
  out.width = x1 - x0 + pad * 2;
  out.height = y1 - y0 + pad * 2;
  out.getContext("2d")?.drawImage(canvas, x0, y0, x1 - x0, y1 - y0, pad, pad, x1 - x0, y1 - y0);
  return out.toDataURL("image/png");
}

export function SignaturePad({ value, onChange }: { value: string | null; onChange: (png: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a2e";
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = ref.current?.getContext("2d");
    const p = point(e);
    if (!ctx || !last.current) return;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    setDirty(true);
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    if (ref.current) onChange(trim(ref.current));
  };

  const clear = () => {
    ref.current?.getContext("2d")?.clearRect(0, 0, W, H);
    setDirty(false);
    onChange(null);
  };

  const upload = (file: File | undefined) => {
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      // Turn a photo of a signature on paper into ink-only: dark pixels stay, light pixels become clear.
      const c = document.createElement("canvas");
      c.width = Math.min(img.width, 900);
      c.height = Math.round((img.height * c.width) / img.width);
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < d.data.length; i += 4) {
        const lum = 0.3 * d.data[i] + 0.59 * d.data[i + 1] + 0.11 * d.data[i + 2];
        d.data[i + 3] = lum > 170 ? 0 : Math.min(255, (170 - lum) * 2.5);
        d.data[i] = 26; d.data[i + 1] = 26; d.data[i + 2] = 46;
      }
      ctx.putImageData(d, 0, 0);
      onChange(trim(c));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={ref}
        width={W}
        height={H}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="w-full touch-none rounded-xl border-2 border-dashed border-ink bg-white"
        style={{ aspectRatio: `${W} / ${H}` }}
        aria-label="Draw your signature here"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={clear}>Clear</Button>
        <label className="inline-flex h-9 cursor-pointer items-center rounded-md border-2 border-ink bg-card px-3 text-sm font-semibold">
          Upload a photo of your signature
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
        <span className="text-xs text-muted-foreground">
          {value ? "Signature saved on this device." : dirty ? "Lift your finger to save." : "Draw above or upload."}
        </span>
      </div>
    </div>
  );
}
