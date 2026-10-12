import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getRefCode, parseRefParam } from "@/lib/refTracking";
import { ensureRazorpay } from "@/hooks/useRazorpayScript";
import { useRefreshWallet } from "@/hooks/useWallet";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import { ProductRenderer } from "@/instant/renderers";
import { pageUrlFor } from "@/instant/util";
import { toast } from "sonner";
import { KIT, resolvePick, type KitPicks } from "@/data/kit";

/*
 * The one paid offer, at /kit. Every paid channel (influencer links, ads) lands here.
 * Built from the design mockups (desktop and phone are one responsive page).
 *
 * The ?ref= code is captured site-wide by useRefCapture, so this page only reads it
 * to show whose offer it is. Payment opens Razorpay in place: no page change, and the
 * amount comes from the server pack `kit999`, never from anything on this page.
 */

type Offer = KitPicks & {
  ok: boolean;
  name?: string;
  community_name?: string | null;
  offer_ends_at?: string | null;
  offer_cap?: number | null;
  offers_claimed?: number;
  offers_left?: number | null;
  expired?: boolean;
};

const INK = "#121212";
const CREAM = "#FFF8EC";
const GREY = "#4A4A4A";
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const num = (n: number) => n.toLocaleString("en-IN");
const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

const display = { fontFamily: "'Unbounded', 'Hind', sans-serif" } as const;
const wrap = "mx-auto w-full max-w-[1180px] px-5";
const btn =
  "flex min-h-[58px] items-center justify-center gap-2 rounded-xl border-2 border-[#121212] px-5 py-1 text-center text-lg font-bold text-[#121212] shadow-[5px_5px_0_#121212] transition-transform hover:-translate-x-px hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#121212]";

function useCountdown(iso?: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!iso) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [iso]);
  if (!iso) return null;
  const ms = Math.max(0, new Date(iso).getTime() - now);
  const two = (n: number) => String(n).padStart(2, "0");
  const d = Math.floor(ms / 86_400_000), h = Math.floor(ms / 3_600_000) % 24;
  const m = Math.floor(ms / 60_000) % 60, sec = Math.floor(ms / 1000) % 60;
  return {
    over: ms <= 0,
    parts: [{ n: two(d), u: "days" }, { n: two(h), u: "hrs" }, { n: two(m), u: "min" }, { n: two(sec), u: "sec" }],
    short: `${d}d ${h}h ${m}m`,
  };
}

const Tick = ({ light }: { light?: boolean }) => (
  <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#121212]"
        style={{ background: light ? "#BEF434" : "#BEF434" }}>
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-[#121212]" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
  </span>
);
const Cross = () => (
  <span aria-hidden="true" className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#121212]">
    <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-white" strokeWidth="4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
  </span>
);
const Arrow = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);
const Shield = ({ s = 16 }: { s?: number }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" style={{ width: s, height: s }} className="shrink-0 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>
);
const Pill = ({ children, bg }: { children: React.ReactNode; bg: string }) => (
  <span className="shrink-0 rounded-full border-2 border-[#121212] px-[9px] py-px text-[12.5px] font-bold" style={{ background: bg }}>{children}</span>
);
const Trust = () => (
  <p className="m-0 flex items-center justify-center gap-1.5 text-[14.5px] font-bold">
    <Shield /> Unused credits refundable · UPI, card, netbanking
  </p>
);

function Digits({ parts, dark }: { parts: { n: string; u: string }[]; dark?: boolean }) {
  return (
    <span className="flex gap-1.5">
      {parts.map((t) => (
        <span key={t.u} className="flex min-w-[50px] flex-col items-center rounded-[10px] border-2 border-[#121212] px-1 pb-1 pt-[5px] leading-[1.1]"
              style={{ background: dark ? INK : "#fff", color: dark ? "#FFC800" : INK }}>
          <span className="text-[19px] font-extrabold tabular-nums" style={display}>{t.n}</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.08em]">{t.u}</span>
        </span>
      ))}
    </span>
  );
}

