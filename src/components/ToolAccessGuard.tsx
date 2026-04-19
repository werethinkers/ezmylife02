import { Navigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ToolAccessGuardProps {
  children: React.ReactNode;
}

export const ToolAccessGuard = ({ children }: ToolAccessGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { toolId } = useParams<{ toolId: string }>();
  const location = useLocation();
  const { data: catalog = [], isLoading: catalogLoading } = useToolsCatalog();
  const { isSubscribed, loading: subLoading } = useSubscription();
  const toastShown = useRef(false);

  const tool = catalog.find((t) => t.id === toolId);
  const isFree = !!tool?.is_free;

  // Static (non-DB) tools default to premium-required
  const stillResolving = authLoading || catalogLoading || (!!user && subLoading);

  useEffect(() => {
    if (stillResolving) return;
    if (isFree) return;
    if (!user) return;
    if (!isSubscribed && !toastShown.current) {
      toastShown.current = true;
      toast.error("This tool requires a premium subscription");
    }
  }, [stillResolving, isFree, user, isSubscribed]);

  if (stillResolving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isFree) return <>{children}</>;
  if (!user) return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  if (!isSubscribed) return <Navigate to="/subscription" replace />;

  return <>{children}</>;
};
