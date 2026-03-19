import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Auto-grant premium for specific domain
    const emailDomain = user.email?.split("@")[1]?.toLowerCase();
    if (emailDomain === "seafund.in") {
      // Check if already has premium, if not grant it silently
      const { data: existingAccess } = await supabaseClient
        .from("premium_access")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!existingAccess) {
        await supabaseClient.from("premium_access").insert({
          user_id: user.id,
          access_type: "coupon",
          expires_at: null,
        });
        logStep("Auto-granted premium for domain user");
      }

      return new Response(JSON.stringify({
        subscribed: true,
        access_type: existingAccess?.access_type || "coupon",
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check premium access in database
    const { data: premiumAccess } = await supabaseClient
      .from("premium_access")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (premiumAccess) {
      // Check if access has expired (for trial/time-limited access)
      if (premiumAccess.expires_at && new Date(premiumAccess.expires_at) < new Date()) {
        logStep("Premium access expired", { accessType: premiumAccess.access_type, expiredAt: premiumAccess.expires_at });
        // Delete expired access
        await supabaseClient.from("premium_access").delete().eq("user_id", user.id);
        return new Response(JSON.stringify({ subscribed: false, expired: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      logStep("Premium access found", { accessType: premiumAccess.access_type });
      return new Response(JSON.stringify({
        subscribed: true,
        access_type: premiumAccess.access_type,
        subscription_end: premiumAccess.expires_at
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("No premium access found");
    return new Response(JSON.stringify({ subscribed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
