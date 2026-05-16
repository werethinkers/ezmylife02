import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://ezyourlife.com/";
const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console/v1/urlInspection/index:inspect";

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GSC_API_KEY = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!GSC_API_KEY) throw new Error("GOOGLE_SEARCH_CONSOLE_API_KEY missing — connect Google Search Console");

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

    const results: Array<{ url: string; ok: boolean; verdict?: string; error?: string }> = [];

    for (const url of urls) {
      try {
        const r = await fetch(GATEWAY, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": GSC_API_KEY,
            "Content-Type": "application/json",
          },
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
