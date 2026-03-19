import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_COUPONS = ["ezmylife2000", "abhi2k", "abhi100", "ezylaunch"];
const TIME_LIMITED_COUPONS: Record<string, number> = {
  "ezylaunch": 30, // 30 days
};

const logStep = (step: string, details?: any) => {
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

    const normalizedCode = coupon_code.toLowerCase().trim();
    logStep("Checking coupon", { code: normalizedCode });

    // Validate coupon code
    if (!VALID_COUPONS.includes(normalizedCode)) {
      logStep("Invalid coupon code");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid coupon code" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if already redeemed this coupon
    const { data: existingRedemption } = await supabaseClient
      .from("coupon_redemptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("coupon_code", normalizedCode)
      .single();

    if (existingRedemption) {
      logStep("Coupon already redeemed by user");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "You have already redeemed this coupon" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if user already has premium access
    const { data: existingAccess } = await supabaseClient
      .from("premium_access")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingAccess) {
      logStep("User already has premium access");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "You already have premium access" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Record the redemption
    const { error: redemptionError } = await supabaseClient
      .from("coupon_redemptions")
      .insert({
        user_id: user.id,
        coupon_code: normalizedCode
      });

    if (redemptionError) {
      logStep("Failed to record redemption", { error: redemptionError.message });
      throw new Error("Failed to record coupon redemption");
    }

    // Grant premium access (lifetime for coupon)
    const { error: accessError } = await supabaseClient
      .from("premium_access")
      .insert({
        user_id: user.id,
        access_type: "coupon",
        expires_at: null // Lifetime access
      });

    if (accessError) {
      logStep("Failed to grant access", { error: accessError.message });
      throw new Error("Failed to grant premium access");
    }

    logStep("Coupon redeemed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Coupon redeemed successfully! You now have lifetime premium access." 
    }), {
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