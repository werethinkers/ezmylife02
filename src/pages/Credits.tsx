import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getRefCode } from "@/lib/refTracking";
import { useWallet, useRefreshWallet } from "@/hooks/useWallet";
import { BASELINE_CREDITS_PER_RUPEE, CREDIT_PACKS } from "@/data/creditPacks";
import { ensureRazorpay } from "@/hooks/useRazorpayScript";
import { Zap, Loader2, ChevronDown, Check, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import { seoFor } from "@/lib/seo/pages";
import AppleCreditPacks from "@/components/wallet/AppleCreditPacks";
import { canBuyInThisApp } from "@/lib/nativeApp";
import { ModernPage } from "@/components/modern/ModernPage";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, CONTAINER, FOCUS_RING } from "@/components/modern/styles";
import { cn } from "@/lib/utils";

const Credits = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { free, paid, total, isLoading: walletLoading } = useWallet();
  const refreshWallet = useRefreshWallet();

  const [busyPack, setBusyPack] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingPack, setPendingPack] = useState<string | null>(null);

  useEffect(() => { ensureRazorpay(); }, []);

  // ?next=/path: where to send people back after buying (a card's "Send all", a page waiting to publish).
  useEffect(() => {
    const next = searchParams.get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) { try { sessionStorage.setItem("credits_next", next); } catch { /* ignore */ } }
  }, [searchParams]);

  useEffect(() => {
    const pack = searchParams.get("pack");
    if (pack && user) {
      const t = setTimeout(() => buyPack(pack), 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);

  const buyPack = async (packId: string) => {
    if (!canBuyInThisApp()) return;
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    if (!user) {
      setPendingPack(packId);
      try { localStorage.setItem("auth_redirect_to", `/credits?pack=${packId}`); } catch { /* ignore */ }
      setLoginOpen(true);
      return;
    }
    try {
      setBusyPack(packId);
      await ensureRazorpay();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoginOpen(true); return; }

      const { data: orderData, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: { pack_id: packId, ref_code: getRefCode() },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error || orderData?.error) throw new Error(orderData?.error || error?.message);

      const options = {
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
            toast({ title: "Verification failed", description: "Please contact support.", variant: "destructive" });
            return;
          }
          await refreshWallet();
          navigate(`/credits/success?credits=${pack.credits}&pack=${packId}`);
        },
        prefill: { email: orderData.user_email },
        theme: { color: "#7c3aed" },
        modal: { ondismiss: () => setBusyPack(null) },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (r: any) => {
        toast({ title: "Payment failed", description: r.error?.description || "Try again.", variant: "destructive" });
      });
      rzp.open();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Could not start payment", variant: "destructive" });
    } finally {
      setBusyPack(null);
    }
  };

  const handleCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setCouponBusy(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      // Visiting-card codes look like K7M2-9XQP-4TRD and have their own claim function.
      if (/^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(couponCode.trim())) {
        const { data: card, error: cardErr } = await supabase.functions.invoke("claim-card-promo", {
          body: { code: couponCode.trim() },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (cardErr) throw cardErr;
        if (card?.ok) {
          toast({ title: "Card claimed", description: `${card.credits} gift credits added. Each app can use them ${card.per_app_limit} times.` });
          setCouponCode("");
          await refreshWallet();
        } else {
          toast({ title: "Card not claimed", description: card?.message || "Could not claim", variant: "destructive" });
        }
        return;
      }
      const { data, error } = await supabase.functions.invoke("redeem-coupon", {
        body: { coupon_code: couponCode },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Coupon redeemed", description: data.message });
        setCouponCode("");
        await refreshWallet();
      } else {
        toast({ title: "Invalid coupon", description: data?.error || "Could not redeem", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Try again", variant: "destructive" });
    } finally {
      setCouponBusy(false);
    }
  };

  return (
    <ModernPage section="prices">
      <SEOHead
        {...seoFor("/credits", "")}
      />
      <main className={cn(CONTAINER, "py-8 md:py-12")}>
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl bg-zinc-950 p-6 text-white shadow-soft-xl dark:bg-zinc-900 md:p-10"
        >
          <span className="inline-flex rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-zinc-950">No monthly plan</span>
          <h1 className="mt-3 font-display text-3xl font-extrabold md:text-5xl">Pay only for what you use</h1>
          <p className="mt-3 max-w-2xl text-lg text-zinc-300">
            {canBuyInThisApp()
              ? "Apps are paid with credits. Buy a pack from ₹10, and an app uses its credits only when it gives you a result. Websites and cards are paid once, on their own page."
              : "Apps are paid with credits, and an app uses its credits only when it gives you a result."}
          </p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { t: "Every app shows its price", s: "Browser apps use 1 credit, AI apps start at 2. Bigger jobs show more." },
              { t: "Credits only when it works", s: "If an app fails, you are not charged." },
              { t: "Free to start", s: "50 free credits when you sign up, 50 more after your first run." },
            ].map((x, i) => (
              <li key={x.t} className="flex gap-3 rounded-2xl border border-zinc-800 bg-white/5 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 font-display font-extrabold text-zinc-950">{i + 1}</span>
                <span>
                  <span className="block font-bold">{x.t}</span>
                  <span className="block text-sm text-zinc-400">{x.s}</span>
                </span>
              </li>
            ))}
          </ol>
        </motion.section>

        {/* Wallet snapshot */}
        {user ? (
          <div className={cn("mt-8 flex flex-wrap items-center justify-between gap-4 p-5 shadow-soft", CARD)}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Your credits</p>
              <p className="flex items-center gap-2 font-display text-4xl font-extrabold tabular-nums">
                <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" aria-hidden />
                {walletLoading ? "—" : total}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="tabular-nums">{free}</span> free · <span className="tabular-nums">{paid}</span> paid
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/credits/history" className={BTN_OUTLINE}>
                Payments and usage
              </Link>
              <Link to="/ai-apps" className={BTN_OUTLINE}>
                Use an app
              </Link>
            </div>
          </div>
        ) : null}

        {/* iPhone app: credits are paid with Apple in-app purchase (docs/ios-app.md) */}
        {!canBuyInThisApp() && (
          <section className="mt-12">
            <h2 className="mb-5 font-display text-2xl font-bold md:text-3xl">Credit packs</h2>
            <div className={cn("max-w-xl p-5 shadow-soft", CARD)}>
              <AppleCreditPacks
                onNeedLogin={() => setLoginOpen(true)}
                onBought={(credits) => navigate(`/credits/success?credits=${credits}`)}
              />
            </div>
          </section>
        )}

        {/* Packs (not in the iOS app: Apple rules, see docs/ios-app.md) */}
        {canBuyInThisApp() && (<>
        <h2 className="mb-5 mt-12 font-display text-2xl font-bold md:text-3xl">Credit packs</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CREDIT_PACKS.map((pack) => {
            const base = Math.round(pack.inr * BASELINE_CREDITS_PER_RUPEE);
            const extra = pack.credits - base;
            const perCredit = pack.inr / pack.credits;
            return (
              <motion.div
                key={pack.id}
                whileHover={{ y: -2 }}
                className={cn(
                  "relative flex h-full flex-col rounded-2xl p-5 shadow-soft",
                  pack.badge ? "border-2 border-orange-500 bg-zinc-950 text-white dark:bg-zinc-900" : CARD,
                )}
              >
                {pack.badge && (
                  <span className="absolute -top-3 right-4 rounded-full bg-orange-600 px-2.5 py-0.5 text-xs font-bold text-white">{pack.badge}</span>
                )}
                <p className="font-display text-4xl font-extrabold">₹{pack.inr}</p>
                <p className="mt-2 flex items-center gap-1.5 text-lg">
                  <Zap className={cn("h-5 w-5", pack.badge ? "text-amber-300" : "text-orange-600 dark:text-orange-400")} aria-hidden />
                  <span className="font-bold tabular-nums">{pack.credits}</span> credits
                </p>
                <p className={cn("mt-1 text-sm", pack.badge ? "text-zinc-300" : "text-zinc-600 dark:text-zinc-400")}>
                  About ₹{perCredit.toFixed(2)} a credit
                  {extra > 0 ? ` · ${extra} more credits than buying ₹10 packs` : ""}
                </p>
                <button
                  type="button"
                  onClick={() => buyPack(pack.id)}
                  disabled={busyPack === pack.id}
                  className={cn(
                    pack.badge ? "bg-amber-400 text-zinc-950 hover:bg-amber-300" : BTN_PRIMARY,
                    "mt-auto flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-60",
                    FOCUS_RING,
                  )}
                >
                  {busyPack === pack.id ? <Loader2 className="h-4 w-4 animate-spin" /> : `Buy ₹${pack.inr} pack`}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Coupon */}
        <Collapsible open={couponOpen} onOpenChange={setCouponOpen} className="mt-6">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronDown className={`h-4 w-4 transition-transform ${couponOpen ? "rotate-180" : ""}`} />
              Have a coupon code?
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 flex max-w-sm gap-2">
              <Input placeholder="Enter coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} disabled={couponBusy} />
              <button
                type="button"
                onClick={handleCoupon}
                disabled={couponBusy || !couponCode.trim()}
                className={cn(BTN_PRIMARY, "h-11 disabled:opacity-60")}
              >
                {couponBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </button>
            </div>
          </CollapsibleContent>
        </Collapsible>
        </>)}

        {/* Websites and cards */}
        <section className="mt-12 grid gap-5 md:grid-cols-2">
          <Link to="/websites" className={cn("block p-6 transition hover:-translate-y-0.5", CARD)}>
            <p className="font-display text-xl font-bold">Websites</p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">Paid once per design, online for a year. The price is on each design.</p>
          </Link>
          <Link to="/cards" className={cn("block p-6 transition hover:-translate-y-0.5", CARD)}>
            <p className="font-display text-xl font-bold">Cards and invites</p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">Paid once per card. The price is on each design.</p>
          </Link>
        </section>

        {/* Trust */}
        <div className="mt-10 grid gap-4 text-[15px] text-zinc-700 dark:text-zinc-300 sm:grid-cols-3">
          <div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" /> No recurring charges, ever.</div>
          <div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" /> Credits are used only when an app works.</div>
          {canBuyInThisApp() && <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" /> Secure payments with UPI, cards or netbanking.</div>}
        </div>
      </main>
      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} returnTo={pendingPack ? `/credits?pack=${pendingPack}` : "/credits"} />
    </ModernPage>
  );
};

export default Credits;
