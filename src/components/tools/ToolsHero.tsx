import { motion } from "framer-motion";
import { Sparkles, Search, X, Gift, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { Zap } from "lucide-react";
import { useAppCountLabel } from "@/lib/appCount";

interface ToolsHeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const ToolsHero = ({ searchQuery, onSearchChange }: ToolsHeroProps) => {
  const countLabel = useAppCountLabel();
  const { user } = useAuth();
  const { total } = useWallet();

  return (
    <header className="relative overflow-hidden border-b border-border/40 pt-20 pb-12">
      <div className="absolute inset-0 bg-mesh opacity-50" />
      <div className="absolute inset-0 bg-sand/50" />

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-ink bg-sun mb-5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Apps</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Discover <span className="text-gradient">AI Apps</span>
            </h1>

            <p className="text-muted-foreground text-base md:text-lg max-w-xl mb-8 mx-auto lg:mx-0">
              Browse {countLabel} live AI apps. No signup needed to explore — pay only when you generate.
            </p>

            <div className="relative max-w-2xl mx-auto lg:mx-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search AI apps by name, description, or category..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-12 pr-12 h-14 text-base bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50 rounded-2xl shadow-lg"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 p-0"
                  onClick={() => onSearchChange("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden lg:block"
          >
            {user ? (
              <div className="rounded-2xl border-2 border-ink bg-card p-6 shadow-lg">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Your wallet</p>
                <div className="flex items-center gap-3 mt-2 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-4xl font-bold tabular-nums">{total.toLocaleString()}</div>
                </div>
                <Button asChild className="w-full">
                  <Link to="/credits">Top up credits</Link>
                </Button>
              </div>
            ) : (
              <SignupCard />
            )}
          </motion.aside>
        </div>
      </div>
    </header>
  );
};

const SignupCard = () => (
  <div className="relative rounded-3xl bg-gradient-to-br from-primary via-primary to-purple-600 p-6 text-primary-foreground shadow-xl overflow-hidden">
    <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
    <p className="text-sm font-medium mb-1 opacity-90">Welcome to EzYourLife 👋</p>
    <h3 className="text-2xl font-bold leading-tight mb-4">
      Log in or sign up and<br /> get <span className="underline decoration-white/40">100 free credits!</span>
    </h3>
    <div className="flex justify-center mb-4">
      <div className="h-28 w-28 rounded-3xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-sm">
        <Gift className="h-14 w-14 text-white drop-shadow" />
      </div>
    </div>
    <Button asChild size="lg" variant="secondary" className="w-full font-bold">
      <Link to="/auth?mode=signup"><UserPlus className="h-4 w-4 mr-2" /> Sign Up Free</Link>
    </Button>
    <div className="text-center text-xs my-2 opacity-80">or</div>
    <Button asChild size="lg" variant="outline" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white">
      <Link to="/auth"><LogIn className="h-4 w-4 mr-2" /> Log In</Link>
    </Button>
    <p className="text-center text-[11px] mt-3 opacity-80">No credit card required</p>
  </div>
);

export default ToolsHero;
