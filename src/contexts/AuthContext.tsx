import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const isInitialLoad = useRef(true);
  const previousEvent = useRef<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Skip toasts on initial load or during OAuth flow
        if (isInitialLoad.current) {
          isInitialLoad.current = false;
          previousEvent.current = event;
          return;
        }

        // Only show signed in toast for password login (not OAuth - that redirects to callback)
        if (event === 'SIGNED_IN' && previousEvent.current !== 'INITIAL_SESSION') {
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
        } else if (event === 'SIGNED_OUT' && previousEvent.current === 'SIGNED_IN') {
          // Only show signed out toast for genuine sign-outs
          toast({
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
  }, [toast]);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
