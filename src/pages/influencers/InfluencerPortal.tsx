import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import KitPicker from "./KitPicker";
import { isDemoAccount, demoOverlay } from "./demoData";
import { EarningsEstimate } from "@/components/earn/EarningsEstimate";

// influencer_me() from 20261012170000_influencer_login.sql. It returns only the
// signed-in influencer's own campaign, so there is nothing to pass in.
const rpc = (name: string, args: Record<string, unknown> = {}) =>
  (supabase as any).rpc(name, args) as Promise<{ data: any; error: { message: string } | null }>;

const inr = (n: number | null | undefined) =>
  "₹" + Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const day = (s: string) => new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

type Me = {
  ok: boolean; reason?: string;
  name: string; handle: string | null; city: string | null; code: string;
  commission_pct: number; status: string; link: string; refund_window_days: number;
  community_name: string | null; display_name: string | null;
  offer_ends_at: string | null; offer_cap: number | null; offers_left: number | null;
  clicks: number; buyers: number; orders: number; conversion_pct: number; sales_inr: number;
  earning_waiting_inr: number; earning_ready_inr: number; earning_paid_inr: number;
  net_received_inr: number; tds_deducted_inr: number;
  sales: { label: string; purchased_at: string; amount_inr: number; commission_inr: number;
           commission_pct: number; status: string; payable_after: string }[];
  clicks_by_day: { day: string; clicks: number }[];
  payments: { paid_at: string; commission_inr: number; tds_inr: number; received_inr: number; reference: string }[];
};

const SALE_STATUS: Record<string, { label: string; help: string; tone: string }> = {
  pending: { label: "Waiting", help: "Inside the return window. Becomes payable after it closes.", tone: "bg-[#FFC800]" },
  approved: { label: "Ready", help: "Confirmed. Will be included in your next payment.", tone: "bg-[#22C3A6]" },
  paid: { label: "Paid to you", help: "Already sent to your bank.", tone: "bg-neutral-200" },
  reversed: { label: "Cancelled", help: "This buyer was refunded, so no commission is due.", tone: "bg-[#FF8157]" },
};

function SignIn() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const qc = useQueryClient();

  // Google sign-in. The shared /auth/callback page finishes the sign-in and sends
  // the creator back here because of auth_redirect_to.
  const google = async () => {
    setBusy(true);
    try { localStorage.setItem("auth_redirect_to", "/influencer"); } catch { /* storage blocked */ }
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (error) {
      setBusy(false);
      toast({ title: "Could not sign in with Google", description: error.message, variant: "destructive" });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (error) return toast({ title: "Could not sign in", description: error.message, variant: "destructive" });
      qc.invalidateQueries();
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // The confirmation email brings them straight back to this page.
        emailRedirectTo: `${window.location.origin}/influencer`,
        data: { full_name: name.trim(), display_name: name.trim().split(" ")[0] },
      },
    });
    setBusy(false);
    if (error) return toast({ title: "Could not create your account", description: error.message, variant: "destructive" });
    if (data.session) qc.invalidateQueries();
    else setCheckEmail(true);
  };

  if (checkEmail) {
    return (
      <div className="min-h-screen bg-[#FFF8EB] text-[#121212] flex items-center justify-center p-4">
        <div className="w-full max-w-sm border-2 border-[#121212] bg-white p-6 shadow-[6px_6px_0_#121212] space-y-3">
          <h1 className="font-bold text-2xl">Check your email</h1>
          <p className="text-sm text-neutral-700">
            We sent a link to {email.trim()}. Open it and you land straight back here, ready to set up your page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8EB] text-[#121212] flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm border-2 border-[#121212] bg-white p-6 shadow-[6px_6px_0_#121212] space-y-4">
        <div>
          <h1 className="font-bold text-2xl">{mode === "in" ? "Creator sign in" : "Join as a creator"}</h1>
          <p className="text-sm text-neutral-700">
            {mode === "in"
              ? "Your dashboard, your link and your offer page."
              : "Make a free account. You get your own link, dashboard and offer page."}
          </p>
        </div>
        {mode === "up" && (
          <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} />
        )}
        <Button type="button" variant="outline" disabled={busy} onClick={google} className="w-full border-2 border-[#121212] bg-white font-semibold">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/>
            <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/>
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
          </svg>
          Continue with Google
        </Button>
        <div className="flex items-center gap-3 text-xs text-neutral-500" aria-hidden="true">
          <span className="h-px flex-1 bg-neutral-300" /> or use email <span className="h-px flex-1 bg-neutral-300" />
        </div>
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder={mode === "up" ? "Choose a password (8+ characters)" : "Password"} value={password}
               onChange={(e) => setPassword(e.target.value)} required minLength={mode === "up" ? 8 : undefined} />
        <Button type="submit" disabled={busy} className="w-full border-2 border-[#121212]">
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create my account"}
        </Button>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="text-sm font-semibold underline underline-offset-4">
          {mode === "in" ? "New here? Join as a creator" : "Already have an account? Sign in"}
        </button>
        <p className="text-xs text-neutral-600">Bookmark this page: ezyourlife.com/influencer. It is where you come back every time.</p>
      </form>
    </div>
  );
}

