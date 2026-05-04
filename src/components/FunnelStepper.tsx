import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

type StepKey = "auth" | "plan" | "tool" | "use";

interface FunnelStepperProps {
  current: StepKey;
}

const STEPS: { key: StepKey; label: string; to: string }[] = [
  { key: "auth", label: "Sign in", to: "/auth" },
  { key: "plan", label: "Choose plan", to: "/subscription" },
  { key: "tool", label: "Pick a tool", to: "/tools" },
  { key: "use", label: "Use it", to: "/tools" },
];

export const FunnelStepper = ({ current }: FunnelStepperProps) => {
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();

  const completed: Record<StepKey, boolean> = {
    auth: !!user,
    plan: !!user && isSubscribed,
    tool: current === "use",
    use: false,
  };

  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="sticky top-16 z-30 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3">
        <ol className="flex items-center gap-2 overflow-x-auto">
          {STEPS.map((step, idx) => {
            const isDone = completed[step.key];
            const isCurrent = idx === currentIdx;
            const clickable = isDone || idx <= currentIdx;
            const Wrapper = clickable ? Link : "div";
            return (
              <li key={step.key} className="flex items-center gap-2 flex-shrink-0">
                <Wrapper
                  to={step.to}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all",
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : isDone
                        ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                        : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  <span className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
                    isCurrent ? "bg-primary-foreground/20" : isDone ? "bg-emerald-500/30" : "bg-background/50"
                  )}>
                    {isDone ? <Check className="h-3 w-3" /> : idx + 1}
                  </span>
                  <span className="font-medium whitespace-nowrap">{step.label}</span>
                </Wrapper>
                {idx < STEPS.length - 1 && (
                  <span className={cn(
                    "h-px w-4 md:w-8 transition-colors",
                    completed[step.key] ? "bg-emerald-500/40" : "bg-border"
                  )} />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

export default FunnelStepper;
