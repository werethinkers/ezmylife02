import React, { useState, useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onBulkMode?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onBulkMode }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | null | undefined) => {
    if (file && file.type.startsWith('image/')) onFileSelect(file);
    else alert('Please upload a valid image file (PNG, JPG, WEBP).');
  }, [onFileSelect]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="text-center max-w-2xl mx-auto mt-10">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">Generate Product Assets in Seconds</h2>
      <p className="mt-4 text-lg text-muted-foreground">
        Upload a single product image and let AI generate multiple high-quality angles automatically.
      </p>
      <p className="mt-2 text-sm text-primary font-medium">Costs 50 credits per generation</p>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
        onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
        className={`mt-8 p-8 sm:p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
          isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary hover:bg-muted/30'
        }`}
      >
        <input ref={fileInputRef} type="file" className="hidden" accept="image/png, image/jpeg, image/webp"
          onChange={e => handleFile(e.target.files?.[0])} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-primary/20' : 'bg-muted'}`}>
            <Upload className={`w-10 h-10 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <p className="text-lg font-semibold text-foreground">Drag & drop your product image here</p>
          <p className="text-muted-foreground">or <span className="text-primary font-medium">browse files</span></p>
          <p className="text-xs text-muted-foreground mt-2">Supports: PNG, JPG, WEBP</p>
        </div>
      </div>

      {onBulkMode && (
        <button
          onClick={onBulkMode}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium transition-colors"
        >
          <Upload className="w-5 h-5" /> Bulk Upload & Background Studio
        </button>
      )}
    </div>
  );
};

export default FileUpload;
