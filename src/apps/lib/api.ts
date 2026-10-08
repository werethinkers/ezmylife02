import { useCallback, useState } from "react";
import { toast } from "sonner";
import { callFunction } from "@/lib/credits";
import { emitCreditPrompt, handleCreditError } from "@/lib/creditPrompt";

/** Thrown after the sign-in or buy-credits dialog has been opened (nothing was charged). */
export class NeedsCredits extends Error {
  constructor() {
    super("needs_credits");
  }
}

/**
 * Runs an app on the shared `ai-app` function. The server checks the balance, does the work
 * and deducts credits only if it succeeds.
 */
export async function runApp<T = unknown>(toolId: string, body: Record<string, unknown>): Promise<T> {
  try {
    const res = await callFunction<{ ok: boolean; output?: T; image?: T }>("ai-app", { tool_id: toolId, ...body });
    emitCreditPrompt({ kind: "charged" });
    return (res.output ?? res.image) as T;
  } catch (e) {
    if (await handleCreditError(e)) throw new NeedsCredits();
    throw e;
  }
}

/** Hook for custom apps: run(body) → result or null (errors are shown as toasts). */
export function useRun(toolId: string) {
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async <T,>(body: Record<string, unknown>): Promise<T | null> => {
      setBusy(true);
      try {
        return await runApp<T>(toolId, body);
      } catch (e) {
        if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [toolId],
  );
  return { busy, run };
}

export const errorText =(e: unknown) =>
  e instanceof Error && e.message && e.message !== "needs_credits" ? e.message : "Something went wrong. You were not charged — please try again.";
