import { useEffect, useMemo, useState, type ReactNode } from "react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WEBSITE_CATEGORIES } from "@/components/brand/nav";
import { ACTION_CONFIG, getHumanDescription } from "@/components/admin/ActivityArchive";
import { pageUrlFor } from "@/instant/util";

/**
 * Click-through detail for the five numbers at the top of the admin dashboard.
 * Everything here only reads; nothing touches payments, wallets or credit charging.
 * Each view fetches its own rows when opened, so the numbers always match the card and
 * the page stays light until someone clicks.
 */

export type StatKey = "users" | "credits" | "websites" | "cards" | "logins";
export const STAT_KEYS: StatKey[] = ["users", "credits", "websites", "cards", "logins"];

export interface DrilldownProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  auth_provider: string | null;
  company: string | null;
  created_at: string;
}

const ROW_CAP = 1000;

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const when = (iso: string) => format(new Date(iso), "d MMM, h:mm a");
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

const TITLES: Record<StatKey, { title: string; blurb: string }> = {
  users: { title: "Total users", blurb: "Everyone who has an account, with when they joined and what they have paid." },
  credits: { title: "Credits sold", blurb: "Every credit pack purchase: who bought, which pack, how they paid." },
  websites: { title: "Websites sold", blurb: "Paid website orders and the page each one created." },
  cards: { title: "Cards sold", blurb: "Paid card and invitation orders and the page each one created." },
  logins: { title: "Today's logins", blurb: "Who logged in today and what each person did afterwards." },
};

/* ---------- small shared pieces ---------- */

const Tiles = ({ items }: { items: { label: string; value: ReactNode }[] }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
    {items.map((t) => (
      <div key={t.label} className="rounded-lg border border-border bg-card p-3">
        <p className="text-xl font-bold leading-tight">{t.value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t.label}</p>
      </div>
    ))}
  </div>
);

const Section = ({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) => (
  <section className="space-y-2">
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {aside}
    </div>
    {children}
  </section>
);

const Empty = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">{children}</div>
);

const Loading = () => (
  <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
);

const Chips = ({ options, value, onChange }: { options: { id: string; label: string; count?: number }[]; value: string; onChange: (v: string) => void }) => (
  <div className="flex gap-1.5 flex-wrap">
    {options.map((o) => (
      <Button key={o.id} size="sm" variant={value === o.id ? "default" : "outline"} className="text-xs capitalize h-8" onClick={() => onChange(o.id)}>
        {o.label}{o.count !== undefined && <span className="ml-1.5 opacity-70">{o.count}</span>}
      </Button>
    ))}
  </div>
);

const SearchBox = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
  </div>
);

const CapNotice = ({ n }: { n: number }) =>
  n >= ROW_CAP ? <p className="text-xs text-muted-foreground">Showing the latest {ROW_CAP.toLocaleString("en-IN")} rows.</p> : null;

/** Rows split under Today / Yesterday / date headings, each with an optional day total. */
function ByDay<T>({ rows, getTime, render, total }: { rows: T[]; getTime: (r: T) => string; render: (r: T) => ReactNode; total?: (rows: T[]) => string }) {
  const groups = useMemo(() => {
    const out: { label: string; rows: T[] }[] = [];
    for (const r of rows) {
      const d = new Date(getTime(r));
      const label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "d MMMM yyyy");
      const last = out[out.length - 1];
      if (last && last.label === label) last.rows.push(r);
      else out.push({ label, rows: [r] });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.label} className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-muted-foreground">{g.label} · {g.rows.length}</p>
            {total && <p className="text-xs font-semibold text-muted-foreground">{total(g.rows)}</p>}
          </div>
          <div className="space-y-1.5">{g.rows.map(render)}</div>
        </div>
      ))}
    </div>
  );
}

const RowCard = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg border border-border bg-card p-3 text-sm">{children}</div>
);