function Register({ email, defaultName }: { email: string | undefined; defaultName: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: defaultName, handle: "", city: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await rpc("influencer_register", { _name: f.name, _handle: f.handle, _city: f.city });
    setBusy(false);
    if (error) return toast({ title: "Not saved", description: error.message, variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["influencer-me"] });
  };

  return (
    <div className="min-h-screen bg-[#FFF8EB] text-[#121212] flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm border-2 border-[#121212] bg-white p-6 shadow-[6px_6px_0_#121212] space-y-4">
        <div>
          <h1 className="font-bold text-2xl">Set up your creator page</h1>
          <p className="text-sm text-neutral-700">Signed in as {email}. Three quick details, then your dashboard opens.</p>
        </div>
        <Input placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required minLength={2} maxLength={60} />
        <Input placeholder="Instagram handle (optional)" value={f.handle} onChange={(e) => setF({ ...f, handle: e.target.value })} maxLength={40} />
        <Input placeholder="City (optional)" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} maxLength={60} />
        <Button type="submit" disabled={busy} className="w-full border-2 border-[#121212]">{busy ? "Saving…" : "Open my dashboard"}</Button>
        <button type="button" onClick={() => supabase.auth.signOut()} className="text-sm underline underline-offset-4">Sign out</button>
      </form>
    </div>
  );
}

function Tile({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: string }) {
  return (
    <div className={`border-2 border-[#121212] p-4 shadow-[4px_4px_0_#121212] ${tone ?? "bg-white"}`}>
      <div className="text-xs font-semibold">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {hint && <div className="text-xs text-neutral-700 mt-1">{hint}</div>}
    </div>
  );
}

/**
 * The small part of the landing page an influencer may change themselves:
 * the community name in the banner, the name shown, how long the offer runs and
 * how many offers there are. The price, the code and their commission are not
 * editable here, and influencer_update_offer refuses anything else.
 */
