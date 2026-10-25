// Returns wallet snapshot for the authenticated user.
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
    const { data: ud, error: ue } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (ue || !ud.user) throw new Error("Auth failed");

    await supabase.rpc("ensure_wallet", { _uid: ud.user.id });
    const { data: w } = await supabase
      .from("credit_wallets").select("*").eq("user_id", ud.user.id).maybeSingle();

    return new Response(JSON.stringify({
      free: w?.free_balance ?? 0,
      paid: w?.paid_balance ?? 0,
      promo: w?.promo_balance ?? 0,
      total: (w?.free_balance ?? 0) + (w?.paid_balance ?? 0) + (w?.promo_balance ?? 0),
      last_reset: w?.last_free_reset_at ?? null,
      signup_bonus_granted: !!w?.signup_bonus_granted,
      first_action_bonus_granted: !!w?.first_action_bonus_granted,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
