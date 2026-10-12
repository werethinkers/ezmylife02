import { openPdf, pdfText } from "./files";
import type { ConverterId } from "../types";

/*
 * File converters for the convert engine. Everything runs in the browser: files are never
 * uploaded. Heavy libraries load only when a converter that needs them runs.
 */

export interface ConvertedFile {
  name: string;
  blob: Blob;
}

export interface ConvertResult {
  files: ConvertedFile[];
  /** For converters that produce text (PDF to text). */
  text?: string;
  /** One plain line about what happened, e.g. "12 pages turned into 12 JPG images". */
  summary: string;
}

type Progress = (done: number, total: number) => void;
type Opts = Record<string, string>;

const base = (name: string) => name.replace(/\.[^.]+$/, "") || "file";
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "1-3, 5, 8-" → page numbers (1-based) within 1..total, in the order typed, no repeats. */
export function parsePageList(text: string, total: number): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  for (const part of text.split(/[,\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d*)\s*-\s*(\d*)$/);
    let from: number;
    let to: number;
    if (m) {
      from = m[1] ? parseInt(m[1], 10) : 1;
      to = m[2] ? parseInt(m[2], 10) : total;
    } else if (/^\d+$/.test(part)) {
      from = to = parseInt(part, 10);
    } else {
      throw new Error(`"${part}" is not a page number or range. Use something like 1-3, 5, 8-10.`);
    }
    if (from > to) [from, to] = [to, from];
    for (let p = Math.max(1, from); p <= Math.min(total, to); p++) {
      if (!seen.has(p)) {
        seen.add(p);
        out.push(p);
      }
    }
  }
  if (!out.length) throw new Error(`No pages in that range. This PDF has ${plural(total, "page")}.`);
  return out;
}

// ───────────── images ─────────────

export function loadImage(src: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = typeof src === "string" ? src : URL.createObjectURL(src);
    const img = new Image();
    img.onload = () => {
      if (typeof src !== "string") URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      if (typeof src !== "string") URL.revokeObjectURL(url);
      reject(new Error("This image could not be opened. Try a JPG, PNG or WebP file."));
    };
    img.src = url;
  });
}

export function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Your browser could not save this image format."))), type, quality),
  );
}

/** Draws an image on a canvas, filling transparent parts with `fill` (JPG has no transparency). */
function drawToCanvas(img: CanvasImageSource & { width: number; height: number }, fill?: string) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  ctx.drawImage(img, 0, 0);
  return c;
}

const QUALITY: Record<string, number> = { "Best (larger file)": 0.95, Balanced: 0.85, "Smallest file": 0.7 };
const quality = (o: Opts) => QUALITY[o.Quality] ?? 0.9;
const fillOf = (o: Opts) => (o["Transparent parts"] === "Black" ? "#000000" : "#ffffff");

async function reencode(files: File[], o: Opts, type: string, ext: string, onProgress: Progress): Promise<ConvertResult> {
  const out: ConvertedFile[] = [];
  for (let i = 0; i < files.length; i++) {
    const img = await loadImage(files[i]);
    const c = drawToCanvas(img, type === "image/jpeg" ? fillOf(o) : undefined);
    const q = type === "image/png" ? undefined : quality(o);
    out.push({ name: `${base(files[i].name)}.${ext}`, blob: await canvasBlob(c, type, q) });
    onProgress(i + 1, files.length);
  }
  if (type === "image/webp" && out.some((f) => f.blob.type !== "image/webp")) {
    throw new Error("This browser cannot save WebP. Try Chrome, Edge or Firefox.");
  }
  return { files: out, summary: `${plural(files.length, "image")} turned into ${ext === "webp" ? "WebP" : ext.toUpperCase()}` };
}

async function heicToJpg(files: File[], o: Opts, onProgress: Progress): Promise<ConvertResult> {
  const { default: heic2any } = await import("heic2any");
  const out: ConvertedFile[] = [];
  for (let i = 0; i < files.length; i++) {
    let blob: Blob | Blob[];
    try {
      blob = await heic2any({ blob: files[i], toType: "image/jpeg", quality: quality(o) });
    } catch {
      throw new Error(`${files[i].name} is not a HEIC photo this converter can read.`);
    }
    out.push({ name: `${base(files[i].name)}.jpg`, blob: Array.isArray(blob) ? blob[0] : blob });
    onProgress(i + 1, files.length);
  }
  return { files: out, summary: `${plural(files.length, "iPhone photo")} turned into JPG` };
}

// ───────────── PDF (pdf-lib to build and edit, pdf.js to read) ─────────────

