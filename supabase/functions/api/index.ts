// Public Ezyourlife API, version 1. Used by the EzMe Mac app, the browser extension and outside developers.
//
//   GET    /v1/apps?q=&category=&limit=&offset=   search the live catalogue (free)
//   GET    /v1/apps/{id}                           one app, with the inputs it takes (free)
//   POST   /v1/apps/{id}/run                       run it; charged the app's price on success
//   POST   /v1/prompt/improve                      PromptMaster "magic write"; charged PromptMaster's price
//   POST   /v1/prompt/brainstorm                   PromptMaster brainstorm; charged PromptMaster's price
//   GET    /v1/cards?q=                            card, invite and website designs (open on the site)
//   POST   /v1/cards                               publish a card page (charged at the product's price)
//   GET    /v1/shortcuts   PUT /v1/shortcuts   DELETE /v1/shortcuts/{key}   the person's synced shortcuts
//   GET    /v1/wallet                              balance and the last charges
//   POST   /v1/wallet/topup                        a checkout link for a credit pack
//   GET    /v1/keys   POST /v1/keys   DELETE /v1/keys/{id}   API keys (signed-in session only)
//   GET    /v1/me                                  who the key or session belongs to
//   POST   /v1/command                             {text}: picks the app and fills its boxes from one sentence (free, runs nothing)
//
// Auth: "Authorization: Bearer <token>", where the token is either an ezyourlife.com sign-in token
// or an API key "ezy_live_…". Either way the person's own wallet pays, at the same prices as the website.
// Charging uses the same start_tool_run / complete_tool_run as every other app, so failed runs cost nothing.
import { corsHeaders as baseCors } from "../_shared/http.ts";
import { writeSharePage } from "../_shared/sharepage.ts";
import { ensurePrice, finishRun, startRun, walletBalance } from "../_shared/billing.ts";
import { API_CATALOG, type ApiApp, type ApiField } from "../_shared/apiCatalog.ts";
import { NATIVE_APPS, nativeOutput } from "../_shared/nativeApis.ts";

/** Every app the API can run: the shared-engine apps plus the older apps with their own function. */
const APPS: Record<string, ApiApp> = {
  ...API_CATALOG,
  ...Object.fromEntries(Object.entries(NATIVE_APPS).map(([id, n]) => [id, {
    runner: "ai-app", mode: n.mode, engine: "native", kind: n.isImage ? "image" : "doc", charge: n.charge || id,
    credits: n.credits, intro: n.intro, cta: n.cta, fields: n.fields,
  } as ApiApp])),
};
import { chat, parseJson } from "../_shared/llm.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE = "https://ezyourlife.com";
const PROMPTMASTER_ID = "promptmaster-ai";
const PROMPTMASTER_CREDITS = 2;
const KEY_PREFIX = "ezy_live_";
const PACKS: Record<string, { inr: number; credits: number }> = {
  p10: { inr: 10, credits: 15 },
  p50: { inr: 50, credits: 80 },
  p100: { inr: 100, credits: 180 },
  p250: { inr: 250, credits: 500 },
  p500: { inr: 500, credits: 1100 },
  p1000: { inr: 1000, credits: 2200 },
};

