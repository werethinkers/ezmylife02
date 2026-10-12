import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// RPCs from 20261012160000_refund_requests.sql. Generated types are not refreshed yet.
const rpc = (name: string, args: Record<string, unknown> = {}) =>
  (supabase as any).rpc(name, args) as Promise<{ data: any; error: { message: string } | null }>;

const inr = (n: number | null | undefined) =>
  "₹" + Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

type Req = {
  id: string; purchase_id: string; status: string; reason: string | null; admin_note: string | null;
  created_at: string; decided_at: string | null; processed_at: string | null;
  razorpay_refund_id: string | null; buyer: string; pack_id: string; paid_inr: number; paid_at: string;
  credits_purchased: number; credits_used_at_request: number; refundable_at_request_inr: number;
  processed_inr: number | null;
  live: {
    credits_purchased: number; credits_used: number; credits_unused: number;
    per_credit_inr: number; used_value_inr: number; refundable_inr: number; paid_inr: number;
  };
  commission_status: string | null; commission_inr: number | null;
};

const BADGE: Record<string, string> = {
  requested: "bg-[#FFC800] border-[#121212]",
  approved: "bg-[#22C3A6] border-[#121212]",
  processed: "bg-[#121212] text-white border-[#121212]",
  rejected: "bg-neutral-200 border-neutral-400",
  failed: "bg-[#FF8157] border-[#121212]",
};

