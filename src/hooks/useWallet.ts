import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Wallet {
  free: number;
  paid: number;
  /** Card-promo credits: spent first, a few uses per app. */
  promo: number;
  total: number;
  last_reset: string | null;
  signup_bonus_granted: boolean;
  first_action_bonus_granted: boolean;
}

async function fetchWallet(userId: string): Promise<Wallet> {
  // Direct DB read first (RLS-protected; works without the edge function call).
  // promo_balance is newer than the generated database types, so read the row untyped.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("credit_wallets")
    .select("free_balance, paid_balance, promo_balance, last_free_reset_at, signup_bonus_granted, first_action_bonus_granted")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) {
    return {
      free: data.free_balance,
      paid: data.paid_balance,
      promo: data.promo_balance ?? 0,
      total: data.free_balance + data.paid_balance + (data.promo_balance ?? 0),
      last_reset: data.last_free_reset_at,
      signup_bonus_granted: data.signup_bonus_granted,
      first_action_bonus_granted: data.first_action_bonus_granted,
    };
  }

  // Fall back to the edge function which will create the wallet via ensure_wallet().
  const { data: { session } } = await supabase.auth.getSession();
  const { data: w } = await supabase.functions.invoke("wallet", {
    headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  return {
    free: w?.free ?? 0,
    paid: w?.paid ?? 0,
    promo: w?.promo ?? 0,
    total: w?.total ?? 0,
    last_reset: w?.last_reset ?? null,
    signup_bonus_granted: !!w?.signup_bonus_granted,
    first_action_bonus_granted: !!w?.first_action_bonus_granted,
  };
}

export function useWallet() {
  const { user, loading: authLoading } = useAuth();
  const q = useQuery({
    queryKey: ["wallet", user?.id ?? "anon"],
    queryFn: () => fetchWallet(user!.id),
    enabled: !!user && !authLoading,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
  return {
    wallet: q.data,
    free: q.data?.free ?? 0,
    paid: q.data?.paid ?? 0,
    promo: q.data?.promo ?? 0,
    total: q.data?.total ?? 0,
    isLoading: authLoading || (!!user && q.isLoading),
    refetch: q.refetch,
  };
}

export function useRefreshWallet() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["wallet"] });
}
