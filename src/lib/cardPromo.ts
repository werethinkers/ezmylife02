import { supabase } from "@/integrations/supabase/client";
import { functionError } from "@/lib/credits";

/*
 * Visiting-card promo (supabase/migrations/20261025100000_card_promos.sql).
 * A printed card carries a QR to /card/<CODE>. The visitor signs in or creates an account, and
 * the code is claimed for that account: 5,000 gift credits, once per account, usable on each app
 * up to 3 times. The rules are enforced on the server; this file only talks to it.
 */

export const CARD_CODE_KEY = "ez_card_code";

/** Same shape the database generates: three groups of four, no 0/O/1/I. */
export const CARD_CODE_PATTERN = /^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/;

export const cardUrl = (code: string, origin = window.location.origin) => `${origin}/card/${encodeURIComponent(code)}`;

export interface CardStatus {
  valid: boolean;
  reason?: "invalid" | "inactive" | "expired" | "used";
  credits?: number;
  per_app_limit?: number;
  expires_at?: string | null;
}

export interface ClaimResult {
  ok: boolean;
  reason?: string;
  message?: string;
  credits?: number;
  per_app_limit?: number;
}

export function rememberCardCode(code: string) {
  try { localStorage.setItem(CARD_CODE_KEY, code); } catch { /* ignore */ }
}
export function pendingCardCode(): string | null {
  try { return localStorage.getItem(CARD_CODE_KEY); } catch { return null; }
}
export function forgetCardCode() {
  try { localStorage.removeItem(CARD_CODE_KEY); } catch { /* ignore */ }
}

export async function cardStatus(code: string): Promise<CardStatus> {
  // card_promo_status is newer than the generated database types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("card_promo_status", { _code: code });
  if (error || !data) return { valid: false, reason: "invalid" };
  return data as CardStatus;
}

export async function claimCard(code: string): Promise<ClaimResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, reason: "sign_in", message: "Please sign in to claim your card." };
  const { data, error } = await supabase.functions.invoke("claim-card-promo", {
    body: { code },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) {
    const info = await functionError(error);
    return { ok: false, message: info?.data?.message ?? "Could not claim the card. Please try again." };
  }
  return data as ClaimResult;
}
