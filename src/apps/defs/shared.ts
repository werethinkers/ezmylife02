import { lazy } from "react";
import { DEFAULT_PRICES } from "../prices";
import { num } from "../shell/Fields";
import type { FormValues, TrackerRow } from "../types";

/*
 * Helpers and common form fields shared by the app definition files in this folder.
 * One file per vertical; registry.tsx joins them into APPS.
 */

export { num, inr } from "../shell/Fields";

export const p = (id: string) => DEFAULT_PRICES[id] ?? 0;
export const custom = (loader: () => Promise<{ default: React.ComponentType<{ toolId: string }> }>) => lazy(loader);
export const s = (v: FormValues, k: string) => (typeof v[k] === "string" ? (v[k] as string) : "");
export const sum = (rows: TrackerRow[], f: (r: TrackerRow) => number) => rows.reduce((a, r) => a + f(r), 0);
export const isoToday = () => new Date().toISOString().slice(0, 10);
/** An ISO date n days from today, for form defaults that must not go stale (validity, deadlines). */
export const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
export const daysFrom = (d: string) => (d ? Math.round((new Date(d + "T00:00:00").getTime() - new Date(isoToday() + "T00:00:00").getTime()) / 86400000) : NaN);

export const BUSINESS = { key: "Business", label: "Business name", profile: "businessName" as const, half: true };
export const INDUSTRY = { key: "Industry", label: "Type of business", profile: "industry" as const, half: true, placeholder: "Restaurant, clinic, boutique…" };
export const CITY = { key: "City", label: "City / state", profile: "city" as const, half: true };
export const LANG = { key: "Language", label: "Language", type: "select" as const, options: ["English", "Hindi", "Hinglish", "English + Hindi"], default: "English", half: true };
export const SENDER = { key: "Sender", label: "Your name & designation", profile: "ownerName" as const, half: true };

export const LETTER_CHIPS = ["More firm", "More polite", "Shorter", "Translate to Hindi"];
export const MSG_CHIPS = ["Shorter", "Friendlier", "Add Hindi version", "More urgent"];
/** Bills and quotations: the tweaks people actually ask for on a priced document. */
export const BILL_CHIPS = ["Add my bank details", "Show the tax breakup", "Add terms & conditions", "Translate to Hindi"];
/** Letters to staff: tone and the clauses an employer usually adds. */
export const HR_CHIPS = ["Warmer tone", "More formal", "Add a probation clause", "Translate to Hindi"];
/** Contracts and deeds: what to tighten before showing it to a lawyer. */
export const AGREEMENT_CHIPS = ["Simpler language", "Add a dispute-resolution clause", "Protect me more", "Add a signature & witness block"];
/** Forms and registers meant to be printed and filled by hand. */
export const FORM_CHIPS = ["Add more blank rows", "Fit on one page", "Add a signature block", "Translate to Hindi"];

/** The rows typed into a "rows" field. */
export const rowsOf = (v: FormValues, k: string): Record<string, string>[] =>
  Array.isArray(v[k]) ? (v[k] as Record<string, string>[]) : [];

/**
 * Subtotal, tax and total for an item table (qty × price, plus an optional per-line tax %).
 * The sums are worked out here and sent with the form so the document carries real arithmetic
 * instead of the model's guess at it.
 */
export function billTotals(rows: Record<string, string>[], keys: { qty?: string; price?: string; tax?: string } = {}) {
  const { qty = "qty", price = "price", tax = "tax" } = keys;
  let sub = 0;
  let taxAmount = 0;
  let lines = 0;
  for (const r of rows) {
    const amount = (num(r[qty]) || 1) * num(r[price]);
    if (!amount) continue;
    lines += 1;
    sub += amount;
    taxAmount += (amount * num(r[tax])) / 100;
  }
  return { sub, tax: taxAmount, total: sub + taxAmount, lines };
}
