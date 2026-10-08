import { Link } from "react-router-dom";
import { Layers } from "lucide-react";
import { useWorkContext } from "../lib/context";
import { useWorkspace } from "../lib/workspace";

const inr = (n?: number) => (n ? `₹${Math.round(n).toLocaleString("en-IN")}` : "");

/** Shows which shared workspace details this tool is using, with a link to change them. */
export function ContextBanner({ show = ["client", "invoice"] }: { show?: ("client" | "invoice" | "money")[] }) {
  const { ctx } = useWorkContext();
  const { profile } = useWorkspace();
  const bits: string[] = [];
  if (profile.businessName) bits.push(profile.businessName);
  if (show.includes("client") && ctx.client?.name) bits.push(`Client: ${ctx.client.name}${ctx.client.gstin ? ` (${ctx.client.gstin})` : ""}`);
  if (show.includes("invoice") && ctx.lastInvoice?.total) bits.push(`Last invoice ${ctx.lastInvoice.number ?? ""} ${inr(ctx.lastInvoice.total)}`.trim());
  if (show.includes("money") && (ctx.money?.monthlyRevenue || ctx.money?.monthlyExpenses)) bits.push(`This month: sales ${inr(ctx.money?.monthlyRevenue) || "—"}, costs ${inr(ctx.money?.monthlyExpenses) || "—"}`);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
      <Layers className="h-3.5 w-3.5 shrink-0 text-primary" />
      {bits.length ? (
        <span className="min-w-0 flex-1 truncate">Filled from your workspace · {bits.join(" · ")}</span>
      ) : (
        <span className="min-w-0 flex-1">Set up your workspace once and your business and client details fill in here automatically.</span>
      )}
      <Link to="/workspace" className="shrink-0 font-medium text-primary hover:underline">{bits.length ? "Change" : "Set up"}</Link>
    </div>
  );
}
