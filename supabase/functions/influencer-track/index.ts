// Public: records one click on an influencer link (ezyourlife.com/?ref=CODE).
// Stores no IP or personal data; the visitor id is a random id the browser keeps.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { code, visitor } = await req.json();
    const cleanCode = String(code ?? "").toLowerCase().trim();
    if (!/^[a-z0-9-]{3,20}$/.test(cleanCode)) throw new Error("bad code");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const { data, error } = await supabase.rpc("influencer_record_click", {
      _code: cleanCode,
      _visitor: String(visitor ?? "").slice(0, 64),
    });
    if (error) throw new Error(error.message);
    return new Response(JSON.stringify({ ok: data === true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch {
    // Never break the page for a tracking call.
    return new Response(JSON.stringify({ ok: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  }
});
