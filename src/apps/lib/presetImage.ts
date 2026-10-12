import type { PresetItem } from "../types";
import { canvasBlob } from "./convert";

/*
 * Turns a phone photo into the exact file an exam or ID form asks for: crop to shape, exact
 * pixel size, JPG, and a file size inside the allowed KB range. Runs in the browser.
 */

export interface Crop {
  /** 1 = the whole picture fits the frame; larger zooms in. */
  zoom: number;
  /** Centre of the frame within the picture, 0..1. */
  cx: number;
  cy: number;
}

export interface Prepared {
  blob: Blob;
  width: number;
  height: number;
  kb: number;
  quality: number;
  /** True when the file had to be padded up to the smallest size allowed. */
  padded: boolean;
}

const hasRange = (it: PresetItem) => Boolean(it.minW || it.maxW || it.minH || it.maxH);

/**
 * Output size in pixels: exact when the rules give one; inside the range when they give a range
 * (as large as the photo allows, so detail is kept); otherwise our own default size.
 */
export function targetSize(item: PresetItem, srcW: number, srcH: number): { w: number; h: number } {
  if (item.width && item.height) return { w: item.width, h: item.height };
  const a = item.aspect ?? srcW / srcH;
  if (!hasRange(item)) {
    if (item.outW && item.outH) return { w: item.outW, h: item.outH };
    const s = Math.min(1, 1200 / Math.max(srcW, srcH));
    return { w: Math.round(srcW * s), h: Math.round(srcH * s) };
  }
  // Start from the photo's own size, then fit under the maximums and over the minimums.
  let w = srcW;
  let h = w / a;
  const maxW = item.maxW ?? Infinity;
  const maxH = item.maxH ?? Infinity;
  if (w > maxW) {
    w = maxW;
    h = w / a;
  }
  if (h > maxH) {
    h = maxH;
    w = h * a;
  }
  const up = Math.max(1, (item.minW ?? 0) / w, (item.minH ?? 0) / h);
  w = Math.floor(w * up);
  h = Math.floor(h * up);
  return { w: Math.max(1, Math.min(w, Math.floor(maxW))), h: Math.max(1, Math.min(h, Math.floor(maxH))) };
}

const aspectOf = (item: PresetItem, srcW: number, srcH: number) => (item.width && item.height ? item.width / item.height : item.aspect ?? srcW / srcH);

/** The part of the picture inside the frame, in source pixels. */
export function cropRect(img: { width: number; height: number }, aspect: number, crop: Crop) {
  // Largest rectangle of this shape that fits the picture, then zoomed in.
  let w = img.width;
  let h = w / aspect;
  if (h > img.height) {
    h = img.height;
    w = h * aspect;
  }
  w /= crop.zoom;
  h /= crop.zoom;
  const x = Math.min(img.width - w, Math.max(0, crop.cx * img.width - w / 2));
  const y = Math.min(img.height - h, Math.max(0, crop.cy * img.height - h / 2));
  return { x, y, w, h };
}

/** For signatures and thumb prints: where the ink is, with a margin, as a crop for the target shape. */
export function inkCrop(img: HTMLImageElement, aspect: number): Crop {
  const scale = Math.min(1, 400 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.width * scale));
  c.height = Math.max(1, Math.round(img.height * scale));
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { zoom: 1, cx: 0.5, cy: 0.5 };
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  const threshold = paperLevel(data) - 60;
  let x0 = c.width;
  let y0 = c.height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      if (lum(data[i], data[i + 1], data[i + 2]) < threshold) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return { zoom: 1, cx: 0.5, cy: 0.5 };
  // Margin around the ink, then grow the box to the target shape.
  const pad = 0.12;
  let bw = (x1 - x0 + 1) * (1 + pad * 2);
  let bh = (y1 - y0 + 1) * (1 + pad * 2);
  if (bw / bh < aspect) bw = bh * aspect;
  else bh = bw / aspect;
  const full = cropRect({ width: c.width, height: c.height }, aspect, { zoom: 1, cx: 0.5, cy: 0.5 });
  const zoom = Math.max(1, Math.min(full.w / bw, full.h / bh));
  return { zoom, cx: (x0 + x1 + 1) / 2 / c.width, cy: (y0 + y1 + 1) / 2 / c.height };
}

