import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// RPCs from 20261012160000_refund_requests.sql (types not regenerated yet).
const rpc = (name: string, args: Record<string, unknown> = {}) =>
  (supabase as any).rpc(name, args) as Promise<{ data: any; error: { message: string } | null }>;

// supabase-js reports a missing or unreachable edge function as a generic send
// failure, which tells the admin nothing. Say what it actually means.
const explain = (e: unknown) => {
  const m = e instanceof Error ? e.message : String(e);
  if (/failed to send a request|failed to fetch|load failed|networkerror/i.test(m)) {
    return "This button needs a server function that is not deployed yet. Deploy it with the Supabase CLI, then try again.";
  }
  return m;
};

const inr = (n: number | null | undefined) =>
  "₹" + Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const dt = (s: string | null) => (s ? new Date(s).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—");

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

// The three groups the admin works through, in order.
const GROUPS = [
  { key: "requested", title: "1. Needs your decision", help: "Buyers who asked for a refund. Approve or reject each one." },
  { key: "approved", title: "2. Approved, not yet sent", help: "You approved these. Press 'Send refund' to pay the buyer back." },
  { key: "done", title: "3. Finished", help: "Refunded, rejected or failed. Nothing more to do unless a send failed." },
];

function Breakdown({ r }: { r: Req }) {
  const used = r.live.credits_used;
  const unused = r.live.credits_unused;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
      <div className="border-2 border-[#121212] bg-white p-3">
        <div className="text-xs font-semibold text-neutral-600">They paid</div>
        <div className="text-xl font-bold">{inr(r.live.paid_inr)}</div>
        <div className="text-xs">for {r.live.credits_purchased.toLocaleString("en-IN")} credits</div>
      </div>
      <div className="border-2 border-[#121212] bg-white p-3">
        <div className="text-xs font-semibold text-neutral-600">Used (kept by us)</div>
        <div className="text-xl font-bold">− {inr(r.live.used_value_inr)}</div>
        <div className="text-xs">{used.toLocaleString("en-IN")} credits used × {inr(r.live.per_credit_inr)}</div>
      </div>
      <div className="border-2 border-[#121212] bg-[#22C3A6] p-3">
        <div className="text-xs font-semibold">Refund this buyer</div>
        <div className="text-xl font-bold">{inr(r.live.refundable_inr)}</div>
        <div className="text-xs">{unused.toLocaleString("en-IN")} unused credits removed from their wallet</div>
      </div>
    </div>
  );
}

