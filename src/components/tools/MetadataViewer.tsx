import { useState, useRef, useCallback } from "react";
import { BulkModeToggle } from "@/components/bulk/BulkModeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileSearch, Copy, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ImageMetadata {
  fileName: string;
  fileSize: string;
  fileType: string;
  dimensions: string;
  lastModified: string;
  colorDepth?: string;
}

export const MetadataViewer = () => {
  const [image, setImage] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setMetadata({
            fileName: file.name,
            fileSize: formatBytes(file.size),
            fileType: file.type,
            dimensions: `${img.width} × ${img.height} px`,
            lastModified: new Date(file.lastModified).toLocaleString(),
          });
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
          setMetadata({
            fileName: file.name,
            fileSize: formatBytes(file.size),
            fileType: file.type,
            dimensions: `${img.width} × ${img.height} px`,
            lastModified: new Date(file.lastModified).toLocaleString(),
          });
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

  const copyValue = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success("Copied to clipboard!");
  };

  const downloadMetadata = () => {
    if (!metadata) return;
    
    const text = Object.entries(metadata)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'image-metadata.txt';
    link.click();
    toast.success("Metadata downloaded!");
  };

  const removeMetadata = () => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const link = document.createElement('a');
      link.download = 'clean-image.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success("Image downloaded without metadata!");
    };
    img.src = image;
  };

  const metadataFields = metadata ? [
    { label: "File Name", value: metadata.fileName },
    { label: "File Size", value: metadata.fileSize },
    { label: "File Type", value: metadata.fileType },
    { label: "Dimensions", value: metadata.dimensions },
    { label: "Last Modified", value: metadata.lastModified },
  ] : [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Image Metadata Viewer</h1>
          <div className="flex justify-center pt-2"><BulkModeToggle toolId="metadata-viewer" /></div>
          <p className="text-muted-foreground">View and manage image metadata</p>
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
            <FileSearch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Drop an image here or click to upload</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Image Preview</h3>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <img src={image} alt="Preview" className="max-w-full max-h-full object-contain" />
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Metadata Information</h3>

              <div className="space-y-3">
                {metadataFields.map((field) => (
                  <div key={field.label} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div>
                      <span className="text-xs text-muted-foreground block">{field.label}</span>
                      <span className="text-sm font-medium">{field.value}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyValue(field.label, field.value)}
                    >
                      {copiedField === field.label ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4">
                <Button onClick={downloadMetadata} variant="secondary" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Metadata as TXT
                </Button>
                <Button onClick={removeMetadata} className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Download Without Metadata
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setImage(null);
                    setMetadata(null);
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
