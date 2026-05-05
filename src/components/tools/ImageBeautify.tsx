import { useState, useRef, useCallback } from "react";
import { BulkModeToggle } from "@/components/bulk/BulkModeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Upload, Download, Sparkles, Sun, Contrast, Droplets } from "lucide-react";
import { toast } from "sonner";

export const ImageBeautify = () => {
  const [image, setImage] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
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
        resetSettings();
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
        resetSettings();
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const resetSettings = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
  };

  const getFilterString = () => {
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;
  };

  const applyPreset = (preset: string) => {
    switch (preset) {
      case "vivid":
        setBrightness(105);
        setContrast(115);
        setSaturation(130);
        setBlur(0);
        break;
      case "warm":
        setBrightness(102);
        setContrast(105);
        setSaturation(110);
        setBlur(0);
        break;
      case "cool":
        setBrightness(100);
        setContrast(105);
        setSaturation(90);
        setBlur(0);
        break;
      case "soft":
        setBrightness(105);
        setContrast(95);
        setSaturation(95);
        setBlur(0.5);
        break;
      case "dramatic":
        setBrightness(95);
        setContrast(130);
        setSaturation(110);
        setBlur(0);
        break;
    }
  };

  const downloadImage = () => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.filter = getFilterString();
      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';

      const link = document.createElement('a');
      link.download = 'beautified-image.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success("Beautified image downloaded!");
    };
    img.src = image;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Image Beautify</h1>
          <div className="flex justify-center pt-2"><BulkModeToggle toolId="image-beautify" /></div>
          <p className="text-muted-foreground">Enhance your images with professional adjustments</p>
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
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Drop an image here or click to upload</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Preview</h3>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <img 
                  src={image} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain transition-all"
                  style={{ filter: getFilterString() }}
                />
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Adjustments</h3>

              <div>
                <Label className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Brightness: {brightness}%
                </Label>
                <Slider
                  value={[brightness]}
                  onValueChange={([v]) => setBrightness(v)}
                  min={50}
                  max={150}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Contrast className="h-4 w-4" />
                  Contrast: {contrast}%
                </Label>
                <Slider
                  value={[contrast]}
                  onValueChange={([v]) => setContrast(v)}
                  min={50}
                  max={150}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Saturation: {saturation}%
                </Label>
                <Slider
                  value={[saturation]}
                  onValueChange={([v]) => setSaturation(v)}
                  min={0}
                  max={200}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Softness: {blur}px</Label>
                <Slider
                  value={[blur]}
                  onValueChange={([v]) => setBlur(v)}
                  min={0}
                  max={5}
                  step={0.5}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="mb-2 block">Quick Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {["vivid", "warm", "cool", "soft", "dramatic"].map((preset) => (
                    <Button
                      key={preset}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                    >
                      {preset.charAt(0).toUpperCase() + preset.slice(1)}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" onClick={resetSettings}>
                    Reset
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Button onClick={downloadImage} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setImage(null)}
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
