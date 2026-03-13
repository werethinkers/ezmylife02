import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Trash2, FileText, FolderOpen, AlertCircle, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

interface ToolFileUploaderProps {
  toolId: string;
  onUploadComplete: () => void;
}

interface UploadedFile {
  name: string;
  path: string;
  size: number;
}

export const ToolFileUploader = ({ toolId, onUploadComplete }: ToolFileUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [existingFiles, setExistingFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchExistingFiles = useCallback(async () => {
    setLoadingFiles(true);
    const { data, error } = await supabase.storage
      .from("tool-uploads")
      .list(toolId, { limit: 100 });

    if (error) {
      console.error("Error listing files:", error);
      setExistingFiles([]);
    } else {
      // Recursively list files in subdirectories
      const files: UploadedFile[] = [];
      for (const item of data || []) {
        if (item.id) {
          files.push({
            name: item.name,
            path: `${toolId}/${item.name}`,
            size: item.metadata?.size || 0,
          });
        }
      }
      setExistingFiles(files);
    }
    setLoadingFiles(false);
  }, [toolId]);

  // Load existing files on mount
  useState(() => {
    fetchExistingFiles();
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setProgress(0);

    let uploaded = 0;
    const errors: string[] = [];

    for (const file of selectedFiles) {
      // Preserve relative path from webkitRelativePath or use file name
      const relativePath = (file as any).webkitRelativePath
        ? (file as any).webkitRelativePath.split("/").slice(1).join("/")
        : file.name;

      const storagePath = `${toolId}/${relativePath}`;

      const { error } = await supabase.storage
        .from("tool-uploads")
        .upload(storagePath, file, { upsert: true });

      if (error) {
        errors.push(`${file.name}: ${error.message}`);
      }

      uploaded++;
      setProgress(Math.round((uploaded / selectedFiles.length) * 100));
    }

    // Mark tool as having uploaded files
    await supabase
      .from("tools_catalog")
      .update({ has_uploaded_files: true } as any)
      .eq("id", toolId);

    if (errors.length > 0) {
      toast.error(`${errors.length} file(s) failed to upload`);
    } else {
      toast.success(`${selectedFiles.length} file(s) uploaded successfully`);
    }

    setSelectedFiles([]);
    setUploading(false);
    setProgress(0);
    fetchExistingFiles();
    onUploadComplete();
  };

  const deleteFile = async (path: string) => {
    const { error } = await supabase.storage
      .from("tool-uploads")
      .remove([path]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("File deleted");
      fetchExistingFiles();
    }
  };

  const deleteAllFiles = async () => {
    if (existingFiles.length === 0) return;
    const paths = existingFiles.map(f => f.path);
    const { error } = await supabase.storage
      .from("tool-uploads")
      .remove(paths);

    if (error) {
      toast.error(error.message);
    } else {
      await supabase
        .from("tools_catalog")
        .update({ has_uploaded_files: false } as any)
        .eq("id", toolId);
      toast.success("All files deleted");
      fetchExistingFiles();
      onUploadComplete();
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const hasIndexHtml = existingFiles.some(f => f.name === "index.html");

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 text-sm">
        <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
        <div className="text-muted-foreground">
          <p className="font-medium text-foreground">Upload tool files</p>
          <p className="mt-1">
            Upload HTML/JS/CSS files for your tool. The folder must contain an <code className="px-1 py-0.5 bg-muted rounded text-xs">index.html</code> file as the entry point. 
            The tool will run inside an iframe on the platform.
          </p>
        </div>
      </div>

      {/* Existing files */}
      {existingFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Uploaded Files ({existingFiles.length})</span>
                {hasIndexHtml && (
                  <Badge className="bg-green-500/10 text-green-600 text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3" /> index.html found
                  </Badge>
                )}
              </div>
              <Button variant="destructive" size="sm" onClick={deleteAllFiles} className="gap-1 h-7 text-xs">
                <Trash2 className="h-3 w-3" /> Delete All
              </Button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {existingFiles.map(file => (
                <div key={file.path} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 group">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-mono truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => deleteFile(file.path)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File selector */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".html,.htm,.js,.css,.json,.png,.jpg,.jpeg,.gif,.svg,.ico,.woff,.woff2,.ttf,.map,.txt,.md"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
            disabled={uploading}
          >
            <Upload className="h-4 w-4" /> Select Files
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Use directory picker via a new input
              const input = document.createElement("input");
              input.type = "file";
              input.multiple = true;
              (input as any).webkitdirectory = true;
              input.onchange = (e) => {
                const files = Array.from((e.target as HTMLInputElement).files || []);
                setSelectedFiles(prev => [...prev, ...files]);
              };
              input.click();
            }}
            className="gap-2"
            disabled={uploading}
          >
            <FolderOpen className="h-4 w-4" /> Select Folder
          </Button>
        </div>

        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{selectedFiles.length} file(s) selected</p>
            <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
              {selectedFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-0.5">
                  <span className="font-mono truncate flex-1">
                    {(file as any).webkitRelativePath
                      ? (file as any).webkitRelativePath.split("/").slice(1).join("/")
                      : file.name}
                  </span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeSelectedFile(i)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <Button onClick={uploadFiles} disabled={uploading} className="gap-2 w-full">
              {uploading ? "Uploading..." : `Upload ${selectedFiles.length} file(s)`}
            </Button>
          </div>
        )}

        {/* Progress */}
        {uploading && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">{progress}%</p>
          </div>
        )}
      </div>
    </div>
  );
};
