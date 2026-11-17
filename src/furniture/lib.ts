// Furniture Sheets: types, server calls, saved history (IndexedDB) and exports.
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { callFunction } from "@/lib/credits";

export type SheetStyle = "light" | "blueprint" | "mono" | "vintage";
export type Tier = "quick" | "standard" | "premium";
export type SheetType = "full" | "exploded" | "ortho" | "details" | "bom";
export type OutputKind = "sheet" | "view" | "hero" | "iso" | "lineart" | "scene" | "colorway" | "edit";

export interface Part { item: number; component: string; material: string; finish: string; qty: number | string; notes: string }
export interface Mat { code: string; name: string; note: string; hex?: string }
export interface Spec {
  name: string;
  category: string;
  style: string;
  summary: string;
  dimensions: { width: number; depth: number; height: number; seatHeight: number; unit: string };
  parts: Part[];
  materials: Mat[];
  joinery: string[];
  notes: string[];
  cost: { lowINR: number; highINR: number; note: string };
  careNotes: string[];
  tags: string[];
}
export interface Meta { project: string; title: string; drawingNo: string; revision: string; scale: string; date: string; drawnBy: string }
export interface Output { id: string; kind: OutputKind; label: string; url: string; createdAt: number }
export interface Item {
  id: string;
  name: string;
  photo: string;
  spec?: Spec;
  meta: Meta;
  style: SheetStyle;
  sheetType: SheetType;
  tier?: Tier;
  hybrid?: boolean;
  unit: "mm" | "in";
  materials: string;
  notes: string;
  outputs: Output[];
  createdAt: number;
  updatedAt: number;
}

export const STYLE_OPTIONS: Array<{ id: SheetStyle; name: string; line: string; swatch: string }> = [
  { id: "light", name: "Light drafting", line: "White sheet, fine black lines, rendered exploded view", swatch: "bg-card" },
  { id: "blueprint", name: "Blueprint CAD", line: "Navy sheet, cyan lines, yellow sizes", swatch: "bg-ink" },
  { id: "mono", name: "Line art", line: "Pure black lines on white, no colour", swatch: "bg-sand" },
  { id: "vintage", name: "Vintage drafting", line: "Cream paper, brown ink, wash shading", swatch: "bg-sun" },
];

export const SHEET_TYPES: Array<{ id: SheetType; name: string; line: string }> = [
  { id: "full", name: "Full sheet", line: "Everything on one page" },
  { id: "exploded", name: "Exploded view", line: "Big assembly with callouts" },
  { id: "ortho", name: "Views & section", line: "Front, side, back, top, section" },
  { id: "details", name: "Details", line: "Joinery and build-ups" },
  { id: "bom", name: "Materials & parts", line: "Schedule, swatches, parts list" },
];

export const VIEWS: Array<{ id: string; name: string }> = [
  { id: "front", name: "Front" },
  { id: "three-quarter", name: "3/4 right" },
  { id: "three-quarter-left", name: "3/4 left" },
  { id: "right", name: "Right side" },
  { id: "left", name: "Left side" },
  { id: "back", name: "Back" },
  { id: "top", name: "Top" },
  { id: "detail", name: "Detail close-up" },
];

export const ROOMS: Array<{ id: string; name: string }> = [
  { id: "living", name: "Living room" },
  { id: "bedroom", name: "Bedroom" },
  { id: "dining", name: "Dining room" },
  { id: "office", name: "Home office" },
  { id: "hotel", name: "Hotel lobby" },
  { id: "cafe", name: "Cafe" },
  { id: "showroom", name: "Showroom" },
  { id: "outdoor", name: "Terrace" },
];

export const COLOURWAYS = ["Emerald green velvet", "Charcoal bouclé", "Tan leather", "Dusty pink linen", "Navy blue wool", "Mustard yellow velvet", "Walnut wood finish", "White lacquer"];

export const DEFAULT_PRICES = { analyze: 4, quick: 31, standard: 52, premium: 104, image: 31 };

