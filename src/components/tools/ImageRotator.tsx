import { useState, useRef, useCallback } from "react";
import { BulkModeToggle } from "@/components/bulk/BulkModeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Upload, Download, RotateCw, RotateCcw, FlipHorizontal, FlipVertical } from "lucide-react";
import { toast } from "sonner";

export const ImageRotator = () => {
  const [image, setImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setRotation(0);
        setFlipX(false);
        setFlipY(false);
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
        setRotation(0);
        setFlipX(false);
        setFlipY(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const rotate90 = (direction: 'cw' | 'ccw') => {
    setRotation(prev => {
      const newRotation = direction === 'cw' ? prev + 90 : prev - 90;
      return ((newRotation % 360) + 360) % 360;
    });
  };

  const downloadImage = () => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const radians = (rotation * Math.PI) / 180;
      
      // Calculate new canvas size for rotated image
      const sin = Math.abs(Math.sin(radians));
      const cos = Math.abs(Math.cos(radians));
      const newWidth = img.width * cos + img.height * sin;
      const newHeight = img.width * sin + img.height * cos;

      canvas.width = newWidth;
      canvas.height = newHeight;

      ctx.translate(newWidth / 2, newHeight / 2);
      ctx.rotate(radians);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const link = document.createElement('a');
      link.download = 'rotated-image.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success("Image downloaded!");
    };
    img.src = image;
  };

  const getTransformStyle = () => {
    const transforms = [];
    if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
    if (flipX) transforms.push('scaleX(-1)');
    if (flipY) transforms.push('scaleY(-1)');
    return transforms.join(' ');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Image Rotator & Flipper</h1>
          <div className="flex justify-center pt-2"><BulkModeToggle toolId="image-rotator" /></div>
          <p className="text-muted-foreground">Rotate and flip images with precision</p>
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
          <div className="space-y-6">
            <Card className="p-4">
              <div className="flex items-center justify-center bg-muted rounded-lg overflow-hidden p-4" style={{ minHeight: '300px' }}>
                <img 
                  src={image} 
                  alt="Preview" 
                  className="max-w-full max-h-[400px] object-contain transition-transform duration-300"
                  style={{ transform: getTransformStyle() }}
                />
              </div>
            </Card>

            <Card className="p-4">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Quick Rotate</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => rotate90('ccw')}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      90° Left
                    </Button>
                    <Button variant="outline" onClick={() => rotate90('cw')}>
                      <RotateCw className="h-4 w-4 mr-2" />
                      90° Right
                    </Button>
                    <Button variant="outline" onClick={() => setRotation(180)}>
                      180°
                    </Button>
                    <Button variant="outline" onClick={() => setRotation(0)}>
                      Reset
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Custom Rotation: {rotation}°</h3>
                  <Slider
                    value={[rotation]}
                    onValueChange={([v]) => setRotation(v)}
                    min={0}
                    max={360}
                    step={1}
                  />
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Flip</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant={flipX ? "default" : "outline"} 
                      onClick={() => setFlipX(!flipX)}
                    >
                      <FlipHorizontal className="h-4 w-4 mr-2" />
                      Horizontal
                    </Button>
                    <Button 
                      variant={flipY ? "default" : "outline"} 
                      onClick={() => setFlipY(!flipY)}
                    >
                      <FlipVertical className="h-4 w-4 mr-2" />
                      Vertical
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={downloadImage} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={() => setImage(null)}>
                    New Image
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