const cors: Record<string, string> = {
  ...baseCors,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
const fail = (status: number, error: string, message: string, extra: Record<string, unknown> = {}) =>
  json({ ok: false, error, message, ...extra }, status);

// ---------- database (service role, PostgREST) ----------

async function db(pathAndQuery: string, init: RequestInit = {}): Promise<Response> {
  return await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}
async function dbRows<T>(pathAndQuery: string): Promise<T[]> {
  const r = await db(pathAndQuery);
  if (!r.ok) throw new Error(`db ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()) as T[];
}
const enc = encodeURIComponent;

// ---------- who is calling ----------

interface ApiKeyRow { id: string; user_id: string; daily_cap: number; allowed_tools: string[] | null; revoked_at: string | null }
interface Who { userId: string; key: ApiKeyRow | null; session: boolean }

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function identify(req: Request): Promise<Who | null> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim()
    || (req.headers.get("x-api-key") ?? "").trim();
  if (!token || token === SERVICE_ROLE) return null;
  if (token.startsWith(KEY_PREFIX)) {
    const rows = await dbRows<ApiKeyRow>(
      `api_keys?key_hash=eq.${await sha256(token)}&select=id,user_id,daily_cap,allowed_tools,revoked_at`,
    ).catch(() => []);
    const key = rows[0];
    if (!key || key.revoked_at) return null;
    db(`api_keys?id=eq.${key.id}`, { method: "PATCH", body: JSON.stringify({ last_used_at: new Date().toISOString() }) }).catch(() => null);
    return { userId: key.user_id, key, session: false };
  }
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: SERVICE_ROLE } });
  if (!r.ok) return null;
  const u = (await r.json()) as { id?: string };
  return u?.id ? { userId: u.id, key: null, session: true } : null;
}

/** Credits this key has spent in the last 24 hours. */
async function spentToday(keyId: string): Promise<number> {
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const rows = await dbRows<{ credits: number }>(`api_key_runs?key_id=eq.${keyId}&created_at=gte.${enc(since)}&select=credits`).catch(() => []);
  return rows.reduce((n, r) => n + (r.credits ?? 0), 0);
}

// ---------- catalogue ----------

interface CatalogRow {
  id: string; name: string; description: string | null; category: string; tool_types: string[] | null;
  icon_url: string | null; dedicated_route: string | null; is_free: boolean | null; display_order: number | null;
}
const CATALOG_COLS = "id,name,description,category,tool_types,icon_url,dedicated_route,is_free,display_order";
let catalogCache: { at: number; rows: CatalogRow[]; prices: Map<string, number>; colors: Map<string, string> } | null = null;

const GOAL_COLORS: Record<string, string> = {
  "Get customers": "pink", "Run your business": "sun", "Photos & content": "teal",
  "Smart helpers": "sky", "Learn & grow": "lime", "More apps": "coral",
};

async function catalog() {
  if (catalogCache && Date.now() - catalogCache.at < 600_000) return catalogCache;
  const [rows, prices, cats] = await Promise.all([
    dbRows<CatalogRow>(`tools_catalog?is_live=eq.true&select=${CATALOG_COLS}&order=display_order.asc.nullslast,name.asc&limit=5000`),
    dbRows<{ tool_id: string; credit_cost: number }>("tool_pricing?select=tool_id,credit_cost&limit=5000"),
    dbRows<{ name: string; goal: string | null }>("catalog_categories?select=name,goal&limit=500").catch(() => []),
  ]);
  const colors = new Map<string, string>();
  for (const c of cats) colors.set(c.name, GOAL_COLORS[c.goal ?? ""] ?? "coral");
  catalogCache = { at: Date.now(), rows, prices: new Map(prices.map((p) => [p.tool_id, p.credit_cost])), colors };
  return catalogCache;
}

function priceFor(id: string, spec: ApiApp | undefined, prices: Map<string, number>): number | null {
  if (id === PROMPTMASTER_ID) return prices.get(id) ?? PROMPTMASTER_CREDITS;
  const charge = spec?.charge ?? id;
  return prices.get(charge) ?? spec?.credits ?? null;
}

function summary(row: CatalogRow, c: Awaited<ReturnType<typeof catalog>>) {
  const spec = APPS[row.id];
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    category: row.category,
    goal_color: c.colors.get(row.category) ?? "coral",
    types: row.tool_types ?? [],
    icon_url: row.icon_url,
    credits: priceFor(row.id, spec, c.prices),
    runnable: !!spec || row.id === PROMPTMASTER_ID,
    mode: spec?.mode ?? (row.id === PROMPTMASTER_ID ? "prompt" : "web"),
    url: `${SITE}${row.dedicated_route ?? `/tool/${row.id}`}`,
  };
}

/** Word-overlap ranking: name hits count most, then types, category and description. */
function score(row: CatalogRow, words: string[]): number {
  if (!words.length) return 1;
  const name = row.name.toLowerCase(), desc = (row.description ?? "").toLowerCase();
  const types = (row.tool_types ?? []).join(" ").toLowerCase(), cat = row.category.toLowerCase();
  let s = 0;
  for (const w of words) {
    if (name.startsWith(w)) s += 6;
    else if (name.split(/[^a-z0-9ऀ-ॿ]+/).some((part) => part.startsWith(w))) s += 5;
    else if (name.includes(w)) s += 3;
    if (types.includes(w)) s += 2;
    if (cat.includes(w)) s += 1.5;
    if (desc.includes(w)) s += 1;
  }
  return s;
}

async function listApps(url: URL) {
  const c = await catalog();
  const words = (url.searchParams.get("q") ?? "").toLowerCase().split(/[^a-z0-9ऀ-ॿ]+/).filter((w) => w.length > 1);
  const category = url.searchParams.get("category");
  const runnableOnly = url.searchParams.get("runnable") === "true";
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 50) || 50));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0) || 0);
  let rows = c.rows.filter((r) => !category || r.category === category);
  if (runnableOnly) rows = rows.filter((r) => APPS[r.id] || r.id === PROMPTMASTER_ID);
  const ranked = rows.map((r) => ({ r, s: score(r, words) })).filter((x) => x.s > 0);
  if (words.length) ranked.sort((a, b) => b.s - a.s);
  return json({
    ok: true,
    total: ranked.length,
    apps: ranked.slice(offset, offset + limit).map((x) => summary(x.r, c)),
    categories: [...new Set(c.rows.map((r) => r.category))].sort().map((name) => ({ name, goal_color: c.colors.get(name) ?? "coral" })),
  });
}

async function getApp(id: string) {
  const c = await catalog();
  const row = c.rows.find((r) => r.id === id);
  if (!row) return fail(404, "unknown_app", `No live app called '${id}'.`);
  const spec = APPS[id];
  const base = summary(row, c);
  if (id === PROMPTMASTER_ID) {
    return json({ ok: true, app: { ...base, actions: ["improve", "brainstorm"], fields: [{ key: "prompt", label: "Your words", type: "textarea", required: true }] } });
  }
  return json({
    ok: true,
    app: {
      ...base,
      intro: spec?.intro ?? row.description ?? "",
      cta: spec?.cta,
      fields: spec?.fields ?? [],
      sample: spec?.sample,
      prompt_label: spec?.promptLabel,
      styles: spec?.styles,
      aspects: spec?.aspects,
      suggestions: spec?.suggestions,
      variants: spec?.variants,
    },
  });
}

// ---------- running ----------

async function callInternal(fn: string, payload: Record<string, unknown>): Promise<{ status: number; data: Record<string, unknown> }> {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE_ROLE}`, apikey: SERVICE_ROLE, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await r.text();
  let data: Record<string, unknown>;
  try {
    const parsed = JSON.parse(text);
    data = Array.isArray(parsed) ? { output: parsed } : parsed;
  } catch {
    data = { output: text };
  }
  return { status: r.status, data };
}

/** Charges `chargeId` around `work`, exactly like billed() does for the website. */
async function charged(
  who: Who, chargeId: string, defaultCredits: number, isImage: boolean, appId: string,
  work: () => Promise<{ status: number; data: Record<string, unknown> }>,
): Promise<Response> {
  if (who.key) {
    if (who.key.allowed_tools?.length && !who.key.allowed_tools.includes(appId)) {
      return fail(403, "app_not_allowed", "This API key is not allowed to run this app.");
    }
    const c = await catalog();
    const price = c.prices.get(chargeId) ?? defaultCredits;
    if ((await spentToday(who.key.id)) + price > who.key.daily_cap) {
      return fail(429, "daily_cap", `This key's daily limit of ${who.key.daily_cap} credits is reached.`);
    }
  }
  await ensurePrice(chargeId, defaultCredits, isImage);
  let start;
  try {
    start = await startRun(who.userId, chargeId);
  } catch (e) {
    console.error("api billing start", e);
    return fail(503, "billing_unavailable", "Billing is busy. You were not charged.");
  }
  if (!start.ok) {
    return fail(402, "insufficient_credits", `This needs ${start.credits_required ?? "more"} credits. You have ${start.balance ?? 0}.`, {
      credits_required: start.credits_required,
      balance: start.balance,
      topup_url: `${SITE}/credits`,
    });
  }
  const runId = start.run_id as string;
  let result: { status: number; data: Record<string, unknown> };
  try {
    result = await work();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await finishRun(who.userId, runId, false, msg).catch(() => undefined);
    return fail(500, "failed", msg, { credits_charged: 0 });
  }
  if (result.status < 200 || result.status >= 300 || result.data?.error) {
    await finishRun(who.userId, runId, false, String(result.data?.error ?? `status ${result.status}`)).catch(() => undefined);
    const status = result.status >= 400 ? result.status : 502;
    return fail(status, "failed", String(result.data?.message ?? result.data?.error ?? "The app could not finish."), { credits_charged: 0 });
  }
  let chargedCredits = 0;
  try {
    chargedCredits = (await finishRun(who.userId, runId, true))?.charged ?? 0;
  } catch (e) {
    console.error("api billing finish", e);
  }
  if (who.key) {
    db("api_key_runs", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ key_id: who.key.id, user_id: who.userId, tool_id: appId, run_id: runId, credits: chargedCredits }),
    }).catch(() => null);
  }
  const { ok: _ok, ...rest } = result.data;
  return json({ ok: true, ...rest, run_id: runId, credits_charged: chargedCredits, balance: await walletBalance(who.userId) });
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);

