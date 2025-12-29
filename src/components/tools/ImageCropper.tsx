import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Crop, RotateCcw, Square, Circle } from "lucide-react";
import { toast } from "sonner";

type CropShape = "rectangle" | "circle" | "square";
type AspectRatio = "free" | "1:1" | "4:3" | "16:9" | "3:2" | "2:3";

export const ImageCropper = () => {
  const [image, setImage] = useState<string | null>(null);
  const [cropShape, setCropShape] = useState<CropShape>("rectangle");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("free");
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 200, height: 150 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatios: Record<AspectRatio, number | null> = {
    "free": null,
    "1:1": 1,
    "4:3": 4/3,
    "16:9": 16/9,
    "3:2": 3/2,
    "2:3": 2/3,
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
          setCropArea({ x: 50, y: 50, width: Math.min(200, img.width - 100), height: Math.min(150, img.height - 100) });
        };
        img.src = event.target?.result as string;
        setImage(event.target?.result as string);
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
          setImageSize({ width: img.width, height: img.height });
          setCropArea({ x: 50, y: 50, width: Math.min(200, img.width - 100), height: Math.min(150, img.height - 100) });
        };
        img.src = event.target?.result as string;
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;
    
    const deltaX = (e.clientX - dragStart.x) * scaleX;
    const deltaY = (e.clientY - dragStart.y) * scaleY;

    if (isDragging) {
      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(imageSize.width - prev.width, prev.x + deltaX)),
        y: Math.max(0, Math.min(imageSize.height - prev.height, prev.y + deltaY)),
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }

    if (isResizing && resizeHandle) {
      setCropArea(prev => {
        let newArea = { ...prev };
        const ratio = aspectRatios[aspectRatio];

        if (resizeHandle.includes('e')) {
          newArea.width = Math.max(50, Math.min(imageSize.width - prev.x, prev.width + deltaX));
        }
        if (resizeHandle.includes('w')) {
          const newWidth = Math.max(50, prev.width - deltaX);
          newArea.x = prev.x + (prev.width - newWidth);
          newArea.width = newWidth;
        }
        if (resizeHandle.includes('s')) {
          newArea.height = Math.max(50, Math.min(imageSize.height - prev.y, prev.height + deltaY));
        }
        if (resizeHandle.includes('n')) {
          const newHeight = Math.max(50, prev.height - deltaY);
          newArea.y = prev.y + (prev.height - newHeight);
          newArea.height = newHeight;
        }

        if (ratio) {
          newArea.height = newArea.width / ratio;
        }

        if (cropShape === "square" || cropShape === "circle") {
          newArea.height = newArea.width;
        }

        return newArea;
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, isResizing, resizeHandle, dragStart, imageSize, aspectRatio, cropShape]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const cropImage = () => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    const img = new Image();
    img.onload = () => {
      if (cropShape === "circle") {
        ctx.beginPath();
        ctx.arc(cropArea.width / 2, cropArea.height / 2, Math.min(cropArea.width, cropArea.height) / 2, 0, Math.PI * 2);
        ctx.clip();
      }
      
      ctx.drawImage(
        img,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
        0, 0, cropArea.width, cropArea.height
      );
      
      const link = document.createElement('a');
      link.download = 'cropped-image.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success("Image cropped and downloaded!");
    };
    img.src = image;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Image Cropper</h1>
          <p className="text-muted-foreground">Crop images with custom shapes and aspect ratios</p>
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
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex gap-2">
                  <Button
                    variant={cropShape === "rectangle" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCropShape("rectangle")}
                  >
                    <Crop className="h-4 w-4 mr-2" />
                    Rectangle
                  </Button>
                  <Button
                    variant={cropShape === "square" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCropShape("square")}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Square
                  </Button>
                  <Button
                    variant={cropShape === "circle" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCropShape("circle")}
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    Circle
                  </Button>
                </div>

                {cropShape === "rectangle" && (
                  <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as AspectRatio)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Aspect Ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="1:1">1:1</SelectItem>
                      <SelectItem value="4:3">4:3</SelectItem>
                      <SelectItem value="16:9">16:9</SelectItem>
                      <SelectItem value="3:2">3:2</SelectItem>
                      <SelectItem value="2:3">2:3</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div 
                ref={containerRef}
                className="relative bg-muted rounded-lg overflow-hidden"
                style={{ maxHeight: '500px' }}
              >
                <img 
                  src={image} 
                  alt="To crop" 
                  className="w-full h-auto"
                  style={{ opacity: 0.5 }}
                />
                
                <div
                  className={`absolute border-2 border-primary cursor-move ${cropShape === "circle" ? "rounded-full" : ""}`}
                  style={{
                    left: `${(cropArea.x / imageSize.width) * 100}%`,
                    top: `${(cropArea.y / imageSize.height) * 100}%`,
                    width: `${(cropArea.width / imageSize.width) * 100}%`,
                    height: `${(cropArea.height / imageSize.height) * 100}%`,
                    backgroundImage: `url(${image})`,
                    backgroundPosition: `-${(cropArea.x / imageSize.width) * 100}% -${(cropArea.y / imageSize.height) * 100}%`,
                    backgroundSize: `${(imageSize.width / cropArea.width) * 100}% auto`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e)}
                >
                  {/* Resize handles */}
                  {["nw", "ne", "sw", "se", "n", "s", "e", "w"].map((handle) => (
                    <div
                      key={handle}
                      className="absolute w-3 h-3 bg-primary border border-background rounded-sm"
                      style={{
                        cursor: handle.length === 2 ? `${handle}-resize` : `${handle === 'n' || handle === 's' ? 'ns' : 'ew'}-resize`,
                        ...(handle.includes('n') && { top: -6 }),
                        ...(handle.includes('s') && { bottom: -6 }),
                        ...(handle.includes('e') && { right: -6 }),
                        ...(handle.includes('w') && { left: -6 }),
                        ...(handle === 'n' && { left: '50%', transform: 'translateX(-50%)' }),
                        ...(handle === 's' && { left: '50%', transform: 'translateX(-50%)' }),
                        ...(handle === 'e' && { top: '50%', transform: 'translateY(-50%)' }),
                        ...(handle === 'w' && { top: '50%', transform: 'translateY(-50%)' }),
                      }}
                      onMouseDown={(e) => handleMouseDown(e, handle)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={cropImage} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Crop & Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCropArea({ x: 50, y: 50, width: 200, height: 150 })}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button variant="outline" onClick={() => setImage(null)}>
                  New Image
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
