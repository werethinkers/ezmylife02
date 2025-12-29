import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Eraser, Pen, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type SignatureSize = {
  name: string;
  width: number;
  height: number;
};

const signatureSizes: SignatureSize[] = [
  { name: "Standard (300x100)", width: 300, height: 100 },
  { name: "Large (400x150)", width: 400, height: 150 },
  { name: "Small (200x80)", width: 200, height: 80 },
  { name: "6cm x 2cm", width: 227, height: 76 },
  { name: "50mm x 20mm", width: 189, height: 76 },
];

export const SignatureGenerator = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#000000");
  const [penSize, setPenSize] = useState(2);
  const [selectedSize, setSelectedSize] = useState<SignatureSize>(signatureSizes[0]);
  const [hasSignature, setHasSignature] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<"transparent" | "white">("transparent");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = selectedSize.width * 2;
    canvas.height = selectedSize.height * 2;
    canvas.style.width = `${selectedSize.width}px`;
    canvas.style.height = `${selectedSize.height}px`;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(2, 2);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = penColor;
    context.lineWidth = penSize;
    contextRef.current = context;

    // Clear with background
    if (backgroundColor === "white") {
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, selectedSize.width, selectedSize.height);
    }
  }, [selectedSize, backgroundColor]);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = penColor;
      contextRef.current.lineWidth = penSize;
    }
  }, [penColor, penSize]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    
    if (contextRef.current) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(x, y);
      setIsDrawing(true);
      setHasSignature(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !contextRef.current) return;
    
    const { x, y } = getCoordinates(e);
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    if (backgroundColor === "white") {
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, selectedSize.width, selectedSize.height);
    } else {
      context.clearRect(0, 0, selectedSize.width, selectedSize.height);
    }
    setHasSignature(false);
  };

  const downloadSignature = (format: 'png' | 'jpg') => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) {
      toast.error("Please draw a signature first");
      return;
    }

    const link = document.createElement('a');
    
    if (format === 'jpg') {
      // Create a new canvas with white background for JPG
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);
        link.href = tempCanvas.toDataURL('image/jpeg', 0.95);
      }
    } else {
      link.href = canvas.toDataURL('image/png');
    }
    
    link.download = `signature.${format}`;
    link.click();
    toast.success("Signature downloaded!");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Signature Generator</h1>
          <p className="text-muted-foreground">Draw your signature and download it for documents</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Pen className="h-5 w-5" />
                Draw Your Signature
              </h3>
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
            
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden"
              style={{ 
                background: backgroundColor === "white" 
                  ? "#FFFFFF" 
                  : 'repeating-conic-gradient(#f0f0f0 0% 25%, transparent 0% 50%) 50% / 10px 10px'
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="cursor-crosshair touch-none"
                style={{ display: 'block', width: '100%', height: 'auto' }}
              />
            </div>
            
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Use your mouse or finger to draw your signature
            </p>
          </Card>

          <Card className="p-4 space-y-4">
            <h3 className="font-semibold">Settings</h3>

            <div>
              <Label>Size</Label>
              <Select 
                value={selectedSize.name} 
                onValueChange={(v) => {
                  setSelectedSize(signatureSizes.find(s => s.name === v) || signatureSizes[0]);
                  setHasSignature(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {signatureSizes.map((size) => (
                    <SelectItem key={size.name} value={size.name}>
                      {size.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Pen Color</Label>
              <div className="flex gap-2 mt-2">
                {["#000000", "#0000CC", "#000080"].map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      penColor === color ? "border-primary ring-2 ring-primary/30" : "border-muted"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setPenColor(color)}
                  />
                ))}
                <Input
                  type="color"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                  className="w-8 h-8 p-0 border-0 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <Label>Pen Size: {penSize}px</Label>
              <Slider
                value={[penSize]}
                onValueChange={([v]) => setPenSize(v)}
                min={1}
                max={5}
                step={0.5}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Background</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={backgroundColor === "transparent" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setBackgroundColor("transparent");
                    clearCanvas();
                  }}
                >
                  Transparent
                </Button>
                <Button
                  variant={backgroundColor === "white" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setBackgroundColor("white");
                    clearCanvas();
                  }}
                >
                  White
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Button 
                onClick={() => downloadSignature('png')} 
                className="w-full"
                disabled={!hasSignature}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
              <Button 
                onClick={() => downloadSignature('jpg')} 
                variant="secondary"
                className="w-full"
                disabled={!hasSignature}
              >
                <Download className="h-4 w-4 mr-2" />
                Download JPG
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
