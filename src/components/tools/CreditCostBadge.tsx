import { useToolPricing } from "@/hooks/useToolPricing";
import { useWallet } from "@/hooks/useWallet";
import { Zap, AlertTriangle } from "lucide-react";

interface Props {
  toolId: string;
  className?: string;
  /** Compact pill (default) or descriptive sentence */
  variant?: "pill" | "sentence";
}

export const CreditCostBadge = ({ toolId, className = "", variant = "pill" }: Props) => {
  const { creditCost, isLoading } = useToolPricing(toolId);
  const { total } = useWallet();
  if (isLoading) return null;
  if (creditCost === 0) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-xs font-bold text-ink ${className}`}>
        Free
      </span>
    );
  }
  const insufficient = total < creditCost;

  if (variant === "sentence") {
    return (
      <p className={`text-xs text-muted-foreground ${className}`}>
        <Zap className="inline h-3 w-3 mr-1 text-ink" />
        This will use <span className="font-medium text-foreground">{creditCost} credit{creditCost === 1 ? "" : "s"}</span>
        {insufficient && (
          <span className="ml-2 inline-flex items-center gap-1 font-semibold text-destructive">
            <AlertTriangle className="h-3 w-3" /> not enough — you have {total}
          </span>
        )}
      </p>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-2 py-0.5 text-xs font-bold text-ink ${
        insufficient ? "bg-coral" : "bg-sun"
      } ${className}`}
      title={insufficient ? `You have ${total} credits; this needs ${creditCost}` : undefined}
    >
      <Zap className="h-3 w-3" />
      {creditCost} credit{creditCost === 1 ? "" : "s"}
    </span>
  );
};

export default CreditCostBadge;
