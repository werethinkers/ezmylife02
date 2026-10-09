import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { gb } from "../lib/business";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Inbox,
  ShieldAlert,
  Star,
  Clock,
  XCircle,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Kpi, Panel, Stars, StatusBadge, fmtDate, useBusinessData } from "../components/dash";
import { clearSampleSubmissions, isPending } from "../lib/business";
import { loadSampleData } from "../lib/sample";


export default function Overview() {
  const { id } = useParams() as { id: string; sid: string };
  const { biz, subs, reqs } = useBusinessData(id);

  const stats = useMemo(() => {
    const count = (f: (s: (typeof subs)[number]) => boolean) => subs.filter(f).length;
    const rated = subs.filter((s) => s.rating > 0);
    const avg = rated.length ? rated.reduce((a, s) => a + s.rating, 0) / rated.length : 0;
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (13 - i));
      return d;
    });
    const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const trend = days.map((d) => {
      const day = subs.filter((s) => key(new Date(s.createdAt)) === key(d));
      return {
        day: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        Submissions: day.length,
        "Opened Google": day.filter((s) => s.reviewOpened).length,
      };
    });
    const ratings = [5, 4, 3, 2, 1].map((r) => ({ rating: `${r}★`, count: count((s) => s.rating === r) }));
    return {
      total: subs.length,
      pending: count(isPending),
      approved: count((s) => s.status === "Approved"),
      posted: count((s) => s.status === "Posted on Google"),
      rejected: count((s) => s.status === "Rejected"),
      missing: count((s) => s.status === "Missing consent" || !s.consentMarketing),
      opened: count((s) => s.reviewOpened),
      avg,
      trend,
      ratings,
    };
  }, [subs]);

  const byLocation = useMemo(
    () =>
      (biz?.locations ?? []).map((l) => {
        const ls = subs.filter((s) => s.locationId === l.id);
        const rated = ls.filter((s) => s.rating > 0);
        return {
          loc: l,
          total: ls.length,
          avg: rated.length ? rated.reduce((a, s) => a + s.rating, 0) / rated.length : 0,
          opened: ls.filter((s) => s.reviewOpened).length,
          posted: ls.filter((s) => s.status === "Posted on Google").length,
          pending: ls.filter(isPending).length,
          requests: reqs.filter((r) => r.locationId === l.id).length,
        };
      }),
    [biz, subs, reqs],
  );

  if (!biz) return null;
  const hasSample = subs.some((s) => s.sample);
  const pct = (n: number) => (stats.total ? `${Math.round((n / stats.total) * 100)}%` : "—");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground">Customer feedback and Google reviews across all {biz.locations.length} locations.</p>
        </div>
        {hasSample ? (
          <Button variant="outline" size="sm" onClick={() => clearSampleSubmissions(biz.id)}>Clear sample data</Button>
        ) : (
          subs.length === 0 && <Button variant="outline" size="sm" onClick={() => loadSampleData(biz)}>Load sample data</Button>
        )}
      </div>

      {hasSample && (
        <div className="rounded-lg border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm">You're viewing sample data. Clear it before sharing real numbers.</div>
      )}

      {subs.length === 0 ? (
        <EmptyState
          title="No customer feedback yet"
          body="Share your review link or put the QR code at the counter. Customers send their feedback to your WhatsApp, and you add it under Submissions."
        >
          <Button asChild>
            <Link to={gb(`/b/${id}/share`)}>Get review link & QR</Link>
          </Button>
          <Button variant="outline" onClick={() => loadSampleData(biz)}>Preview with sample data</Button>
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="Total submissions" value={stats.total} icon={Inbox} hint={`${reqs.length} review requests sent`} />
            <Kpi label="Pending approval" value={stats.pending} icon={Clock} tone="warn" />
            <Kpi label="Approved" value={stats.approved} icon={BadgeCheck} />
            <Kpi label="Posted on Google" value={stats.posted} icon={CheckCircle2} tone="good" />
            <Kpi label="Rejected" value={stats.rejected} icon={XCircle} tone="bad" />
            <Kpi label="Missing consent" value={stats.missing} icon={ShieldAlert} tone="bad" hint="Can't be posted publicly" />
            <Kpi label="Opened Google review page" value={stats.opened} icon={ExternalLink} hint={`${pct(stats.opened)} of submissions`} />
            <Kpi label="Average rating" value={stats.avg ? stats.avg.toFixed(1) : "—"} icon={Star} hint="From customer feedback" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Panel title="Last 14 days" hint="Submissions vs customers who opened your Google review page">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.trend} margin={{ left: -20, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} interval={2} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="Submissions" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Opened Google" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="Rating mix">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.ratings} layout="vertical" margin={{ left: -16, right: 16 }}>
                    <XAxis type="number" allowDecimals={false} hide />
                    <YAxis type="category" dataKey="rating" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} cursor={{ fill: "hsl(var(--muted))" }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title="Location-wise performance">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3 font-medium">Location</th>
                    <th className="px-3 font-medium">City</th>
                    <th className="px-3 text-right font-medium">Requests</th>
                    <th className="px-3 text-right font-medium">Submissions</th>
                    <th className="px-3 text-right font-medium">Avg rating</th>
                    <th className="px-3 text-right font-medium">Opened Google</th>
                    <th className="px-3 text-right font-medium">Pending</th>
                    <th className="pl-3 text-right font-medium">Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {byLocation
                    .sort((a, b) => b.total - a.total)
                    .map((r) => (
                      <tr key={r.loc.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-3">
                          <div className="font-medium">{r.loc.name}</div>
                          <div className="text-xs text-muted-foreground">{r.loc.code}</div>
                        </td>
                        <td className="px-3 text-muted-foreground">{r.loc.city || "—"}</td>
                        <td className="px-3 text-right tabular-nums">{r.requests}</td>
                        <td className="px-3 text-right tabular-nums">{r.total}</td>
                        <td className="px-3 text-right tabular-nums">{r.avg ? r.avg.toFixed(1) : "—"}</td>
                        <td className="px-3 text-right tabular-nums">
                          {r.opened}
                          <span className="ml-1 text-xs text-muted-foreground">{r.total ? `${Math.round((r.opened / r.total) * 100)}%` : ""}</span>
                        </td>
                        <td className="px-3 text-right tabular-nums">{r.pending}</td>
                        <td className="pl-3 text-right tabular-nums">{r.posted}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {byLocation.some((r) => !r.loc.reviewLink) && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5" /> Some locations have no Google review link.{" "}
                <Link to={gb(`/b/${id}/locations`)} className="underline">Add them</Link>
              </p>
            )}
          </Panel>

          <Panel
            title="Latest submissions"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to={gb(`/b/${id}/submissions`)}>View all</Link>
              </Button>
            }
          >
            <div className="divide-y">
              {subs.slice(0, 6).map((s) => (
                <Link
                  key={s.id}
                  to={gb(`/b/${id}/submissions/${s.id}`)}
                  className="flex items-center gap-3 py-2.5 text-sm hover:bg-muted/40"
                >
                  <Stars n={s.rating} />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{s.customerName || "Customer"}</span>
                    <span className="ml-2 truncate text-muted-foreground">{s.feedback || s.reviewText}</span>
                  </div>
                  <span className="hidden text-xs text-muted-foreground sm:inline">{fmtDate(s.createdAt)}</span>
                  <StatusBadge status={s.status} />
                </Link>
              ))}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
