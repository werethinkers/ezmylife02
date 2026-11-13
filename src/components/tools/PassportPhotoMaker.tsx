import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, FileText, Printer, User } from "lucide-react";
import { toast } from "sonner";
import { GooglePhotosButton } from "@/components/GooglePhotosPicker";
import { makePhotoSheetPdf, sheetFit, type Paper } from "@/apps/output/photoSheet";
import { saveFile } from "@/apps/output/save";

type PhotoSize = {
  name: string;
  width: number;
  height: number;
  unit: string;
  widthPx: number;
  heightPx: number;
};

const photoSizes: PhotoSize[] = [
  { name: "Passport (35x45mm)", width: 35, height: 45, unit: "mm", widthPx: 132, heightPx: 170 },
  { name: "Visa (2x2 inch)", width: 2, height: 2, unit: "inch", widthPx: 192, heightPx: 192 },
  { name: "ID Card (25x35mm)", width: 25, height: 35, unit: "mm", widthPx: 94, heightPx: 132 },
  { name: "Aadhaar (35x45mm)", width: 35, height: 45, unit: "mm", widthPx: 132, heightPx: 170 },
  { name: "PAN Card (25x35mm)", width: 25, height: 35, unit: "mm", widthPx: 94, heightPx: 132 },
  { name: "SSC/UPSC (35x45mm)", width: 35, height: 45, unit: "mm", widthPx: 132, heightPx: 170 },
  { name: "Custom 3.5x4.5cm", width: 35, height: 45, unit: "mm", widthPx: 132, heightPx: 170 },
];

type BackgroundColor = "white" | "blue" | "red" | "custom";

const backgroundColors: Record<BackgroundColor, string> = {
  white: "#FFFFFF",
  blue: "#0066CC",
  red: "#CC0000",
  custom: "#FFFFFF",
};

