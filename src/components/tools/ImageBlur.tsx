import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Eye } from "lucide-react";
import { toast } from "sonner";

type BlurType = "gaussian" | "motion" | "radial";

export const ImageBlur = () => {
  const [image, setImage] = useState<string | null>(null);
  const [blurRadius, setBlurRadius] = useState(5);
  const [blurType, setBlurType] = useState<BlurType>("gaussian");
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

  const applyBlur = (download: boolean = false) => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Apply CSS filter for blur
      ctx.filter = `blur(${blurRadius}px)`;
      
      // Draw with extra margin to avoid edge artifacts
      const margin = blurRadius * 2;
      ctx.drawImage(img, -margin, -margin, img.width + margin * 2, img.height + margin * 2);
      
      // Reset filter
      ctx.filter = 'none';

      const dataUrl = canvas.toDataURL('image/png');
      
      if (download) {
        const link = document.createElement('a');
        link.download = 'blurred-image.png';
        link.href = dataUrl;
        link.click();
        toast.success("Blurred image downloaded!");
      } else {
        setPreviewImage(dataUrl);
      }
    };
    img.src = image;
  };

  return (
    <div className="px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-extrabold md:text-3xl">Image Blur</h1>
          <p className="text-muted-foreground">Apply blur effects to your images</p>
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
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Tap here to add a photo, or drop it in</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">After</h3>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <img 
                  src={previewImage || image} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain" 
                />
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Blur Settings</h3>

              <div>
                <Label>Blur Type</Label>
                <Select value={blurType} onValueChange={(v) => setBlurType(v as BlurType)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gaussian">Gaussian Blur</SelectItem>
                    <SelectItem value="motion">Motion Blur</SelectItem>
                    <SelectItem value="radial">Radial Blur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Blur Intensity: {blurRadius}px</Label>
                <Slider
                  value={[blurRadius]}
                  onValueChange={([v]) => setBlurRadius(v)}
                  min={1}
                  max={50}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div className="space-y-2 pt-4">
                <Button onClick={() => applyBlur(false)} variant="secondary" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button onClick={() => applyBlur(true)} className="w-full">
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
