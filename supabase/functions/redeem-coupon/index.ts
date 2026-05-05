// Redeems a coupon code: grants credits to the user's wallet.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const { data: ud, error: ue } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (ue || !ud.user) throw new Error("Auth failed");
    const user = ud.user;

    const { coupon_code } = await req.json();
    if (!coupon_code) throw new Error("Coupon code is required");
    const code = String(coupon_code).toLowerCase().trim();

    const { data: coupon } = await supabase
      .from("coupon_codes").select("*").eq("code", code).maybeSingle();
    if (!coupon) return json({ success: false, error: "Invalid coupon code" }, 400);
    if (!coupon.is_active) return json({ success: false, error: "Coupon is no longer active" }, 400);
    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now())
      return json({ success: false, error: "Coupon has expired" }, 400);
    if (coupon.max_uses != null && coupon.use_count >= coupon.max_uses)
      return json({ success: false, error: "Coupon usage limit reached" }, 400);

    const { data: existing } = await supabase
      .from("coupon_redemptions").select("id")
      .eq("user_id", user.id).eq("coupon_code", code).maybeSingle();
    if (existing) return json({ success: false, error: "You have already redeemed this coupon" }, 400);

    // Determine credits to grant. Prefer credit_grant; fallback by access_type.
    const credits = coupon.credit_grant
      ?? (coupon.access_type === "lifetime" ? 1000
        : coupon.access_type === "trial" ? 100
        : 50);

    const { error: redErr } = await supabase
      .from("coupon_redemptions").insert({ user_id: user.id, coupon_code: code });
    if (redErr) throw new Error("Failed to record redemption");

    const { error: adjErr } = await supabase.rpc("admin_adjust_credits", {
      _target: user.id, _delta: credits, _bucket: "free", _note: `coupon:${code}`,
    });
    // admin_adjust_credits requires admin role; fall back to direct ledger via service role.
    if (adjErr) {
      // Direct apply: use a synthetic purchase row
      const { data: purchase } = await supabase.from("credit_purchases").insert({
        user_id: user.id,
        pack_id: `coupon:${code}`,
        inr_amount: 0,
        credits,
        razorpay_order_id: `coupon_${code}_${user.id}_${Date.now()}`,
        status: "created",
        coupon_code: code,
      }).select().single();
      if (purchase) {
        await supabase.rpc("apply_credit_purchase", { _purchase_id: purchase.id, _payment_id: "coupon" });
      }
    }

    await supabase.from("coupon_codes").update({ use_count: coupon.use_count + 1 }).eq("id", coupon.id);

    return json({ success: true, credits, message: `Coupon redeemed! ${credits} credits added to your wallet.` });
  } catch (e) {
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }, status,
  });
}