export const TIERS: Array<{ id: Tier; name: string; line: string; tool: string }> = [
  { id: "quick", name: "Quick draft", line: "Fast and cheapest. Good for checking the layout.", tool: "furniture-sheet-quick" },
  { id: "standard", name: "Standard", line: "Sharp drawings and dimensions. Best value.", tool: "furniture-sheet" },
  { id: "premium", name: "Premium", line: "Top model for the finest construction detail.", tool: "furniture-sheet-pro" },
];

export const emptyMeta = (): Meta => ({
  project: "",
  title: "",
  drawingNo: "FT-01",
  revision: "REV A",
  scale: "NTS / INDICATIVE",
  date: String(new Date().getFullYear()),
  drawnBy: "",
});

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ---------------------------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------------------------

/** Reads a photo and shrinks it to at most 1600 px, so uploads stay small and fast. */
export function fileToPhoto(file: File, max = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      const ctx = c.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error("canvas")); return; }
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This file is not a readable picture.")); };
    img.src = url;
  });
}

// ---------------------------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------------------------

const FN = "furniture-studio";

export const analyzePhoto = (photo: string) =>
  callFunction<{ ok: boolean; spec: Spec }>(FN, { action: "analyze", image: photo });

export const drawSheet = (item: Item) =>
  callFunction<{ ok: boolean; image: string; hybrid?: boolean }>(FN, {
    action: "sheet",
    tier: item.tier ?? "standard",
    hybrid: item.hybrid !== false,
    image: item.photo,
    style: item.style,
    sheetType: item.sheetType,
    unit: item.unit,
    spec: item.spec,
    meta: item.meta,
    materials: item.materials,
    notes: item.notes,
  });

export const makePicture = (photo: string, kind: OutputKind, extra: Record<string, string> = {}) =>
  callFunction<{ ok: boolean; image: string }>(FN, { action: "image", image: photo, kind, ...extra });

