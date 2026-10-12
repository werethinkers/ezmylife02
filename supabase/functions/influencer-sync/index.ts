// Admin only. Creates commission rows for paid purchases that used an influencer code,
// reverses commissions whose payment was refunded (read-only check with Razorpay),
// and moves matured commissions (past the refund window) to "approved".
// It never moves money. Payouts are recorded by the admin with a bank UTR.
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
  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Admin check: the caller's token must belong to a user with the admin role.
    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: ud, error: ue } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (ue || !ud.user) return json({ error: "Auth failed" }, 401);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: ud.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin only" }, 403);

    const { data: settingsRows } = await supabase.from("influencer_settings").select("key, value");
    const settings = Object.fromEntries((settingsRows ?? []).map((s: any) => [s.key, Number(s.value)]));
    const windowDays = settings.refund_window_days ?? 7;

    const { data: influencers } = await supabase
      .from("influencers").select("id, code, commission_pct").eq("status", "active");
    const byCode = new Map((influencers ?? []).map((i: any) => [i.code, i]));

    // 1) New paid purchases that used an influencer code.
    // ref_code is the attribution code captured from /?ref=CODE at checkout.
    // coupon_code is still read as a fallback for sales captured before ref_code existed.
    const { data: paid } = await supabase
      .from("credit_purchases")
      .select("id, user_id, inr_amount, ref_code, coupon_code, paid_at, razorpay_payment_id")
      .eq("status", "paid")
      .or("ref_code.not.is.null,coupon_code.not.is.null");
    const { data: existing } = await supabase.from("influencer_commissions").select("purchase_id");
    const seen = new Set((existing ?? []).map((e: any) => e.purchase_id));

    let created = 0;
    for (const p of paid ?? []) {
      const code = String(p.ref_code ?? p.coupon_code ?? "").toLowerCase().trim();
      const inf = byCode.get(code);
      if (!inf || seen.has(p.id) || !p.paid_at) continue;
      const commission = Math.round(p.inr_amount * Number(inf.commission_pct)) / 100;
      const approveAfter = new Date(new Date(p.paid_at).getTime() + windowDays * 86400000).toISOString();
      const { error } = await supabase.from("influencer_commissions").insert({
        influencer_id: inf.id, purchase_id: p.id, buyer_user_id: p.user_id,
        gross_inr: p.inr_amount, commission_pct: inf.commission_pct,
        commission_inr: commission, status: "pending",
        purchased_at: p.paid_at, approve_after: approveAfter,
      });
      if (!error) created++;
    }

    // 2) Refund check for commissions not yet paid out (read-only Razorpay call).
    let reversed = 0;
    if (keyId && keySecret) {
      const { data: open } = await supabase
        .from("influencer_commissions")
        .select("id, purchase_id, status")
        .in("status", ["pending", "approved"]);
      const payIds = new Map((paid ?? []).map((p: any) => [p.id, p.razorpay_payment_id]));
      for (const c of open ?? []) {
        const payId = payIds.get(c.purchase_id);
        if (!payId) continue;
        const res = await fetch(`https://api.razorpay.com/v1/payments/${payId}`, {
          headers: { Authorization: "Basic " + btoa(`${keyId}:${keySecret}`) },
        });
        if (!res.ok) continue;
        const pay = await res.json();
        if (Number(pay.amount_refunded ?? 0) > 0) {
          await supabase.from("influencer_commissions").update({
            status: "reversed", reversed_reason: "refunded via Razorpay",
          }).eq("id", c.id);
          reversed++;
        }
      }
    }

    // 3) Move matured commissions to approved.
    const { data: due } = await supabase
      .from("influencer_commissions")
      .update({ status: "approved" })
      .eq("status", "pending")
      .lte("approve_after", new Date().toISOString())
      .select("id");

    return json({ ok: true, created, reversed, approved: due?.length ?? 0 });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
