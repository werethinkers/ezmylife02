import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Monitor } from "lucide-react";
import { toast } from "sonner";

type DpiValue = 72 | 96 | 150 | 300 | 600;

export const DpiConverter = () => {
  const [image, setImage] = useState<string | null>(null);
  const [originalDpi, setOriginalDpi] = useState<DpiValue>(72);
  const [targetDpi, setTargetDpi] = useState<DpiValue>(300);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImageInfo({ width: img.width, height: img.height });
        };
        img.src = event.target?.result as string;
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImageInfo({ width: img.width, height: img.height });
        };
        img.src = event.target?.result as string;
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const getNewDimensions = () => {
    if (!imageInfo) return null;
    const scale = targetDpi / originalDpi;
    return {
      width: Math.round(imageInfo.width * scale),
      height: Math.round(imageInfo.height * scale),
    };
  };

  const getPrintSize = (dpi: number, pixels: { width: number; height: number }) => {
    return {
      width: (pixels.width / dpi).toFixed(2),
      height: (pixels.height / dpi).toFixed(2),
    };
  };

  const convertDpi = () => {
    if (!image || !canvasRef.current || !imageInfo) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newDimensions = getNewDimensions();
    if (!newDimensions) return;

    canvas.width = newDimensions.width;
    canvas.height = newDimensions.height;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, newDimensions.width, newDimensions.height);

      const link = document.createElement('a');
      link.download = `image-${targetDpi}dpi.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success(`Image converted to ${targetDpi} DPI and downloaded!`);
    };
    img.src = image;
  };

  const dpiOptions: DpiValue[] = [72, 96, 150, 300, 600];
  const newDimensions = getNewDimensions();

  return (
    <div className="px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-extrabold md:text-3xl">DPI Converter</h1>
          <p className="text-muted-foreground">Convert image resolution for print or web</p>
        </div>

        {!image ? (
          <Card
            className="rounded-2xl border-2 border-dashed border-ink/60 bg-sand/60 shadow-none p-12 text-center cursor-pointer transition-colors hover:border-ink hover:bg-sun/30"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Tap here to add a photo, or drop it in</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">After</h3>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <img src={image} alt="Preview" className="max-w-full max-h-full object-contain" />
              </div>
              {imageInfo && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Current: {imageInfo.width} × {imageInfo.height} px
                </p>
              )}
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">DPI Settings</h3>

              <div>
                <Label>Original DPI (estimated)</Label>
                <Select value={originalDpi.toString()} onValueChange={(v) => setOriginalDpi(Number(v) as DpiValue)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dpiOptions.map((dpi) => (
                      <SelectItem key={dpi} value={dpi.toString()}>
                        {dpi} DPI {dpi === 72 ? "(Web)" : dpi === 300 ? "(Print)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Target DPI</Label>
                <Select value={targetDpi.toString()} onValueChange={(v) => setTargetDpi(Number(v) as DpiValue)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dpiOptions.map((dpi) => (
                      <SelectItem key={dpi} value={dpi.toString()}>
                        {dpi} DPI {dpi === 72 ? "(Web)" : dpi === 300 ? "(Print)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {imageInfo && newDimensions && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>New Dimensions:</span>
                    <span className="font-medium">{newDimensions.width} × {newDimensions.height} px</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Print Size @ {targetDpi} DPI:</span>
                    <span className="font-medium">
                      {getPrintSize(targetDpi, newDimensions).width}" × {getPrintSize(targetDpi, newDimensions).height}"
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Scale Factor:</span>
                    <span className="font-medium">{(targetDpi / originalDpi).toFixed(2)}x</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setOriginalDpi(72); setTargetDpi(300); }}
                >
                  Web → Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setOriginalDpi(300); setTargetDpi(72); }}
                >
                  Print → Web
                </Button>
              </div>

              <div className="space-y-2 pt-4">
                <Button onClick={convertDpi} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Convert & Download
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setImage(null)}
                >
                  Use a different photo
                </Button>
              </div>
            </Card>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
