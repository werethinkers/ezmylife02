import { useEffect, useState } from "react";
import { Zap, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRefreshWallet } from "@/hooks/useWallet";
import { buyApplePack, loadApplePacks, type ApplePack } from "@/lib/appleIap";
import { APPLE_PACKS } from "@/lib/appleIap";

/*
 * Credit packs in the iOS app, paid with Apple in-app purchase (src/lib/appleIap.ts).
 * Shown instead of the Razorpay packs. Prices come from Apple in the person's own currency.
 */
export default function AppleCreditPacks({
  onBought, onNeedLogin, defaultPackId, required,
}: {
  onBought?: (credits: number) => void;
  onNeedLogin?: () => void;
  defaultPackId?: string;
  required?: number;
}) {
  const { user } = useAuth();
  const refreshWallet = useRefreshWallet();
  const [packs, setPacks] = useState<ApplePack[] | null>(null);
  const [selected, setSelected] = useState<string>(() => {
    if (defaultPackId && APPLE_PACKS.some((p) => p.id === defaultPackId)) return defaultPackId;
    if (required) { const fit = APPLE_PACKS.find((p) => p.credits >= required); if (fit) return fit.id; }
    return "p250";
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    loadApplePacks().then((p) => live && setPacks(p)).catch(() => live && setPacks([]));
    return () => { live = false; };
  }, []);

  const buy = async () => {
    if (!user) { onNeedLogin?.(); return; }
    setBusy(true);
    try {
      const r = await buyApplePack(selected, user.id);
      await refreshWallet();
      toast.success(`${r.credits.toLocaleString("en-IN")} credits added to your wallet!`);
      onBought?.(r.credits);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not complete the purchase.";
      if (msg !== "cancelled") toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (packs === null) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (packs.length === 0) {
    return <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">Credit packs can't be loaded right now. Check your connection and try again in a moment.</p>;
  }
  const current = packs.find((p) => p.id === selected) ?? packs[0];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {packs.map((p) => {
          const isSel = current.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className={`relative rounded-xl border p-3 text-left transition ${isSel ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border hover:border-primary/50"}`}
            >
              {p.badge && <span className="absolute -top-2 right-2 rounded bg-primary px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary-foreground">{p.badge}</span>}
              <div className="text-lg font-bold">{p.priceString}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><Zap className="h-3 w-3 text-primary" /> {p.credits.toLocaleString("en-IN")} credits</div>
              {isSel && <Check className="absolute left-2 top-2 h-4 w-4 text-primary" />}
            </button>
          );
        })}
      </div>
      <Button className="mt-3 h-12 w-full" onClick={buy} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Buy ${current.credits.toLocaleString("en-IN")} credits for ${current.priceString}`}
      </Button>
      <p className="mt-1 text-center text-[11px] text-muted-foreground">Paid with your Apple ID. Credits are used only when an app works.</p>
    </div>
  );
}
