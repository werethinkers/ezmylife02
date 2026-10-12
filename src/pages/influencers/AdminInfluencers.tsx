import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// RPCs added in 20261012150000_influencer_program.sql. Types are not regenerated yet,
// so calls go through this helper. Every RPC checks the admin role itself.
const rpc = (name: string, args: Record<string, unknown> = {}) =>
  (supabase as any).rpc(name, args) as Promise<{ data: any; error: { message: string } | null }>;

type Row = {
  id: string; name: string; handle: string | null; city: string | null; campaign: string;
  code: string; commission_pct: number; status: string;
  clicks: number; buyers: number; orders: number; conversion_pct: number; gross_inr: number;
  commission_pending_inr: number; commission_approved_inr: number; commission_paid_inr: number;
  tds_on_payable_est_inr: number; net_payable_now_inr: number;
  tds_deducted_total_inr: number; net_paid_total_inr: number;
};

const inr = (n: number | null | undefined) =>
  "₹" + Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function AdminInfluencers() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
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

  // Real-time-ish: refresh every 30 seconds.
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

  const runSync = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("influencer-sync", { body: {} });
      if (error || data?.error) throw new Error(error?.message ?? data?.error);
      toast({ title: "Synced", description: `${data.created} new, ${data.reversed} refunded, ${data.approved} approved` });
      refresh();
    } catch (e) {
      toast({ title: "Sync failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const saveInfluencer = async () => {
    const { error } = await rpc("influencer_save", {
      _id: null, _name: form.name, _handle: form.handle, _city: form.city, _campaign: "diwali-2026",
      _code: form.code, _commission_pct: Number(form.commission_pct), _status: "active",
    });
    if (error) return toast({ title: "Not saved", description: error.message, variant: "destructive" });
    setForm({ name: "", handle: "", city: "", code: "", commission_pct: "20" });
    toast({ title: "Influencer added" });
    refresh();
  };

  const markPaid = async () => {
    if (!selected) return;
    const { data, error } = await rpc("influencer_mark_paid", { _influencer_id: selected, _utr: utr });
    if (error) return toast({ title: "Not paid", description: error.message, variant: "destructive" });
    toast({ title: "Payout recorded", description: `Net ${inr(data.net_inr)} after TDS ${inr(data.tds_inr)}` });
    setUtr("");
    refresh();
  };

  const reverse = async (purchaseId: string) => {
    const reason = window.prompt("Reason for reversing this commission (e.g. refunded, cancelled)?");
    if (!reason) return;
    const { error } = await rpc("influencer_reverse", { _purchase_id: purchaseId, _reason: reason });
    if (error) return toast({ title: "Not reversed", description: error.message, variant: "destructive" });
    refresh();
  };

  if (isAdmin.isLoading) return <div className="p-8">Checking access…</div>;
  if (isAdmin.data !== true) return <div className="p-8">Admin only.</div>;

  const rows = dash.data?.influencers ?? [];
  const totals = rows.reduce(
    (t, r) => ({
      clicks: t.clicks + r.clicks, buyers: t.buyers + r.buyers, orders: t.orders + r.orders,
      gross: t.gross + r.gross_inr, approved: t.approved + r.commission_approved_inr,
      pending: t.pending + r.commission_pending_inr, net: t.net + r.net_paid_total_inr,
    }),
    { clicks: 0, buyers: 0, orders: 0, gross: 0, approved: 0, pending: 0, net: 0 },
  );
  const current = rows.find((r) => r.id === selected);

  return (
    <div className="min-h-screen bg-[#FFF8EB] text-[#121212]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-3xl">Influencer dashboard</h1>
            <p className="text-sm text-neutral-600">
              Auto-refreshes every 30s. Refund window: {dash.data?.refund_window_days ?? "—"} days.
              {dash.data?.generated_at && ` Updated ${new Date(dash.data.generated_at).toLocaleTimeString("en-IN")}`}
            </p>
          </div>
          <Button onClick={runSync} disabled={busy} className="border-2 border-[#121212] shadow-[4px_4px_0_#121212]">
            {busy ? "Syncing…" : "Sync purchases & refunds"}
          </Button>
        </div>

        {dash.error && <p className="text-red-700">{(dash.error as Error).message}</p>}

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["Link clicks", totals.clicks],
            ["Buyers", totals.buyers],
            ["Conversion", totals.clicks ? `${((totals.buyers / totals.clicks) * 100).toFixed(1)}%` : "—"],
            ["Orders", totals.orders],
            ["Sales (gross)", inr(totals.gross)],
            ["Pending (in refund window)", inr(totals.pending)],
            ["Approved, unpaid", inr(totals.approved)],
            ["Net paid out", inr(totals.net)],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-2 border-[#121212] bg-white p-3 shadow-[4px_4px_0_#121212]">
              <div className="text-xs uppercase tracking-wide text-neutral-600">{label}</div>
              <div className="text-xl font-bold">{value}</div>
            </div>
          ))}
        </section>

        <section className="overflow-x-auto border-2 border-[#121212] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#121212] text-white text-left">
              <tr>
                {["Influencer", "Code", "Clicks", "Buyers", "Conv.", "Gross", "Pending", "Approved", "TDS (est.)", "Payable now", "Net paid"].map((h) => (
                  <th key={h} className="px-3 py-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => setSelected(r.id)}
                    className={`cursor-pointer border-t border-neutral-200 hover:bg-[#FFC800]/30 ${selected === r.id ? "bg-[#FFC800]/40" : ""}`}>
                  <td className="px-3 py-2 font-semibold">{r.name}{r.city ? <span className="font-normal text-neutral-500"> · {r.city}</span> : null}</td>
                  <td className="px-3 py-2 font-mono">{r.code}</td>
                  <td className="px-3 py-2">{r.clicks}</td>
                  <td className="px-3 py-2">{r.buyers}</td>
                  <td className="px-3 py-2">{r.conversion_pct}%</td>
                  <td className="px-3 py-2">{inr(r.gross_inr)}</td>
                  <td className="px-3 py-2">{inr(r.commission_pending_inr)}</td>
                  <td className="px-3 py-2">{inr(r.commission_approved_inr)}</td>
                  <td className="px-3 py-2">{inr(r.tds_on_payable_est_inr)}</td>
                  <td className="px-3 py-2 font-bold">{inr(r.net_payable_now_inr)}</td>
                  <td className="px-3 py-2">{inr(r.net_paid_total_inr)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={11} className="px-3 py-6 text-center text-neutral-500">No influencers yet. Add one below.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {current && (
          <section className="border-2 border-[#121212] bg-white p-4 space-y-4">
            <h2 className="font-bold text-xl">{current.name} · <span className="font-mono">{current.code}</span></h2>
            <p className="text-sm text-neutral-700">
              Link: <span className="font-mono">ezyourlife.com/?ref={current.code}</span> · Commission {current.commission_pct}% ·
              Clicks {current.clicks} → buyers {current.buyers} ({current.conversion_pct}%)
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-100 text-left">
                  <tr>{["Date", "Buyer", "Pack", "Paid", "Commission", "Status", "Refund window ends", ""].map((h) => <th key={h} className="px-2 py-1">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {(detail.data?.buyers ?? []).map((b: any) => (
                    <tr key={b.commission_id} className="border-t">
                      <td className="px-2 py-1">{new Date(b.purchased_at).toLocaleDateString("en-IN")}</td>
                      <td className="px-2 py-1 font-mono">{b.buyer}</td>
                      <td className="px-2 py-1">{b.pack} ({b.credits} cr)</td>
                      <td className="px-2 py-1">{inr(b.gross_inr)}</td>
                      <td className="px-2 py-1">{inr(b.commission_inr)} @ {b.commission_pct}%</td>
                      <td className="px-2 py-1">{b.status}{b.reversed_reason ? ` (${b.reversed_reason})` : ""}</td>
                      <td className="px-2 py-1">{new Date(b.approve_after).toLocaleDateString("en-IN")}</td>
                      <td className="px-2 py-1">
                        {(b.status === "pending" || b.status === "approved") && (
                          <button className="underline text-red-700" onClick={() => reverse(b.purchase_id)}>Reverse</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(detail.data?.buyers ?? []).length === 0 && (
                    <tr><td colSpan={8} className="px-2 py-3 text-neutral-500">No buyers yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-end gap-3 border-t pt-4">
              <div>
                <label className="block text-xs font-semibold">Bank UTR for this payout</label>
                <Input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="UTR / reference" className="w-64" />
              </div>
              <Button onClick={markPaid} disabled={!utr || current.commission_approved_inr <= 0}
                      className="border-2 border-[#121212]">
                Record payout of {inr(current.net_payable_now_inr)} (after TDS)
              </Button>
              <p className="text-xs text-neutral-600 max-w-md">
                Money is sent from your bank, not by this page. Enter the UTR after the transfer. TDS is an estimate until a CA confirms the rate and threshold.
              </p>
            </div>

            <div className="text-sm">
              <h3 className="font-semibold">Payouts</h3>
              {(detail.data?.payouts ?? []).map((p: any) => (
                <div key={p.utr + p.paid_at}>
                  {new Date(p.paid_at).toLocaleDateString("en-IN")} · gross {inr(p.gross_inr)} · TDS {inr(p.tds_inr)} · net {inr(p.net_inr)} · UTR {p.utr}
                </div>
              ))}
              {(detail.data?.payouts ?? []).length === 0 && <div className="text-neutral-500">None yet.</div>}
            </div>
          </section>
        )}

        <section className="border-2 border-[#121212] bg-white p-4 space-y-3">
          <h2 className="font-bold text-xl">Add influencer</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Handle (@...)" value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} />
            <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input placeholder="Code (e.g. priya-indore)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })} />
            <Input placeholder="Commission %" value={form.commission_pct} onChange={(e) => setForm({ ...form, commission_pct: e.target.value })} />
          </div>
          <Button onClick={saveInfluencer} disabled={!form.name || !form.code} className="border-2 border-[#121212]">Add</Button>
        </section>
      </main>
    </div>
  );
}