const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Brightness of the paper: the 90th percentile of the picture. */
function paperLevel(data: Uint8ClampedArray) {
  const hist = new Array(256).fill(0);
  let n = 0;
  for (let i = 0; i < data.length; i += 16) {
    hist[Math.round(lum(data[i], data[i + 1], data[i + 2]))]++;
    n++;
  }
  let acc = 0;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= n * 0.9) return Math.max(120, v);
  }
  return 230;
}

/** Turns grey paper white and makes the ink solid, keeping its colour. */
function cleanInk(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const paper = paperLevel(d);
  const cut = paper - 45;
  for (let i = 0; i < d.length; i += 4) {
    const l = lum(d[i], d[i + 1], d[i + 2]);
    if (l >= cut) {
      d[i] = d[i + 1] = d[i + 2] = 255;
    } else {
      // Darken in proportion, so strokes stay smooth at the edges.
      const k = Math.max(0, Math.min(1, l / cut)) * 0.6;
      d[i] = Math.round(d[i] * k);
      d[i + 1] = Math.round(d[i + 1] * k);
      d[i + 2] = Math.round(d[i + 2] * k);
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Draws the framed part of the picture at the target size. */
export function render(img: HTMLImageElement, item: PresetItem, crop: Crop, opts: { clean: boolean }, size?: { w: number; h: number }) {
  const aspect = aspectOf(item, img.width, img.height);
  const r = cropRect(img, aspect, crop);
  const { w, h } = size ?? targetSize(item, r.w, r.h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas not available");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, w, h);
  if (item.mode === "ink" && opts.clean) cleanInk(ctx, w, h);
  return c;
}

/** Adds JPEG comment blocks so a file that is too small reaches the minimum size. The picture is unchanged. */
export async function padJpeg(blob: Blob, targetBytes: number): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.length >= targetBytes || bytes[0] !== 0xff || bytes[1] !== 0xd8) return blob;
  const segments: Uint8Array[] = [];
  let need = targetBytes - bytes.length;
  while (need > 0) {
    const body = Math.min(65533, Math.max(1, need - 4));
    const seg = new Uint8Array(body + 4);
    seg[0] = 0xff;
    seg[1] = 0xfe;
    seg[2] = ((body + 2) >> 8) & 0xff;
    seg[3] = (body + 2) & 0xff;
    seg.fill(0x20, 4);
    segments.push(seg);
    need -= seg.length;
  }
  return new Blob([bytes.slice(0, 2), ...segments, bytes.slice(2)] as BlobPart[], { type: "image/jpeg" });
}

/** Makes the final JPG: highest quality that fits under the maximum, padded up to the minimum. */
export async function prepare(img: HTMLImageElement, item: PresetItem, crop: Crop, opts: { clean: boolean }): Promise<Prepared> {
  // Forms differ on whether 1 KB is 1000 or 1024 bytes: aim inside both readings.
  const maxB = item.maxKB ? item.maxKB * 1000 - 512 : Infinity;
  const minB = item.minKB ? item.minKB * 1024 + 512 : 0;
  const aspect = aspectOf(item, img.width, img.height);
  const r = cropRect(img, aspect, crop);
  let size = targetSize(item, r.w, r.h);
  const exact = Boolean(item.width && item.height);

  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = render(img, item, crop, opts, size);
    // Binary search on quality for the largest file that still fits.
    let lo = 0.3;
    let hi = 0.95;
    let best: { blob: Blob; q: number } | null = null;
    const top = await canvasBlob(canvas, "image/jpeg", hi);
    if (top.size <= maxB) best = { blob: top, q: hi };
    else {
      for (let i = 0; i < 8; i++) {
        const q = (lo + hi) / 2;
        const b = await canvasBlob(canvas, "image/jpeg", q);
        if (b.size <= maxB) {
          best = { blob: b, q };
          lo = q;
        } else hi = q;
      }
      if (!best) {
        const b = await canvasBlob(canvas, "image/jpeg", 0.3);
        if (b.size <= maxB) best = { blob: b, q: 0.3 };
      }
    }
    if (best) {
      let blob = best.blob;
      let padded = false;
      if (blob.size < minB) {
        // Aim 1 KB above the minimum, but never past the maximum.
        blob = await padJpeg(blob, Math.min(maxB, minB + 1024));
        padded = true;
      }
      return { blob, width: canvas.width, height: canvas.height, kb: blob.size / 1024, quality: best.q, padded };
    }
    // Still too big: only possible to shrink when the rules allow other sizes.
    if (exact) break;
    const next = { w: Math.round(size.w * 0.8), h: Math.round(size.h * 0.8) };
    if (next.w < (item.minW ?? 1) || next.h < (item.minH ?? 1)) break;
    size = next;
  }
  throw new Error(`This picture has too much detail to fit in ${item.maxKB ?? "the allowed"} KB at this size. Crop closer or use a plainer background.`);
}

export interface Check {
  label: string;
  ok: boolean;
}

const range = (lo?: number, hi?: number) => (lo && hi ? `${lo}–${hi}` : lo ? `at least ${lo}` : hi ? `at most ${hi}` : "any");

/** The checks the form will run, worked out on the final file. */
export function checks(item: PresetItem, p: Prepared): Check[] {
  const list: Check[] = [];
  if (item.width && item.height) list.push({ label: `${item.width} × ${item.height} pixels`, ok: p.width === item.width && p.height === item.height });
  else if (hasRange(item)) {
    const okW = p.width >= (item.minW ?? 0) && p.width <= (item.maxW ?? Infinity);
    const okH = p.height >= (item.minH ?? 0) && p.height <= (item.maxH ?? Infinity);
    list.push({ label: `Width ${range(item.minW, item.maxW)} px, height ${range(item.minH, item.maxH)} px (yours ${p.width} × ${p.height})`, ok: okW && okH });
  } else {
    list.push({ label: `${p.width} × ${p.height} pixels (the rules set no pixel size)`, ok: true });
  }
  if (item.aspectRule) {
    const [lo, hi] = item.aspectRule;
    const r = p.width / p.height;
    const shape = lo === hi ? (lo === 1 ? "Square" : `Width ${lo} × height`) : `Width ÷ height ${lo}–${hi}`;
    list.push({ label: `${shape} (yours ${r.toFixed(2)})`, ok: r >= lo - 0.02 && r <= hi + 0.02 });
  }
  if (item.minKB || item.maxKB) {
    const bytes = p.blob.size;
    // Passes whether the form counts 1 KB as 1000 or 1024 bytes.
    const ok = bytes >= (item.minKB ?? 0) * 1024 && bytes <= (item.maxKB ? item.maxKB * 1000 : Infinity);
    list.push({ label: `${range(item.minKB, item.maxKB)} KB (yours ${p.kb.toFixed(1)} KB)`, ok });
  }
  list.push({ label: "JPG file", ok: p.blob.type === "image/jpeg" });
  return list;
}

/** The size rule in a few words, for the chips on each card. */
export function sizeRuleText(it: PresetItem) {
  if (it.width && it.height) return `${it.width} × ${it.height} px`;
  if (hasRange(it)) return `${range(it.minW, it.maxW)} × ${range(it.minH, it.maxH)} px`;
  return "no pixel size set";
}

export const kbRuleText = (it: PresetItem) => (it.minKB || it.maxKB ? `${range(it.minKB, it.maxKB)} KB` : "no KB limit set");
