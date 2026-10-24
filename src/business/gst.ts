/* GST maths for bills and returns. Plain code, no AI.
   - No GST: the owner is not registered; the bill is a plain bill.
   - Composition: the owner pays a flat rate on turnover (1% traders and makers, 5% restaurants, 6% services)
     and may not charge tax on the bill, so the bill is a "bill of supply" with no tax lines.
   - Regular: tax per item at its rate; CGST + SGST inside the state, IGST across states. */

import type { GstMode, LineItem, TaxedLine } from "./types";

export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const GST_RATES = [0, 5, 12, 18, 28, 40];

export const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

/** States where the composition limit is ₹75 lakh instead of ₹1.5 crore. */
const SPECIAL_STATES = new Set(["Arunachal Pradesh", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Sikkim", "Tripura", "Uttarakhand"]);

export interface BillInput {
  lines: LineItem[];
  gst_mode: GstMode;
  inter_state: boolean;
  prices_include_tax: boolean;
  discount?: number;
}

export interface BillMaths {
  lines: TaxedLine[];
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  round_off: number;
  total: number;
}

/** Works out every line and the bill total. A discount is shared across lines by their value. */
export function computeBill(input: BillInput): BillMaths {
  const lines = input.lines.filter((l) => l.qty > 0 && l.name.trim());
  const gross = lines.map((l) => l.qty * l.price);
  const grossSum = gross.reduce((a, b) => a + b, 0);
  const discount = Math.min(Math.max(0, input.discount ?? 0), grossSum);
  const taxed: TaxedLine[] = lines.map((l, i) => {
    const share = grossSum > 0 ? discount * (gross[i] / grossSum) : 0;
    const value = gross[i] - share;
    if (input.gst_mode !== "regular" || !l.gst_rate) {
      return { ...l, gst_rate: input.gst_mode === "regular" ? l.gst_rate || 0 : 0, taxable: r2(value), cgst: 0, sgst: 0, igst: 0, total: r2(value) };
    }
    const rate = l.gst_rate / 100;
    const taxable = input.prices_include_tax ? value / (1 + rate) : value;
    const tax = taxable * rate;
    const igst = input.inter_state ? r2(tax) : 0;
    const half = input.inter_state ? 0 : r2(tax / 2);
    return { ...l, taxable: r2(taxable), cgst: half, sgst: half, igst, total: r2(taxable + igst + half * 2) };
  });
  const sum = (k: "taxable" | "cgst" | "sgst" | "igst" | "total") => r2(taxed.reduce((a, l) => a + l[k], 0));
  const exact = sum("total");
  const total = Math.round(exact);
  return { lines: taxed, discount: r2(discount), taxable: sum("taxable"), cgst: sum("cgst"), sgst: sum("sgst"), igst: sum("igst"), round_off: r2(total - exact), total };
}

/** Indian financial year of a date, as "2026-27". */
export function fyOf(date: string): string {
  const d = new Date(date.slice(0, 10));
  const y = d.getUTCMonth() >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

export function fyRange(fy: string): { from: string; to: string } {
  const y = Number(fy.slice(0, 4));
  return { from: `${y}-04-01`, to: `${y + 1}-03-31` };
}

/** GST quarter (Apr–Jun is Q1) of a date, with its dates and the CMP-08 due date (18th of the month after). */
export function quarterOf(date: string): { label: string; from: string; to: string; due: string } {
  const d = new Date(date.slice(0, 10));
  const m = d.getUTCMonth(); // 0 = Jan
  const startMonth = m - (((m - 3) % 3) + 3) % 3; // Apr, Jul, Oct or Jan
  const y = d.getUTCFullYear();
  const from = new Date(Date.UTC(y, startMonth, 1));
  const to = new Date(Date.UTC(y, startMonth + 3, 0));
  const due = new Date(Date.UTC(y, startMonth + 3, 18));
  const q = ((startMonth - 3 + 12) % 12) / 3 + 1;
  const names = ["Apr to Jun", "Jul to Sep", "Oct to Dec", "Jan to Mar"];
  return { label: `Q${q} ${fyOf(date)} (${names[q - 1]})`, from: iso(from), to: iso(to), due: iso(due) };
}

/** Monthly returns for regular GST: GSTR-1 by the 11th and GSTR-3B by the 20th of the next month. */
export function monthDue(month: string): { gstr1: string; gstr3b: string } {
  const [y, m] = month.split("-").map(Number);
  return { gstr1: iso(new Date(Date.UTC(y, m, 11))), gstr3b: iso(new Date(Date.UTC(y, m, 20))) };
}

/** Yearly turnover limit for the composition scheme. Services have a lower limit. */
export function compositionLimit(state: string, services: boolean): number {
  if (services) return 50_00_000;
  return SPECIAL_STATES.has(state) ? 75_00_000 : 1_50_00_000;
}

/** Turnover above which GST registration is needed (goods ₹40 lakh, services ₹20 lakh; ₹20 / ₹10 lakh in special category states). */
export function registrationLimit(state: string, services: boolean): number {
  const special = SPECIAL_STATES.has(state);
  if (services) return special ? 10_00_000 : 20_00_000;
  return special ? 20_00_000 : 40_00_000;
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Checks a GSTIN's shape and its check digit. */
export function validGstin(g: string): boolean {
  const s = g.trim().toUpperCase();
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(s)) return false;
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const v = chars.indexOf(s[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(v / 36) + (v % 36);
  }
  return chars[(36 - (sum % 36)) % 36] === s[14];
}
