import type { WorkspaceProfile } from "./workspace";

/*
 * Field memory: what someone types in one app comes back as a suggestion in any app with the
 * same kind of field (client name, GSTIN, address, line items…). A client typed once is saved
 * as a record, so picking the client later fills their GSTIN, address and contact too.
 *
 * Works on any form without per-app wiring: kinds are read from each field's label, placeholder
 * and aria-label. Stored in this browser and, when signed in, in the user's own app data.
 */

export interface ClientRecord {
  client: string;
  client_gstin?: string;
  client_address?: string;
  client_email?: string;
  client_phone?: string;
  usedAt: number;
}

export interface MemoryData {
  enabled: boolean;
  kinds: Record<string, string[]>;   // kind → recent unique values, newest first
  clients: ClientRecord[];
  savedAt?: number;
}

export const MEMORY_INITIAL: MemoryData = { enabled: true, kinds: {}, clients: [] };
export const MAX_PER_KIND = 12;
export const MAX_CLIENTS = 60;

type Editable = HTMLInputElement | HTMLTextAreaElement;

const SKIP_TYPES = new Set(["password", "hidden", "file", "checkbox", "radio", "range", "color", "date", "time", "datetime-local", "month", "week", "number", "search", "submit", "button", "reset", "image"]);
// Never remembered, whatever the app: secrets and identity numbers.
const SENSITIVE = /password|passcode|\botp\b|one.?time|\bcvv\b|\bcvc\b|card number|credit card|debit card|aadha?ar|\bupi pin\b|\bpin\b(?!\s*code)|security code|secret|api key|token/;

export function isEditable(el: EventTarget | null): el is Editable {
  if (el instanceof HTMLTextAreaElement) return !el.readOnly && !el.disabled;
  if (el instanceof HTMLInputElement) return !SKIP_TYPES.has(el.type) && !el.readOnly && !el.disabled;
  return false;
}

/** The words that describe a field: its label (however it's attached), aria-label and placeholder. */
export function describeField(el: Editable): string {
  const parts: string[] = [];
  if (el.id) {
    try {
      const l = el.ownerDocument.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (l?.textContent) parts.push(l.textContent);
    } catch { /* invalid id */ }
  }
  const wrap = el.closest("label");
  if (wrap?.textContent) parts.push(wrap.textContent);
  if (!parts.length) {
    // Label as a sibling: climb to the smallest box that holds only this field and a label.
    let node: HTMLElement | null = el.parentElement;
    for (let i = 0; i < 3 && node; i++, node = node.parentElement) {
      if (node.querySelectorAll("input,textarea,select").length > 1) break;
      const l = node.querySelector("label");
      if (l?.textContent) { parts.push(l.textContent); break; }
    }
  }
  parts.push(el.getAttribute("aria-label") ?? "", el.getAttribute("name") ?? "", el.placeholder ?? "");
  return parts.join(" ").replace(/[*:()]/g, " ").replace(/\d+\s*\/\s*\d+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

const CLIENTISH = /client|customer|buyer|bill(ed)? to|party b|consignee|recipient/;

/** Maps a field description to a shared kind, so "Client Name" in one app matches "Customer name" in another. */
export function kindOf(desc: string): string | null {
  if (!desc || SENSITIVE.test(desc) || /\bsearch\b/.test(desc)) return null;
  const c = CLIENTISH.test(desc);
  if (/gst ?in|gst (no|number)|gst registration/.test(desc) || /\b\d{2}[a-z]{5}\d{4}[a-z]\d[z][a-z0-9]\b/.test(desc)) return c ? "client_gstin" : "gstin";
  if (/e-?mail/.test(desc)) return c ? "client_email" : "email";
  if (/phone|mobile|whats ?app|contact (no|number)|\btel\b/.test(desc)) return c ? "client_phone" : "phone";
  if (/pin ?code|postal code|\bzip\b/.test(desc)) return "pincode";
  if (/website|\burl\b|instagram|linkedin|social/.test(desc)) return "website";
  if (/address/.test(desc)) return c ? "client_address" : "address";
  if (c) return "client";
  if (/business name|company|firm|organi[sz]ation|brand|shop name|store name|restaurant name|school name|institute/.test(desc)) return "business";
  if (/designation|job title|\brole\b|position/.test(desc)) return "designation";
  if (/\bcity\b|town/.test(desc)) return "city";
  if (/\bstate\b/.test(desc)) return "state";
  if (/item|product|description of goods|service name/.test(desc)) return "item";
  if (/\b(your|full|owner|sender|contact person|employee|candidate|student|first|last)?\s*name\b/.test(desc)) return "name";
  // Otherwise fields with the same wording share memory ("Target audience", "Tone"…).
  const norm = desc.replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim().split(" ").slice(0, 5).join(" ");
  return norm.length >= 3 ? "l:" + norm : null;
}

const PROFILE_FOR: Record<string, keyof WorkspaceProfile> = {
  business: "businessName", name: "ownerName", phone: "phone", email: "email", address: "address",
  city: "city", state: "state", gstin: "gstin", website: "website",
};

export function suggestionsFor(kind: string, typed: string, mem: MemoryData, profile: WorkspaceProfile): string[] {
  const out: string[] = [];
  const push = (v?: string) => { const t = (v ?? "").trim(); if (t && !out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t); };
  if (kind === "client") mem.clients.slice().sort((a, b) => b.usedAt - a.usedAt).forEach((r) => push(r.client));
  (mem.kinds[kind] ?? []).forEach(push);
  const pk = PROFILE_FOR[kind];
  if (pk) push(profile[pk]);
  const q = typed.trim().toLowerCase();
  return out.filter((v) => v.toLowerCase() !== q && (!q || v.toLowerCase().includes(q))).slice(0, 6);
}

export function remember(mem: MemoryData, kind: string, value: string): MemoryData {
  const v = value.trim();
  if (v.length < 2 || v.length > 500) return mem;
  const list = [v, ...(mem.kinds[kind] ?? []).filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, MAX_PER_KIND);
  return { ...mem, kinds: { ...mem.kinds, [kind]: list } };
}

export function rememberClient(mem: MemoryData, rec: Omit<ClientRecord, "usedAt">): MemoryData {
  const key = rec.client.trim().toLowerCase();
  if (key.length < 2) return mem;
  const prev = mem.clients.find((r) => r.client.trim().toLowerCase() === key);
  const merged: ClientRecord = { ...(prev ?? {}), ...Object.fromEntries(Object.entries(rec).filter(([, v]) => v && String(v).trim())), client: rec.client.trim(), usedAt: Date.now() } as ClientRecord;
  return { ...mem, clients: [merged, ...mem.clients.filter((r) => r.client.trim().toLowerCase() !== key)].slice(0, MAX_CLIENTS) };
}

export function forget(mem: MemoryData, kind: string, value: string): MemoryData {
  const lc = value.toLowerCase();
  return {
    ...mem,
    kinds: { ...mem.kinds, [kind]: (mem.kinds[kind] ?? []).filter((x) => x.toLowerCase() !== lc) },
    clients: kind === "client" ? mem.clients.filter((r) => r.client.toLowerCase() !== lc) : mem.clients,
  };
}

/** Sets a value on a React-controlled input so React's onChange sees it. */
export function setFieldValue(el: Editable, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
