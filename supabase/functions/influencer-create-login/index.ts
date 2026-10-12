// Admin only. Creates a login for one influencer and attaches it to their row.
// The admin hands the email and password to the influencer, who signs in and
// sees only their own campaign at /influencer.
//
// It never touches money and never grants any admin role.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status });

// Readable password: 3 short words plus digits, no ambiguous characters.
function makePassword(): string {
  const words = ["diya", "ladoo", "rangoli", "chai", "dhoop", "mango", "kite", "lotus", "neem", "peacock"];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  const n = 10 + Math.floor(Math.random() * 89);
  return `${pick()}-${pick()}-${n}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // admin only
    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: ud, error: ue } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (ue || !ud.user) return json({ error: "Auth failed" }, 401);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: ud.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin only" }, 403);

    const { influencer_id, email } = await req.json();
    if (!influencer_id) return json({ error: "influencer_id is required" }, 400);
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) return json({ error: "Enter a valid email" }, 400);

    const password = makePassword();

    // Create the account. If the email already exists, reuse that user instead
    // of failing, so an influencer who already shops on the site can be linked.
    let userId: string | null = null;
    const { data: created, error: ce } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { role_hint: "influencer", influencer_id },
    });
    let reusedExisting = false;
    if (ce) {
      const msg = ce.message?.toLowerCase() ?? "";
      if (!msg.includes("already")) throw new Error(ce.message);
      // Find the existing user by paging the admin list.
      for (let page = 1; page <= 20 && !userId; page++) {
        const { data: list, error: le } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
        if (le) throw new Error(le.message);
        const hit = list.users.find((u) => u.email?.toLowerCase() === cleanEmail);
        if (hit) { userId = hit.id; reusedExisting = true; }
        if (list.users.length < 200) break;
      }
      if (!userId) throw new Error("That email exists but could not be found");
    } else {
      userId = created.user?.id ?? null;
    }
    if (!userId) throw new Error("Could not create the login");

    const { error: ae } = await supabase.rpc("influencer_attach_login", {
      _influencer_id: influencer_id,
      _user_id: userId,
    });
    if (ae) {
      // Don't leave a stray account behind if we created one and could not attach it.
      if (!reusedExisting) await supabase.auth.admin.deleteUser(userId).catch(() => {});
      return json({ error: ae.message }, 409);
    }

    return json({
      ok: true,
      email: cleanEmail,
      // An existing account keeps its own password; we must not reveal or change it.
      password: reusedExisting ? null : password,
      reused_existing_account: reusedExisting,
      sign_in_at: "https://ezyourlife.com/influencer",
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
