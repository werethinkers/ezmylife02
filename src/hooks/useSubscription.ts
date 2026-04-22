import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionState {
  isSubscribed: boolean;
  accessType?: string;
  expiresAt?: string | null;
}

const AUTO_PREMIUM_DOMAINS = ["@ezyourlife.com"];

async function fetchSubscription(userId: string, email: string | null): Promise<SubscriptionState> {
  // 0. Auto-premium domain shortcut — skip all network calls
  if (email && AUTO_PREMIUM_DOMAINS.some((d) => email.toLowerCase().endsWith(d))) {
    return { isSubscribed: true, accessType: "lifetime" };
  }

  // 1. Direct DB read — fast path, no edge function
  const { data: rows } = await supabase
    .from("premium_access")
    .select("access_type, expires_at")
    .eq("user_id", userId)
    .order("granted_at", { ascending: false })
    .limit(5);

  const now = Date.now();
  const active = (rows ?? []).find((r) => !r.expires_at || new Date(r.expires_at).getTime() > now);
  if (active) {
    return { isSubscribed: true, accessType: active.access_type, expiresAt: active.expires_at };
  }

  return { isSubscribed: false };
}

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const q = useQuery({
    queryKey: ["subscription", user?.id ?? "anon"],
    queryFn: () => fetchSubscription(user!.id, user?.email ?? null),
    enabled: !!user && !authLoading,
    staleTime: 10 * 60 * 1000, // 10 min cache (was 5)
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  return {
    isSubscribed: q.data?.isSubscribed ?? false,
    accessType: q.data?.accessType,
    expiresAt: q.data?.expiresAt,
    loading: authLoading || (!!user && q.isLoading),
  };
}
