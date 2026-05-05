// Compatibility shim: subscriptions have been replaced by credits.
// `isSubscribed` is now always true for logged-in users — credit checks
// happen at run time via useToolPricing / startRun.
import { useAuth } from "@/contexts/AuthContext";

export function useSubscription() {
  const { user, loading } = useAuth();
  return {
    isSubscribed: !!user,
    accessType: undefined as string | undefined,
    expiresAt: null as string | null,
    loading,
  };
}
