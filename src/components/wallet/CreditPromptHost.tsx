import { useEffect, useState } from "react";
import { BuyCreditsDialog } from "@/components/wallet/BuyCreditsDialog";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import { onCreditPrompt } from "@/lib/creditPrompt";
import { useRefreshWallet } from "@/hooks/useWallet";

/** Renders the shared sign-in / buy-credits dialogs for any app that calls handleCreditError(). */
export function CreditPromptHost() {
  const refresh = useRefreshWallet();
  const [buy, setBuy] = useState<{ open: boolean; required: number; balance: number }>({ open: false, required: 0, balance: 0 });
  const [login, setLogin] = useState(false);

  useEffect(
    () =>
      onCreditPrompt((d) => {
        if (d.kind === "login") setLogin(true);
        else if (d.kind === "buy") setBuy({ open: true, required: d.required ?? 0, balance: d.balance ?? 0 });
        else if (d.kind === "charged") refresh();
      }),
    [refresh],
  );

  return (
    <>
      <BuyCreditsDialog
        open={buy.open}
        onOpenChange={(o) => setBuy((b) => ({ ...b, open: o }))}
        required={buy.required}
        balance={buy.balance}
      />
      <LoginPromptDialog open={login} onOpenChange={setLogin} />
    </>
  );
}

export default CreditPromptHost;
