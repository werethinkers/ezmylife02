// Server-side page view logger — captures real client IP, geo, device.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  path: string;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  user_agent?: string | null;
  session_id?: string | null;
  user_id?: string | null;
  tool_id?: string | null;
  // For beacon updates of previous view
  update_id?: string | null;
  time_on_page_ms?: number | null;
}

function getIp(req: Request): string | null {
  const h = req.headers;
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("cf-connecting-ip") || h.get("x-real-ip") || null;
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseUA(ua: string): { device_type: string; browser: string; os: string } {
  const u = ua.toLowerCase();
  const device_type = /mobile|android.*mobile|iphone|ipod/.test(u)
    ? "mobile"
    : /ipad|tablet|android(?!.*mobile)/.test(u)
    ? "tablet"
    : "desktop";
  const browser = /edg\//.test(u) ? "Edge"
    : /chrome|crios/.test(u) ? "Chrome"
    : /firefox|fxios/.test(u) ? "Firefox"
    : /safari/.test(u) ? "Safari"
    : /opr\//.test(u) ? "Opera"
    : "Other";
  const os = /windows/.test(u) ? "Windows"
    : /mac os x|macintosh/.test(u) ? "macOS"
    : /android/.test(u) ? "Android"
    : /iphone|ipad|ipod/.test(u) ? "iOS"
    : /linux/.test(u) ? "Linux"
    : "Other";
  return { device_type, browser, os };
}

async function lookupGeo(ip: string): Promise<{ country?: string; city?: string }> {
  try {
    const r = await fetch(`https://ipapi.co/${ip}/json/`, { headers: { "User-Agent": "ezyourlife-tracker" } });
    if (!r.ok) return {};
    const j = await r.json();
    return { country: j.country_name, city: j.city };
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Beacon update path
    if (body.update_id && typeof body.time_on_page_ms === "number") {
      await supabase.from("page_views").update({ time_on_page_ms: body.time_on_page_ms }).eq("id", body.update_id);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!body.path) {
      return new Response(JSON.stringify({ error: "path required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ip = getIp(req);
    const ip_hash = ip ? await sha256(ip + "::ezyourlife") : null;
    const ua = body.user_agent || req.headers.get("user-agent") || "";
    const { device_type, browser, os } = parseUA(ua);
    const geo = ip ? await lookupGeo(ip) : {};

    const { data, error } = await supabase
      .from("page_views")
      .insert({
        path: body.path,
        referrer: body.referrer ?? null,
        utm_source: body.utm_source ?? null,
        utm_medium: body.utm_medium ?? null,
        utm_campaign: body.utm_campaign ?? null,
        country: geo.country ?? null,
        city: geo.city ?? null,
        user_agent: ua.slice(0, 500),
        session_id: body.session_id ?? null,
        user_id: body.user_id ?? null,
        tool_id: body.tool_id ?? null,
        ip_address: ip,
        ip_hash,
        device_type,
        browser,
        os,
      })
      .select("id")
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
