// Claims a visiting-card promo for the signed-in user: 5,000 promo credits, once per account.
// The rules (one claim per account, one claim per unique card, expiry) live in claim_card_promo().
import { corsHeaders, json } from "../_shared/http.ts";
import { identify } from "../_shared/billing.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const MESSAGES: Record<string, string> = {
  invalid: "That card code was not found. Check the code printed on your card.",
  inactive: "This card is no longer active.",
  expired: "This card has expired.",
  used: "This card has already been claimed.",
  full: "This card offer has been fully claimed.",
  already_claimed_by_you: "Your account has already claimed a card offer.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const caller = await identify(req);
    if (!caller?.userId) return json({ error: "sign_in_required", message: "Please sign in to claim your card." }, 401);
    const { code } = (await req.json().catch(() => ({}))) as { code?: string };
    if (!code || code.length > 40) return json({ error: "bad_request", message: "Enter the code printed on your card." }, 400);

    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_card_promo`, {
      method: "POST",
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, "Content-Type": "application/json" },
      body: JSON.stringify({ _uid: caller.userId, _code: code }),
    });
    if (!r.ok) return json({ error: "claim_failed", message: "Could not claim the card. Please try again." }, 500);
    const out = (await r.json()) as { ok: boolean; reason?: string; credits?: number; per_app_limit?: number };
    if (!out.ok) return json({ ok: false, reason: out.reason, message: MESSAGES[out.reason ?? ""] ?? "This card cannot be claimed." }, 200);
    return json(out);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