export const PassportPhotoMaker = () => {
  const [image, setImage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<PhotoSize>(photoSizes[0]);
  const [backgroundColor, setBackgroundColor] = useState<BackgroundColor>("white");
  const [customColor, setCustomColor] = useState("#FFFFFF");
  const [copies, setCopies] = useState(4);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const generatePhotos = (forPrint: boolean = false) => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = forPrint ? 3 : 1; // Higher quality for print
    const photoWidth = selectedSize.widthPx * scale;
    const photoHeight = selectedSize.heightPx * scale;
    const padding = 10 * scale;
    
    // A4 size at 96 DPI (or scaled for print)
    const cols = Math.floor((794 * scale) / (photoWidth + padding));
    const rows = Math.ceil(copies / cols);
    
    canvas.width = cols * (photoWidth + padding) + padding;
    canvas.height = rows * (photoHeight + padding) + padding;

    // Fill with white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bgColor = backgroundColor === "custom" ? customColor : backgroundColors[backgroundColor];

    const img = new Image();
    img.onload = () => {
      for (let i = 0; i < copies; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = padding + col * (photoWidth + padding);
        const y = padding + row * (photoHeight + padding);

        // Draw background
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, photoWidth, photoHeight);

        // Calculate crop to center the image
        const imgAspect = img.width / img.height;
        const photoAspect = photoWidth / photoHeight;
        
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        
        if (imgAspect > photoAspect) {
          sw = img.height * photoAspect;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / photoAspect;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, x, y, photoWidth, photoHeight);

        // Add border
        ctx.strokeStyle = "#CCCCCC";
        ctx.lineWidth = 1 * scale;
        ctx.strokeRect(x, y, photoWidth, photoHeight);
      }

      const link = document.createElement('a');
      link.download = forPrint ? 'passport-photos-print.png' : 'passport-photos.png';
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      toast.success(forPrint ? "Print-ready photos downloaded!" : "Photos downloaded!");
    };
    img.src = image;
  };

  /** One photo at 300 dpi on the chosen background, then laid out on a printable PDF sheet. */
  const photoSheet = (paper: Paper) => {
    if (!image) return;
    const toMm = (v: number) => (selectedSize.unit === "inch" ? v * 25.4 : v);
    const wMm = toMm(selectedSize.width);
    const hMm = toMm(selectedSize.height);
    const c = document.createElement("canvas");
    c.width = Math.round((wMm / 25.4) * 300);
    c.height = Math.round((hMm / 25.4) * 300);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = async () => {
      ctx.fillStyle = backgroundColor === "custom" ? customColor : backgroundColors[backgroundColor];
      ctx.fillRect(0, 0, c.width, c.height);
      const target = c.width / c.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (img.width / img.height > target) {
        sw = img.height * target;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / target;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
      const t = toast.loading("Making your print sheet…");
      try {
        const fit = sheetFit(paper, wMm, hMm);
        const blob = await makePhotoSheetPdf({
          photo: c.toDataURL("image/jpeg", 0.95),
          wMm,
          hMm,
          copies: Math.max(copies, fit.per),
          paper,
          label: selectedSize.name.replace(/\s*\(.*\)/, "") + " photo",
        });
        await saveFile(blob, `${selectedSize.name.split(" ")[0].toLowerCase()}-photos-${paper}.pdf`, "Photo print sheet");
        toast.success(`Print sheet ready: ${fit.per} photos on ${paper === "a4" ? "A4" : "4 × 6 inch"} paper`, { id: t });
      } catch {
        toast.error("The PDF could not be made on this device.", { id: t });
      }
    };
    img.src = image;
  };

  return (
    <div className="px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-extrabold md:text-3xl">Passport Photo Maker</h1>
          <p className="text-muted-foreground">Create passport, visa, and ID photos in standard sizes</p>
        </div>

        {!image ? (
          <Card
            className="rounded-2xl border-2 border-dashed border-ink/60 bg-sand/60 shadow-none p-12 text-center cursor-pointer transition-colors hover:border-ink hover:bg-sun/30"
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
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Tap here to add a photo, or drop it in</p>
            <p className="text-sm text-muted-foreground mt-2">Use a front-facing portrait photo for best results</p>
          </Card>
        ) : null}
        {!image ? (
          <div className="flex justify-center">
            <GooglePhotosButton
              max={1}
              onFiles={(fs) => new Promise<void>((resolve) => {
                const reader = new FileReader();
                reader.onload = (ev) => { setImage(ev.target?.result as string); resolve(); };
                reader.onerror = () => { toast.error("Couldn't read that photo."); resolve(); };
                reader.readAsDataURL(fs[0]);
              })}
            />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Your Photo</h3>
              <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <img src={image} alt="Your photo" className="max-w-full max-h-full object-contain" />
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setImage(null)}
              >
                Use a different photo
              </Button>
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Photo Settings</h3>

              <div>
                <Label>Photo Size</Label>
                <Select 
                  value={selectedSize.name} 
                  onValueChange={(v) => setSelectedSize(photoSizes.find(s => s.name === v) || photoSizes[0])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {photoSizes.map((size) => (
                      <SelectItem key={size.name} value={size.name}>
                        {size.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedSize.width} × {selectedSize.height} {selectedSize.unit}
                </p>
              </div>

              <div>
                <Label>Background Color</Label>
                <div className="flex gap-2 mt-2">
                  {(Object.keys(backgroundColors) as BackgroundColor[]).map((color) => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        backgroundColor === color ? "border-primary ring-2 ring-primary/30" : "border-muted"
                      }`}
                      style={{ backgroundColor: color === "custom" ? customColor : backgroundColors[color] }}
                      onClick={() => setBackgroundColor(color)}
                      title={color.charAt(0).toUpperCase() + color.slice(1)}
                    />
                  ))}
                  {backgroundColor === "custom" && (
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                  )}
                </div>
              </div>

              <div>
                <Label>Number of Copies</Label>
                <Select value={copies.toString()} onValueChange={(v) => setCopies(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 4, 6, 8, 12].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} {n === 1 ? "copy" : "copies"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-4">
                <Button onClick={() => generatePhotos(false)} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Photos
                </Button>
                <Button onClick={() => generatePhotos(true)} variant="secondary" className="w-full">
                  <Printer className="h-4 w-4 mr-2" />
                  Download Print-Ready (High Quality)
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => photoSheet("a4")} variant="outline" className="w-full gap-1.5">
                    <FileText className="h-4 w-4" /> PDF sheet (A4)
                  </Button>
                  <Button onClick={() => photoSheet("4x6")} variant="outline" className="w-full gap-1.5">
                    <FileText className="h-4 w-4" /> PDF sheet (4×6 in)
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
