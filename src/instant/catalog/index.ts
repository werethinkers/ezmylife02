import type { CategoryId, Product } from "../types";
import { CELEBRATIONS } from "./celebrations";
import { FESTIVALS } from "./festivals";
import { EVENTS } from "./events";
import { BUSINESS } from "./business";
import { MENUS } from "./menus";
import { PROFILES } from "./profiles";

export const CATEGORIES: { id: CategoryId; name: string; blurb: string; engine: "personal" | "business" }[] = [
  { id: "celebrations", name: "Celebrations", blurb: "Birthdays, anniversaries, thank-yous and more", engine: "personal" },
  { id: "festivals", name: "Festivals", blurb: "Greetings for every Indian festival", engine: "personal" },
  { id: "events", name: "Invitations", blurb: "Weddings, parties, pujas and events with RSVPs", engine: "personal" },
  { id: "business", name: "Business websites", blurb: "Gyms, salons, tutors, clinics and local services", engine: "business" },
  { id: "menus", name: "Menus & catalogues", blurb: "QR menus and catalogues with WhatsApp ordering", engine: "business" },
  { id: "profiles", name: "Personal branding", blurb: "Visiting cards, resumes, portfolios and bio links", engine: "business" },
];

export const CATALOG: Product[] = [...CELEBRATIONS, ...FESTIVALS, ...EVENTS, ...BUSINESS, ...MENUS, ...PROFILES];

const BY_ID = new Map(CATALOG.map((p) => [p.id, p]));
export const getProduct = (id?: string | null) => (id ? BY_ID.get(id) : undefined);