/**
 * Content Workflow in one go: idea, then the post, hashtags and caption. Each step is one
 * "content-workflow-step" run at its usual price, exactly as the website charges the four steps.
 */
async function runWorkflow(who: Who, body: Record<string, unknown>) {
  const raw = typeof body.inputs === "object" && body.inputs ? body.inputs as Record<string, unknown> : {};
  const platform = String(raw.platform ?? "Instagram").slice(0, 60);
  const niche = String(raw.niche ?? body.prompt ?? "").slice(0, 500).trim();
  if (!niche) return fail(400, "missing_inputs", "Add: Niche or topic.");
  let spent = 0;
  const step = async (type: string, extra: Record<string, unknown>) => {
    const res = await charged(who, "content-workflow-step", 4, false, "content-workflow", () => callInternal("content-generator", { type, platform, ...extra }));
    const data = await res.json();
    if (!data.ok) throw new Error(String(data.message ?? "A step failed."));
    spent += Number(data.credits_charged ?? 0);
    return data as Record<string, unknown>;
  };
  try {
    const ideaRes = await step("workflow-idea", { niche });
    const idea = (ideaRes.idea ?? {}) as { title?: string; hook?: string; format?: string };
    const ideaText = [idea.title, idea.hook].filter(Boolean).join(" — ") || niche;
    const format = idea.format ?? "Post";
    const contentRes = await step("workflow-content", { format, idea: ideaText });
    const content = String(contentRes.content ?? "");
    const tagsRes = await step("workflow-hashtags", { count: 15, topic: ideaText });
    const tags = (Array.isArray(tagsRes.hashtags) ? tagsRes.hashtags : []).map(String);
    const capRes = await step("workflow-caption", { idea: ideaText, content, hashtags: tags });
    const caption = String(capRes.caption ?? capRes.content ?? "");
    const output = `## Idea\n**${idea.title ?? niche}**${idea.hook ? `\nHook: ${idea.hook}` : ""}\nFormat: ${format}\n\n## Post\n${content}\n\n## Caption\n${caption}\n\n## Hashtags\n${tags.join(" ")}`;
    return json({ ok: true, output, credits_charged: spent, balance: await walletBalance(who.userId) });
  } catch (e) {
    return fail(502, "failed", `${e instanceof Error ? e.message : String(e)} (charged ${spent} credits for the steps that finished)`, { credits_charged: spent });
  }
}

async function runApp(who: Who, id: string, body: Record<string, unknown>) {
  if (id === "content-workflow") return runWorkflow(who, body);
  if (NATIVE_APPS[id]) return runNative(who, id, body);
  const spec = API_CATALOG[id];
  if (id === PROMPTMASTER_ID) return improve(who, body);
  if (!spec) {
    const c = await catalog();
    const row = c.rows.find((r) => r.id === id);
    if (!row) return fail(404, "unknown_app", `No live app called '${id}'.`);
    return fail(409, "web_only", "This app runs only on the website.", { url: `${SITE}${row.dedicated_route ?? `/tool/${id}`}` });
  }
  const payload: Record<string, unknown> = {
    tool_id: id,
    inputs: typeof body.inputs === "object" && body.inputs ? body.inputs : undefined,
    messages: Array.isArray(body.messages) ? body.messages : undefined,
    context: str(body.context, 120_000),
    images: Array.isArray(body.images) ? body.images : undefined,
    prompt: str(body.prompt, 2000),
    style: str(body.style, 200),
    aspect: str(body.aspect, 10),
    previous: str(body.previous, 24_000),
    instruction: str(body.instruction, 1000),
  };
  if (spec.runner === "tracker") return addTrackerEntry(who, id, spec, body);
  if (spec.mode === "coach") return coachTurn(who, id, spec, body, payload);
  if (spec.runner === "flagship-app") {
    payload.action = spec.mode === "studio" ? "variant" : "final";
    payload.variant = str(body.variant, 80);
  } else if (body.action === "refine") {
    payload.action = "refine";
  }
  return charged(who, spec.charge, spec.credits, spec.kind === "image", id, () => callInternal(spec.runner, payload));
}

