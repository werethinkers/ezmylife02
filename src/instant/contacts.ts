// Getting people into "Send all": straight from the phone's contact book, or from a contacts file.
//
// - Phone contact book: the browser's Contact Picker (Chrome on Android). The person chooses the contacts
//   (there is a select-all); the site never gets the whole book without that choice.
// - Contacts file: .vcf (iPhone: Contacts > select > Share; Android: Contacts > Export) or .csv
//   (Google Contacts > Export). Read on this device only; nothing is uploaded.
import type { Person } from "./festLang";
import { SEND_ALL_MAX } from "@/lib/creditRate";

interface PickedContact { name?: string[]; tel?: string[] }
interface ContactsManager { select(props: string[], opts?: { multiple?: boolean }): Promise<PickedContact[]>; getProperties?(): Promise<string[]> }

/** iPhone and iPad (iPadOS reports itself as a Mac with touch). Safari gives websites no contact-book access there. */
export const isIOS = () =>
  typeof navigator !== "undefined" && (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export const canPickContacts = () =>
  typeof navigator !== "undefined" && "contacts" in navigator && typeof window !== "undefined" && "ContactsManager" in window;

const cleanName = (s: string) => s.replace(/[<>{}\\]/g, "").replace(/\s+/g, " ").trim().slice(0, 30);

/** The best number to WhatsApp: the first Indian mobile (callers list mobile-typed numbers first), else the first number. Digits only. */
export function bestPhone(tels: string[]): string {
  const digits = tels.map((t) => t.replace(/[^\d+]/g, "").replace(/^\+/, "").replace(/^00/, "")).filter(Boolean);
  const mobile = digits.find((d) => /^(91)?[6-9]\d{9}$/.test(d) || /^0[6-9]\d{9}$/.test(d));
  const d = mobile ?? digits[0] ?? "";
  return d.replace(/^0(?=[6-9]\d{9}$)/, "");
}

/** One entry per number (and per name when there is no number), in the order given, capped. */
export function dedupe(people: Person[]): Person[] {
  const seen = new Set<string>();
  const out: Person[] = [];
  for (const p of people) {
    const name = cleanName(p.name);
    if (!name) continue;
    const key = p.phone ? p.phone.replace(/\D/g, "").slice(-10) : "n:" + name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, phone: p.phone });
    if (out.length >= SEND_ALL_MAX) break;
  }
  return out;
}

export async function pickFromPhone(): Promise<Person[]> {
  const mgr = (navigator as unknown as { contacts: ContactsManager }).contacts;
  const picked = await mgr.select(["name", "tel"], { multiple: true });
  return dedupe(picked.map((c) => ({ name: (c.name ?? []).find(Boolean) ?? "", phone: bestPhone(c.tel ?? []) })));
}

/** vCard 2.1 / 3.0 / 4.0: FN (or N), and every TEL. Folded lines are joined first. */
export function parseVcf(text: string): Person[] {
  const lines = text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "").split(/\r?\n/);
  const out: Person[] = [];
  let fn = ""; let n = ""; let tels: string[] = [];
  const decode = (v: string, params: string) => {
    if (/ENCODING=QUOTED-PRINTABLE/i.test(params)) {
      try { return decodeURIComponent(v.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/gi, "%$1")); } catch { return v; }
    }
    return v.replace(/\\,/g, ",").replace(/\\;/g, ";");
  };
  for (const raw of lines) {
    const i = raw.indexOf(":");
    if (i < 0) continue;
    const head = raw.slice(0, i); const value = raw.slice(i + 1);
    const key = head.split(";")[0].replace(/^item\d+\./i, "").toUpperCase();
    if (key === "BEGIN") { fn = ""; n = ""; tels = []; }
    else if (key === "FN") fn = decode(value, head);
    else if (key === "N") n = decode(value, head).split(";").slice(0, 2).reverse().join(" ").trim();
    else if (key === "TEL") { if (/CELL|MOBILE|IPHONE|WHATSAPP/i.test(head)) tels.unshift(value); else tels.push(value); } // mobiles first: a landline like 0731… looks like a mobile
    else if (key === "END") out.push({ name: fn || n, phone: bestPhone(tels) });
  }
  return dedupe(out);
}

/** Splits one CSV line, honouring quotes. */
function csvCells(line: string): string[] {
  const out: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === "," || ch === ";" || ch === "\t") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

/** Google, Outlook and most phone exports: finds the name and phone columns by their headings. */
export function parseCsv(text: string): Person[] {
  const rows = text.split(/\r?\n/).filter((l) => l.trim());
  if (rows.length === 0) return [];
  const head = csvCells(rows[0]).map((h) => h.toLowerCase());
  const col = (...tests: RegExp[]) => head.findIndex((h) => tests.some((t) => t.test(h)));
  const full = col(/^name$/, /^full name$/, /^display name$/, /^contact name$/);
  const first = col(/^first name$/, /^given name$/);
  const middle = col(/^middle name$/);
  const last = col(/^last name$/, /^family name$/, /^surname$/);
  const phones = head.map((h, i) => (/phone|mobile|tel|whatsapp|number/.test(h) && !/type|label/.test(h) ? i : -1)).filter((i) => i >= 0);
  if (full < 0 && first < 0 && phones.length === 0) {
    // No headings: treat each line as "name, phone".
    return dedupe(rows.map((l) => { const c = csvCells(l); return { name: c[0] ?? "", phone: bestPhone(c.slice(1)) }; }));
  }
  return dedupe(rows.slice(1).map((l) => {
    const c = csvCells(l);
    const name = full >= 0 && c[full] ? c[full] : [first, middle, last].filter((i) => i >= 0).map((i) => c[i]).filter(Boolean).join(" ");
    return { name, phone: bestPhone(phones.flatMap((i) => (c[i] ?? "").split(/\s*:::\s*/))) };
  }));
}

export async function readContactsFile(file: File): Promise<Person[]> {
  if (file.size > 15 * 1024 * 1024) throw new Error("That file is too big. Export fewer contacts, or split the file.");
  const text = await file.text();
  return /BEGIN:VCARD/i.test(text) ? parseVcf(text) : parseCsv(text);
}
