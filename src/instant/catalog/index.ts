import type { CategoryId, Family, Product, Theme } from "../types";
import { CELEBRATIONS } from "./celebrations";
import { FESTIVALS } from "./festivals";
import { EVENTS } from "./events";
import { BUSINESS } from "./business";
import { MENUS } from "./menus";
import { PROFILES } from "./profiles";
import { STORES } from "./stores";
import { IDEA_SITES } from "./ideas";

export const CATEGORIES: { id: CategoryId; name: string; blurb: string; engine: "personal" | "business" }[] = [
  { id: "celebrations", name: "Celebrations", blurb: "Birthdays, anniversaries, thank-yous and more", engine: "personal" },
  { id: "festivals", name: "Festivals", blurb: "Greetings for every Indian festival", engine: "personal" },
  { id: "events", name: "Invitations", blurb: "Weddings, parties, pujas and events with RSVPs", engine: "personal" },
  { id: "business", name: "Business websites", blurb: "Shops, schools, hotels, gyms, salons, clinics and local services", engine: "business" },
  { id: "menus", name: "Menus & catalogues", blurb: "QR menus and catalogues with WhatsApp ordering", engine: "business" },
  { id: "profiles", name: "Personal branding", blurb: "Visiting cards, resumes, portfolios and bio links", engine: "business" },
];

// The Signature version: one best layout per family, shown first so new pages start on it.
// It borrows the colours and fonts of the design's own first version. The other versions keep their
// ids and order, so pages already published look exactly as before.
export const SIGNATURE_ID = "signature";
const SIGNATURE_FAMILIES = new Set<Family>(["business"]);
const withSignature = (p: Product): Product =>
  SIGNATURE_FAMILIES.has(p.family) && p.themes.length
    ? { ...p, themes: [{ ...p.themes[0], id: SIGNATURE_ID, name: "Signature", s: "prime" } as Theme, ...p.themes] }
    : p;

/** The version a stored page falls back to when its saved version is missing: never the new Signature one. */
export const fallbackTheme = (p: Product): Theme => p.themes.find((t) => t.id !== SIGNATURE_ID) ?? p.themes[0];

export const CATALOG: Product[] = [...CELEBRATIONS, ...FESTIVALS, ...EVENTS, ...BUSINESS, ...STORES, ...IDEA_SITES, ...MENUS, ...PROFILES].map(withSignature);

const BY_ID = new Map(CATALOG.map((p) => [p.id, p]));
export const getProduct = (id?: string | null) => (id ? BY_ID.get(id) : undefined);
