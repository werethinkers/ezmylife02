import type { Content, Product, Theme } from "./types";
import { fill, fmtDate, greetingOf } from "./util";
import { resolveImg } from "./parts";

export const FORMATS = {
  "1:1": [1080, 1080], "4:5": [1080, 1350], "9:16": [1080, 1920], "Link preview": [1200, 630],
} as const;
export type Format = keyof typeof FORMATS;

function firstPhoto(c: Content): string | null {
  const cands = [c.memories?.[0]?.photo, c.photo, c.gallery?.[0]?.photo, c.cover, c.items?.find((i: { photo?: string }) => i?.photo)?.photo];
  for (const x of cands) { const r = resolveImg(x); if (r) return r; }
  return null;
}

function copyFor(p: Product, c: Content) {
  const o = p.opts;
  switch (p.family) {
    case "celebration": { const g = greetingOf(o.greeting, c); return { kick: "", big: g.includes(String(c.recipient)) ? g : `${g}`, name: g.includes(String(c.recipient)) ? "" : `${c.recipient}!`, sub: `From ${c.sender} ❤️`, pill: o.cta }; }
    case "festival": return { kick: "", big: o.greeting, name: "", sub: `From ${c.sender}`, pill: "Open your greeting" };
    case "event": return { kick: o.kicker, big: String(c.hosts ?? ""), name: "", sub: [fmtDate(c.date, { day: "numeric", month: "long", year: "numeric" }), c.venue].filter(Boolean).join(" · "), pill: "View invitation & RSVP" };
    case "business": return { kick: [c.area, c.city].filter(Boolean).join(" · "), big: `${o.heroVerb} ${c.name}`, name: "", sub: String(c.tagline ?? ""), pill: String(c.offer || "Scan or tap to know more") };
    case "menu": return { kick: "Menu", big: String(c.name ?? ""), name: "", sub: String(c.tagline ?? ""), pill: "Scan to see the menu & order" };
    default: return { kick: "", big: String(c.name ?? ""), name: "", sub: [c.title, c.company].filter(Boolean).join(" · "), pill: "Save my contact" };
  }
}

