// Fallback for the "From Google Photos" picker: downloads one chosen photo from Google on the person's behalf
// when the browser blocks the direct request (CORS). The token is used for this one request and never stored or logged.
// Only Google's own image hosts are allowed, so this can't be used to fetch arbitrary addresses.
import { corsHeaders, json, preflight } from "../_shared/http.ts";

const MAX_BYTES = 15 * 1024 * 1024;

function allowed(raw: unknown): URL | null {
  if (typeof raw !== "string") return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || u.username || u.password) return null;
    if (host !== "googleusercontent.com" && !host.endsWith(".googleusercontent.com")) return null;
    return u;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body: { url?: unknown; token?: unknown };
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  const url = allowed(body.url);
  const token = typeof body.token === "string" ? body.token : "";
  if (!url || !token) return json({ error: "Bad request" }, 400);

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, redirect: "error" }).catch(() => null);
  if (!res || !res.ok) return json({ error: "Google didn't return the photo" }, 502);
  if (!(res.headers.get("content-type") ?? "").startsWith("image/")) return json({ error: "Not an image" }, 502);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length > MAX_BYTES) return json({ error: "Photo too large" }, 413);

  // octet-stream so the client library hands back a Blob.
  return new Response(bytes, { headers: { ...corsHeaders, "Content-Type": "application/octet-stream" } });
});
