// Mail Desk server: connect Gmail, bring mails in (free), and read them (charged).
//
// Credits: only the "process" action charges, through the existing wallet functions (_shared/billing.ts),
// one fixed-price run per up to 25 mails: "mail-desk-12" = 1 credit, "mail-desk-25" = 2 credits.
// A run is charged only when it succeeds; if the AI fails, nothing is charged and the mails stay waiting.
// Getting mails from Gmail (sync) and quoting are free. See docs/mail-desk.md.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders, json } from "../_shared/http.ts";
import { ensurePrice, finishRun, identify, startRun, walletBalance } from "../_shared/billing.ts";
import { chat, parseJson } from "../_shared/llm.ts";
import {
  AI_MODEL, chunkPrice, cleanBody, CHUNK, creditsForMails, decode64url, estimateCostInr, googleAccessToken, parseAi, pickBody, seal, senderParts, sortMail, systemPrompt,
} from "../_shared/mailDesk.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CLIENT_ID = Deno.env.get("MAIL_DESK_GOOGLE_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("MAIL_DESK_GOOGLE_CLIENT_SECRET") ?? "";
const TOKEN_KEY = Deno.env.get("MAIL_DESK_TOKEN_KEY") ?? ""; // 64 hex characters, used only for the state signature below
const SITE = Deno.env.get("SITE_URL") ?? "https://ezyourlife.com";
const REDIRECT = `${SUPABASE_URL}/functions/v1/mail-desk`;
// gmail.send added for the reply composer and the auto-reply automation — anyone already connected
// needs to reconnect (Accounts tab) once, since a read-only grant can't retroactively send mail.
const SCOPES = "openid email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send";
const MAX_STORED_PER_ACCOUNT = 5000;
const DAY = 864e5;

const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

// ---------- small helpers ----------
const fail = (status: number, error: string, extra: Row = {}) => json({ error, message: extra.message ?? error, ...extra }, status);

