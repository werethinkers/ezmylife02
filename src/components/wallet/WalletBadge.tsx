import { Link } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Zap, Plus } from "lucide-react";
import { motion } from "framer-motion";

export const WalletBadge = () => {
  const { user } = useAuth();
  const { free, paid, promo, total, isLoading } = useWallet();

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-ink bg-lime px-3 text-sm font-bold text-ink shadow-[2px_2px_0_0_hsl(var(--ink))] transition-transform hover:-translate-y-px"
          aria-label={`Your credits: ${total}`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span className="tabular-nums">{isLoading ? "—" : total}</span>
        </motion.button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Your credits</p>
            <p className="font-display text-3xl font-bold tabular-nums">{total}</p>
          </div>
          <div className={`grid gap-2 text-sm ${promo > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
            {promo > 0 && (
              <div className="rounded-lg border-2 border-ink bg-sun px-3 py-2">
                <p className="text-xs text-ink/70">Card gift</p>
                <p className="font-medium tabular-nums">{promo}</p>
              </div>
            )}
            <div className="rounded-lg border-2 border-ink bg-sand px-3 py-2">
              <p className="text-xs text-muted-foreground">Free</p>
              <p className="font-medium tabular-nums">{free}</p>
            </div>
            <div className="rounded-lg border-2 border-ink bg-sand px-3 py-2">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="font-medium tabular-nums">{paid}</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Free credits reset to 100 on the 1st of each month (IST). Paid credits never expire.
            {promo > 0 && " Card gift credits work on each app up to 3 times, then use free or paid credits."}
          </p>
          <Button asChild size="sm" className="w-full">
            <Link to="/credits">
              <Plus className="mr-1 h-3.5 w-3.5" /> Buy credits
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default WalletBadge;
