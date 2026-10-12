import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// RPCs from 20261012150000_influencer_program.sql (types not regenerated yet).
const rpc = (name: string, args: Record<string, unknown> = {}) =>
  (supabase as any).rpc(name, args) as Promise<{ data: any; error: { message: string } | null }>;

type Row = {
  id: string; name: string; handle: string | null; city: string | null; code: string;
  commission_pct: number; status: string;
  clicks: number; buyers: number; orders: number; conversion_pct: number; gross_inr: number;
  commission_pending_inr: number; commission_approved_inr: number; commission_paid_inr: number;
  tds_on_payable_est_inr: number; net_payable_now_inr: number; net_paid_total_inr: number;
};

const inr = (n: number | null | undefined) =>
  "₹" + Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const dt = (s: string) => new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

// Plain-language meaning of each commission status, shown to the admin.
const STATUS_TEXT: Record<string, { label: string; help: string; tone: string }> = {
  pending: { label: "Waiting", help: "Sale is inside the refund window. Not payable yet.", tone: "bg-[#FFC800]" },
  approved: { label: "Ready to pay", help: "Refund window closed and no refund. You can pay this.", tone: "bg-[#22C3A6]" },
  paid: { label: "Paid", help: "Already paid out to the influencer.", tone: "bg-neutral-200" },
  reversed: { label: "Cancelled", help: "Buyer was refunded, so no commission is owed.", tone: "bg-[#FF8157]" },
};

function Tile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="border-2 border-[#121212] bg-white p-3 shadow-[4px_4px_0_#121212]">
      <div className="text-xs font-semibold text-neutral-700">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {hint && <div className="text-xs text-neutral-600 mt-1">{hint}</div>}
    </div>
  );
}

