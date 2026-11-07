// Credits an Apple in-app purchase made in the iOS app (docs/ios-app.md).
// The app sends the signed transaction (JWS) from StoreKit 2. We check Apple's signature, that it is this app's
// credit pack, that it was bought by this signed-in account, and that it wasn't refunded; then the database
// adds the credits once per transaction. Safe to call again for the same transaction.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { APPLE_ROOT_G3_SHA256, verifyAppleJws } from "../_shared/appleJws.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status });

const BUNDLE_ID = "com.ezyourlife.app";
// Same credits as the website packs of the same size (create-razorpay-order). App Store product id = BUNDLE_ID.credits.<pack>.
const PACKS: Record<string, number> = { p100: 180, p250: 500, p500: 1100, p1000: 2200 };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Sign in first." }, 401);
    const { data: ud, error: ue } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (ue || !ud.user) return json({ error: "Sign in first." }, 401);
    const user = ud.user;

    const { jws } = await req.json();
    if (typeof jws !== "string" || jws.length < 100 || jws.length > 20000) return json({ error: "Missing purchase" }, 400);

    const verified = await verifyAppleJws(jws, Deno.env.get("APPLE_ROOT_SHA256") || APPLE_ROOT_G3_SHA256);
    if (!verified.ok) {
      console.warn("apple-iap-verify: rejected", verified.reason);
      return json({ error: "Could not verify the purchase", reason: verified.reason }, 400);
    }
    const t = verified.payload as Record<string, unknown>;

    if (t.bundleId !== BUNDLE_ID) return json({ error: "This purchase is for another app" }, 400);
    const productId = String(t.productId ?? "");
    const packId = productId.startsWith(`${BUNDLE_ID}.credits.`) ? productId.slice(BUNDLE_ID.length + 9) : "";
    const credits = PACKS[packId];
    if (!credits) return json({ error: "Unknown credit pack" }, 400);
    if (t.type !== "Consumable") return json({ error: "Not a credit pack" }, 400);
    if (t.revocationDate || t.revocationReason) return json({ error: "This purchase was refunded" }, 409);
    const env = String(t.environment ?? "");
    if (env !== "Production" && env !== "Sandbox") return json({ error: "Unknown store" }, 400);
    // Turn off after the app is approved if you don't want test-store purchases to add credits: set APPLE_IAP_ALLOW_SANDBOX=false.
    if (env === "Sandbox" && Deno.env.get("APPLE_IAP_ALLOW_SANDBOX") === "false") return json({ error: "Test purchases are off" }, 400);
    // The app puts the account id into every purchase; it must be the account asking for the credits.
    if (String(t.appAccountToken ?? "").toLowerCase() !== user.id.toLowerCase()) {
      return json({ error: "This purchase was made on another account" }, 403);
    }
    const quantity = Number(t.quantity ?? 1);
    if (quantity !== 1) return json({ error: "Unexpected quantity" }, 400);

    const { data: applied, error: aerr } = await supabase.rpc("apply_apple_purchase", {
      _user_id: user.id,
      _transaction_id: String(t.transactionId),
      _original_transaction_id: t.originalTransactionId ? String(t.originalTransactionId) : null,
      _product_id: productId,
      _pack_id: packId,
      _credits: credits,
      _environment: env,
    });
    if (aerr) throw new Error(aerr.message);
    if (!applied?.ok) return json({ error: `Could not add credits: ${applied?.reason ?? "unknown"}` }, 409);

    if (!applied.noop) {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action_type: "payment",
        action_details: { kind: "credit_purchase", source: "apple", pack_id: packId, credits, transaction_id: String(t.transactionId), environment: env },
      });
    }
    return json({ success: true, credits, noop: !!applied.noop });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("apple-iap-verify error:", msg);
    return json({ error: msg }, 500);
  }
});
