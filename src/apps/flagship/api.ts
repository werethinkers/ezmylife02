import { callFunction } from "@/lib/credits";
import { emitCreditPrompt, handleCreditError } from "@/lib/creditPrompt";
import { NeedsCredits } from "../lib/api";

export type FlagshipAction = "next" | "final" | "variant" | "start" | "turn" | "wrap" | "ask" | "image" | "section";

/** Steps that cost credits (the server decides; this only picks when to refresh the wallet). */
const PAID = new Set<FlagshipAction>(["final", "variant", "start", "ask", "image", "section"]);

/**
 * Runs one step of a flagship app on the `flagship-app` function. The server checks the
 * balance, does the work and charges only if it succeeds. Throws NeedsCredits after opening
 * the sign-in or buy-credits dialog.
 */
export async function runFlagship<T = string>(
  toolId: string,
  action: FlagshipAction,
  body: Record<string, unknown> = {},
): Promise<{ output: T; ticket?: string; done?: boolean }> {
  try {
    const res = await callFunction<{ ok: boolean; output?: T; ticket?: string; done?: boolean }>("flagship-app", { tool_id: toolId, action, ...body });
    const out = res?.output as T | undefined;
    if (!res?.done && (out === undefined || out === null || out === "")) throw new Error("No result came back. Please try again.");
    if (PAID.has(action)) emitCreditPrompt({ kind: "charged" });
    return { output: out as T, ticket: res.ticket, done: res.done };
  } catch (e) {
    if (await handleCreditError(e)) throw new NeedsCredits();
    throw e;
  }
}
