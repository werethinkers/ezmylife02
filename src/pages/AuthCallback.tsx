import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Completing sign in...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait for the session to be established
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          navigate("/auth", { replace: true });
          return;
        }

        if (!session) {
          // Wait a bit and retry - OAuth callback may still be processing
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          
          if (!retrySession) {
            navigate("/auth", { replace: true });
            return;
          }
        }

        const currentSession = session || (await supabase.auth.getSession()).data.session;
        
        if (!currentSession) {
          navigate("/auth", { replace: true });
          return;
        }

        setStatus("Checking subscription...");

        // Check subscription status
        const { data, error } = await supabase.functions.invoke("check-subscription", {
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
          },
        });

        if (error) {
          console.error("Subscription check error:", error);
          navigate("/subscription", { replace: true });
          return;
        }

        // Check if there's a redirect URL stored (e.g. from Meet Nudge magic link)
        const redirectTo = localStorage.getItem("auth_redirect_to");
        if (redirectTo) {
          localStorage.removeItem("auth_redirect_to");
          navigate(redirectTo, { replace: true });
        } else if (data?.subscribed) {
          navigate("/tools", { replace: true });
        } else {
          navigate("/subscription", { replace: true });
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/auth", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">{status}</p>
    </div>
  );
};

export default AuthCallback;
