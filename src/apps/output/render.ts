import { contrastText } from "./palette";
import type { PdfBlock, PdfDoc } from "./types";

/*
 * Lays a PdfDoc out as A4 pages in the page's own DOM (so the site's Hind and Unbounded fonts
 * and Hindi shaping come for free), then photographs each page into a PDF.
 * The same pages are shown as the on-screen preview, so what people see is what they save.
 */

export const PAGE = { w: 794, h: 1123 }; // A4 at 96 dpi
const PAD = { x: 60, top: 56, bottom: 64 };

const ACCENT: Record<PdfDoc["accent"], string> = {
  sun: "#ffcc00",
  lime: "#b6f22e",
  sky: "#8fb0ff",
  pink: "#ff8fe9",
  teal: "#22c2a2",
  coral: "#ff7f57",
};

const DEVANAGARI = /[ऀ-ॿ]/;

/** Scoped styles: every rule starts with .ezpdf, so nothing leaks into the site. */
export const PDF_CSS = `
.ezpdf-page{position:relative;width:${PAGE.w}px;height:${PAGE.h}px;background:#fff;color:#121212;overflow:hidden;box-sizing:border-box;font-family:Hind,system-ui,sans-serif;font-size:14px;line-height:1.55;text-align:left}
.ezpdf-page.land{width:${PAGE.h}px;height:${PAGE.w}px}
.ezpdf-page *{box-sizing:border-box}
.ezpdf-body{position:absolute;left:${PAD.x}px;right:${PAD.x}px;top:${PAD.top}px;bottom:${PAD.bottom}px;overflow:hidden}
.ezpdf-page.land .ezpdf-body{left:46px;right:46px;top:44px;bottom:56px}
.ezpdf-foot{position:absolute;left:${PAD.x}px;right:${PAD.x}px;bottom:26px;display:flex;justify-content:space-between;gap:16px;font-size:10px;color:#77716a;border-top:1px solid #e6e0d6;padding-top:6px}
.ezpdf-page.land .ezpdf-foot{left:46px;right:46px;bottom:20px}
.ezpdf-page h1,.ezpdf-page h2,.ezpdf-page h3,.ezpdf-d{font-family:Unbounded,Hind,system-ui,sans-serif;line-height:1.22;margin:0;color:#121212}
.ezpdf-page h1{font-size:25px;font-weight:800;margin:0 0 6px}
.ezpdf-page h2{font-size:16px;font-weight:700;margin:24px 0 10px;padding-bottom:6px;border-bottom:1.6px solid #121212}
.ezpdf-page h3{font-size:14px;font-weight:700;margin:16px 0 6px}
.ezpdf-body>:first-child{margin-top:0}
.ezpdf-page p{margin:0 0 9px}
.ezpdf-page ul,.ezpdf-page ol{margin:0 0 11px;padding-left:22px}
.ezpdf-page li{margin:0 0 4px}
.ezpdf-page b,.ezpdf-page strong{font-weight:600}
.ezpdf-muted{color:#5d574d}
.ezpdf-small{font-size:11.5px}
.ezpdf-tag{display:inline-block;border:1.5px solid #121212;border-radius:99px;padding:1px 11px;font-size:11px;font-weight:600;background:var(--acc);color:var(--acc-fg)}
.ezpdf-titlebar{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;border-bottom:3px solid #121212;padding-bottom:12px;margin-bottom:20px}
.ezpdf-titlebar h1{margin:10px 0 0}
.ezpdf-titlebar .ezpdf-sub{margin-top:4px;color:#5d574d}
.ezpdf-titlebar .ezpdf-by{font-size:11.5px;color:#5d574d;text-align:right;white-space:nowrap}
.ezpdf-lh{display:flex;justify-content:space-between;align-items:flex-start;gap:28px;padding-bottom:14px;border-bottom:3px solid #121212;box-shadow:0 3px 0 var(--acc);margin-bottom:22px}
.ezpdf-lh .ezpdf-mark{width:48px;height:48px;flex:none;border:2px solid #121212;border-radius:11px;background:var(--acc);color:var(--acc-fg);display:flex;align-items:center;justify-content:center;font-family:Unbounded,Hind,sans-serif;font-weight:800;font-size:17px}
.ezpdf-lh .ezpdf-biz{display:flex;gap:14px;align-items:center;min-width:0}
.ezpdf-lh .ezpdf-name{font-family:Unbounded,Hind,sans-serif;font-weight:700;font-size:18px;line-height:1.2}
.ezpdf-lh .ezpdf-contact{font-size:11px;text-align:right;color:#5d574d;line-height:1.5;max-width:46%}
.ezpdf-date{font-size:13px;margin:0 0 14px;text-align:right}
.ezpdf-letter h1{font-size:19px;margin:6px 0 14px}
.ezpdf-page table{width:100%;border-collapse:collapse;margin:6px 0 14px;font-size:13px}
.ezpdf-page th{font-weight:600;text-align:left;background:#f3ebdd;border-bottom:1.6px solid #121212;padding:7px 8px;vertical-align:bottom}
.ezpdf-page td{padding:6px 8px;border-bottom:1px solid #e1dbd0;vertical-align:top}
.ezpdf-page tfoot td{font-weight:700;border-top:1.6px solid #121212;border-bottom:none}
.ezpdf-page .ezpdf-kvt td:first-child{width:34%;color:#5d574d}
.ezpdf-page .num{text-align:right;white-space:nowrap}
.ezpdf-box{border:1.8px solid #121212;border-radius:11px;padding:13px 17px;margin:8px 0 16px}
.ezpdf-box.tint{background:#fff8ec}
.ezpdf-box>:last-child{margin-bottom:0}
.ezpdf-label{font-family:Unbounded,Hind,sans-serif;font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.ezpdf-tiles{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:10px;margin:8px 0 18px}
.ezpdf-tile{border:1.8px solid #121212;border-radius:11px;padding:10px 12px}
.ezpdf-tile .k{font-size:11px;color:#5d574d;line-height:1.3}
.ezpdf-tile .v{font-family:Unbounded,Hind,sans-serif;font-weight:700;font-size:17px;line-height:1.25;margin-top:3px;word-break:break-word}
.ezpdf-tile.on{background:var(--acc)}
.ezpdf-tile.on .k,.ezpdf-tile.on .v{color:var(--acc-fg)}
.ezpdf-kv{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:4px 18px;font-size:13px}
.ezpdf-kv b{font-weight:600}
.ezpdf-check{list-style:none;padding-left:0 !important}
.ezpdf-check li{padding-left:24px;position:relative}
.ezpdf-check li:before{content:"";position:absolute;left:0;top:3px;width:13px;height:13px;border:1.5px solid #121212;border-radius:3px}
.ezpdf-check li.done:before{background:var(--acc)}
.ezpdf-split{display:flex;height:28px;border:1.8px solid #121212;border-radius:8px;overflow:hidden;margin:6px 0 16px}
.ezpdf-split span{display:flex;align-items:center;padding-left:9px;font-size:11.5px;font-weight:600;white-space:nowrap;overflow:hidden}
.ezpdf-hr{border:0;border-top:1.4px solid #121212;margin:16px 0}
.ezpdf-img{display:block;margin:6px auto 14px;max-width:100%;object-fit:contain;border-radius:10px}
.ezpdf-break{display:none}
.ezpdf p.ezpdf-big{font-size:20px;line-height:1.65;margin-top:8px}
.ezpdf-note{font-size:11.5px;color:#5d574d;margin:10px 0}
.ezpdf-sign{display:flex;justify-content:space-between;gap:40px;margin-top:48px}
.ezpdf-sign div{flex:1;border-top:1.4px solid #121212;padding-top:6px;font-size:12px}
.ezpdf-cover .ezpdf-body{display:flex;flex-direction:column;justify-content:space-between}
.ezpdf-cover .ezpdf-top{display:flex;justify-content:space-between;align-items:center;font-size:12px}
.ezpdf-slab{background:var(--acc);border:2.5px solid #121212;border-radius:20px;padding:46px 38px;box-shadow:11px 11px 0 #121212}
.ezpdf-slab,.ezpdf-slab h1,.ezpdf-slab .ezpdf-label,.ezpdf-slab p{color:var(--acc-fg)}
.ezpdf-slab h1{font-size:36px;margin:16px 0 14px}
.ezpdf-slab .ezpdf-label{font-size:11.5px}
.ezpdf-slab p{font-size:16px;margin:0}
.ezpdf-hi .ezpdf-label,.ezpdf-hi h1,.ezpdf-hi h2,.ezpdf-hi h3{letter-spacing:0;text-transform:none}
.ezpdf-land table{font-size:12px}
.ezpdf-land th,.ezpdf-land td{padding:5px 6px}
.ezpdf-swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin:8px 0 18px}
.ezpdf-swatch{border:1.8px solid #121212;border-radius:11px;overflow:hidden;background:#fff}
.ezpdf-swatch .chip{height:56px}
.ezpdf-swatch .meta{padding:8px 10px}
.ezpdf-swatch .name{font-family:Unbounded,Hind,sans-serif;font-weight:700;font-size:12px}
.ezpdf-swatch .hex{font-size:11px;color:#5d574d;margin-top:1px}
.ezpdf-swatch .use{font-size:10.5px;color:#5d574d;margin-top:3px}
`;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Escaped text with **bold**, *italic*, `code` and links kept as words. */
export function inline(s: string): string {
  return esc(s)
    .replace(/\[(.+?)\]\((?:[^)]*)\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/__(.+?)__/g, "<b>$1</b>")
    .replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, "$1<i>$2</i>")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n/g, "<br>");
}

