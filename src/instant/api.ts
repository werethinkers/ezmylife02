import { supabase } from "@/integrations/supabase/client";
import type { Content } from "./types";

// The ip_* tables are newer than the generated Supabase types, so they are accessed untyped here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface PageRow {
  id: string; owner_id: string; product_id: string; variant_id: string; title: string; slug: string | null;
  status: "draft" | "pending_payment" | "published" | "unpublished" | "removed";
  content: Content; published_content: Content | null; views: number; published_at: string | null; expires_at: string | null;
  created_at: string; updated_at: string; og_image?: string | null; share_url?: string | null; share_prefs?: unknown;
}
export interface ProductRow { id: string; family: string; category: string; name: string; price_inr: number; price_credits?: number | null; hosting_days: number; is_active: boolean; is_featured: boolean; sort: number }
export interface LeadRow { id: string; page_id: string; kind: "lead" | "rsvp" | "order"; name: string; phone: string; message: string | null; context: Record<string, unknown>; status: "new" | "contacted" | "converted" | "closed"; created_at: string }
export interface PublicPage { slug: string; product_id: string; variant_id: string; content: Content; published_at: string; og_image?: string | null; share_url?: string | null }

export async function fetchProductRows(): Promise<ProductRow[]> {
  const { data, error } = await db.from("ip_products").select("*").order("sort");
  if (error) throw error;
  return data ?? [];
}
export async function updateProductRow(id: string, patch: Partial<ProductRow>) {
  const { error } = await db.from("ip_products").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function getPublicPage(slug: string): Promise<PublicPage | null> {
  const { data, error } = await db.rpc("ip_get_public_page", { _slug: slug });
  if (error) throw error;
  return data ?? null;
}
export function recordHit(slug: string) {
  try {
    const k = "ip-hit-" + slug;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
  } catch { /* storage blocked: count anyway */ }
  db.rpc("ip_page_hit", { _slug: slug }).then(() => undefined, () => undefined);
}
export async function submitLead(slug: string, kind: "lead" | "rsvp" | "order", name: string, phone: string, message: string, context: Record<string, unknown>) {
  const { data, error } = await db.rpc("ip_submit_lead", { _slug: slug, _kind: kind, _name: name, _phone: phone, _message: message, _context: context });
  if (error) throw error;
  return data as { ok: boolean; reason?: string };
}

export async function myPages(): Promise<PageRow[]> {
  const { data, error } = await db.from("ip_pages").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function getMyPage(id: string): Promise<PageRow | null> {
  const { data, error } = await db.from("ip_pages").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}
export async function createPage(ownerId: string, productId: string, variantId: string, title: string, content: Content): Promise<PageRow> {
  const { data, error } = await db.from("ip_pages").insert({ owner_id: ownerId, product_id: productId, variant_id: variantId, title, content }).select().single();
  if (error) throw error;
  return data;
}
export async function savePage(id: string, variantId: string, title: string, content: Content) {
  const { error } = await db.from("ip_pages").update({ variant_id: variantId, title, content }).eq("id", id);
  if (error) throw error;
}
export async function deleteDraft(id: string) {
  const { error } = await db.from("ip_pages").delete().eq("id", id);
  if (error) throw error;
}
export async function republish(id: string) {
  const { data, error } = await db.rpc("ip_republish", { _page_id: id });
  if (error) throw error;
  return data as { ok: boolean; slug?: string; reason?: string };
}
export async function unpublish(id: string) {
  const { data, error } = await db.rpc("ip_unpublish", { _page_id: id });
  if (error) throw error;
  return data as { ok: boolean };
}
export async function leadsFor(pageId: string): Promise<LeadRow[]> {
  const { data, error } = await db.from("ip_leads").select("*").eq("page_id", pageId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function leadCounts(): Promise<Record<string, number>> {
  const { data, error } = await db.from("ip_leads").select("page_id,status");
  if (error) throw error;
  const out: Record<string, number> = {};
  (data ?? []).forEach((r: { page_id: string; status: string }) => { if (r.status === "new") out[r.page_id] = (out[r.page_id] ?? 0) + 1; });
  return out;
}
export async function setLeadStatus(id: string, status: LeadRow["status"]) {
  const { error } = await db.from("ip_leads").update({ status }).eq("id", id);
  if (error) throw error;
}

async function token() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
/** An error from the checkout function, carrying the server's own reason and HTTP status. */
export class CheckoutError extends Error {
  status?: number;
  constructor(message: string, status?: number) { super(message); this.name = "CheckoutError"; this.status = status; }
}

/**
 * When an edge function answers with a non-2xx status, supabase-js hands back a generic
 * "Edge Function returned a non-2xx status code" and leaves `data` empty; the function's own
 * `{ error: "..." }` body is only reachable through `error.context`. Read it so people (and we)
 * see the real reason.
 */
async function serverReason(error: unknown): Promise<{ message: string; status?: number }> {
  const ctx = (error as { context?: unknown } | null)?.context;
  if (ctx && typeof (ctx as Response).clone === "function") {
    const res = ctx as Response;
    try {
      const body = await res.clone().json();
      if (body && typeof body.error === "string" && body.error) return { message: body.error, status: res.status };
    } catch { /* not JSON: fall through to the text */ }
    try {
      const text = (await res.clone().text()).trim();
      if (text) return { message: text.slice(0, 200), status: res.status };
    } catch { /* ignore */ }
    return { message: `The payment service answered with an error (${res.status}).`, status: res.status };
  }
  return { message: (error as { message?: string } | null)?.message || "The payment service could not be reached." };
}

/** "Send all" from the sender's own WhatsApp: charged by a database function (ip_bulk_send_queue), no server function needed. */
export async function startQueueSend(pageId: string, lang: string, count: number): Promise<{ send_id: string; charged: number; people: number }> {
  const { data, error } = await db.rpc("ip_bulk_send_queue", { _page_id: pageId, _lang: lang, _count: count, _consent: true });
  if (error) throw new CheckoutError(error.message);
  if (!data?.ok) {
    if (data?.reason === "insufficient") throw new CheckoutError(`This needs ${data.credits_required} credits. You have ${data.balance}.`, 402);
    const why: Record<string, string> = { signin: "Sign in first.", not_found: "Page not found.", not_published: "Publish the page first.", bad_count: "That list is too long or empty." };
    throw new CheckoutError(why[data?.reason] ?? `Couldn't start (${data?.reason}).`);
  }
  return data;
}

/** "Send all on WhatsApp" automatic mode (quote, start, status) - see supabase/functions/ip-bulk-send. */
export async function bulkSend(body: Record<string, unknown>) {
  const t = await token();
  if (!t) throw new CheckoutError("Sign in first.", 401);
  const { data, error } = await supabase.functions.invoke("ip-bulk-send", { body, headers: { Authorization: `Bearer ${t}` } });
  if (error) {
    const r = await serverReason(error);
    throw new CheckoutError(/^unknown action/i.test(r.message) ? "Sending is being updated. Please try again in a few minutes." : r.message, r.status);
  }
  if (data?.error) throw new CheckoutError(String(data.error));
  return data;
}

export async function checkout(body: Record<string, unknown>) {
  const t = await token();
  if (!t) throw new Error("Sign in to publish.");
  const { data, error } = await supabase.functions.invoke("ip-checkout", { body, headers: { Authorization: `Bearer ${t}` } });
  if (error) {
    const r = await serverReason(error);
    // An older deployed copy of the function does not know a newer action.
    const message = /^unknown action/i.test(r.message) ? "The payment service is being updated. Please try again in a few minutes." : r.message;
    console.warn("ip-checkout", body.action, r.status, r.message);
    throw new CheckoutError(message, r.status);
  }
  if (data?.error) throw new CheckoutError(String(data.error));
  return data;
}

/**
 * Uploads a data-URL image to the signed-in user's folder in page-media and returns its public URL.
 * The storage rule only allows a folder named after auth.uid(), so an admin editing someone else's
 * page uploads into their own folder (the bucket is public-read, so the picture still shows for everyone).
 */
export async function uploadDataUrl(_ownerId: string, pageId: string, dataUrl: string): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Sign in to save.");
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${uid}/${pageId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("page-media").upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return supabase.storage.from("page-media").getPublicUrl(path).data.publicUrl;
}

/** Walks content and replaces every data: image with an uploaded URL. */
export async function uploadContentImages(ownerId: string, pageId: string, content: Content): Promise<Content> {
  const walk = async (v: unknown): Promise<unknown> => {
    if (typeof v === "string" && v.startsWith("data:image/")) return uploadDataUrl(ownerId, pageId, v);
    if (Array.isArray(v)) return Promise.all(v.map(walk));
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v)) out[k] = await walk(x);
      return out;
    }
    return v;
  };
  return (await walk(content)) as Content;
}

/** Saves what the owner chose to show in the link preview. Older databases without the column ignore it. */
export async function saveSharePrefs(id: string, prefs: unknown): Promise<boolean> {
  const { error } = await db.from("ip_pages").update({ share_prefs: prefs }).eq("id", id);
  if (error) { console.warn("share prefs", error.message); return false; }
  return true;
}

export async function setOgImage(id: string, url: string) {
  const { error } = await db.from("ip_pages").update({ og_image: url }).eq("id", id);
  if (error) throw error;
}

/**
 * Publishes a page the ₹999 kit already paid for. Returns null when the page is
 * not covered, so the caller falls through to the normal paid checkout.
 */
export async function publishPrepaid(pageId: string): Promise<{ ok: true; slug: string } | null> {
  const { data, error } = await (supabase as unknown as {
    rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: { ok?: boolean; slug?: string } | null; error: { message: string } | null }>;
  }).rpc("ip_publish_prepaid", { _page_id: pageId });
  if (error || !data?.ok) return null;
  return { ok: true, slug: data.slug ?? "" };
}

