// Premium gating removed: tools now charge credits at run-time.
// Free tools render immediately; non-free tools show a login dialog for guests.
import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { Loader2 } from "lucide-react";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";

export const ToolAccessGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { toolId } = useParams<{ toolId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: catalog = [], isLoading: catalogLoading } = useToolsCatalog();
  const tool = catalog.find((t) => t.id === toolId);
  const isFree = !!tool?.is_free;
  const [open, setOpen] = useState(true);

  if (authLoading || catalogLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (isFree || user) return <>{children}</>;
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background text-center px-4">
        <div className="max-w-md space-y-3">
          <h2 className="text-xl font-semibold">Sign in to use this tool</h2>
          <p className="text-sm text-muted-foreground">New accounts get free credits to try every tool.</p>
        </div>
      </div>
      <LoginPromptDialog
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) navigate("/"); }}
        returnTo={location.pathname + location.search}
      />
    </>
  );
};