function OfferEditor({ d, onSaved }: { d: Me; onSaved: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    community_name: d.community_name ?? "",
    display_name: d.display_name ?? "",
    ends: d.offer_ends_at ? d.offer_ends_at.slice(0, 10) : "",
    cap: d.offer_cap != null ? String(d.offer_cap) : "",
  });

  const save = async (over?: Partial<typeof f>) => {
    const next = { ...f, ...over };
    setBusy(true);
    try {
      const { error } = await rpc("influencer_update_offer", {
        _community_name: next.community_name,
        _display_name: next.display_name,
        // End of that day in India, so "valid until the 8th" includes the 8th.
        _offer_ends_at: next.ends ? new Date(`${next.ends}T23:59:59+05:30`).toISOString() : null,
        _offer_cap: next.cap.trim() === "" ? null : Number(next.cap),
      });
      if (error) throw new Error(error.message);
      setF(next);
      toast({ title: "Saved", description: "Your page is updated for everyone who opens your link." });
      onSaved();
    } catch (e) {
      toast({ title: "Not saved", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const extend = (days: number) => {
    const from = f.ends ? new Date(`${f.ends}T00:00:00+05:30`) : new Date();
    const base = from.getTime() > Date.now() ? from : new Date();
    const next = new Date(base.getTime() + days * 86_400_000);
    save({ ends: next.toISOString().slice(0, 10) });
  };

  const addOffers = (n: number) => save({ cap: String(Math.max(1, Number(f.cap || 0) + n)) });

  return (
    <section className="border-2 border-[#121212] bg-white shadow-[4px_4px_0_#121212]">
      <button onClick={() => setOpen(!open)} className="w-full text-left p-4">
        <div className="font-bold text-lg">{open ? "▾" : "▸"} Your offer page</div>
        <div className="text-sm text-neutral-700">
          {d.community_name ? `Shown as "For ${d.community_name} members"` : "No community name set"}
          {d.offer_ends_at ? ` · ends ${day(d.offer_ends_at)}` : " · no end date"}
          {d.offer_cap != null ? ` · ${d.offers_left} of ${d.offer_cap} offers left` : " · unlimited offers"}
        </div>
      </button>

      {open && (
        <div className="border-t-2 border-[#121212] p-4 space-y-4">
          <p className="text-sm">
            This is what visitors see at the top of your link. Everything else on the page, including the
            ₹999 price, is the same for everyone.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold">Community name</label>
              <p className="text-xs text-neutral-600 mb-1">
                Shown as "For … members", e.g. Vyapaar Mandali. Leave it empty to show your own name instead.
              </p>
              <Input value={f.community_name} placeholder="Vyapaar Mandali"
                     onChange={(e) => setF({ ...f, community_name: e.target.value })} />
              {f.community_name && (
                <Button variant="outline" className="border-2 border-[#121212] mt-2 h-8 text-xs"
                        onClick={() => save({ community_name: "" })} disabled={busy}>
                  Remove the community name
                </Button>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold">Your name on the page</label>
              <p className="text-xs text-neutral-600 mb-1">
                Only used when there is no community name. Empty means we use {d.name}.
              </p>
              <Input value={f.display_name} placeholder={d.name}
                     onChange={(e) => setF({ ...f, display_name: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-bold">Valid until</label>
              <p className="text-xs text-neutral-600 mb-1">
                A countdown shows on your page. Empty means no end date and no countdown.
              </p>
              <Input type="date" value={f.ends} onChange={(e) => setF({ ...f, ends: e.target.value })} />
              <div className="flex flex-wrap gap-2 mt-2">
                <Button variant="outline" className="border-2 border-[#121212] h-8 text-xs" disabled={busy}
                        onClick={() => extend(7)}>Extend 7 days</Button>
                <Button variant="outline" className="border-2 border-[#121212] h-8 text-xs" disabled={busy}
                        onClick={() => extend(30)}>Extend 30 days</Button>
                {f.ends && (
                  <Button variant="outline" className="border-2 border-[#121212] h-8 text-xs" disabled={busy}
                          onClick={() => save({ ends: "" })}>No end date</Button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold">Number of offers</label>
              <p className="text-xs text-neutral-600 mb-1">
                How many people can buy through your link. Your page shows how many are left and stops selling
                at zero. Empty means no limit.
              </p>
              <Input value={f.cap} placeholder="50" inputMode="numeric"
                     onChange={(e) => setF({ ...f, cap: e.target.value.replace(/[^0-9]/g, "") })} />
              <div className="flex flex-wrap gap-2 mt-2">
                <Button variant="outline" className="border-2 border-[#121212] h-8 text-xs" disabled={busy}
                        onClick={() => addOffers(10)}>Add 10 more</Button>
                <Button variant="outline" className="border-2 border-[#121212] h-8 text-xs" disabled={busy}
                        onClick={() => addOffers(25)}>Add 25 more</Button>
                {f.cap && (
                  <Button variant="outline" className="border-2 border-[#121212] h-8 text-xs" disabled={busy}
                          onClick={() => save({ cap: "" })}>No limit</Button>
                )}
              </div>
              {d.offer_cap != null && (
                <p className="text-xs mt-2">
                  {d.offers_left} left. {d.orders} of your offers have been bought.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => save()} disabled={busy} className="border-2 border-[#121212]">
              {busy ? "Saving…" : "Save my page"}
            </Button>
            <a href={d.link} target="_blank" rel="noreferrer" className="text-sm underline">See my page</a>
          </div>
        </div>
      )}
    </section>
  );
}

export default function InfluencerPortal() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const me = useQuery({
    queryKey: ["influencer-me", user?.id],
    enabled: !!user,
    refetchInterval: 10_000,
    queryFn: async () => {
      const { data, error } = await rpc("influencer_me");
      if (error) throw new Error(error.message);
      return data as Me;
    },
  });

  if (loading) return <div className="p-8">Loading…</div>;
  if (!user) return <SignIn />;

  if (me.isLoading) return <div className="p-8">Loading your dashboard…</div>;
  if (me.error) return <div className="p-8 text-red-700">{(me.error as Error).message}</div>;

  const demo = isDemoAccount(user.email);
  const d = demo && me.data?.ok ? demoOverlay(me.data) : me.data;
  if (!d?.ok) {
    const meta = (user.user_metadata ?? {}) as { full_name?: string };
    return <Register email={user.email} defaultName={meta.full_name ?? ""} />;
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(d.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Could not copy", description: d.link });
    }
  };

  const maxClicks = Math.max(1, ...d.clicks_by_day.map((c) => c.clicks));

  return (
    <div className="min-h-screen bg-[#FFF8EB] text-[#121212]">
      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-bold text-3xl">Hi {d.name.split(" ")[0]} 👋</h1>
            <p className="text-sm text-neutral-700">
              Your Ezyourlife creator page
              {d.status === "active" ? ` · ${d.commission_pct}% commission on every sale` : ""}
              {d.status !== "active" && d.status !== "paused" && <span className="font-bold"> · campaign {d.status}</span>}
              {demo && <span className="font-bold"> · demo numbers</span>}
            </p>
          </div>
          <Button variant="outline" className="border-2 border-[#121212]" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </header>

        {d.status === "paused" && (
          <section className="border-2 border-[#121212] bg-white p-4 shadow-[4px_4px_0_#121212]">
            <h2 className="font-bold text-lg">Waiting for our approval</h2>
            <p className="text-sm text-neutral-700">
              Your account is ready. Set up your offer page below while we look at your profile. Your link starts counting
              clicks and sales once we approve you, and we tell you your commission then.
            </p>
          </section>
        )}

        <section className="border-2 border-[#121212] bg-[#FFC800] p-4 shadow-[4px_4px_0_#121212] space-y-2">
          <h2 className="font-bold text-lg">Your link — share this everywhere</h2>
          <p className="text-sm">
            Every sale through this link is counted for you. Put it in your bio, stories and DMs.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <code className="bg-white border-2 border-[#121212] px-3 py-2 text-sm break-all">{d.link}</code>
            <Button onClick={copyLink} className="border-2 border-[#121212]">{copied ? "Copied ✓" : "Copy link"}</Button>
          </div>
        </section>

        <OfferEditor d={d} onSaved={() => queryClient.invalidateQueries({ queryKey: ["influencer-me"] })} />

        <EarningsEstimate />

        <KitPicker />

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tile label="People who clicked" value={d.clicks} hint="from your link" />
          <Tile label="How many bought" value={d.buyers} hint={`${d.conversion_pct}% of clicks`} />
          <Tile label="Sales you brought" value={inr(d.sales_inr)} hint={`${d.orders} order(s)`} />
          <Tile label="Paid to you so far" value={inr(d.net_received_inr)} hint="after TDS" tone="bg-[#22C3A6]" />
        </section>

        <section className="border-2 border-[#121212] bg-white p-4 shadow-[4px_4px_0_#121212]">
          <h2 className="font-bold text-lg">Your earnings</h2>
          <div className="grid md:grid-cols-3 gap-3 mt-3 text-sm">
            <div className="border-2 border-[#121212] bg-[#FFC800] p-3">
              <div className="text-xs font-semibold">Waiting</div>
              <div className="text-xl font-bold">{inr(d.earning_waiting_inr)}</div>
              <div className="text-xs mt-1">
                Inside the {d.refund_window_days}-day return window. Becomes payable if the buyer does not ask for a refund.
              </div>
            </div>
            <div className="border-2 border-[#121212] bg-[#22C3A6] p-3">
              <div className="text-xs font-semibold">Confirmed, due to you</div>
              <div className="text-xl font-bold">{inr(d.earning_ready_inr)}</div>
              <div className="text-xs mt-1">Will be in your next payment. TDS is deducted when paid.</div>
            </div>
            <div className="border-2 border-[#121212] p-3">
              <div className="text-xs font-semibold">Already paid</div>
              <div className="text-xl font-bold">{inr(d.earning_paid_inr)}</div>
              <div className="text-xs mt-1">You received {inr(d.net_received_inr)} after {inr(d.tds_deducted_inr)} TDS.</div>
            </div>
          </div>
        </section>

        <section className="border-2 border-[#121212] bg-white p-4 shadow-[4px_4px_0_#121212]">
          <h2 className="font-bold text-lg">Every sale from your audience</h2>
          <p className="text-xs text-neutral-600">
            Buyers are shown as numbers, not names — we keep our customers' details private, same as we would yours.
          </p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 text-left">
                <tr>{["Buyer", "Date", "They paid", "You earn", "Status"].map((h) => <th key={h} className="px-2 py-2">{h}</th>)}</tr>
              </thead>
              <tbody>
                {d.sales.map((s, i) => {
                  const st = SALE_STATUS[s.status] ?? { label: s.status, help: "", tone: "" };
                  return (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-2 font-semibold">{s.label}</td>
                      <td className="px-2 py-2">{day(s.purchased_at)}</td>
                      <td className="px-2 py-2">{inr(s.amount_inr)}</td>
                      <td className="px-2 py-2 font-bold">{inr(s.commission_inr)}</td>
                      <td className="px-2 py-2">
                        <span className={`border border-[#121212] px-2 py-0.5 text-xs font-bold ${st.tone}`}>{st.label}</span>
                        <div className="text-xs text-neutral-600">{st.help}</div>
                      </td>
                    </tr>
                  );
                })}
                {d.sales.length === 0 && (
                  <tr><td colSpan={5} className="px-2 py-6 text-center text-neutral-500">
                    No sales yet. Share your link to get started.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {d.clicks_by_day.length > 0 && (
          <section className="border-2 border-[#121212] bg-white p-4 shadow-[4px_4px_0_#121212]">
            <h2 className="font-bold text-lg">Clicks each day</h2>
            <div className="flex items-end gap-1 h-32 mt-3">
              {d.clicks_by_day.map((c) => (
                <div key={c.day} className="flex-1 flex flex-col items-center justify-end gap-1" title={`${c.clicks} on ${c.day}`}>
                  <div className="w-full bg-[#FFC800] border-2 border-[#121212]"
                       style={{ height: `${Math.max(6, (c.clicks / maxClicks) * 100)}%` }} />
                  <div className="text-[10px] text-neutral-600">{day(c.day)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="border-2 border-[#121212] bg-white p-4 shadow-[4px_4px_0_#121212]">
          <h2 className="font-bold text-lg">Payments to you</h2>
          {d.payments.length === 0 && <p className="text-sm text-neutral-600">No payments yet.</p>}
          {d.payments.map((p, i) => (
            <div key={i} className="text-sm border-t py-2 first:border-t-0">
              {day(p.paid_at)} — you received <strong>{inr(p.received_inr)}</strong>{" "}
              (commission {inr(p.commission_inr)}, TDS {inr(p.tds_inr)}) · reference {p.reference}
            </div>
          ))}
        </section>

        <section className="border-2 border-[#121212] bg-white p-4 shadow-[4px_4px_0_#121212]">
          <h2 className="font-bold text-lg">Come back any time</h2>
          <p className="text-sm text-neutral-700">
            This dashboard lives at <code className="font-semibold">ezyourlife.com/influencer</code>. Bookmark it and sign in with the
            same email whenever you want to check your numbers or change your offer page.
          </p>
        </section>

        <p className="text-xs text-neutral-600 pb-8">
          Numbers update every 10 seconds. Commission is due only on sales that are not refunded within
          {" "}{d.refund_window_days} days. TDS is deducted as required by law when we pay you.
        </p>
      </main>
    </div>
  );
}
