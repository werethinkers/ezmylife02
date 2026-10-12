import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return toast({ title: "Could not sign in", description: error.message, variant: "destructive" });
    qc.invalidateQueries();
  };

  return (
    <div className="min-h-screen bg-[#FFF8EB] text-[#121212] flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm border-2 border-[#121212] bg-white p-6 shadow-[6px_6px_0_#121212] space-y-4">
        <div>
          <h1 className="font-bold text-2xl">Influencer sign in</h1>
          <p className="text-sm text-neutral-700">Use the email and password Ezyourlife gave you.</p>
        </div>
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" disabled={busy} className="w-full border-2 border-[#121212]">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-xs text-neutral-600">
          Lost your password? Message Ezyourlife and we will reset it for you.
        </p>
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

export default function InfluencerPortal() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const me = useQuery({
    queryKey: ["influencer-me", user?.id],
    enabled: !!user,
    refetchInterval: 30_000,
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

  const d = me.data;
  if (!d?.ok) {
    return (
      <div className="min-h-screen bg-[#FFF8EB] flex items-center justify-center p-6">
        <div className="max-w-md border-2 border-[#121212] bg-white p-6 text-center space-y-3">
          <h1 className="font-bold text-xl">This login is not set up as an influencer</h1>
          <p className="text-sm text-neutral-700">
            You are signed in as {user.email}, but this account is not linked to an influencer campaign.
            Message Ezyourlife to get it linked.
          </p>
          <Button variant="outline" className="border-2 border-[#121212]"
                  onClick={() => supabase.auth.signOut()}>Sign out</Button>
        </div>
      </div>
    );
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
              Your Ezyourlife campaign · {d.commission_pct}% commission on every sale
              {d.status !== "active" && <span className="font-bold"> · campaign {d.status}</span>}
            </p>
          </div>
          <Button variant="outline" className="border-2 border-[#121212]" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </header>

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

        <p className="text-xs text-neutral-600 pb-8">
          Numbers update every 30 seconds. Commission is due only on sales that are not refunded within
          {" "}{d.refund_window_days} days. TDS is deducted as required by law when we pay you.
        </p>
      </main>
    </div>
  );
}