/** A phone-shaped window showing a real design from the catalogue. */
function DesignPhone({ pick }: { pick: ReturnType<typeof resolvePick> }) {
  return (
    <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[2rem] border-[7px] border-[#121212] bg-[#121212] shadow-[5px_5px_0_#121212]">
      <div className="ip-frame relative h-[440px] overflow-hidden" style={{ transform: "translateZ(0)", ["--ip-vh" as string]: "440px", background: pick.theme.c.bg }}>
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <ProductRenderer product={pick.product} theme={pick.theme} content={pick.product.sample} mode="preview" pageUrl={pageUrlFor()} />
        </div>
      </div>
    </div>
  );
}

type DemoId = "bill" | "photo" | "site" | "card";

export default function Kit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const refreshWallet = useRefreshWallet();
  const [busy, setBusy] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [demo, setDemo] = useState<DemoId>("bill");

  // The code in this URL wins; otherwise the one remembered from an earlier visit.
  // Read straight from the URL too, because this render happens before the
  // site-wide capture effect has stored it.
  const code = useMemo(() => parseRefParam(window.location.search) ?? getRefCode(), []);

  // Whose offer this is, and which designs they chose, if the visitor arrived through an influencer link.
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
  const blocked = soldOut || expired;
  const clock = useCountdown(o?.offer_ends_at);
  const site = resolvePick("site", o);
  const card = resolvePick("card", o);

  const community = o?.community_name || o?.name || null;
  const deadline = o?.offer_ends_at ? dayLabel(o.offer_ends_at) : null;
  const capN = o?.offer_cap ?? null;
  const claimed = o?.offers_claimed ?? 0;

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
        theme: { color: INK },
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

  const label = (text: string) =>
    busy ? "Opening payment…" : soldOut ? "All offers claimed" : expired ? "Offer has ended" : text;
  const Pay = ({ text, bg = "#FF8FE9", extra = "" }: { text: string; bg?: string; extra?: string }) => (
    <button type="button" onClick={pay} disabled={busy || blocked} className={`${btn} ${extra}`} style={{ background: bg }}>
      {label(text)} {!blocked && !busy && <Arrow />}
    </button>
  );

  const DEMOS: { id: DemoId; tab: string; tag: string; inputs: string[]; line: string }[] = [
    { id: "bill", tab: "Make a bill", tag: "Uses 1 credit", inputs: ["Mehta Traders", "GST filing, ₹5,000", "GST 18%"], line: "Three details in, a GST invoice out." },
    { id: "photo", tab: "Clean a photo", tag: "Uses credits", inputs: ["Upload a product photo"], line: "One photo in, a catalogue photo out." },
    { id: "site", tab: "Your website", tag: "Included, free", inputs: ["Your shop name", "Your phone number", "Timings and price list"], line: "Pick a design, add your details. Your shop gets its own page for a year." },
    { id: "card", tab: "Visiting card", tag: "Included, free", inputs: ["Your name", "Your business", "Phone number and city"], line: "Your visiting card as a link. No printing." },
  ];
  const cur = DEMOS.find((d) => d.id === demo) ?? DEMOS[0];

  const chip = "rounded-[10px] border-2 border-[#121212] bg-white px-3 py-[5px] text-[13.5px] font-bold text-center";
  const bar = (n: string) => <span className="text-[12.5px] font-bold uppercase tracking-[0.1em]" style={{ color: GREY }}>{n}</span>;

  return (
    <div className="flex min-h-screen flex-col text-base leading-normal" style={{ background: CREAM, color: INK, fontFamily: "'Hind', system-ui, sans-serif" }}>
      <SEOHead
        title="Your business online for ₹999 | EZYOURLIFE"
        description="A published website, a digital visiting card and 2,200 credits for business apps. One payment of ₹999, no subscription."
        path="/kit"
      />

      {community && (
        <div className="px-4 py-[9px] text-center text-[13.5px] font-bold tracking-[0.02em]" style={{ background: INK, color: "#FFC800" }}>
          {community} offer{deadline ? ` · ends ${deadline}` : ""} · pay once
        </div>
      )}

      <header className="border-b-2 border-[#121212]">
        <div className={`${wrap} flex items-center justify-between gap-3 py-2.5`}>
          <Link to="/" className="flex items-center gap-2 no-underline" style={{ color: INK }}>
            <span aria-hidden="true" className="relative block h-7 w-7 rounded-full border-2 border-[#121212] bg-[#FFC800] shadow-[2px_2px_0_#121212]">
              <span className="absolute inset-[5px] block rounded-full border-2 border-[#121212] bg-[#FF8FE9]" />
            </span>
            <span className="text-[17px] font-extrabold tracking-[-0.02em]" style={display}>EZYOURLIFE</span>
          </Link>
          <button type="button" onClick={pay} disabled={busy || blocked}
                  className="flex h-11 items-center justify-center rounded-xl border-2 border-[#121212] bg-[#FF8FE9] px-4 text-[15.5px] font-bold shadow-[3px_3px_0_#121212] disabled:opacity-60">
            {blocked ? "Offer closed" : `Pay ${inr(KIT.inr)}`}
          </button>
        </div>
      </header>

      {clock && !clock.over && (
        <div className="border-b-2 border-[#121212]" style={{ background: "#FF8157" }}>
          <div className={`${wrap} flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-2.5`}>
            <strong className="text-[15.5px]">This price ends in</strong>
            <Digits parts={clock.parts} dark />
          </div>
        </div>
      )}

      {/* ---------- hero ---------- */}
      <section>
        <div className={`${wrap} flex flex-wrap items-center gap-x-12 gap-y-[22px] py-11`}>
          <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-3.5">
            {community && (
              <span className="self-start rounded-full border-2 border-[#121212] px-3 py-1 text-[13.5px] font-bold" style={{ background: "#BEF434" }}>
                Only for {community} members
              </span>
            )}
            <h1 className="m-0 text-[clamp(36px,6vw,60px)] font-extrabold leading-[1.12] tracking-[-0.015em]" style={display}>
              <span className="block">Everything for</span>
              <span className="mt-2 -ml-0.5 inline-block -rotate-[1.5deg] rounded-[14px] border-2 border-[#121212] px-3.5 pb-1.5 pt-0.5 shadow-[5px_5px_0_#121212]" style={{ background: "#FFC800" }}>
                {inr(KIT.inr)}.
              </span>
            </h1>
            <p className="m-0 mt-1.5 text-lg font-semibold leading-[1.4]">
              Business apps for your bills, photos and posts. Plus your own website and visiting card. Pay once.
            </p>
            <p className="m-0 text-base font-bold" style={{ color: "#AC156B" }}>Sirf {inr(KIT.inr)}. Try karke dekho.</p>
          </div>

          <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5 rounded-[20px] border-2 border-[#121212] bg-white p-[18px] shadow-[7px_7px_0_#121212]">
            <div className="flex items-baseline justify-between gap-2.5">
              <strong className="text-[16.5px]">You get all of this</strong>
              <span className="text-[22px] font-extrabold tracking-[-0.02em]" style={display}>{inr(KIT.inr)}</span>
            </div>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {[
                { t: `${num(KIT.credits)} credits`, s: "For bills, documents, photos and posts", b: `Worth ${inr(KIT.creditsWorth)}` },
                { t: "Website for your business", s: `Online for a year · sold at ${KIT.items[0].worth.replace("₹149 to ", "up to ")}`, b: "Free" },
                { t: "Digital visiting card", s: `Share it as a link · sold at ${KIT.items[1].worth}`, b: "Free" },
              ].map((r) => (
                <li key={r.t} className="flex items-center gap-2.5">
                  <Tick />
                  <span className="min-w-0 flex-1 leading-tight"><strong className="block text-[16.5px]">{r.t}</strong><span className="text-[13.5px]" style={{ color: GREY }}>{r.s}</span></span>
                  <Pill bg="#FF8FE9">{r.b}</Pill>
                </li>
              ))}
            </ul>
            {capN !== null && (
              <div className="flex flex-col gap-1.5 rounded-xl border-2 border-[#121212] px-3 py-2.5" style={{ background: CREAM }}>
                <span className="flex items-baseline justify-between gap-2 text-[14.5px] font-bold">
                  <span>Only {num(capN)} member packs</span>
                  <span style={{ color: "#AC156B" }}>{num(Math.max(0, capN - claimed))} left</span>
                </span>
                <span role="img" aria-label="Member packs claimed so far" className="block h-3.5 overflow-hidden rounded-full border-2 border-[#121212] bg-white">
                  <span className="block h-full" style={{ width: `${Math.min(100, Math.round((claimed / capN) * 100))}%`, background: "#FF8157" }} />
                </span>
              </div>
            )}
            {Pay({ text: `Pay ${inr(KIT.inr)} now` })}
            <Trust />
            {(soldOut || expired) && (
              <p className="m-0 text-sm font-bold" style={{ color: "#b1430f" }}>
                {expired ? "This offer's end date has passed." : "Every offer on this link has been claimed."}{" "}
                The credit packs on the pricing page are still open.
              </p>
            )}
          </div>
        </div>
      </section>

      <div aria-hidden="true" className="flex h-[52px] items-center justify-center gap-6 overflow-hidden whitespace-nowrap px-4 text-[15px] font-bold" style={{ ...display, background: INK }}>
        <span style={{ color: "#FFC800" }}>Pay once ✦</span>
        <span style={{ color: "#FF8FE9" }}>Unused credits refundable ✦</span>
        <span style={{ color: CREAM }} className="hidden sm:inline">No monthly plan ✦</span>
        <span style={{ color: "#FFC800" }} className="hidden md:inline">{num(KIT.credits)} credits ✦</span>
        <span style={{ color: "#FF8FE9" }} className="hidden md:inline">Free website ✦</span>
      </div>

      {/* ---------- see what you get ---------- */}
      <section className="border-t-2 border-[#121212]">
        <div className={`${wrap} pb-10 pt-9`}>
          <h2 className="m-0 text-2xl font-bold leading-tight tracking-[-0.015em]" style={display}>See what you get</h2>
          <p className="mb-4 mt-1.5 text-base" style={{ color: GREY }}>Tap one to try it.</p>
          <div className="flex flex-wrap gap-2">
            {DEMOS.map((d) => (
              <button key={d.id} type="button" onClick={() => setDemo(d.id)} aria-pressed={d.id === demo}
                      className="min-h-[44px] rounded-full border-2 border-[#121212] px-4 text-[15px] font-bold"
                      style={{ background: d.id === demo ? INK : "#fff", color: d.id === demo ? CREAM : INK }}>
                {d.tab}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-stretch gap-x-6 gap-y-4 rounded-[20px] border-2 border-[#121212] bg-white p-[18px] shadow-[6px_6px_0_#121212]">
            <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2">
              {bar("You type")}
              {cur.inputs.map((i) => (
                <span key={i} className="block rounded-[10px] border-2 border-[#121212] px-3 py-[9px] text-[15px] font-semibold" style={{ background: CREAM }}>{i}</span>
              ))}
              <p className="m-0 mt-1.5 text-[15px]" style={{ color: GREY }}>{cur.line}</p>
            </div>

            <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2">
              <span className="flex items-center justify-between gap-2">{bar("You get")}<Pill bg="#BEF434">{cur.tag}</Pill></span>

              {demo === "bill" && (
                <div className="flex flex-1 flex-col gap-2.5 rounded-md border-2 border-[#121212] bg-white p-4 text-[13.5px] leading-[1.35] shadow-[5px_5px_0_#121212]">
                  <div className="flex items-start justify-between gap-2.5">
                    <div><strong className="block text-[15px]">Verma Tax Consultants</strong><span style={{ color: GREY }}>12 MG Road, Indore<br />GSTIN 23ABCDE1234F1Z5</span></div>
                    <div className="text-right"><strong className="block text-[13px] tracking-[0.04em]" style={display}>TAX INVOICE</strong><span style={{ color: GREY }}>INV-101<br />9 Oct 2026</span></div>
                  </div>
                  <div className="rounded-md border-2 border-[#121212] px-2.5 py-1.5" style={{ background: CREAM }}><span style={{ color: GREY }}>Bill to</span> <strong>Mehta Traders, Indore</strong></div>
                  <div className="flex flex-col border-t-2 border-[#121212]">
                    <div className="flex justify-between gap-2 border-b border-[#C9C2B5] py-1.5"><span>GST filing × 1</span><span>₹5,000.00</span></div>
                    <div className="flex justify-between gap-2 py-1" style={{ color: GREY }}><span>CGST 9%</span><span>₹450.00</span></div>
                    <div className="flex justify-between gap-2 py-1" style={{ color: GREY }}><span>SGST 9%</span><span>₹450.00</span></div>
                    <div className="mt-1 flex justify-between gap-2 rounded-md border-2 border-[#121212] px-2.5 py-2 text-base font-bold" style={{ background: "#FFC800" }}><span>Total</span><span>₹5,900.00</span></div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2"><span className={chip}>Download PDF</span><span className={chip}>Send on WhatsApp</span></div>
                </div>
              )}

              {demo === "photo" && (
                <div className="grid flex-1 grid-cols-2 gap-3">
                  {[true, false].map((before) => (
                    <div key={String(before)} className="flex flex-col gap-1.5">
                      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border-2 border-[#121212]"
                           style={{ background: before ? "#8A7B66" : "#fff", boxShadow: before ? undefined : "4px 4px 0 #121212" }}>
                        {before && <>
                          <span aria-hidden="true" className="absolute inset-0" style={{ background: "repeating-linear-gradient(115deg, #9C8B73 0 22px, #7A6C59 22px 44px)" }} />
                          <span aria-hidden="true" className="absolute -left-[10%] bottom-0 h-[34%] w-[70%]" style={{ background: "#5B4E3F" }} />
                        </>}
                        <svg aria-hidden="true" viewBox="0 0 80 100" className="relative h-auto w-[62%]">
                          <ellipse cx="40" cy="93" rx="26" ry="4" fill={before ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.14)"} />
                          <rect x="22" y="6" width="36" height="14" rx="4" fill="#AC156B" stroke={INK} strokeWidth="2.5" />
                          <rect x="14" y="20" width="52" height="70" rx="12" fill="#FFC800" stroke={INK} strokeWidth="2.5" />
                          <rect x="20" y="40" width="40" height="28" rx="4" fill={CREAM} stroke={INK} strokeWidth="2.5" />
                          <path d="M27 50h26M27 58h18" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <span className="text-[13.5px] font-bold">{before ? "Before: shot on your counter" : "After: clean, catalogue-ready"}</span>
                    </div>
                  ))}
                </div>
              )}

              {demo === "site" && <div className="flex flex-1 flex-col justify-center gap-2"><DesignPhone pick={site} />
                <span className="text-center text-[13px]" style={{ color: GREY }}>{site.product.name}{site.theme.name !== site.product.name ? ` · ${site.theme.name}` : ""}. You can pick any other design after you pay.</span></div>}
              {demo === "card" && <div className="flex flex-1 flex-col justify-center gap-2"><DesignPhone pick={card} />
                <span className="text-center text-[13px]" style={{ color: GREY }}>{card.product.name}{card.theme.name !== card.product.name ? ` · ${card.theme.name}` : ""}. You can pick any other design after you pay.</span></div>}

              {(demo === "bill" || demo === "photo") && <span className="text-[13px]" style={{ color: GREY }}>Sample details, for show.</span>}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            {Pay({ text: `Get all of it for ${inr(KIT.inr)}` })}
            <Trust />
          </div>
        </div>
      </section>

      {/* ---------- what it gets done ---------- */}
      <section className="border-y-2 border-[#121212]" style={{ background: "#F4EBDC" }}>
        <div className={`${wrap} flex flex-col gap-[18px] pb-10 pt-9`}>
          <h2 className="m-0 text-[clamp(24px,3vw,32px)] font-extrabold leading-[1.18] tracking-[-0.015em]" style={display}>What {inr(KIT.inr)} gets done</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
            {[
              { n: num(KIT.credits), t: "invoices, at 1 credit each", c: "#FFC800" },
              { n: num(KIT.credits / 2), t: "GST quotations, at 2 credits each", c: "#FF8FE9" },
              { n: "Every", t: "business app, all in your phone browser", c: "#8FB4FF" },
              { n: "2", t: "pages: a website and a visiting card", c: "#22C3A6" },
            ].map((x) => (
              <div key={x.t} className="flex flex-col gap-0.5 rounded-2xl border-2 border-[#121212] p-4 shadow-[4px_4px_0_#121212]" style={{ background: x.c }}>
                <span className="text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em]" style={display}>{x.n}</span>
                <span className="text-[15.5px] font-semibold leading-[1.3]">{x.t}</span>
              </div>
            ))}
          </div>
          {Pay({ text: `Get it all for ${inr(KIT.inr)}`, extra: "self-stretch" })}
          <Trust />
        </div>
      </section>

      {/* ---------- refund + wait and lose ---------- */}
      <section>
        <div className={`${wrap} flex flex-wrap items-stretch gap-6 py-10`}>
          <div className="flex min-w-0 flex-[2_1_340px] flex-col gap-4 rounded-[20px] border-2 border-[#121212] p-[22px] shadow-[7px_7px_0_#121212]" style={{ background: "#BEF434" }}>
            <span className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.12em]"><Shield s={18} /> Unused credits refundable</span>
            <h2 className="m-0 text-[clamp(24px,3vw,32px)] font-extrabold leading-[1.18] tracking-[-0.015em]" style={display}>Try it. Not happy? Ask for your unused credits back.</h2>
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {[
                [`Pay ${inr(KIT.inr)} today`, "Your credits, website and card are ready in a minute."],
                ["Use it for a few days", "Make bills, clean photos, put your shop online."],
                ["Not for you?", "Write to support@ezyourlife.com within 7 days. An admin checks it, and credits you have not used are refunded to the way you paid."],
              ].map(([t, b], i) => (
                <li key={t} className="flex items-start gap-3">
                  <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#121212] bg-white text-[15px] font-extrabold" style={display}>{i + 1}</span>
                  <span className="leading-[1.3]"><strong className="block text-[16.5px]">{t}</strong><span className="text-[15px]">{b}</span></span>
                </li>
              ))}
            </ol>
            {Pay({ text: `Try it for ${inr(KIT.inr)}`, bg: "#fff" })}
          </div>

          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-2.5 rounded-[20px] border-2 border-[#121212] p-[22px] shadow-[7px_7px_0_#121212]" style={{ background: "#FF8157" }}>
            <span className="text-[13px] font-bold uppercase tracking-[0.12em]">Wait, and you lose</span>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {["Free website", "Free visiting card", `The ${inr(KIT.inr)} kit price`].map((x) => (
                <li key={x} className="flex items-center gap-2 text-base font-bold"><Cross /><span className="line-through">{x}</span></li>
              ))}
            </ul>
            <p className="m-0 text-[15px] font-semibold leading-[1.4]">
              {deadline ? `After ${deadline}` : "When this offer ends"}
              {capN !== null ? `, or once ${num(capN)} packs are gone,` : ","} the website and card are sold separately.
            </p>
            {clock && !clock.over && <Digits parts={clock.parts} />}
            {Pay({ text: `Pay ${inr(KIT.inr)} now`, bg: "#fff", extra: "mt-auto" })}
          </div>
        </div>
      </section>

      {/* ---------- questions ---------- */}
      <section>
        <div className={`${wrap} pb-10`}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
            {[
              ["Is this a subscription?", `No. You pay ${inr(KIT.inr)} once. Nothing renews on its own.`],
              ["What is a credit?", "One credit pays for one result, like one invoice. Most apps cost 1 to 3 credits, and you are charged only when an app gives you a result."],
              ["What if it does not work for me?", "Write to us within 7 days. An admin looks at it, and credits you have not used are refunded."],
            ].map(([q, a]) => (
              <div key={q} className="rounded-2xl border-2 border-[#121212] bg-white px-4 py-3.5">
                <h3 className="m-0 text-[16.5px] font-bold leading-[1.35]">{q}</h3>
                <p className="m-0 mt-1 text-[15px]" style={{ color: GREY }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t-2 border-[#121212]" style={{ background: "#FF8FE9" }}>
        <div className={`${wrap} flex flex-col gap-3.5 py-9`}>
          <h2 className="m-0 text-[clamp(24px,3vw,32px)] font-extrabold leading-[1.18] tracking-[-0.015em]" style={display}>Everything. {inr(KIT.inr)}. Pay once.</h2>
          {Pay({ text: `Pay ${inr(KIT.inr)} now`, bg: "#fff" })}
          <Trust />
        </div>
      </section>

      <footer className="flex-1" style={{ background: INK, color: CREAM }}>
        <div className={`${wrap} flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 py-[22px] text-sm`}>
          <span className="text-[15px] font-extrabold" style={display}>EZYOURLIFE</span>
          <span>Need help? Write to support@ezyourlife.com</span>
          <Link to="/refund-policy" className="underline underline-offset-4" style={{ color: "#FFC800" }}>Refund policy</Link>
        </div>
      </footer>

      <div className="border-t-2 border-[#121212] bg-white">
        <div className={`${wrap} flex items-center justify-between gap-3 py-2.5`}>
          <div className="min-w-0 leading-tight">
            <div className="text-base font-bold">{inr(KIT.inr)} · everything included</div>
            <div className="text-[13.5px]" style={{ color: GREY }}>{clock && !clock.over ? `Ends in ${clock.short} · ` : ""}Pay once</div>
          </div>
          <button type="button" onClick={pay} disabled={busy || blocked}
                  className="flex h-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#121212] bg-[#FF8FE9] px-5 text-base font-bold shadow-[3px_3px_0_#121212] disabled:opacity-60">
            {blocked ? "Closed" : "Pay now"}
          </button>
        </div>
      </div>

      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
