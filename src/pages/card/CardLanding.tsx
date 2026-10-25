import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Gift, Loader2, LogIn, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRefreshWallet } from "@/hooks/useWallet";
import {
  type CardStatus,
  type ClaimResult,
  cardStatus,
  claimCard,
  forgetCardCode,
  rememberCardCode,
} from "@/lib/cardPromo";

/*
 * /card/:code — where the QR on a visiting card lands.
 * Signed-out visitors can create an account or log in; the code is kept and they come straight back here,
 * where it is claimed for their account automatically.
 */

const WHY_NOT: Record<string, string> = {
  invalid: "We could not find this card. Check the code printed on it.",
  inactive: "This card is no longer active.",
  expired: "This card has expired.",
  used: "This card has already been claimed.",
};

export default function CardLanding() {
  const { code = "" } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const refreshWallet = useRefreshWallet();
  const [status, setStatus] = useState<CardStatus | null>(null);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [busy, setBusy] = useState(false);
  const claimed = useRef(false);

  useEffect(() => {
    let cancelled = false;
    cardStatus(code).then((s) => !cancelled && setStatus(s));
    return () => {
      cancelled = true;
    };
  }, [code]);

  const claim = async () => {
    setBusy(true);
    const r = await claimCard(code);
    setBusy(false);
    setResult(r);
    if (r.ok) {
      forgetCardCode();
      refreshWallet();
      toast.success(`${r.credits} gift credits added`);
    }
  };

  // Signed in with a good card: claim it straight away.
  useEffect(() => {
    if (!user || authLoading || !status?.valid || claimed.current) return;
    claimed.current = true;
    void claim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, status]);

  const goAuth = (mode: "signup" | "login") => {
    rememberCardCode(code);
    try { localStorage.setItem("auth_redirect_to", `/card/${encodeURIComponent(code)}`); } catch { /* ignore */ }
    navigate(mode === "signup" ? "/auth?mode=signup" : "/auth", { state: { from: `/card/${encodeURIComponent(code)}` } });
  };

  const credits = status?.credits ?? 5000;
  const limit = status?.per_app_limit ?? 3;
  const loading = status === null || authLoading;

  return (
    <>
      <SEOHead title="Your gift card | EZYOURLIFE" description="Claim your free credits on EZYOURLIFE." path="/card" noindex />
      <Navbar />
      <main className="min-h-[70vh] bg-background px-4 py-10">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border-2 border-ink bg-sun p-6 shadow-block-lg sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-card px-3 py-1 text-xs font-bold uppercase tracking-wide">
              <Gift className="h-4 w-4" /> A gift from Abhijay
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">
              {credits.toLocaleString("en-IN")} free credits, <span className="marker">just for you</span>
            </h1>
            <p className="mt-3 text-[15px] font-medium leading-snug">
              Try any of our AI apps on the house. Create an account (or log in) and your credits are added automatically.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border-2 border-ink bg-card p-5 shadow-block-sm">
            {loading ? (
              <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Checking your card…</p>
            ) : result?.ok ? (
              <div className="space-y-3">
                <p className="font-display text-xl font-bold">You are all set</p>
                <p className="text-[15px]">
                  {result.credits?.toLocaleString("en-IN")} gift credits are in your wallet. You can use them on each app up to{" "}
                  {result.per_app_limit} times, and in Bulk Mode too. After that, an app uses your free or bought credits.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild><Link to="/ai-apps"><Sparkles className="mr-1 h-4 w-4" /> Pick an app</Link></Button>
                  <Button asChild variant="outline"><Link to="/credits">See my credits</Link></Button>
                </div>
              </div>
            ) : result && !result.ok ? (
              <div className="space-y-3">
                <p className="text-[15px] font-medium">{result.message}</p>
                <Button asChild variant="outline"><Link to="/ai-apps">Browse apps</Link></Button>
              </div>
            ) : !status?.valid ? (
              <div className="space-y-3">
                <p className="text-[15px] font-medium">{WHY_NOT[status?.reason ?? "invalid"]}</p>
                <Button asChild variant="outline"><Link to="/">Go to EZYOURLIFE</Link></Button>
              </div>
            ) : user ? (
              <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Adding your credits…</p>
            ) : (
              <div className="space-y-3">
                <p className="text-[15px] font-medium">New here? Create a free account. Already have one? Log in. Either way the credits go to that account.</p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => goAuth("signup")} disabled={busy}><UserPlus className="mr-1 h-4 w-4" /> Create account</Button>
                  <Button variant="outline" onClick={() => goAuth("login")} disabled={busy}><LogIn className="mr-1 h-4 w-4" /> Log in</Button>
                </div>
              </div>
            )}
          </div>

          <ul className="mt-5 space-y-1.5 px-1 text-[13px] text-muted-foreground">
            <li>• One card works once, on one account.</li>
            <li>• Gift credits work on each app up to {limit} times (Bulk Mode counts each file as one use). After that you need free or bought credits.</li>
            {status?.expires_at && <li>• Claim by {new Date(status.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.</li>}
          </ul>
        </div>
      </main>
      <SEOFooter />
    </>
  );
}
