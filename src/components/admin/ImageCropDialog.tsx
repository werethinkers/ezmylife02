import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";

type FitMode = "cover" | "contain";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  imageSrc: string | null;
  aspect: number;
  /** Output canvas width (px). Defaults: 1200 for preview, 512 for icon. */
  outputWidth?: number;
  /** Output canvas height (px). */
  outputHeight?: number;
  /** "cover" = the cropped region fills the canvas (may crop edges).
   *  "contain" = the cropped region is letterboxed onto a blurred backdrop (no crop). */
  fitMode?: FitMode;
  title?: string;
  onCropped: (blob: Blob) => Promise<void> | void;
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

async function exportToCanvas(
  src: string,
  area: Area,
  outW: number,
  outH: number,
  fitMode: FitMode,
): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;

  if (fitMode === "cover") {
    // Crop selected region to fill the canvas exactly.
    ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outW, outH);
  } else {
    // Letterbox: blurred backdrop + full selected region scaled to fit inside canvas.
    // 1) Blurred backdrop from the same selection (cover the canvas).
    ctx.filter = "blur(40px) brightness(0.85)";
    ctx.drawImage(img, area.x, area.y, area.width, area.height, -20, -20, outW + 40, outH + 40);
    ctx.filter = "none";
    // 2) Subtle dark gradient overlay for blending.
    const grd = ctx.createLinearGradient(0, 0, 0, outH);
    grd.addColorStop(0, "rgba(20,10,40,0.25)");
    grd.addColorStop(1, "rgba(40,10,60,0.25)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, outW, outH);
    // 3) Foreground: scale selection to fit fully inside canvas.
    const scale = Math.min(outW / area.width, outH / area.height);
    const drawW = area.width * scale;
    const drawH = area.height * scale;
    const dx = (outW - drawW) / 2;
    const dy = (outH - drawH) / 2;
    ctx.drawImage(img, area.x, area.y, area.width, area.height, dx, dy, drawW, drawH);
  }

  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.92));
}

export const ImageCropDialog = ({
  open,
  onOpenChange,
  imageSrc,
  aspect,
  outputWidth,
  outputHeight,
  fitMode: fitModeProp,
  title = "Adjust image",
  onCropped,
}: Props) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPx, setAreaPx] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [fitMode, setFitMode] = useState<FitMode>(fitModeProp ?? "contain");

  const onComplete = useCallback((_: Area, px: Area) => setAreaPx(px), []);

  // Default output: keep the requested aspect, sensible pixel sizes.
  const outW = outputWidth ?? (aspect === 1 ? 512 : 1200);
  const outH = outputHeight ?? (aspect === 1 ? 512 : 900);

  const save = async () => {
    if (!imageSrc || !areaPx) return;
    setBusy(true);
    try {
      const blob = await exportToCanvas(imageSrc, areaPx, outW, outH, fitMode);
      await onCropped(blob);
      onOpenChange(false);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              minZoom={0.1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onComplete}
            />
          )}
        </div>
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm text-muted-foreground">Zoom</label>
            <div className="inline-flex rounded-md border overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setFitMode("contain")}
                className={`px-3 py-1.5 ${fitMode === "contain" ? "bg-primary text-primary-foreground" : "bg-background"}`}
              >
                Fit (no crop)
              </button>
              <button
                type="button"
                onClick={() => setFitMode("cover")}
                className={`px-3 py-1.5 ${fitMode === "cover" ? "bg-primary text-primary-foreground" : "bg-background"}`}
              >
                Fill (crop)
              </button>
            </div>
          </div>
          <Slider value={[zoom]} min={0.1} max={4} step={0.01} onValueChange={(v) => setZoom(v[0])} />
          <p className="text-xs text-muted-foreground">
            Drag to reposition · Zoom with the slider · Output: {outW}×{outH}px ·
            {fitMode === "contain"
              ? " Fit mode keeps the entire image visible (blurred backdrop fills empty space)."
              : " Fill mode crops to exactly fit the box."}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy || !areaPx}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropDialog;
