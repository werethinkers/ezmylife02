import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const toastRef = useRef(toast);
  const isInitialLoad = useRef(true);
  const previousEvent = useRef<string | null>(null);

  // Keep latest toast accessible without re-subscribing the auth listener.
  useEffect(() => { toastRef.current = toast; }, [toast]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Skip toasts on initial load and on INITIAL_SESSION re-emits
        if (isInitialLoad.current || event === 'INITIAL_SESSION') {
          isInitialLoad.current = false;
          previousEvent.current = event;
          return;
        }

        if (event === 'SIGNED_IN' && previousEvent.current !== 'SIGNED_IN') {
          toastRef.current({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
          const provider = session?.user?.app_metadata?.provider || "email";
          logActivity("login", { method: provider, email: session?.user?.email });
        } else if (event === 'SIGNED_OUT' && previousEvent.current === 'SIGNED_IN') {
          toastRef.current({
            title: "Signed out",
            description: "You've been signed out successfully.",
          });
        }

        previousEvent.current = event;
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