/** Adds one entry to the person's own log for a tracker app (the same saved copy the website uses). */
async function addTrackerEntry(who: Who, id: string, spec: ApiApp, body: Record<string, unknown>) {
  const raw = typeof body.inputs === "object" && body.inputs ? body.inputs as Record<string, unknown> : {};
  const row: Record<string, string> = { id: crypto.randomUUID() };
  for (const f of spec.fields ?? []) {
    const v = raw[f.key];
    const text = typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
    row[f.key] = (text || (f.type === "date" ? new Date().toISOString().slice(0, 10) : f.options?.[0] ?? "")).slice(0, 2000);
  }
  const missing = (spec.fields ?? []).filter((f) => f.required && !row[f.key]).map((f) => f.label);
  if (missing.length) return fail(400, "missing_inputs", `Add: ${missing.join(", ")}.`);
  const c = await catalog();
  const name = c.rows.find((r) => r.id === id)?.name ?? "your log";
  return charged(who, spec.charge, spec.credits, false, id, async () => {
    const found = await dbRows<{ session_data: Record<string, unknown> | null }>(
      `tool_sessions?user_id=eq.${who.userId}&tool_id=eq.${enc(id)}&select=session_data`,
    );
    const data = (found[0]?.session_data ?? {}) as { rows?: Record<string, string>[]; settings?: unknown };
    const rows = [row, ...(Array.isArray(data.rows) ? data.rows : [])].slice(0, 5000);
    const r = await db("tool_sessions?on_conflict=user_id,tool_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ user_id: who.userId, tool_id: id, session_data: { ...data, rows, settings: data.settings ?? {}, savedAt: Date.now() } }),
    });
    if (!r.ok) return { status: 502, data: { error: "save_failed", message: "Couldn't save the entry. Try again." } };
    const shown = (spec.fields ?? []).filter((f) => row[f.key]).slice(0, 4).map((f) => `${f.label}: ${row[f.key]}`).join(", ");
    return { status: 200, data: { output: `✓ Added to ${name}: ${shown}. ${rows.length} ${spec.itemName ?? "entr"}${rows.length === 1 ? "y" : "ies"} saved. See them all at ${SITE}/tool/${id}` } };
  });
}

/**
 * Coaching apps, one message at a time. "start" opens a paid session (its usual price) and gives the first
 * reply plus a ticket; later turns send the ticket and the conversation so far and are free, as on the website.
 * "wrap" closes the session with its scored summary.
 */
async function coachTurn(who: Who, id: string, spec: ApiApp, body: Record<string, unknown>, payload: Record<string, unknown>) {
  const action = body.action === "turn" || body.action === "wrap" ? body.action : "start";
  const call = { ...payload, action, ticket: str(body.ticket, 2000), user_id: who.userId };
  if (action === "start") return charged(who, spec.charge, spec.credits, false, id, () => callInternal("flagship-app", call));
  const r = await callInternal("flagship-app", call);
  if (r.status < 200 || r.status >= 300 || r.data?.error) {
    return fail(r.status >= 400 ? r.status : 502, String(r.data?.error ?? "failed"), String(r.data?.message ?? r.data?.error ?? "The coach could not answer."));
  }
  return json({ ok: true, output: r.data.output });
}

/** Charges a photo tool that ran on the phone, at its website price (1 credit unless set otherwise). */
async function chargeDevice(who: Who, id: string) {
  const app = NATIVE_APPS[id];
  if (!app || app.mode !== "device") return fail(404, "not_a_device_app", "Only photo tools that run on the phone are charged this way.");
  return charged(who, id, app.credits, false, id, async () => ({ status: 200, data: { output: "" } }));
}

/** Runs one of the older apps that has its own server function (see _shared/nativeApis.ts). */
async function runNative(who: Who, id: string, body: Record<string, unknown>) {
  const app = NATIVE_APPS[id];
  if (app.mode === "device") {
    return fail(409, "runs_on_device", "This photo tool runs on the phone (EZYOURLIFE keyboard) or the website, not on the server.", { url: `${SITE}/tool/${id}` });
  }
  const raw = typeof body.inputs === "object" && body.inputs ? body.inputs as Record<string, unknown> : {};
  const inputs: Record<string, string> = {};
  for (const f of app.fields) {
    const v = raw[f.key];
    if (typeof v === "string" && v.trim()) inputs[f.key] = v.slice(0, f.type === "image" ? 14_000_000 : 30_000);
    else if (typeof v === "number") inputs[f.key] = String(v);
    else if (f.default) inputs[f.key] = f.default;
  }
  if (typeof body.prompt === "string" && !inputs[app.fields[0].key]) inputs[app.fields[0].key] = body.prompt.slice(0, 30_000);
  const missing = app.fields.filter((f) => f.required && !inputs[f.key]).map((f) => f.label);
  if (missing.length) return fail(400, "missing_inputs", `Add: ${missing.join(", ")}.`);
  const payload = app.build(inputs);

  if (app.selfCharging) {
    // The function charges per item from this person's wallet; keep the key's own limits.
    if (who.key) {
      if (who.key.allowed_tools?.length && !who.key.allowed_tools.includes(id)) {
        return fail(403, "app_not_allowed", "This API key is not allowed to run this app.");
      }
      const c = await catalog();
      const items = Array.isArray(payload.angles) ? payload.angles.length : 6;
      const price = (c.prices.get(app.charge) ?? app.credits) * items;
      if ((await spentToday(who.key.id)) + price > who.key.daily_cap) {
        return fail(429, "daily_cap", `This key's daily limit of ${who.key.daily_cap} credits is reached.`);
      }
    }
    const r = await callInternal(app.fn, { ...payload, user_id: who.userId });
    if (r.status < 200 || r.status >= 300 || r.data?.error) {
      return fail(r.status >= 400 ? r.status : 502, String(r.data?.error ?? "failed"), String(r.data?.message ?? r.data?.error ?? "The app could not finish."), { credits_charged: 0 });
    }
    const out = nativeOutput(id, r.data);
    if (who.key) {
      db("api_key_runs", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ key_id: who.key.id, user_id: who.userId, tool_id: id, credits: Number(out.credits_charged ?? 0) }),
      }).catch(() => null);
    }
    return json({ ok: true, ...out, balance: await walletBalance(who.userId) });
  }

  return charged(who, app.charge, app.credits, !!app.isImage, id, async () => {
    const r = await callInternal(app.fn, payload);
    if (r.status < 200 || r.status >= 300 || r.data?.error) return r;
    return { status: r.status, data: nativeOutput(id, r.data) };
  });
}

