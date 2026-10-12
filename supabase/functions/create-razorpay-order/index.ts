// Creates a Razorpay order for a credit pack and a `credit_purchases` row.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PACKS: Record<string, { inr: number; credits: number; label: string }> = {
  p10:   { inr: 10,   credits: 15,   label: "15 credits" },
  p50:   { inr: 50,   credits: 80,   label: "80 credits" },
  p100:  { inr: 100,  credits: 180,  label: "180 credits" },
  p250:  { inr: 250,  credits: 500,  label: "500 credits" },
  p500:  { inr: 500,  credits: 1100, label: "1,100 credits" },
  p1000: { inr: 1000, credits: 2200, label: "2,200 credits" },
  // The kit sold on /kit: the 2,200 credits of p1000 plus 800 free, and the paid
  // purchase also grants one website and one visiting card (kit_grant_on_paid).
  kit999: { inr: 999, credits: 3000, label: "Business kit: 3,000 credits, website and visiting card" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      console.error("Razorpay env vars missing: keyId=", !!keyId, "keySecret=", !!keySecret);
      throw new Error("Razorpay not configured. Contact support with error code: RAZORPAY_MISSING_CONFIG");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const { data: ud, error: ue } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (ue || !ud.user?.email) throw new Error("Auth failed");
    const user = ud.user;

    const { pack_id, coupon_code, ref_code } = await req.json();
    const pack = PACKS[pack_id];
    if (!pack) throw new Error("Invalid pack");

    // Influencer attribution only: recorded on the purchase row, never applied as
    // a discount. The amount charged is the pack price, exactly as before.
    const refCode = String(ref_code ?? "").toLowerCase().trim();
    const cleanRef = /^[a-z0-9-]{3,20}$/.test(refCode) ? refCode : null;

    const amount = pack.inr * 100; // paise

    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `cr_${user.id.slice(0, 6)}_${Date.now()}`,
        notes: { user_id: user.id, pack_id, credits: pack.credits },
      }),
    });
    if (!orderRes.ok) {
      const errText = await orderRes.text();
      console.error(`Razorpay API error ${orderRes.status}:`, errText);
      throw new Error(`Razorpay error: ${errText}`);
    }
    const order = await orderRes.json();

    const { data: purchase, error: pe } = await supabase
      .from("credit_purchases")
      .insert({
        user_id: user.id,
        pack_id,
        inr_amount: pack.inr,
        credits: pack.credits,
        razorpay_order_id: order.id,
        coupon_code: coupon_code ?? null,
        ref_code: cleanRef,
      })
      .select()
      .single();
    if (pe) throw new Error(pe.message);

    return new Response(
      JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: keyId,
        purchase_id: purchase.id,
        pack_id,
        credits: pack.credits,
        description: `${pack.label} · ₹${pack.inr}`,
        user_email: user.email,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("create-razorpay-order error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
