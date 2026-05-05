import { useState, useCallback } from "react";
import { runWithCredits } from "@/lib/credits";
import { useRefreshWallet, useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Convenience hook: wraps a tool's compute work with credit gating.
 * Returns:
 *   - charge(work): runs work() and debits credits on success.
 *   - dialogProps: spread onto <BuyCreditsDialog {...dialogProps} />.
 *   - loginDialogProps: spread onto <LoginPromptDialog {...loginDialogProps} />.
 */
export function useCredits(toolId: string) {
  const { user } = useAuth();
  const refresh = useRefreshWallet();
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [required, setRequired] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);

  const charge = useCallback(
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
          const newTotal = Math.max(0, (wallet.total ?? 0) - charged);
          toast.success(`Charged ${charged} credit${charged === 1 ? "" : "s"} · Balance: ${newTotal}`);
        }
        return result;
      } catch (e) {
        if (e instanceof Error && e.message === "insufficient_credits") {
          return null;
        }
        throw e;
      }
    },
    [toolId, user, refresh, wallet.total],
  );

  return {
    charge,
    dialogProps: { open, onOpenChange: setOpen, required, balance },
    loginDialogProps: { open: loginOpen, onOpenChange: setLoginOpen },
  };
}