async function improve(who: Who, body: Record<string, unknown>) {
  const prompt = str(body.prompt, 4000)?.trim();
  if (!prompt) return fail(400, "missing_prompt", "Send the words to improve as 'prompt'.");
  const goal = str(body.goal, 500);
  return charged(who, PROMPTMASTER_ID, PROMPTMASTER_CREDITS, false, PROMPTMASTER_ID, () =>
    callInternal("promptmaster-ai", { action: "magic_write", format: str(body.format, 20) ?? "text", keywords: goal ? `${prompt}\n\nGoal: ${goal}` : prompt }));
}

async function brainstorm(who: Who, body: Record<string, unknown>) {
  const topic = str(body.topic ?? body.prompt, 4000)?.trim();
  if (!topic) return fail(400, "missing_topic", "Send what to brainstorm about as 'topic'.");
  const styles = Array.isArray(body.styles) ? body.styles.slice(0, 20).map((s) => String(s).slice(0, 100)) : [];
  return charged(who, PROMPTMASTER_ID, PROMPTMASTER_CREDITS, false, PROMPTMASTER_ID, () =>
    callInternal("promptmaster-ai", { action: "brainstorm", format: str(body.format, 20) ?? "text", context: topic, selections: styles }));
}

// ---------- cards, shortcuts, wallet, keys ----------

async function listCards(url: URL) {
  const q = (url.searchParams.get("q") ?? "").trim();
  const filter = q ? `&or=(name.ilike.*${enc(q)}*,category.ilike.*${enc(q)}*)` : "";
  const rows = await dbRows<{ id: string; family: string | null; category: string | null; name: string; price_inr: number | null; price_credits: number | null }>(
    `ip_products?is_active=eq.true&select=id,family,category,name,price_inr,price_credits&order=sort.asc.nullslast&limit=300${filter}`,
  ).catch(() => []);
  return json({
    ok: true,
    cards: rows.map((r) => ({
      id: r.id, name: r.name, family: r.family, category: r.category,
      price_inr: r.price_inr, price_credits: r.price_credits,
      url: `${SITE}/create/${r.id}`,
    })),
  });
}

/** Publishes a card/invite page, charges the product's credits, returns a shareable link. */
async function publishCard(who: Who, body: Record<string, unknown>): Promise<Response> {
  const productId = str(body.product_id, 100)?.trim();
  if (!productId) return fail(400, "missing_product_id", "Send a product_id.");

  const products = await dbRows<{ id: string; name: string; price_credits: number | null; price_inr: number | null }>(
    `ip_products?id=eq.${enc(productId)}&is_active=eq.true&select=id,name,price_credits,price_inr&limit=1`,
  ).catch(() => []);
  if (!products.length) return fail(404, "unknown_product", `No active card product '${productId}'.`);
  const product = products[0];

  const variantId = str(body.variant_id, 100)?.trim() ?? productId;

  const rawContent = typeof body.content === "object" && body.content ? body.content as Record<string, unknown> : {};
  const content: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rawContent)) {
    const key = String(k).slice(0, 60);
    if (typeof v === "string") content[key] = v.slice(0, 10_000);
    else if (typeof v === "number" || typeof v === "boolean") content[key] = v;
    else if (Array.isArray(v)) content[key] = (v as unknown[]).slice(0, 50).map((item) => (typeof item === "string" ? item.slice(0, 2000) : item));
  }

  const creditsPrice = product.price_credits ?? Math.ceil(Math.max(1, (product.price_inr ?? 10)) * 2.2);
  const chargeId = `card-${productId}`;

  return charged(who, chargeId, creditsPrice, false, chargeId, async () => {
    const recipient = str(rawContent.recipient, 60)?.trim();
    const sender = str(rawContent.sender, 60)?.trim();
    const title = recipient ? `${product.name} for ${recipient}` : sender ? `${product.name} from ${sender}` : product.name;

    const pagesRes = await db("ip_pages?select=id", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ owner_id: who.userId, product_id: productId, variant_id: variantId, title, content }),
    });
    if (!pagesRes.ok) {
      const errText = await pagesRes.text().catch(() => "");
      return { status: 500, data: { error: "create_failed", message: `Could not create card: ${errText.slice(0, 100)}` } };
    }
    const [page] = (await pagesRes.json()) as { id: string }[];

    const pubRes = await db("rpc/ip_publish_page", { method: "POST", body: JSON.stringify({ _page_id: page.id }) });
    const pub = pubRes.ok ? (await pubRes.json() as { ok?: boolean; slug?: string; reason?: string }) : {};
    if (!pubRes.ok || !pub?.ok) {
      return { status: 500, data: { error: "publish_failed", message: pub?.reason ?? "Could not publish the card." } };
    }

    const slug = pub.slug as string;
    const link = `https://ezyourlife.com/p/${encodeURIComponent(slug)}`;

    writeSharePage({ slug, title, description: `${product.name} — shared with EZYOURLIFE`, indexable: false }).catch(
      (e: unknown) => console.warn("share page write failed", e),
    );

    return { status: 200, data: { output: link, link, slug, card_name: product.name } };
  });
}

