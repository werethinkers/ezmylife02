// Verifies Razorpay signature and credits the purchase to the user's wallet.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${orderId}|${paymentId}`));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!secret) throw new Error("Razorpay not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const { data: ud, error: ue } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (ue || !ud.user) throw new Error("Auth failed");
    const user = ud.user;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, purchase_id } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !purchase_id) {
      throw new Error("Missing parameters");
    }

    const valid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, secret);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    const { data: purchase } = await supabase
      .from("credit_purchases").select("*").eq("id", purchase_id).maybeSingle();
    if (!purchase || purchase.user_id !== user.id) throw new Error("Purchase not found");

    const { data: applied, error: aerr } = await supabase.rpc("apply_credit_purchase", {
      _purchase_id: purchase_id,
      _payment_id: razorpay_payment_id,
    });
    if (aerr) throw new Error(aerr.message);

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action_type: "credit_purchase",
      action_details: { pack_id: purchase.pack_id, credits: purchase.credits, inr: purchase.inr_amount, payment_id: razorpay_payment_id },
    });

    return new Response(JSON.stringify({ success: true, credits: purchase.credits, applied }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
