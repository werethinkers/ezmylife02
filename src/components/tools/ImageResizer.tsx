import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Image as ImageIcon, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

type Unit = "px" | "cm" | "mm" | "inch";

const unitConversions: Record<Unit, number> = {
  px: 1,
  cm: 37.7953, // 96 DPI
  mm: 3.77953,
  inch: 96,
};

export const ImageResizer = () => {
  const [image, setImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [unit, setUnit] = useState<Unit>("px");
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setOriginalSize({ width: img.width, height: img.height });
          setWidth(img.width);
          setHeight(img.height);
          setAspectRatio(img.width / img.height);
          setImage(event.target?.result as string);
        };
        img.src = event.target?.result as string;
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
          setOriginalSize({ width: img.width, height: img.height });
          setWidth(img.width);
          setHeight(img.height);
          setAspectRatio(img.width / img.height);
          setImage(event.target?.result as string);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const convertToPixels = (value: number, fromUnit: Unit): number => {
    return Math.round(value * unitConversions[fromUnit]);
  };

  const convertFromPixels = (value: number, toUnit: Unit): number => {
    return Math.round((value / unitConversions[toUnit]) * 100) / 100;
  };

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (maintainAspectRatio) {
      const widthInPx = convertToPixels(newWidth, unit);
      const newHeightInPx = widthInPx / aspectRatio;
      setHeight(convertFromPixels(newHeightInPx, unit));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (maintainAspectRatio) {
      const heightInPx = convertToPixels(newHeight, unit);
      const newWidthInPx = heightInPx * aspectRatio;
      setWidth(convertFromPixels(newWidthInPx, unit));
    }
  };

  const handleUnitChange = (newUnit: Unit) => {
    const widthInPx = convertToPixels(width, unit);
    const heightInPx = convertToPixels(height, unit);
    setWidth(convertFromPixels(widthInPx, newUnit));
    setHeight(convertFromPixels(heightInPx, newUnit));
    setUnit(newUnit);
  };

  const resizeImage = () => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetWidth = convertToPixels(width, unit);
    const targetHeight = convertToPixels(height, unit);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      toast.success("Image resized successfully!");
    };
    img.src = image;
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'resized-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success("Image downloaded!");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Image Resizer</h1>
          <p className="text-muted-foreground">Resize images to any dimension in pixels, cm, mm, or inches</p>
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
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Drop an image here or click to upload</p>
            <p className="text-sm text-muted-foreground mt-2">Supports JPG, PNG, WebP, and more</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Preview
              </h3>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <img src={image} alt="Preview" className="max-w-full max-h-full object-contain" />
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Original: {originalSize.width} × {originalSize.height} px
              </p>
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Resize Settings</h3>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="width">Width</Label>
                    <Input
                      id="width"
                      type="number"
                      value={width}
                      onChange={(e) => handleWidthChange(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      type="number"
                      value={height}
                      onChange={(e) => handleHeightChange(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Unit</Label>
                    <Select value={unit} onValueChange={(v) => handleUnitChange(v as Unit)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="px">Pixels (px)</SelectItem>
                        <SelectItem value="cm">Centimeters (cm)</SelectItem>
                        <SelectItem value="mm">Millimeters (mm)</SelectItem>
                        <SelectItem value="inch">Inches</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                    title={maintainAspectRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
                  >
                    {maintainAspectRatio ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={resizeImage} className="flex-1">
                  Resize Image
                </Button>
                <Button onClick={downloadImage} variant="secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setImage(null);
                  setWidth(0);
                  setHeight(0);
                }}
              >
                Upload New Image
              </Button>
            </Card>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
