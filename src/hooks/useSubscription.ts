import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionState {
  isSubscribed: boolean;
  accessType?: string;
  expiresAt?: string | null;
}

async function fetchSubscription(): Promise<SubscriptionState> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { isSubscribed: false };

  // First, check premium_access table directly for instant decision
  const { data: rows } = await supabase
    .from("premium_access")
    .select("access_type, expires_at")
    .eq("user_id", session.user.id)
    .order("granted_at", { ascending: false });

  const now = Date.now();
  const active = (rows ?? []).find((r) => !r.expires_at || new Date(r.expires_at).getTime() > now);
  if (active) {
    return { isSubscribed: true, accessType: active.access_type, expiresAt: active.expires_at };
  }

  // Fallback: invoke edge function (handles auto-premium domains, etc.)
  try {
    const { data } = await supabase.functions.invoke("check-subscription", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    return {
      isSubscribed: !!data?.subscribed,
      accessType: data?.access_type,
      expiresAt: data?.expires_at,
    };
  } catch {
    return { isSubscribed: false };
  }
}

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const q = useQuery({
    queryKey: ["subscription", user?.id ?? "anon"],
    queryFn: fetchSubscription,
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  return {
    isSubscribed: q.data?.isSubscribed ?? false,
    accessType: q.data?.accessType,
    expiresAt: q.data?.expiresAt,
    loading: authLoading || (!!user && q.isLoading),
  };
}
