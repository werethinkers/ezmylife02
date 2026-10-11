import { lazy } from "react";
import { DEFAULT_PRICES } from "../prices";
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
export const daysFrom = (d: string) => (d ? Math.round((new Date(d + "T00:00:00").getTime() - new Date(isoToday() + "T00:00:00").getTime()) / 86400000) : NaN);

export const BUSINESS = { key: "Business", label: "Business name", profile: "businessName" as const, half: true };
export const INDUSTRY = { key: "Industry", label: "Type of business", profile: "industry" as const, half: true, placeholder: "Restaurant, clinic, boutique…" };
export const CITY = { key: "City", label: "City / state", profile: "city" as const, half: true };
export const LANG = { key: "Language", label: "Language", type: "select" as const, options: ["English", "Hindi", "Hinglish", "English + Hindi"], default: "English", half: true };
export const SENDER = { key: "Sender", label: "Your name & designation", profile: "ownerName" as const, half: true };

export const LETTER_CHIPS = ["More firm", "More polite", "Shorter", "Translate to Hindi"];
export const MSG_CHIPS = ["Shorter", "Friendlier", "Add Hindi version", "More urgent"];
