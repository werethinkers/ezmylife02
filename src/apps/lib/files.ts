import { ensurePdfJs } from "@/lib/startupLibs";

/* Small helpers for reading and saving files in the browser. */

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const downloadText = (text: string, name: string, type = "text/plain") =>
  downloadBlob(new Blob([text], { type: `${type};charset=utf-8` }), name);

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "document";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Minimal Markdown → HTML for Word/print exports (text is escaped first). */
export function markdownToHtml(md: string): string {
  const lines = esc(md).split("\n");
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  let table: string[][] | null = null;
  const inline = (t: string) =>
    t
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  const closeList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };
  const closeTable = () => {
    if (!table) return;
    const [head, ...body] = table;
    out.push(
      `<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%"><thead><tr>${head
        .map((c) => `<th style="background:#f3f4f6;text-align:left">${inline(c)}</th>`)
        .join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`,
    );
    table = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*\|.*\|\s*$/.test(line)) {
      closeList();
      const cells = line.trim().slice(1, -1).split("|").map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      (table ??= []).push(cells);
      continue;
    }
    closeTable();
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      closeList();
      out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
    } else if ((m = line.match(/^\s*[-*]\s+\[( |x)\]\s+(.*)$/i))) {
      if (list !== "ul") {
        closeList();
        out.push("<ul>");
        list = "ul";
      }
      out.push(`<li>${m[1].toLowerCase() === "x" ? "☑" : "☐"} ${inline(m[2])}</li>`);
    } else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
      if (list !== "ul") {
        closeList();
        out.push("<ul>");
        list = "ul";
      }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      if (list !== "ol") {
        closeList();
        out.push("<ol>");
        list = "ol";
      }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if (!line.trim()) {
      closeList();
    } else if (/^-{3,}$/.test(line.trim())) {
      closeList();
      out.push("<hr/>");
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  closeTable();
  return out.join("\n");
}

const docShell = (title: string, body: string) =>
  `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;color:#111;max-width:800px;margin:24px auto;padding:0 16px}h1,h2,h3{color:#111;margin:16px 0 8px}table{margin:8px 0}td,th{vertical-align:top;font-size:10pt}code{background:#f3f4f6;padding:0 3px}</style></head><body>${body}</body></html>`;

/** Saves Markdown as a .doc file that Word / Google Docs open with formatting. */
export const downloadWord = (md: string, name: string, title = name) =>
  downloadBlob(new Blob(["﻿", docShell(title, markdownToHtml(md))], { type: "application/msword" }), `${name}.doc`);

/** Opens a clean print view (also "Save as PDF"). */
export function printMarkdown(md: string, title: string) {
  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=1000");
  if (!w) return false;
  w.document.write(docShell(title, markdownToHtml(md)));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
  return true;
}

// ───────────── CSV ─────────────

export function toCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.map((c) => cell(c.label)).join(","), ...rows.map((r) => columns.map((c) => cell(r[c.key])).join(","))].join("\n");
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  const t = text.replace(/^\ufeff/, "");
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) {
      if (ch === '"') {
        if (t[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      row.push(cur);
      cur = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else cur += ch;
  }
  if (cur || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export const readText = (f: File) => f.text();

// ───────────── Images ─────────────

/** Reads an image file as a JPEG data URL, scaled down so uploads stay small. */
export function imageToDataUrl(file: File, maxSide = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * scale));
      c.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not available"));
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read ${file.name}`));
    };
    img.src = url;
  });
}

export const dataUrlToBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob();

// ───────────── PDF (pdf.js, loaded on demand) ─────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfDoc = any;

export async function openPdf(file: File | ArrayBuffer): Promise<PdfDoc> {
  await ensurePdfJs();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs = (window as any).pdfjsLib;
  if (!pdfjs) throw new Error("PDF reader could not load. Check your connection and try again.");
  const data = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  return pdfjs.getDocument({ data }).promise;
}

export async function pdfPageText(doc: PdfDoc, pageNo: number): Promise<string> {
  const page = await doc.getPage(pageNo);
  const tc = await page.getTextContent();
  let last = -1;
  let out = "";
  for (const it of tc.items as { str: string; transform: number[]; hasEOL?: boolean }[]) {
    const y = Math.round(it.transform?.[5] ?? 0);
    if (last !== -1 && Math.abs(y - last) > 2) out += "\n";
    out += it.str + (it.hasEOL ? "\n" : " ");
    last = y;
  }
  return out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Extracts text page by page (up to maxPages) with "--- Page n ---" markers. */
export async function pdfText(file: File, maxPages = 200, onProgress?: (done: number, total: number) => void) {
  const doc = await openPdf(file);
  const total = Math.min(doc.numPages, maxPages);
  const pages: string[] = [];
  for (let i = 1; i <= total; i++) {
    pages.push(`--- Page ${i} ---\n${await pdfPageText(doc, i)}`);
    onProgress?.(i, total);
  }
  return { text: pages.join("\n\n"), pages: doc.numPages as number, read: total };
}

/** Renders a PDF page to a JPEG data URL (for OCR of scanned PDFs or previews). */
export async function pdfPageImage(doc: PdfDoc, pageNo: number, maxSide = 1600): Promise<string> {
  const page = await doc.getPage(pageNo);
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(3, maxSide / Math.max(base.width, base.height));
  const vp = page.getViewport({ scale });
  const c = document.createElement("canvas");
  c.width = Math.round(vp.width);
  c.height = Math.round(vp.height);
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  return c.toDataURL("image/jpeg", 0.85);
}

/** Text from a .pdf, .txt, .md, .csv or .json file. */
export async function fileText(file: File, onProgress?: (done: number, total: number) => void): Promise<string> {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) return (await pdfText(file, 300, onProgress)).text;
  if (/\.(txt|md|csv|json|html?)$/i.test(file.name) || file.type.startsWith("text/")) return file.text();
  throw new Error(`${file.name}: use a PDF or a text file (.txt, .md, .csv).`);
}
