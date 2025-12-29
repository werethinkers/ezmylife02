import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Upload, Download, Grid3X3 } from "lucide-react";
import { toast } from "sonner";

export const ImagePixelate = () => {
  const [image, setImage] = useState<string | null>(null);
  const [pixelSize, setPixelSize] = useState(10);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setPreviewImage(null);
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
        setImage(event.target?.result as string);
        setPreviewImage(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const applyPixelation = (download: boolean = false) => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Create a small canvas for pixelation
      const smallCanvas = document.createElement('canvas');
      const smallCtx = smallCanvas.getContext('2d');
      if (!smallCtx) return;

      const smallWidth = Math.ceil(img.width / pixelSize);
      const smallHeight = Math.ceil(img.height / pixelSize);
      
      smallCanvas.width = smallWidth;
      smallCanvas.height = smallHeight;

      // Draw small version
      smallCtx.drawImage(img, 0, 0, smallWidth, smallHeight);

      // Draw scaled up version (pixelated)
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(smallCanvas, 0, 0, smallWidth, smallHeight, 0, 0, img.width, img.height);

      const dataUrl = canvas.toDataURL('image/png');
      
      if (download) {
        const link = document.createElement('a');
        link.download = 'pixelated-image.png';
        link.href = dataUrl;
        link.click();
        toast.success("Pixelated image downloaded!");
      } else {
        setPreviewImage(dataUrl);
      }
    };
    img.src = image;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Image Pixelate</h1>
          <p className="text-muted-foreground">Create pixelated/mosaic effects on images</p>
        </div>

        {!image ? (
          <Card
            className="border-2 border-dashed border-muted-foreground/25 p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
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
            <Grid3X3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Drop an image here or click to upload</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Preview</h3>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <img 
                  src={previewImage || image} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain" 
                  style={{ imageRendering: previewImage ? 'pixelated' : 'auto' }}
                />
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Pixelation Settings</h3>

              <div>
                <Label>Pixel Size: {pixelSize}px</Label>
                <Slider
                  value={[pixelSize]}
                  onValueChange={([v]) => setPixelSize(v)}
                  min={2}
                  max={50}
                  step={1}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Higher values = more pixelated
                </p>
              </div>

              <div className="flex gap-2">
                {[5, 10, 20, 30].map((size) => (
                  <Button
                    key={size}
                    variant={pixelSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPixelSize(size)}
                  >
                    {size}px
                  </Button>
                ))}
              </div>

              <div className="space-y-2 pt-4">
                <Button onClick={() => applyPixelation(false)} variant="secondary" className="w-full">
                  Preview Effect
                </Button>
                <Button onClick={() => applyPixelation(true)} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Apply & Download
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setImage(null);
                    setPreviewImage(null);
                  }}
                >
                  Upload New Image
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
