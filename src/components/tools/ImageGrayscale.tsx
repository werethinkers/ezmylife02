import { useState, useRef, useCallback } from "react";
import { BulkModeToggle } from "@/components/bulk/BulkModeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Download, Palette } from "lucide-react";
import { toast } from "sonner";

type FilterType = "grayscale" | "sepia" | "invert" | "contrast" | "brightness" | "saturate";

interface FilterOption {
  name: string;
  type: FilterType;
  value: string;
}

const filters: FilterOption[] = [
  { name: "Grayscale", type: "grayscale", value: "grayscale(100%)" },
  { name: "Sepia", type: "sepia", value: "sepia(100%)" },
  { name: "Invert", type: "invert", value: "invert(100%)" },
  { name: "High Contrast", type: "contrast", value: "contrast(150%)" },
  { name: "Brighten", type: "brightness", value: "brightness(130%)" },
  { name: "Saturate", type: "saturate", value: "saturate(200%)" },
];

export const ImageGrayscale = () => {
  const [image, setImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>(filters[0]);
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

  const applyFilter = (download: boolean = false) => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.filter = selectedFilter.value;
      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';

      const dataUrl = canvas.toDataURL('image/png');
      
      if (download) {
        const link = document.createElement('a');
        link.download = `${selectedFilter.type}-image.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Image downloaded!");
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
          <h1 className="text-3xl font-bold text-foreground">Image Filters</h1>
          <div className="flex justify-center pt-2"><BulkModeToggle toolId="image-grayscale" /></div>
          <p className="text-muted-foreground">Apply color filters to your images</p>
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
            <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Drop an image here or click to upload</p>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Choose Filter</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {filters.map((filter) => (
                  <button
                    key={filter.type}
                    onClick={() => setSelectedFilter(filter)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedFilter.type === filter.type 
                        ? "border-primary ring-2 ring-primary/30" 
                        : "border-transparent hover:border-muted-foreground/50"
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={filter.name}
                      className="w-full h-full object-cover"
                      style={{ filter: filter.value }}
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-background/80 text-xs py-1 text-center">
                      {filter.name}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Original</h3>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={image} alt="Original" className="max-w-full max-h-full object-contain" />
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-4">With {selectedFilter.name} Filter</h3>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  <img 
                    src={previewImage || image} 
                    alt="Filtered" 
                    className="max-w-full max-h-full object-contain"
                    style={{ filter: previewImage ? 'none' : selectedFilter.value }}
                  />
                </div>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => applyFilter(true)} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download {selectedFilter.name}
              </Button>
              <Button variant="outline" onClick={() => setImage(null)}>
                New Image
              </Button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
