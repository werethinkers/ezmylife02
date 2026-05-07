import { Button } from "@/components/ui/button";
import { Download, Package } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { AngleResult } from "./types";
import { toast } from "sonner";

interface Props {
  results: AngleResult[];
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);/)?.[1] || "image/png";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export const Downloads = ({ results }: Props) => {
  const done = results.filter((r) => r.status === "done" && r.url);

  const downloadOne = (r: AngleResult, transparent: boolean) => {
    const url = transparent ? r.transparentUrl : r.url;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.angle}${transparent ? "_transparent" : ""}.png`;
    a.click();
  };

  const zipAll = async (transparent: boolean) => {
    if (!done.length) return;
    const zip = new JSZip();
    done.forEach((r) => {
      const url = transparent ? r.transparentUrl : r.url;
      if (url) zip.file(`${r.angle}${transparent ? "_transparent" : ""}.png`, dataUrlToBlob(url));
    });
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `productvision360${transparent ? "_transparent" : ""}.zip`);
    toast.success("Downloaded zip");
  };

  if (!done.length) {
    return <p className="text-sm text-muted-foreground">No angles to download yet.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => zipAll(false)}>
          <Package className="h-4 w-4 mr-2" /> Download all (white BG)
        </Button>
        <Button onClick={() => zipAll(true)} variant="secondary">
          <Package className="h-4 w-4 mr-2" /> Download all (transparent)
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {done.map((r) => (
          <div key={r.angle} className="rounded-lg border border-border bg-card/50 backdrop-blur p-3 space-y-2">
            <img src={r.url} alt={r.angle} className="aspect-square w-full object-contain bg-muted/30 rounded" />
            <p className="text-xs font-medium">{r.angle}</p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => downloadOne(r, false)}>
                <Download className="h-3 w-3 mr-1" /> PNG
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => downloadOne(r, true)}>
                <Download className="h-3 w-3 mr-1" /> Cutout
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
