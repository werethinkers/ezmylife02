// "Send all on WhatsApp" for websites and cards, paid in credits.
//
//   action "quote":  what a send would cost, the person's balance, and whether automatic sending is on.
//   action "start":  takes consent, charges credits and creates the send (ip_bulk_send_start, one transaction).
//                    mode "queue": the sender's own WhatsApp opens each chat in turn (only the count is kept).
//                    mode "auto":  EZYOURLIFE's WhatsApp number sends every message through Wavo, using the
//                                  approved template below. Failed messages are refunded when the send ends.
//   action "status": progress of an automatic send (and nudges the worker if it went quiet).
//   action "work":   internal; sends the next batch, then calls itself until nobody is left.
//
// Automatic mode needs a Wavo template, approved by Meta, named WAVO_TPL_CARD_SEND (default card_send_ezyourlife):
//   body: {{1}} recipient's name, {{2}} sender's name, {{3}} what it is (e.g. "Diwali card")
//   button: URL https://ezyourlife.com/{{1}}  (the person's own link, p/<slug>?to=<name>)
// Until it is approved, "quote" says auto_available: false and the site offers only the queue.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { inBackground, sendApprovedTemplate, templateReady, waNumber } from "../_shared/whatsapp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-worker-key",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TEMPLATE = Deno.env.get("WAVO_TPL_CARD_SEND") ?? "card_send_ezyourlife";
const MAX_PEOPLE = 2000;
const BATCH = 40;
const GAP_MS = 150; // between messages, to stay well inside WhatsApp's rate limits

// Keep in step with ip_bulk_send_price() in the migration and src/lib/creditRate.ts.
const price = (mode: string, n: number) => (n <= 0 ? 0 : mode === "auto" ? n * 4 : Math.ceil(n / 10));

const cleanName = (s: unknown) => String(s ?? "").replace(/[<>{}\\]/g, "").replace(/\s+/g, " ").trim().slice(0, 30);
const nameParam = (n: string) => encodeURIComponent(n.trim().replace(/\s+/g, "-").slice(0, 30));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const admin = () => createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