const load = (src: string) => new Promise<HTMLImageElement | null>((res) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

function wrap(x: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/); const out: string[] = []; let line = "";
  for (const w of words) { const t = line ? line + " " + w : w; if (x.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }
  if (line) out.push(line);
  return out;
}
function fit(x: CanvasRenderingContext2D, text: string, maxW: number, size: number, family: string, weight = "700", maxLines = 2) {
  let s = size;
  for (; s > 28; s -= 4) { x.font = `${weight} ${s}px ${family}`; if (wrap(x, text, maxW).length <= maxLines) break; }
  return { size: s, lines: wrap(x, text, maxW) };
}
function rr(x: CanvasRenderingContext2D, X: number, Y: number, W: number, H: number, r: number) {
  x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath();
}

/** Draws a designed share card (not a screenshot) for the page. qr: a rendered QR canvas to place on it. */
export async function drawShareCard(p: Product, theme: Theme, c: Content, url: string, f: Format, qr?: HTMLCanvasElement | null): Promise<HTMLCanvasElement> {
  const [W, H] = FORMATS[f];
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const x = cv.getContext("2d")!;
  const { bg, sf, tx, mu, ac, ac2, ac3, on } = theme.c;
  const fd = theme.f.d, fb = theme.f.b;
  try { await Promise.all([document.fonts.load(`700 80px ${fd}`), document.fonts.load(`600 40px ${fb}`)]); } catch { /* fallback fonts */ }

  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, sf); g.addColorStop(1, bg); x.fillStyle = g; x.fillRect(0, 0, W, H);
  const personal = ["celebration", "festival", "event"].includes(p.family);
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  if (personal) for (let i = 0; i < 70; i++) { x.save(); x.translate(rnd() * W, rnd() * H); x.rotate(rnd() * 6.28); x.fillStyle = [ac, ac2, ac3][i % 3]; x.globalAlpha = 0.35 + rnd() * 0.4; if (i % 4 === 0) { x.beginPath(); x.arc(0, 0, 7 + rnd() * 6, 0, 7); x.fill(); } else x.fillRect(-6, -10, 12, 20); x.restore(); }
  else { x.fillStyle = ac; x.fillRect(0, 0, W, 14); }

  const wide = f === "Link preview";
  const pad = wide ? 70 : 84;
  const photo = firstPhoto(c);
  const img = photo ? await load(photo) : null;
  const k = copyFor(p, c);

  // photo panel
  const textX = pad;
  let textW = W - pad * 2, y = wide ? 110 : 140;
  if (img) {
    if (wide) {
      const pw = 470, ph = H - 120; x.save(); rr(x, W - pw - 60, 60, pw, ph, 28); x.clip();
      const r = Math.max(pw / img.width, ph / img.height); x.drawImage(img, W - pw - 60 + (pw - img.width * r) / 2, 60 + (ph - img.height * r) / 2, img.width * r, img.height * r); x.restore();
      textW = W - pw - 60 - pad - 40;
    } else {
      const ps = f === "1:1" ? 420 : f === "4:5" ? 560 : 700;
      x.save(); x.translate(W / 2, y + ps / 2); x.rotate(personal ? -0.04 : 0);
      x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 50; x.shadowOffsetY = 20;
      x.fillStyle = personal ? "#FFFDF8" : sf; x.fillRect(-ps / 2 - 18, -ps / 2 - 18, ps + 36, ps + 36);
      x.shadowColor = "transparent";
      x.beginPath(); x.rect(-ps / 2, -ps / 2, ps, ps); x.clip();
      const r = Math.max(ps / img.width, ps / img.height); x.drawImage(img, -img.width * r / 2, -img.height * r / 2, img.width * r, img.height * r);
      x.restore();
      y += ps + 110;
    }
  } else if (!wide) y = f === "9:16" ? H * 0.28 : f === "4:5" ? H * 0.2 : H * 0.14;

  const center = !wide && personal;
  x.textAlign = center ? "center" : "left";
  const tx0 = center ? W / 2 : textX;
  if (k.kick) { x.font = `700 ${wide ? 28 : 34}px ${fb}`; x.fillStyle = ac2; x.fillText(k.kick.toUpperCase(), tx0, y); y += wide ? 60 : 76; }
  const big = fit(x, k.big, textW, wide ? 84 : img ? 96 : 130, fd, "700", 3);
  x.fillStyle = tx; big.lines.forEach((l) => { y += big.size * 0.95; x.fillText(l, tx0, y); }); y += 12;
  if (k.name) {
    const nm = fit(x, k.name, textW, wide ? 110 : 170, fd, "700", 1);
    const ng = x.createLinearGradient(pad, 0, W - pad, 0); ng.addColorStop(0, ac); ng.addColorStop(0.5, ac2); ng.addColorStop(1, ac3);
    x.fillStyle = ng; y += nm.size * 0.95; x.fillText(nm.lines[0], tx0, y); y += 16;
  }
  if (k.sub) { const sb = fit(x, k.sub, textW, wide ? 34 : 44, fb, "600", 2); x.fillStyle = mu; sb.lines.forEach((l) => { y += sb.size * 1.25; x.fillText(l, tx0, y); }); }

  // pill + QR + url along the bottom
  const bottom = H - (wide ? 70 : 96);
  x.font = `700 ${wide ? 30 : 40}px ${fb}`;
  const pw2 = Math.min(x.measureText(k.pill).width + 80, textW);
  const ph2 = wide ? 76 : 96;
  const pillX = center ? (W - pw2) / 2 : textX;
  const pillY = bottom - ph2 - (wide ? 40 : 60);
  x.fillStyle = ac; rr(x, pillX, pillY, pw2, ph2, ph2 / 2); x.fill();
  x.fillStyle = on; x.textAlign = "center"; x.fillText(k.pill, pillX + pw2 / 2, pillY + ph2 / 2 + (wide ? 11 : 14), pw2 - 40);
  x.textAlign = center ? "center" : "left";
  x.font = `500 ${wide ? 24 : 30}px ${fb}`; x.fillStyle = mu; x.fillText(url.replace(/^https?:\/\//, ""), center ? W / 2 : textX, bottom);
  if (qr && !personal && !wide) {
    const qs = f === "1:1" ? 210 : 250;
    x.fillStyle = "#FFFFFF"; rr(x, W - pad - qs - 16, bottom - qs - 16 + 8, qs + 32, qs + 32, 22); x.fill();
    x.drawImage(qr, W - pad - qs, bottom - qs + 8, qs, qs);
  }
  return cv;
}

/** Fills a 1200×630 link-preview picture with a photo, cropped from the middle like the cover of a book. */
export async function drawPhotoPreview(src: string): Promise<HTMLCanvasElement> {
  const [W, H] = FORMATS["Link preview"];
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const x = cv.getContext("2d")!;
  x.fillStyle = "#111"; x.fillRect(0, 0, W, H);
  const img = await load(src);
  if (!img) throw new Error("That picture couldn't be opened.");
  const r = Math.max(W / img.width, H / img.height);
  x.drawImage(img, (W - img.width * r) / 2, (H - img.height * r) / 2, img.width * r, img.height * r);
  return cv;
}

/** A printable A5 poster (300 dpi) with the QR code front and centre. */
export async function drawQrPoster(p: Product, theme: Theme, c: Content, url: string, qr: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const W = 1748, H = 2480; const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const x = cv.getContext("2d")!;
  try { await document.fonts.load(`700 120px ${theme.f.d}`); } catch { /* fallback */ }
  x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, W, H);
  x.fillStyle = theme.c.ac; x.fillRect(0, 0, W, 40);
  x.textAlign = "center"; x.fillStyle = "#111";
  x.font = `700 56px ${theme.f.b}`; x.fillText("SCAN ME", W / 2, 260);
  const title = String(c[p.titleField] ?? p.name);
  const t = fit(x, title, W - 240, 190, theme.f.d, "700", 2);
  let y = 300; t.lines.forEach((l) => { y += t.size; x.fillText(l, W / 2, y); });
  const line = { business: "Plans, prices, timings and offers", menu: "See the menu and order on WhatsApp", event: "Invitation, venue map and RSVP", profile: "Save my contact in one tap", celebration: "There's a surprise inside", festival: "A greeting for you" }[p.family];
  x.font = `600 60px ${theme.f.b}`; x.fillStyle = "#444"; x.fillText(line, W / 2, y + 110);
  const qs = 1150, qx = (W - qs) / 2, qy = y + 200;
  x.fillStyle = theme.c.ac; rr(x, qx - 50, qy - 50, qs + 100, qs + 100, 70); x.fill();
  x.fillStyle = "#FFFFFF"; x.fillRect(qx, qy, qs, qs); x.drawImage(qr, qx, qy, qs, qs);
  x.fillStyle = "#111"; x.font = `700 64px ${theme.f.b}`; x.fillText("Point your phone camera here", W / 2, qy + qs + 190);
  x.font = `500 46px ${theme.f.b}`; x.fillStyle = "#555"; x.fillText(url.replace(/^https?:\/\//, ""), W / 2, qy + qs + 270);
  return cv;
}

export function downloadCanvas(cv: HTMLCanvasElement, name: string) {
  cv.toBlob((b) => {
    if (!b) return;
    const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 3000);
  }, "image/png");
}