export default function AdminRefunds() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("requested");
  const [newPurchase, setNewPurchase] = useState("");
  const [newReason, setNewReason] = useState("");

  const isAdmin = useQuery({
    queryKey: ["refund-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      return data === true;
    },
  });

  const list = useQuery({
    queryKey: ["refund-list", filter],
    enabled: isAdmin.data === true,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await rpc("refund_admin_list", { _status: filter || null });
      if (error) throw new Error(error.message);
      return data as Req[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["refund-list"] });

  const openRequest = async () => {
    const { error } = await rpc("refund_request_create", {
      _purchase_id: newPurchase.trim(),
      _reason: newReason,
    });
    if (error) return toast({ title: "Not created", description: error.message, variant: "destructive" });
    setNewPurchase(""); setNewReason("");
    toast({ title: "Refund request opened", description: "It now needs your approval." });
    setFilter("requested"); refresh();
  };

  const approve = async (r: Req) => {
    const note = window.prompt(
      `Approve a refund of ${inr(r.live.refundable_inr)}?\n\n` +
      `Paid ${inr(r.live.paid_inr)} for ${r.live.credits_purchased} credits.\n` +
      `Used ${r.live.credits_used} credits = ${inr(r.live.used_value_inr)} (deducted).\n` +
      `Unused ${r.live.credits_unused} credits = ${inr(r.live.refundable_inr)} (refundable).\n\n` +
      `Approving only authorises it. You still press "Send refund".\n\nNote (optional):`,
      "",
    );
    if (note === null) return;
    setBusy(r.id);
    const { data, error } = await rpc("refund_approve", { _request_id: r.id, _note: note });
    setBusy(null);
    if (error) return toast({ title: "Not approved", description: error.message, variant: "destructive" });
    toast({ title: "Approved", description: `${inr(data.approved_inr)} authorised. Press “Send refund” to pay it.` });
    refresh();
  };

  const reject = async (r: Req) => {
    const note = window.prompt("Reason for rejecting (the buyer may be told this):");
    if (!note) return;
    setBusy(r.id);
    const { error } = await rpc("refund_reject", { _request_id: r.id, _note: note });
    setBusy(null);
    if (error) return toast({ title: "Not rejected", description: error.message, variant: "destructive" });
    refresh();
  };

  const sendRefund = async (r: Req) => {
    const ok = window.confirm(
      `SEND ${inr(r.live.refundable_inr)} back to ${r.buyer} now?\n\n` +
      `This moves real money through Razorpay and cannot be undone.\n` +
      `${r.live.credits_unused} unused credits will be removed from their wallet.\n` +
      `${r.live.credits_used} used credits (${inr(r.live.used_value_inr)}) are NOT refunded.`,
    );
    if (!ok) return;
    setBusy(r.id);
    try {
      const { data, error } = await supabase.functions.invoke("refund-process", {
        body: { request_id: r.id },
      });
      if (error || data?.error) throw new Error(data?.error ?? error?.message);
      toast({
        title: "Refund sent",
        description: `${inr(data.refunded_inr)} refunded · ${data.credits_refunded} credits removed · ref ${data.razorpay_refund_id}`,
      });
      refresh();
    } catch (e) {
      toast({ title: "Refund failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
      refresh();
    } finally {
      setBusy(null);
    }
  };

  if (isAdmin.isLoading) return <div className="p-8">Checking access…</div>;
  if (isAdmin.data !== true) return <div className="p-8">Admin only.</div>;

  const rows = list.data ?? [];

  return (
    <div className="min-h-screen bg-[#FFF8EB] text-[#121212]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div>
          <h1 className="font-bold text-3xl">Refunds</h1>
          <p className="text-sm text-neutral-700 max-w-3xl">
            Nothing is refunded automatically. You approve a request, then send it. Only the
            <strong> unused </strong> part of a pack is refundable: credits already spent are deducted at the
            pack's own per-credit rate.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {["requested", "approved", "processed", "rejected", "failed", ""].map((s) => (
            <button key={s || "all"} onClick={() => setFilter(s)}
              className={`border-2 border-[#121212] px-3 py-1 text-sm font-semibold ${filter === s ? "bg-[#121212] text-white" : "bg-white"}`}>
              {s === "" ? "All" : s}
            </button>
          ))}
        </div>

        {list.error && <p className="text-red-700">{(list.error as Error).message}</p>}

        <div className="space-y-3">
          {rows.map((r) => (
            <section key={r.id} className="border-2 border-[#121212] bg-white p-4 shadow-[4px_4px_0_#121212] space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`border-2 px-2 py-0.5 text-xs font-bold uppercase ${BADGE[r.status] ?? ""}`}>{r.status}</span>
                    <span className="font-mono text-sm">{r.buyer}</span>
                  </div>
                  <div className="text-sm text-neutral-700 mt-1">
                    {r.pack_id} · paid {inr(r.paid_inr)} on {new Date(r.paid_at).toLocaleDateString("en-IN")} ·
                    requested {new Date(r.created_at).toLocaleDateString("en-IN")}
                  </div>
                  {r.reason && <div className="text-sm mt-1">Buyer's reason: {r.reason}</div>}
                  {r.admin_note && <div className="text-sm mt-1 text-neutral-600">Your note: {r.admin_note}</div>}
                </div>
                <div className="flex gap-2">
                  {r.status === "requested" && (
                    <>
                      <Button onClick={() => approve(r)} disabled={busy === r.id} className="border-2 border-[#121212]">Approve</Button>
                      <Button onClick={() => reject(r)} disabled={busy === r.id} variant="outline" className="border-2 border-[#121212]">Reject</Button>
                    </>
                  )}
                  {r.status === "approved" && (
                    <>
                      <Button onClick={() => sendRefund(r)} disabled={busy === r.id}
                              className="border-2 border-[#121212] bg-[#FF8157] text-[#121212] hover:bg-[#ff6f3f]">
                        {busy === r.id ? "Sending…" : `Send refund ${inr(r.live.refundable_inr)}`}
                      </Button>
                      <Button onClick={() => reject(r)} disabled={busy === r.id} variant="outline" className="border-2 border-[#121212]">Cancel</Button>
                    </>
                  )}
                  {r.status === "failed" && (
                    <Button onClick={() => sendRefund(r)} disabled className="border-2" title="Approve it again before retrying">Retry (re-approve first)</Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                {[
                  ["Credits bought", r.live.credits_purchased],
                  ["Credits used", `${r.live.credits_used} (${inr(r.live.used_value_inr)})`],
                  ["Credits unused", r.live.credits_unused],
                  ["Per credit", inr(r.live.per_credit_inr)],
                  ["Refundable now", inr(r.live.refundable_inr)],
                ].map(([label, value]) => (
                  <div key={String(label)} className="border border-neutral-300 bg-[#FFF8EB] p-2">
                    <div className="text-xs uppercase tracking-wide text-neutral-600">{label}</div>
                    <div className="font-bold">{value}</div>
                  </div>
                ))}
              </div>

              {r.live.credits_used > r.credits_used_at_request && (
                <p className="text-sm text-[#b1430f]">
                  The buyer spent {r.live.credits_used - r.credits_used_at_request} more credits since requesting.
                  Refundable has dropped from {inr(r.refundable_at_request_inr)} to {inr(r.live.refundable_inr)}.
                </p>
              )}

              {r.commission_status && (
                <p className="text-sm">
                  Influencer commission on this sale: {inr(r.commission_inr)} ({r.commission_status})
                  {r.commission_status === "paid"
                    ? " — already paid out, so deduct it from that influencer's next payout."
                    : " — this will be reversed automatically when the refund goes through."}
                </p>
              )}

              {r.status === "processed" && (
                <p className="text-sm font-semibold">
                  Refunded {inr(r.processed_inr)} on {new Date(r.processed_at!).toLocaleString("en-IN")} ·
                  Razorpay ref {r.razorpay_refund_id}
                </p>
              )}
            </section>
          ))}
          {rows.length === 0 && (
            <p className="text-neutral-500">No {filter || ""} refund requests.</p>
          )}
        </div>

        <section className="border-2 border-[#121212] bg-white p-4 space-y-2">
          <h2 className="font-bold text-xl">Open a request for a buyer</h2>
          <p className="text-sm text-neutral-600">
            Use this when someone asks for a refund over WhatsApp. Paste the purchase id from their row in
            Admin → user detail. It still has to be approved here afterwards.
          </p>
          <div className="flex flex-wrap gap-2">
            <Input value={newPurchase} onChange={(e) => setNewPurchase(e.target.value)}
                   placeholder="credit_purchases.id (uuid)" className="w-96 font-mono" />
            <Input value={newReason} onChange={(e) => setNewReason(e.target.value)}
                   placeholder="Reason the buyer gave" className="w-72" />
            <Button onClick={openRequest} disabled={!newPurchase.trim()} className="border-2 border-[#121212]">Open request</Button>
          </div>
        </section>
      </main>
    </div>
  );
}
