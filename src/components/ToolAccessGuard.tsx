import { useEffect, useState } from "react";
import { Navigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ToolAccessGuardProps {
  children: React.ReactNode;
}

export const ToolAccessGuard = ({ children }: ToolAccessGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { toolId } = useParams<{ toolId: string }>();
  const location = useLocation();
  const [status, setStatus] = useState<"checking" | "allowed" | "needs-auth" | "needs-premium">("checking");

  useEffect(() => {
    const check = async () => {
      if (authLoading) return;

      // 1. Check if tool is free (anyone can use it, even without account)
      let isFree = false;
      if (toolId) {
        const { data: tool } = await supabase
          .from("tools_catalog")
          .select("is_free")
          .eq("id", toolId)
          .maybeSingle();
        isFree = !!(tool as { is_free?: boolean } | null)?.is_free;
      }

      if (isFree) {
        setStatus("allowed");
        return;
      }

      // 2. Not free → must be logged in
      if (!user) {
        setStatus("needs-auth");
        return;
      }

      // 3. Logged in → check subscription
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setStatus("needs-auth");
          return;
        }
        const { data, error } = await supabase.functions.invoke("check-subscription", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (error || !data?.subscribed) {
          toast.error("This tool requires a premium subscription");
          setStatus("needs-premium");
        } else {
          setStatus("allowed");
        }
      } catch (e) {
        console.error("Subscription check failed:", e);
        setStatus("needs-premium");
      }
    };
    check();
  }, [user, authLoading, toolId]);

  if (authLoading || status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "needs-auth") {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (status === "needs-premium") {
    return <Navigate to="/subscription" replace />;
  }

  return <>{children}</>;
};
