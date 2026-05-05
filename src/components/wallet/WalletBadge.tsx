import { Link } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Zap, Plus } from "lucide-react";
import { motion } from "framer-motion";

export const WalletBadge = () => {
  const { user } = useAuth();
  const { free, paid, total, isLoading } = useWallet();

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/15 transition"
          aria-label="Credit wallet"
        >
          <Zap className="h-3.5 w-3.5" />
          <span className="tabular-nums">{isLoading ? "—" : total}</span>
        </motion.button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Credit balance</p>
            <p className="text-3xl font-semibold tabular-nums">{total}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Free</p>
              <p className="font-medium tabular-nums">{free}</p>
            </div>
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="font-medium tabular-nums">{paid}</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Free credits reset to 100 on the 1st of each month (IST). Paid credits never expire.
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
