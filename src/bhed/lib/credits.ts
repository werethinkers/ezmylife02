import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { runWithCredits } from "@/lib/credits";
import { emitCreditPrompt } from "@/lib/creditPrompt";

/*
 * Making a map costs credits (25, set in tool_pricing and shown from src/apps/prices/bhed.ts).
 * Opening, editing, exporting and syncing maps you already have is free. The charge is taken
 * only when the new map was made without an error, through the same start/complete run every
 * other browser-only app on the site uses.
 */
export const BHED_TOOL_ID = "bhed-prabhed";

/** Runs `work` (which makes one new map) and charges for it. Returns false if it did not run. */
export async function withNewMapCharge(work: () => Promise<void>): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    emitCreditPrompt({ kind: "login" });
    return false;
  }
  try {
    const { charged } = await runWithCredits(BHED_TOOL_ID, work, {
      onInsufficient: (required, balance) => emitCreditPrompt({ kind: "buy", required, balance }),
    });
    emitCreditPrompt({ kind: "charged" });
    if (charged > 0) toast.success(`${charged} credits used for your new map`);
    return true;
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message === "insufficient_credits") return false; // the top-up dialog is already open
    if (message === "start_failed") {
      toast.error("Could not start. Please try again.");
      return false;
    }
    throw e;
  }
}
