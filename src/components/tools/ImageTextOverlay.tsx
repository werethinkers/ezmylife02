import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Type, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { toast } from "sonner";

type TextAlign = "left" | "center" | "right";
type TextPosition = "top" | "center" | "bottom";

export const ImageTextOverlay = () => {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState("Your Text Here");
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [textColor, setTextColor] = useState("#ffffff");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [textAlign, setTextAlign] = useState<TextAlign>("center");
  const [textPosition, setTextPosition] = useState<TextPosition>("bottom");
  const [opacity, setOpacity] = useState(100);
  
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

  const downloadImage = () => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Set text properties
      ctx.font = `${fontSize * (img.width / 500)}px ${fontFamily}`;
      ctx.globalAlpha = opacity / 100;
      ctx.textAlign = textAlign;
      ctx.textBaseline = 'middle';

      // Calculate position
      let x = img.width / 2;
      let y = img.height / 2;

      if (textAlign === 'left') x = 20;
      else if (textAlign === 'right') x = img.width - 20;

      if (textPosition === 'top') y = fontSize * 2;
      else if (textPosition === 'bottom') y = img.height - fontSize * 2;

      // Draw stroke
      if (strokeWidth > 0) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth * 2;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);
      }

      // Draw fill
      ctx.fillStyle = textColor;
      ctx.fillText(text, x, y);

      ctx.globalAlpha = 1;

      const link = document.createElement('a');
      link.download = 'text-overlay-image.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success("Image downloaded!");
    };
    img.src = image;
  };

  const getPreviewStyle = () => {
    const alignItems = textPosition === 'top' ? 'flex-start' : textPosition === 'bottom' ? 'flex-end' : 'center';
    const justifyContent = textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center';
    const padding = '20px';

    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems,
      justifyContent,
      padding,
      pointerEvents: 'none' as const,
    };
  };

  const getTextStyle = () => ({
    fontSize: `${fontSize}px`,
    fontFamily,
    color: textColor,
    textShadow: strokeWidth > 0 
      ? `${strokeWidth}px ${strokeWidth}px 0 ${strokeColor}, -${strokeWidth}px -${strokeWidth}px 0 ${strokeColor}, ${strokeWidth}px -${strokeWidth}px 0 ${strokeColor}, -${strokeWidth}px ${strokeWidth}px 0 ${strokeColor}`
      : 'none',
    opacity: opacity / 100,
    textAlign,
    maxWidth: '90%',
    wordBreak: 'break-word' as const,
  });

  return (
    <div className="px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-extrabold md:text-3xl">Add Text to Image</h1>
          <p className="text-muted-foreground">Overlay custom text on your images</p>
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
            <Type className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Tap here to add a photo, or drop it in</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">After</h3>
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <img src={image} alt="Preview" className="w-full h-auto" />
                <div style={getPreviewStyle()}>
                  <span style={getTextStyle()}>{text}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 space-y-4 overflow-y-auto max-h-[600px]">
              <h3 className="font-semibold">Text Settings</h3>

              <div>
                <Label>Text</Label>
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter your text"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Font Size: {fontSize}px</Label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={([v]) => setFontSize(v)}
                    min={12}
                    max={72}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Font</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Courier New">Courier New</SelectItem>
                      <SelectItem value="Verdana">Verdana</SelectItem>
                      <SelectItem value="Impact">Impact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <div>
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-12 h-10 p-1 mt-1 cursor-pointer"
                  />
                </div>
                <div>
                  <Label>Outline Color</Label>
                  <Input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-12 h-10 p-1 mt-1 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <Label>Outline: {strokeWidth}px</Label>
                  <Slider
                    value={[strokeWidth]}
                    onValueChange={([v]) => setStrokeWidth(v)}
                    min={0}
                    max={10}
                    step={1}
                    className="mt-3"
                  />
                </div>
              </div>

              <div>
                <Label>Alignment</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={textAlign === "left" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTextAlign("left")}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={textAlign === "center" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTextAlign("center")}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={textAlign === "right" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTextAlign("right")}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Position</Label>
                <Select value={textPosition} onValueChange={(v) => setTextPosition(v as TextPosition)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
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
                  className="mt-2"
                />
              </div>

              <div className="space-y-2 pt-4">
                <Button onClick={downloadImage} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setImage(null)}
                >
                  Use a different photo
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
