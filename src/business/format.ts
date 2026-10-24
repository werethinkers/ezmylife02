/* Small helpers for showing money and dates the Indian way. */

const inrFmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2, minimumFractionDigits: 0 });
const numFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export const inr = (n: number) => inrFmt.format(Number.isFinite(n) ? n : 0);
export const num = (n: number) => numFmt.format(Number.isFinite(n) ? n : 0);
/** ₹1.2L, ₹3.4Cr style, for tiles. */
export function inrShort(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_00_00_000) return `${n < 0 ? "-" : ""}₹${num(r1(a / 1_00_00_000))}Cr`;
  if (a >= 1_00_000) return `${n < 0 ? "-" : ""}₹${num(r1(a / 1_00_000))}L`;
  return inr(Math.round(n));
}
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Today as YYYY-MM-DD in the user's own time zone. */
export function today(d = new Date()): string {
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}
export const monthOf = (date: string) => date.slice(0, 7);
export function addDays(date: string, days: number): string {
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`)) / 86_400_000);
}
/** A local date-time string for <input type="datetime-local">, from an ISO time. */
export function localInput(isoTime: string): string {
  const d = new Date(isoTime);
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export function day(date?: string): string {
  if (!date) return "";
  const d = date.length <= 10 ? new Date(`${date}T00:00:00`) : new Date(date);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}
export function dayTime(isoTime?: string): string {
  if (!isoTime) return "";
  const d = new Date(isoTime);
  return `${day(isoTime)}, ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`;
}
export function monthName(month: string): string {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export const plural = (n: number, one: string, many = `${one}s`) => `${num(n)} ${n === 1 ? one : many}`;

/** Indian phone numbers to the 91XXXXXXXXXX form wa.me wants. */
export function waPhone(phone?: string): string {
  const d = (phone ?? "").replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  return d;
}

/** Writes rows as CSV text that Excel opens. */
export function toCsv(rows: (string | number | undefined | null)[][]): string {
  return rows.map((r) => r.map((c) => {
    const s = c === undefined || c === null ? "" : String(c);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
}

export function download(name: string, text: string, type = "text/csv") {
  const blob = new Blob([type === "text/csv" ? `\ufeff${text}` : text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
