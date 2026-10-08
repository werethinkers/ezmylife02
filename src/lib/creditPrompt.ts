import { functionError } from "@/lib/credits";

/*
 * One place for every app to react to the server's credit answers, so sign-in and top-up
 * look the same everywhere:
 *   401 → sign-in dialog, 402 → buy-credits dialog (rendered once by <CreditPromptHost/>).
 * Also announces successful charges so the wallet badge refreshes.
 */

export interface CreditPromptDetail {
  kind: "login" | "buy" | "charged";
  required?: number;
  balance?: number;
}

const EVENT = "ez:credits";

export function emitCreditPrompt(detail: CreditPromptDetail) {
  try {
    window.dispatchEvent(new CustomEvent<CreditPromptDetail>(EVENT, { detail }));
  } catch {
    /* non-browser */
  }
}

export function onCreditPrompt(fn: (d: CreditPromptDetail) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<CreditPromptDetail>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}

/** Returns true if the error was a sign-in / credits answer and the right dialog was opened. */
export async function handleCreditError(e: unknown): Promise<boolean> {
  const info = await functionError(e);
  if (info?.status === 401) {
    emitCreditPrompt({ kind: "login" });
    return true;
  }
  if (info?.status === 402) {
    emitCreditPrompt({ kind: "buy", required: info.data?.credits_required, balance: info.data?.balance });
    return true;
  }
  return false;
}