// The shared business profile (business name, city, GSTIN…) that prefills app boxes on the site. Read only.
const PROFILE_KEYS = ["businessName", "ownerName", "industry", "city", "state", "phone", "email", "address", "gstin", "website", "products", "audience", "tone", "language"];
/** The person's saved business details (the website's workspace profile: name, GSTIN, address…). */
async function loadProfile(userId: string): Promise<Record<string, string>> {
  const rows = await dbRows<{ session_data: { profile?: Record<string, unknown> } | null }>(
    `tool_sessions?user_id=eq.${userId}&tool_id=eq._workspace&select=session_data`,
  );
  const raw = rows[0]?.session_data?.profile ?? {};
  const profile: Record<string, string> = {};
  for (const k of PROFILE_KEYS) {
    const v = raw[k];
    if (typeof v === "string" && v.trim()) profile[k] = v.trim().slice(0, 500);
  }
  return profile;
}
async function readProfile(who: Who) {
  return json({ ok: true, profile: await loadProfile(who.userId) });
}

interface Shortcut { key: string; value: string; category?: string; logic?: string }
async function readShortcuts(userId: string): Promise<{ list: Shortcut[]; exists: boolean; editor: string }> {
  const rows = await dbRows<{ session_shortcuts: Shortcut[] | null; editor_content: string | null }>(
    `notebook_sessions?user_id=eq.${userId}&select=session_shortcuts,editor_content`,
  );
  return { list: Array.isArray(rows[0]?.session_shortcuts) ? rows[0].session_shortcuts as Shortcut[] : [], exists: !!rows[0], editor: rows[0]?.editor_content ?? "" };
}
async function writeShortcuts(userId: string, list: Shortcut[], editor: string) {
  const r = await db("notebook_sessions?on_conflict=user_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: userId, session_shortcuts: list, editor_content: editor }),
  });
  if (!r.ok) throw new Error(`save shortcuts ${r.status}: ${(await r.text()).slice(0, 200)}`);
}
function cleanShortcut(s: unknown): Shortcut | null {
  const o = s as Record<string, unknown>;
  const key = str(o?.key, 64)?.trim(), value = str(o?.value, 20_000);
  if (!key || value === undefined) return null;
  const out: Shortcut = { key, value };
  const cat = str(o.category, 64), logic = str(o.logic, 500);
  if (cat) out.category = cat;
  if (logic) out.logic = logic;
  return out;
}

async function putShortcuts(who: Who, body: Record<string, unknown>) {
  const cur = await readShortcuts(who.userId);
  const incoming = (Array.isArray(body.shortcuts) ? body.shortcuts : [body]).map(cleanShortcut).filter((s): s is Shortcut => !!s).slice(0, 2000);
  if (!incoming.length) return fail(400, "bad_shortcut", "Send {key, value} or {shortcuts: [{key, value}, …]}.");
  const list = body.replace === true ? incoming : [...cur.list];
  if (body.replace !== true) {
    for (const s of incoming) {
      const i = list.findIndex((x) => x.key === s.key);
      if (i >= 0) list[i] = { ...list[i], ...s };
      else list.push(s);
    }
  }
  await writeShortcuts(who.userId, list, cur.editor);
  return json({ ok: true, total: list.length });
}

async function wallet(who: Who) {
  const [w, ledger] = await Promise.all([
    dbRows<{ free_balance: number; paid_balance: number; promo_balance: number | null }>(
      `credit_wallets?user_id=eq.${who.userId}&select=free_balance,paid_balance,promo_balance`,
    ),
    dbRows<{ delta: number; reason: string | null; tool_id: string | null; created_at: string }>(
      `credit_ledger?user_id=eq.${who.userId}&select=delta,reason,tool_id,created_at&order=created_at.desc&limit=50`,
    ).catch(() => []),
  ]);
  const row = w[0] ?? { free_balance: 0, paid_balance: 0, promo_balance: 0 };
  return json({
    ok: true,
    balance: (row.free_balance ?? 0) + (row.paid_balance ?? 0),
    free: row.free_balance ?? 0,
    paid: row.paid_balance ?? 0,
    promo: row.promo_balance ?? 0,
    recent: ledger,
    packs: Object.entries(PACKS).map(([id, p]) => ({ id, ...p })),
  });
}

function topup(body: Record<string, unknown>) {
  const pack = str(body.pack_id, 20) ?? "p250";
  if (!PACKS[pack]) return fail(400, "unknown_pack", `Packs: ${Object.keys(PACKS).join(", ")}.`);
  return json({ ok: true, pack_id: pack, ...PACKS[pack], checkout_url: `${SITE}/credits?pack=${pack}` });
}

async function listKeys(who: Who) {
  const rows = await dbRows(`api_keys?user_id=eq.${who.userId}&revoked_at=is.null&select=id,name,app,prefix,daily_cap,allowed_tools,created_at,last_used_at&order=created_at.desc`);
  return json({ ok: true, keys: rows });
}

async function createKey(who: Who, body: Record<string, unknown>) {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const secret = KEY_PREFIX + [...bytes].map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 40);
  const app = str(body.app, 40)?.replace(/[^a-z0-9_-]/gi, "") || null;
  const row = {
    user_id: who.userId,
    name: str(body.name, 80)?.trim() || (app ? `${app} on my Mac` : "API key"),
    app,
    prefix: secret.slice(0, 13),
    key_hash: await sha256(secret),
    daily_cap: Math.min(100_000, Math.max(1, Number(body.daily_cap) || 500)),
    allowed_tools: Array.isArray(body.allowed_tools) ? body.allowed_tools.slice(0, 500).map((t) => String(t).slice(0, 120)) : null,
  };
  const r = await db("api_keys?select=id,name,app,prefix,daily_cap,created_at", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) });
  if (!r.ok) return fail(500, "failed", `Could not make the key (${r.status}).`);
  const [saved] = await r.json();
  return json({ ok: true, key: secret, ...saved, note: "Copy the key now: it is shown only once." }, 201);
}

