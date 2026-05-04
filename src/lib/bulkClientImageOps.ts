// Browser-side bulk processing for free image ops.
// Reads each file, applies the operation via canvas, builds a ZIP,
// uploads it to bulk-outputs, and updates the bulk_jobs row.

import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";

interface RunArgs {
  jobId: string;
  userId: string;
  toolId: string;
  files: File[];
  params?: Record<string, any>;
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png", quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      type,
      quality
    );
  });
}

function mimeFor(format: string): { mime: string; ext: string } {
  switch (format) {
    case "png":
      return { mime: "image/png", ext: "png" };
    case "webp":
      return { mime: "image/webp", ext: "webp" };
    case "jpeg":
    case "jpg":
    default:
      return { mime: "image/jpeg", ext: "jpg" };
  }
}

async function processOne(
  toolId: string,
  file: File,
  params: Record<string, any>
): Promise<{ blob: Blob; ext: string } | null> {
  if (toolId === "metadata-viewer") return null;

  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  switch (toolId) {
    case "image-compressor": {
      const { mime, ext } = mimeFor(params.format || "jpeg");
      const q = Math.min(100, Math.max(10, Number(params.quality ?? 70))) / 100;
      return { blob: await canvasToBlob(canvas, mime, q), ext };
    }
    case "image-resizer": {
      const max = Math.min(4096, Math.max(64, Number(params.max_edge ?? 1280)));
      const maintain = params.maintain_aspect !== false;
      const { mime, ext } = mimeFor(params.format || "jpeg");
      const c2 = document.createElement("canvas");
      if (maintain) {
        const scale = Math.min(1, max / Math.max(canvas.width, canvas.height));
        c2.width = Math.round(canvas.width * scale);
        c2.height = Math.round(canvas.height * scale);
      } else {
        c2.width = max;
        c2.height = max;
      }
      c2.getContext("2d")!.drawImage(canvas, 0, 0, c2.width, c2.height);
      return { blob: await canvasToBlob(c2, mime, 0.9), ext };
    }
    case "image-grayscale": {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.data.length; i += 4) {
        const g = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
        data.data[i] = data.data[i + 1] = data.data[i + 2] = g;
      }
      ctx.putImageData(data, 0, 0);
      return { blob: await canvasToBlob(canvas, "image/png"), ext: "png" };
    }
    case "image-rotator": {
      const angle = Number(params.angle ?? 90) % 360;
      const rad = (angle * Math.PI) / 180;
      const c2 = document.createElement("canvas");
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      c2.width = Math.round(canvas.width * cos + canvas.height * sin);
      c2.height = Math.round(canvas.width * sin + canvas.height * cos);
      const c2ctx = c2.getContext("2d")!;
      c2ctx.translate(c2.width / 2, c2.height / 2);
      c2ctx.rotate(rad);
      c2ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
      return { blob: await canvasToBlob(c2, "image/png"), ext: "png" };
    }
    case "image-blur": {
      const radius = Math.min(40, Math.max(1, Number(params.radius ?? 8)));
      const c2 = document.createElement("canvas");
      c2.width = canvas.width;
      c2.height = canvas.height;
      const c2ctx = c2.getContext("2d")!;
      c2ctx.filter = `blur(${radius}px)`;
      c2ctx.drawImage(canvas, 0, 0);
      return { blob: await canvasToBlob(c2, "image/png"), ext: "png" };
    }
    default:
      throw new Error(`Unsupported client tool: ${toolId}`);
  }
}

export async function runClientImageBatch({ jobId, userId, toolId, files, params = {} }: RunArgs) {
  await supabase.from("bulk_jobs").update({ status: "running" }).eq("id", jobId);

  const zip = new JSZip();
  const outputs: any[] = [];
  let completed = 0;
  let failed = 0;

  if (toolId === "metadata-viewer") {
    const rows: string[] = ["filename,size_kb,type,width,height"];
    for (const f of files) {
      try {
        const img = await loadImage(f);
        rows.push(`"${f.name}",${(f.size / 1024).toFixed(0)},${f.type},${img.naturalWidth},${img.naturalHeight}`);
        outputs.push({ input_filename: f.name, output_filename: "metadata.csv", status: "ok" });
        completed++;
      } catch (e: any) {
        outputs.push({ input_filename: f.name, status: "error", error: e.message });
        failed++;
      }
      await supabase.from("bulk_jobs").update({ completed_items: completed, failed_items: failed }).eq("id", jobId);
    }
    zip.file("metadata.csv", rows.join("\n"));
  } else {
    for (const f of files) {
      try {
        const result = await processOne(toolId, f, params);
        if (result) {
          const outName = f.name.replace(/\.[^.]+$/, `.${result.ext}`);
          zip.file(outName, result.blob);
          outputs.push({ input_filename: f.name, output_filename: outName, status: "ok" });
          completed++;
        }
      } catch (e: any) {
        outputs.push({ input_filename: f.name, status: "error", error: e.message });
        failed++;
      }
      await supabase
        .from("bulk_jobs")
        .update({ completed_items: completed, failed_items: failed, outputs })
        .eq("id", jobId);
    }
  }

  const manifest = ["input,output,status,error"]
    .concat(outputs.map((o) => `"${o.input_filename}","${o.output_filename ?? ""}",${o.status},"${o.error ?? ""}"`))
    .join("\n");
  zip.file("manifest.csv", manifest);

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const zipPath = `${userId}/${jobId}.zip`;
  const { error: upErr } = await supabase.storage.from("bulk-outputs").upload(zipPath, zipBlob, {
    cacheControl: "3600",
    upsert: true,
    contentType: "application/zip",
  });
  if (upErr) throw upErr;

  await supabase
    .from("bulk_jobs")
    .update({
      status: failed === files.length ? "failed" : failed > 0 ? "partial" : "completed",
      completed_items: completed,
      failed_items: failed,
      outputs,
      output_zip_path: zipPath,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}
