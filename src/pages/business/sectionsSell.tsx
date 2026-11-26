/* Sections for selling: Today, orders, appointments, enquiries, customers, bills, dues and reminders. */

import { useMemo, useState } from "react";
import { CalendarPlus, Check, ChevronLeft, ChevronRight, Globe, HandCoins, Plus, ReceiptIndianRupee, ShoppingBag, TrendingUp, Truck, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/business/useBusiness";
import type { Db } from "@/business/engine";
import type { LeadStatus, OrderStatus, Rec } from "@/business/types";
import { acceptOrder, billBalance, list, orderTotal, setLeadStatus, setOrderStatus, setReminderStatus } from "@/business/engine";
import { customerStats, duesList, overview, payablesList, salesByDay, setupSteps } from "@/business/reports";
import { addDays, day, dayTime, inr, inrShort, plural, today } from "@/business/format";
import { texts } from "@/business/whatsapp";
import { cn } from "@/lib/utils";
import { DailySales } from "./charts";
import { Choice, Empty, Input, LinkTo, Panel, Pill, SectionHead, softBorder, softCard, Stat, UNBOUNDED, useNav, WaButton } from "./ui";
import { BillRows } from "./details";

const lower = (s: string) => s.toLowerCase();

/* ---------- Reminders, used on Today and in Reminders ---------- */

const KIND_TEXT: Record<string, string> = { pickup: "Pickup", dues: "Dues", lead: "Follow-up", appointment: "Visit", licence: "Renewal", stock: "Stock", birthday: "Birthday", custom: "Reminder" };

export function ReminderRow({ r }: { r: Rec<"reminder"> }) {
  const { run } = useBusiness();
  const nav = useNav();
  const d = r.data;
  const late = d.due_at < new Date().toISOString();
  const forOwner = !d.phone;
  const ref = d.ref_id;
  const link = () => {
    if (!ref) return null;
    const t = d.kind === "dues" ? "bill" : d.kind === "pickup" ? "order" : d.kind === "lead" ? "lead" : d.kind === "appointment" ? "appointment" : d.kind === "stock" ? undefined : d.kind === "birthday" ? "customer" : undefined;
    return t ? <LinkTo to={{ t, id: ref } as never} className="text-sm">Open</LinkTo> : null;
  };
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <Pill s={late ? "due" : "open"} label={KIND_TEXT[d.kind]} />
          <b>{d.to_name}</b>
          <span className="text-muted-foreground">{dayTime(d.due_at)}</span>
          {link()}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-ink/80">{d.text}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {forOwner ? (
          d.kind === "stock" ? <Button size="sm" variant="outline" onClick={() => nav.form({ kind: "purchase", preset: { item_id: ref } })}><Truck /> Buy</Button> : null
        ) : (
          <WaButton phone={d.phone} text={d.text} label="Send" onSent={() => run((db) => setReminderStatus(db, r.id, "sent"), { quiet: true })} />
        )}
        <Button size="sm" variant="outline" onClick={() => run((db) => setReminderStatus(db, r.id, "done"), { quiet: true })} aria-label="Done"><Check /></Button>
        <Button size="sm" variant="ghost" onClick={() => run((db) => setReminderStatus(db, r.id, "skipped"), { quiet: true })} aria-label="Skip"><X /></Button>
      </div>
    </li>
  );
}

/* ---------- Today ---------- */

