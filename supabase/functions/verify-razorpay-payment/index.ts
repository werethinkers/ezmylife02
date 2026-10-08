// Verifies a Razorpay checkout response and credits the purchase to the user's wallet.
// The razorpay-webhook function credits the same purchase idempotently if this call never happens.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { settlePayment, verifyHmac } from "../_shared/razorpay.ts";
import { receiptInBackground } from "../_shared/receipt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const reject = (error: string, status = 400) =>
  new Response(JSON.stringify({ error }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }, status,
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !secret) throw new Error("Razorpay not configured");

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
    if (
      typeof razorpay_order_id !== "string" || typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string" || typeof purchase_id !== "string"
    ) {
      return reject("Missing parameters");
    }

    const valid = await verifyHmac(secret, `${razorpay_order_id}|${razorpay_payment_id}`, razorpay_signature);
    if (!valid) return reject("Invalid signature");

    const { data: purchase } = await supabase
      .from("credit_purchases").select("*").eq("id", purchase_id).maybeSingle();
    if (!purchase || purchase.user_id !== user.id) return reject("Purchase not found", 404);
    // The signature only proves the order/payment pair is genuine; it must also be THIS purchase's order.
    if (purchase.razorpay_order_id !== razorpay_order_id) return reject("Order does not match purchase");

    const settled = await settlePayment(razorpay_payment_id, purchase, keyId, secret);
    if (!settled.ok) return reject(`Payment not valid: ${settled.reason}`);

    const { data: applied, error: aerr } = await supabase.rpc("apply_credit_purchase", {
      _purchase_id: purchase.id,
      _order_id: razorpay_order_id,
      _payment_id: razorpay_payment_id,
    });
    if (aerr) throw new Error(aerr.message);
    if (!applied?.ok) return reject(`Could not apply purchase: ${applied?.reason ?? "unknown"}`, 409);

    if (!applied.noop) {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action_type: "payment",
        action_details: {
          kind: "credit_purchase", source: "client_verify", pack_id: purchase.pack_id,
          credits: purchase.credits, inr: purchase.inr_amount, payment_id: razorpay_payment_id,
        },
      });
    }

    receiptInBackground(supabase, {
      kind: "credits", userId: user.id, email: user.email, name: user.user_metadata?.full_name ?? user.user_metadata?.name,
      description: `${purchase.credits.toLocaleString("en-IN")} EZYOURLIFE credits`, amountInr: Number(purchase.inr_amount),
      paymentId: razorpay_payment_id, orderId: razorpay_order_id, link: "https://ezyourlife.com/ai-apps",
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
