import { useState, useCallback } from "react";
import { functionError, runWithCredits } from "@/lib/credits";
import { useRefreshWallet } from "@/hooks/useWallet";
import { useToolPricing } from "@/hooks/useToolPricing";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Credit handling for an app.
 *   - charge(work): for AI work done by a server function. The server checks and deducts
 *     credits itself; this shows the sign-in or buy-credits dialog when the server says
 *     401 / 402, refreshes the wallet, and confirms the charge.
 *   - chargeLocal(work): for browser-only results (exports/downloads). Reserves and
 *     deducts the app's price around work().
 *   - dialogProps / loginDialogProps: spread onto <BuyCreditsDialog> / <LoginPromptDialog>.
 */
export function useCredits(toolId: string) {
  const { user } = useAuth();
  const refresh = useRefreshWallet();
  const { creditCost } = useToolPricing(toolId);
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [required, setRequired] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);

  const handleError = useCallback(async (e: unknown): Promise<boolean> => {
    const info = await functionError(e);
    if (info?.status === 402) {
      setRequired(info.data?.credits_required ?? creditCost);
      setBalance(info.data?.balance ?? 0);
      setOpen(true);
      return true;
    }
    if (info?.status === 401) {
      setLoginOpen(true);
      return true;
    }
    return false;
  }, [creditCost]);

  const charge = useCallback(
    async <T,>(work: () => Promise<T>, opts?: { free?: boolean; credits?: number }): Promise<T | null> => {
      if (!user) {
        setLoginOpen(true);
        return null;
      }
      try {
        const result = await work();
        refresh();
        const used = opts?.free ? 0 : opts?.credits ?? creditCost;
        if (used > 0) toast.success(`Done · ${used} credit${used === 1 ? "" : "s"} used`);
        return result;
      } catch (e) {
        if (await handleError(e)) return null;
        throw e;
      }
    },
    [user, refresh, creditCost, handleError],
  );

  const chargeLocal = useCallback(
    async <T,>(work: () => Promise<T>): Promise<T | null> => {
      if (!user) {
        setLoginOpen(true);
        return null;
      }
      try {
        const { result, charged } = await runWithCredits(toolId, work, {
          onInsufficient: (req, bal) => {
            setRequired(req);
            setBalance(bal);
            setOpen(true);
          },
        });
        if (charged > 0) {
          refresh();
          toast.success(`${charged} credit${charged === 1 ? "" : "s"} used`);
        }
        return result;
      } catch (e) {
        if (e instanceof Error && e.message === "insufficient_credits") return null;
        throw e;
      }
    },
    [toolId, user, refresh],
  );

  return {
    charge,
    chargeLocal,
    handleError,
    dialogProps: { open, onOpenChange: setOpen, required, balance },
    loginDialogProps: { open: loginOpen, onOpenChange: setLoginOpen },
  };
}
