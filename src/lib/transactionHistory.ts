import { supabase } from "@/integrations/supabase/client";

export interface LedgerRow {
  id: string;
  user_id: string;
  delta: number;
  free_delta: number;
  paid_delta: number;
  reason: string;
  tool_id: string | null;
  run_id: string | null;
  cost_inr: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PurchaseRow {
  id: string;
  pack_id: string;
  inr_amount: number;
  credits: number;
  status: string;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  created_at: string;
  paid_at: string | null;
  coupon_code: string | null;
}

export interface ToolRunRow {
  id: string;
  tool_id: string;
  status: string;
  credits_charged: number;
  free_used: number;
  paid_used: number;
  cost_inr: number | null;
  started_at: string;
  finished_at: string | null;
  error: string | null;
  metadata: Record<string, unknown>;
}

export interface BulkJobRef {
  id: string;
  tool_id: string;
  status: string;
  total_items: number;
  completed_items: number;
  output_zip_path: string | null;
  created_at: string;
}

export interface CreationRef {
  id: string;
  tool_type: string;
  title: string | null;
  result_url: string | null;
  status: string | null;
  created_at: string;
}

export interface EnrichedEntry {
  ledger: LedgerRow;
  toolName?: string;
  toolRoute?: string;
  purchase?: PurchaseRow;
  toolRun?: ToolRunRow;
  bulkJob?: BulkJobRef;
  creation?: CreationRef;
  runningBalance?: number;
}

export async function fetchTransactionHistory(userId: string, limit = 200) {
  const sinceIso = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString();

  const [ledgerRes, purchasesRes, runsRes, bulkRes, creationsRes, catalogRes] = await Promise.all([
    supabase
      .from("credit_ledger")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("credit_purchases")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("tool_runs")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(200),
    supabase
      .from("bulk_jobs")
      .select("id, tool_id, status, total_items, completed_items, output_zip_path, created_at")
      .eq("user_id", userId)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("user_creations")
      .select("id, tool_type, title, result_url, status, created_at")
      .eq("user_id", userId)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("tools_catalog").select("id, name, dedicated_route"),
  ]);

  const ledger = (ledgerRes.data || []) as LedgerRow[];
  const purchases = (purchasesRes.data || []) as PurchaseRow[];
  const runs = (runsRes.data || []) as ToolRunRow[];
  const bulks = (bulkRes.data || []) as BulkJobRef[];
  const creations = (creationsRes.data || []) as CreationRef[];
  const catalog = (catalogRes.data || []) as { id: string; name: string; dedicated_route: string | null }[];

  const catMap = new Map(catalog.map((c) => [c.id, c]));
  const purchaseById = new Map(purchases.map((p) => [p.id, p]));
  const runById = new Map(runs.map((r) => [r.id, r]));

  const enriched: EnrichedEntry[] = ledger.map((l) => {
    const e: EnrichedEntry = { ledger: l };
    if (l.tool_id) {
      const c = catMap.get(l.tool_id);
      if (c) {
        e.toolName = c.name;
        e.toolRoute = c.dedicated_route || `/tool/${l.tool_id}`;
      }
    }
    if (l.reason === "purchase") {
      const pid = (l.metadata?.purchase_id as string | undefined) ?? null;
      if (pid && purchaseById.has(pid)) e.purchase = purchaseById.get(pid);
    }
    if (l.reason === "tool_run" && l.run_id && runById.has(l.run_id)) {
      e.toolRun = runById.get(l.run_id);
      const ts = new Date(l.created_at).getTime();
      const window = 1000 * 60 * 60 * 6; // 6 hours
      e.bulkJob = bulks.find(
        (b) => b.tool_id === l.tool_id && Math.abs(new Date(b.created_at).getTime() - ts) < window,
      );
      if (!e.bulkJob && l.tool_id) {
        e.creation = creations.find(
          (c) => Math.abs(new Date(c.created_at).getTime() - ts) < window,
        );
      }
    }
    return e;
  });

  return { entries: enriched, purchases, runs, catalog: catMap };
}

export function reasonLabel(reason: string) {
  switch (reason) {
    case "signup_bonus":
      return "Signup bonus";
    case "first_action_bonus":
      return "First-action bonus";
    case "monthly_reset":
      return "Monthly free reset";
    case "purchase":
      return "Credit purchase";
    case "tool_run":
      return "Tool run";
    case "admin_adjust":
      return "Admin adjustment";
    case "coupon":
      return "Coupon redeemed";
    default:
      return reason.replace(/_/g, " ");
  }
}

export function entriesToCSV(entries: EnrichedEntry[]): string {
  const head = [
    "date",
    "type",
    "tool",
    "delta",
    "free_delta",
    "paid_delta",
    "cost_inr",
    "details",
  ];
  const rows = entries.map((e) => {
    const l = e.ledger;
    const details: string[] = [];
    if (e.purchase) details.push(`pack=${e.purchase.pack_id};inr=${e.purchase.inr_amount};payment=${e.purchase.razorpay_payment_id ?? ""}`);
    if (e.toolRun) details.push(`run_status=${e.toolRun.status}`);
    if (e.bulkJob) details.push(`bulk_job=${e.bulkJob.id}`);
    if (e.creation?.result_url) details.push(`output=${e.creation.result_url}`);
    if (l.metadata?.note) details.push(`note=${String(l.metadata.note).replace(/[",\n]/g, " ")}`);
    return [
      l.created_at,
      reasonLabel(l.reason),
      e.toolName || l.tool_id || "",
      String(l.delta),
      String(l.free_delta),
      String(l.paid_delta),
      l.cost_inr != null ? String(l.cost_inr) : "",
      details.join(" | "),
    ];
  });
  return [head, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
