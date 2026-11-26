import { useState } from "react";
import { ArrowRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkContext } from "../lib/context";
import { useWorkspace } from "../lib/workspace";
import { WorkspaceDialog } from "./WorkspaceCard";

const inr = (n?: number) => (n ? `₹${Math.round(n).toLocaleString("en-IN")}` : "");

/** Shows which shared details this tool is using, with an in-place way to change them. */
export function ContextBanner({
  show = ["client", "invoice"],
  tone = "default",
}: {
  show?: ("client" | "invoice" | "money")[];
  /** "soft" is the refined neo-brutalist look (white card, no pink tint) — opt-in, so every
   * other caller keeps today's pink-tinted strip unchanged. */
  tone?: "default" | "soft";
}) {
  const { ctx } = useWorkContext();
  const { profile } = useWorkspace();
  const [open, setOpen] = useState(false);
  const soft = tone === "soft";
  const bits: string[] = [];
  if (profile.businessName) bits.push(profile.businessName);
  if (show.includes("client") && ctx.client?.name) bits.push(`Client: ${ctx.client.name}${ctx.client.gstin ? ` (${ctx.client.gstin})` : ""}`);
  if (show.includes("invoice") && ctx.lastInvoice?.total) bits.push(`Last invoice ${ctx.lastInvoice.number ?? ""} ${inr(ctx.lastInvoice.total)}`.trim());
  if (show.includes("money") && (ctx.money?.monthlyRevenue || ctx.money?.monthlyExpenses)) bits.push(`This month: sales ${inr(ctx.money?.monthlyRevenue) || "—"}, costs ${inr(ctx.money?.monthlyExpenses) || "—"}`);
  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-center gap-2 px-3 py-2 text-xs",
        soft
          ? "rounded-2xl border border-black/[0.08] bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-[#16161A]"
          : "rounded-xl border border-primary/20 bg-primary/5",
      )}
    >
      <Layers className={cn("h-3.5 w-3.5 shrink-0", soft ? "text-[#111111] dark:text-white" : "text-primary")} />
      {bits.length ? (
        <span className={cn("min-w-0 flex-1 truncate", soft && "text-[#111111] dark:text-white")}>Filled from your earlier entries · {bits.join(" · ")}</span>
      ) : (
        <span className={cn("min-w-0 flex-1", soft && "text-[#111111] dark:text-white")}>Type your details once. They'll fill in here and in your other apps next time.</span>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("flex shrink-0 items-center gap-1 font-medium", soft ? "text-[#111111] hover:underline dark:text-white" : "text-primary hover:underline")}
      >
        {profile.businessName ? "Edit business details" : "Add business details"}
        {soft && <ArrowRight className="h-3 w-3" />}
      </button>
      <WorkspaceDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
