// Sends a refund to Razorpay for a request an ADMIN HAS ALREADY APPROVED.
//
// Safety rules, in order:
//   1. The caller must hold the admin role.
//   2. refund_claim_for_processing refuses anything not in 'approved' state,
//      so a request that is merely 'requested' can never be paid out.
//   3. The amount is recomputed from the ledger at this moment (unused credits
//      only) and is never taken from the client.
//   4. A Razorpay idempotency key derived from the request id stops a double
//      refund if this function is called twice.
//   5. Credits are removed and the commission reversed only after Razorpay
//      accepts the refund.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  let claimedId: string | null = null;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) throw new Error("Razorpay not configured");

    // 1. admin only
    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: ud, error: ue } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (ue || !ud.user) return json({ error: "Auth failed" }, 401);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: ud.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin only" }, 403);

    const { request_id } = await req.json();
    if (!request_id) return json({ error: "request_id is required" }, 400);

    // 2 + 3. claim the approved request and get the authoritative amount
    const { data: claim, error: ce } = await supabase.rpc("refund_claim_for_processing", {
      _request_id: request_id,
    });
    if (ce) throw new Error(ce.message);
    if (!claim?.ok) return json({ error: `Cannot process: ${claim?.reason}`, detail: claim }, 409);
    claimedId = request_id;

    const paise = Math.round(Number(claim.refund_inr) * 100);
    if (!Number.isFinite(paise) || paise <= 0) throw new Error("computed refund amount is not positive");
    if (!claim.razorpay_payment_id) throw new Error("this purchase has no Razorpay payment id");

    // 4. refund, idempotent on the request id
    const res = await fetch(`https://api.razorpay.com/v1/payments/${claim.razorpay_payment_id}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Razorpay-Idempotency-Key": `refund_${request_id}`,
        Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount: paise,
        speed: "normal",
        notes: {
          refund_request_id: String(request_id),
          purchase_id: String(claim.purchase_id),
          credits_used: String(claim.credits_used),
          credits_refunded: String(claim.credits_unused),
          approved_by_admin: ud.user.id,
        },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      await supabase.rpc("refund_mark_failed", {
        _request_id: request_id,
        _note: `Razorpay: ${body?.error?.description ?? res.status}`,
      });
      return json({ error: "Razorpay refused the refund", detail: body?.error ?? null }, 502);
    }

    // 5. settle: remove unused credits, ledger row, reverse commission
    const { data: settled, error: se } = await supabase.rpc("refund_mark_processed", {
      _request_id: request_id,
      _refund_id: body.id,
      _amount_inr: Number(claim.refund_inr),
      _credits_removed: Number(claim.credits_unused),
    });
    if (se) {
      // The money has left. Do not mark failed: surface it loudly for manual repair.
      console.error("refund-process: refund SENT but settlement failed", {
        request_id, refund_id: body.id, error: se.message,
      });
      return json({
        error: "Refund was sent but the wallet update failed. Fix this row by hand.",
        razorpay_refund_id: body.id, detail: se.message,
      }, 500);
    }

    return json({
      ok: true,
      razorpay_refund_id: body.id,
      refunded_inr: Number(claim.refund_inr),
      paid_inr: claim.paid_inr,
      credits_used: claim.credits_used,
      credits_refunded: settled.credits_removed,
      commission_was: settled.commission_was,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (claimedId) await supabase.rpc("refund_mark_failed", { _request_id: claimedId, _note: msg });
    return json({ error: msg }, 500);
  }
});