function hex(b: ArrayBuffer | Uint8Array): string { return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
function fromHex(h: string): Uint8Array<ArrayBuffer> { return new Uint8Array(h.match(/../g)!.map((x) => parseInt(x, 16))); }
async function sign(payload: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", fromHex(TOKEN_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(payload)));
}

// ---------- Google ----------
const googleToken = (accountId: string) => googleAccessToken(db, accountId);

const hdr = (h: Row[], n: string) => h.find((x) => String(x.name).toLowerCase() === n)?.value ?? "";

// ---------- actions ----------
async function userEmail(uid: string): Promise<string> {
  const { data } = await db.auth.admin.getUserById(uid);
  return (data?.user?.email ?? "").toLowerCase();
}

/** Makes sure the Gmail the person signed up with is there as their default account. */
async function init(uid: string) {
  const email = await userEmail(uid);
  if (email) {
    const { data: has } = await db.from("mail_desk_accounts").select("id").eq("user_id", uid).eq("email", email).maybeSingle();
    if (!has) await db.from("mail_desk_accounts").insert({ user_id: uid, email, is_default: true, display_name: email.split("@")[0] });
  }
  const { data } = await db.from("mail_desk_accounts").select("id,email,is_default,connected").eq("user_id", uid).order("is_default", { ascending: false });
  return json({ ok: true, accounts: data ?? [] });
}

async function connect(uid: string) {
  if (!CLIENT_ID || !CLIENT_SECRET) return fail(503, "gmail_not_configured", { message: "Connecting Gmail is not switched on yet." });
  const state = btoa(JSON.stringify({ u: uid, t: Date.now() })).replace(/=/g, "");
  const p = new URLSearchParams({
    client_id: CLIENT_ID, redirect_uri: REDIRECT, response_type: "code", scope: SCOPES,
    access_type: "offline", prompt: "consent", state: `${state}.${await sign(state)}`,
  });
  return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${p}` });
}

/** Google sends the person back here (a GET). */
async function callback(url: URL): Promise<Response> {
  const back = (q: string) => Response.redirect(`${SITE}/mail-desk?${q}`, 302);
  try {
    const [state, sig] = (url.searchParams.get("state") ?? "").split(".");
    if (!state || sig !== await sign(state)) return back("error=expired");
    const { u, t } = JSON.parse(atob(state));
    if (Date.now() - t > 10 * 60_000) return back("error=expired");
    if (!url.searchParams.get("code")) return back("error=denied");
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code: url.searchParams.get("code")!, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: REDIRECT, grant_type: "authorization_code" }),
    });
    if (!r.ok) return back("error=google");
    const tok = await r.json();
    const email = String(JSON.parse(decode64url(tok.id_token.split(".")[1])).email ?? "").toLowerCase();
    if (!email) return back("error=google");
    let { data: acct } = await db.from("mail_desk_accounts").select("id").eq("user_id", u).eq("email", email).maybeSingle();
    if (!acct) {
      const ins = await db.from("mail_desk_accounts").insert({ user_id: u, email, display_name: email.split("@")[0] }).select("id").single();
      acct = ins.data;
    }
    if (!acct) return back("error=save");
    const prev = await db.from("mail_desk_tokens").select("refresh_token").eq("account_id", acct.id).maybeSingle();
    await db.from("mail_desk_tokens").upsert({
      account_id: acct.id,
      access_token: await seal(tok.access_token),
      refresh_token: tok.refresh_token ? await seal(tok.refresh_token) : prev.data?.refresh_token ?? null,
      expiry: Date.now() + tok.expires_in * 1000,
    });
    await db.from("mail_desk_accounts").update({ connected: true }).eq("id", acct.id);
    return back("connected=1");
  } catch (e) {
    console.error("mail-desk callback", e);
    return back("error=server");
  }
}

/** Brings in up to 100 mails from Gmail. Free. The page calls it again while `more` is true. */
async function sync(uid: string, body: Row) {
  const { data: acct } = await db.from("mail_desk_accounts").select("*").eq("id", String(body.account_id)).eq("user_id", uid).maybeSingle();
  if (!acct) return fail(404, "not_found");
  if (!acct.connected) return fail(409, "not_connected", { message: "Connect this Gmail first." });
  const token = await googleToken(acct.id);
  const { data: newest } = await db.from("mail_desk_mails").select("received_at").eq("account_id", acct.id).order("received_at", { ascending: false }).limit(1);
  const q = new URLSearchParams({ labelIds: "INBOX", maxResults: "100" });
  if (acct.sync_cursor) q.set("pageToken", acct.sync_cursor);
  else if (newest?.[0]) q.set("q", `after:${Math.floor(new Date(newest[0].received_at).getTime() / 1000) - 86400}`);
  const lr = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${q}`, { headers: { authorization: `Bearer ${token}` } });
  if (!lr.ok) return fail(502, "gmail_error", { message: `Gmail said ${lr.status}` });
  const list = await lr.json();
  const ids: string[] = (list.messages ?? []).map((m: Row) => m.id);
  const { data: known } = ids.length ? await db.from("mail_desk_mails").select("ext_id").eq("account_id", acct.id).in("ext_id", ids) : { data: [] };
  const have = new Set((known ?? []).map((k: Row) => k.ext_id));
  const fresh = ids.filter((i) => !have.has(i));
  let added = 0;
  for (let i = 0; i < fresh.length; i += 8) {
    const msgs = await Promise.all(fresh.slice(i, i + 8).map(async (id) => {
      const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, { headers: { authorization: `Bearer ${token}` } });
      return r.ok ? await r.json() : null;
    }));
    const rows = msgs.filter(Boolean).map((m: Row) => {
      const h = m.payload?.headers ?? [];
      const from = senderParts(hdr(h, "from"));
      return {
        user_id: uid, account_id: acct.id, ext_id: m.id, thread_id: m.threadId, from_name: from.name, from_email: from.email,
        subject: String(hdr(h, "subject")).slice(0, 300), snippet: String(m.snippet ?? "").slice(0, 300), body: pickBody(m.payload).slice(0, 20_000),
        received_at: new Date(Number(m.internalDate)).toISOString(), labels: m.labelIds ?? [],
        list_unsub: !!hdr(h, "list-unsubscribe"), precedence: String(hdr(h, "precedence")),
      };
    });
    if (rows.length) {
      const { error } = await db.from("mail_desk_mails").upsert(rows, { onConflict: "account_id,ext_id", ignoreDuplicates: true });
      if (error) return fail(500, "save_failed", { message: error.message });
      added += rows.length;
    }
  }
  const { count } = await db.from("mail_desk_mails").select("id", { count: "exact", head: true }).eq("account_id", acct.id);
  const next = (list.nextPageToken && (count ?? 0) < MAX_STORED_PER_ACCOUNT) ? list.nextPageToken : null;
  await db.from("mail_desk_accounts").update({ sync_cursor: next, ...(next ? {} : { last_synced_at: new Date().toISOString() }) }).eq("id", acct.id);
  return json({ ok: true, added, more: !!next });
}

