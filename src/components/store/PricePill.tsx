import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { usePricingMap, RUPEES_PER_CREDIT_MAX, formatRupees } from "@/hooks/usePricingMap";

/**
 * App Store-style action pill: "1 CR" (with the rupee cost on hover), or "OPEN"
 * when the visitor is signed in and already has enough credits.
 */
export function PricePill({ toolId, className, size = "sm" }: { toolId: string; className?: string; size?: "sm" | "md" }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { total } = useWallet();
  const { costOf } = usePricingMap();
  const cost = costOf(toolId);
  const canOpen = !!user && total >= cost;
  const rupees = formatRupees(cost * RUPEES_PER_CREDIT_MAX);

  const open = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/tool/${toolId}`);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={open}
          aria-label={canOpen ? "Open app" : `Open app, costs ${cost} credit${cost === 1 ? "" : "s"}`}
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-1 rounded-full font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            size === "md" ? "h-9 min-w-[76px] px-4 text-sm" : "h-8 min-w-[64px] px-3 text-xs",
            canOpen
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-primary/10 text-primary hover:bg-primary/20",
            className,
          )}
        >
          {canOpen ? (
            <>
              Open <ArrowUpRight className="h-3.5 w-3.5" />
            </>
          ) : (
            <>{cost} CR</>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {cost} credit{cost === 1 ? "" : "s"} a run · about {rupees} at the ₹10 pack
      </TooltipContent>
    </Tooltip>
  );
}
