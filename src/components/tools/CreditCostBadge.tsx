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
      <span className={`inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500 ${className}`}>
        Free
      </span>
    );
  }
  const insufficient = total < creditCost;

  if (variant === "sentence") {
    return (
      <p className={`text-xs text-muted-foreground ${className}`}>
        <Zap className="inline h-3 w-3 mr-1 text-primary" />
        This will use <span className="font-medium text-foreground">{creditCost} credit{creditCost === 1 ? "" : "s"}</span>
        {insufficient && (
          <span className="ml-2 inline-flex items-center gap-1 text-amber-500">
            <AlertTriangle className="h-3 w-3" /> insufficient — you have {total}
          </span>
        )}
      </p>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        insufficient ? "border-amber-500/50 text-amber-500 bg-amber-500/10" : "border-primary/40 text-primary bg-primary/10"
      } ${className}`}
    >
      <Zap className="h-3 w-3" />
      {creditCost} credit{creditCost === 1 ? "" : "s"}
    </span>
  );
};

export default CreditCostBadge;