async function revokeKey(who: Who, id: string) {
  const r = await db(`api_keys?id=eq.${enc(id)}&user_id=eq.${who.userId}`, { method: "PATCH", body: JSON.stringify({ revoked_at: new Date().toISOString() }) });
  return r.ok ? json({ ok: true }) : fail(500, "failed", "Could not revoke the key.");
}

// ---------- one-sentence commands (iPhone keyboard, Siri, EzMe) ----------

// "invoice for Rahul, 5000 rupees" -> the best app and its boxes filled in. Nothing is run and nothing is
// charged here: the caller shows the app and its price, and runs it with POST /apps/{id}/run after a tap.
// One small Flash-Lite call per command. A soft per-person limit keeps a stuck client from looping.
const COMMAND_DAILY_LIMIT = 300;
const commandCounts = new Map<string, { day: string; n: number }>();

async function planCommand(who: Who, body: Record<string, unknown>) {
  const text = str(body.text, 1000)?.trim();
  if (!text) return fail(400, "missing_text", "Send what you need as 'text'.");
  const day = new Date().toISOString().slice(0, 10);
  const used = commandCounts.get(who.userId);
  const n = used?.day === day ? used.n + 1 : 1;
  commandCounts.set(who.userId, { day, n });
  if (n > COMMAND_DAILY_LIMIT) return fail(429, "daily_limit", "That's a lot of commands today. Try again tomorrow.");

  const [c, profile] = await Promise.all([catalog(), loadProfile(who.userId).catch(() => ({} as Record<string, string>))]);
  const words = text.toLowerCase().split(/[^a-z0-9ऀ-ॿ]+/).filter((w) => w.length > 1);
  const wanted = str(body.app_id, 120);
  let rows = c.rows.filter((r) => APPS[r.id]);
  if (wanted) rows = rows.filter((r) => r.id === wanted);
  let ranked = rows.map((r) => ({ r, s: score(r, words) })).filter((x) => wanted || x.s > 0).sort((a, b) => b.s - a.s).slice(0, 8);
  // A problem said in plain words ("GST notice aaya hai, kya karu", "naukri ke liye kuch chahiye") rarely contains an
  // app's name. When the words match weakly, one small call turns the problem into the jobs that would solve it,
  // and those words search the catalogue again, so the best app still comes up.
  if (!wanted && (ranked.length < 3 || (ranked[0]?.s ?? 0) < 12 || words.length >= 4)) {
    try {
      const out = await chat([
        {
          role: "system",
          content:
            "A person describes a problem or a need, in English, Hindi, Hinglish or another Indian language. Name what they actually need done, " +
            "as 4 to 8 short English search words an app catalogue would use (documents, tools, calculators, letters, photos, plans, studios). " +
            'Answer JSON only: {"keywords": string[]}.',
        },
        { role: "user", content: text },
      ], { model: "google/gemini-2.5-flash-lite", json: true, maxTokens: 120, temperature: 0 });
      const extra = (parseJson(out) as { keywords?: unknown }).keywords;
      const more = (Array.isArray(extra) ? extra : []).flatMap((k) => String(k).toLowerCase().split(/[^a-z0-9ऀ-ॿ]+/)).filter((w) => w.length > 2).slice(0, 12);
      if (more.length) {
        // The needed jobs count double, so a stray word in a long sentence can't outrank the app that does the job.
        ranked = rows.map((r) => ({ r, s: score(r, more) * 2 + score(r, words) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 10);
      }
    } catch (e) {
      console.error("command understand", e);
    }
  }
  if (!ranked.length) return json({ ok: true, app: null, message: "No app matched. Try other words." });

  const candidates = ranked.map(({ r }) => {
    const spec = APPS[r.id];
    return {
      id: r.id,
      name: r.name,
      about: (spec.intro || r.description || "").slice(0, 160),
      fields: (spec.fields ?? []).map((f) => ({ key: f.key, label: f.label, type: f.type, required: !!f.required, options: f.options })),
      prompt: spec.fields?.length ? undefined : (spec.promptLabel ?? "prompt"),
    };
  });
  let pick: { app_id?: string | null; alternatives?: unknown; inputs?: Record<string, unknown>; prompt?: string } = {};
  try {
    const out = await chat([
      {
        role: "system",
        content:
          "You turn one spoken or typed request into an app run. Pick the single best app from the list, or null if none fits. " +
          "Fill its fields only with facts in the request (keep the person's language; numbers as digits; select fields must use one of the options; " +
          "a 'rows' field is one plain-text line per item, like '2 x Steel chair @ 1500, GST 18%'). " +
          "Never invent names, amounts or dates. Apps with no fields take the whole request, cleaned up, as 'prompt'. " +
          "The request may be a problem or a need rather than a command (in any language): then pick the app that would solve it and get it done, " +
          "and answer null only if no app on the list could plausibly help at all, " +
          "and list up to 3 other apps from the list that could also help, best first, as 'alternatives'. " +
          'Answer JSON only: {"app_id": string|null, "alternatives": string[], "inputs": {fieldKey: value}, "prompt": string|null}.',
      },
      { role: "user", content: JSON.stringify({ request: text, apps: candidates }) },
    ], { model: "google/gemini-2.5-flash-lite", json: true, maxTokens: 800, temperature: 0 });
    pick = parseJson(out);
  } catch (e) {
    console.error("command plan", e);
    pick = { app_id: ranked[0].r.id, inputs: {} };
  }
  const chosen = ranked.find((x) => x.r.id === pick.app_id)?.r;
  if (!chosen) return json({ ok: true, app: null, message: "No app matched. Try other words." });
  const spec = APPS[chosen.id];
  const fields = spec.fields ?? [];
  const inputs: Record<string, string> = {};
  const fromProfile: string[] = [];
  // Small models sometimes echo a box's own label ("Customer", "Items (qty, rate, GST %)") as its value,
  // or fill boxes from nothing. Keep a value only when the request really says it.
  const said = text.toLowerCase();
  const echoed = (f: ApiField, v: string) => {
    const n = v.trim().toLowerCase();
    return [f.label, f.key, f.placeholder, f.help].some((x) => x && x.trim().toLowerCase() === n);
  };
  const inRequest = (f: ApiField, v: string) => {
    if (f.type === "select" || /\d/.test(v)) return true;
    const words = v.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3);
    return !words.length || words.some((w) => said.includes(w));
  };
  for (const f of fields) {
    const raw = asText(pick.inputs?.[f.key]);
    const v = raw && !echoed(f, raw) && inRequest(f, raw) ? raw : "";
    if (v) inputs[f.key] = v.slice(0, 4000);
    // Details the person already saved on ezyourlife.com (their business name, GSTIN, address…).
    else if (f.profile && profile[f.profile]) {
      inputs[f.key] = profile[f.profile];
      fromProfile.push(f.key);
    }
  }
  const missing = fields.filter((f) => f.required && !inputs[f.key]).map((f) => ({ key: f.key, label: f.label }));
  // Other apps that could solve the same problem: the model's list first, then the next best matches.
  const altIds = (Array.isArray(pick.alternatives) ? pick.alternatives : []).map(String);
  const alternatives = [...new Set([...altIds, ...ranked.map((x) => x.r.id)])]
    .filter((id) => id !== chosen.id)
    .map((id) => ranked.find((x) => x.r.id === id)?.r)
    .filter((r): r is CatalogRow => !!r)
    .slice(0, 3)
    .map((r) => summary(r, c));
  return json({
    ok: true,
    app: summary(chosen, c),
    alternatives,
    inputs,
    prompt: fields.length ? undefined : (str(pick.prompt, 2000) || text),
    missing,
    ready: missing.length === 0,
    // Every box the app takes, so a keyboard or assistant can show them for checking before it runs.
    fields: fields.map((f) => ({ key: f.key, label: f.label, type: f.type, required: !!f.required, placeholder: f.placeholder, options: f.options, default: f.default, help: f.help })),
    from_profile: fromProfile,
  });
}

/** A model answer for one box as plain text (lists of items become one line each). */
function asText(v: unknown): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(asText).filter(Boolean).join("\n");
  if (typeof v === "object") return Object.values(v as Record<string, unknown>).map(asText).filter(Boolean).join(" · ");
  return "";
}

