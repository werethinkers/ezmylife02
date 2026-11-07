import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Zap, Loader2, Check } from "lucide-react";
import { CREDIT_PACKS } from "@/data/creditPacks";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getRefCode } from "@/lib/refTracking";
import { useRefreshWallet } from "@/hooks/useWallet";
import { ensureRazorpay } from "@/hooks/useRazorpayScript";
import { toast } from "sonner";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import AppleCreditPacks from "@/components/wallet/AppleCreditPacks";
import { canBuyInThisApp } from "@/lib/nativeApp";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  required?: number;
  balance?: number;
  onPurchased?: () => void;
  defaultPackId?: string;
  autoStart?: boolean;
}

export const BuyCreditsDialog = ({ open, onOpenChange, required, balance, onPurchased, defaultPackId, autoStart }: Props) => {
  const { user } = useAuth();
  const refreshWallet = useRefreshWallet();
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(() => {
    if (defaultPackId && CREDIT_PACKS.some((p) => p.id === defaultPackId)) return defaultPackId;
    if (required) {
      const fit = CREDIT_PACKS.find((p) => p.credits >= required);
      if (fit) return fit.id;
    }
    return CREDIT_PACKS.find((p) => p.badge === "Popular")?.id ?? "p250";
  });
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (open && defaultPackId) setSelected(defaultPackId);
  }, [open, defaultPackId]);

  useEffect(() => {
    if (open && autoStart && defaultPackId && user && !busy) {
      buy(defaultPackId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoStart, defaultPackId, user]);

  const buy = async (packId: string) => {
    if (!canBuyInThisApp()) return;
    if (!user) { setLoginOpen(true); return; }
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    try {
      setBusy(packId);
      const ok = await ensureRazorpay();
      if (!ok) throw new Error("Could not load payment script");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoginOpen(true); return; }

      const { data: orderData, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: { pack_id: packId, ref_code: getRefCode() },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error || orderData?.error) throw new Error(orderData?.error || error?.message);

      const rzp = new (window as any).Razorpay({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "EZYOURLIFE",
        description: orderData.description,
        order_id: orderData.order_id,
        handler: async (resp: any) => {
          const { data: v, error: ve } = await supabase.functions.invoke("verify-razorpay-payment", {
            body: {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              purchase_id: orderData.purchase_id,
            },
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (ve || !v?.success) {
            toast.error("Payment verification failed. Please contact support.");
            return;
          }
          await refreshWallet();
          toast.success(`${pack.credits} credits added to your wallet!`);
          onOpenChange(false);
          onPurchased?.();
        },
        prefill: { email: orderData.user_email },
        theme: { color: "#7c3aed" },
        modal: { ondismiss: () => setBusy(null) },
      });
      rzp.on("payment.failed", (r: any) => {
        toast.error(r.error?.description || "Payment failed");
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e.message || "Could not start payment");
    } finally {
      setBusy(null);
    }
  };

  // In the iPhone app, credits are bought with Apple in-app purchase (docs/ios-app.md).
  if (!canBuyInThisApp()) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                {required != null ? "Top up to keep going" : "Buy credits"}
              </DialogTitle>
              <DialogDescription>
                {required != null && balance != null
                  ? `You need ${required} credits but have ${balance}. Pick a pack below.`
                  : "Pick a pack. Apple's payment sheet opens right here."}
              </DialogDescription>
            </DialogHeader>
            <AppleCreditPacks
              required={required}
              defaultPackId={defaultPackId}
              onNeedLogin={() => setLoginOpen(true)}
              onBought={() => { onOpenChange(false); onPurchased?.(); }}
            />
          </DialogContent>
        </Dialog>
        <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} />
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {required != null ? "Top up to keep going" : "Buy credits"}
            </DialogTitle>
            <DialogDescription>
              {required != null && balance != null
                ? `You need ${required} credits but have ${balance}. Pick a pack below — payment opens right here.`
                : "Pick a pack — payment opens right here, no page change."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {CREDIT_PACKS.map((p) => {
              const isSel = selected === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className={`relative text-left rounded-xl border p-3 transition ${
                    isSel ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                  }`}
                >
                  {p.badge && (
                    <span className="absolute -top-2 right-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                      {p.badge}
                    </span>
                  )}
                  <div className="font-bold text-lg">₹{p.inr}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3 text-primary" /> {p.credits} credits
                  </div>
                  {isSel && (
                    <Check className="absolute top-2 left-2 h-4 w-4 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
          <Button
            className="w-full mt-3 h-12"
            onClick={() => buy(selected)}
            disabled={!!busy}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ₹${CREDIT_PACKS.find(p => p.id === selected)?.inr} with Razorpay`}
          </Button>
          <p className="text-[11px] text-center text-muted-foreground mt-1">
            Secure payment via Razorpay · UPI, cards, wallets
          </p>
        </DialogContent>
      </Dialog>
      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
};

export default BuyCreditsDialog;
