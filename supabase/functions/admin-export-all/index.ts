import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// All public tables to export
const TABLES = [
  "activity_logs", "bulk_jobs", "coupon_codes", "coupon_redemptions",
  "credit_ledger", "credit_purchases", "credit_wallets", "enterprise_inquiries",
  "gemini_api_keys", "gsc_url_status", "home_sections",
  "meet_nudge_contacts", "meet_nudge_events", "meet_nudge_profiles",
  "notebook_sessions", "page_views", "premium_access", "profiles",
  "promptmaster_sessions", "saved_recommendations", "startup_analyses",
  "tool_favorites", "tool_media", "tool_pricing", "tool_promo_pages",
  "tool_requests", "tool_runs", "tool_section_assignments", "tool_sessions",
  "tools_catalog", "user_creations", "user_roles", "user_secrets",
  "utm_links", "virasat_media",
];

const BUCKETS = ["tool-uploads", "tool-media", "virasat-media", "bulk-inputs", "bulk-outputs"];

async function listAll(supabase: any, bucket: string, prefix = ""): Promise<any[]> {
  const out: any[] = [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000, sortBy: { column: "name", order: "asc" },
  });
  if (error || !data) return out;
  for (const item of data) {
    const full = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null || item.metadata === null) {
      // folder
      const nested = await listAll(supabase, bucket, full);
      out.push(...nested);
    } else {
      out.push({ bucket, path: full, size: item.metadata?.size ?? 0, mime: item.metadata?.mimetype ?? "" });
    }
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const { data: ud } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!ud.user) throw new Error("Auth failed");

    const { data: roleRow } = await supabase.from("user_roles")
      .select("role").eq("user_id", ud.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) throw new Error("Admin only");

    const body = await req.json().catch(() => ({}));
    const mode: "manifest" | "tables" = body.mode ?? "manifest";

    if (mode === "tables") {
      const tables: Record<string, any> = {};
      const errors: Record<string, string> = {};
      for (const t of TABLES) {
        const { data, error } = await supabase.from(t).select("*").limit(50000);
        if (error) errors[t] = error.message;
        else tables[t] = data ?? [];
      }
      return new Response(JSON.stringify({ exported_at: new Date().toISOString(), tables, errors }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // manifest mode: list all storage files with signed URLs
    const files: any[] = [];
    for (const b of BUCKETS) {
      const items = await listAll(supabase, b);
      for (const it of items) {
        const { data: signed } = await supabase.storage.from(b).createSignedUrl(it.path, 60 * 60);
        files.push({ ...it, url: signed?.signedUrl ?? null });
      }
    }
    return new Response(JSON.stringify({ files }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