const A4 = { w: 595.28, h: 841.89 };
const pdfBlob = (bytes: Uint8Array) => new Blob([bytes as BlobPart], { type: "application/pdf" });

async function imagesToPdf(files: File[], o: Opts, onProgress: Progress): Promise<ConvertResult> {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const pageSize = o["Page size"] ?? "A4";
  const margin = o.Margin === "None" ? 0 : o.Margin === "Large" ? 48 : 24;
  for (let i = 0; i < files.length; i++) {
    // Re-encode through a canvas so any browser-readable image (PNG with transparency, WebP…) works.
    const img = await loadImage(files[i]);
    const c = drawToCanvas(img, "#ffffff");
    const bytes = new Uint8Array(await (await canvasBlob(c, "image/jpeg", 0.92)).arrayBuffer());
    const jpg = await pdf.embedJpg(bytes);
    if (pageSize === "Same as image") {
      const page = pdf.addPage([jpg.width * 0.75 + margin * 2, jpg.height * 0.75 + margin * 2]);
      page.drawImage(jpg, { x: margin, y: margin, width: jpg.width * 0.75, height: jpg.height * 0.75 });
    } else {
      const landscape = o.Orientation === "Landscape" || (o.Orientation === "Match each image" && jpg.width > jpg.height);
      const [w, h] = landscape ? [A4.h, A4.w] : [A4.w, A4.h];
      const page = pdf.addPage([w, h]);
      const s = Math.min((w - margin * 2) / jpg.width, (h - margin * 2) / jpg.height);
      const dw = jpg.width * s;
      const dh = jpg.height * s;
      page.drawImage(jpg, { x: (w - dw) / 2, y: (h - dh) / 2, width: dw, height: dh });
    }
    onProgress(i + 1, files.length);
  }
  const bytes = await pdf.save();
  const name = files.length === 1 ? `${base(files[0].name)}.pdf` : "images.pdf";
  return { files: [{ name, blob: pdfBlob(bytes) }], summary: `${plural(files.length, "image")} put into one PDF of ${plural(files.length, "page")}` };
}

async function loadPdfLib(file: File) {
  const { PDFDocument } = await import("pdf-lib");
  try {
    return await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/encrypt/i.test(msg)) throw new Error(`${file.name} is password-protected. Remove the password first, then try again.`);
    throw new Error(`${file.name} could not be read as a PDF.`);
  }
}

async function mergePdf(files: File[], _o: Opts, onProgress: Progress): Promise<ConvertResult> {
  if (files.length < 2) throw new Error("Add at least two PDFs to join.");
  const { PDFDocument } = await import("pdf-lib");
  const out = await PDFDocument.create();
  let pages = 0;
  for (let i = 0; i < files.length; i++) {
    const src = await loadPdfLib(files[i]);
    const copied = await out.copyPages(src, src.getPageIndices());
    copied.forEach((p) => out.addPage(p));
    pages += copied.length;
    onProgress(i + 1, files.length);
  }
  const bytes = await out.save();
  return { files: [{ name: "merged.pdf", blob: pdfBlob(bytes) }], summary: `${plural(files.length, "PDF")} joined into one PDF of ${plural(pages, "page")}` };
}

async function splitPdf(files: File[], o: Opts, onProgress: Progress): Promise<ConvertResult> {
  const { PDFDocument } = await import("pdf-lib");
  const src = await loadPdfLib(files[0]);
  const total = src.getPageCount();
  const name = base(files[0].name);
  const out: ConvertedFile[] = [];
  if (o["How to split"] === "Every page as its own PDF") {
    for (let i = 0; i < total; i++) {
      const doc = await PDFDocument.create();
      const [p] = await doc.copyPages(src, [i]);
      doc.addPage(p);
      out.push({ name: `${name}-page-${i + 1}.pdf`, blob: pdfBlob(await doc.save()) });
      onProgress(i + 1, total);
    }
    return { files: out, summary: `${plural(total, "page")} saved as ${plural(total, "separate PDF")}` };
  }
  const pages = parsePageList(o.Pages ?? "", total);
  const doc = await PDFDocument.create();
  const copied = await doc.copyPages(src, pages.map((p) => p - 1));
  copied.forEach((p) => doc.addPage(p));
  onProgress(1, 1);
  return {
    files: [{ name: `${name}-pages.pdf`, blob: pdfBlob(await doc.save()) }],
    summary: `${plural(pages.length, "page")} taken out of ${total} (pages ${o.Pages})`,
  };
}

