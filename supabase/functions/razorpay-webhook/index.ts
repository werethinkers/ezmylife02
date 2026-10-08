// Razorpay webhook: credits a purchase server-side on payment.captured / order.paid
// (and captures on payment.authorized), so credits are not lost if the browser tab
// dies before verify-razorpay-payment runs. Idempotent with the client verify path.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { settlePayment, verifyHmac } from "../_shared/razorpay.ts";

const HANDLED_EVENTS = new Set(["payment.captured", "payment.authorized", "order.paid"]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" }, status });

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!webhookSecret || !keyId || !keySecret) throw new Error("Razorpay not configured");

    // Signature is over the raw body, so read it as text before parsing.
    const raw = await req.text();
    const signature = req.headers.get("X-Razorpay-Signature") ?? "";
    if (!(await verifyHmac(webhookSecret, raw, signature))) return json({ error: "Invalid signature" }, 401);

    const event = JSON.parse(raw);
    if (!HANDLED_EVENTS.has(event.event)) return json({ ignored: event.event });

    const payment = event.payload?.payment?.entity;
    const orderId: string | undefined = payment?.order_id ?? event.payload?.order?.entity?.id;
    if (!payment?.id || !orderId) return json({ ignored: "no payment/order in payload" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: purchase, error: pe } = await supabase
      .from("credit_purchases").select("*").eq("razorpay_order_id", orderId).maybeSingle();
    if (pe) throw new Error(pe.message);
    // Not a credit purchase (another product on the same Razorpay account): ack so it isn't retried.
    if (!purchase) return json({ ignored: "unknown order" });
    if (purchase.status === "paid") return json({ ok: true, noop: true });

    const settled = await settlePayment(payment.id, purchase, keyId, keySecret);
    if (!settled.ok) {
      console.error("razorpay-webhook: payment rejected", { orderId, paymentId: payment.id, reason: settled.reason });
      return json({ ok: false, reason: settled.reason });
    }

    const { data: applied, error: aerr } = await supabase.rpc("apply_credit_purchase", {
      _purchase_id: purchase.id,
      _order_id: orderId,
      _payment_id: payment.id,
    });
    if (aerr) throw new Error(aerr.message);
    if (!applied?.ok) {
      console.error("razorpay-webhook: apply failed", { orderId, paymentId: payment.id, applied });
      return json({ ok: false, reason: applied?.reason });
    }

    if (!applied.noop) {
      await supabase.from("activity_logs").insert({
        user_id: purchase.user_id,
        action_type: "payment",
        action_details: {
          kind: "credit_purchase", source: "webhook", event: event.event, pack_id: purchase.pack_id,
          credits: purchase.credits, inr: purchase.inr_amount, payment_id: payment.id,
        },
      });
    }

    return json({ ok: true, applied });
  } catch (e) {
    // 5xx makes Razorpay retry, which is what we want for transient failures.
    console.error("razorpay-webhook error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
