// Browser-side bulk processing for free image ops + Startup Analyser bulk.

import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { extractPdfText, generateComprehensiveAnalysis } from "@/startup-analyser/services/geminiService";
import { PI7_BULK_OP_ALIAS } from "@/data/bulkTools";

interface RunArgs {
  jobId: string;
  userId: string;
  toolId: string;
  files: File[];
  params?: Record<string, any>;
  perFileMeta?: Record<string, string>[];
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

export async function processOne(
  toolId: string,
  file: File,
  params: Record<string, any>
): Promise<{ blob: Blob; ext: string } | null> {
  // Resolve Pi7 aliases to underlying op
  const op = PI7_BULK_OP_ALIAS[toolId] ?? toolId;
  if (op === "metadata-viewer" || op === "color-extract") return null;

  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  switch (op) {
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
    case "image-pixelate": {
      const block = Math.max(2, Math.min(60, Number(params.block_size ?? 12)));
      const c2 = document.createElement("canvas");
      c2.width = canvas.width;
      c2.height = canvas.height;
      const c2ctx = c2.getContext("2d")!;
      c2ctx.imageSmoothingEnabled = false;
      const w = Math.max(1, Math.floor(canvas.width / block));
      const h = Math.max(1, Math.floor(canvas.height / block));
      c2ctx.drawImage(canvas, 0, 0, w, h);
      c2ctx.drawImage(c2, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
      return { blob: await canvasToBlob(c2, "image/png"), ext: "png" };
    }
    case "image-watermark": {
      const text = String(params.text ?? "© ezyourlife");
      const opacity = Math.max(0.05, Math.min(1, Number(params.opacity ?? 40) / 100));
      const fs = Math.round(Math.min(canvas.width, canvas.height) / 18);
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = Math.max(1, fs / 12);
      ctx.font = `bold ${fs}px sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      const x = canvas.width - fs * 0.6;
      const y = canvas.height - fs * 0.6;
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
      ctx.restore();
      return { blob: await canvasToBlob(canvas, "image/png"), ext: "png" };
    }
    case "image-text": {
      const text = String(params.text ?? "");
      const pos = String(params.position ?? "bottom");
      const fs = Math.round(Math.min(canvas.width, canvas.height) / 14);
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = Math.max(1, fs / 10);
      ctx.font = `bold ${fs}px sans-serif`;
      ctx.textAlign = "center";
      const x = canvas.width / 2;
      const y = pos === "top" ? fs * 1.2 : pos === "center" ? canvas.height / 2 : canvas.height - fs * 0.6;
      ctx.textBaseline = pos === "top" ? "top" : pos === "center" ? "middle" : "bottom";
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
      ctx.restore();
      return { blob: await canvasToBlob(canvas, "image/png"), ext: "png" };
    }
    case "image-passthrough": {
      return { blob: await canvasToBlob(canvas, "image/png"), ext: "png" };
    }
    case "image-split":
    case "image-join": {
      // Handled at batch level (see runClientImageBatch); shouldn't reach here.
      return { blob: await canvasToBlob(canvas, "image/png"), ext: "png" };
    }
    default:
      throw new Error(`Unsupported client tool: ${toolId} (op=${op})`);
  }
}

function safeFilename(s: string): string {
  return (s || "report").replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60);
}

async function runStartupAnalyserBatch(args: RunArgs, zip: JSZip, outputs: any[]) {
  const { jobId, userId, files, perFileMeta = [], params = {} } = args;
  let completed = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const meta = perFileMeta[i] || {};
    const name = (meta.company_name || f.name.replace(/\.[^.]+$/, "")).trim();
    const website = (meta.company_website || "").trim();
    try {
      const pitchText = await extractPdfText(f);
      const result = await generateComprehensiveAnalysis(name, website, () => {}, pitchText);
      const md = result.markdownReport || JSON.stringify(result.structuredData, null, 2);
      const focus = params.focus ? `\n\n_Focus: ${params.focus} · Stage: ${params.stage || "n/a"}_\n` : "";
      const out = `# ${name}\n_Website: ${website || "n/a"}_${focus}\n\n${md}`;
      zip.file(`${safeFilename(name)}.md`, out);
      // Persist to startup_analyses
      try {
        await supabase.from("startup_analyses").insert({
          user_id: userId,
          company_name: name,
          company_website: website || null,
          analysis_data: (result.structuredData || {}) as any,
          markdown_report: md,
          status: "completed",
        });
      } catch { /* non-fatal */ }
      outputs.push({ input_filename: f.name, output_filename: `${safeFilename(name)}.md`, status: "ok", company_name: name });
      completed++;
    } catch (e: any) {
      outputs.push({ input_filename: f.name, status: "error", error: e.message || "analysis failed", company_name: name });
      failed++;
    }
    await supabase.from("bulk_jobs").update({ completed_items: completed, failed_items: failed, outputs }).eq("id", jobId);
  }
  return { completed, failed };
}

export async function runClientImageBatch(args: RunArgs) {
  const { jobId, userId, toolId, files, params = {} } = args;
  await supabase.from("bulk_jobs").update({ status: "running" }).eq("id", jobId);

  const zip = new JSZip();
  const outputs: any[] = [];
  let completed = 0;
  let failed = 0;

  const op = PI7_BULK_OP_ALIAS[toolId] ?? toolId;

  if (toolId === "startup-analyser") {
    const r = await runStartupAnalyserBatch(args, zip, outputs);
    completed = r.completed;
    failed = r.failed;
  } else if (op === "metadata-viewer") {
    const rows: string[] = ["filename,size_kb,type,width,height,dpi_estimate"];
    for (const f of files) {
      try {
        const img = await loadImage(f);
        // dpi guess: assume 96 if unknown (browser EXIF not directly accessible without a lib)
        rows.push(`"${f.name}",${(f.size / 1024).toFixed(0)},${f.type},${img.naturalWidth},${img.naturalHeight},96`);
        outputs.push({ input_filename: f.name, output_filename: "metadata.csv", status: "ok" });
        completed++;
      } catch (e: any) {
        outputs.push({ input_filename: f.name, status: "error", error: e.message });
        failed++;
      }
      await supabase.from("bulk_jobs").update({ completed_items: completed, failed_items: failed }).eq("id", jobId);
    }
    zip.file("metadata.csv", rows.join("\n"));
  } else if (op === "color-extract") {
    const rows: string[] = ["filename,avg_hex,avg_r,avg_g,avg_b"];
    for (const f of files) {
      try {
        const img = await loadImage(f);
        const c = document.createElement("canvas");
        c.width = Math.min(64, img.naturalWidth);
        c.height = Math.min(64, img.naturalHeight);
        const cx = c.getContext("2d")!;
        cx.drawImage(img, 0, 0, c.width, c.height);
        const d = cx.getImageData(0, 0, c.width, c.height).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i+1]; b += d[i+2]; n++; }
        r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
        const hex = "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
        rows.push(`"${f.name}",${hex},${r},${g},${b}`);
        outputs.push({ input_filename: f.name, output_filename: "colors.csv", status: "ok" });
        completed++;
      } catch (e: any) {
        outputs.push({ input_filename: f.name, status: "error", error: e.message });
        failed++;
      }
      await supabase.from("bulk_jobs").update({ completed_items: completed, failed_items: failed }).eq("id", jobId);
    }
    zip.file("colors.csv", rows.join("\n"));
  } else if (op === "image-join") {
    // Join all uploaded images into one canvas
    try {
      const imgs = await Promise.all(files.map(loadImage));
      const direction = String(params.direction ?? "vertical");
      const c = document.createElement("canvas");
      if (direction === "horizontal") {
        const h = Math.max(...imgs.map(i => i.naturalHeight));
        const w = imgs.reduce((s, i) => s + Math.round(i.naturalWidth * (h / i.naturalHeight)), 0);
        c.width = w; c.height = h;
        const cx = c.getContext("2d")!; let x = 0;
        for (const i of imgs) {
          const iw = Math.round(i.naturalWidth * (h / i.naturalHeight));
          cx.drawImage(i, x, 0, iw, h); x += iw;
        }
      } else {
        const w = Math.max(...imgs.map(i => i.naturalWidth));
        const h = imgs.reduce((s, i) => s + Math.round(i.naturalHeight * (w / i.naturalWidth)), 0);
        c.width = w; c.height = h;
        const cx = c.getContext("2d")!; let y = 0;
        for (const i of imgs) {
          const ih = Math.round(i.naturalHeight * (w / i.naturalWidth));
          cx.drawImage(i, 0, y, w, ih); y += ih;
        }
      }
      const blob = await canvasToBlob(c, "image/png");
      zip.file("joined.png", blob);
      outputs.push({ input_filename: files.map(f => f.name).join("|"), output_filename: "joined.png", status: "ok" });
      completed = files.length;
    } catch (e: any) {
      outputs.push({ status: "error", error: e.message });
      failed = files.length;
    }
    await supabase.from("bulk_jobs").update({ completed_items: completed, failed_items: failed, outputs }).eq("id", jobId);
  } else if (op === "image-split") {
    const rows = Math.max(1, Math.min(10, Number(params.rows ?? 3)));
    const cols = Math.max(1, Math.min(10, Number(params.cols ?? 3)));
    for (const f of files) {
      try {
        const img = await loadImage(f);
        const tw = Math.floor(img.naturalWidth / cols);
        const th = Math.floor(img.naturalHeight / rows);
        const baseName = f.name.replace(/\.[^.]+$/, "");
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const tile = document.createElement("canvas");
            tile.width = tw; tile.height = th;
            tile.getContext("2d")!.drawImage(img, c * tw, r * th, tw, th, 0, 0, tw, th);
            const blob = await canvasToBlob(tile, "image/png");
            zip.file(`${baseName}/tile_${r + 1}_${c + 1}.png`, blob);
          }
        }
        outputs.push({ input_filename: f.name, output_filename: `${baseName}/`, status: "ok" });
        completed++;
      } catch (e: any) {
        outputs.push({ input_filename: f.name, status: "error", error: e.message });
        failed++;
      }
      await supabase.from("bulk_jobs").update({ completed_items: completed, failed_items: failed, outputs }).eq("id", jobId);
    }
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
