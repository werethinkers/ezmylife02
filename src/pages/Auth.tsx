import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, Phone, ArrowLeft } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo.png";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/auth/callback", { replace: true });
  }, [user, navigate]);

  const [signUpData, setSignUpData] = useState({ email: "", password: "", fullName: "", phone: "" });
  const [signInData, setSignInData] = useState({ email: "", password: "" });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const validated = signUpSchema.parse(signUpData);
      const { error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: validated.fullName, display_name: validated.fullName.split(" ")[0] },
        },
      });
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Account created!", description: "Welcome to Ezmylife." });
      }
    } catch (error) {
      if (error instanceof z.ZodError) toast({ title: "Validation error", description: error.errors[0].message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const validated = signInSchema.parse(signInData);
      const { error } = await supabase.auth.signInWithPassword({ email: validated.email, password: validated.password });
      if (error) toast({ title: "Sign in failed", description: "Invalid email or password.", variant: "destructive" });
    } catch (error) {
      if (error instanceof z.ZodError) toast({ title: "Validation error", description: error.errors[0].message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (error) toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
  };

  const handleAppleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "apple", options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (error) toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to home
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center space-y-4">
            <img src={logo} alt="Ezmylife" className="h-16 mx-auto" />
            <h1 className="font-display text-2xl font-semibold">Welcome to Ezmylife</h1>
            <p className="text-muted-foreground">Sign in to access 2000+ AI tools</p>
          </div>

          <div className="space-y-3">
            <Button variant="outline" className="w-full h-12 gap-3" onClick={handleGoogleSignIn} disabled={isLoading}>
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </Button>
            <Button variant="outline" className="w-full h-12 gap-3" onClick={handleAppleSignIn} disabled={isLoading}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              Continue with Apple
            </Button>
          </div>

          <div className="relative"><Separator /><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-xs text-muted-foreground uppercase">or</span></div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="signin">Sign In</TabsTrigger><TabsTrigger value="signup">Sign Up</TabsTrigger></TabsList>
            <TabsContent value="signin" className="space-y-4 mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="signin-email">Email</Label><Input id="signin-email" type="email" placeholder="you@example.com" value={signInData.email} onChange={(e) => setSignInData({ ...signInData, email: e.target.value })} required disabled={isLoading} className="h-12" /></div>
                <div className="space-y-2"><Label htmlFor="signin-password">Password</Label><Input id="signin-password" type="password" placeholder="••••••••" value={signInData.password} onChange={(e) => setSignInData({ ...signInData, password: e.target.value })} required disabled={isLoading} className="h-12" /></div>
                <Button type="submit" className="w-full h-12" disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="signup-name">Full Name</Label><Input id="signup-name" type="text" placeholder="Your full name" value={signUpData.fullName} onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })} required disabled={isLoading} className="h-12" /></div>
                <div className="space-y-2"><Label htmlFor="signup-email">Email</Label><Input id="signup-email" type="email" placeholder="you@example.com" value={signUpData.email} onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })} required disabled={isLoading} className="h-12" /></div>
                <div className="space-y-2"><Label htmlFor="signup-password">Password</Label><Input id="signup-password" type="password" placeholder="••••••••" value={signUpData.password} onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })} required disabled={isLoading} className="h-12" /><p className="text-xs text-muted-foreground">Minimum 6 characters</p></div>
                <Button type="submit" className="w-full h-12" disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}</Button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="text-center text-xs text-muted-foreground">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
