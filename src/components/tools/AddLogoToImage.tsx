import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Upload, Download, ImagePlus } from "lucide-react";
import { toast } from "sonner";

export const AddLogoToImage = () => {
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(20);
  const [logoPosition, setLogoPosition] = useState({ x: 90, y: 90 });
  const [opacity, setOpacity] = useState(100);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMainImage(event.target?.result as string);
        setPreviewUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoImage(event.target?.result as string);
        setPreviewUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent, type: 'main' | 'logo') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (type === 'main') {
          setMainImage(event.target?.result as string);
        } else {
          setLogoImage(event.target?.result as string);
        }
        setPreviewUrl(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const generatePreview = () => {
    if (!mainImage || !logoImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mainImg = new Image();
    mainImg.onload = () => {
      canvas.width = mainImg.width;
      canvas.height = mainImg.height;
      ctx.drawImage(mainImg, 0, 0);

      const logoImg = new Image();
      logoImg.onload = () => {
        const logoWidth = (mainImg.width * logoSize) / 100;
        const logoHeight = (logoImg.height / logoImg.width) * logoWidth;

        const x = (mainImg.width * logoPosition.x) / 100 - logoWidth / 2;
        const y = (mainImg.height * logoPosition.y) / 100 - logoHeight / 2;

        ctx.globalAlpha = opacity / 100;
        ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
        ctx.globalAlpha = 1;

        setPreviewUrl(canvas.toDataURL('image/png'));
      };
      logoImg.src = logoImage;
    };
    mainImg.src = mainImage;
  };

  const downloadImage = () => {
    if (!previewUrl) {
      generatePreview();
    }
    
    setTimeout(() => {
      if (!canvasRef.current) return;
      const link = document.createElement('a');
      link.download = 'image-with-logo.png';
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
      toast.success("Image downloaded!");
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Add Logo to Image</h1>
          <p className="text-muted-foreground">Overlay your logo or watermark on images</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card
            className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
              mainImage ? 'border-primary/50' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={(e) => handleDrop(e, 'main')}
            onDragOver={handleDragOver}
            onClick={() => mainInputRef.current?.click()}
          >
            <input
              type="file"
              ref={mainInputRef}
              onChange={handleMainImageUpload}
              accept="image/*"
              className="hidden"
            />
            {mainImage ? (
              <div className="space-y-2">
                <img src={mainImage} alt="Main" className="max-h-32 mx-auto object-contain" />
                <p className="text-sm text-muted-foreground">Main image ✓</p>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium">Upload Main Image</p>
              </>
            )}
          </Card>

          <Card
            className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
              logoImage ? 'border-primary/50' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={(e) => handleDrop(e, 'logo')}
            onDragOver={handleDragOver}
            onClick={() => logoInputRef.current?.click()}
          >
            <input
              type="file"
              ref={logoInputRef}
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
            />
            {logoImage ? (
              <div className="space-y-2">
                <img src={logoImage} alt="Logo" className="max-h-32 mx-auto object-contain" />
                <p className="text-sm text-muted-foreground">Logo ✓</p>
              </div>
            ) : (
              <>
                <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium">Upload Logo</p>
              </>
            )}
          </Card>
        </div>

        {mainImage && logoImage && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Preview</h3>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <img 
                  src={previewUrl || mainImage} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain" 
                />
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Logo Settings</h3>

              <div>
                <Label>Logo Size: {logoSize}%</Label>
                <Slider
                  value={[logoSize]}
                  onValueChange={([v]) => { setLogoSize(v); setPreviewUrl(null); }}
                  min={5}
                  max={50}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Horizontal Position: {logoPosition.x}%</Label>
                <Slider
                  value={[logoPosition.x]}
                  onValueChange={([v]) => { setLogoPosition(p => ({ ...p, x: v })); setPreviewUrl(null); }}
                  min={0}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Vertical Position: {logoPosition.y}%</Label>
                <Slider
                  value={[logoPosition.y]}
                  onValueChange={([v]) => { setLogoPosition(p => ({ ...p, y: v })); setPreviewUrl(null); }}
                  min={0}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Opacity: {opacity}%</Label>
                <Slider
                  value={[opacity]}
                  onValueChange={([v]) => { setOpacity(v); setPreviewUrl(null); }}
                  min={10}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div className="space-y-2 pt-4">
                <Button onClick={generatePreview} variant="secondary" className="w-full">
                  Update Preview
                </Button>
                <Button onClick={downloadImage} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMainImage(null);
                    setLogoImage(null);
                    setPreviewUrl(null);
                  }}
                >
                  Start Over
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
