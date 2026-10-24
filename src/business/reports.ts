/* Reports read straight from the records: nothing here is typed in twice. */

import type { AnyRec, PayMode, Rec, Settings } from "./types";
import { billBalance, list, stockOf, supplierDue } from "./engine";
import { compositionLimit, fyOf, fyRange, monthDue, quarterOf, r2, registrationLimit } from "./gst";
import { addDays, daysBetween, today } from "./format";

const live = (recs: AnyRec[]) => list(recs, "bill").filter((b) => !b.data.cancelled);
const inRange = (d: string, from: string, to: string) => d.slice(0, 10) >= from && d.slice(0, 10) <= to;

/** Sales value without GST collected for the government. */
const saleValue = (b: Rec<"bill">) => b.data.total - b.data.cgst - b.data.sgst - b.data.igst;

export function stockList(recs: AnyRec[]) {
  const level = new Map<string, number>();
  for (const r of recs) if (r.kind === "stock_move") level.set(r.data.item_id, (level.get(r.data.item_id) ?? 0) + r.data.qty);
  const products = list(recs, "product").filter((p) => p.data.stock_mode === "self").map((p) => ({ id: p.id, kind: "product" as const, name: p.data.name, unit: p.data.unit, qty: r2(level.get(p.id) ?? 0), low_at: p.data.low_at ?? 0, cost: p.data.cost ?? 0 }));
  const materials = list(recs, "material").map((m) => ({ id: m.id, kind: "material" as const, name: m.data.name, unit: m.data.unit, qty: r2(level.get(m.id) ?? 0), low_at: m.data.low_at, cost: m.data.cost }));
  const all = [...products, ...materials].map((x) => ({ ...x, low: x.low_at > 0 && x.qty <= x.low_at, value: r2(Math.max(0, x.qty) * x.cost) }));
  return { items: all, low: all.filter((x) => x.low), value: r2(all.reduce((a, x) => a + x.value, 0)) };
}

