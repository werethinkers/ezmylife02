import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getRefCode, parseRefParam } from "@/lib/refTracking";
import { ensureRazorpay } from "@/hooks/useRazorpayScript";
import { useRefreshWallet } from "@/hooks/useWallet";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import { toast } from "sonner";
import { KIT, TRADES } from "@/data/kit";

/*
 * The one paid offer, at /kit. Every paid channel (influencer links, ads) lands here.
 *
 * The ?ref= code is captured site-wide by useRefCapture, so this page only reads it
 * to show whose offer it is. Payment opens Razorpay in place: no page change, and the
 * amount comes from the server pack `kit999`, never from anything on this page.
 */

type Offer = {
  ok: boolean;
  name?: string;
  community_name?: string | null;
  offer_ends_at?: string | null;
  offer_cap?: number | null;
  offers_claimed?: number;
  offers_left?: number | null;
  expired?: boolean;
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const endsLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

function Countdown({ iso }: { iso: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const left = new Date(iso).getTime() - now;
  if (left <= 0) return <span>Offer has ended</span>;
  const days = Math.floor(left / 86_400_000);
  const hours = Math.floor((left % 86_400_000) / 3_600_000);
  return <span>{days > 0 ? `${days} day${days === 1 ? "" : "s"} and ` : ""}{hours} hour{hours === 1 ? "" : "s"} left</span>;
}

export default function Kit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const refreshWallet = useRefreshWallet();
  const [tradeKey, setTradeKey] = useState("shop");
  const [busy, setBusy] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const t = TRADES.find((x) => x.key === tradeKey) ?? TRADES[0];

  // The code in this URL wins; otherwise the one remembered from an earlier visit.
  // Read straight from the URL too, because this render happens before the
  // site-wide capture effect has stored it.
  const code = useMemo(() => parseRefParam(window.location.search) ?? getRefCode(), []);

  // Whose offer this is, if the visitor arrived through an influencer link.
  const offer = useQuery({
    queryKey: ["kit-offer", code],
    enabled: !!code,
    queryFn: async () => {
      const { data } = await (supabase as any).rpc("influencer_offer_public", { _code: code });
      return (data ?? { ok: false }) as Offer;
    },
  });
  const o = offer.data?.ok ? offer.data : null;
  const soldOut = !!o && o.offers_left !== null && o.offers_left !== undefined && o.offers_left <= 0;
  const expired = !!o?.expired;

  const pay = async () => {
    if (!user) { setLoginOpen(true); return; }
    setBusy(true);
    try {
      if (!(await ensureRazorpay())) throw new Error("Could not load the payment window. Check your connection.");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoginOpen(true); return; }

      const { data: order, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: { pack_id: KIT.packId, ref_code: getRefCode() },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error || order?.error) throw new Error(order?.error || error?.message);

      const rzp = new (window as any).Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "EZYOURLIFE",
        description: order.description,
        prefill: { email: order.user_email },
        theme: { color: "#121212" },
        handler: async (resp: any) => {
          const { data: v, error: ve } = await supabase.functions.invoke("verify-razorpay-payment", {
            body: {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              purchase_id: order.purchase_id,
            },
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (ve || !v?.success) {
            toast.error("Payment taken but not confirmed yet. Open My websites and cards in a minute, or write to support.");
          }
          await refreshWallet();
          navigate("/my-pages?kit=1");
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", (r: any) =>
        toast.error(r.error?.description || "Payment failed. Try again or use another UPI app."));
      rzp.open();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start the payment");
    } finally {
      setBusy(false);
    }
  };

  const payButton = (label?: string) => (
    <Button onClick={pay} disabled={busy || soldOut || expired}
            className="border-2 border-[#121212] bg-[#121212] text-white hover:bg-[#121212]/90 h-14 px-8 text-lg font-bold shadow-[5px_5px_0_#FFC800]">
      {busy ? "Opening payment…" : soldOut ? "All offers claimed" : expired ? "Offer has ended" : (label ?? `Pay ${inr(KIT.inr)} with UPI or card`)}
    </Button>
  );

  return (
    <div className="min-h-screen bg-[#FFF8EB] text-[#121212]">
      <SEOHead
        title="Your business online for ₹999 | EZYOURLIFE"
        description="A published website, a digital visiting card and 2,200 credits for business apps. One payment of ₹999, no subscription."
        path="/kit"
      />
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-14">
        {/* ---------- hero ---------- */}
        <section className="space-y-5">
          {o && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="border-2 border-[#121212] bg-white px-3 py-1 font-bold shadow-[3px_3px_0_#121212]">
                {o.community_name ? `For ${o.community_name} members` : `Shared by ${o.name}`}
              </span>
              {o.offer_ends_at && (
                <span className="border-2 border-[#121212] bg-[#FFC800] px-3 py-1 font-bold">
                  <Countdown iso={o.offer_ends_at} />
                </span>
              )}
              {o.offers_left !== null && o.offers_left !== undefined && (
                <span className="border-2 border-[#121212] bg-white px-3 py-1 font-bold">
                  {o.offers_left} of {o.offer_cap} left
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Choose your business">
            {TRADES.map((x) => (
              <button key={x.key} role="tab" aria-selected={x.key === tradeKey}
                      onClick={() => setTradeKey(x.key)}
                      className={`border-2 border-[#121212] px-3 py-1.5 text-sm font-bold ${x.key === tradeKey ? "shadow-[3px_3px_0_#121212]" : "bg-white"}`}
                      style={x.key === tradeKey ? { background: x.colour } : undefined}>
                {x.label}
              </button>
            ))}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-[1.05]">
            Everything your {t.who === "professional" ? "practice" : t.who.replace(" owner", "")} needs online. {inr(KIT.inr)}.
          </h1>
          <p className="text-xl">{t.hindi}</p>
          <ul className="grid gap-2 sm:grid-cols-2 text-base">
            {[`Your ${t.siteWord}, published and ready to share on WhatsApp`,
              "A digital visiting card, published",
              `${KIT.credits.toLocaleString("en-IN")} credits for invoices, documents and photos`,
              "One payment. No subscription."].map((g) => (
              <li key={g} className="flex gap-2"><Check className="h-5 w-5 shrink-0 mt-0.5" /> <span>{g}</span></li>
            ))}
          </ul>
          <div className="pt-2">{payButton()}</div>
          {(soldOut || expired) && (
            <p className="text-sm font-bold text-[#b1430f]">
              {expired ? "This offer's end date has passed." : "Every offer on this link has been claimed."}{" "}
              The credit packs on the pricing page are still open.
            </p>
          )}
        </section>

        {/* ---------- sample ---------- */}
        <section className="grid md:grid-cols-2 gap-6 items-start">
          <div>
            <h2 className="text-2xl font-bold">This is what your customers will see</h2>
            <p className="mt-2">
              You put in your name, your photos and your prices. It opens on any phone, and the link is yours to
              share on WhatsApp, on your board, on your bill.
            </p>
          </div>
          <div className="border-2 border-[#121212] bg-white p-5 shadow-[6px_6px_0_#121212]">
            <div className="text-xs font-bold uppercase tracking-wide text-neutral-600">Sample {t.siteWord}</div>
            <div className="text-2xl font-bold mt-1">{t.sample.name}</div>
            <div className="text-sm text-neutral-700">{t.sample.tag}</div>
            <div className="flex gap-2 mt-3">
              {["WhatsApp", "Call", "Map"].map((b) => (
                <span key={b} className="border-2 border-[#121212] px-2 py-1 text-xs font-bold" style={{ background: t.colour }}>{b}</span>
              ))}
            </div>
            <div className="mt-4 text-sm font-bold">{t.sample.listTitle}</div>
            <div className="mt-1 text-sm">
              {t.sample.rows.map((r) => (
                <div key={r.n} className="flex justify-between gap-4 border-t border-neutral-200 py-1.5">
                  <span>{r.n}</span><span className="font-mono">{r.p}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-3">Example names and prices.</p>
          </div>
        </section>

        {/* ---------- the price ---------- */}
        <section id="pay" className="border-2 border-[#121212] bg-white p-6 shadow-[6px_6px_0_#121212] space-y-4">
          <h2 className="text-2xl font-bold">What you get for {inr(KIT.inr)}</h2>
          <div className="text-sm">
            <div className="flex justify-between gap-4 border-b-2 border-[#121212] py-2 font-bold">
              <span>{KIT.credits.toLocaleString("en-IN")} credits for every business app</span>
              <span className="font-mono">{inr(KIT.creditsWorth)}</span>
            </div>
            {KIT.items.map((i) => (
              <div key={i.name} className="flex justify-between gap-4 border-b border-neutral-200 py-2">
                <span>{i.name}</span>
                <span className="font-mono">{i.worth}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-sm">Bought separately: <span className="font-bold">₹1,248 to ₹1,398</span></div>
              <div className="text-4xl font-bold mt-1">You pay {inr(KIT.inr)}</div>
              <div className="text-sm text-neutral-700 mt-1">One payment, no subscription. Payment opens right here.</div>
            </div>
            {payButton()}
          </div>
          {o?.offer_ends_at && (
            <p className="text-sm font-bold">Ends {endsLabel(o.offer_ends_at)}. After that these are sold separately.</p>
          )}
        </section>

        {/* ---------- credits as results ---------- */}
        <section className="space-y-3">
          <h2 className="text-2xl font-bold">What {KIT.credits.toLocaleString("en-IN")} credits do for a {t.who}</h2>
          <p className="text-sm">Credits are spent only when an app gives you a result. Most apps cost 1 to 3 credits.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {t.uses.map((u) => (
              <div key={u.w} className="border-2 border-[#121212] bg-white p-4 shadow-[4px_4px_0_#121212]">
                <div className="text-3xl font-bold">{u.n}</div>
                <div className="text-sm">{u.w}</div>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
            {t.apps.map((a) => (
              <div key={a.n} className="border-2 border-[#121212] bg-[#FFF8EB] px-3 py-2 text-sm flex justify-between gap-2">
                <span className="font-semibold">{a.n}</span><span className="text-neutral-600">{a.c}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-neutral-700">Plus every other business, photo and document app, on the same credits.</p>
        </section>

        {/* ---------- how it works ---------- */}
        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Live in 24 hours</h2>
          <ol className="grid gap-3 md:grid-cols-4">
            {[
              ["Pay ₹999", "UPI or card, right on this page. Credits land in your account at once."],
              ["Your website and card are waiting", "Both are already paid for. You will find them under My websites and cards."],
              ["Add your details", "Name, photos, prices. Takes a few minutes on your phone."],
              ["Publish and share", "Publishing costs you nothing. Send the link to your customers."],
            ].map(([title, body], i) => (
              <li key={title} className="border-2 border-[#121212] bg-white p-4 shadow-[4px_4px_0_#121212]">
                <div className="h-8 w-8 border-2 border-[#121212] flex items-center justify-center font-bold" style={{ background: t.colour }}>{i + 1}</div>
                <div className="font-bold mt-2">{title}</div>
                <p className="text-sm mt-1">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- questions ---------- */}
        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Questions</h2>
          {[
            ["What are credits?", `Credits pay for app results: an invoice, a salary slip, a product photo. You are charged only when the app gives you a result, and most apps cost 1 to 3 credits. The kit includes ${KIT.credits.toLocaleString("en-IN")}.`],
            ["Do I need a laptop?", "No. Everything works on your phone, and your website opens on any phone your customers use."],
            ["Is publishing really free?", "Yes, for the one website and the one visiting card in this kit. Anything you make beyond those is priced as usual."],
            ["Can I get a refund?", "Refunds follow the refund policy on this site, and only unused credits can be refunded. Ask through support and an admin will look at it."],
          ].map(([q, a]) => (
            <details key={q} className="border-2 border-[#121212] bg-white p-4">
              <summary className="font-bold cursor-pointer">{q}</summary>
              <p className="mt-2 text-sm">{a}</p>
            </details>
          ))}
        </section>

        {/* ---------- final ---------- */}
        <section className="border-2 border-[#121212] bg-[#121212] text-white p-8 text-center space-y-4">
          <h2 className="text-3xl font-bold">All of it for {inr(KIT.inr)}.</h2>
          <p>
            {o?.offer_ends_at ? `Ends ${endsLabel(o.offer_ends_at)}. ` : ""}
            {o?.offers_left !== null && o?.offers_left !== undefined ? `${o.offers_left} offers left on this link.` : ""}
          </p>
          <div className="flex justify-center">{payButton(`Get my kit for ${inr(KIT.inr)}`)}</div>
          <p className="text-xs text-white/70">
            Credits are spent only when an app gives a result. The website and visiting card in this kit are included once.
          </p>
        </section>
      </main>

      <SEOFooter />
      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
