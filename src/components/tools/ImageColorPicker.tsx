import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Copy, Check, Pipette, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

interface ColorInfo {
  hex: string;
  rgb: string;
  hsl: string;
  x: number;
  y: number;
}

export const ImageColorPicker = () => {
  const [image, setImage] = useState<string | null>(null);
  const [pickedColors, setPickedColors] = useState<ColorInfo[]>([]);
  const [currentColor, setCurrentColor] = useState<ColorInfo | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isPickerActive, setIsPickerActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setPickedColors([]);
        setCurrentColor(null);
        setIsPickerActive(true);
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
        setPickedColors([]);
        setCurrentColor(null);
        setIsPickerActive(true);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  };

  const rgbToHsl = (r: number, g: number, b: number): string => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  const handleImageClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isPickerActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b] = [pixel[0], pixel[1], pixel[2]];

    const colorInfo: ColorInfo = {
      hex: rgbToHex(r, g, b),
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: rgbToHsl(r, g, b),
      x,
      y
    };

    setPickedColors(prev => [...prev, colorInfo]);
    setCurrentColor(colorInfo);
    toast.success(`Color picked: ${colorInfo.hex}`);
  };

  const handleImageMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isPickerActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b] = [pixel[0], pixel[1], pixel[2]];

    setCurrentColor({
      hex: rgbToHex(r, g, b),
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: rgbToHsl(r, g, b),
      x,
      y
    });
  };

  const handleImageLoad = () => {
    if (!imageRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const removeColor = (index: number) => {
    setPickedColors(prev => prev.filter((_, i) => i !== index));
  };

  const exportColors = () => {
    const data = pickedColors.map(c => ({
      hex: c.hex,
      rgb: c.rgb,
      hsl: c.hsl
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'colors.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Colors exported!");
  };

  return (
    <div className="min-h-full bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Image Color Picker</h1>
          <p className="text-muted-foreground">Upload an image and click anywhere to extract colors</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Image Area */}
          <div className="lg:col-span-2 space-y-4">
            {!image ? (
              <Card
                className="rounded-2xl border-2 border-dashed border-ink/60 bg-sand/60 shadow-none p-8 sm:p-12 cursor-pointer hover:border-ink hover:bg-sun/30 transition-all"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full border-2 border-ink bg-sun">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Drop your photo here</p>
                    <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Supports JPG, PNG, WebP, GIF</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImage(null);
                      setPickedColors([]);
                      setCurrentColor(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button
                    variant={isPickerActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsPickerActive(!isPickerActive)}
                  >
                    <Pipette className="h-4 w-4 mr-2" />
                    {isPickerActive ? "Picker Active" : "Enable Picker"}
                  </Button>
                </div>
                
                <Card className="overflow-hidden relative">
                  <img
                    ref={imageRef}
                    src={image}
                    alt="Uploaded"
                    className="hidden"
                    onLoad={handleImageLoad}
                  />
                  <canvas
                    ref={canvasRef}
                    onClick={handleImageClick}
                    onMouseMove={handleImageMove}
                    className={`w-full h-auto max-h-[500px] object-contain ${isPickerActive ? 'cursor-crosshair' : 'cursor-default'}`}
                  />
                </Card>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Color Panel */}
          <div className="space-y-4">
            {/* Current Color Preview */}
            {currentColor && (
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Pipette className="h-4 w-4" />
                  <span>Current Color</span>
                </div>
                <div
                  className="h-24 rounded-lg shadow-inner border border-border/30"
                  style={{ backgroundColor: currentColor.hex }}
                />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">HEX</span>
                    <code className="font-mono text-foreground">{currentColor.hex}</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">RGB</span>
                    <code className="font-mono text-foreground text-xs">{currentColor.rgb}</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">HSL</span>
                    <code className="font-mono text-foreground text-xs">{currentColor.hsl}</code>
                  </div>
                </div>
              </Card>
            )}

            {/* Picked Colors */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Picked Colors ({pickedColors.length})
                </span>
                {pickedColors.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={exportColors}>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                )}
              </div>
              
              {pickedColors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click on the image to pick colors
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {pickedColors.map((color, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                      <div
                        className="w-10 h-10 rounded-lg shrink-0 shadow-sm border border-border/30"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="flex-1 min-w-0">
                        <code className="font-mono text-sm text-foreground">{color.hex}</code>
                        <p className="text-xs text-muted-foreground truncate">{color.rgb}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(color.hex, index)}
                        >
                          {copiedIndex === index ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeColor(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