// ---------- Diwali: shop co-branding (supabase/migrations/20261028120000_diwali_indore.sql) ----------

export interface ShopBrand { slug: string; name: string; logo_url: string | null; coupon_text: string | null; coupon_code: string | null; city: string | null }

/** The public face of a shop for its co-branded cards. Null when the shop is unknown or switched off. */
export async function getShop(slug: string): Promise<ShopBrand | null> {
  const { data, error } = await db.rpc("ip_get_shop", { _slug: slug });
  return error ? null : (data as ShopBrand | null) ?? null;
}

const SHOP_KEY = "ez-shop";
/** Remembers the shop whose QR brought this person here (first shop wins). */
export function rememberShop(slug: string) {
  try { if (!localStorage.getItem(SHOP_KEY)) localStorage.setItem(SHOP_KEY, slug); } catch { /* storage blocked */ }
}
/** Links the signed-in person to the shop that brought them, once. Errors are ignored. */
export function tagShopOnce() {
  try {
    const slug = localStorage.getItem(SHOP_KEY);
    if (!slug || localStorage.getItem(SHOP_KEY + "-tagged")) return;
    db.rpc("ip_tag_shop", { _slug: slug }).then(({ error }: { error: unknown }) => { if (!error) localStorage.setItem(SHOP_KEY + "-tagged", "1"); }, () => undefined);
  } catch { /* storage blocked */ }
}

export interface ShopRow extends ShopBrand { whatsapp: string | null; is_active: boolean; created_at: string }
export interface ShopStat { slug: string; users: number; cards: number }

export async function listShops(): Promise<ShopRow[]> {
  const { data, error } = await db.from("ip_shops").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function saveShop(row: Partial<ShopRow> & { slug: string; name: string }) {
  const { error } = await db.from("ip_shops").upsert(row, { onConflict: "slug" });
  if (error) throw error;
}
export async function shopStats(): Promise<ShopStat[]> {
  const { data, error } = await db.rpc("ip_shop_stats");
  if (error) throw error;
  return (data ?? []).map((r: ShopStat) => ({ ...r, users: Number(r.users), cards: Number(r.cards) }));
}
