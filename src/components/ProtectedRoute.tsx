import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) setOpen(true);
  }, [loading, user, location.pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const returnTo = location.pathname + location.search;
    const handleOpenChange = (v: boolean) => {
      if (!v) {
        toast.error("Please sign in to continue using this app.");
        setTimeout(() => setOpen(true), 350);
        return;
      }
      setOpen(v);
    };
    return (
      <div className="relative min-h-screen">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">Sign in required</h2>
          <p className="text-muted-foreground max-w-sm">
            This AI App is for signed-in users. Create a free account or log in to continue — you'll get free credits instantly.
          </p>
          <Link to="/ai-apps" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            ← Back to all apps
          </Link>
        </div>
        <LoginPromptDialog
          open={open}
          onOpenChange={handleOpenChange}
          returnTo={returnTo}
          persistent
        />
      </div>
    );
  }

  return <>{children}</>;
};