/** Cleans what the model sent so the editor never meets a missing field. */
export function normaliseSpec(raw: Partial<Spec>): Spec {
  const d = raw.dimensions ?? ({} as Spec["dimensions"]);
  return {
    name: String(raw.name ?? "Furniture piece"),
    category: String(raw.category ?? "other"),
    style: String(raw.style ?? ""),
    summary: String(raw.summary ?? ""),
    dimensions: {
      width: Number(d.width) || 0,
      depth: Number(d.depth) || 0,
      height: Number(d.height) || 0,
      seatHeight: Number(d.seatHeight) || 0,
      unit: "mm",
    },
    parts: (raw.parts ?? []).map((p, i) => ({
      item: Number(p.item) || i + 1,
      component: String(p.component ?? ""),
      material: String(p.material ?? ""),
      finish: String(p.finish ?? ""),
      qty: p.qty ?? 1,
      notes: String(p.notes ?? ""),
    })),
    materials: (raw.materials ?? []).map((m, i) => ({ code: String(m.code ?? `M0${i + 1}`), name: String(m.name ?? ""), note: String(m.note ?? ""), hex: /^#[0-9a-f]{6}$/i.test(String(m.hex ?? "")) ? String(m.hex) : undefined })),
    joinery: (raw.joinery ?? []).map(String),
    notes: (raw.notes ?? []).map(String),
    cost: { lowINR: Number(raw.cost?.lowINR) || 0, highINR: Number(raw.cost?.highINR) || 0, note: String(raw.cost?.note ?? "") },
    careNotes: (raw.careNotes ?? []).map(String),
    tags: (raw.tags ?? []).map(String),
  };
}

/** Switches the overall sizes between millimetres and inches. */
export function convertDims(spec: Spec, to: "mm" | "in"): Spec {
  const f = to === "in" ? 1 / 25.4 : 25.4;
  const r = (v: number) => (to === "in" ? Math.round(v * f * 10) / 10 : Math.round(v * f));
  const d = spec.dimensions;
  return { ...spec, dimensions: { ...d, width: r(d.width), depth: r(d.depth), height: r(d.height), seatHeight: r(d.seatHeight), unit: to } };
}

// ---------------------------------------------------------------------------------------------
// Saved history (this browser only)
// ---------------------------------------------------------------------------------------------

const DB = "ezy-furniture-sheets";
const STORE = "items";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no_idb"));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = run(t.objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export const loadItems = async (): Promise<Item[]> => {
  try {
    const all = (await tx<Item[]>("readonly", (s) => s.getAll() as IDBRequest<Item[]>)) ?? [];
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
};
export const saveItem = (item: Item) => tx("readwrite", (s) => s.put(item)).catch(() => undefined);
export const removeItem = (id: string) => tx("readwrite", (s) => s.delete(id)).catch(() => undefined);

// ---------------------------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------------------------

const slug = (s: string) => (s || "furniture").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "furniture";

export async function urlToBlob(url: string): Promise<Blob> {
  const r = await fetch(url);
  return r.blob();
}

export const ext = (url: string) => (url.startsWith("data:image/jpeg") ? "jpg" : url.startsWith("data:image/webp") ? "webp" : "png");

export async function downloadImage(url: string, name: string) {
  saveAs(await urlToBlob(url), `${slug(name)}.${ext(url)}`);
}

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function bomCsv(spec: Spec): string {
  const rows = [["Item", "Component", "Material", "Finish", "Qty", "Notes"]];
  spec.parts.forEach((p) => rows.push([String(p.item), p.component, p.material, p.finish, String(p.qty), p.notes]));
  rows.push([]);
  rows.push(["Code", "Material / finish", "Note"]);
  spec.materials.forEach((m) => rows.push([m.code, m.name, m.note]));
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

export const downloadBom = (spec: Spec, name: string) =>
  saveAs(new Blob(["﻿" + bomCsv(spec)], { type: "text/csv;charset=utf-8" }), `${slug(name)}-parts-list.csv`);

export const downloadSpecJson = (item: Item) =>
  saveAs(new Blob([JSON.stringify({ name: item.name, meta: item.meta, unit: item.unit, spec: item.spec }, null, 2)], { type: "application/json" }), `${slug(item.name)}-spec.json`);

/** Builds a PDF: the picture on page 1, the parts list, sizes and notes on page 2. */
export async function buildPdf(item: Item, url: string): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const dims = await new Promise<{ w: number; h: number }>((res) => {
    const i = new Image();
    i.onload = () => res({ w: i.width, h: i.height });
    i.onerror = () => res({ w: 3, h: 2 });
    i.src = url;
  });
  const m = 8;
  const s = Math.min((W - 2 * m) / dims.w, (H - 2 * m) / dims.h);
  const iw = dims.w * s;
  const ih = dims.h * s;
  doc.addImage(url, ext(url) === "jpg" ? "JPEG" : "PNG", (W - iw) / 2, (H - ih) / 2, iw, ih);

  const spec = item.spec;
  if (spec) {
    doc.addPage("a4", "portrait");
    const pw = doc.internal.pageSize.getWidth();
    let y = 18;
    doc.setFont("helvetica", "bold").setFontSize(16).text(spec.name || item.name, 14, y);
    y += 7;
    doc.setFont("helvetica", "normal").setFontSize(9);
    const d = spec.dimensions;
    doc.text(`Overall ${d.width} x ${d.depth} x ${d.height} ${item.unit}${d.seatHeight ? `, seat height ${d.seatHeight}` : ""}. Indicative values from one photo; verify before production.`, 14, y, { maxWidth: pw - 28 });
    y += 10;
    doc.setFont("helvetica", "bold").setFontSize(10).text("Parts list", 14, y);
    y += 5;
    doc.setFontSize(8);
    const cols = [14, 24, 72, 112, 146, 160];
    ["No", "Component", "Material", "Finish", "Qty", "Notes"].forEach((h, i) => doc.text(h, cols[i], y));
    doc.setFont("helvetica", "normal");
    y += 2;
    for (const p of spec.parts) {
      y += 5;
      if (y > 280) { doc.addPage("a4", "portrait"); y = 18; }
      const row = [String(p.item), p.component, p.material, p.finish, String(p.qty), p.notes];
      row.forEach((c, i) => doc.text(doc.splitTextToSize(c, (cols[i + 1] ?? pw - 12) - cols[i] - 2)[0] ?? "", cols[i], y));
    }
    y += 10;
    if (spec.materials.length) {
      doc.setFont("helvetica", "bold").setFontSize(10).text("Materials and finishes", 14, y);
      doc.setFont("helvetica", "normal").setFontSize(8);
      for (const mt of spec.materials) {
        y += 5;
        if (y > 280) { doc.addPage("a4", "portrait"); y = 18; }
        doc.text(`${mt.code}  ${mt.name}${mt.note ? ` (${mt.note})` : ""}`, 14, y, { maxWidth: pw - 28 });
      }
      y += 8;
    }
    if (spec.cost.highINR) {
      doc.setFont("helvetica", "bold").setFontSize(10).text("Indicative workshop cost", 14, y);
      doc.setFont("helvetica", "normal").setFontSize(8);
      y += 5;
      doc.text(`Rs ${spec.cost.lowINR.toLocaleString("en-IN")} to Rs ${spec.cost.highINR.toLocaleString("en-IN")} per piece. ${spec.cost.note}`, 14, y, { maxWidth: pw - 28 });
    }
  }
  return doc.output("blob");
}

export async function downloadPdf(item: Item, url: string) {
  saveAs(await buildPdf(item, url), `${slug(item.name)}.pdf`);
}

/** One zip with every picture, the parts list, the spec and a PDF of the newest sheet. */
export async function downloadZip(item: Item) {
  const zip = new JSZip();
  const folder = zip.folder(slug(item.name)) ?? zip;
  let n = 0;
  for (const o of item.outputs) {
    n += 1;
    folder.file(`${String(n).padStart(2, "0")}-${slug(o.label)}.${ext(o.url)}`, await urlToBlob(o.url));
  }
  folder.file("original-photo.jpg", await urlToBlob(item.photo));
  if (item.spec) {
    folder.file("parts-list.csv", "﻿" + bomCsv(item.spec));
    folder.file("spec.json", JSON.stringify(item.spec, null, 2));
  }
  const sheet = item.outputs.find((o) => o.kind === "sheet");
  if (sheet) folder.file("design-sheet.pdf", await buildPdf(item, sheet.url));
  saveAs(await zip.generateAsync({ type: "blob" }), `${slug(item.name)}-pack.zip`);
}

export async function copyImage(url: string) {
  const blob = await urlToBlob(url);
  const png = blob.type === "image/png" ? blob : await new Promise<Blob>((res, rej) => {
    const i = new Image();
    i.onload = () => {
      const c = document.createElement("canvas");
      c.width = i.width; c.height = i.height;
      c.getContext("2d")?.drawImage(i, 0, 0);
      c.toBlob((b) => (b ? res(b) : rej(new Error("copy"))), "image/png");
    };
    i.onerror = () => rej(new Error("copy"));
    i.src = url;
  });
  await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
}

export async function shareImage(url: string, name: string) {
  const blob = await urlToBlob(url);
  const file = new File([blob], `${slug(name)}.${ext(url)}`, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: name });
    return true;
  }
  return false;
}

export function printImage(url: string, title: string) {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(`<!doctype html><title>${title.replace(/[<&]/g, "")}</title><style>@page{size:A3 landscape;margin:6mm}body{margin:0}img{width:100%;height:auto;display:block}</style><img src="${url}" onload="setTimeout(()=>{print()},200)">`);
  w.document.close();
  return true;
}