const Breakdown = ({ rows, head }: { rows: { label: string; count: number; amount?: number; extra?: string }[]; head: string }) =>
  rows.length === 0 ? null : (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-muted/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{head}</span><span className="text-right">Orders</span><span className="text-right w-20">Amount</span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 text-sm border-t border-border/60">
          <span className="truncate">{r.label}{r.extra && <span className="text-xs text-muted-foreground"> · {r.extra}</span>}</span>
          <span className="text-right">{r.count}</span>
          <span className="text-right w-20 font-medium">{r.amount !== undefined ? inr(r.amount) : "—"}</span>
        </div>
      ))}
    </div>
  );

const statusTone = (s: string) =>
  s === "paid" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
  : s === "created" || s === "pending" || s === "pending_payment" ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
  : "bg-muted text-muted-foreground border-border";

function useUserLabels(profiles: DrilldownProfile[]) {
  const map = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);
  const name = (id: string) => { const p = map.get(id); return p?.full_name || p?.display_name || p?.email || id.slice(0, 8); };
  const email = (id: string) => map.get(id)?.email || "";
  return { name, email };
}

const Person = ({ id, labels }: { id: string; labels: ReturnType<typeof useUserLabels> }) => (
  <a href={`/admin/user/${id}`} target="_blank" rel="noreferrer" className="group inline-flex flex-col min-w-0 max-w-full">
    <span className="font-medium truncate group-hover:underline">{labels.name(id)}</span>
    {labels.email(id) && labels.email(id) !== labels.name(id) && <span className="text-xs text-muted-foreground truncate">{labels.email(id)}</span>}
  </a>
);

