import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface PremiumRouteProps {
  children: React.ReactNode;
}

export const PremiumRoute = ({ children }: PremiumRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsChecking(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke("check-subscription", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.error("Error checking premium status:", error);
          setIsPremium(false);
        } else {
          setIsPremium(data.subscribed);
        }
      } catch (error) {
        console.error("Error checking premium status:", error);
        setIsPremium(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (!authLoading) {
      checkPremiumStatus();
    }
  }, [user, authLoading]);

  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isPremium) {
    return <Navigate to="/subscription" replace />;
  }

  return <>{children}</>;
};