import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useWallet, useRefreshWallet } from "@/hooks/useWallet";
import { BASELINE_CREDITS_PER_RUPEE, CREDIT_PACKS } from "@/data/creditPacks";
import { ensureRazorpay } from "@/hooks/useRazorpayScript";
import { Zap, Loader2, ChevronDown, Check, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";

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

  useEffect(() => {
    const pack = searchParams.get("pack");
    if (pack && user) {
      const t = setTimeout(() => buyPack(pack), 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);

  const buyPack = async (packId: string) => {
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
        body: { pack_id: packId },
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
    <>
      <SEOHead
        title="Prices and credits — pay only for what you use | EZYOURLIFE"
        description="EZYOURLIFE apps use credits only when they give you a result. Packs from ₹10, no monthly plan, 100 free credits to start."
        path="/credits"
      />
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border-2 border-ink bg-sky p-6 shadow-block-lg md:p-10"
        >
          <span className="inline-flex rounded-full border-2 border-ink bg-card px-2.5 py-0.5 text-xs font-bold">No monthly plan</span>
          <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Pay only for what you use</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink/85">
            Apps are paid with credits. Buy a pack from ₹10, and an app uses its credits only when it gives you a result. Websites and cards are
            paid once, on their own page.
          </p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { t: "Every app shows its price", s: "Most apps use 1 credit a result. Bigger jobs show more." },
              { t: "Credits only when it works", s: "If an app fails, you are not charged." },
              { t: "Free to start", s: "50 free credits when you sign up, 50 more after your first run." },
            ].map((x, i) => (
              <li key={x.t} className="flex gap-3 rounded-2xl border-2 border-ink bg-card p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun font-display font-extrabold">{i + 1}</span>
                <span>
                  <span className="block font-bold">{x.t}</span>
                  <span className="block text-sm text-muted-foreground">{x.s}</span>
                </span>
              </li>
            ))}
          </ol>
        </motion.section>

        {/* Wallet snapshot */}
        {user ? (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-ink bg-lime p-5 shadow-block">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide">Your credits</p>
              <p className="flex items-center gap-2 font-display text-4xl font-extrabold tabular-nums">
                <Zap className="h-6 w-6" />
                {walletLoading ? "—" : total}
              </p>
              <p className="mt-1 text-sm">
                <span className="tabular-nums">{free}</span> free · <span className="tabular-nums">{paid}</span> paid
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to="/credits/history">Payments and usage</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/ai-apps">Use an app</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {/* Packs */}
        <h2 className="mb-5 mt-12 text-2xl font-bold md:text-3xl">Credit packs</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CREDIT_PACKS.map((pack) => {
            const base = Math.round(pack.inr * BASELINE_CREDITS_PER_RUPEE);
            const extra = pack.credits - base;
            const perCredit = pack.inr / pack.credits;
            return (
              <motion.div key={pack.id} whileHover={{ y: -2 }} className={`relative rounded-2xl border-2 border-ink p-5 shadow-block ${pack.badge ? "bg-sun" : "bg-card"}`}>
                {pack.badge && (
                  <span className="absolute -top-3 right-4 rounded-full border-2 border-ink bg-pink px-2.5 py-0.5 text-xs font-bold">{pack.badge}</span>
                )}
                <p className="font-display text-4xl font-extrabold">₹{pack.inr}</p>
                <p className="mt-2 flex items-center gap-1.5 text-lg">
                  <Zap className="h-5 w-5" />
                  <span className="font-bold tabular-nums">{pack.credits}</span> credits
                </p>
                <p className="mt-1 text-sm text-ink/75">
                  About ₹{perCredit.toFixed(2)} a credit
                  {extra > 0 ? ` · ${extra} more credits than buying ₹10 packs` : ""}
                </p>
                <Button className="mt-4 w-full" onClick={() => buyPack(pack.id)} disabled={busyPack === pack.id}>
                  {busyPack === pack.id ? <Loader2 className="h-4 w-4 animate-spin" /> : `Buy ₹${pack.inr} pack`}
                </Button>
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
              <Button onClick={handleCoupon} disabled={couponBusy || !couponCode.trim()}>
                {couponBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Websites and cards */}
        <section className="mt-12 grid gap-5 md:grid-cols-2">
          <Link to="/websites" className="block-card block-lift bg-teal p-6">
            <p className="font-display text-xl font-bold">Websites</p>
            <p className="mt-1 text-ink/85">Paid once per design, online for a year. The price is on each design.</p>
          </Link>
          <Link to="/cards" className="block-card block-lift bg-sun p-6">
            <p className="font-display text-xl font-bold">Cards and invites</p>
            <p className="mt-1 text-ink/85">Paid once per card. The price is on each design.</p>
          </Link>
        </section>

        {/* Trust */}
        <div className="mt-10 grid gap-4 text-[15px] sm:grid-cols-3">
          <div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" /> No recurring charges, ever.</div>
          <div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" /> Credits are used only when an app works.</div>
          <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" /> Secure payments with UPI, cards or netbanking.</div>
        </div>
      </main>
      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} returnTo={pendingPack ? `/credits?pack=${pendingPack}` : "/credits"} />
      <SEOFooter />
    </>
  );
};

export default Credits;
