// Server-side sign-in check and credit charging shared by every paid edge function.
//
// Flow for a paid request:
//   1. identify()  – the caller must be a real signed-in user (the public anon key is rejected).
//   2. start_tool_run – checks the wallet can afford the app's price (from tool_pricing).
//   3. the function does its AI work.
//   4. complete_tool_run – deducts credits only if the work succeeded; failures cost nothing.
// Because all of this happens on the server, the browser can no longer skip the charge.
//
// Internal calls made with the service-role key (e.g. bulk-run calling scan-business-card)
// are trusted and not charged again — the caller already charged per item.

import { corsHeaders, json } from "./http.ts";
import { inBackground, sseText } from "./whatsapp.ts";
import { notifyTaskDone } from "./notify.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export interface Caller {
  userId: string | null;
  internal: boolean;
  token: string;
}

export interface StartResult {
  ok: boolean;
  run_id?: string;
  credits_required?: number;
  balance?: number;
  reason?: string;
  free_tool?: boolean;
}

export interface FinishResult {
  ok: boolean;
  charged?: number;
  reason?: string;
}

/** Returns the signed-in caller, an internal service caller, or null for anyone else. */
export async function identify(req: Request): Promise<Caller | null> {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  if (SERVICE_ROLE && token === SERVICE_ROLE) return { userId: null, internal: true, token };
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SERVICE_ROLE },
    });
    if (!r.ok) return null;
    const u = (await r.json()) as { id?: string };
    return u?.id ? { userId: u.id, internal: false, token } : null;
  } catch {
    return null;
  }
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`${fn} failed (${r.status}): ${(await r.text()).slice(0, 200)}`);
  return (await r.json()) as T;
}

export const startRun = (userId: string, toolId: string) =>
  rpc<StartResult>("start_tool_run", { _uid: userId, _tool_id: toolId });

export const finishRun = (userId: string, runId: string, success: boolean, error?: string) =>
  rpc<FinishResult>("complete_tool_run", {
    _uid: userId,
    _run_id: runId,
    _success: success,
    _error: error ? error.slice(0, 500) : null,
  });

/** Current spendable balance (free + paid). */
export async function walletBalance(userId: string): Promise<number> {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/credit_wallets?user_id=eq.${encodeURIComponent(userId)}&select=free_balance,paid_balance`,
    { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } },
  );
  if (!r.ok) return 0;
  const rows = (await r.json()) as Array<{ free_balance: number; paid_balance: number }>;
  return rows[0] ? (rows[0].free_balance ?? 0) + (rows[0].paid_balance ?? 0) : 0;
}

/** How many AI images free credits may pay for, per person (enforced in start_tool_run / complete_tool_run). */
export const FREE_IMAGE_LIMIT = 4;

/** How many image runs at `perRun` credits this wallet can pay for, counting the free-credit image limit. */
export async function imageRunsAffordable(userId: string, perRun: number): Promise<number> {
  try {
    return await rpc<number>("image_runs_affordable", { _uid: userId, _per: perRun });
  } catch {
    // Database function not there yet: fall back to the plain balance.
    return Math.floor((await walletBalance(userId)) / Math.max(1, perRun));
  }
}

/** Credit price of an app, or null when it has no pricing row. */
export async function priceOf(toolId: string): Promise<number | null> {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/tool_pricing?tool_id=eq.${encodeURIComponent(toolId)}&select=credit_cost`,
    { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } },
  );
  if (!r.ok) return null;
  const rows = (await r.json()) as Array<{ credit_cost: number }>;
  return rows[0] ? rows[0].credit_cost : null;
}

/**
 * Creates a pricing row for a brand-new app if it has none (never overwrites an existing price).
 * cost_inr = credits × 0.30 makes the pricing trigger compute exactly `credits`
 * (ceil(cost × 1.5 / 0.45) = credits).
 */
const ensured = new Set<string>();
export async function ensurePrice(toolId: string, credits: number, isImage = false): Promise<void> {
  if (ensured.has(toolId)) return;
  const c = Math.max(1, Math.round(credits));
  ensured.add(toolId);
  const insert = (row: Record<string, unknown>) =>
    fetch(`${SUPABASE_URL}/rest/v1/tool_pricing?on_conflict=tool_id`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    }).catch(() => null);
  const row = { tool_id: toolId, cost_inr: Number((c * 0.3).toFixed(2)), credit_cost: c };
  // is_image marks AI-image prices for the free-credit image limit. If that column is not in the
  // database yet, create the price row without it rather than leaving the app unpriced.
  const r = await insert(isImage ? { ...row, is_image: true } : row);
  if (isImage && (!r || !r.ok)) await insert(row);
}

export interface BilledContext {
  caller: Caller;
  toolId: string | null;
  // deno-lint-ignore no-explicit-any
  body: any;
}

export interface BilledOptions {
  /** App id to charge, or a function of the request body. Return null for free actions. */
  // deno-lint-ignore no-explicit-any
  tool: string | ((body: any) => string | null);
  /** Allow visitors who are not signed in (free, capped endpoints only). */
  allowAnonymous?: boolean;
  /** Default credit price for apps that have no pricing row yet (created before the first charge). */
  defaultCredits?: (toolId: string) => number | undefined;
  /** True when the charged app makes an AI image (free credits pay for only FREE_IMAGE_LIMIT of these). */
  isImage?: (toolId: string) => boolean;
}

