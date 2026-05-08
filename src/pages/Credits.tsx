import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useWallet, useRefreshWallet } from "@/hooks/useWallet";
import { CREDIT_PACKS } from "@/data/creditPacks";
import { ensureRazorpay } from "@/hooks/useRazorpayScript";
import { Zap, Loader2, ChevronDown, Check, Sparkles, ShieldCheck } from "lucide-react";
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
        title="Credits — Pay-as-you-go AI Apps"
        description="Top up your EZYOURLIFE wallet. No subscriptions, just credits. Starts at ₹10."
        path="/credits"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <Badge variant="secondary" className="mb-3"><Sparkles className="h-3 w-3 mr-1" /> No subscriptions</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Just credits.</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Pay only for successful runs, starting at ₹10. Free credits reset every month — paid credits never expire.
          </p>
        </motion.section>

        {/* Wallet snapshot or sign-in CTA */}
        {user ? (
          <Card className="mb-8 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Your wallet</p>
                <p className="text-4xl font-semibold tabular-nums flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary" />
                  {walletLoading ? "—" : total}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="tabular-nums">{free}</span> free · <span className="tabular-nums">{paid}</span> paid
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link to="/credits/history">Transaction history</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/ai-apps">Browse AI apps</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Packs */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CREDIT_PACKS.map((pack) => {
            return (
              <motion.div
                key={pack.id}
                whileHover={{ y: -2 }}
                className={`relative rounded-xl border bg-card p-5 ${pack.badge ? "border-primary/50" : "border-border"}`}
              >
                {pack.badge && (
                  <Badge className="absolute -top-2 right-4">{pack.badge}</Badge>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">₹{pack.inr}</span>
                </div>
                <p className="text-base mt-2 line-through text-muted-foreground/70">
                  ₹{pack.inr} = {pack.inr} credits
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Zap className="h-6 w-6 text-primary" />
                  <span className="text-2xl font-bold text-primary tabular-nums">{pack.credits}</span>
                  <span className="text-base text-foreground">credits</span>
                </div>
                {pack.credits > pack.inr && (
                  <p className="text-xs text-emerald-500 font-medium mt-1">
                    You save {Math.round(((pack.credits - pack.inr) / pack.inr) * 100)}%
                  </p>
                )}
                <Button
                  className="w-full mt-4"
                  onClick={() => buyPack(pack.id)}
                  disabled={busyPack === pack.id}
                >
                  {busyPack === pack.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buy"}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Coupon */}
        <Collapsible open={couponOpen} onOpenChange={setCouponOpen} className="mt-6">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${couponOpen ? "rotate-180" : ""}`} />
              Have a coupon code?
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 flex gap-2 max-w-sm">
              <Input
                placeholder="Enter coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={couponBusy}
              />
              <Button onClick={handleCoupon} disabled={couponBusy || !couponCode.trim()}>
                {couponBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Trust */}
        <div className="mt-12 grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 text-primary" /> No recurring charges, ever.</div>
          <div className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 text-primary" /> Credits deducted only on successful runs.</div>
          <div className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 mt-0.5 text-primary" /> 50 free on signup + 50 after first action.</div>
        </div>
      </main>
      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} returnTo={pendingPack ? `/credits?pack=${pendingPack}` : "/credits"} />
      <SEOFooter />
    </>
  );
};

export default Credits;
