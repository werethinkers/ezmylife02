import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToolPricing } from "@/hooks/useToolPricing";
import { runWithCredits } from "@/lib/credits";
import { emitCreditPrompt } from "@/lib/creditPrompt";

/*
 * Charges browser-only apps (resize, crop, calculators, planners…) their price — minimum
 * 1 credit — once per use. A "use" starts the first time you add a file or type something,
 * and lasts 30 minutes in that app, so working on several images in one sitting costs one
 * charge. Without enough credits the app is locked behind a top-up prompt.
 */

const USE_WINDOW_MS = 30 * 60 * 1000;
const key = (id: string) => `ez.use.${id}`;
const stillPaid = (id: string) => {
  try {
    return Date.now() - Number(sessionStorage.getItem(key(id)) || 0) < USE_WINDOW_MS;
  } catch {
    return false;
  }
};

export function UsageGate({ toolId, children }: { toolId: string; children: ReactNode }) {
  const { user } = useAuth();
  const { creditCost } = useToolPricing(toolId);
  const [state, setState] = useState<"idle" | "charging" | "paid" | "blocked">(() => (stillPaid(toolId) ? "paid" : "idle"));
  const [reason, setReason] = useState<"login" | "credits" | "error">("credits");
  const busy = useRef(false);

  useEffect(() => setState(stillPaid(toolId) ? "paid" : "idle"), [toolId]);

  const charge = useCallback(async () => {
    if (busy.current) return;
    if (stillPaid(toolId)) return setState("paid");
    if (!user) {
      setReason("login");
      setState("blocked");
      emitCreditPrompt({ kind: "login" });
      return;
    }
    busy.current = true;
    setState("charging");
    try {
      const { charged } = await runWithCredits(toolId, async () => undefined, {
        onInsufficient: (required, balance) => emitCreditPrompt({ kind: "buy", required, balance }),
      });
      try {
        sessionStorage.setItem(key(toolId), String(Date.now()));
      } catch {
        /* ignore */
      }
      emitCreditPrompt({ kind: "charged" });
      if (charged > 0) toast.success(`${charged} credit${charged === 1 ? "" : "s"} used — use this app freely for the next 30 minutes`);
      setState("paid");
    } catch (e) {
      setReason(e instanceof Error && e.message === "insufficient_credits" ? "credits" : "error");
      setState("blocked");
    } finally {
      busy.current = false;
    }
  }, [toolId, user]);

  const onWork = () => {
    if (state === "idle") void charge();
  };

  return (
    <div className="relative" onChangeCapture={onWork} onInputCapture={onWork} onDropCapture={onWork}>
      {children}
      {(state === "blocked" || state === "charging") && (
        <div className="absolute inset-0 z-30 flex items-start justify-center bg-background/80 p-6 pt-24 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-center shadow-xl">
            {state === "charging" ? (
              <p className="flex items-center justify-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Starting your session…</p>
            ) : (
              <>
                <Lock className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-2 font-semibold">
                  {reason === "login" ? "Sign in to use this app" : reason === "credits" ? `This app uses ${creditCost} credit${creditCost === 1 ? "" : "s"} per use` : "Couldn't start the app"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {reason === "login" ? "It's free to sign up and you get 100 free credits." : reason === "credits" ? "Top up to continue — one charge covers 30 minutes of use." : "Please try again."}
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  {reason === "login" ? (
                    <Button onClick={() => emitCreditPrompt({ kind: "login" })}>Sign in</Button>
                  ) : (
                    <Button onClick={() => void charge()}>Try again</Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
