// Resolves a Google Maps link (short share link or full place link) pasted into the
// /google-business/setup "Audit & improve existing profile" tab, and looks the business up on
// Google Places API (New). Free (no credits charged) — see billed({ tool: () => null }, ...) below —
// but still requires a signed-in caller, since every call spends real Places API quota.
import { json } from "../_shared/http.ts";
import { billed } from "../_shared/billing.ts";

const API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";
const TIMEOUT_MS = 8000;

// Keep in sync with the field list in the task spec — the exact fields the Setup form and the
// AI audit payload use, and nothing else, so each call stays a small, predictable charge on Google's side.
const FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "primaryType",
  "primaryTypeDisplayName",
  "types",
  "nationalPhoneNumber",
  "websiteUri",
  "regularOpeningHours",
  "rating",
  "userRatingCount",
  "reviews",
  "editorialSummary",
];
const DETAILS_FIELD_MASK = FIELDS.join(",");
const SEARCH_FIELD_MASK = FIELDS.map((f) => `places.${f}`).join(",");

// maps.app.goo.gl and goo.gl are the older short-link hosts; share.google and g.co/kgs are Google's
// newer "Share" short links (also used for Maps places) — all of them just redirect, same as a goo.gl one.
const SHORT_LINK_HOSTS = new Set(["goo.gl", "maps.app.goo.gl", "share.google", "g.co"]);

function isGoogleMapsUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return host === "google.com" || host.endsWith(".google.com") || SHORT_LINK_HOSTS.has(host);
  } catch {
    return false;
  }
}

/** Follows a short link's redirects to the canonical google.com/maps/... URL. HEAD first (cheaper); GET if that fails. */
async function resolveUrl(raw: string): Promise<string> {
  for (const method of ["HEAD", "GET"] as const) {
    try {
      const res = await fetch(raw, {
        method,
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; EzyourlifeBot/1.0; +https://ezyourlife.com)" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      await res.body?.cancel().catch(() => undefined);
      if (res.url) return res.url;
    } catch {
      // try the next method
    }
  }
  return raw;
}

interface Extracted {
  placeId?: string;
  name?: string;
  lat?: number;
  lng?: number;
}

/** Pulls a Place ID, or a business name + coordinates to text-search with, out of a resolved Maps URL. */
function extractFromUrl(url: string): Extracted {
  try {
    const u = new URL(url);
    const q = u.searchParams.get("q");
    if (q?.startsWith("place_id:")) return { placeId: q.slice("place_id:".length) };

    // Only the modern "ChIJ…" place id is directly usable by Place Details; the legacy hex CID some
    // links carry (!1s0x…:0x…) is not, so it's left for the text-search fallback below.
    const dataMatch = (u.pathname + u.search).match(/!1s(ChIJ[\w-]+)/);
    if (dataMatch) return { placeId: dataMatch[1] };

    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const lat = atMatch ? Number(atMatch[1]) : undefined;
    const lng = atMatch ? Number(atMatch[2]) : undefined;

    const placeMatch = u.pathname.match(/\/maps\/place\/([^/@]+)/);
    const name = placeMatch ? decodeURIComponent(placeMatch[1].replace(/\+/g, " ")) : q && !q.startsWith("place_id:") ? q : undefined;

    return { name, lat, lng };
  } catch {
    return {};
  }
}

async function placeDetails(placeId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": API_KEY, "X-Goog-FieldMask": DETAILS_FIELD_MASK },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`places_details_${res.status}`);
  return res.json();
}

async function textSearch(name: string, lat?: number, lng?: number): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = { textQuery: name };
  if (lat != null && lng != null) body.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 1000 } };
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "X-Goog-Api-Key": API_KEY, "X-Goog-FieldMask": SEARCH_FIELD_MASK, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`places_search_${res.status}`);
  const data = (await res.json()) as { places?: Record<string, unknown>[] };
  const place = data.places?.[0];
  if (!place) throw new Error("place_not_found");
  return place;
}

const readableType = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// deno-lint-ignore no-explicit-any
function shapeResult(p: any) {
  const address: string = typeof p.formattedAddress === "string" ? p.formattedAddress : "";
  // "Shop no., Area, City, State PIN, Country" — best-effort city/area split for the form fields.
  const parts = address.split(",").map((s: string) => s.trim()).filter(Boolean);
  const city = parts.length >= 3 ? parts[parts.length - 3] : parts[0] ?? "";
  const area = parts.length >= 4 ? parts[parts.length - 4] : "";
  const primaryType: string | undefined = p.primaryType;
  return {
    name: p.displayName?.text ?? "",
    address,
    city,
    area,
    phone: p.nationalPhoneNumber ?? "",
    website: p.websiteUri ?? "",
    primaryCategory: p.primaryTypeDisplayName?.text ?? (primaryType ? readableType(primaryType) : ""),
    // deno-lint-ignore no-explicit-any
    secondaryCategories: Array.isArray(p.types) ? (p.types as string[]).filter((t) => t !== primaryType).slice(0, 9).map(readableType) : [],
    rating: typeof p.rating === "number" ? p.rating : null,
    userRatingCount: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
    // deno-lint-ignore no-explicit-any
    reviews: Array.isArray(p.reviews)
      ? (p.reviews as any[]).slice(0, 5).map((r) => ({
          rating: r.rating ?? null,
          text: r.text?.text ?? r.originalText?.text ?? "",
          author: r.authorAttribution?.displayName ?? "",
        }))
      : [],
    editorialSummary: p.editorialSummary?.text ?? "",
    hasOpeningHours: !!p.regularOpeningHours,
  };
}

Deno.serve(
  billed({ tool: () => null }, async (_req, ctx) => {
    if (!API_KEY) {
      return json({ error: "not_configured", message: "Google Maps import isn't connected yet. Use manual entry for now." }, 503);
    }

    const url = typeof ctx.body?.url === "string" ? ctx.body.url.trim() : "";
    if (!url || !isGoogleMapsUrl(url)) {
      return json(
        { error: "invalid_url", message: "That doesn't look like a Google Maps link. Paste a maps.app.goo.gl or google.com/maps link, or switch to manual entry." },
        400,
      );
    }

    try {
      const resolved = await resolveUrl(url);
      const extracted = extractFromUrl(resolved);
      const place = extracted.placeId
        ? await placeDetails(extracted.placeId)
        : extracted.name
          ? await textSearch(extracted.name, extracted.lat, extracted.lng)
          : null;
      if (!place) {
        return json(
          { error: "unrecognised_link", message: "Couldn't find a business in that link. Try copying the link again from Google Maps, or switch to manual entry." },
          400,
        );
      }
      return json({ ok: true, place: shapeResult(place) });
    } catch (e) {
      console.error("fetch-gbp-details failed:", e);
      return json(
        { error: "fetch_failed", message: "Couldn't load that listing — it may be private, unlisted, or the link may have expired. Switch to manual entry and fill in what you can." },
        502,
      );
    }
  }),
);