export default function AdminInfluencers() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", handle: "", city: "", code: "", commission_pct: "20" });

  const isAdmin = useQuery({
    queryKey: ["influencer-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      return data === true;
    },
  });

  const dash = useQuery({
    queryKey: ["influencer-dashboard"],
    enabled: isAdmin.data === true,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await rpc("influencer_dashboard");
      if (error) throw new Error(error.message);
      return data as { generated_at: string; influencers: Row[]; refund_window_days: number };
    },
  });

  const detail = useQuery({
    queryKey: ["influencer-detail", selected],
    enabled: !!selected,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await rpc("influencer_detail", { _influencer_id: selected });
      if (error) throw new Error(error.message);
      return data as { buyers: any[]; clicks_by_day: any[]; payouts: any[] };
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["influencer-dashboard"] });
    qc.invalidateQueries({ queryKey: ["influencer-detail"] });
  };

  const syncNow = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("influencer-sync", { body: {} });
      if (error || data?.error) throw new Error(data?.error ?? error?.message);
      toast({
        title: "Up to date",
        description: `${data.created} new sale(s) found · ${data.approved} ready to pay · ${data.reversed} cancelled by refund`,
      });
      refresh();
    } catch (e) {
      toast({ title: "Could not update", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const addInfluencer = async () => {
    const { error } = await rpc("influencer_save", {
      _id: null, _name: form.name, _handle: form.handle, _city: form.city, _campaign: "diwali-2026",
      _code: form.code, _commission_pct: Number(form.commission_pct), _status: "active",
    });
    if (error) return toast({ title: "Not added", description: error.message, variant: "destructive" });
    setForm({ name: "", handle: "", city: "", code: "", commission_pct: "20" });
    setShowAdd(false);
    toast({ title: "Added", description: `Give them this link: ezyourlife.com/?ref=${form.code}` });
    refresh();
  };

  const payNow = async (r: Row) => {
    const ok = window.confirm(
      `Record a payment of ${inr(r.net_payable_now_inr)} to ${r.name}?\n\n` +
      `Ready to pay: ${inr(r.commission_approved_inr)}\n` +
      `TDS deducted (estimate): ${inr(r.tds_on_payable_est_inr)}\n` +
      `You send: ${inr(r.net_payable_now_inr)}\n\n` +
      `Only confirm after you have transferred the money from your bank.`,
    );
    if (!ok) return;
    const { data, error } = await rpc("influencer_mark_paid", { _influencer_id: r.id, _utr: utr });
    if (error) return toast({ title: "Not recorded", description: error.message, variant: "destructive" });
    toast({ title: "Payment recorded", description: `Sent ${inr(data.net_inr)} (TDS ${inr(data.tds_inr)})` });
    setUtr("");
    refresh();
  };

  const reverse = async (purchaseId: string) => {
    const reason = window.prompt("Why is this sale being cancelled? (e.g. buyer refunded)");
    if (!reason) return;
    const { error } = await rpc("influencer_reverse", { _purchase_id: purchaseId, _reason: reason });
    if (error) return toast({ title: "Not cancelled", description: error.message, variant: "destructive" });
    refresh();
  };

  if (isAdmin.isLoading) return <div className="p-8">Checking your access…</div>;
  if (isAdmin.data !== true) return <div className="p-8">This page is for admins only.</div>;

  const rows = dash.data?.influencers ?? [];
  const t = rows.reduce(
    (a, r) => ({
      clicks: a.clicks + r.clicks, buyers: a.buyers + r.buyers, sales: a.sales + r.gross_inr,
      waiting: a.waiting + r.commission_pending_inr, ready: a.ready + r.commission_approved_inr,
      paid: a.paid + r.net_paid_total_inr,
    }),
    { clicks: 0, buyers: 0, sales: 0, waiting: 0, ready: 0, paid: 0 },
  );
  const current = rows.find((r) => r.id === selected);
  const pct = t.clicks ? ((t.buyers / t.clicks) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-[#FFF8EB] text-[#121212]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-bold text-3xl">Influencers</h1>
            <p className="text-sm text-neutral-700">
              Each influencer gets a link. Sales through it earn them commission. Commission is paid only
              after the {dash.data?.refund_window_days ?? 7}-day refund window closes with no refund.
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Updates every 30 seconds{dash.data?.generated_at ? ` · last at ${new Date(dash.data.generated_at).toLocaleTimeString("en-IN")}` : ""}.
            </p>
          </div>
          <Button onClick={syncNow} disabled={busy} className="border-2 border-[#121212] shadow-[4px_4px_0_#121212]">
            {busy ? "Updating…" : "Check for new sales"}
          </Button>
        </header>

        {dash.error && <p className="text-red-700">{(dash.error as Error).message}</p>}

        <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Tile label="People who clicked a link" value={t.clicks} hint={`${t.buyers} of them bought (${pct}%)`} />
          <Tile label="Sales from influencers" value={inr(t.sales)} hint="before commission" />
          <Tile label="Ready to pay now" value={inr(t.ready)} hint="gross commission, before TDS" />
          <Tile label="Still in refund window" value={inr(t.waiting)} hint="not payable yet" />
          <Tile label="Already paid out" value={inr(t.paid)} hint="net, after TDS" />
          <Tile label="Influencers" value={rows.length} hint={`${rows.filter((r) => r.net_payable_now_inr > 0).length} with money to pay`} />
        </section>

        <section className="space-y-3">
          <h2 className="font-bold text-xl">Your influencers</h2>
          {rows.length === 0 && (
            <p className="text-neutral-600">No influencers yet. Add one below to get their link.</p>
          )}
          {rows.map((r) => {
            const open = selected === r.id;
            return (
              <div key={r.id} className={`border-2 border-[#121212] bg-white shadow-[4px_4px_0_#121212] ${open ? "ring-4 ring-[#FFC800]" : ""}`}>
                <button onClick={() => setSelected(open ? null : r.id)}
                        className="w-full text-left p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-lg">
                      {r.name}{r.handle ? <span className="font-normal text-neutral-600"> {r.handle}</span> : null}
                      {r.city ? <span className="font-normal text-neutral-600"> · {r.city}</span> : null}
                    </div>
                    <div className="text-sm text-neutral-700">
                      Link: <span className="font-mono">ezyourlife.com/?ref={r.code}</span> · {r.commission_pct}% commission
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div><div className="text-neutral-600">Clicks</div><div className="font-bold">{r.clicks}</div></div>
                    <div><div className="text-neutral-600">Bought</div><div className="font-bold">{r.buyers}</div></div>
                    <div><div className="text-neutral-600">Ready to pay</div><div className="font-bold">{inr(r.commission_approved_inr)}</div></div>
                  </div>
                </button>

                {open && current && (
                  <div className="border-t-2 border-[#121212] p-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <Tile label="Sales" value={inr(current.gross_inr)} hint={`${current.orders} order(s)`} />
                      <Tile label="Waiting" value={inr(current.commission_pending_inr)} hint="refund window open" />
                      <Tile label="Ready to pay" value={inr(current.commission_approved_inr)} hint="window closed" />
                      <Tile label="Already paid" value={inr(current.net_paid_total_inr)} hint="net, after TDS" />
                    </div>

                    <div className="bg-[#FFF8EB] border-2 border-[#121212] p-4">
                      <h3 className="font-bold">Payment</h3>
                      <div className="grid md:grid-cols-3 gap-2 text-sm mt-2">
                        <div>Ready to pay: <strong>{inr(current.commission_approved_inr)}</strong></div>
                        <div>TDS (estimate): <strong>− {inr(current.tds_on_payable_est_inr)}</strong></div>
                        <div>You send: <strong>{inr(current.net_payable_now_inr)}</strong></div>
                      </div>
                      <p className="text-xs text-neutral-600 mt-2">
                        TDS is an estimate: 2% once this year's payments pass ₹20,000. Confirm the exact rule with your CA.
                      </p>
                      <div className="flex flex-wrap items-end gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-semibold">Bank reference (UTR) after you transfer</label>
                          <Input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. 412345678901" className="w-64" />
                        </div>
                        <Button onClick={() => payNow(current)}
                                disabled={!utr.trim() || current.commission_approved_inr <= 0}
                                className="border-2 border-[#121212]">
                          I sent {inr(current.net_payable_now_inr)}, record it
                        </Button>
                      </div>
                      {current.commission_approved_inr <= 0 && (
                        <p className="text-xs text-neutral-600 mt-2">Nothing to pay yet. Commission becomes payable after the refund window.</p>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold">Buyers through this link</h3>
                      <p className="text-xs text-neutral-600">Emails are partly hidden to protect privacy.</p>
                      <div className="overflow-x-auto mt-2">
                        <table className="w-full text-sm">
                          <thead className="bg-neutral-100 text-left">
                            <tr>{["Bought on", "Buyer", "Pack", "Paid", "Their commission", "Status", ""].map((h) => <th key={h} className="px-2 py-2">{h}</th>)}</tr>
                          </thead>
                          <tbody>
                            {(detail.data?.buyers ?? []).map((b: any) => {
                              const s = STATUS_TEXT[b.status] ?? { label: b.status, help: "", tone: "" };
                              return (
                                <tr key={b.commission_id} className="border-t">
                                  <td className="px-2 py-2">{dt(b.purchased_at)}</td>
                                  <td className="px-2 py-2 font-mono">{b.buyer}</td>
                                  <td className="px-2 py-2">{b.pack} · {b.credits} credits</td>
                                  <td className="px-2 py-2">{inr(b.gross_inr)}</td>
                                  <td className="px-2 py-2">{inr(b.commission_inr)} ({b.commission_pct}%)</td>
                                  <td className="px-2 py-2">
                                    <span className={`border border-[#121212] px-2 py-0.5 text-xs font-bold ${s.tone}`} title={s.help}>{s.label}</span>
                                    {b.status === "waiting" || b.status === "pending" ? <div className="text-xs text-neutral-600">Payable after {dt(b.approve_after)}</div> : null}
                                    {b.reversed_reason && <div className="text-xs text-neutral-600">{b.reversed_reason}</div>}
                                  </td>
                                  <td className="px-2 py-2">
                                    {(b.status === "pending" || b.status === "approved") && (
                                      <button className="underline text-red-700 text-xs" onClick={() => reverse(b.purchase_id)}>Cancel commission</button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {(detail.data?.buyers ?? []).length === 0 && (
                              <tr><td colSpan={7} className="px-2 py-4 text-neutral-500">No one has bought through this link yet.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold">Past payments</h3>
                      {(detail.data?.payouts ?? []).length === 0 && <p className="text-sm text-neutral-600">None yet.</p>}
                      {(detail.data?.payouts ?? []).map((p: any) => (
                        <div key={p.utr + p.paid_at} className="text-sm">
                          {dt(p.paid_at)} · sent {inr(p.net_inr)} (commission {inr(p.gross_inr)}, TDS {inr(p.tds_inr)}) · ref {p.utr}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <section className="border-2 border-[#121212] bg-white shadow-[4px_4px_0_#121212]">
          <button onClick={() => setShowAdd(!showAdd)} className="w-full text-left p-4 font-bold text-lg">
            {showAdd ? "▾" : "▸"} Add a new influencer
          </button>
          {showAdd && (
            <div className="border-t-2 border-[#121212] p-4 space-y-3">
              <p className="text-sm text-neutral-700">
                The code is what buyers see in the link (lowercase, 3–20 letters, numbers or dashes), e.g. <span className="font-mono">priya-indore</span>.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Instagram handle" value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} />
                <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <Input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/\s/g, "-") })} />
                <Input placeholder="Commission %" value={form.commission_pct} onChange={(e) => setForm({ ...form, commission_pct: e.target.value })} />
              </div>
              <Button onClick={addInfluencer} disabled={!form.name || !form.code} className="border-2 border-[#121212]">Add influencer</Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
