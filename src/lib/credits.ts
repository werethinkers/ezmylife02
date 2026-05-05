import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StartRunResult {
  ok: boolean;
  run_id?: string;
  credits_required?: number;
  cost_inr?: number;
  reason?: "insufficient";
  balance?: number;
}

export async function startRun(toolId: string): Promise<StartRunResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, reason: "insufficient", balance: 0 };
  const { data, error } = await supabase.functions.invoke("tool-charge", {
    body: { action: "start", tool_id: toolId },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) {
    toast.error("Could not start tool run");
    return { ok: false };
  }
  return data as StartRunResult;
}

export async function completeRun(runId: string, success: boolean, error?: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  await supabase.functions.invoke("tool-charge", {
    body: { action: "complete", run_id: runId, success, error },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
}

/**
 * Convenience wrapper:
 *   await runWithCredits(toolId, async () => { ...do work... });
 * Throws if the user does not have enough credits.
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
