import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";


const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(5, "Phone number is required"),
  company: z.string().min(1, "Company / School name is required"),
  jobTitle: z.string().min(1, "Job title / Role is required"),
  location: z.string().min(1, "Location is required"),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Capture intended destination from guard navigation state
  useEffect(() => {
    const from = (location.state as { from?: string } | null)?.from;
    if (from) {
      try { localStorage.setItem("auth_redirect_to", from); } catch { /* ignore */ }
    }
  }, [location.state]);

  useEffect(() => {
    if (user) navigate("/auth/callback", { replace: true });
  }, [user, navigate]);

  const [signUpData, setSignUpData] = useState({
    email: "", password: "", fullName: "", phone: "", company: "", jobTitle: "", location: "",
  });
  const [signInData, setSignInData] = useState({ email: "", password: "" });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const validated = signUpSchema.parse(signUpData);
      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: validated.fullName,
            display_name: validated.fullName.split(" ")[0],
            phone_number: validated.phone,
            company: validated.company,
            job_title: validated.jobTitle,
            location: validated.location,
          },
        },
      });
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        // Update the profile with extra details after signup
        if (data?.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            phone_number: validated.phone,
            company: validated.company,
            job_title: validated.jobTitle,
            location: validated.location,
            full_name: validated.fullName,
            display_name: validated.fullName.split(" ")[0],
            email: validated.email,
          });
        }
        logActivity("signup", { method: "email", email: validated.email });
        toast({ title: "Account created!", description: "Welcome to EZYOURLIFE." });
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
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
  };

  const handleAppleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (error) toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <motion.div
        className="absolute top-20 -left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="p-4 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to home
        </Link>
      </motion.div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div className="w-full max-w-md space-y-8" initial="initial" animate="animate" variants={staggerContainer}>
          <motion.div variants={fadeInUp} transition={{ duration: 0.5 }} className="text-center space-y-4">
            <motion.img src={logo} alt="EZYOURLIFE" className="h-14 mx-auto" whileHover={{ scale: 1.05, rotate: 2 }} transition={{ duration: 0.3 }} />
            <h1 className="font-display text-2xl font-semibold">Welcome to EZYOURLIFE</h1>
            <p className="text-muted-foreground">Sign in to access 200+ live AI tools (2,000+ coming soon)</p>
          </motion.div>

          <motion.div variants={fadeInUp} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" className="w-full h-12 gap-3" onClick={handleGoogleSignIn} disabled={isLoading}>
                <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" className="w-full h-12 gap-3" onClick={handleAppleSignIn} disabled={isLoading}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                Continue with Apple
              </Button>
            </motion.div>
          </motion.div>

          <motion.div variants={fadeInUp} transition={{ duration: 0.5, delay: 0.2 }} className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-xs text-muted-foreground uppercase">or</span>
          </motion.div>

          <motion.div variants={fadeInUp} transition={{ duration: 0.5, delay: 0.3 }}>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="space-y-4 mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input id="signin-email" type="email" placeholder="you@example.com" value={signInData.email} onChange={(e) => setSignInData({ ...signInData, email: e.target.value })} required disabled={isLoading} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input id="signin-password" type="password" placeholder="••••••••" value={signInData.password} onChange={(e) => setSignInData({ ...signInData, password: e.target.value })} required disabled={isLoading} className="h-12" />
                  </div>
                  <Button type="submit" className="w-full h-12" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name *</Label>
                    <Input id="signup-name" placeholder="Your full name" value={signUpData.fullName} onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })} required disabled={isLoading} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email *</Label>
                    <Input id="signup-email" type="email" placeholder="you@example.com" value={signUpData.email} onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })} required disabled={isLoading} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password *</Label>
                    <Input id="signup-password" type="password" placeholder="••••••••" value={signUpData.password} onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })} required disabled={isLoading} className="h-12" />
                    <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number *</Label>
                    <Input id="signup-phone" type="tel" placeholder="+91 98765 43210" value={signUpData.phone} onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })} required disabled={isLoading} className="h-12" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-company">Company / School *</Label>
                      <Input id="signup-company" placeholder="Your org" value={signUpData.company} onChange={(e) => setSignUpData({ ...signUpData, company: e.target.value })} required disabled={isLoading} className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-job">Role / Title *</Label>
                      <Input id="signup-job" placeholder="Your role" value={signUpData.jobTitle} onChange={(e) => setSignUpData({ ...signUpData, jobTitle: e.target.value })} required disabled={isLoading} className="h-12" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-location">Location *</Label>
                    <Input id="signup-location" placeholder="City, Country" value={signUpData.location} onChange={(e) => setSignUpData({ ...signUpData, location: e.target.value })} required disabled={isLoading} className="h-12" />
                  </div>
                  <Button type="submit" className="w-full h-12" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </motion.div>

          <motion.p variants={fadeInUp} transition={{ duration: 0.5, delay: 0.4 }} className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
