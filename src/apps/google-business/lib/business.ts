// Data layer — no database yet.
//
// Everything is kept in this browser's localStorage. All reads/writes go
// through the functions in this file, so plugging in a database later means
// replacing this file only; the screens stay the same.
//
// The customer review link carries the public business + location details
// inside the URL (`d` param) so it opens on any phone without a server.

export const APP_NAME = "Google Business Kit";

export type Product = { name: string; type: string };

export type Location = {
  id: string;
  code: string;
  name: string;
  city: string;
  area: string;
  address: string;
  managerName: string;
  managerPhone: string;
  staffName: string;
  staffPhone: string;
  /** Google "Ask for reviews" link, e.g. https://g.page/r/XXXX/review */
  reviewLink: string;
  /** Google Business Profile location ID, for posting via API later */
  gbpLocationId: string;
  status: "active" | "inactive";
};

export type Business = {
  id: string;
  name: string;
  /** Preset industry id, or "custom" when the owner typed their own */
  industry: string;
  customIndustry: string;
  phone: string;
  products: Product[];
  highlights: string[];
  locations: Location[];
  createdAt: string;
  updatedAt: string;
};

export const STATUSES = [
  "New",
  "Pending approval",
  "Needs edit",
  "Approved",
  "Posted on Google",
  "Rejected",
  "Missing consent",
  "Internal only",
] as const;
export type Status = (typeof STATUSES)[number];

/** Statuses that still need an owner decision. */
export const isPending = (s: { status: Status }) => s.status === "New" || s.status === "Pending approval" || s.status === "Needs edit";

export type Submission = {
  id: string;
  businessId: string;
  locationId: string;
  customerName: string;
  customerPhone: string;
  rating: number;
  products: string[];
  liked: string[];
  feedback: string;
  reviewText: string;
  consentMarketing: boolean;
  consentGenuine: boolean;
  reviewCopied: boolean;
  reviewOpened: boolean;
  status: Status;
  caption: string;
  googlePostId: string;
  postedAt: string;
  createdAt: string;
  updatedAt: string;
  log: { at: string; action: string; by: string }[];
  /** Code from a WhatsApp feedback message, used to avoid duplicates */
  ref?: string;
  /** True for demo rows created with "Load sample data" */
  sample?: boolean;
};

export type RequestLog = { id: string; businessId: string; locationId: string; customerName: string; customerPhone: string; kind: string; at: string };

const BIZ_KEY = "ezyl.gbk.businesses.v1";
const SUB_KEY = "ezyl.gbk.submissions.v1";
const REQ_KEY = "ezyl.gbk.requests.v1";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function write<T>(key: string, list: T[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* storage blocked or full */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("listingkit:change"));
}

export function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().slice(0, 8);
  return Math.random().toString(36).slice(2, 10);
}

export function emptyLocation(partial: Partial<Location> = {}): Location {
  return {
    id: newId(),
    code: "",
    name: "",
    city: "",
    area: "",
    address: "",
    managerName: "",
    managerPhone: "",
    staffName: "",
    staffPhone: "",
    reviewLink: "",
    gbpLocationId: "",
    status: "active",
    ...partial,
  };
}

// Older saves had city/area/reviewLink on the business itself.
function migrate(raw: Business & { city?: string; area?: string; reviewLink?: string }): Business {
  const locations =
    raw.locations && raw.locations.length
      ? raw.locations
      : [emptyLocation({ code: "LOC-001", name: raw.area || raw.city || "Main", city: raw.city ?? "", area: raw.area ?? "", reviewLink: raw.reviewLink ?? "" })];
  return { ...raw, customIndustry: raw.customIndustry ?? "", locations };
}

// ---------------- Businesses ----------------

