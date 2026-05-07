import { useCallback, useState } from "react";
import { Upload, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

/** Resizes an image client-side so the base64 payload stays under ~5 MB. */
async function maybeResize(file: File): Promise<{ base64: string; mimeType: string }> {
  const buf = await file.arrayBuffer();
  const sizeMB = buf.byteLength / (1024 * 1024);
  if (sizeMB <= 4) {
    let bin = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    return { base64: btoa(bin), mimeType: file.type || "image/png" };
  }
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(url);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  return { base64: dataUrl.split(",")[1], mimeType: "image/jpeg" };
}

export async function fileToPayload(file: File) {
  return maybeResize(file);
}

export const FileUpload = ({ onFile, disabled }: Props) => {
  const [drag, setDrag] = useState(false);

  const handle = useCallback((files: FileList | null) => {
    if (!files || !files[0]) return;
    const f = files[0];
    if (!f.type.startsWith("image/")) return;
    onFile(f);
  }, [onFile]);

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card/50 backdrop-blur p-12 cursor-pointer transition-all hover:border-primary/60 hover:bg-card/70",
        drag && "border-primary bg-primary/5",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <ImageIcon className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold">Drop your product photo</p>
        <p className="text-sm text-muted-foreground">or click to browse · JPG / PNG · up to 20 MB</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Upload className="h-3 w-3" /> A clean isolated product image works best
      </div>
      <input
        type="file"
        accept="image/*"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(e) => handle(e.target.files)}
        disabled={disabled}
      />
    </label>
  );
};