/**
 * Wraps an edge-function handler with sign-in and credit charging.
 * The handler's response decides success: 2xx → charge, anything else → no charge.
 * Streaming (SSE) responses are charged when the stream finishes; a provider error mid-stream is not charged.
 */
export function billed(opts: BilledOptions, handler: (req: Request, ctx: BilledContext) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const caller = await identify(req);
    if (!caller && !opts.allowAnonymous) {
      return json({ error: "sign_in_required", message: "Please sign in to use this app." }, 401);
    }

    // deno-lint-ignore no-explicit-any
    let body: any = null;
    try {
      body = await req.clone().json();
    } catch {
      body = null;
    }
    const toolId = typeof opts.tool === "function" ? opts.tool(body) : opts.tool;
    const ctx: BilledContext = { caller: caller ?? { userId: null, internal: false, token: "" }, toolId, body };

    // Free actions, anonymous visitors on allowed endpoints, and trusted internal calls.
    if (!toolId || !caller || caller.internal || !caller.userId) {
      try {
        return await handler(req, ctx);
      } catch (e) {
        return json({ error: e instanceof Error ? e.message : String(e) }, 500);
      }
    }

    const userId = caller.userId;
    // No app is free: an app without a price row gets its default (minimum 1 credit) first.
    await ensurePrice(toolId, opts.defaultCredits?.(toolId) ?? 1, opts.isImage?.(toolId) ?? false);
    let start: StartResult;
    try {
      start = await startRun(userId, toolId);
    } catch (e) {
      console.error("billing start failed", e);
      return json({ error: "billing_unavailable", message: "Billing is temporarily unavailable. You were not charged." }, 503);
    }
    if (!start.ok) {
      return json(
        {
          error: "insufficient_credits",
          message:
            start.reason === "free_image_limit"
              ? `Free credits cover ${FREE_IMAGE_LIMIT} AI images per person. This needs ${start.credits_required ?? "more"} bought credits; you have ${start.balance ?? 0}.`
              : `This needs ${start.credits_required ?? "more"} credits. You have ${start.balance ?? 0}.`,
          credits_required: start.credits_required,
          balance: start.balance,
        },
        402,
      );
    }
    const runId = start.run_id as string;
    const appId = typeof body?.tool_id === "string" && body.tool_id ? body.tool_id : toolId;
    // After a paid run succeeds, send the result to the customer on WhatsApp and email (in the background).
    const notify = (output: unknown) => inBackground(notifyTaskDone({ userId, toolId: appId, runId, output }));

    let res: Response;
    try {
      res = await handler(req, ctx);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await finishRun(userId, runId, false, msg).catch(() => undefined);
      return json({ error: msg, charged: 0 }, 500);
    }

    if (!res.ok) {
      await finishRun(userId, runId, false, `status ${res.status}`).catch(() => undefined);
      return res;
    }

    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(corsHeaders)) if (!headers.has(k)) headers.set(k, v);

    // Streaming answers: charge when the stream finishes (or the visitor stops reading it);
    // if the AI provider breaks off mid-stream, nothing is charged.
    if (res.body && (res.headers.get("content-type") ?? "").includes("text/event-stream")) {
      headers.set("x-credits-charged", "pending");
      return new Response(settleWhenStreamEnds(res.body, async (ok, err, raw) => {
        const r = await finishRun(userId, runId, ok, err);
        if (ok && raw) notify(sseText(raw));
        return r;
      }), {
        status: res.status,
        headers,
      });
    }

    let charged = 0;
    try {
      const done = await finishRun(userId, runId, true);
      charged = done?.charged ?? 0;
    } catch (e) {
      console.error("billing finish failed", e);
    }
    headers.set("x-credits-charged", String(charged));
    if ((res.headers.get("content-type") ?? "").includes("application/json")) {
      inBackground(res.clone().json().then(notify, () => undefined));
    }
    return new Response(res.body, { status: res.status, headers });
  };
}

/** Passes a stream through and calls settle() exactly once when it ends. */
export function settleWhenStreamEnds(
  body: ReadableStream<Uint8Array>,
  settle: (success: boolean, error?: string, raw?: string) => Promise<unknown>,
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let raw = ""; // what was streamed (capped), so the finished answer can be sent on WhatsApp
  let settled = false;
  const once = (ok: boolean, err?: string) => {
    if (settled) return Promise.resolve();
    settled = true;
    const p = settle(ok, err, raw).catch((e) => console.error("billing finish failed", e));
    // Keep the worker alive long enough to record the charge after the response closes.
    // deno-lint-ignore no-explicit-any
    (globalThis as any).EdgeRuntime?.waitUntil?.(p);
    return p;
  };
  return new ReadableStream<Uint8Array>({
    async pull(ctrl) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          await once(true);
          ctrl.close();
          return;
        }
        if (raw.length < 400_000) raw += dec.decode(value, { stream: true });
        ctrl.enqueue(value);
      } catch (e) {
        await once(false, e instanceof Error ? e.message : String(e));
        ctrl.error(e);
      }
    },
    async cancel(reason) {
      // The visitor stopped reading: the AI work was already being paid for, so it is charged.
      await once(true);
      await reader.cancel(reason).catch(() => undefined);
    },
  });
}

/** True when the user has the admin role (user_roles table). */
export async function isAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${encodeURIComponent(userId)}&role=eq.admin&select=role`,
    { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } },
  );
  if (!r.ok) return false;
  return ((await r.json()) as unknown[]).length > 0;
}