// ---------- router ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const url = new URL(req.url);
  // The function is served at /functions/v1/api (or /api behind a custom domain); keep what follows.
  const path = url.pathname.replace(/^.*?\/api(?=\/|$)/, "").replace(/\/+$/, "") || "/";
  const parts = path.split("/").filter(Boolean); // ["v1", "apps", id, "run"]
  if (parts[0] !== "v1") {
    return json({ ok: true, name: "Ezyourlife API", version: "v1", docs: `${SITE}/developers` });
  }
  const m = req.method;
  const route = parts.slice(1);

  try {
    // Public, free: browsing the catalogue needs no key.
    if (m === "GET" && route[0] === "apps" && route.length === 1) return await listApps(url);
    if (m === "GET" && route[0] === "apps" && route.length === 2) return await getApp(decodeURIComponent(route[1]));
    if (m === "GET" && route[0] === "cards") return await listCards(url);

    // POST /v1/cards — publish a card (auth required, charged)
    if (m === "POST" && route[0] === "cards" && route.length === 1) {
      const who = await identify(req);
      if (!who) return fail(401, "login", "Send a valid ezyourlife.com sign-in token or API key as 'Authorization: Bearer …'.");
      let body: Record<string, unknown> = {};
      try { body = (await req.json()) ?? {}; } catch { body = {}; }
      return await publishCard(who, body);
    }

    const who = await identify(req);
    if (!who) return fail(401, "login", "Send a valid ezyourlife.com sign-in token or API key as 'Authorization: Bearer …'.");
    let body: Record<string, unknown> = {};
    if (m === "POST" || m === "PUT") {
      try { body = (await req.json()) ?? {}; } catch { body = {}; }
    }

    if (m === "GET" && route[0] === "me") return json({ ok: true, user_id: who.userId, via: who.key ? "api_key" : "session", key_id: who.key?.id ?? null });
    if (m === "GET" && route[0] === "profile") return await readProfile(who);
    if (m === "POST" && route[0] === "command") return await planCommand(who, body);
    if (m === "POST" && route[0] === "apps" && route[2] === "run") return await runApp(who, decodeURIComponent(route[1]), body);
    if (m === "POST" && route[0] === "apps" && route[2] === "charge") return await chargeDevice(who, decodeURIComponent(route[1]));
    if (m === "POST" && route[0] === "prompt" && route[1] === "improve") return await improve(who, body);
    if (m === "POST" && route[0] === "prompt" && route[1] === "brainstorm") return await brainstorm(who, body);
    if (route[0] === "shortcuts") {
      if (m === "GET") return json({ ok: true, shortcuts: (await readShortcuts(who.userId)).list });
      if (m === "PUT" || m === "POST") return await putShortcuts(who, body);
      if (m === "DELETE" && route[1]) {
        const cur = await readShortcuts(who.userId);
        const key = decodeURIComponent(route[1]);
        await writeShortcuts(who.userId, cur.list.filter((s) => s.key !== key), cur.editor);
        return json({ ok: true });
      }
    }
    if (m === "GET" && route[0] === "wallet" && route.length === 1) return await wallet(who);
    if (m === "POST" && route[0] === "wallet" && route[1] === "topup") return topup(body);
    if (route[0] === "keys") {
      if (!who.session) return fail(403, "session_required", "Keys are managed from your ezyourlife.com account, not with another key.");
      if (m === "GET") return await listKeys(who);
      if (m === "POST") return await createKey(who, body);
      if (m === "DELETE" && route[1]) return await revokeKey(who, decodeURIComponent(route[1]));
    }
    return fail(404, "not_found", `No route ${m} ${path}.`);
  } catch (e) {
    console.error("api error", e);
    return fail(500, "failed", e instanceof Error ? e.message : String(e));
  }
});
