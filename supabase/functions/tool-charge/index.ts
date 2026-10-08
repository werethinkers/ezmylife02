// Manages tool run lifecycle: start (quote + balance check) and complete (debit on success).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { ensurePrice } from "../_shared/billing.ts";

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
    const { data: ud, error: ue } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (ue || !ud.user) throw new Error("Auth failed");
    const uid = ud.user.id;

    const body = await req.json();
    const action = body.action as string;

    if (action === "start") {
      const tool_id = String(body.tool_id || "").trim();
      if (!tool_id) throw new Error("tool_id required");
      // Every catalogue app costs at least 1 credit per use: create the minimum price for an
      // app that has none yet (only for real catalogue apps, so ids can't be invented).
      const { data: priced } = await supabase.from("tool_pricing").select("tool_id").eq("tool_id", tool_id).maybeSingle();
      if (!priced) {
        const { data: app } = await supabase.from("tools_catalog").select("id").eq("id", tool_id).maybeSingle();
        if (app) await ensurePrice(tool_id, 1);
      }
      const { data, error } = await supabase.rpc("start_tool_run", { _uid: uid, _tool_id: tool_id });
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    if (action === "complete") {
      const run_id = String(body.run_id || "").trim();
      const success = !!body.success;
      const errorText = body.error ? String(body.error).slice(0, 500) : null;
      if (!run_id) throw new Error("run_id required");
      const { data, error } = await supabase.rpc("complete_tool_run", {
        _uid: uid, _run_id: run_id, _success: success, _error: errorText,
      });
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    throw new Error("Unknown action");
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
