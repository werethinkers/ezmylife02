import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, FileDown, Gauge } from "lucide-react";
import { toast } from "sonner";

type CompressionMode = "quality" | "size";

export const ImageCompressor = () => {
  const [image, setImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [quality, setQuality] = useState(80);
  const [targetSize, setTargetSize] = useState(100);
  const [mode, setMode] = useState<CompressionMode>("quality");
  const [outputFormat, setOutputFormat] = useState<"jpeg" | "webp" | "png">("jpeg");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalSize(file.size);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setCompressedImage(null);
        setCompressedSize(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setOriginalSize(file.size);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setCompressedImage(null);
        setCompressedSize(0);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const compressWithQuality = (img: HTMLImageElement, q: number): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const mimeType = outputFormat === 'png' ? 'image/png' : `image/${outputFormat}`;
    return canvas.toDataURL(mimeType, q / 100);
  };

  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || '';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const compressImage = () => {
    if (!image) return;

    const img = new Image();
    img.onload = () => {
      if (mode === "quality") {
        const compressed = compressWithQuality(img, quality);
        const blob = dataURLtoBlob(compressed);
        setCompressedSize(blob.size);
        setCompressedImage(compressed);
        toast.success(`Image compressed to ${formatBytes(blob.size)}`);
      } else {
        // Binary search for target size
        const targetBytes = targetSize * 1024; // Convert KB to bytes
        let low = 1;
        let high = 100;
        let bestResult = '';
        let bestSize = 0;

        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          const compressed = compressWithQuality(img, mid);
          const blob = dataURLtoBlob(compressed);
          
          if (blob.size <= targetBytes) {
            bestResult = compressed;
            bestSize = blob.size;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }

        if (bestResult) {
          setCompressedSize(bestSize);
          setCompressedImage(bestResult);
          toast.success(`Image compressed to ${formatBytes(bestSize)}`);
        } else {
          toast.error("Could not achieve target size. Try a larger target.");
        }
      }
    };
    img.src = image;
  };

  const downloadImage = () => {
    if (!compressedImage) return;

    const link = document.createElement('a');
    link.download = `compressed-image.${outputFormat}`;
    link.href = compressedImage;
    link.click();
    toast.success("Image downloaded!");
  };

  const compressionRatio = compressedSize > 0 
    ? Math.round((1 - compressedSize / originalSize) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Image Compressor</h1>
          <p className="text-muted-foreground">Reduce image file size while maintaining quality</p>
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
            <p className="text-sm text-muted-foreground mt-2">Supports JPG, PNG, and WebP</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Preview</h3>
                <span className="text-sm text-muted-foreground">
                  Original: {formatBytes(originalSize)}
                </span>
              </div>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <img 
                  src={compressedImage || image} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain" 
                />
              </div>
              
              {compressedSize > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Compressed: {formatBytes(compressedSize)}</span>
                    <span className="text-green-600 font-medium">-{compressionRatio}%</span>
                  </div>
                  <div className="w-full bg-muted-foreground/20 rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${100 - compressionRatio}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Compression Settings</h3>

              <div className="flex gap-2">
                <Button
                  variant={mode === "quality" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("quality")}
                  className="flex-1"
                >
                  <Gauge className="h-4 w-4 mr-2" />
                  By Quality
                </Button>
                <Button
                  variant={mode === "size" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("size")}
                  className="flex-1"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  By Size
                </Button>
              </div>

              {mode === "quality" ? (
                <div>
                  <Label>Quality: {quality}%</Label>
                  <Slider
                    value={[quality]}
                    onValueChange={([v]) => setQuality(v)}
                    min={10}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Lower quality = smaller file size
                  </p>
                </div>
              ) : (
                <div>
                  <Label>Target Size (KB)</Label>
                  <Input
                    type="number"
                    value={targetSize}
                    onChange={(e) => setTargetSize(Number(e.target.value))}
                    min={10}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Will compress to approximately this size
                  </p>
                </div>
              )}

              <div>
                <Label>Output Format</Label>
                <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as "jpeg" | "webp" | "png")}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jpeg">JPEG (smallest)</SelectItem>
                    <SelectItem value="webp">WebP (modern)</SelectItem>
                    <SelectItem value="png">PNG (lossless)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-4">
                <Button onClick={compressImage} className="w-full">
                  Compress Image
                </Button>
                
                {compressedImage && (
                  <Button onClick={downloadImage} variant="secondary" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Compressed
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setImage(null);
                    setCompressedImage(null);
                    setCompressedSize(0);
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
