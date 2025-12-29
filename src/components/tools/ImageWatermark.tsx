import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Type, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

type WatermarkType = "text" | "image";
type Position = "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right" | "tile";

export const ImageWatermark = () => {
  const [image, setImage] = useState<string | null>(null);
  const [watermarkType, setWatermarkType] = useState<WatermarkType>("text");
  const [watermarkText, setWatermarkText] = useState("© Your Name");
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(50);
  const [fontSize, setFontSize] = useState(24);
  const [position, setPosition] = useState<Position>("bottom-right");
  const [color, setColor] = useState("#ffffff");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setWatermarkImage(event.target?.result as string);
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
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const getPosition = (canvasWidth: number, canvasHeight: number, watermarkWidth: number, watermarkHeight: number) => {
    const padding = 20;
    const positions: Record<Position, { x: number; y: number }> = {
      "top-left": { x: padding, y: padding + watermarkHeight },
      "top-right": { x: canvasWidth - watermarkWidth - padding, y: padding + watermarkHeight },
      "center": { x: (canvasWidth - watermarkWidth) / 2, y: (canvasHeight + watermarkHeight) / 2 },
      "bottom-left": { x: padding, y: canvasHeight - padding },
      "bottom-right": { x: canvasWidth - watermarkWidth - padding, y: canvasHeight - padding },
      "tile": { x: 0, y: 0 },
    };
    return positions[position];
  };

  const applyWatermark = () => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      ctx.globalAlpha = opacity / 100;

      if (watermarkType === "text") {
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'bottom';

        const textWidth = ctx.measureText(watermarkText).width;

        if (position === "tile") {
          const spacingX = textWidth + 100;
          const spacingY = fontSize + 50;
          ctx.rotate(-Math.PI / 6);
          for (let y = -canvas.height; y < canvas.height * 2; y += spacingY) {
            for (let x = -canvas.width; x < canvas.width * 2; x += spacingX) {
              ctx.fillText(watermarkText, x, y);
            }
          }
          ctx.rotate(Math.PI / 6);
        } else {
          const pos = getPosition(canvas.width, canvas.height, textWidth, fontSize);
          ctx.fillText(watermarkText, pos.x, pos.y);
        }
      } else if (watermarkType === "image" && watermarkImage) {
        const wmImg = new Image();
        wmImg.onload = () => {
          const maxWmWidth = canvas.width * 0.3;
          const scale = Math.min(1, maxWmWidth / wmImg.width);
          const wmWidth = wmImg.width * scale;
          const wmHeight = wmImg.height * scale;

          if (position === "tile") {
            const spacingX = wmWidth + 50;
            const spacingY = wmHeight + 50;
            for (let y = 0; y < canvas.height; y += spacingY) {
              for (let x = 0; x < canvas.width; x += spacingX) {
                ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
              }
            }
          } else {
            const pos = getPosition(canvas.width, canvas.height, wmWidth, wmHeight);
            ctx.drawImage(wmImg, pos.x, pos.y - wmHeight, wmWidth, wmHeight);
          }

          downloadImage();
        };
        wmImg.src = watermarkImage;
        return;
      }

      downloadImage();
    };
    img.src = image;
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'watermarked-image.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    toast.success("Watermarked image downloaded!");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Image Watermark</h1>
          <p className="text-muted-foreground">Add text or image watermarks to protect your images</p>
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
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Preview</h3>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <img src={image} alt="Preview" className="max-w-full max-h-full object-contain" />
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Watermark Settings</h3>

              <div className="flex gap-2">
                <Button
                  variant={watermarkType === "text" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWatermarkType("text")}
                >
                  <Type className="h-4 w-4 mr-2" />
                  Text
                </Button>
                <Button
                  variant={watermarkType === "image" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWatermarkType("image")}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Image
                </Button>
              </div>

              {watermarkType === "text" ? (
                <>
                  <div>
                    <Label htmlFor="watermark-text">Watermark Text</Label>
                    <Input
                      id="watermark-text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Enter watermark text"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label>Font Size: {fontSize}px</Label>
                      <Slider
                        value={[fontSize]}
                        onValueChange={([v]) => setFontSize(v)}
                        min={12}
                        max={72}
                        step={1}
                      />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <Input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <Label>Watermark Image</Label>
                  <Button
                    variant="outline"
                    className="w-full mt-1"
                    onClick={() => watermarkInputRef.current?.click()}
                  >
                    {watermarkImage ? "Change Image" : "Upload Watermark Image"}
                  </Button>
                  <input
                    type="file"
                    ref={watermarkInputRef}
                    onChange={handleWatermarkUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              )}

              <div>
                <Label>Position</Label>
                <Select value={position} onValueChange={(v) => setPosition(v as Position)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="tile">Tile (Repeat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Opacity: {opacity}%</Label>
                <Slider
                  value={[opacity]}
                  onValueChange={([v]) => setOpacity(v)}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>

              <Button onClick={applyWatermark} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Apply & Download
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setImage(null)}
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