export default function AdminRefunds({ embedded = false }: { embedded?: boolean } = {}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
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
    queryKey: ["refund-list"],
    enabled: isAdmin.data === true,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await rpc("refund_admin_list", { _status: null });
      if (error) throw new Error(error.message);
      return data as Req[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["refund-list"] });

  const approve = async (r: Req) => {
    const ok = window.confirm(
      `Approve a refund of ${inr(r.live.refundable_inr)} to ${r.buyer}?\n\n` +
      `They paid ${inr(r.live.paid_inr)}. They used ${r.live.credits_used} credits (${inr(r.live.used_value_inr)}), which we keep.\n\n` +
      `Approving does not send money. Next, press "Send refund".`,
    );
    if (!ok) return;
    setBusy(r.id);
    const { data, error } = await rpc("refund_approve", { _request_id: r.id, _note: "" });
    setBusy(null);
    if (error) return toast({ title: "Not approved", description: error.message, variant: "destructive" });
    toast({ title: "Approved", description: `${inr(data.approved_inr)} is ready to send.` });
    refresh();
  };

  const reject = async (r: Req) => {
    const note = window.prompt("Why are you rejecting this refund? (The buyer may be told.)");
    if (!note) return;
    setBusy(r.id);
    const { error } = await rpc("refund_reject", { _request_id: r.id, _note: note });
    setBusy(null);
    if (error) return toast({ title: "Not rejected", description: error.message, variant: "destructive" });
    refresh();
  };

  const sendRefund = async (r: Req) => {
    const ok = window.confirm(
      `Send ${inr(r.live.refundable_inr)} back to ${r.buyer} now?\n\n` +
      `This moves real money through Razorpay. It cannot be undone from this page.\n` +
      `${r.live.credits_unused} unused credits will be removed from their account.`,
    );
    if (!ok) return;
    setBusy(r.id);
    try {
      const { data, error } = await supabase.functions.invoke("refund-process", { body: { request_id: r.id } });
      if (error || data?.error) throw new Error(data?.error ?? error?.message);
      toast({ title: "Refund sent", description: `${inr(data.refunded_inr)} · Razorpay ref ${data.razorpay_refund_id}` });
    } catch (e) {
      toast({ title: "Refund did not go through", description: explain(e), variant: "destructive" });
    } finally {
      setBusy(null);
      refresh();
    }
  };

  const openForBuyer = async () => {
    const { error } = await rpc("refund_request_create", { _purchase_id: newPurchase.trim(), _reason: newReason });
    if (error) return toast({ title: "Not opened", description: error.message, variant: "destructive" });
    setNewPurchase(""); setNewReason(""); setShowNew(false);
    toast({ title: "Request opened", description: "It is now in 'Needs your decision'." });
    refresh();
  };

  if (isAdmin.isLoading) return <div className="p-8">Checking your access…</div>;
  if (isAdmin.data !== true) return <div className="p-8">This page is for admins only.</div>;

  const all = list.data ?? [];
  const bucket = (g: string) =>
    g === "done" ? all.filter((r) => ["processed", "rejected", "failed"].includes(r.status))
                 : all.filter((r) => r.status === g);
  const pendingTotal = bucket("requested").reduce((s, r) => s + r.live.refundable_inr, 0);
  const sendTotal = bucket("approved").reduce((s, r) => s + r.live.refundable_inr, 0);

  return (
    <div className={embedded ? "text-[#121212]" : "min-h-screen bg-[#FFF8EB] text-[#121212]"}>
      {!embedded && <Navbar />}
      <main className={embedded ? "space-y-6" : "mx-auto max-w-6xl px-4 py-6 space-y-6"}>
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-bold text-3xl">Refunds</h1>
            <p className="text-sm text-neutral-700 max-w-2xl">
              Nothing is refunded automatically. Each refund goes through three steps: a buyer asks, you approve,
              then you send. Only the <strong>unused</strong> credits are refunded. Credits they already used are kept.
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowNew(!showNew)} className="border-2 border-[#121212]">
            {showNew ? "Close" : "+ Log a refund request from WhatsApp"}
          </Button>
        </header>

        {showNew && (
          <section className="border-2 border-[#121212] bg-white p-4 space-y-2">
            <p className="text-sm text-neutral-700">
              Use this when a buyer asks for a refund outside the app. Paste the purchase ID (from the buyer's
              page in admin). The request then appears in step 1 for you to approve.
            </p>
            <div className="flex flex-wrap gap-2">
              <Input value={newPurchase} onChange={(e) => setNewPurchase(e.target.value)} placeholder="Purchase ID" className="w-96 font-mono" />
              <Input value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="Reason they gave" className="w-72" />
              <Button onClick={openForBuyer} disabled={!newPurchase.trim()} className="border-2 border-[#121212]">Open request</Button>
            </div>
          </section>
        )}

        <section className="grid grid-cols-2 gap-3 md:w-2/3">
          <div className="border-2 border-[#121212] bg-[#FFC800] p-3 shadow-[4px_4px_0_#121212]">
            <div className="text-xs font-semibold">Waiting for your decision</div>
            <div className="text-2xl font-bold">{bucket("requested").length} · {inr(pendingTotal)}</div>
          </div>
          <div className="border-2 border-[#121212] bg-[#22C3A6] p-3 shadow-[4px_4px_0_#121212]">
            <div className="text-xs font-semibold">Approved, still to send</div>
            <div className="text-2xl font-bold">{bucket("approved").length} · {inr(sendTotal)}</div>
          </div>
        </section>

        {list.error && <p className="text-red-700">{(list.error as Error).message}</p>}

        {GROUPS.map((g) => {
          const items = bucket(g.key);
          return (
            <section key={g.key} className="space-y-3">
              <div>
                <h2 className="font-bold text-xl">{g.title} <span className="text-neutral-500">({items.length})</span></h2>
                <p className="text-sm text-neutral-600">{g.help}</p>
              </div>
              {items.length === 0 && <p className="text-sm text-neutral-500 border-2 border-dashed border-neutral-400 p-4">Nothing here.</p>}

              {items.map((r) => (
                <article key={r.id} className="border-2 border-[#121212] bg-white p-4 shadow-[4px_4px_0_#121212] space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">{r.buyer} · {r.pack_id} pack</div>
                      <div className="text-sm text-neutral-700">Bought {dt(r.paid_at)} · asked {dt(r.created_at)}</div>
                      {r.reason && <div className="text-sm mt-1">Their reason: “{r.reason}”</div>}
                      {r.admin_note && <div className="text-sm mt-1 text-neutral-600">Note: {r.admin_note}</div>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.status === "requested" && (
                        <>
                          <Button onClick={() => approve(r)} disabled={busy === r.id || r.live.refundable_inr <= 0} className="border-2 border-[#121212]">
                            Approve {inr(r.live.refundable_inr)}
                          </Button>
                          <Button onClick={() => reject(r)} disabled={busy === r.id} variant="outline" className="border-2 border-[#121212]">Reject</Button>
                        </>
                      )}
                      {r.status === "approved" && (
                        <>
                          <Button onClick={() => sendRefund(r)} disabled={busy === r.id}
                                  className="border-2 border-[#121212] bg-[#FF8157] text-[#121212] hover:bg-[#ff6f3f]">
                            {busy === r.id ? "Sending…" : `Send ${inr(r.live.refundable_inr)} now`}
                          </Button>
                          <Button onClick={() => reject(r)} disabled={busy === r.id} variant="outline" className="border-2 border-[#121212]">Cancel</Button>
                        </>
                      )}
                    </div>
                  </div>

                  {r.status === "processed" && (
                    <p className="text-sm font-semibold">Sent {inr(r.processed_inr)} on {dt(r.processed_at)} · Razorpay ref {r.razorpay_refund_id}</p>
                  )}
                  {r.status === "failed" && (
                    <p className="text-sm font-semibold text-[#b1430f]">
                      The send did not go through. Nothing was paid. Check the note above, then Approve it again to retry.
                    </p>
                  )}

                  <Breakdown r={r} />

                  {r.live.credits_used > r.credits_used_at_request && r.status === "requested" && (
                    <p className="text-sm text-[#b1430f]">
                      They used {r.live.credits_used - r.credits_used_at_request} more credits since asking, so the refund has dropped
                      from {inr(r.refundable_at_request_inr)} to {inr(r.live.refundable_inr)}.
                    </p>
                  )}

                  {r.commission_status && (
                    <p className="text-sm">
                      Influencer commission on this sale: <strong>{inr(r.commission_inr)}</strong> ·{" "}
                      {r.commission_status === "paid"
                        ? "already paid out. Deduct it from that influencer's next payment."
                        : "will be cancelled automatically when the refund is sent."}
                    </p>
                  )}
                </article>
              ))}
            </section>
          );
        })}
      </main>
    </div>
  );
}
