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

async function processOne(toolId: string, file: File): Promise<{ blob: Blob; ext: string } | null> {
  // Metadata viewer returns text (handled separately)
  if (toolId === "metadata-viewer") return null;

  const img = await loadImage(file);
  let canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  switch (toolId) {
    case "image-compressor": {
      const blob = await canvasToBlob(canvas, "image/jpeg", 0.7);
      return { blob, ext: "jpg" };
    }
    case "image-resizer": {
      // Resize to max 1280 on longest edge
      const max = 1280;
      const scale = Math.min(1, max / Math.max(canvas.width, canvas.height));
      const c2 = document.createElement("canvas");
      c2.width = Math.round(canvas.width * scale);
      c2.height = Math.round(canvas.height * scale);
      c2.getContext("2d")!.drawImage(canvas, 0, 0, c2.width, c2.height);
      return { blob: await canvasToBlob(c2, "image/jpeg", 0.85), ext: "jpg" };
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
      const c2 = document.createElement("canvas");
      c2.width = canvas.height;
      c2.height = canvas.width;
      const c2ctx = c2.getContext("2d")!;
      c2ctx.translate(c2.width / 2, c2.height / 2);
      c2ctx.rotate(Math.PI / 2);
      c2ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
      return { blob: await canvasToBlob(c2, "image/png"), ext: "png" };
    }
    case "image-blur": {
      ctx.filter = "blur(8px)";
      ctx.drawImage(canvas, 0, 0);
      return { blob: await canvasToBlob(canvas, "image/png"), ext: "png" };
    }
    default:
      throw new Error(`Unsupported client tool: ${toolId}`);
  }
}

export async function runClientImageBatch({ jobId, userId, toolId, files }: RunArgs) {
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
        const result = await processOne(toolId, f);
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

  // manifest
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