async function rotatePdf(files: File[], o: Opts, onProgress: Progress): Promise<ConvertResult> {
  const { degrees } = await import("pdf-lib");
  const doc = await loadPdfLib(files[0]);
  const total = doc.getPageCount();
  const turn = o.Turn === "Left (anticlockwise)" ? -90 : o.Turn === "Upside down" ? 180 : 90;
  const which = (o.Pages ?? "").trim() ? parsePageList(o.Pages, total) : Array.from({ length: total }, (_, i) => i + 1);
  for (const p of which) {
    const page = doc.getPage(p - 1);
    page.setRotation(degrees((page.getRotation().angle + turn + 360) % 360));
  }
  onProgress(1, 1);
  return {
    files: [{ name: `${base(files[0].name)}-rotated.pdf`, blob: pdfBlob(await doc.save()) }],
    summary: `${plural(which.length, "page")} turned ${(o.Turn ?? "right (clockwise)").toLowerCase()}`,
  };
}

const DPI: Record<string, number> = { "Screen (96 dpi)": 96, "Clear (150 dpi)": 150, "Print (300 dpi)": 300 };

async function pdfToJpg(files: File[], o: Opts, onProgress: Progress): Promise<ConvertResult> {
  const doc = await openPdf(files[0]);
  const total: number = doc.numPages;
  const pages = (o.Pages ?? "").trim() ? parsePageList(o.Pages, total) : Array.from({ length: total }, (_, i) => i + 1);
  if (pages.length > 100) throw new Error("That is more than 100 pages. Pick a page range, e.g. 1-50.");
  const dpi = DPI[o.Quality] ?? 150;
  const name = base(files[0].name);
  const out: ConvertedFile[] = [];
  for (let i = 0; i < pages.length; i++) {
    const page = await doc.getPage(pages[i]);
    // PDF units are 1/72 inch.
    const vp = page.getViewport({ scale: dpi / 72 });
    const c = document.createElement("canvas");
    c.width = Math.round(vp.width);
    c.height = Math.round(vp.height);
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Canvas not available");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    out.push({ name: `${name}-page-${pages[i]}.jpg`, blob: await canvasBlob(c, "image/jpeg", 0.9) });
    onProgress(i + 1, pages.length);
  }
  return { files: out, summary: `${plural(pages.length, "page")} turned into ${plural(pages.length, "JPG image")} at ${dpi} dpi` };
}

async function pdfToText(files: File[], _o: Opts, onProgress: Progress): Promise<ConvertResult> {
  const { text, pages, read } = await pdfText(files[0], 300, onProgress);
  const words = text.replace(/--- Page \d+ ---/g, "").trim();
  if (!words) {
    throw new Error("No text found. This PDF is probably a scan (pictures of pages). Use the OCR app to read scanned pages.");
  }
  const name = `${base(files[0].name)}.txt`;
  return {
    files: [{ name, blob: new Blob([text], { type: "text/plain;charset=utf-8" }) }],
    text,
    summary: `Text taken from ${plural(read, "page")}${read < pages ? ` (first ${read} of ${pages})` : ""}`,
  };
}

export async function runConverter(id: ConverterId, files: File[], opts: Opts, onProgress: Progress): Promise<ConvertResult> {
  switch (id) {
    case "images-to-pdf":
      return imagesToPdf(files, opts, onProgress);
    case "merge-pdf":
      return mergePdf(files, opts, onProgress);
    case "split-pdf":
      return splitPdf(files, opts, onProgress);
    case "rotate-pdf":
      return rotatePdf(files, opts, onProgress);
    case "pdf-to-jpg":
      return pdfToJpg(files, opts, onProgress);
    case "pdf-to-text":
      return pdfToText(files, opts, onProgress);
    case "heic-to-jpg":
      return heicToJpg(files, opts, onProgress);
    case "image-to-jpg":
      return reencode(files, opts, "image/jpeg", "jpg", onProgress);
    case "image-to-png":
      return reencode(files, opts, "image/png", "png", onProgress);
    case "image-to-webp":
      return reencode(files, opts, "image/webp", "webp", onProgress);
  }
}

/** Zips several results into one download. */
export async function zipFiles(files: ConvertedFile[], name: string): Promise<ConvertedFile> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const used = new Set<string>();
  for (const f of files) {
    let n = f.name;
    for (let i = 2; used.has(n); i++) n = f.name.replace(/(\.[^.]+)?$/, `-${i}$1`);
    used.add(n);
    zip.file(n, f.blob);
  }
  return { name, blob: await zip.generateAsync({ type: "blob" }) };
}

export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
