import { useCallback, useState } from "react";
import { toast } from "sonner";
import { callFunction } from "@/lib/credits";
import { emitCreditPrompt, handleCreditError } from "@/lib/creditPrompt";
import { isDeveloperApp } from "@/lib/devApps";
import { PREVIEW_RUN_EVENT, previewVersionFor } from "./preview";

/** Thrown after the sign-in or buy-credits dialog has been opened (nothing was charged). */
export class NeedsCredits extends Error {
  constructor() {
    super("needs_credits");
  }
}

/**
 * Runs an app on the shared `ai-app` function. The server checks the balance, does the work
 * and deducts credits only if it succeeds.
 * Apps from outside developers (ids start with "dev-") run on `dev-app-run`, which does the same with the
 * developer's instructions. While a version is being tested before approval (see ./preview.ts) the run is a free
 * test run for its developer: nothing is charged and the sign-in / credits dialogs never open for it.
 */
export async function runApp<T = unknown>(toolId: string, body: Record<string, unknown>): Promise<T> {
  const testing = previewVersionFor(toolId);
  try {
    const res = await callFunction<{ ok: boolean; output?: T; image?: T }>(isDeveloperApp(toolId) ? "dev-app-run" : "ai-app", {
      tool_id: toolId,
      ...(testing ? { preview_version_id: testing } : {}),
      ...body,
    });
    const out = (res?.output ?? res?.image) as T | undefined;
    // An empty reply is an error, not a result: stop here so the app shows a message instead of crashing.
    if (out === undefined || out === null || out === "") throw new Error("No result came back. Please try again.");
    if (testing) window.dispatchEvent(new CustomEvent(PREVIEW_RUN_EVENT));
    else emitCreditPrompt({ kind: "charged" });
    return out;
  } catch (e) {
    if (!testing && (await handleCreditError(e))) throw new NeedsCredits();
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