const NUMERIC = /^[\s(−\-+]*(₹|rs\.?|inr|\$)?\s*[\d,]+(\.\d+)?\s*(%|x|×|cr|lakh|k)?\)?$/i;

function tableHtml(b: Extract<PdfBlock, { t: "table" }>): string {
  const cols = b.head.length;
  const numeric = Array.from({ length: cols }, (_, i) => {
    const vals = b.rows.map((r) => (r[i] ?? "").replace(/\*\*/g, "").trim()).filter(Boolean);
    return i > 0 && vals.length > 0 && vals.filter((v) => NUMERIC.test(v)).length / vals.length >= 0.7;
  });
  const cls = (i: number) => (numeric[i] ? ' class="num"' : "");
  const head = b.head.some((h) => h.trim()) ? `<thead><tr>${b.head.map((h, i) => `<th${cls(i)}>${inline(h)}</th>`).join("")}</tr></thead>` : "";
  return `<table${head ? "" : ' class="ezpdf-kvt"'}>${head}<tbody>${b.rows
    .map((r) => `<tr>${r.map((c, i) => `<td${cls(i)}>${inline(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody>${b.foot ? `<tfoot><tr>${b.foot.map((c, i) => `<td${cls(i)}>${inline(c.replace(/\*\*/g, ""))}</td>`).join("")}</tr></tfoot>` : ""}</table>`;
}

export function blockHtml(b: PdfBlock): string {
  switch (b.t) {
    case "h":
      return `<h${b.level}>${inline(b.text)}</h${b.level}>`;
    case "p":
      return b.big ? `<p class="ezpdf-big">${inline(b.text)}</p>` : `<p>${inline(b.text)}</p>`;
    case "ul":
      return `<ul>${b.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`;
    case "ol":
      return `<ol>${b.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ol>`;
    case "check":
      return `<ul class="ezpdf-check">${b.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`;
    case "table":
      return tableHtml(b);
    case "tiles":
      return `<div class="ezpdf-tiles" style="--n:${Math.min(4, Math.max(1, b.items.length))}">${b.items
        .map((t) => `<div class="ezpdf-tile${t.main ? " on" : ""}"><div class="k">${inline(t.label)}</div><div class="v">${inline(t.value)}</div></div>`)
        .join("")}</div>`;
    case "kv":
      return `<div class="ezpdf-kv">${b.rows.map(([k, v]) => `<b>${inline(k)}</b><span>${inline(v)}</span>`).join("")}</div>`;
    case "box":
      return `<div class="ezpdf-box${b.tint ? " tint" : ""}">${b.label ? `<div class="ezpdf-label">${inline(b.label)}</div>` : ""}${b.blocks.map(blockHtml).join("")}</div>`;
    case "split": {
      const total = b.parts.reduce((a, p) => a + Math.max(0, p.value), 0) || 1;
      const fills = ["var(--acc)", "#f3ebdd", "#ffffff", "#e1dbd0"];
      return `<div class="ezpdf-split">${b.parts
        .map((p, i) => {
          const pct = (Math.max(0, p.value) / total) * 100;
          return `<span style="width:${pct.toFixed(2)}%;background:${fills[i % fills.length]}">${pct >= 12 ? `${inline(p.label)} ${Math.round(pct)}%` : ""}</span>`;
        })
        .join("")}</div>`;
    }
    case "note":
      return `<p class="ezpdf-note">${inline(b.text)}</p>`;
    case "sign":
      return `<div class="ezpdf-sign">${b.lines.map((l) => `<div>${inline(l)}</div>`).join("")}</div>`;
    case "hr":
      return `<hr class="ezpdf-hr">`;
    case "img":
      return `<img class="ezpdf-img" src="${esc(b.src)}" alt="${esc(b.alt ?? "")}" crossorigin="anonymous" style="max-height:${b.maxH ?? 520}px">`;
    case "break":
      return `<div class="ezpdf-break"></div>`;
    case "swatches":
      return `<div class="ezpdf-swatches">${b.items
        .map(
          (s) =>
            `<div class="ezpdf-swatch"><div class="chip" style="background:${esc(s.hex)}"></div><div class="meta"><div class="name">${inline(s.name)}</div><div class="hex">${esc(s.hex.toUpperCase())}</div>${
              s.use ? `<div class="use">${inline(s.use)}</div>` : ""
            }</div></div>`,
        )
        .join("")}</div>`;
  }
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[\p{L}\p{N}]/u.test(w))
    .slice(0, 2)
    .map((w) => [...w][0].toUpperCase())
    .join("") || "E";

function headerHtml(doc: PdfDoc): string {
  if (doc.template === "letter") {
    const lh = doc.letterhead;
    const head = lh
      ? `<div class="ezpdf-lh"><div class="ezpdf-biz"><div class="ezpdf-mark">${esc(initials(lh.name))}</div><div><div class="ezpdf-name">${esc(lh.name)}</div>${
          lh.tagline ? `<div class="ezpdf-small ezpdf-muted">${esc(lh.tagline)}</div>` : ""
        }</div></div><div class="ezpdf-contact">${lh.lines.map(esc).join("<br>")}</div></div>`
      : `<div class="ezpdf-titlebar"><div><span class="ezpdf-tag">${esc(doc.kicker)}</span></div><div class="ezpdf-by">${esc(doc.date)}</div></div>`;
    return `${head}${lh ? `<p class="ezpdf-date">${esc(doc.date)}</p>` : ""}`;
  }
  const by = [doc.date, doc.letterhead?.name].filter(Boolean).map((s) => esc(s as string)).join("<br>");
  return `<div class="ezpdf-titlebar"><div><span class="ezpdf-tag">${esc(doc.kicker)}</span><h1>${inline(doc.title)}</h1>${
    doc.subtitle ? `<div class="ezpdf-sub">${inline(doc.subtitle)}</div>` : ""
  }</div><div class="ezpdf-by">${by}</div></div>`;
}

function coverHtml(doc: PdfDoc): string {
  const who = doc.letterhead?.name ? `<span class="ezpdf-d" style="font-weight:800">${esc(doc.letterhead.name)}</span>` : `<span class="ezpdf-tag">${esc(doc.kicker)}</span>`;
  return `<div class="ezpdf-top">${who}<span class="ezpdf-muted">Made ${esc(doc.date)}</span></div>
<div class="ezpdf-slab"><div class="ezpdf-label">${esc(doc.kicker)}</div><h1>${inline(doc.title)}</h1>${doc.subtitle ? `<p>${inline(doc.subtitle)}</p>` : ""}</div>
<div>${doc.letterhead?.lines.length ? `<p class="ezpdf-small ezpdf-muted" style="margin:0 0 6px">${doc.letterhead.lines.map(esc).join(" · ")}</p>` : ""}<p class="ezpdf-small ezpdf-muted" style="margin:0">Made from the details you gave. Check names, numbers and dates before you use it.</p></div>`;
}

function newPage(host: HTMLElement, doc: PdfDoc, cls = ""): { page: HTMLElement; body: HTMLElement } {
  const page = document.createElement("div");
  page.className = `ezpdf-page ${doc.landscape ? "land ezpdf-land" : ""} ${cls}`.trim();
  const body = document.createElement("div");
  body.className = "ezpdf-body";
  if (doc.template === "letter") body.classList.add("ezpdf-letter");
  page.appendChild(body);
  host.appendChild(page);
  return { page, body };
}

const overflows = (body: HTMLElement) => body.scrollHeight > body.clientHeight + 1;

/** Tables and lists can be cut between rows or items; everything else moves whole. */
function splitOff(el: HTMLElement): HTMLElement | null {
  if (el.tagName === "TABLE") {
    const body = el.querySelector("tbody");
    const rows = body ? Array.from(body.children) : [];
    if (rows.length < 2) return null;
    const rest = el.cloneNode(true) as HTMLElement;
    const restBody = rest.querySelector("tbody")!;
    restBody.innerHTML = "";
    el.querySelector("tfoot")?.remove();
    restBody.appendChild(rows[rows.length - 1]);
    return rest;
  }
  if (el.tagName === "UL" || el.tagName === "OL") {
    const items = Array.from(el.children);
    if (items.length < 2) return null;
    const rest = el.cloneNode(false) as HTMLElement;
    rest.appendChild(items[items.length - 1]);
    if (el.tagName === "OL") rest.setAttribute("start", String(Number(el.getAttribute("start") || 1) + items.length - 1));
    return rest;
  }
  return null;
}

/** Moves the last rows (or items) of `el` to `rest` until the page fits. Returns the part cut off, or null when it cannot be cut. */
function shrinkToFit(body: HTMLElement, el: HTMLElement): HTMLElement | null {
  const rest = splitOff(el);
  if (!rest) return null;
  while (overflows(body)) {
    const more = splitOff(el);
    if (!more) break;
    if (rest.tagName === "TABLE") {
      const tb = rest.querySelector("tbody")!;
      tb.insertBefore(more.querySelector("tbody")!.firstChild!, tb.firstChild);
    } else {
      rest.insertBefore(more.firstChild!, rest.firstChild);
      if (el.tagName === "OL") rest.setAttribute("start", String(Number(el.getAttribute("start") || 1) + el.children.length));
    }
  }
  if (overflows(body)) {
    // Not even one row fits under what is already on this page: move it all on.
    if (rest.tagName === "TABLE") {
      const tb = el.querySelector("tbody")!;
      const rb = rest.querySelector("tbody")!;
      while (tb.lastChild) rb.insertBefore(tb.lastChild, rb.firstChild);
    } else {
      while (el.lastChild) rest.insertBefore(el.lastChild, rest.firstChild);
      const start = el.getAttribute("start");
      if (start) rest.setAttribute("start", start);
      else rest.removeAttribute("start");
    }
    el.remove();
  }
  return rest;
}

/**
 * Builds the pages inside `host` (which must be in the document and laid out, e.g. off screen).
 * Returns the page elements.
 */
export async function layoutPages(doc: PdfDoc, host: HTMLElement): Promise<HTMLElement[]> {
  host.innerHTML = "";
  host.classList.add("ezpdf");
  const hindi = DEVANAGARI.test(doc.title + doc.blocks.map((b) => JSON.stringify(b)).join(""));
  host.classList.toggle("ezpdf-hi", hindi);
  const accentColor = doc.accentHex ?? ACCENT[doc.accent];
  host.style.setProperty("--acc", accentColor);
  host.style.setProperty("--acc-fg", contrastText(accentColor));
  if (hindi) host.setAttribute("lang", "hi");
  try {
    await Promise.all([
      document.fonts.load('400 14px "Hind"', "aअ"),
      document.fonts.load('600 14px "Hind"', "aअ"),
      document.fonts.load('700 14px "Unbounded"', "a"),
      document.fonts.load('800 14px "Unbounded"', "a"),
    ]);
    await document.fonts.ready;
  } catch {
    /* fall back to system fonts */
  }

  const pages: HTMLElement[] = [];
  if (doc.template === "report") {
    const cover = newPage(host, doc, "ezpdf-cover");
    cover.body.innerHTML = coverHtml(doc);
    pages.push(cover.page);
  }

  const queue: HTMLElement[] = [];
  const tmp = document.createElement("div");
  const head = doc.template === "report" ? "" : headerHtml(doc);
  const letterTitle = doc.template === "letter" && doc.title ? `<h1>${inline(doc.title)}</h1>` : "";
  tmp.innerHTML = head + letterTitle + doc.blocks.map(blockHtml).join("");
  // Pictures must be loaded before pages can be measured.
  await Promise.all(
    Array.from(tmp.querySelectorAll("img")).map((im) => (im.complete ? Promise.resolve() : im.decode().catch(() => im.remove()))),
  );
  queue.push(...(Array.from(tmp.children) as HTMLElement[]));

  let cur = newPage(host, doc);
  pages.push(cur.page);
  while (queue.length) {
    const el = queue.shift()!;
    if (el.classList.contains("ezpdf-break")) {
      if (cur.body.children.length) {
        cur = newPage(host, doc);
        pages.push(cur.page);
      }
      continue;
    }
    cur.body.appendChild(el);
    if (!overflows(cur.body)) continue;
    const alone = cur.body.children.length === 1;
    const rest = shrinkToFit(cur.body, el);
    if (rest && alone && !el.isConnected) {
      cur.body.appendChild(rest); // even one row is too tall for a page: keep it here
      continue;
    }
    if (rest && !alone && el.isConnected && el.tagName === "TABLE" && el.querySelectorAll("tbody tr").length < 3) {
      // Don't leave one or two lonely rows at the bottom of a page: move the whole table on.
      const rb = rest.querySelector("tbody")!;
      const tb = el.querySelector("tbody")!;
      while (tb.lastChild) rb.insertBefore(tb.lastChild, rb.firstChild);
      el.remove();
    }
    if (rest) {
      queue.unshift(rest);
    } else if (!alone) {
      el.remove();
      queue.unshift(el);
    } else {
      continue; // one block taller than a page: keep it and let it clip rather than loop
    }
    // Keep a heading with what follows it.
    const carry: HTMLElement[] = [];
    let last = cur.body.lastElementChild as HTMLElement | null;
    while (last && /^H[1-3]$/.test(last.tagName) && cur.body.children.length > 1) {
      carry.unshift(last);
      last.remove();
      last = cur.body.lastElementChild as HTMLElement | null;
    }
    queue.unshift(...carry);
    cur = newPage(host, doc);
    pages.push(cur.page);
  }
  if (!cur.body.children.length && pages.length > 1) {
    cur.page.remove();
    pages.pop();
  }

  pages.forEach((p, i) => {
    const foot = document.createElement("div");
    foot.className = "ezpdf-foot";
    foot.innerHTML = `<span>${esc(doc.kicker)} · Made with ezyourlife.com</span><span>Page ${i + 1} of ${pages.length}</span>`;
    p.appendChild(foot);
  });
  return pages;
}

let styleAdded = false;
export function ensurePdfStyles() {
  if (styleAdded || typeof document === "undefined") return;
  const s = document.createElement("style");
  s.setAttribute("data-ezpdf", "");
  s.textContent = PDF_CSS;
  document.head.appendChild(s);
  styleAdded = true;
}

export interface MadePdf {
  blob: Blob;
  /** Small JPEG pictures of each page for the on-screen preview. */
  previews: string[];
  pages: number;
}

function shrink(canvas: HTMLCanvasElement, width: number): string {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = Math.round((canvas.height / canvas.width) * width);
  c.getContext("2d")?.drawImage(canvas, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85);
}

/** Makes the PDF file in the browser. The two libraries load only the first time a PDF is made. */
export async function makePdf(doc: PdfDoc, onProgress?: (done: number, total: number) => void): Promise<MadePdf> {
  ensurePdfStyles();
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position:fixed;left:-20000px;top:0;pointer-events:none;";
  document.body.appendChild(host);
  try {
    const pages = await layoutPages(doc, host);
    const land = !!doc.landscape;
    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: land ? "landscape" : "portrait", compress: true });
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    const previews: string[] = [];
    pdf.setProperties({ title: doc.title || doc.kicker, creator: "ezyourlife.com", subject: doc.kicker });
    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        width: land ? PAGE.h : PAGE.w,
        height: land ? PAGE.w : PAGE.h,
        windowWidth: land ? PAGE.h : PAGE.w,
      });
      if (i > 0) pdf.addPage("a4", land ? "landscape" : "portrait");
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, w, h, undefined, "FAST");
      previews.push(shrink(canvas, land ? 900 : 640));
      onProgress?.(i + 1, pages.length);
      // Let the page breathe between pages on slow phones.
      await new Promise((r) => setTimeout(r, 0));
    }
    return { blob: pdf.output("blob"), previews, pages: pages.length };
  } finally {
    host.remove();
  }
}
