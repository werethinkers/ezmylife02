import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";

// Render the tool immediately. If the visitor isn't logged in, wait 7 seconds
// and then show an inline login prompt — they stay on the same tool page.
export const ToolAccessGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    if (loading || user) {
      setPromptOpen(false);
      return;
    }
    const t = setTimeout(() => setPromptOpen(true), 7000);
    return () => clearTimeout(t);
  }, [user, loading, location.pathname]);

  return (
    <>
      {children}
      <LoginPromptDialog
        open={promptOpen}
        onOpenChange={setPromptOpen}
        returnTo={location.pathname + location.search}
      />
    </>
  );
};