/** Sends the next batch of an automatic send; calls itself again while people are left, else closes the send. */
async function work(sendId: string): Promise<void> {
  const sb = admin();
  const { data: s } = await sb.from("ip_bulk_sends").select("id, page_id, owner_id, lang, status, mode").eq("id", sendId).maybeSingle();
  if (!s || s.status !== "sending" || s.mode !== "auto") return;
  const { data: page } = await sb.from("ip_pages").select("slug, product_id, published_content, status").eq("id", s.page_id).maybeSingle();
  const { data: prod } = await sb.from("ip_products").select("name").eq("id", page?.product_id ?? "").maybeSingle();
  const { data: owner } = await sb.from("profiles").select("full_name, display_name").eq("id", s.owner_id).maybeSingle();
  const pc = (page?.published_content ?? {}) as Record<string, unknown>;
  const sender = cleanName(pc.sender || pc.hosts || pc.name || owner?.full_name || owner?.display_name) || "A friend";
  const what = String(prod?.name ?? "card").slice(0, 60);

  const { data: batch, error } = await sb.rpc("ip_bulk_claim", { _send_id: sendId, _limit: BATCH });
  if (error) throw new Error(error.message);
  const rows = (batch ?? []) as Array<{ id: number; name: string; phone: string }>;

  for (const r of rows) {
    let status = "sent"; let err: string | null = null;
    try {
      if (!page || page.status !== "published" || !page.slug) throw new Error("page is no longer live");
      const path = `p/${page.slug}?to=${nameParam(r.name)}${s.lang && s.lang !== "en" ? `&lang=${s.lang}` : ""}`;
      const ok = await sendApprovedTemplate(r.phone, TEMPLATE, [r.name, sender, what], path);
      if (!ok) throw new Error("template not approved");
    } catch (e) {
      status = "failed"; err = (e instanceof Error ? e.message : String(e)).slice(0, 300);
    }
    await sb.from("ip_bulk_recipients").update({ status, error: err, updated_at: new Date().toISOString() }).eq("id", r.id);
    await sleep(GAP_MS);
  }

  const { data: fin } = await sb.rpc("ip_bulk_send_finish", { _send_id: sendId });
  if (fin && !fin.done && fin.left > 0) {
    // Next batch in a fresh invocation, so a 2,000-person send never runs into the function's time limit.
    await fetch(`${SUPABASE_URL}/functions/v1/ip-bulk-send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE}`, "x-worker-key": SERVICE_ROLE },
      body: JSON.stringify({ action: "work", send_id: sendId }),
    }).catch((e) => console.error("ip-bulk-send chain", e));
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    if (action === "work") {
      if (!SERVICE_ROLE || req.headers.get("x-worker-key") !== SERVICE_ROLE) return json({ error: "Not allowed." }, 403);
      inBackground(work(String(body.send_id ?? "")).catch((e) => console.error("ip-bulk-send work", e)));
      return json({ ok: true });
    }

    const sb = admin();
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!token) return json({ error: "Sign in first." }, 401);
    const { data: ud, error: ue } = await sb.auth.getUser(token);
    if (ue || !ud.user) return json({ error: "Sign in first." }, 401);
    const user = ud.user;

    if (action === "quote") {
      const n = Math.max(0, Math.min(MAX_PEOPLE, Number(body.people) || 0));
      const nAuto = Math.max(0, Math.min(MAX_PEOPLE, Number(body.with_phone) || 0));
      await sb.rpc("ensure_wallet", { _uid: user.id }).then(() => undefined, () => undefined);
      const { data: w } = await sb.from("credit_wallets").select("free_balance, paid_balance, promo_balance").eq("user_id", user.id).maybeSingle();
      const balance = w ? Math.max(0, w.promo_balance ?? 0) + w.free_balance + w.paid_balance : 0;
      return json({
        balance,
        queue: { people: n, credits: price("queue", n) },
        auto: { people: nAuto, credits: price("auto", nAuto), available: await templateReady(TEMPLATE) },
      });
    }

    if (action === "start") {
      if (body.consent !== true) return json({ error: "Please confirm these people expect your message." }, 400);
      const mode = body.mode === "auto" ? "auto" : "queue";
      const pageId = String(body.page_id ?? "");
      const lang = typeof body.lang === "string" ? body.lang.slice(0, 8) : "en";
      let people: Array<{ name: string; phone: string }> = [];
      let count = 0;
      if (mode === "auto") {
        if (!(await templateReady(TEMPLATE))) return json({ error: "Automatic sending isn't switched on yet. Use Send from my WhatsApp." }, 400);
        const seen = new Set<string>();
        for (const p of Array.isArray(body.people) ? body.people : []) {
          const name = cleanName((p as Record<string, unknown>)?.name);
          const phone = waNumber((p as Record<string, unknown>)?.phone);
          if (!name || !phone || seen.has(phone)) continue; // one message per number
          seen.add(phone); people.push({ name, phone });
        }
        if (people.length === 0) return json({ error: "Nobody on the list has a valid mobile number." }, 400);
        if (people.length > MAX_PEOPLE) people = people.slice(0, MAX_PEOPLE);
      } else {
        count = Math.floor(Number(body.people) || 0);
        if (count < 1 || count > MAX_PEOPLE) return json({ error: `Add between 1 and ${MAX_PEOPLE} people.` }, 400);
      }

      const { data: res, error } = await sb.rpc("ip_bulk_send_start", {
        _uid: user.id, _page_id: pageId, _mode: mode, _lang: lang, _count: count, _people: mode === "auto" ? people : null,
      });
      if (error) throw new Error(error.message);
      if (!res?.ok) {
        if (res?.reason === "insufficient") {
          return json({ error: `This needs ${res.credits_required} credits. You have ${res.balance}.`, insufficient: true, credits_required: res.credits_required, balance: res.balance }, 402);
        }
        const why: Record<string, string> = { not_found: "Page not found.", not_published: "Publish the page first.", bad_count: "That list is too long or empty." };
        return json({ error: why[res?.reason] ?? `Couldn't start (${res?.reason}).` }, 400);
      }
      await sb.from("activity_logs").insert({
        user_id: user.id, action_type: "whatsapp_send_all",
        action_details: { page_id: pageId, mode, people: res.people, credits: res.charged, send_id: res.send_id },
      }).then(() => undefined, () => undefined);
      if (mode === "auto") inBackground(work(res.send_id).catch((e) => console.error("ip-bulk-send work", e)));
      return json({ ok: true, send_id: res.send_id, charged: res.charged, people: res.people });
    }

    if (action === "status") {
      const { data: s } = await sb.from("ip_bulk_sends").select("*").eq("id", String(body.send_id ?? "")).maybeSingle();
      if (!s || s.owner_id !== user.id) return json({ error: "Not found." }, 404);
      const { data: counts } = await sb.from("ip_bulk_recipients").select("status, name, error").eq("send_id", s.id);
      const list = counts ?? [];
      const sent = list.filter((r) => r.status === "sent").length;
      const failed = list.filter((r) => r.status === "failed");
      if (s.status === "sending") {
        // If the worker chain broke (a deploy, a timeout), the next status check restarts it.
        const { data: last } = await sb.from("ip_bulk_recipients").select("updated_at").eq("send_id", s.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
        if (!last || Date.now() - new Date(last.updated_at).getTime() > 90_000) inBackground(work(s.id).catch((e) => console.error("ip-bulk-send restart", e)));
      }
      return json({
        status: s.status, people: s.people, sent, failed: failed.length, refunded: s.credits_refunded,
        failed_names: failed.slice(0, 50).map((r) => r.name),
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("ip-bulk-send error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
