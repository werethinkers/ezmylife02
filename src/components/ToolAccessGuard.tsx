// Premium gating removed: tools now charge credits at run-time.
// Free tools render immediately; premium-only tools require login.
import { Navigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { Loader2 } from "lucide-react";

export const ToolAccessGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { toolId } = useParams<{ toolId: string }>();
  const location = useLocation();
  const { data: catalog = [], isLoading: catalogLoading } = useToolsCatalog();
  const tool = catalog.find((t) => t.id === toolId);
  const isFree = !!tool?.is_free;

  if (authLoading || catalogLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (isFree) return <>{children}</>;
  if (!user) {
    try { localStorage.setItem("auth_redirect_to", location.pathname + location.search); } catch { /* ignore */ }
    return <Navigate to="/auth" state={{ from: location.pathname + location.search }} replace />;
  }
  return <>{children}</>;
};