// ---------- scope: how far back a fetch may read ----------
const SCOPE_DAYS: Record<string, number | null> = { "30d": 30, "6m": 183, all: null };
/** Earliest received_at that may be read, "0000" for no limit, or null when the person must choose first. */
function floorFor(acct: Row, scope: string): string | null {
  if (scope === "new") return acct.last_fetched_at ? (acct.scope_floor ?? "0000") : null;
  if (!(scope in SCOPE_DAYS)) return null;
  const days = SCOPE_DAYS[scope];
  if (days == null) return "0000";
  const wanted = new Date(Date.now() - days * DAY).toISOString();
  return acct.scope_floor && acct.scope_floor < wanted ? acct.scope_floor : wanted;
}
const STALE = () => new Date(Date.now() - 5 * 60_000).toISOString();

async function pendingFor(uid: string, acctId: string, floor: string, limit?: number): Promise<Row[] | number> {
  let q = db.from("mail_desk_mails").select(limit ? "*" : "id", limit ? undefined : { count: "exact", head: true })
    .eq("user_id", uid).eq("account_id", acctId).is("segmented_at", null)
    .or(`claimed_at.is.null,claimed_at.lt.${STALE()}`);
  if (floor !== "0000") q = q.gte("received_at", floor);
  if (limit) {
    const { data } = await q.order("received_at", { ascending: false }).limit(limit);
    return data ?? [];
  }
  const { count } = await q;
  return count ?? 0;
}

async function selectedAccounts(uid: string, ids?: string[]): Promise<Row[]> {
  let q = db.from("mail_desk_accounts").select("*").eq("user_id", uid);
  q = ids?.length ? q.in("id", ids) : q.eq("include_in_fetch", true);
  const { data } = await q.order("is_default", { ascending: false });
  return data ?? [];
}

/** What the person sees before paying. Free. */
async function quote(uid: string, body: Row) {
  const scope = String(body.scope ?? "new");
  const accts = await selectedAccounts(uid, body.account_ids);
  const rows: Row[] = [];
  const first: Row[] = [];
  let total = 0;
  for (const a of accts) {
    const floor = floorFor(a, scope);
    const n = floor == null ? 0 : (await pendingFor(uid, a.id, floor)) as number;
    rows.push({ account_id: a.id, email: a.email, mails: n, needs_scope: floor == null, connected: a.connected });
    total += n;
    if (!a.last_fetched_at && a.connected) {
      const options = [];
      for (const s of ["30d", "6m", "all"]) { const c = (await pendingFor(uid, a.id, floorFor(a, s)!)) as number; options.push({ scope: s, mails: c, credits: creditsForMails(c) }); }
      first.push({ account_id: a.id, email: a.email, options });
    }
  }
  // First-time accounts: one combined choice of how far back to read.
  const first_scopes = first.length ? ["30d", "6m", "all"].map((sc) => {
    const n = first.reduce((sum, f) => sum + (f.options.find((o: Row) => o.scope === sc)?.mails ?? 0), 0);
    return { scope: sc, mails: n, credits: creditsForMails(n) };
  }) : [];
  const balance = await walletBalance(uid);
  const credits = creditsForMails(total);
  return json({ accounts: rows, first_time: first, first_scopes, mails: total, credits, balance, balance_after: balance - credits, enough: balance >= credits, runs: Math.ceil(total / CHUNK) });
}

async function runAi(mails: Row[], acct: Row[], today: string) {
  const byAcct = new Map(acct.map((a) => [a.id, a]));
  // one call can have mails from several accounts; the reply language and sign-off come from each mail's account
  const first = byAcct.get(mails[0].account_id) ?? {};
  const payload = mails.map((m) => ({ id: m.id, from: `${m.from_name} <${m.from_email}>`, subject: m.subject, date: String(m.received_at).slice(0, 10), body: cleanBody(m.body || m.snippet || "") }));
  const sys = systemPrompt({ lang: first.reply_lang ?? "same", signOff: first.sign_off || first.display_name || "", today });
  const text = await chat([{ role: "system", content: sys }, { role: "user", content: JSON.stringify(payload) }], { model: AI_MODEL, json: true, maxTokens: 8000, temperature: 0.2 });
  return { results: parseAi(parseJson(text), payload.map((p) => p.id)), inChars: sys.length + JSON.stringify(payload).length, outChars: text.length, ids: payload.map((p) => p.id), payload };
}

