import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REDEEM-COUPON] ${step}${detailsStr}`);
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
    logStep("User authenticated", { userId: user.id });

    const { coupon_code } = await req.json();
    if (!coupon_code) throw new Error("Coupon code is required");

    const normalizedCode = String(coupon_code).toLowerCase().trim();
    logStep("Checking coupon", { code: normalizedCode });

    // Look up coupon in DB
    const { data: coupon } = await supabaseClient
      .from("coupon_codes")
      .select("*")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (!coupon) {
      return new Response(JSON.stringify({ success: false, error: "Invalid coupon code" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!coupon.is_active) {
      return new Response(JSON.stringify({ success: false, error: "This coupon is no longer active" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ success: false, error: "This coupon has expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (coupon.max_uses != null && coupon.use_count >= coupon.max_uses) {
      return new Response(JSON.stringify({ success: false, error: "This coupon has reached its usage limit" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Already redeemed by this user?
    const { data: existingRedemption } = await supabaseClient
      .from("coupon_redemptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("coupon_code", normalizedCode)
      .maybeSingle();

    if (existingRedemption) {
      return new Response(JSON.stringify({ success: false, error: "You have already redeemed this coupon" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Already premium?
    const { data: existingAccess } = await supabaseClient
      .from("premium_access")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingAccess) {
      return new Response(JSON.stringify({ success: false, error: "You already have premium access" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Record redemption
    const { error: redemptionError } = await supabaseClient
      .from("coupon_redemptions")
      .insert({ user_id: user.id, coupon_code: normalizedCode });
    if (redemptionError) throw new Error("Failed to record coupon redemption");

    // Compute expiry from duration_days
    let expiresAt: string | null = null;
    if (coupon.duration_days) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + coupon.duration_days);
      expiresAt = expiry.toISOString();
    }

    const { error: accessError } = await supabaseClient
      .from("premium_access")
      .insert({
        user_id: user.id,
        access_type: coupon.access_type || "coupon",
        expires_at: expiresAt,
      });
    if (accessError) throw new Error("Failed to grant premium access");

    // Increment use_count
    await supabaseClient
      .from("coupon_codes")
      .update({ use_count: coupon.use_count + 1 })
      .eq("id", coupon.id);

    logStep("Coupon redeemed", { code: normalizedCode, expiresAt });

    const message = coupon.duration_days
      ? `Coupon redeemed! You now have ${coupon.duration_days}-day premium access.`
      : "Coupon redeemed successfully! You now have lifetime premium access.";

    return new Response(JSON.stringify({ success: true, message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
