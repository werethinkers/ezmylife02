import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Upload, Download, Plus, X, Merge, ArrowRight, ArrowDown } from "lucide-react";
import { toast } from "sonner";

type Direction = "horizontal" | "vertical" | "grid";

export const ImageMerger = () => {
  const [images, setImages] = useState<string[]>([]);
  const [direction, setDirection] = useState<Direction>("horizontal");
  const [spacing, setSpacing] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImages(prev => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImages(prev => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const mergeImages = async () => {
    if (images.length < 2) {
      toast.error("Please add at least 2 images to merge");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load all images
    const loadedImages = await Promise.all(
      images.map(src => {
        return new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = src;
        });
      })
    );

    if (direction === "horizontal") {
      const totalWidth = loadedImages.reduce((sum, img) => sum + img.width, 0) + spacing * (loadedImages.length - 1);
      const maxHeight = Math.max(...loadedImages.map(img => img.height));

      canvas.width = totalWidth;
      canvas.height = maxHeight;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let x = 0;
      loadedImages.forEach((img) => {
        const y = (maxHeight - img.height) / 2;
        ctx.drawImage(img, x, y);
        x += img.width + spacing;
      });
    } else if (direction === "vertical") {
      const maxWidth = Math.max(...loadedImages.map(img => img.width));
      const totalHeight = loadedImages.reduce((sum, img) => sum + img.height, 0) + spacing * (loadedImages.length - 1);

      canvas.width = maxWidth;
      canvas.height = totalHeight;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let y = 0;
      loadedImages.forEach((img) => {
        const x = (maxWidth - img.width) / 2;
        ctx.drawImage(img, x, y);
        y += img.height + spacing;
      });
    } else {
      // Grid layout
      const cols = Math.ceil(Math.sqrt(loadedImages.length));
      const rows = Math.ceil(loadedImages.length / cols);
      const maxCellWidth = Math.max(...loadedImages.map(img => img.width));
      const maxCellHeight = Math.max(...loadedImages.map(img => img.height));

      canvas.width = cols * maxCellWidth + spacing * (cols - 1);
      canvas.height = rows * maxCellHeight + spacing * (rows - 1);

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      loadedImages.forEach((img, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = col * (maxCellWidth + spacing) + (maxCellWidth - img.width) / 2;
        const y = row * (maxCellHeight + spacing) + (maxCellHeight - img.height) / 2;
        ctx.drawImage(img, x, y);
      });
    }

    const link = document.createElement('a');
    link.download = 'merged-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success("Images merged and downloaded!");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Image Merger</h1>
          <p className="text-muted-foreground">Combine multiple images into one</p>
        </div>

        <Card
          className="border-2 border-dashed border-muted-foreground/25 p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            className="hidden"
          />
          <Plus className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-medium text-foreground">Add Images</p>
          <p className="text-sm text-muted-foreground mt-1">Drop images here or click to upload (multiple allowed)</p>
        </Card>

        {images.length > 0 && (
          <>
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Images to Merge ({images.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img src={img} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-background/80 text-xs px-2 py-0.5 rounded">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Merge Settings</h3>

              <div>
                <Label>Direction</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={direction === "horizontal" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDirection("horizontal")}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Horizontal
                  </Button>
                  <Button
                    variant={direction === "vertical" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDirection("vertical")}
                  >
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Vertical
                  </Button>
                  <Button
                    variant={direction === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDirection("grid")}
                  >
                    <Merge className="h-4 w-4 mr-2" />
                    Grid
                  </Button>
                </div>
              </div>

              <div>
                <Label>Spacing: {spacing}px</Label>
                <Slider
                  value={[spacing]}
                  onValueChange={([v]) => setSpacing(v)}
                  min={0}
                  max={50}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center gap-3">
                <Label>Background Color:</Label>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={mergeImages} className="flex-1" disabled={images.length < 2}>
                  <Merge className="h-4 w-4 mr-2" />
                  Merge & Download
                </Button>
                <Button variant="outline" onClick={() => setImages([])}>
                  Clear All
                </Button>
              </div>
            </Card>
          </>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
