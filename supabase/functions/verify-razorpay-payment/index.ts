import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-RAZORPAY-PAYMENT] ${step}${detailsStr}`);
};

// HMAC SHA256 signature verification using Web Crypto API
async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const data = encoder.encode(`${orderId}|${paymentId}`);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
  const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return generatedSignature === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      throw new Error("Razorpay secret not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_type } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error("Missing payment verification parameters");
    }

    logStep("Verifying payment", { orderId: razorpay_order_id, paymentId: razorpay_payment_id, planType: plan_type });

    // Verify signature
    const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret);

    if (!isValid) {
      logStep("Signature verification failed");
      return new Response(JSON.stringify({ error: "Invalid payment signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Signature verified successfully");

    // Calculate expiry date based on plan type
    const now = new Date();
    let expiresAt: string | null = null;
    let accessType = "subscription";

    if (plan_type === "trial") {
      // 24-hour trial
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      accessType = "trial";
    } else {
      // Yearly subscription - 365 days
      expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
      accessType = "subscription";
    }

    logStep("Granting access", { accessType, expiresAt });

    // Delete any existing access first
    await supabaseClient
      .from("premium_access")
      .delete()
      .eq("user_id", user.id);

    // Insert new premium access
    const { error: insertError } = await supabaseClient
      .from("premium_access")
      .insert({
        user_id: user.id,
        access_type: accessType,
        expires_at: expiresAt,
        stripe_customer_id: razorpay_payment_id,
        stripe_subscription_id: razorpay_order_id,
      });

    if (insertError) {
      logStep("Database insert error", { error: insertError.message });
      throw new Error(`Failed to grant access: ${insertError.message}`);
    }

    logStep("Access granted successfully");

    return new Response(JSON.stringify({
      success: true,
      access_type: accessType,
      expires_at: expiresAt,
    }), {
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
