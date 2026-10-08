import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, Loader2, FileIcon, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { defaultBulkParams, type BulkToolConfig } from "@/data/bulkTools";
import { useToolPricing } from "@/hooks/useToolPricing";
import { runClientImageBatch } from "@/lib/bulkClientImageOps";
import { BulkParamsForm } from "./BulkParamsForm";
import { BULK_PRICE_ID } from "@/apps/prices";
import { useWallet } from "@/hooks/useWallet";
import { handleCreditError, emitCreditPrompt } from "@/lib/creditPrompt";
import { completeRun, startRun } from "@/lib/credits";

interface Props {
  config: BulkToolConfig;
  onClose?: () => void;
  /** Catalogue id whose price applies per file (defaults to the config's tool). */
  priceToolId?: string;
}

export const BulkDropzone = ({ config, onClose, priceToolId }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [perFileMeta, setPerFileMeta] = useState<Record<string, string>[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [params, setParams] = useState<Record<string, any>>(() => defaultBulkParams(config));

  const perFileFields = config.perFileFields || [];

  const totalSizeMb = files.reduce((s, f) => s + f.size, 0) / (1024 * 1024);
  // Server-processed AI tools are charged per file at their bulk price; startup analyses at the
  // analyser's price; browser-only tools at the app's own price (currently not charged).
  const priceId = config.mode === "client" ? priceToolId ?? config.toolId : BULK_PRICE_ID[config.toolId] ?? config.toolId;
  const { creditCost } = useToolPricing(priceId);
  const { total: balance } = useWallet();
  // Every file is charged (minimum 1 credit): AI tools on the server, browser tools here.
  const perFile = creditCost;
  const totalCredits = files.length * perFile;

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const valid: File[] = [];
    for (const f of arr) {
      if (f.size > config.maxFileSizeMb * 1024 * 1024) {
        toast.error(`${f.name} exceeds ${config.maxFileSizeMb}MB`);
        continue;
      }
      valid.push(f);
    }
    const merged = [...files, ...valid].slice(0, config.maxFiles);
    if (files.length + valid.length > config.maxFiles) {
      toast.warning(`Only first ${config.maxFiles} files kept`);
    }
    // Initialize per-file meta for the newly added files
    const newMeta = valid.slice(0, config.maxFiles - files.length).map((f) => {
      const m: Record<string, string> = {};
      for (const field of perFileFields) {
        m[field.key] = field.prefillFromFilename
          ? f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ")
          : "";
      }
      return m;
    });
    setFiles(merged);
    setPerFileMeta([...perFileMeta, ...newMeta].slice(0, config.maxFiles));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    },
    [files]
  );

  const removeFile = (i: number) => {
    setFiles(files.filter((_, idx) => idx !== i));
    setPerFileMeta(perFileMeta.filter((_, idx) => idx !== i));
  };
  const updateMeta = (i: number, key: string, value: string) => {
    const next = [...perFileMeta];
    next[i] = { ...(next[i] || {}), [key]: value };
    setPerFileMeta(next);
  };

  const missingMeta = perFileFields.length > 0
    ? files.some((_, i) => perFileFields.some((f) => f.required && !(perFileMeta[i]?.[f.key] || "").trim()))
    : false;

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in");
      navigate("/auth");
      return;
    }
    if (files.length === 0) {
      toast.error("Drop some files first");
      return;
    }
    if (missingMeta) {
      toast.error("Fill all required fields per file");
      return;
    }
    if (totalCredits > balance) {
      emitCreditPrompt({ kind: "buy", required: totalCredits, balance });
      return;
    }

    setSubmitting(true);
    try {
      const jobId = crypto.randomUUID();
      const inputManifest: { filename: string; storage_path: string; size: number }[] = [];

      // Upload files to storage
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${user.id}/${jobId}/${i}-${file.name}`;
        const { error } = await supabase.storage.from("bulk-inputs").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;
        inputManifest.push({ filename: file.name, storage_path: path, size: file.size });
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // Create job row
      const { error: insErr } = await supabase.from("bulk_jobs").insert({
        id: jobId,
        user_id: user.id,
        tool_id: config.toolId,
        tool_name: config.toolName,
        status: "queued",
        total_items: files.length,
        input_manifest: inputManifest,
        per_file_meta: perFileMeta,
        params,
      });
      if (insErr) throw insErr;

      if (config.mode === "client" && config.toolId !== "startup-analyser") {
        // Browser processing costs the app's price per file — charge each file before it runs.
        for (let i = 0; i < files.length; i++) {
          const st = await startRun(priceId);
          if (!st.ok || !st.run_id) {
            emitCreditPrompt({ kind: "buy", required: (files.length - i) * perFile, balance });
            throw new Error(i ? `Charged for ${i} files; not enough credits for the rest.` : "Not enough credits");
          }
          await completeRun(st.run_id, true);
        }
        emitCreditPrompt({ kind: "charged" });
      }
      if (config.mode === "client") {
        // Process in browser, upload ZIP, mark complete
        toast.success("Processing in your browser...");
        navigate(`/bulk/jobs/${jobId}`);
        runClientImageBatch({
          jobId,
          userId: user.id,
          toolId: config.toolId,
          files,
          params,
          perFileMeta,
        }).catch((e) => {
          console.error(e);
          toast.error("Bulk processing failed");
        });
      } else {
        // Dispatch to edge function
        const { error: fnErr } = await supabase.functions.invoke("bulk-run", {
          body: { job_id: jobId, tool_id: config.toolId, input_manifest: inputManifest, params, per_file_meta: perFileMeta },
        });
        if (fnErr) {
          if (await handleCreditError(fnErr)) return;
          throw fnErr;
        }
        toast.success("Bulk job started");
        navigate(`/bulk/jobs/${jobId}`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to start bulk job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-card/60 backdrop-blur-xl border-primary/30 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Bulk Mode · {config.toolName}</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <motion.div
        whileHover={{ scale: 1.01 }}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => document.getElementById(`bulk-input-${config.toolId}`)?.click()}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
        }`}
      >
        <input
          id={`bulk-input-${config.toolId}`}
          type="file"
          multiple
          accept={config.accept}
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <Upload className="h-10 w-10 mx-auto mb-3 text-primary" />
        <p className="font-medium">Drop files here or click to browse</p>
        <p className="text-sm text-muted-foreground mt-1">{config.hint}</p>
      </motion.div>

      {files.length > 0 && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {files.map((f, i) => (
            <div
              key={i}
              className="rounded-md bg-muted/40 text-sm p-2 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate min-w-0">
                  <FileIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{f.name}</span>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {(f.size / 1024).toFixed(0)} KB
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeFile(i)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {perFileFields.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                  {perFileFields.map((field) => (
                    <Input
                      key={field.key}
                      className="h-8 text-xs"
                      placeholder={`${field.label}${field.required ? " *" : ""}`}
                      value={perFileMeta[i]?.[field.key] ?? ""}
                      onChange={(e) => updateMeta(i, field.key, e.target.value)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="flex items-center justify-between text-sm bg-muted/30 rounded-md p-3">
          <div>
            <span className="font-medium">{files.length}</span> files ·{" "}
            <span className="text-muted-foreground">{totalSizeMb.toFixed(1)} MB</span>
          </div>
          <div className="text-muted-foreground">
            Credits required: <span className="font-semibold text-foreground">{totalCredits}</span>
            <span className="text-xs ml-1">{`(${perFile}/file${config.mode === "client" && config.toolId !== "startup-analyser" ? "" : " · failed files are free"})`}</span>
          </div>
        </div>
      )}

      <BulkParamsForm config={config} values={params} onChange={setParams} />

      {submitting && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-1">
          <Progress value={uploadProgress} />
          <p className="text-xs text-muted-foreground text-center">
            Uploading {uploadProgress}%
          </p>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={submitting || files.length === 0 || missingMeta}
        className="w-full"
        size="lg"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" /> Run Bulk Job ({files.length})
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Output: {config.outputDescription} · view progress in{" "}
        <a href="/bulk/jobs" className="underline">Bulk Jobs</a>
      </p>
    </Card>
  );
};
