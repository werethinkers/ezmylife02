import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Upload, Download, SplitSquareHorizontal } from "lucide-react";
import { toast } from "sonner";

export const ImageSplitter = () => {
  const [image, setImage] = useState<string | null>(null);
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
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

  const splitImage = async () => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = async () => {
      const pieceWidth = Math.floor(img.width / cols);
      const pieceHeight = Math.floor(img.height / rows);

      const pieces: { dataUrl: string; row: number; col: number }[] = [];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          canvas.width = pieceWidth;
          canvas.height = pieceHeight;

          ctx.drawImage(
            img,
            col * pieceWidth, row * pieceHeight,
            pieceWidth, pieceHeight,
            0, 0,
            pieceWidth, pieceHeight
          );

          pieces.push({
            dataUrl: canvas.toDataURL('image/png'),
            row,
            col,
          });
        }
      }

      // Download all pieces
      for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];
        const link = document.createElement('a');
        link.download = `piece_${piece.row + 1}_${piece.col + 1}.png`;
        link.href = piece.dataUrl;
        link.click();
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between downloads
      }

      toast.success(`Image split into ${rows * cols} pieces and downloaded!`);
    };
    img.src = image;
  };

  const presets = [
    { label: "2×2 (4 pieces)", rows: 2, cols: 2 },
    { label: "3×3 (9 pieces)", rows: 3, cols: 3 },
    { label: "3×1 (Instagram)", rows: 1, cols: 3 },
    { label: "1×3 (Vertical)", rows: 3, cols: 1 },
  ];

  return (
    <div className="px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-extrabold md:text-3xl">Image Splitter</h1>
          <p className="text-muted-foreground">Split images into multiple pieces for grids and puzzles</p>
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
            <SplitSquareHorizontal className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Tap here to add a photo, or drop it in</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">After</h3>
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <img src={image} alt="Preview" className="w-full h-auto" />
                {/* Grid overlay */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                  }}
                >
                  {Array.from({ length: rows * cols }).map((_, i) => (
                    <div 
                      key={i} 
                      className="border border-dashed border-white/50"
                      style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {imageSize.width} × {imageSize.height} px → {Math.floor(imageSize.width / cols)} × {Math.floor(imageSize.height / rows)} px per piece
              </p>
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Split Settings</h3>

              <div>
                <Label>Columns: {cols}</Label>
                <Slider
                  value={[cols]}
                  onValueChange={([v]) => setCols(v)}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Rows: {rows}</Label>
                <Slider
                  value={[rows]}
                  onValueChange={([v]) => setRows(v)}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="mb-2 block">Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRows(preset.rows);
                        setCols(preset.cols);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg text-sm">
                <p><strong>Total pieces:</strong> {rows * cols}</p>
                <p><strong>Each piece:</strong> {Math.floor(imageSize.width / cols)} × {Math.floor(imageSize.height / rows)} px</p>
              </div>

              <div className="space-y-2 pt-4">
                <Button onClick={splitImage} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Split & Download All Pieces
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
