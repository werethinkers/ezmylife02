import type { Content, Product } from "./types";

export const SITE = "https://ezyourlife.com";
export const pageUrlFor = (slug?: string | null) => (slug ? `${SITE}/p/${slug}` : `${SITE}/p/your-page`);

/** Fill {placeholders}; empty values collapse instead of printing the braces. */
export const fill = (tpl: string, vars: Record<string, unknown>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? "" : String(vars[k]))).replace(/ {2,}/g, " ").trim();

/** Indian mobile → E.164 digits (91XXXXXXXXXX). Leaves other lengths as typed. */
export function waDigits(p: unknown): string {
  let d = String(p ?? "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = "91" + d;
  return d;
}
export const isMobile = (p: unknown) => /^[6-9]\d{9}$/.test(waDigits(p).replace(/^91/, ""));
export const waTo = (phone: unknown, text: string) => `https://api.whatsapp.com/send?phone=${waDigits(phone)}&text=${encodeURIComponent(text)}`;
export const waShare = (text: string) => `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
export const telHref = (phone: unknown) => `tel:+${waDigits(phone)}`;
export function fmtPhone(p: unknown) {
  const d = waDigits(p);
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return String(p ?? "");
}
export const inr = (n: unknown) => "₹" + Number(n || 0).toLocaleString("en-IN");
export const priceText = (v: unknown) => {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return /^\d+(\.\d+)?$/.test(s) ? inr(s) : s;
};

export function t12(hm?: string) {
  if (!hm) return "";
  const [hs, ms] = hm.split(":");
  let h = Number(hs); const m = Number(ms || 0);
  if (Number.isNaN(h)) return hm;
  const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
  return h + (m ? ":" + String(m).padStart(2, "0") : "") + " " + ap;
}
const mins = (hm?: string) => { const [h, m] = (hm || "0:0").split(":").map(Number); return h * 60 + (m || 0); };
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** "Open now · till 11 PM" from open days + opening/closing time. */
export function openStatus(days: string[] | undefined, opens?: string, closes?: string, now = new Date()) {
  if (!opens || !closes) return null;
  const open = days && days.length ? days : DAYS;
  const di = (now.getDay() + 6) % 7, m = now.getHours() * 60 + now.getMinutes();
  const todayOpen = open.includes(DAYS[di]);
  const o = mins(opens), c = mins(closes) <= o ? mins(closes) + 1440 : mins(closes);
  if (todayOpen && m >= o && m < c) return { open: true, label: `Open now · till ${t12(closes)}` };
  for (let k = 0; k < 8; k++) {
    const d = (di + k) % 7;
    if (!open.includes(DAYS[d])) continue;
    if (k === 0 && m < o) return { open: false, label: `Closed · opens ${t12(opens)}` };
    if (k === 0) continue;
    return { open: false, label: `Closed · opens ${k === 1 ? "tomorrow" : DAYS[d]} ${t12(opens)}` };
  }
  return { open: false, label: "Closed" };
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "page";
}

export const mapsSearch = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
export const mapsDir = (q: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
export const mapsLink = (url: unknown, address: unknown) => {
  const u = String(url ?? "").trim();
  return /^https:\/\/(maps\.app\.goo\.gl|goo\.gl|www\.google\.[a-z.]+\/maps|maps\.google\.)/i.test(u) ? u : mapsSearch(String(address ?? ""));
};

/** Only links that are safe to put in an href: https URLs and bare domains. */
export function safeUrl(u: unknown): string | null {
  let s = String(u ?? "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try { const url = new URL(s); return url.protocol === "https:" || url.protocol === "http:" ? url.href : null; } catch { return null; }
}

/** Images must come from our own storage, the builder's local draft, sample art or our Unsplash stock photos. */
export function safeImg(src: unknown): string | null {
  const s = String(src ?? "");
  if (s.startsWith("data:image/")) return s;
  if (s.startsWith("sample:")) return s;
  if (/^https:\/\/images\.unsplash\.com\/photo-[\w-]+\?[\w=&.%-]*$/.test(s)) return s;
  const base = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
  if (base && s.startsWith(`${base}/storage/v1/object/public/page-media/`)) return s;
  return null;
}

/** Google Calendar "add event" link. date: YYYY-MM-DD, time: HH:MM (IST). */
export function gcalLink(title: string, date?: string, time?: string, place?: string, details?: string) {
  if (!date) return null;
  const d = date.replace(/-/g, "");
  let dates: string;
  if (time) {
    const [h, m] = time.split(":").map(Number);
    const start = new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10), h - 5, (m || 0) - 30));
    const end = new Date(start.getTime() + 3 * 3600 * 1000);
    const f = (x: Date) => x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    dates = `${f(start)}/${f(end)}`;
  } else {
    const next = new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10) + 1)).toISOString().slice(0, 10).replace(/-/g, "");
    dates = `${d}/${next}`;
  }
  const p = new URLSearchParams({ action: "TEMPLATE", text: title, dates, location: place || "", details: details || "" });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function fmtDate(date?: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) {
  if (!date) return "";
  const d = new Date(date + "T00:00:00");
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("en-IN", opts);
}

/** Days until a YYYY-MM-DD date (negative once passed). */
export function daysUntil(date?: string) {
  if (!date) return null;
  const d = new Date(date + "T00:00:00"); const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

export function titleOf(product: Product, content: Content) {
  return String(content[product.titleField] ?? "").trim() || product.name;
}

/** Template variables available to every product's WhatsApp and share messages. */
export function messageVars(product: Product, content: Content, link: string, extra: Record<string, unknown> = {}) {
  return { ...content, product: product.name, link, title: titleOf(product, content), ...extra };
}

export function vcardBlob(c: Content) {
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${c.name || ""}`, `N:${String(c.name || "").split(" ").slice(1).join(" ")};${String(c.name || "").split(" ")[0]};;;`];
  if (c.title) lines.push(`TITLE:${c.title}`);
  if (c.company) lines.push(`ORG:${c.company}`);
  if (c.phone) lines.push(`TEL;TYPE=CELL:+${waDigits(c.phone)}`);
  if (c.email) lines.push(`EMAIL:${c.email}`);
  if (c.location) lines.push(`ADR:;;;${c.location};;;`);
  (c.links || []).forEach((l: { url?: string }) => { const u = safeUrl(l?.url); if (u) lines.push(`URL:${u}`); });
  lines.push("END:VCARD");
  return new Blob([lines.join("\r\n")], { type: "text/vcard" });
}
