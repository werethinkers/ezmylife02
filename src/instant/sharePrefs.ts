import type { Content, Product } from "./types";
import { fill } from "./util";
import { resolveImg } from "./parts";

/** What the owner chose to show when their page link is shared (stored on the page as share_prefs). */
export interface SharePrefs {
  /** card: a designed picture drawn from the page · photo: one of the page's own photos · upload: a picture the owner added */
  image: "card" | "photo" | "upload";
  photo?: string;
  upload?: string;
  title?: string;
  description?: string;
  /** The words sent with the link. Left out means the suggested message. */
  message?: string;
  /** Goes up by one on every save, so WhatsApp treats the updated link as new and fetches the new preview. */
  rev?: number;
}

export const TITLE_MAX = 70;
export const DESC_MAX = 160;

export function parsePrefs(raw: unknown): SharePrefs {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const s = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);
  return {
    image: r.image === "photo" || r.image === "upload" ? r.image : "card",
    photo: s(r.photo, 2000), upload: s(r.upload, 2000),
    title: s(r.title, TITLE_MAX), description: s(r.description, DESC_MAX), message: s(r.message, 400),
    rev: typeof r.rev === "number" ? r.rev : 0,
  };
}

/** The page's own photos the owner can pick from, without repeats. */
export function pagePhotos(c: Content): string[] {
  const list: unknown[] = [
    c.cover, c.photo,
    ...(Array.isArray(c.gallery) ? c.gallery.map((g: { photo?: string }) => g?.photo) : []),
    ...(Array.isArray(c.memories) ? c.memories.map((g: { photo?: string }) => g?.photo) : []),
    ...(Array.isArray(c.projects) ? c.projects.map((g: { photo?: string }) => g?.photo) : []),
    ...(Array.isArray(c.items) ? c.items.map((g: { photo?: string }) => g?.photo) : []),
  ];
  const out: string[] = [];
  for (const x of list) {
    if (typeof x !== "string" || !resolveImg(x) || x.startsWith("sample:") || out.includes(x)) continue;
    out.push(x);
    if (out.length >= 8) break;
  }
  return out;
}

/** The message that goes with the link when the owner hasn't written their own (without the link). */
export function suggestedMessage(product: Product, c: Content): string {
  return fill(product.share, { ...c, link: "" }).trim();
}

/** The full text sent on WhatsApp: the message, then the link. */
export function composeMessage(product: Product, c: Content, prefs: SharePrefs, link: string): string {
  if (prefs.message === undefined) return fill(product.share, { ...c, link });
  return [prefs.message.trim(), link].filter(Boolean).join("\n");
}

/** A share link that WhatsApp reads fresh after the owner changes the preview. */
export const withRev = (url: string, rev?: number) => (rev && rev > 0 ? `${url}${url.includes("?") ? "&" : "?"}v=${rev}` : url);
