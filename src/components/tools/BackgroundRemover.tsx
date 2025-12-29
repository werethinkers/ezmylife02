import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Download, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

export const BackgroundRemover = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target?.result as string);
        setProcessedImage(null);
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
        setOriginalImage(event.target?.result as string);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeBackground = async () => {
    if (!originalImage || !canvasRef.current) return;

    setIsProcessing(true);
    toast.info("Processing image... This may take a moment.");

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = originalImage;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Simple background removal based on color similarity to corners
      const corners = [
        { x: 0, y: 0 },
        { x: canvas.width - 1, y: 0 },
        { x: 0, y: canvas.height - 1 },
        { x: canvas.width - 1, y: canvas.height - 1 }
      ];

      const bgColors = corners.map(corner => {
        const idx = (corner.y * canvas.width + corner.x) * 4;
        return { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
      });

      // Calculate average background color
      const avgBg = {
        r: bgColors.reduce((s, c) => s + c.r, 0) / 4,
        g: bgColors.reduce((s, c) => s + c.g, 0) / 4,
        b: bgColors.reduce((s, c) => s + c.b, 0) / 4,
      };

      const threshold = 60; // Color difference threshold

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const diff = Math.sqrt(
          Math.pow(r - avgBg.r, 2) +
          Math.pow(g - avgBg.g, 2) +
          Math.pow(b - avgBg.b, 2)
        );

        if (diff < threshold) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setProcessedImage(canvas.toDataURL('image/png'));
      toast.success("Background removed successfully!");
    } catch (error) {
      console.error('Error removing background:', error);
      toast.error("Failed to remove background. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.download = 'background-removed.png';
    link.href = processedImage;
    link.click();
    toast.success("Image downloaded!");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Background Remover</h1>
          <p className="text-muted-foreground">Remove backgrounds from images with one click</p>
        </div>

        {!originalImage ? (
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
            <p className="text-sm text-muted-foreground mt-2">Works best with solid color backgrounds</p>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Original</h3>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={originalImage} alt="Original" className="max-w-full max-h-full object-contain" />
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3">Processed</h3>
                <div 
                  className="aspect-square rounded-lg overflow-hidden flex items-center justify-center"
                  style={{
                    background: processedImage 
                      ? 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 20px 20px'
                      : undefined
                  }}
                >
                  {processedImage ? (
                    <img src={processedImage} alt="Processed" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-center text-muted-foreground bg-muted w-full h-full flex items-center justify-center">
                      <p>Click "Remove Background" to process</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={removeBackground} 
                disabled={isProcessing}
                className="flex-1 min-w-[200px]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Remove Background
                  </>
                )}
              </Button>
              
              {processedImage && (
                <Button onClick={downloadImage} variant="secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setOriginalImage(null);
                  setProcessedImage(null);
                }}
              >
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