export function listBusinesses(): Business[] {
  return read<Business>(BIZ_KEY).map(migrate).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getBusiness(id: string): Business | undefined {
  const b = read<Business>(BIZ_KEY).find((x) => x.id === id);
  return b ? migrate(b) : undefined;
}

export function saveBusiness(input: Omit<Business, "id" | "createdAt" | "updatedAt"> & { id?: string }): Business {
  const list = read<Business>(BIZ_KEY);
  const now = new Date().toISOString();
  const existing = input.id ? list.find((b) => b.id === input.id) : undefined;
  const biz: Business = {
    ...input,
    id: existing?.id ?? newId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    products: cleanProducts(input.products),
    highlights: input.highlights.map((h) => h.trim()).filter(Boolean),
    locations: input.locations.map((l, i) => ({
      ...l,
      code: l.code.trim() || `LOC-${String(i + 1).padStart(3, "0")}`,
      name: l.name.trim() || l.area.trim() || l.city.trim() || `Location ${i + 1}`,
      reviewLink: normaliseReviewLink(l.reviewLink),
    })),
  };
  write(BIZ_KEY, [biz, ...list.filter((b) => b.id !== biz.id)]);
  return biz;
}

export function deleteBusiness(id: string) {
  write(BIZ_KEY, read<Business>(BIZ_KEY).filter((b) => b.id !== id));
  write(SUB_KEY, read<Submission>(SUB_KEY).filter((s) => s.businessId !== id));
  write(REQ_KEY, read<RequestLog>(REQ_KEY).filter((r) => r.businessId !== id));
}

// ---------------- Submissions ----------------

export function listSubmissions(businessId: string): Submission[] {
  return read<Submission>(SUB_KEY)
    .filter((s) => s.businessId === businessId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getSubmission(id: string): Submission | undefined {
  return read<Submission>(SUB_KEY).find((s) => s.id === id);
}

export function createSubmission(
  input: Omit<Submission, "id" | "status" | "caption" | "googlePostId" | "postedAt" | "createdAt" | "updatedAt" | "log">,
): Submission {
  const now = new Date().toISOString();
  const sub: Submission = {
    ...input,
    id: newId(),
    status: input.consentMarketing ? "Pending approval" : "Missing consent",
    caption: "",
    googlePostId: "",
    postedAt: "",
    createdAt: now,
    updatedAt: now,
    log: [{ at: now, action: "Feedback submitted", by: "Customer" }],
  };
  write(SUB_KEY, [sub, ...read<Submission>(SUB_KEY)]);
  return sub;
}

export function updateSubmission(id: string, patch: Partial<Submission>, action?: string, by = "Owner"): Submission | undefined {
  const list = read<Submission>(SUB_KEY);
  const now = new Date().toISOString();
  let out: Submission | undefined;
  const next = list.map((s) => {
    if (s.id !== id) return s;
    out = { ...s, ...patch, updatedAt: now, log: action ? [...s.log, { at: now, action, by }] : s.log };
    return out;
  });
  write(SUB_KEY, next);
  return out;
}

/** Writes a fully-formed submission (used for sample data). */
export function insertSubmissions(subs: Submission[]) {
  write(SUB_KEY, [...subs, ...read<Submission>(SUB_KEY)]);
}

export function clearSampleSubmissions(businessId: string) {
  write(SUB_KEY, read<Submission>(SUB_KEY).filter((s) => !(s.businessId === businessId && s.sample)));
}

export function deleteSubmission(id: string) {
  write(SUB_KEY, read<Submission>(SUB_KEY).filter((s) => s.id !== id));
}

// ---------------- Review requests sent ----------------

export function logRequest(r: Omit<RequestLog, "id" | "at">) {
  write(REQ_KEY, [{ ...r, id: newId(), at: new Date().toISOString() }, ...read<RequestLog>(REQ_KEY)]);
}
export function listRequests(businessId: string): RequestLog[] {
  return read<RequestLog>(REQ_KEY).filter((r) => r.businessId === businessId);
}

// ---------------- Products ----------------

export function cleanProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const p of products) {
    const name = p.name.trim();
    const type = p.type.trim();
    if (!name && !type) continue;
    const key = `${name}|${type}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name: name || type, type });
  }
  return out;
}

/** Parse pasted lines like "Chocolate cake, Cakes" or "Tax filing - Services". */
export function parseProductLines(text: string, fallbackType = ""): Product[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, type] = line.split(/\s*[,\t|]\s*|\s+-\s+/);
      return { name: name ?? "", type: (type ?? fallbackType).trim() };
    });
}

// ---------------- Public share payload ----------------

export type PublicBusiness = {
  b: string; // business id
  l: string; // location id
  n: string; // business name
  i: string; // industry id
  x: string; // custom industry label
  ln: string; // location name
  c: string; // city
  a: string; // area
  r: string; // review link
  p: [string, string][]; // products [name, type]
  h: string[]; // highlights
  ph: string; // WhatsApp number customers can send feedback to
};

export function toPublic(b: Business, loc: Location): PublicBusiness {
  return {
    b: b.id,
    l: loc.id,
    n: b.name,
    i: b.industry,
    x: b.customIndustry,
    ln: loc.name,
    c: loc.city,
    a: loc.area,
    r: loc.reviewLink,
    p: b.products.slice(0, 24).map((p) => [p.name, p.type]),
    h: b.highlights.slice(0, 8),
    ph: (loc.managerPhone || b.phone).replace(/\D/g, ""),
  };
}

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((byte) => (bin += String.fromCharCode(byte)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(data: string) {
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
}

export function decodePublic(data: string | undefined): PublicBusiness | null {
  if (!data) return null;
  try {
    const p = JSON.parse(fromBase64Url(data)) as Partial<PublicBusiness>;
    if (!p || typeof p.n !== "string") return null;
    return {
      b: p.b ?? "",
      l: p.l ?? "",
      n: p.n,
      i: p.i ?? "other",
      x: p.x ?? "",
      ln: p.ln ?? "",
      c: p.c ?? "",
      a: p.a ?? "",
      r: p.r ?? "",
      p: Array.isArray(p.p) ? p.p : [],
      h: Array.isArray(p.h) ? p.h : [],
      ph: p.ph ?? "",
    };
  } catch {
    return null;
  }
}

export function reviewPageUrl(b: Business, loc: Location): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/rv?d=${toBase64Url(JSON.stringify(toPublic(b, loc)))}`;
}

/** Accepts a Place ID or a full link and returns a usable Google review URL. */
export function normaliseReviewLink(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[A-Za-z0-9_-]{20,}$/.test(v)) return `https://search.google.com/local/writereview?placeid=${v}`;
  return `https://${v}`;
}

export function industryLabel(b: Pick<Business, "industry" | "customIndustry">, presetLabel: string) {
  return b.industry === "custom" ? b.customIndustry : presetLabel;
}

// ---------------- Feedback over WhatsApp (no database needed) ----------------
// The customer's phone builds a readable WhatsApp message that ends with a
// "Ref: LK1:..." code. The owner pastes received messages into the dashboard
// and the code is turned back into a submission.

export type FeedbackPacket = {
  b: string;
  l: string;
  nm: string;
  r: number;
  pr: string[];
  lk: string[];
  fb: string;
  rt: string;
  cm: boolean;
  cg: boolean;
  op: boolean;
  t: string;
};

export function feedbackMessage(biz: PublicBusiness, f: FeedbackPacket): string {
  const lines = [
    `Feedback for ${biz.n}${biz.ln ? ` (${biz.ln})` : ""}`,
    f.nm ? `Name: ${f.nm}` : "",
    `Rating: ${"★".repeat(f.r)} (${f.r}/5)`,
    f.pr.length ? `Bought: ${f.pr.join(", ")}` : "",
    f.lk.length ? `Liked: ${f.lk.join(", ")}` : "",
    f.fb ? `Comment: ${f.fb}` : "",
    `OK to use publicly: ${f.cm ? "Yes" : "No"}`,
    "",
    `Ref: LK1:${toBase64Url(JSON.stringify(f))}`,
  ];
  return lines.filter((x, i) => x !== "" || i === lines.length - 2).join("\n");
}

/** Reads every "LK1:" code in pasted text. Returns how many were added. */
export function importFeedback(businessId: string, text: string, phoneHint = ""): { added: number; skipped: number } {
  const existing = read<Submission>(SUB_KEY);
  const seen = new Set(existing.map((s) => s.ref).filter(Boolean));
  let added = 0;
  let skipped = 0;
  const rows: Submission[] = [];
  for (const m of text.matchAll(/LK1:([A-Za-z0-9_-]+)/g)) {
    try {
      const f = JSON.parse(fromBase64Url(m[1])) as FeedbackPacket;
      if (f.b !== businessId || seen.has(m[1])) {
        skipped++;
        continue;
      }
      seen.add(m[1]);
      const at = f.t || new Date().toISOString();
      rows.push({
        id: newId(),
        ref: m[1],
        businessId,
        locationId: f.l,
        customerName: f.nm ?? "",
        customerPhone: phoneHint,
        rating: f.r,
        products: f.pr ?? [],
        liked: f.lk ?? [],
        feedback: f.fb ?? "",
        reviewText: f.rt ?? "",
        consentMarketing: !!f.cm,
        consentGenuine: !!f.cg,
        reviewCopied: !!f.rt,
        reviewOpened: !!f.op,
        status: f.cm ? "Pending approval" : "Missing consent",
        caption: "",
        googlePostId: "",
        postedAt: "",
        createdAt: at,
        updatedAt: at,
        log: [{ at, action: "Feedback received on WhatsApp", by: "Customer" }],
      });
      added++;
    } catch {
      skipped++;
    }
  }
  if (rows.length) write(SUB_KEY, [...rows, ...existing]);
  return { added, skipped };
}

/** Where this app lives inside EzYourLife. */
export const BASE = "/google-business";
export const gb = (path: string) => (path === "/" ? BASE : `${BASE}${path}`);
export const TOOL_ID = "google-business-kit";
