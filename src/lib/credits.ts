import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/*
 * Credits in the browser.
 *
 * AI apps are charged on the server: the edge function checks the balance, does the work,
 * and deducts credits only when it succeeds. The browser just calls the function with the
 * user's session and reacts to two answers:
 *   401 → ask the visitor to sign in
 *   402 → open the "buy credits" dialog
 *
 * Apps that run entirely in the browser (image resizing, editors…) use startRun/completeRun
 * around the export step via useCredits().chargeLocal().
 */

export interface StartRunResult {
  ok: boolean;
  run_id?: string;
  credits_required?: number;
  cost_inr?: number;
  reason?: "insufficient";
  balance?: number;
  free_tool?: boolean;
}

export class AppCallError extends Error {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(status: number, data: any) {
    super((data && (data.message || data.error)) || `Request failed (${status})`);
    this.status = status;
    this.data = data;
  }
}

/** Reads status + JSON body from a Supabase FunctionsHttpError or an AppCallError. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function functionError(e: unknown): Promise<{ status: number; data: any } | null> {
  if (e instanceof AppCallError) return { status: e.status, data: e.data };
  const ctx = (e as { context?: unknown })?.context;
  if (ctx instanceof Response) {
    let data: unknown = null;
    try {
      data = await ctx.clone().json();
    } catch {
      data = null;
    }
    return { status: ctx.status, data };
  }
  return null;
}

async function accessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/** Calls an edge function as the signed-in user. Throws AppCallError on non-2xx. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function callFunction<T = any>(name: string, body: unknown): Promise<T> {
  const token = await accessToken();
  if (!token) throw new AppCallError(401, { error: "sign_in_required", message: "Please sign in to use this app." });
  const { data, error } = await supabase.functions.invoke(name, {
    body: body as Record<string, unknown>,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) {
    const info = await functionError(error);
    throw new AppCallError(info?.status ?? 500, info?.data ?? { error: error.message });
  }
  if (data && typeof data === "object" && "error" in data && !("ok" in data)) {
    throw new AppCallError(500, data);
  }
  return data as T;
}

/** Opens a streaming (SSE) edge function as the signed-in user. Returns the Response. */
export async function streamFunction(name: string, body: unknown): Promise<Response> {
  const token = await accessToken();
  if (!token) throw new AppCallError(401, { error: "sign_in_required", message: "Please sign in to use this app." });
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = { error: `Request failed (${res.status})` };
    }
    throw new AppCallError(res.status, data);
  }
  return res;
}

export async function startRun(toolId: string): Promise<StartRunResult> {
  const token = await accessToken();
  if (!token) return { ok: false, reason: "insufficient", balance: 0 };
  const { data, error } = await supabase.functions.invoke("tool-charge", {
    body: { action: "start", tool_id: toolId },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) {
    toast.error("Could not start the app. Please try again.");
    return { ok: false };
  }
  return data as StartRunResult;
}

export async function completeRun(runId: string, success: boolean, error?: string) {
  const token = await accessToken();
  if (!token) return;
  await supabase.functions.invoke("tool-charge", {
    body: { action: "complete", run_id: runId, success, error },
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * For browser-only work (no server cost), e.g. downloading an edited image:
 *   await runWithCredits(toolId, async () => { ...do work... });
 * Throws "insufficient_credits" if the wallet can't cover it.
 */
export async function runWithCredits<T>(
  toolId: string,
  work: () => Promise<T>,
  opts?: { onInsufficient?: (required: number, balance: number) => void },
): Promise<{ result: T; charged: number }> {
  const start = await startRun(toolId);
  if (!start.ok || !start.run_id) {
    if (start.reason === "insufficient") {
      opts?.onInsufficient?.(start.credits_required ?? 1, start.balance ?? 0);
    }
    throw new Error(start.reason === "insufficient" ? "insufficient_credits" : "start_failed");
  }
  try {
    const result = await work();
    await completeRun(start.run_id, true);
    return { result, charged: start.credits_required ?? 0 };
  } catch (e) {
    await completeRun(start.run_id, false, e instanceof Error ? e.message : String(e));
    throw e;
  }
}
