import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { usePricingMap, RUPEES_PER_CREDIT_MAX, formatRupees } from "@/hooks/usePricingMap";

/**
 * Price pill: "1 credit" (with the rupee cost on hover), or "Open" when the visitor is signed
 * in and already has enough credits.
 */
export function PricePill({ toolId, className, size = "sm" }: { toolId: string; className?: string; size?: "sm" | "md" }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { total } = useWallet();
  const { costOf } = usePricingMap();
  const cost = costOf(toolId);
  const free = false; // every app costs at least 1 credit
  const canOpen = free || (!!user && total >= cost);
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
          aria-label={free ? "Open free app" : canOpen ? "Open app" : `Open app, costs ${cost} credit${cost === 1 ? "" : "s"}`}
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border-2 border-ink font-bold transition-[transform,background-color] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            size === "md" ? "h-9 min-w-[84px] px-4 text-sm" : "h-8 min-w-[70px] px-2.5 text-xs",
            canOpen ? "bg-pink text-ink" : "bg-sand text-ink hover:bg-sun",
            className,
          )}
        >
          {free ? (
            <>Free</>
          ) : canOpen ? (
            <>
              Open <ArrowUpRight className="h-3.5 w-3.5" />
            </>
          ) : (
            <>{cost} credit{cost === 1 ? "" : "s"}</>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {free ? "Free to use — no credits needed" : <>{cost} credit{cost === 1 ? "" : "s"} each time it gives you a result · about {rupees}</>}
      </TooltipContent>
    </Tooltip>
  );
}
