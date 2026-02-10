import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-RAZORPAY-ORDER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    
    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials not configured");
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
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user already has active premium access
    const { data: existingAccess } = await supabaseClient
      .from("premium_access")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingAccess) {
      if (!existingAccess.expires_at || new Date(existingAccess.expires_at) > new Date()) {
        return new Response(JSON.stringify({ error: "You already have active premium access" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    }

    const body = await req.json();
    const planType = body.plan_type || "yearly";
    const couponCode = body.coupon_code ? body.coupon_code.toLowerCase().trim() : null;
    
    let amount: number;
    let description: string;
    
    switch (planType) {
      case "trial":
        amount = 5000; // ₹50 in paise
        description = "24-Hour Day Pass";
        break;
      case "monthly":
        amount = 19900; // ₹199 in paise
        description = "Monthly Premium Subscription";
        break;
      default: // yearly
        amount = 199900; // ₹1999 in paise
        description = "Annual Premium Subscription";
    }

    // Apply coupon discount
    if (couponCode === "abhi99") {
      const discount = Math.floor(amount * 0.99);
      amount = amount - discount;
      description = `${description} (99% OFF)`;
      logStep("Coupon applied", { coupon: couponCode, discountedAmount: amount });
    }
    
    logStep("Creating order", { planType, amount });

    // Create Razorpay order using REST API
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount: amount,
        currency: "INR",
        receipt: `order_${user.id.substring(0, 8)}_${Date.now()}`,
        notes: {
          user_id: user.id,
          user_email: user.email,
          plan_type: planType,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      logStep("Razorpay API error", { status: orderResponse.status, error: errorData });
      throw new Error(`Failed to create Razorpay order: ${errorData}`);
    }

    const order = await orderResponse.json();
    logStep("Order created", { orderId: order.id });

    return new Response(JSON.stringify({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      plan_type: planType,
      description: description,
      user_email: user.email,
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
