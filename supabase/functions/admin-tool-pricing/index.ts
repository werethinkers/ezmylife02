// Admin endpoint: list/upsert tool_pricing, set credits directly, grant free credits.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", ud.user.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Error("admin only");

    const body = await req.json();
    const { action } = body;

    if (action === "list") {
      const { data } = await supabase.from("tool_pricing").select("*").order("tool_id");
      return json({ items: data ?? [] });
    }
    if (action === "upsert") {
      const { tool_id, cost_inr } = body;
      if (!tool_id || cost_inr == null) throw new Error("tool_id and cost_inr required");
      const { data, error } = await supabase
        .from("tool_pricing")
        .upsert({ tool_id, cost_inr: Number(cost_inr), updated_by: ud.user.id }, { onConflict: "tool_id" })
        .select().single();
      if (error) throw new Error(error.message);
      return json({ ok: true, item: data });
    }
    if (action === "set_credits") {
      const { tool_id, credit_cost } = body;
      if (!tool_id || credit_cost == null) throw new Error("tool_id and credit_cost required");
      const cc = Math.max(0, Math.floor(Number(credit_cost)));
      const { data, error } = await supabase
        .from("tool_pricing")
        .upsert({ tool_id, credit_cost: cc, cost_inr: cc * 0.30, updated_by: ud.user.id }, { onConflict: "tool_id" })
        .select().single();
      if (error) throw new Error(error.message);
      return json({ ok: true, item: data });
    }
    if (action === "grant_credits") {
      const { user_id, credits, note } = body;
      if (!user_id || !credits) throw new Error("user_id and credits required");
      // call as the admin user so RPC's auth.uid() admin check passes
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
      );
      const { data, error } = await userClient.rpc("admin_adjust_credits", {
        _target: user_id, _delta: Number(credits), _bucket: "free", _note: note || "admin grant",
      });
      if (error) throw new Error(error.message);
      return json({ ok: true, result: data });
    }
    throw new Error("Unknown action");
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status });
}