export function Overview({ db }: { db: Db }) {
  const nav = useNav();
  const { run } = useBusiness();
  const s = db.ws.settings;
  const o = useMemo(() => overview(db.recs, s), [db.recs, s]);
  const chart = useMemo(() => salesByDay(db.recs, 14), [db.recs]);
  const steps = setupSteps(db.recs, s);
  const left = steps.filter((x) => !x.done);
  const booked = s.modules.includes("appointments");
  const hideKey = `ez-business-hide-setup-${db.ws.id}`;
  const [setupHidden, setSetupHidden] = useState(() => { try { return localStorage.getItem(hideKey) === "1"; } catch { return false; } });
  const hideSetup = () => { setSetupHidden(true); try { localStorage.setItem(hideKey, "1"); } catch { /* storage unavailable */ } };
  const actions: [string, () => void, JSX.Element][] = [
    [booked ? `Book ${lower(s.labels.order)}` : `New ${lower(s.labels.order)}`, () => nav.form({ kind: booked ? "appointment" : "order" }), booked ? <CalendarPlus /> : <ShoppingBag />],
    ["New bill", () => nav.form({ kind: "sale" }), <ReceiptIndianRupee />],
    ["Got paid", () => nav.form({ kind: "payment" }), <Wallet />],
    ["Spent money", () => nav.form({ kind: "expense" }), <Wallet />],
  ];
  const done = steps.length - left.length;
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;
  const QUICK_TONES = ["bg-[#F472D0]/15 text-[#F472D0]", "bg-[#C8E967]/25 text-[#5c7a1a]", "bg-emerald-500/15 text-emerald-600", "bg-amber-500/15 text-amber-600"];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 style={UNBOUNDED} className="text-2xl font-bold tracking-tight sm:text-3xl">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}{s.owner_name ? `, ${s.owner_name.split(" ")[0]}` : ""}
          </h2>
          <p className="mt-1 text-muted-foreground">{day(today())} · {db.ws.name}</p>
        </div>
      </div>

      {left.length > 0 && !setupHidden && (
        <Panel focal>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="font-bold">Finish setting up</p>
              <span className="inline-flex items-center rounded-full border border-black/15 bg-[#C8E967] px-2 py-0.5 text-xs font-bold text-[#111111] dark:border-white/15">{done} of {steps.length} done</span>
            </div>
            <button type="button" onClick={hideSetup} className="shrink-0 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline">Hide</button>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F3F4F6] dark:bg-[#1F1F24]"><div className="h-full rounded-full bg-[#111111] transition-[width] dark:bg-[#C8E967]" style={{ width: `${pct}%` }} /></div>
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
            {steps.map((x) => (
              <li key={x.id} className={cn("flex items-center gap-2 text-sm", x.done && "text-ink/50 line-through")}>
                <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px]", x.done ? "border-black/15 bg-[#C8E967]" : "border-black/15 bg-white dark:border-white/15 dark:bg-[#16161A]")}>{x.done ? "✓" : ""}</span>
                {x.done ? <span>{x.text}</span> : (
                  <button type="button" className="-mx-1 flex flex-1 items-center justify-between gap-2 rounded-xl px-1 py-1 text-left transition-colors hover:bg-[#FAF7F2] dark:hover:bg-white/5" onClick={() => nav.go(x.id === "items" || x.id === "gst" ? "stock" : x.id === "first" ? "bills" : x.id === "site" ? "website" : "settings")}>
                    <span>{x.text}</span><span aria-hidden className="text-muted-foreground">→</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {o.website.length > 0 && (
        <Panel tone="bg-pink">
          <p className="flex items-center gap-2 font-bold"><Globe className="h-5 w-5" /> {plural(o.website.length, "new order")} from your website</p>
          <ul className="mt-2 divide-y divide-ink/15">
            {o.website.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><LinkTo to={{ t: "order", id: w.id }}>{w.data.customer_name}</LinkTo> · {w.data.items.map((i) => `${i.name} × ${i.qty}`).join(", ")} · {inr(orderTotal(db.recs, s, w))}</span>
                <Button size="sm" variant="outline" onClick={() => run((x) => acceptOrder(x, w.id))}><Check /> Accept</Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sales today" value={inrShort(o.salesToday)} hint={`Billed today · ${plural(o.billsToday, "bill")}`} onClick={() => nav.go("bills")} icon={<ReceiptIndianRupee className="h-4 w-4" />} iconTone="bg-[#F472D0]/15 text-[#F472D0]" />
        <Stat label="Money in today" value={inrShort(o.collectedToday)} hint="Cash & UPI received" onClick={() => nav.go("money")} icon={<Wallet className="h-4 w-4" />} iconTone="bg-[#C8E967]/25 text-[#5c7a1a]" />
        <Stat label="To collect" value={inrShort(o.duesTotal)} hint={plural(o.duesPeople, "person", "people")} tone={o.duesTotal > 0 ? "bg-coral" : undefined} onClick={() => nav.go("dues")} icon={<HandCoins className="h-4 w-4" />} iconTone="bg-amber-500/15 text-amber-600" />
        <Stat label="Profit this month" value={inrShort(o.monthProfit)} hint={`on sales of ${inrShort(o.monthSales)}`} onClick={() => nav.go("money")} icon={<TrendingUp className="h-4 w-4" />} iconTone="bg-sky-500/15 text-sky-600" />
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick actions</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {actions.map(([label, fn, icon], i) => (
            <button
              key={label}
              type="button"
              onClick={fn}
              className={cn("flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 text-left text-sm font-semibold transition-colors hover:border-[#111111] dark:bg-[#16161A] dark:hover:border-white/40", softBorder)}
            >
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full [&_svg]:h-4 [&_svg]:w-4", QUICK_TONES[i % QUICK_TONES.length])}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("grid gap-4", s.modules.includes("leads") ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
        <Panel className="flex h-full flex-col justify-between">
          <div>
            <div className="flex items-center justify-between"><h3 className="font-bold">To do today</h3><button type="button" className="text-sm underline" onClick={() => nav.go("reminders")}>All reminders</button></div>
            {o.reminders.length ? <ul className="divide-y divide-black/10 dark:divide-white/10">{o.reminders.slice(0, 8).map((r) => <ReminderRow key={r.id} r={r} />)}</ul> : (
              <p className="mt-2 text-sm text-muted-foreground">Nothing waiting. Reminders appear here by themselves when something is due.</p>
            )}
          </div>
          {!o.reminders.length && (
            <button type="button" onClick={() => nav.form({ kind: "reminder" })} className="mt-4 self-start rounded-full border border-black/15 px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-[#111111] hover:text-white dark:border-white/15 dark:hover:bg-white dark:hover:text-[#111111]"><Plus className="mr-1 inline h-4 w-4" /> Add reminder</button>
          )}
        </Panel>
        {booked ? (
          <Panel className="flex h-full flex-col justify-between">
            <div>
              <h3 className="font-bold">Today's {lower(s.labels.orders)}</h3>
              {o.appts.length ? <ul className="mt-1 divide-y divide-black/10 dark:divide-white/10">{o.appts.map((a) => <li key={a.id} className="flex justify-between gap-2 py-2 text-sm"><LinkTo to={{ t: "appointment", id: a.id }}>{new Date(a.data.start_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} {a.data.customer_name}</LinkTo><span>{a.data.service}</span></li>)}</ul> : (
                <p className="mt-2 text-sm text-muted-foreground">None booked for today.</p>
              )}
            </div>
            {!o.appts.length && <button type="button" onClick={() => nav.form({ kind: "appointment" })} className="mt-4 self-start rounded-full border border-black/15 px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-[#111111] hover:text-white dark:border-white/15 dark:hover:bg-white dark:hover:text-[#111111]"><Plus className="mr-1 inline h-4 w-4" /> Book {lower(s.labels.order)}</button>}
          </Panel>
        ) : (
          <Panel className="flex h-full flex-col justify-between">
            <div>
              <h3 className="font-bold">Due today or late</h3>
              {o.dueToday.length ? <ul className="mt-1 divide-y divide-black/10 dark:divide-white/10">{o.dueToday.map((x) => <li key={x.id} className="flex items-center justify-between gap-2 py-2 text-sm"><span><LinkTo to={{ t: "order", id: x.id }}>{x.data.number}</LinkTo> {x.data.customer_name} · {dayTime(x.data.due_at)}</span><Pill s={x.data.status} /></li>)}</ul> : (
                <p className="mt-2 text-sm text-muted-foreground">Nothing due. {plural(o.openOrders, "open order")} in all.</p>
              )}
            </div>
            {!o.dueToday.length && <button type="button" onClick={() => nav.form({ kind: "order" })} className="mt-4 self-start rounded-full border border-black/15 px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-[#111111] hover:text-white dark:border-white/15 dark:hover:bg-white dark:hover:text-[#111111]"><Plus className="mr-1 inline h-4 w-4" /> New {lower(s.labels.order)}</button>}
          </Panel>
        )}
        {s.modules.includes("leads") && (
          <Panel className="flex h-full flex-col justify-between">
            <div>
              <h3 className="font-bold">Open enquiries</h3>
              {o.leadsOpen ? (
                <div className="mt-2">
                  <p style={UNBOUNDED} className="text-2xl font-bold tabular-nums">{o.leadsOpen}</p>
                  {o.leadsValue ? <p className="text-sm text-muted-foreground">worth about {inrShort(o.leadsValue)}</p> : null}
                </div>
              ) : <p className="mt-2 text-sm text-muted-foreground">No open enquiries right now.</p>}
            </div>
            {o.leadsOpen ? (
              <button type="button" onClick={() => nav.go("leads")} className="mt-4 self-start rounded-full border border-black/15 px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-[#111111] hover:text-white dark:border-white/15 dark:hover:bg-white dark:hover:text-[#111111]">See all</button>
            ) : (
              <button type="button" onClick={() => nav.form({ kind: "lead" })} className="mt-4 self-start rounded-full border border-black/15 px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-[#111111] hover:text-white dark:border-white/15 dark:hover:bg-white dark:hover:text-[#111111]"><Plus className="mr-1 inline h-4 w-4" /> New enquiry</button>
            )}
          </Panel>
        )}
      </div>

      {o.low.length > 0 && (
        <Panel tone="bg-coral/30">
          <h3 className="font-bold">Running low</h3>
          <ul className="mt-1 space-y-1 text-sm">{o.low.map((x) => <li key={x.id} className="flex justify-between"><LinkTo to={{ t: x.kind, id: x.id }}>{x.name}</LinkTo><span>{x.qty} {x.unit} left</span></li>)}</ul>
        </Panel>
      )}

      <Panel>
        <h3 className="mb-2 font-bold">Sales, last 14 days</h3>
        {chart.some((d) => d.sales > 0) ? <DailySales data={chart} /> : (
          <div className="flex flex-col items-start gap-3">
            <div aria-hidden className="flex h-24 w-full items-end gap-1.5">
              {[30, 55, 40, 70, 45, 60, 35, 50, 65, 40, 55, 30, 45, 60].map((h, i) => <div key={i} className="flex-1 rounded-t-md bg-black/[0.06] dark:bg-white/10" style={{ height: `${h}%` }} />)}
            </div>
            <p className="text-sm text-muted-foreground">Your sales show here once you make bills.</p>
            <button type="button" onClick={() => nav.form({ kind: "sale" })} className="rounded-full border-[1.5px] border-[#111111] bg-[#F472D0] px-5 py-2 text-sm font-semibold text-[#111111] shadow-[3px_3px_0_#111111] transition-transform hover:-translate-y-0.5"><Plus className="mr-1 inline h-4 w-4" /> Create your first bill</button>
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ---------- Orders ---------- */

const ORDER_TABS: [string, string][] = [["open", "Open"], ["new", "New"], ["making", "Making"], ["ready", "Ready"], ["delivered", "Delivered"], ["cancelled", "Cancelled"], ["all", "All"]];

export function Orders({ db }: { db: Db }) {
  const nav = useNav();
  const { run } = useBusiness();
  const s = db.ws.settings;
  const [tab, setTab] = useState("open");
  const [q, setQ] = useState("");
  const rows = list(db.recs, "order")
    .filter((o) => (tab === "all" ? true : tab === "open" ? !["delivered", "cancelled"].includes(o.data.status) : o.data.status === tab))
    .filter((o) => !q || lower(`${o.data.number} ${o.data.customer_name} ${o.data.phone ?? ""} ${o.data.items.map((i) => i.name).join(" ")}`).includes(lower(q)))
    .sort((a, b) => (a.data.due_at ?? "9").localeCompare(b.data.due_at ?? "9") || b.created_at.localeCompare(a.created_at));
  const next: Partial<Record<OrderStatus, [OrderStatus, string]>> = { new: ["making", "Start"], making: ["ready", "Ready"], ready: ["delivered", "Delivered"] };
  return (
    <div>
      <SectionHead title={s.labels.orders} sub="Each one has its bill, advance, stock and reminder. Move it along and the customer messages are ready.">
        <Button onClick={() => nav.form({ kind: "order" })}><Plus /> New {lower(s.labels.order)}</Button>
      </SectionHead>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Choice value={tab} onChange={setTab} options={ORDER_TABS as [string, string][]} />
        <Input className="h-10 max-w-xs" placeholder="Search name, number, item" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {!rows.length ? <Empty title={`No ${lower(s.labels.orders)} here`} text="New ones you take, and ones from your website, show up here." action={<Button onClick={() => nav.form({ kind: "order" })}><Plus /> New {lower(s.labels.order)}</Button>} /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((o) => {
            const bill = list(db.recs, "bill").find((b) => b.id === o.data.bill_id);
            const bal = bill ? billBalance(db.recs, bill) : 0;
            const late = o.data.due_at && o.data.due_at < new Date().toISOString() && !["delivered", "cancelled"].includes(o.data.status);
            const n = next[o.data.status];
            const pending = o.data.source === "website" && !o.data.bill_id && o.data.status !== "cancelled";
            return (
              <Panel key={o.id} className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <LinkTo to={{ t: "order", id: o.id }} className="font-display text-lg">{o.data.number}</LinkTo>
                    <p className="text-sm">{o.data.customer_id ? <LinkTo to={{ t: "customer", id: o.data.customer_id }}>{o.data.customer_name}</LinkTo> : o.data.customer_name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1"><Pill s={o.data.status} />{pending && <Pill s="sent" label="Website" />}</div>
                </div>
                <p className="line-clamp-2 text-sm text-ink/80">{o.data.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className={cn(late && "font-bold text-destructive")}>{o.data.due_at ? `${late ? "Late: " : "By "}${dayTime(o.data.due_at)}` : "No date"}</span>
                  <span className="tabular-nums">{inr(orderTotal(db.recs, s, o))}{bal > 0 && <b className="text-destructive"> · {inr(bal)} due</b>}</span>
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  {pending ? <Button size="sm" onClick={() => run((x) => acceptOrder(x, o.id))}><Check /> Accept</Button>
                    : n && <Button size="sm" onClick={() => run((x) => setOrderStatus(x, o.id, n[0]))}>{n[1]}</Button>}
                  {o.data.status === "ready" && <WaButton phone={o.data.phone} text={texts.ready(s, db.ws.name, o.data, bal)} label="Tell them" />}
                  {bill && bal > 0 && o.data.status !== "cancelled" && <Button size="sm" variant="outline" onClick={() => nav.form({ kind: "payment", preset: { bill_id: bill.id } })}><Wallet /> Paid</Button>}
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Appointments ---------- */

export function Appointments({ db }: { db: Db }) {
  const nav = useNav();
  const s = db.ws.settings;
  const [date, setDate] = useState(today());
  const staff = list(db.recs, "staff").filter((x) => x.data.active);
  const appts = list(db.recs, "appointment").filter((a) => today(new Date(a.data.start_at)) === date).sort((a, b) => a.data.start_at.localeCompare(b.data.start_at));
  const hours = [...new Set([...Array.from({ length: 14 }, (_, i) => i + 8), ...appts.map((a) => new Date(a.data.start_at).getHours())])].sort((a, b) => a - b);
  const done = appts.filter((a) => a.data.status === "done");
  return (
    <div>
      <SectionHead title={s.labels.orders} sub="Book, move and finish. Each one gets a reminder for them, and a bill when done.">
        <Button onClick={() => nav.form({ kind: "appointment", preset: { start: `${date}T10:00` } })}><Plus /> Book</Button>
      </SectionHead>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button size="icon" variant="outline" onClick={() => setDate(addDays(date, -1))} aria-label="Day before"><ChevronLeft /></Button>
        <Input type="date" className="h-10 w-44" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button size="icon" variant="outline" onClick={() => setDate(addDays(date, 1))} aria-label="Next day"><ChevronRight /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDate(today())}>Today</Button>
        <span className="ml-auto text-sm">{plural(appts.filter((a) => a.data.status !== "cancelled").length, "booking")} · done {inr(done.reduce((a, x) => a + x.data.price, 0))}</span>
      </div>
      <Panel className="p-0 sm:p-0">
        <ul className="divide-y divide-ink/10">
          {hours.map((h) => {
            const at = appts.filter((a) => new Date(a.data.start_at).getHours() === h);
            return (
              <li key={h} className="flex min-h-[56px] gap-3 px-3 py-2">
                <button type="button" className="w-14 shrink-0 pt-1 text-left text-sm font-semibold text-muted-foreground hover:text-ink" onClick={() => nav.form({ kind: "appointment", preset: { start: `${date}T${String(h).padStart(2, "0")}:00` } })} title="Book at this time">
                  {new Date(2000, 0, 1, h).toLocaleTimeString("en-IN", { hour: "numeric" })}
                </button>
                <div className="flex flex-1 flex-wrap gap-2">
                  {at.map((a) => (
                    <button key={a.id} type="button" onClick={() => nav.open({ t: "appointment", id: a.id })} className={cn("rounded-xl border border-black/15 px-3 py-1.5 text-left text-sm dark:border-white/15", a.data.status === "done" ? "bg-lime" : a.data.status === "booked" ? "bg-sky" : "bg-muted line-through")}>
                      <b>{new Date(a.data.start_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} {a.data.customer_name}</b>
                      <span className="block text-xs">{a.data.service} · {a.data.duration_min} min{a.data.staff_id ? ` · ${staff.find((x) => x.id === a.data.staff_id)?.data.name ?? ""}` : ""}</span>
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

/* ---------- Leads ---------- */

const STAGES: [LeadStatus, string, string][] = [["new", "New", "bg-sky"], ["talking", "Talking", "bg-sun"], ["quoted", "Quote sent", "bg-pink"], ["won", "Won", "bg-lime"], ["lost", "Lost", "bg-muted"]];

export function Leads({ db }: { db: Db }) {
  const nav = useNav();
  const { run } = useBusiness();
  const s = db.ws.settings;
  const leads = list(db.recs, "lead").sort((a, b) => b.created_at.localeCompare(a.created_at));
  const won = leads.filter((l) => l.data.status === "won").length;
  const closed = leads.filter((l) => ["won", "lost"].includes(l.data.status)).length;
  return (
    <div>
      <SectionHead title="Enquiries" sub={`People who asked but have not bought yet. Follow-ups come by themselves.${closed ? ` You win ${Math.round((won / closed) * 100)}% of them.` : ""}`}>
        <Button onClick={() => nav.form({ kind: "lead" })}><Plus /> New enquiry</Button>
      </SectionHead>
      {!leads.length ? <Empty title="No enquiries yet" text="Add people who call, message or walk in asking. Website enquiries land here too." action={<Button onClick={() => nav.form({ kind: "lead" })}><Plus /> New enquiry</Button>} /> : (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
          {STAGES.map(([st, label, tone]) => {
            const col = leads.filter((l) => l.data.status === st);
            return (
              <div key={st} className="w-[78vw] max-w-[300px] shrink-0 snap-start lg:w-auto lg:max-w-none">
                <div className={cn("mb-2 flex items-center justify-between rounded-xl border border-black/15 px-3 py-1.5 font-bold dark:border-white/15", tone)}><span>{label}</span><span className="text-sm">{col.length}{col.some((l) => l.data.value) ? ` · ${inrShort(col.reduce((a, l) => a + (l.data.value ?? 0), 0))}` : ""}</span></div>
                <div className="space-y-2">
                  {col.map((l) => (
                    <div key={l.id} className={cn("rounded-xl p-3", softCard)}>
                      <LinkTo to={{ t: "lead", id: l.id }}>{l.data.name}</LinkTo>
                      <p className="text-sm text-ink/80">{l.data.want}</p>
                      <p className="text-xs text-muted-foreground">{l.data.source} · {day(l.created_at)}{l.data.value ? ` · ${inr(l.data.value)}` : ""}</p>
                      {st !== "won" && st !== "lost" && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <WaButton phone={l.data.phone} text={texts.lead(s, db.ws.name, l.data.name, l.data.want)} label="Follow up" />
                          {STAGES.filter(([x]) => x !== st && x !== "won").slice(0, 2).map(([x, lab]) => <Button key={x} size="sm" variant="ghost" onClick={() => run((d) => setLeadStatus(d, l.id, x))}>{lab}</Button>)}
                          <Button size="sm" variant="outline" onClick={() => nav.form({ kind: s.modules.includes("appointments") ? "appointment" : "order", preset: { lead_id: l.id } })}>Won</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Customers ---------- */

export function Customers({ db }: { db: Db }) {
  const nav = useNav();
  const s = db.ws.settings;
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "spent" | "due" | "name">("recent");
  const stats = useMemo(() => customerStats(db.recs), [db.recs]);
  const rows = list(db.recs, "customer")
    .filter((c) => !q || lower(`${c.data.name} ${c.data.phone ?? ""}`).includes(lower(q)))
    .map((c) => ({ c, st: stats.get(c.id) ?? { spent: 0, visits: 0, last: "", due: 0 } }))
    .sort((a, b) => sort === "spent" ? b.st.spent - a.st.spent : sort === "due" ? b.st.due - a.st.due : sort === "name" ? a.c.data.name.localeCompare(b.c.data.name) : (b.st.last || b.c.created_at).localeCompare(a.st.last || a.c.created_at));
  return (
    <div>
      <SectionHead title={s.labels.customers} sub="Everyone you have billed is added by themselves, with what they spent and what they owe.">
        <Button onClick={() => nav.form({ kind: "customer" })}><Plus /> Add</Button>
      </SectionHead>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input className="h-10 max-w-xs" placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <Choice value={sort} onChange={setSort} options={[["recent", "Recent"], ["spent", "Top spenders"], ["due", "Owe most"], ["name", "A to Z"]]} />
      </div>
      {!rows.length ? <Empty title={`No ${lower(s.labels.customers)} yet`} text="They are added when you make a bill or take an order with a name." /> : (
        <Panel className="overflow-x-auto p-0 sm:p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-black/10 bg-black/[0.02] text-left dark:border-white/10 dark:bg-white/[0.03]"><tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3 text-right">Visits</th><th className="p-3 text-right">Spent</th><th className="p-3 text-right">Owes</th><th className="hidden p-3 sm:table-cell">Last</th></tr></thead>
            <tbody className="divide-y divide-ink/10">
              {rows.map(({ c, st }) => (
                <tr key={c.id} className="hover:bg-sun/30">
                  <td className="p-3"><LinkTo to={{ t: "customer", id: c.id }}>{c.data.name}</LinkTo></td>
                  <td className="p-3">{c.data.phone}</td>
                  <td className="p-3 text-right tabular-nums">{st.visits}</td>
                  <td className="p-3 text-right tabular-nums">{inr(st.spent)}</td>
                  <td className={cn("p-3 text-right tabular-nums", st.due > 0 && "font-bold text-destructive")}>{st.due > 0 ? inr(st.due) : "—"}</td>
                  <td className="hidden p-3 sm:table-cell">{day(st.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}

/* ---------- Bills ---------- */

export function Bills({ db }: { db: Db }) {
  const nav = useNav();
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(addDays(today(), -30));
  const [to, setTo] = useState(today());
  const [state, setState] = useState("all");
  const bills = list(db.recs, "bill")
    .filter((b) => b.data.date >= from && b.data.date <= to)
    .filter((b) => !q || lower(`${b.data.number} ${b.data.customer_name}`).includes(lower(q)))
    .filter((b) => state === "all" || (state === "unpaid" ? !b.data.cancelled && billBalance(db.recs, b) > 0.5 : state === "cancelled" ? b.data.cancelled : !b.data.cancelled && billBalance(db.recs, b) <= 0.5))
    .sort((a, b) => b.data.date.localeCompare(a.data.date) || b.data.number.localeCompare(a.data.number));
  const total = bills.filter((b) => !b.data.cancelled).reduce((a, b) => a + b.data.total, 0);
  return (
    <div>
      <SectionHead title="Bills" sub={`Every bill, numbered in order. ${db.ws.settings.gst_mode === "composition" ? "As a composition business your bills are bills of supply, with no tax on them." : db.ws.settings.gst_mode === "regular" ? "Tax invoices with GST worked out per item." : ""}`}>
        <Button onClick={() => nav.form({ kind: "sale" })}><Plus /> New bill</Button>
      </SectionHead>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input type="date" className="h-10 w-40" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
        <span>to</span>
        <Input type="date" className="h-10 w-40" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
        <Input className="h-10 max-w-[200px]" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <Choice value={state} onChange={setState} options={[["all", "All"], ["unpaid", "Unpaid"], ["paid", "Paid"], ["cancelled", "Cancelled"]]} />
      </div>
      <p className="mb-2 text-sm font-semibold">{plural(bills.length, "bill")} · {inr(total)}</p>
      {bills.length ? <Panel><BillRows recs={db.recs} bills={bills} /></Panel> : <Empty title="No bills in these dates" action={<Button onClick={() => nav.form({ kind: "sale" })}><Plus /> New bill</Button>} />}
    </div>
  );
}

/* ---------- Dues ---------- */

export function Dues({ db }: { db: Db }) {
  const nav = useNav();
  const s = db.ws.settings;
  const dues = useMemo(() => duesList(db.recs), [db.recs]);
  const pay = useMemo(() => payablesList(db.recs), [db.recs]);
  const total = dues.reduce((a, d) => a + d.amount, 0);
  const aged = (min: number, max: number) => dues.filter((d) => d.days >= min && d.days <= max).reduce((a, d) => a + d.amount, 0);
  return (
    <div className="space-y-6">
      <SectionHead title="Money to collect" sub="Udhaar and unpaid bills. Reminders go on day 3 and 7 after delivery; send any time from here.">
        <Button onClick={() => nav.form({ kind: "payment" })}><Wallet /> Got paid</Button>
      </SectionHead>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="To collect" value={inrShort(total)} tone="bg-coral" />
        <Stat label="Under a week" value={inrShort(aged(0, 7))} />
        <Stat label="1 to 4 weeks" value={inrShort(aged(8, 30))} />
        <Stat label="Over a month" value={inrShort(aged(31, 100000))} tone={aged(31, 100000) > 0 ? "bg-sun" : "bg-card"} />
      </div>
      {!dues.length ? <Empty title="Nobody owes you money" text="Bills that are not fully paid show up here." /> : (
        <Panel className="p-0 sm:p-0">
          <ul className="divide-y divide-ink/10">
            {dues.map((d) => (
              <li key={d.customer_id ?? d.name} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p>{d.customer_id ? <LinkTo to={{ t: "customer", id: d.customer_id }}>{d.name}</LinkTo> : d.name} <span className="text-sm text-muted-foreground">· oldest {d.days} days</span></p>
                  <p className="text-sm">{d.bills.map((b, i) => <span key={b.id}>{i > 0 && ", "}<LinkTo to={{ t: "bill", id: b.id }} className="font-normal">{b.number}</LinkTo> {inr(b.balance)}</span>)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <b className="mr-2 text-lg tabular-nums text-destructive">{inr(d.amount)}</b>
                  <WaButton phone={d.phone} text={texts.dues(s, db.ws.name, d.name, d.amount)} label="Remind" />
                  {d.customer_id && <Button size="sm" variant="outline" onClick={() => nav.form({ kind: "payment", preset: { customer_id: d.customer_id } })}>Paid</Button>}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {s.modules.includes("purchases") && (
        <>
          <h3 className="font-display text-xl font-bold">You owe suppliers</h3>
          {!pay.length ? <p className="text-sm text-muted-foreground">Nothing owed.</p> : (
            <Panel className="p-0 sm:p-0">
              <ul className="divide-y divide-ink/10">{pay.map((p) => <li key={p.id} className="flex items-center justify-between gap-2 p-4"><LinkTo to={{ t: "supplier", id: p.id }}>{p.name}</LinkTo><span className="flex items-center gap-2"><b className="tabular-nums">{inr(p.amount)}</b><Button size="sm" variant="outline" onClick={() => nav.form({ kind: "supplier_payment", preset: { supplier_id: p.id } })}>Pay</Button></span></li>)}</ul>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Reminders ---------- */

export function Reminders({ db }: { db: Db }) {
  const nav = useNav();
  const [tab, setTab] = useState<"open" | "later" | "closed">("open");
  const end = new Date(`${today()}T23:59:59.999`).toISOString();
  const all = list(db.recs, "reminder").sort((a, b) => a.data.due_at.localeCompare(b.data.due_at));
  const rows = tab === "open" ? all.filter((r) => r.data.status === "open" && r.data.due_at <= end)
    : tab === "later" ? all.filter((r) => r.data.status === "open" && r.data.due_at > end)
    : all.filter((r) => r.data.status !== "open").reverse().slice(0, 100);
  return (
    <div>
      <SectionHead title="Reminders" sub="Made by themselves: pickups, dues, follow-ups, visits, birthdays, low stock and renewals. Tap Send and WhatsApp opens with the message ready.">
        <Button variant="outline" onClick={() => nav.form({ kind: "reminder" })}><Plus /> Add</Button>
      </SectionHead>
      <Choice value={tab} onChange={setTab} options={[["open", `Today and late (${all.filter((r) => r.data.status === "open" && r.data.due_at <= end).length})`], ["later", "Coming up"], ["closed", "Sent and done"]]} className="mb-4" />
      {rows.length ? <Panel><ul className="divide-y divide-ink/10">{rows.map((r) => <ReminderRow key={r.id} r={r} />)}</ul></Panel> : <Empty title="Nothing here" text="When you take an order, make a bill with money left, or add an enquiry, reminders are set for you." />}
    </div>
  );
}