/** How many of a recipe product can be made from the stock there is now. */
export function canMake(recs: AnyRec[], productId: string): number | null {
  const p = list(recs, "product").find((x) => x.id === productId);
  if (!p || p.data.stock_mode !== "recipe" || !p.data.recipe?.length) return null;
  let n = Infinity;
  for (const part of p.data.recipe) if (part.qty > 0) n = Math.min(n, Math.floor(stockOf(recs, part.material_id) / part.qty));
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

/** Cost of one recipe product from its materials. */
export function recipeCost(recs: AnyRec[], productId: string): number | null {
  const p = list(recs, "product").find((x) => x.id === productId);
  if (!p?.data.recipe?.length) return null;
  const mats = new Map(list(recs, "material").map((m) => [m.id, m.data.cost]));
  return r2(p.data.recipe.reduce((a, x) => a + (mats.get(x.material_id) ?? 0) * x.qty, 0));
}

export interface DueRow { customer_id?: string; name: string; phone?: string; amount: number; oldest: string; days: number; bills: { id: string; number: string; date: string; balance: number }[] }

export function duesList(recs: AnyRec[], on = today()): DueRow[] {
  const by = new Map<string, DueRow>();
  for (const b of live(recs)) {
    const bal = billBalance(recs, b);
    if (bal <= 0.5) continue;
    const key = b.data.customer_id ?? `walkin:${b.data.customer_name}`;
    const row = by.get(key) ?? { customer_id: b.data.customer_id, name: b.data.customer_name, phone: b.data.phone, amount: 0, oldest: b.data.date, days: 0, bills: [] };
    row.amount = r2(row.amount + bal);
    if (b.data.date < row.oldest) row.oldest = b.data.date;
    row.bills.push({ id: b.id, number: b.data.number, date: b.data.date, balance: bal });
    by.set(key, row);
  }
  const customers = new Map(list(recs, "customer").map((c) => [c.id, c]));
  return [...by.values()].map((r) => ({ ...r, phone: r.phone ?? (r.customer_id ? customers.get(r.customer_id)?.data.phone : undefined), days: daysBetween(r.oldest, on) })).sort((a, b) => b.amount - a.amount);
}

export function payablesList(recs: AnyRec[]) {
  return list(recs, "supplier").map((s) => ({ id: s.id, name: s.data.name, phone: s.data.phone, amount: supplierDue(recs, s.id) })).filter((x) => x.amount > 0.5).sort((a, b) => b.amount - a.amount);
}

export function customerStats(recs: AnyRec[]) {
  const stats = new Map<string, { spent: number; visits: number; last: string; due: number }>();
  for (const b of live(recs)) {
    if (!b.data.customer_id) continue;
    const s = stats.get(b.data.customer_id) ?? { spent: 0, visits: 0, last: "", due: 0 };
    s.spent = r2(s.spent + b.data.total);
    s.visits += 1;
    if (b.data.date > s.last) s.last = b.data.date;
    s.due = r2(s.due + Math.max(0, billBalance(recs, b)));
    stats.set(b.data.customer_id, s);
  }
  return stats;
}

export interface Pnl { sales: number; gst_collected: number; purchases: number; input_gst: number; expenses: { category: string; amount: number }[]; expense_total: number; composition_tax: number; profit: number; bills: number }

/** A simple profit view: sales minus what was bought and spent. GST collected is the government's, so it is left out. */
export function pnl(recs: AnyRec[], s: Settings, from: string, to: string): Pnl {
  const bills = live(recs).filter((b) => inRange(b.data.date, from, to));
  const sales = r2(bills.reduce((a, b) => a + saleValue(b), 0));
  const gst = r2(bills.reduce((a, b) => a + b.data.cgst + b.data.sgst + b.data.igst, 0));
  const purch = list(recs, "purchase").filter((p) => inRange(p.data.date, from, to));
  const regular = s.gst_mode === "regular";
  const purchases = r2(purch.reduce((a, p) => a + (regular ? p.data.taxable : p.data.total), 0));
  const input = r2(regular ? purch.reduce((a, p) => a + p.data.tax, 0) : 0);
  const cats = new Map<string, number>();
  for (const e of list(recs, "expense")) {
    if (!inRange(e.data.date, from, to) || e.data.category === "Owner took out" || e.data.category === "Tax paid") continue;
    cats.set(e.data.category, r2((cats.get(e.data.category) ?? 0) + e.data.amount));
  }
  const expenses = [...cats.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  const expense_total = r2(expenses.reduce((a, e) => a + e.amount, 0));
  const composition_tax = s.gst_mode === "composition" ? r2((sales * s.composition_rate) / 100) : 0;
  return { sales, gst_collected: gst, purchases, input_gst: input, expenses, expense_total, composition_tax, profit: r2(sales - purchases - expense_total - composition_tax), bills: bills.length };
}

export interface CashRow { date: string; text: string; mode: PayMode; in: number; out: number; ref?: string }

/** Every rupee in and out, with cash in hand and money in the bank (UPI, card and bank together). */
export function cashBook(recs: AnyRec[], s: Settings, from: string, to: string) {
  const rows: CashRow[] = [];
  const bills = new Map(list(recs, "bill").map((b) => [b.id, b]));
  const sups = new Map(list(recs, "supplier").map((x) => [x.id, x]));
  for (const p of list(recs, "payment")) {
    const b = p.data.bill_id ? bills.get(p.data.bill_id) : undefined;
    const who = b ? `${b.data.customer_name}, bill ${b.data.number}` : p.data.supplier_id ? sups.get(p.data.supplier_id)?.data.name ?? "Supplier" : p.data.note ?? "Payment";
    const text = p.data.direction === "in" ? `Received from ${who}` : p.data.note === "Refund" ? `Refund to ${who}` : `Paid to ${who}`;
    rows.push({ date: p.data.date, text, mode: p.data.mode, in: p.data.direction === "in" ? p.data.amount : 0, out: p.data.direction === "out" ? p.data.amount : 0, ref: p.id });
  }
  for (const e of list(recs, "expense")) rows.push({ date: e.data.date, text: e.data.note ? `${e.data.category}: ${e.data.note}` : e.data.category, mode: e.data.mode, in: 0, out: e.data.amount, ref: e.id });
  rows.sort((a, b) => a.date.localeCompare(b.date));
  const bal = (filter: (r: CashRow) => boolean) => r2(rows.filter(filter).reduce((a, r) => a + r.in - r.out, 0));
  const isCash = (r: CashRow) => r.mode === "cash";
  const before = (r: CashRow) => r.date < from;
  const upto = (r: CashRow) => r.date <= to;
  const opening = { cash: r2(s.opening_cash + bal((r) => isCash(r) && before(r))), bank: bal((r) => !isCash(r) && before(r)) };
  const closing = { cash: r2(s.opening_cash + bal((r) => isCash(r) && upto(r))), bank: bal((r) => !isCash(r) && upto(r)) };
  const period = rows.filter((r) => inRange(r.date, from, to));
  return { rows: period, opening, closing, in: r2(period.reduce((a, r) => a + r.in, 0)), out: r2(period.reduce((a, r) => a + r.out, 0)) };
}

/** Regular GST for one month: sales by rate (what goes in GSTR-1), tax to pay after input tax (GSTR-3B). */
export function gstMonth(recs: AnyRec[], month: string) {
  const bills = live(recs).filter((b) => b.data.date.startsWith(month) && b.data.gst_mode === "regular");
  const byRate = new Map<number, { rate: number; taxable: number; cgst: number; sgst: number; igst: number }>();
  const hsn = new Map<string, { hsn: string; name: string; qty: number; taxable: number; tax: number; rate: number }>();
  const products = new Map(list(recs, "product").map((p) => [p.id, p]));
  for (const b of bills) for (const l of b.data.lines) {
    const row = byRate.get(l.gst_rate) ?? { rate: l.gst_rate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    row.taxable = r2(row.taxable + l.taxable); row.cgst = r2(row.cgst + l.cgst); row.sgst = r2(row.sgst + l.sgst); row.igst = r2(row.igst + l.igst);
    byRate.set(l.gst_rate, row);
    const code = (l.product_id && products.get(l.product_id)?.data.hsn) || "";
    const key = `${code}|${l.gst_rate}|${code ? "" : l.name}`;
    const h = hsn.get(key) ?? { hsn: code, name: l.name, qty: 0, taxable: 0, tax: 0, rate: l.gst_rate };
    h.qty = r2(h.qty + l.qty); h.taxable = r2(h.taxable + l.taxable); h.tax = r2(h.tax + l.cgst + l.sgst + l.igst);
    hsn.set(key, h);
  }
  const b2b = bills.filter((b) => b.data.customer_gstin).map((b) => ({ number: b.data.number, date: b.data.date, name: b.data.customer_name, gstin: b.data.customer_gstin!, taxable: b.data.taxable, tax: r2(b.data.cgst + b.data.sgst + b.data.igst), total: b.data.total }));
  const output = r2(bills.reduce((a, b) => a + b.data.cgst + b.data.sgst + b.data.igst, 0));
  const input = r2(list(recs, "purchase").filter((p) => p.data.date.startsWith(month)).reduce((a, p) => a + p.data.tax, 0));
  const missingRate = list(recs, "product").filter((p) => p.data.active && !p.data.gst_rate).length;
  return { rates: [...byRate.values()].sort((a, b) => a.rate - b.rate), hsn: [...hsn.values()], b2b, output, input, payable: r2(Math.max(0, output - input)), carry: r2(Math.max(0, input - output)), due: monthDue(month), bills: bills.length, missingRate };
}

/** Composition: a flat rate on the quarter's turnover, paid with CMP-08; and how close the year is to the limit. */
export function gstQuarter(recs: AnyRec[], s: Settings, date: string, services: boolean) {
  const q = quarterOf(date);
  const turnover = r2(live(recs).filter((b) => inRange(b.data.date, q.from, q.to)).reduce((a, b) => a + b.data.total, 0));
  const fy = fyOf(date);
  const range = fyRange(fy);
  const fyTurnover = r2(live(recs).filter((b) => inRange(b.data.date, range.from, range.to)).reduce((a, b) => a + saleValue(b), 0));
  const limit = s.gst_mode === "none" ? registrationLimit(s.state, services) : compositionLimit(s.state, services);
  return { quarter: q, turnover, tax: r2((turnover * s.composition_rate) / 100), fy, fyTurnover, limit, share: limit ? fyTurnover / limit : 0, annualDue: `${Number(fy.slice(0, 4)) + 1}-06-30` };
}

export function salesByDay(recs: AnyRec[], days: number, on = today()) {
  const from = addDays(on, -(days - 1));
  const map = new Map<string, { date: string; sales: number; collected: number }>();
  for (let i = 0; i < days; i++) {
    const d = addDays(from, i);
    map.set(d, { date: d, sales: 0, collected: 0 });
  }
  for (const b of live(recs)) { const r = map.get(b.data.date); if (r) r.sales = r2(r.sales + b.data.total); }
  for (const p of list(recs, "payment")) { const r = map.get(p.data.date); if (r && p.data.direction === "in") r.collected = r2(r.collected + p.data.amount); }
  return [...map.values()];
}

export function salesByMonth(recs: AnyRec[], s: Settings, months: number, on = today()) {
  const out: { month: string; sales: number; spent: number; profit: number }[] = [];
  const [y, m] = on.split("-").map(Number);
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    const month = d.toISOString().slice(0, 7);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
    const p = pnl(recs, s, `${month}-01`, last);
    out.push({ month, sales: p.sales, spent: r2(p.purchases + p.expense_total), profit: p.profit });
  }
  return out;
}

export function topProducts(recs: AnyRec[], from: string, to: string, n = 8) {
  const map = new Map<string, { name: string; qty: number; amount: number }>();
  for (const b of live(recs)) {
    if (!inRange(b.data.date, from, to)) continue;
    for (const l of b.data.lines) {
      const k = l.product_id ?? l.name.toLowerCase();
      const r = map.get(k) ?? { name: l.name, qty: 0, amount: 0 };
      r.qty = r2(r.qty + l.qty); r.amount = r2(r.amount + l.total);
      map.set(k, r);
    }
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, n);
}

export function topCustomers(recs: AnyRec[], from: string, to: string, n = 8) {
  const map = new Map<string, { name: string; bills: number; amount: number }>();
  for (const b of live(recs)) {
    if (!inRange(b.data.date, from, to) || !b.data.customer_id) continue;
    const r = map.get(b.data.customer_id) ?? { name: b.data.customer_name, bills: 0, amount: 0 };
    r.bills += 1; r.amount = r2(r.amount + b.data.total);
    map.set(b.data.customer_id, r);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, n);
}

/** The numbers on the first screen. */
export function overview(recs: AnyRec[], s: Settings, on = today()) {
  const bills = live(recs);
  const todays = bills.filter((b) => b.data.date === on);
  const month = on.slice(0, 7);
  const collectedToday = r2(list(recs, "payment").filter((p) => p.data.date === on && p.data.direction === "in").reduce((a, p) => a + p.data.amount, 0));
  const dues = duesList(recs, on);
  const mp = pnl(recs, s, `${month}-01`, on);
  const end = new Date(`${on}T23:59:59.999`).toISOString();
  const reminders = list(recs, "reminder").filter((r) => r.data.status === "open" && r.data.due_at <= end).sort((a, b) => a.data.due_at.localeCompare(b.data.due_at));
  const orders = list(recs, "order").filter((o) => !["delivered", "cancelled"].includes(o.data.status));
  const dueToday = orders.filter((o) => o.data.due_at && o.data.due_at.slice(0, 10) <= on).sort((a, b) => (a.data.due_at ?? "").localeCompare(b.data.due_at ?? ""));
  const website = list(recs, "order").filter((o) => o.data.source === "website" && !o.data.bill_id && o.data.status !== "cancelled");
  const appts = list(recs, "appointment").filter((a) => today(new Date(a.data.start_at)) === on && a.data.status === "booked").sort((a, b) => a.data.start_at.localeCompare(b.data.start_at));
  const leads = list(recs, "lead").filter((l) => !["won", "lost"].includes(l.data.status));
  return {
    salesToday: r2(todays.reduce((a, b) => a + b.data.total, 0)), billsToday: todays.length, collectedToday,
    duesTotal: r2(dues.reduce((a, d) => a + d.amount, 0)), duesPeople: dues.length,
    monthSales: mp.sales, monthProfit: mp.profit, reminders, openOrders: orders.length, dueToday, website, appts,
    leadsOpen: leads.length, leadsValue: r2(leads.reduce((a, l) => a + (l.data.value ?? 0), 0)), low: stockList(recs).low,
  };
}

/** What is left to set up, shown as a short list on the first screen until it is done. */
export function setupSteps(recs: AnyRec[], s: Settings) {
  const products = list(recs, "product");
  const steps = [
    { id: "items", text: `Check your ${s.labels.products.toLowerCase()} and prices`, done: products.some((p) => p.updated_at !== p.created_at) || products.length === 0 },
    { id: "phone", text: "Add your phone number so bills and messages carry it", done: !!s.phone },
    { id: "upi", text: "Add your UPI ID so customers can pay from the bill", done: !!s.upi_id },
    { id: "first", text: `Make your first bill or ${s.labels.order.toLowerCase()}`, done: list(recs, "bill").length > 0 },
  ];
  if (s.gst_mode === "regular") steps.splice(1, 0, { id: "gst", text: "Set the GST rate on each item", done: products.filter((p) => p.data.active).every((p) => p.data.gst_rate > 0) });
  if (s.modules.includes("website")) steps.push({ id: "site", text: "Put your website live", done: s.site.published });
  return steps;
}