/** Run a loader once on open; shows the error instead of a blank panel. */
function useLoaded<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    load().then((d) => { if (alive) setData(d); }).catch((e: unknown) => { if (alive) setError(e instanceof Error ? e.message : String(e)); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { data, error };
}

const unwrap = <R,>(res: { data: R | null; error: { message: string } | null }): R => {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as R;
};

/* ---------- users ---------- */

const UsersView = ({ profiles }: { profiles: DrilldownProfile[] }) => {
  const labels = useUserLabels(profiles);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");
  const { data: spend } = useLoaded(async () => {
    const [p, o] = await Promise.all([
      supabase.from("credit_purchases").select("user_id, inr_amount").eq("status", "paid"),
      supabase.from("ip_orders").select("user_id, inr_amount").eq("status", "paid"),
    ]);
    const totals = new Map<string, number>();
    for (const r of [...unwrap(p), ...unwrap(o)]) totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + (r.inr_amount || 0));
    return totals;
  });

  const now = Date.now();
  const joinedWithin = (days: number) => profiles.filter((p) => now - new Date(p.created_at).getTime() < days * 864e5).length;
  const providers = useMemo(() => {
    const m = new Map<string, number>();
    profiles.forEach((p) => m.set(p.auth_provider || "email", (m.get(p.auth_provider || "email") ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [profiles]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = profiles.filter((p) => !needle || [p.full_name, p.display_name, p.email, p.company].some((v) => v?.toLowerCase().includes(needle)));
    if (sort === "spend") return [...list].sort((a, b) => (spend?.get(b.id) ?? 0) - (spend?.get(a.id) ?? 0));
    return list;
  }, [profiles, q, sort, spend]);

  return (
    <div className="space-y-5">
      <Tiles items={[
        { label: "Total users", value: profiles.length },
        { label: "Joined today", value: profiles.filter((p) => isToday(new Date(p.created_at))).length },
        { label: "Last 7 days", value: joinedWithin(7) },
        { label: "Last 30 days", value: joinedWithin(30) },
      ]} />
      <Section title="How they signed up">
        <div className="flex gap-1.5 flex-wrap">
          {providers.map(([p, n]) => <Badge key={p} variant="outline" className="capitalize">{p} · {n}</Badge>)}
        </div>
      </Section>
      <Section title="Everyone" aside={<Chips value={sort} onChange={setSort} options={[{ id: "newest", label: "Newest" }, { id: "spend", label: "Top spenders" }]} />}>
        <SearchBox value={q} onChange={setQ} placeholder="Search name, email or company" />
        {rows.length === 0 ? <Empty>No users match.</Empty> : (
          <div className="space-y-1.5">
            {rows.map((p) => {
              const paid = spend?.get(p.id) ?? 0;
              return (
                <RowCard key={p.id}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0"><Person id={p.id} labels={labels} /></div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Joined {format(new Date(p.created_at), "d MMM yyyy")}</p>
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <Badge variant="outline" className="text-[10px] capitalize">{p.auth_provider || "email"}</Badge>
                        {paid > 0 && <Badge variant="outline" className={`text-[10px] ${statusTone("paid")}`}>Paid {inr(paid)}</Badge>}
                      </div>
                    </div>
                  </div>
                  {p.company && <p className="text-xs text-muted-foreground mt-1.5">{p.company}</p>}
                </RowCard>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
};

/* ---------- credits ---------- */

interface Purchase {
  id: string; user_id: string; pack_id: string; credits: number; inr_amount: number; status: string;
  coupon_code: string | null; ref_code: string | null; razorpay_payment_id: string | null; created_at: string; paid_at: string | null;
}

const CreditsView = ({ profiles }: { profiles: DrilldownProfile[] }) => {
  const labels = useUserLabels(profiles);
  const [status, setStatus] = useState("paid");
  const [q, setQ] = useState("");
  const { data, error } = useLoaded(async () =>
    unwrap<Purchase[]>(await supabase.from("credit_purchases")
      .select("id, user_id, pack_id, credits, inr_amount, status, coupon_code, ref_code, razorpay_payment_id, created_at, paid_at")
      .order("created_at", { ascending: false }).limit(ROW_CAP)));

  const paid = useMemo(() => (data ?? []).filter((p) => p.status === "paid"), [data]);
  const statuses = useMemo(() => {
    const m = new Map<string, number>();
    (data ?? []).forEach((p) => m.set(p.status, (m.get(p.status) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => (a[0] === "paid" ? -1 : b[0] === "paid" ? 1 : b[1] - a[1]));
  }, [data]);
  const byPack = useMemo(() => {
    const m = new Map<string, { count: number; amount: number; credits: number }>();
    paid.forEach((p) => { const e = m.get(p.pack_id) ?? { count: 0, amount: 0, credits: 0 }; e.count++; e.amount += p.inr_amount || 0; e.credits += p.credits || 0; m.set(p.pack_id, e); });
    return [...m.entries()].sort((a, b) => b[1].amount - a[1].amount).map(([label, v]) => ({ label, count: v.count, amount: v.amount, extra: `${v.credits} credits` }));
  }, [paid]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((p) => p.status === status && (!needle || [labels.name(p.user_id), labels.email(p.user_id), p.pack_id, p.coupon_code, p.ref_code].some((v) => v?.toLowerCase().includes(needle))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, status, q, profiles]);

  if (error) return <Empty>Could not load purchases: {error}</Empty>;
  if (!data) return <Loading />;
  const revenue = paid.reduce((s, p) => s + (p.inr_amount || 0), 0);

  return (
    <div className="space-y-5">
      <Tiles items={[
        { label: "Paid orders", value: paid.length },
        { label: "Credits sold", value: paid.reduce((s, p) => s + (p.credits || 0), 0).toLocaleString("en-IN") },
        { label: "Revenue", value: inr(revenue) },
        { label: "Buyers", value: new Set(paid.map((p) => p.user_id)).size },
      ]} />
      <Section title="By pack"><Breakdown head="Pack" rows={byPack} />{byPack.length === 0 && <Empty>No paid purchases yet.</Empty>}</Section>
      <Section title="Every purchase">
        <Chips value={status} onChange={setStatus} options={statuses.map(([s, n]) => ({ id: s, label: s, count: n }))} />
        <SearchBox value={q} onChange={setQ} placeholder="Search buyer, pack, coupon or referral" />
        <CapNotice n={data.length} />
        {rows.length === 0 ? <Empty>Nothing here.</Empty> : (
          <ByDay rows={rows} getTime={(p) => p.paid_at ?? p.created_at} total={(rs) => inr(rs.reduce((s, p) => s + (p.inr_amount || 0), 0))}
            render={(p) => (
              <RowCard key={p.id}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0"><Person id={p.user_id} labels={labels} /></div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">{inr(p.inr_amount)} <span className="text-xs font-normal text-muted-foreground">for {p.credits} credits</span></p>
                    <p className="text-xs text-muted-foreground">{when(p.paid_at ?? p.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <Badge variant="outline" className="text-[10px]">Pack {p.pack_id}</Badge>
                  <Badge variant="outline" className={`text-[10px] ${statusTone(p.status)}`}>{p.status}</Badge>
                  {p.coupon_code && <Badge variant="outline" className="text-[10px]">Coupon {p.coupon_code}</Badge>}
                  {p.ref_code && <Badge variant="outline" className="text-[10px]">Ref {p.ref_code}</Badge>}
                  {p.razorpay_payment_id && <span className="text-[10px] font-mono text-muted-foreground ml-auto">{p.razorpay_payment_id}</span>}
                </div>
              </RowCard>
            )} />
        )}
      </Section>
    </div>
  );
};

/* ---------- websites and cards ---------- */

interface Order {
  id: string; user_id: string; page_id: string; product_id: string; inr_amount: number; status: string;
  razorpay_payment_id: string | null; created_at: string; paid_at: string | null;
}
interface ProductLite { id: string; name: string; category: string }
interface PageLite { id: string; title: string; slug: string | null; status: string; views: number }

const OrdersView = ({ kind, profiles }: { kind: "websites" | "cards"; profiles: DrilldownProfile[] }) => {
  const labels = useUserLabels(profiles);
  const [status, setStatus] = useState("paid");
  const [q, setQ] = useState("");
  const { data, error } = useLoaded(async () => {
    const [o, p] = await Promise.all([
      supabase.from("ip_orders")
        .select("id, user_id, page_id, product_id, inr_amount, status, razorpay_payment_id, created_at, paid_at")
        .order("created_at", { ascending: false }).limit(ROW_CAP),
      supabase.from("ip_products").select("id, name, category"),
    ]);
    const orders = unwrap<Order[]>(o);
    const products = new Map(unwrap<ProductLite[]>(p).map((x) => [x.id, x]));
    // Same split the dashboard card uses, so the counts always agree.
    const mine = orders.filter((r) => (WEBSITE_CATEGORIES as readonly string[]).includes(products.get(r.product_id)?.category ?? "") === (kind === "websites"));
    const ids = [...new Set(mine.map((r) => r.page_id))];
    const pages = new Map<string, PageLite>();
    for (let i = 0; i < ids.length; i += 100) {
      const res = await supabase.from("ip_pages").select("id, title, slug, status, views").in("id", ids.slice(i, i + 100));
      unwrap<PageLite[]>(res).forEach((pg) => pages.set(pg.id, pg));
    }
    return { orders: mine, products, pages, fetched: orders.length };
  });

  const paid = useMemo(() => (data?.orders ?? []).filter((o) => o.status === "paid"), [data]);
  const statuses = useMemo(() => {
    const m = new Map<string, number>();
    (data?.orders ?? []).forEach((o) => m.set(o.status, (m.get(o.status) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => (a[0] === "paid" ? -1 : b[0] === "paid" ? 1 : b[1] - a[1]));
  }, [data]);
  const byProduct = useMemo(() => {
    const m = new Map<string, { count: number; amount: number }>();
    paid.forEach((o) => { const n = data?.products.get(o.product_id)?.name ?? o.product_id; const e = m.get(n) ?? { count: 0, amount: 0 }; e.count++; e.amount += o.inr_amount || 0; m.set(n, e); });
    return [...m.entries()].sort((a, b) => b[1].amount - a[1].amount).map(([label, v]) => ({ label, ...v }));
  }, [paid, data]);
  const byCategory = useMemo(() => {
    const m = new Map<string, { count: number; amount: number }>();
    paid.forEach((o) => { const c = data?.products.get(o.product_id)?.category ?? "unknown"; const e = m.get(c) ?? { count: 0, amount: 0 }; e.count++; e.amount += o.inr_amount || 0; m.set(c, e); });
    return [...m.entries()].sort((a, b) => b[1].amount - a[1].amount).map(([label, v]) => ({ label, ...v }));
  }, [paid, data]);

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.orders.filter((o) => o.status === status && (!needle || [labels.name(o.user_id), labels.email(o.user_id), data.products.get(o.product_id)?.name, data.pages.get(o.page_id)?.title].some((v) => v?.toLowerCase().includes(needle))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, status, q, profiles]);

  if (error) return <Empty>Could not load orders: {error}</Empty>;
  if (!data) return <Loading />;
  const revenue = paid.reduce((s, o) => s + (o.inr_amount || 0), 0);

  return (
    <div className="space-y-5">
      <Tiles items={[
        { label: "Paid orders", value: paid.length },
        { label: "Revenue", value: inr(revenue) },
        { label: "Average order", value: paid.length ? inr(revenue / paid.length) : "—" },
        { label: "Buyers", value: new Set(paid.map((o) => o.user_id)).size },
      ]} />
      <Section title="By design"><Breakdown head="Design" rows={byProduct} />{byProduct.length === 0 && <Empty>No paid orders yet.</Empty>}</Section>
      {byCategory.length > 1 && <Section title="By category"><Breakdown head="Category" rows={byCategory} /></Section>}
      <Section title="Every order">
        <Chips value={status} onChange={setStatus} options={statuses.map(([s, n]) => ({ id: s, label: s, count: n }))} />
        <SearchBox value={q} onChange={setQ} placeholder="Search buyer, design or page title" />
        <CapNotice n={data.fetched} />
        {rows.length === 0 ? <Empty>Nothing here.</Empty> : (
          <ByDay rows={rows} getTime={(o) => o.paid_at ?? o.created_at} total={(rs) => inr(rs.reduce((s, o) => s + (o.inr_amount || 0), 0))}
            render={(o) => {
              const product = data.products.get(o.product_id);
              const page = data.pages.get(o.page_id);
              return (
                <RowCard key={o.id}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0"><Person id={o.user_id} labels={labels} /></div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">{inr(o.inr_amount)}</p>
                      <p className="text-xs text-muted-foreground">{when(o.paid_at ?? o.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <Badge variant="outline" className="text-[10px]">{product?.name ?? o.product_id}</Badge>
                    {product && <Badge variant="outline" className="text-[10px] capitalize">{product.category}</Badge>}
                    <Badge variant="outline" className={`text-[10px] ${statusTone(o.status)}`}>{o.status}</Badge>
                    {o.razorpay_payment_id && <span className="text-[10px] font-mono text-muted-foreground ml-auto">{o.razorpay_payment_id}</span>}
                  </div>
                  {page && (
                    <div className="mt-2 pt-2 border-t border-border/60 flex items-center gap-2 text-xs">
                      <span className="truncate flex-1">Page: <span className="font-medium">{page.title || "Untitled"}</span> · {page.status} · {page.views} view{page.views === 1 ? "" : "s"}</span>
                      {page.slug && (
                        <a href={pageUrlFor(page.slug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline shrink-0">
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </RowCard>
              );
            }} />
        )}
      </Section>
    </div>
  );
};

/* ---------- today's logins ---------- */

interface DayLog { id: string; user_id: string; action_type: string; action_details: Record<string, unknown> | null; created_at: string }

const LoginsView = ({ profiles }: { profiles: DrilldownProfile[] }) => {
  const labels = useUserLabels(profiles);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const { data, error } = useLoaded(async () =>
    unwrap(await supabase.from("activity_logs").select("*")
      .gte("created_at", startOfToday().toISOString()).order("created_at", { ascending: false }).limit(5000)) as unknown as DayLog[]);

  const people = useMemo(() => {
    const m = new Map<string, DayLog[]>();
    (data ?? []).forEach((l) => m.set(l.user_id, [...(m.get(l.user_id) ?? []), l]));
    return [...m.entries()]
      .map(([id, logs]) => ({ id, logs, logins: logs.filter((l) => l.action_type === "login") }))
      .filter((p) => p.logins.length > 0)
      .sort((a, b) => +new Date(b.logins[0].created_at) - +new Date(a.logins[0].created_at));
  }, [data]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return people.filter((p) => !needle || labels.name(p.id).toLowerCase().includes(needle) || labels.email(p.id).toLowerCase().includes(needle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people, q, profiles]);

  if (error) return <Empty>Could not load activity: {error}</Empty>;
  if (!data) return <Loading />;
  const loginEvents = people.reduce((s, p) => s + p.logins.length, 0);
  const toggle = (id: string) => setOpen((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="space-y-5">
      <Tiles items={[
        { label: "Login events", value: loginEvents },
        { label: "People", value: people.length },
        { label: "Came back more than once", value: people.filter((p) => p.logins.length > 1).length },
        { label: "New signups today", value: data.filter((l) => l.action_type === "signup").length },
      ]} />
      <Section title="Who logged in">
        <SearchBox value={q} onChange={setQ} placeholder="Search person" />
        <CapNotice n={data.length} />
        {rows.length === 0 ? <Empty>No logins yet today.</Empty> : (
          <div className="space-y-1.5">
            {rows.map((p) => {
              const others = p.logs.filter((l) => l.action_type !== "login");
              const provider = (p.logins[0].action_details?.provider as string) || "email";
              const isOpen = open.has(p.id);
              return (
                <RowCard key={p.id}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0"><Person id={p.id} labels={labels} /></div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Last in {formatDistanceToNow(new Date(p.logins[0].created_at), { addSuffix: true })}</p>
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <Badge variant="outline" className="text-[10px] capitalize">{provider}</Badge>
                        <Badge variant="outline" className="text-[10px]">{p.logins.length} login{p.logins.length === 1 ? "" : "s"}</Badge>
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => toggle(p.id)} className="mt-2 text-xs text-primary hover:underline">
                    {isOpen ? "Hide" : "Show"} what they did today ({p.logs.length} event{p.logs.length === 1 ? "" : "s"}{others.length ? `, ${others.length} besides logging in` : ""})
                  </button>
                  {isOpen && (
                    <ol className="mt-2 pt-2 border-t border-border/60 space-y-1.5">
                      {[...p.logs].reverse().map((l) => {
                        const cfg = ACTION_CONFIG[l.action_type];
                        return (
                          <li key={l.id} className="flex items-center gap-2 text-xs">
                            <span className="w-16 shrink-0 text-muted-foreground">{format(new Date(l.created_at), "h:mm a")}</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg?.color ?? ""}`}>{cfg?.label ?? l.action_type}</Badge>
                            <span className="truncate">{getHumanDescription(l)}</span>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </RowCard>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
};

/* ---------- the drawer ---------- */

const StatDrilldown = ({ stat, onClose, profiles }: { stat: StatKey | null; onClose: () => void; profiles: DrilldownProfile[] }) => (
  <Sheet open={stat !== null} onOpenChange={(o) => { if (!o) onClose(); }}>
    <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
      {stat && (
        <>
          <SheetHeader className="mb-5 text-left">
            <SheetTitle>{TITLES[stat].title}</SheetTitle>
            <SheetDescription>{TITLES[stat].blurb}</SheetDescription>
          </SheetHeader>
          {/* key remounts the view so each card always opens fresh data */}
          {stat === "users" && <UsersView key={stat} profiles={profiles} />}
          {stat === "credits" && <CreditsView key={stat} profiles={profiles} />}
          {stat === "websites" && <OrdersView key={stat} kind="websites" profiles={profiles} />}
          {stat === "cards" && <OrdersView key={stat} kind="cards" profiles={profiles} />}
          {stat === "logins" && <LoginsView key={stat} profiles={profiles} />}
        </>
      )}
    </SheetContent>
  </Sheet>
);

export default StatDrilldown;
