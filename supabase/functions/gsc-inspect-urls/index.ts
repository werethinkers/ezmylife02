import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://ezyourlife.com/";
const INSPECT_URL = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";

// GSC_SERVICE_ACCOUNT_JSON is a Google service-account key; add its client_email as a user on the
// Search Console property for ezyourlife.com.
async function googleAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson) as { client_email: string; private_key: string; token_uri?: string };
  const tokenUri = sa.token_uri ?? "https://oauth2.googleapis.com/token";
  const b64url = (data: Uint8Array | string) =>
    btoa(typeof data === "string" ? data : String.fromCharCode(...data)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(
    JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: tokenUri, iat: now, exp: now + 3600 }),
  )}`;
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)));
  const r = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${b64url(sig)}` }),
  });
  const data = await r.json();
  if (!r.ok || !data.access_token) throw new Error(`Google token request failed: ${data.error_description ?? data.error ?? r.status}`);
  return data.access_token as string;
}

interface InspectionResp {
  inspectionResult?: {
    indexStatusResult?: {
      verdict?: string;
      coverageState?: string;
      robotsTxtState?: string;
      indexingState?: string;
      lastCrawlTime?: string;
      pageFetchState?: string;
      googleCanonical?: string;
      userCanonical?: string;
      referringUrls?: string[];
    };
    inspectionResultLink?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const GSC_SERVICE_ACCOUNT_JSON = Deno.env.get("GSC_SERVICE_ACCOUNT_JSON");
    if (!GSC_SERVICE_ACCOUNT_JSON) throw new Error("GSC_SERVICE_ACCOUNT_JSON missing — add a Google service-account key as a function secret");

    // Auth: caller must be admin
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const urls: string[] = Array.isArray(body?.urls) ? body.urls.slice(0, 50) : [];
    if (!urls.length) return new Response(JSON.stringify({ error: "urls required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const accessToken = await googleAccessToken(GSC_SERVICE_ACCOUNT_JSON);
    const results: Array<{ url: string; ok: boolean; verdict?: string; error?: string }> = [];

    for (const url of urls) {
      try {
        const r = await fetch(INSPECT_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE_URL }),
        });
        const data = (await r.json()) as InspectionResp & { error?: { message?: string } };
        if (!r.ok) {
          results.push({ url, ok: false, error: data?.error?.message || `HTTP ${r.status}` });
          await admin.from("gsc_url_status").upsert({
            url,
            inspection_result: data,
            last_checked_at: new Date().toISOString(),
          }, { onConflict: "url" });
          continue;
        }
        const idx = data.inspectionResult?.indexStatusResult || {};
        await admin.from("gsc_url_status").upsert({
          url,
          coverage_state: idx.coverageState || null,
          indexing_state: idx.indexingState || null,
          page_fetch_state: idx.pageFetchState || null,
          robots_state: idx.robotsTxtState || null,
          last_crawl_time: idx.lastCrawlTime || null,
          last_checked_at: new Date().toISOString(),
          inspection_result: data,
        }, { onConflict: "url" });
        results.push({ url, ok: true, verdict: idx.verdict });
      } catch (e) {
        results.push({ url, ok: false, error: (e as Error).message });
      }
      // throttle ~10/sec
      await new Promise((res) => setTimeout(res, 110));
    }

    return new Response(JSON.stringify({ ok: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
