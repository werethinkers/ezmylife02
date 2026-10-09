import { useEffect, useState, type ReactNode } from "react";
import { getBusiness, listRequests, listSubmissions, type Business, type RequestLog, type Status, type Submission } from "../lib/business";
import { cn } from "@/lib/utils";

/** Live view of one business and its submissions; refreshes on any save. */
export function useBusinessData(id: string) {
  const [state, setState] = useState<{ biz: Business | null | undefined; subs: Submission[]; reqs: RequestLog[] }>({
    biz: undefined,
    subs: [],
    reqs: [],
  });
  useEffect(() => {
    const load = () => setState({ biz: getBusiness(id) ?? null, subs: listSubmissions(id), reqs: listRequests(id) });
    load();
    window.addEventListener("listingkit:change", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("listingkit:change", load);
      window.removeEventListener("storage", load);
    };
  }, [id]);
  return state;
}

export function Panel({ title, hint, action, children, className }: { title?: string; hint?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card p-5", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-semibold">{title}</h2>}
            {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint, icon: Icon, tone }: { label: string; value: string | number; hint?: string; icon: React.ComponentType<{ className?: string }>; tone?: "warn" | "good" | "bad" }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div
          className={cn(
            "grid h-7 w-7 place-items-center rounded-md",
            tone === "warn" ? "bg-amber-400/25 text-amber-800" : tone === "bad" ? "bg-destructive/10 text-destructive" : tone === "good" ? "bg-emerald-500/15 text-emerald-600" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

const STATUS_STYLE: Record<Status, string> = {
  New: "bg-sky-500/15 text-sky-700",
  "Pending approval": "bg-amber-400/25 text-amber-800",
  "Needs edit": "bg-amber-400/25 text-amber-800",
  Approved: "bg-primary/15 text-primary",
  "Posted on Google": "bg-emerald-500/15 text-emerald-600",
  Rejected: "bg-destructive/10 text-destructive",
  "Missing consent": "bg-destructive/10 text-destructive",
  "Internal only": "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[status])}>{status}</span>;
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="whitespace-nowrap text-sm tabular-nums">
      <span className="text-amber-400">{"★".repeat(n)}</span>
      <span className="text-muted-foreground/30">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function EmptyState({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-10 text-center">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      {children && <div className="mt-4 flex justify-center gap-2">{children}</div>}
    </div>
  );
}