/** Reads and sorts up to 25 mails and charges for them. One call = one wallet run. */
async function processChunk(uid: string, body: Row) {
  const scope = String(body.scope ?? "new");
  const accts = await selectedAccounts(uid, body.account_ids);
  const floors = new Map<string, string>();
  const candidates: Row[] = [];
  for (const a of accts) {
    const f = floorFor(a, scope);
    if (f == null) continue;
    floors.set(a.id, f);
    if (candidates.length < CHUNK) candidates.push(...(await pendingFor(uid, a.id, f, CHUNK - candidates.length)) as Row[]);
  }
  if (floors.size === 0) return fail(400, "needs_scope", { message: "Choose how far back to read." });
  if (!candidates.length) return await finishScope(uid, accts, floors, { processed: 0, remaining: 0 });

  // claim them so a second tab cannot read (and charge) the same mails
  const claim = crypto.randomUUID();
  const { data: claimed } = await db.from("mail_desk_mails").update({ claim_id: claim, claimed_at: new Date().toISOString() })
    .in("id", candidates.map((m) => m.id)).is("segmented_at", null).or(`claimed_at.is.null,claimed_at.lt.${STALE()}`).select("*");
  const mails = (claimed ?? []) as Row[];
  const release = () => db.from("mail_desk_mails").update({ claim_id: null, claimed_at: null }).eq("claim_id", claim).is("segmented_at", null);
  if (!mails.length) return json({ ok: true, processed: 0, remaining: -1, busy: true });

  const price = chunkPrice(mails.length)!;
  await ensurePrice(price.toolId, price.credits);
  let start;
  try { start = await startRun(uid, price.toolId); } catch (e) { await release(); console.error(e); return fail(503, "billing_unavailable", { message: "Billing is temporarily unavailable. You were not charged." }); }
  if (!start.ok) {
    await release();
    return fail(402, "insufficient_credits", { message: `This needs ${start.credits_required ?? price.credits} credits. You have ${start.balance ?? 0}.`, credits_required: start.credits_required, balance: start.balance });
  }
  const walletRun = start.run_id as string;
  const giveUp = async (msg: string, status = 502) => {
    await finishRun(uid, walletRun, false, msg).catch(() => undefined);
    await release();
    await db.from("mail_desk_runs").insert({ user_id: uid, tool_run_id: walletRun, tool_id: price.toolId, mails: mails.length, status: "failed", error: msg.slice(0, 300), account_ids: [...new Set(mails.map((m) => m.account_id))] });
    return fail(status, "run_failed", { message: "Something went wrong, so nothing was charged. Please try again.", charged: 0 });
  };

  try {
    const byAcct = new Map(accts.map((a) => [a.id, a]));
    const sorted = mails.map((m) => ({ m, s: sortMail({ labels: m.labels ?? [], list_unsub: !!m.list_unsub, precedence: m.precedence ?? "", from_email: m.from_email ?? "" }, !!byAcct.get(m.account_id)?.read_updates) }));
    const aiMails = sorted.filter((x) => x.s.useAI).map((x) => x.m);
    const results: ReturnType<typeof parseAi> = new Map();
    let inChars = 0, outChars = 0;
    if (aiMails.length) {
      // all mails in one call share one account's language and sign-off, so group by account
      const groups = new Map<string, Row[]>();
      for (const m of aiMails) groups.set(m.account_id, [...(groups.get(m.account_id) ?? []), m]);
      for (const [aid, group] of groups) {
        const accRow = byAcct.get(aid) ?? {};
        let attempt = await runAi(group, [accRow], new Date().toISOString().slice(0, 10));
        inChars += attempt.inChars; outChars += attempt.outChars;
        for (const [k, v] of attempt.results) results.set(k, v);
        const missing = group.filter((m: Row) => !results.has(m.id));
        if (missing.length) { // one retry for items the AI left out or got wrong
          attempt = await runAi(missing, [accRow], new Date().toISOString().slice(0, 10));
          inChars += attempt.inChars; outChars += attempt.outChars;
          for (const [k, v] of attempt.results) results.set(k, v);
        }
      }
    }

    let tasks = 0, drafts = 0, aiDone = 0;
    for (const { m, s } of sorted) {
      const r = results.get(m.id);
      const patch: Row = { kind: s.kind, run_id: walletRun };
      if (r) { patch.summary = r.summary; patch.reply_label = r.label; patch.ai_done = true; aiDone++; }
      const { error } = await db.from("mail_desk_mails").update(patch).eq("id", m.id);
      if (error) throw new Error(error.message);
      if (r) {
        const t = r.tasks.map((x) => ({ user_id: uid, account_id: m.account_id, mail_id: m.id, title: x.title, kind: x.kind, due: x.due }));
        if (r.reminder) t.push({ user_id: uid, account_id: m.account_id, mail_id: m.id, title: r.reminder.text, kind: "reminder", due: r.reminder.date });
        if (t.length) { await db.from("mail_desk_tasks").upsert(t, { onConflict: "mail_id,title", ignoreDuplicates: true }); tasks += t.length; }
        if (r.reply) { await db.from("mail_desk_drafts").upsert({ user_id: uid, mail_id: m.id, body: r.reply }, { onConflict: "mail_id", ignoreDuplicates: true }); drafts++; }
      }
    }

    // Charge. Only now, and only if everything above worked.
    const done = await finishRun(uid, walletRun, true);
    if (!done?.ok) { await release(); return fail(402, "insufficient_credits", { message: "Your credits ran out before this run finished. Nothing was charged." }); }
    for (let i = 0; ; i++) { // mark them done; retried because a failure here would mean they are charged again later
      const { error } = await db.from("mail_desk_mails").update({ segmented_at: new Date().toISOString() }).eq("claim_id", claim);
      if (!error) break;
      if (i >= 3) { console.error("mail-desk: charged but could not mark mails done", walletRun, error.message); break; }
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
    await db.from("mail_desk_runs").insert({
      user_id: uid, tool_run_id: walletRun, tool_id: price.toolId, mails: mails.length, mails_ai: aiDone, mails_free: mails.length - aiDone,
      credits_charged: done.charged ?? price.credits, est_ai_cost_inr: estimateCostInr(inChars, outChars), account_ids: [...new Set(mails.map((m) => m.account_id))],
    });

    let remaining = 0;
    for (const a of accts) { const f = floors.get(a.id); if (f != null) remaining += (await pendingFor(uid, a.id, f)) as number; }
    return await finishScope(uid, accts, floors, { processed: mails.length, remaining, credits_charged: done.charged ?? price.credits, mails_ai: aiDone, mails_free: mails.length - aiDone, tasks, drafts });
  } catch (e) {
    console.error("mail-desk process", e);
    return await giveUp(e instanceof Error ? e.message : String(e));
  }
}

/** When nothing is left to read in the chosen window, remember it, so the next fetch is only "new mails". */
async function finishScope(uid: string, accts: Row[], floors: Map<string, string>, out: Row) {
  if (out.remaining === 0) {
    for (const a of accts) {
      const f = floors.get(a.id);
      if (f != null) await db.from("mail_desk_accounts").update({ last_fetched_at: new Date().toISOString(), scope_floor: f }).eq("id", a.id);
    }
  }
  return json({ ok: true, balance: await walletBalance(uid), done: out.remaining === 0, ...out });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    if (req.method === "GET") return url.searchParams.has("code") || url.searchParams.has("error") ? await callback(url) : fail(404, "not_found");
    const caller = await identify(req);
    if (!caller?.userId) return fail(401, "sign_in_required", { message: "Please sign in to use Mail Desk." });
    const body = await req.json().catch(() => ({}));
    switch (body.action) {
      case "init": return await init(caller.userId);
      case "connect": return await connect(caller.userId);
      case "sync": return await sync(caller.userId, body);
      case "quote": return await quote(caller.userId, body);
      case "process": return await processChunk(caller.userId, body);
      default: return fail(400, "unknown_action");
    }
  } catch (e) {
    console.error("mail-desk", e);
    return fail(500, "server_error", { message: e instanceof Error ? e.message : String(e) });
  }
});
