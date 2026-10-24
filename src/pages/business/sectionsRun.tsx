/* Sections for running the business: stock, purchases, money, taxes, staff, marketing, website, reports, settings. */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, Download, ExternalLink, Plus, Truck, Upload, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useBusiness } from "@/business/useBusiness";
import type { Db } from "@/business/engine";
import type { AttendanceMark, ModuleId, PayMode, Settings } from "@/business/types";
import { campaignAudience, list, markAttendance, markCampaignSent, staffMonth, updateSettings, removeRecord, slugify } from "@/business/engine";
import { canMake, cashBook, gstMonth, gstQuarter, pnl, salesByMonth, stockList, topCustomers, topProducts } from "@/business/reports";
import { bizType } from "@/business/catalog";
import { STATES, validGstin } from "@/business/gst";
import { addDays, day, download, inr, inrShort, monthName, num, plural, toCsv, today } from "@/business/format";
import { waLink } from "@/business/whatsapp";
import { cn } from "@/lib/utils";
import { MonthlyInOut } from "./charts";
import { Choice, Empty, Field, LinkTo, PAY_MODES, Panel, Pill, SectionHead, selectCls, Stat, useNav, WaButton } from "./ui";
import { MODULE_NAMES } from "./modules";
import { SiteView } from "./PublicSite";

const monthStart = (d = today()) => `${d.slice(0, 7)}-01`;
const monthEnd = (m: string) => { const [y, mo] = m.split("-").map(Number); return new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10); };

function Period({ from, to, set }: { from: string; to: string; set: (f: string, t: string) => void }) {
  const t = today();
  const lastM = addDays(monthStart(), -1);
  const presets: [string, string, string][] = [["This month", monthStart(), t], ["Last month", monthStart(lastM), lastM], ["Last 7 days", addDays(t, -6), t], ["This year", `${Number(t.slice(5, 7)) >= 4 ? t.slice(0, 4) : Number(t.slice(0, 4)) - 1}-04-01`, t]];
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {presets.map(([l, f, e]) => <button key={l} type="button" onClick={() => set(f, e)} className={cn("rounded-full border-2 border-ink px-3 py-1.5 text-sm font-semibold", from === f && to === e ? "bg-ink text-cream" : "bg-card hover:bg-sun")}>{l}</button>)}
      <Input type="date" className="h-9 w-40" value={from} onChange={(e) => set(e.target.value, to)} aria-label="From" />
      <Input type="date" className="h-9 w-40" value={to} onChange={(e) => set(from, e.target.value)} aria-label="To" />
    </div>
  );
}

/* ---------- Stock ---------- */

export function Stock({ db }: { db: Db }) {
  const nav = useNav();
  const s = db.ws.settings;
  const [tab, setTab] = useState<"items" | "materials">("items");
  const st = useMemo(() => stockList(db.recs), [db.recs]);
  const level = new Map(st.items.map((x) => [x.id, x]));
  const products = list(db.recs, "product").sort((a, b) => Number(b.data.active) - Number(a.data.active) || a.data.name.localeCompare(b.data.name));
  const mats = list(db.recs, "material").sort((a, b) => a.data.name.localeCompare(b.data.name));
  const noRate = s.gst_mode === "regular" ? products.filter((p) => p.data.active && !p.data.gst_rate) : [];
  return (
    <div className="space-y-5">
      <SectionHead title={`${s.labels.products} and stock`} sub="Prices you sell at, what is on the shelf, and what each item is made from. Sales take stock by themselves.">
        <Button onClick={() => nav.form({ kind: "product" })}><Plus /> {s.labels.product}</Button>
        <Button variant="outline" onClick={() => nav.form({ kind: "material" })}><Plus /> Raw material</Button>
        {s.modules.includes("purchases") && <Button variant="outline" onClick={() => nav.form({ kind: "purchase" })}><Truck /> Bought stock</Button>}
      </SectionHead>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={s.labels.products} value={products.filter((p) => p.data.active).length} />
        <Stat label="Raw materials" value={mats.length} />
        <Stat label="Running low" value={st.low.length} tone={st.low.length ? "bg-coral" : "bg-card"} />
        <Stat label="Stock value (at cost)" value={inrShort(st.value)} />
      </div>
      {noRate.length > 0 && <Panel tone="bg-sun"><p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5" /> {plural(noRate.length, "item")} without a GST rate. Bills charge 0% on them until you set it.</p></Panel>}
      <Choice value={tab} onChange={setTab} options={[["items", s.labels.products], ["materials", "Raw materials"]]} />
      {tab === "items" ? (
        !products.length ? <Empty title={`No ${s.labels.products.toLowerCase()} yet`} action={<Button onClick={() => nav.form({ kind: "product" })}><Plus /> Add</Button>} /> : (
          <Panel className="overflow-x-auto p-0 sm:p-0">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-ink bg-sand text-left"><tr><th className="p-3">Name</th><th className="p-3 text-right">Price</th>{s.gst_mode === "regular" && <th className="p-3 text-right">GST</th>}<th className="p-3 text-right">Stock</th><th className="hidden p-3 sm:table-cell">On website</th></tr></thead>
              <tbody className="divide-y divide-ink/10">
                {products.map((p) => {
                  const l = level.get(p.id);
                  const make = p.data.stock_mode === "recipe" ? canMake(db.recs, p.id) : null;
                  return (
                    <tr key={p.id} className={cn("hover:bg-sun/30", !p.data.active && "opacity-50")}>
                      <td className="p-3"><LinkTo to={{ t: "product", id: p.id }}>{p.data.name}</LinkTo><span className="block text-xs text-muted-foreground">{p.data.type === "service" ? "Service" : `per ${p.data.unit}`}</span></td>
                      <td className="p-3 text-right tabular-nums">{inr(p.data.price)}</td>
                      {s.gst_mode === "regular" && <td className={cn("p-3 text-right", !p.data.gst_rate && "font-bold text-destructive")}>{p.data.gst_rate}%</td>}
                      <td className="p-3 text-right">{l ? <span className={cn("tabular-nums", l.low && "font-bold text-destructive")}>{num(l.qty)} {p.data.unit}</span> : make !== null ? <span className="text-xs">can make {make}</span> : <span className="text-muted-foreground">—</span>}</td>
                      <td className="hidden p-3 sm:table-cell">{p.data.on_site ? "Yes" : "No"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        )
      ) : (
        !mats.length ? <Empty title="No raw materials" text="Add what you make things from (flour, cloth, parts). Then set recipes on your items, and every sale takes the materials from stock." action={<Button onClick={() => nav.form({ kind: "material" })}><Plus /> Add material</Button>} /> : (
          <Panel className="overflow-x-auto p-0 sm:p-0">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-ink bg-sand text-left"><tr><th className="p-3">Name</th><th className="p-3 text-right">In stock</th><th className="p-3 text-right">Warn at</th><th className="p-3 text-right">Cost</th><th className="p-3 text-right">Value</th></tr></thead>
              <tbody className="divide-y divide-ink/10">
                {mats.map((m) => {
                  const l = level.get(m.id)!;
                  return (
                    <tr key={m.id} className="hover:bg-sun/30">
                      <td className="p-3"><LinkTo to={{ t: "material", id: m.id }}>{m.data.name}</LinkTo></td>
                      <td className={cn("p-3 text-right tabular-nums", l?.low && "font-bold text-destructive")}>{num(l?.qty ?? 0)} {m.data.unit}</td>
                      <td className="p-3 text-right tabular-nums">{num(m.data.low_at)}</td>
                      <td className="p-3 text-right tabular-nums">{inr(m.data.cost)}</td>
                      <td className="p-3 text-right tabular-nums">{inr(l?.value ?? 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        )
      )}
    </div>
  );
}

/* ---------- Purchases ---------- */

export function Purchases({ db }: { db: Db }) {
  const nav = useNav();
  const buys = list(db.recs, "purchase").sort((a, b) => b.data.date.localeCompare(a.data.date));
  const sups = list(db.recs, "supplier");
  const paidOn = (id: string) => list(db.recs, "payment").filter((p) => p.data.purchase_id === id).reduce((a, p) => a + p.data.amount, 0);
  return (
    <div className="space-y-6">
      <SectionHead title="Buying" sub="What you bought, from whom, and what you still owe. Stock and cost prices update by themselves.">
        <Button onClick={() => nav.form({ kind: "purchase" })}><Truck /> Bought stock</Button>
        <Button variant="outline" onClick={() => nav.form({ kind: "supplier" })}><Plus /> Supplier</Button>
      </SectionHead>
      <div>
        <h3 className="mb-2 font-bold">Suppliers</h3>
        {sups.length ? <div className="flex flex-wrap gap-2">{sups.map((x) => <button key={x.id} type="button" onClick={() => nav.open({ t: "supplier", id: x.id })} className="rounded-xl border-2 border-ink bg-card px-3 py-2 text-left text-sm shadow-block-sm hover:bg-sun"><b>{x.data.name}</b>{x.data.items && <span className="block text-xs">{x.data.items}</span>}</button>)}</div> : <p className="text-sm text-muted-foreground">Suppliers are added when you record a purchase.</p>}
      </div>
      {!buys.length ? <Empty title="No purchases yet" action={<Button onClick={() => nav.form({ kind: "purchase" })}><Truck /> Bought stock</Button>} /> : (
        <Panel className="overflow-x-auto p-0 sm:p-0">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-ink bg-sand text-left"><tr><th className="p-3">No.</th><th className="p-3">Date</th><th className="p-3">From</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Paid then</th></tr></thead>
            <tbody className="divide-y divide-ink/10">
              {buys.map((p) => <tr key={p.id}><td className="p-3"><LinkTo to={{ t: "purchase", id: p.id }}>{p.data.number}</LinkTo></td><td className="p-3">{day(p.data.date)}</td><td className="p-3">{p.data.supplier_id ? <LinkTo to={{ t: "supplier", id: p.data.supplier_id }}>{p.data.supplier_name}</LinkTo> : p.data.supplier_name}</td><td className="p-3 text-right tabular-nums">{inr(p.data.total)}</td><td className="p-3 text-right tabular-nums">{inr(paidOn(p.id))}</td></tr>)}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}

/* ---------- Money ---------- */

export function Money({ db }: { db: Db }) {
  const nav = useNav();
  const { run } = useBusiness();
  const s = db.ws.settings;
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const cb = useMemo(() => cashBook(db.recs, s, from, to), [db.recs, s, from, to]);
  const p = useMemo(() => pnl(db.recs, s, from, to), [db.recs, s, from, to]);
  const modeName = (m: PayMode) => PAY_MODES.find((x) => x[0] === m)?.[1];
  const expenses = list(db.recs, "expense").filter((e) => e.data.date >= from && e.data.date <= to).sort((a, b) => b.data.date.localeCompare(a.data.date));
  return (
    <div className="space-y-5">
      <SectionHead title="Money" sub="Your cash book fills itself from bills, payments, purchases and expenses.">
        <Button onClick={() => nav.form({ kind: "expense" })}><Wallet /> Spent money</Button>
        <Button variant="outline" onClick={() => nav.form({ kind: "payment" })}>Got paid</Button>
        <Button variant="outline" onClick={() => download(`cash-book-${from}-to-${to}.csv`, toCsv([["Date", "Details", "How", "In", "Out"], ...cb.rows.map((r) => [r.date, r.text, modeName(r.mode), r.in || "", r.out || ""])]))}><Download /> Excel</Button>
      </SectionHead>
      <Period from={from} to={to} set={(f, t) => { setFrom(f); setTo(t); }} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Cash in hand" value={inrShort(cb.closing.cash)} tone="bg-lime" hint={`started at ${inrShort(cb.opening.cash)}`} />
        <Stat label="In bank and UPI" value={inrShort(cb.closing.bank)} tone="bg-sky" hint="from what you recorded here" />
        <Stat label="Money in" value={inrShort(cb.in)} />
        <Stat label="Money out" value={inrShort(cb.out)} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-x-auto p-0 sm:p-0">
          <h3 className="border-b-2 border-ink/10 p-4 font-bold">Cash book</h3>
          {!cb.rows.length ? <p className="p-4 text-sm text-muted-foreground">Nothing in these dates.</p> : (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground"><tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Details</th><th className="px-4 py-2 text-right">In</th><th className="px-4 py-2 text-right">Out</th></tr></thead>
              <tbody className="divide-y divide-ink/10">{[...cb.rows].reverse().map((r, i) => <tr key={i}><td className="whitespace-nowrap px-4 py-2">{day(r.date)}</td><td className="px-4 py-2">{r.text} <span className="text-xs text-muted-foreground">· {modeName(r.mode)}</span></td><td className="px-4 py-2 text-right tabular-nums text-[#1a8c78]">{r.in ? inr(r.in) : ""}</td><td className="px-4 py-2 text-right tabular-nums">{r.out ? inr(r.out) : ""}</td></tr>)}</tbody>
            </table>
          )}
        </Panel>
        <div className="space-y-5">
          <Panel>
            <h3 className="font-bold">Spent, by what for</h3>
            {p.expenses.length ? <ul className="mt-2 space-y-1 text-sm">{p.expenses.map((e) => <li key={e.category} className="flex justify-between"><span>{e.category}</span><span className="tabular-nums">{inr(e.amount)}</span></li>)}<li className="flex justify-between border-t border-ink/20 pt-1 font-bold"><span>Total</span><span>{inr(p.expense_total)}</span></li></ul> : <p className="mt-1 text-sm text-muted-foreground">No expenses.</p>}
          </Panel>
          <Panel>
            <h3 className="font-bold">Expenses</h3>
            <ul className="mt-1 divide-y divide-ink/10 text-sm">
              {expenses.slice(0, 40).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 py-2">
                  <button type="button" className="text-left hover:underline" onClick={() => nav.form({ kind: "expense", id: e.id })}>{day(e.data.date)} · {e.data.category}{e.data.note ? ` · ${e.data.note}` : ""}</button>
                  <span className="flex items-center gap-1"><span className="tabular-nums">{inr(e.data.amount)}</span><Button size="sm" variant="ghost" onClick={() => { if (confirm("Remove this expense?")) run((d) => removeRecord(d, e.id)); }} aria-label="Remove">×</Button></span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------- Taxes ---------- */

export function Taxes({ db }: { db: Db }) {
  const nav = useNav();
  const s = db.ws.settings;
  const t = bizType(db.ws.type_id);
  const services = !!t && ["home", "health", "edu", "pro", "beauty", "transport", "events", "tech"].includes(t.sector);
  const [month, setMonth] = useState(today().slice(0, 7));
  const q = useMemo(() => gstQuarter(db.recs, s, today(), services), [db.recs, s, services]);
  const prevQ = useMemo(() => gstQuarter(db.recs, s, addDays(q.quarter.from, -1), services), [db.recs, s, q.quarter.from, services]);
  const g = useMemo(() => gstMonth(db.recs, month), [db.recs, month]);
  const bar = (
    <div>
      <div className="h-3 overflow-hidden rounded-full border-2 border-ink bg-card"><div className={cn("h-full", q.share > 0.8 ? "bg-coral" : "bg-teal")} style={{ width: `${Math.min(100, q.share * 100)}%` }} /></div>
      <p className="mt-1 text-sm">{inr(q.fyTurnover)} of {inr(q.limit)} this year ({q.fy})</p>
    </div>
  );
  const quarterCsv = () => {
    const bills = list(db.recs, "bill").filter((b) => !b.data.cancelled && b.data.date >= q.quarter.from && b.data.date <= q.quarter.to);
    download(`sales-${q.quarter.from}.csv`, toCsv([["Bill", "Date", "Customer", "Total"], ...bills.map((b) => [b.data.number, b.data.date, b.data.customer_name, b.data.total])]));
  };
  return (
    <div className="space-y-5">
      <SectionHead title="Taxes" sub="Worked out from your bills and purchases. Check with your CA before you file; the numbers here are your starting point." />
      {s.gst_mode === "none" && (
        <>
          <Panel tone="bg-sky"><p className="font-bold">You are not registered for GST</p><p className="mt-1 text-sm">Your bills carry no tax. Registration is needed once yearly sales cross {inr(q.limit)} ({services ? "services" : "goods"}). We will warn you as you get close. If you register, change it in Settings.</p></Panel>
          <Panel><h3 className="mb-2 font-bold">How close you are to the limit</h3>{bar}</Panel>
        </>
      )}
      {s.gst_mode === "composition" && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label={`Sales, ${q.quarter.label}`} value={inrShort(q.turnover)} tone="bg-sun" />
            <Stat label={`Tax at ${s.composition_rate}%`} value={inr(q.tax)} tone="bg-coral" hint={`Pay with CMP-08 by ${day(q.quarter.due)}`} />
            <Stat label={`Last quarter tax`} value={inr(prevQ.tax)} hint={`${prevQ.quarter.label}, due ${day(prevQ.quarter.due)}`} />
          </div>
          <Panel>
            <h3 className="font-bold">Composition scheme</h3>
            <p className="mt-1 text-sm">You pay {s.composition_rate}% of your sales every quarter (CMP-08) and file one return a year (GSTR-4, by {day(q.annualDue)}). You cannot charge GST on bills or claim GST on purchases, so your bills say "bill of supply". If the year's sales cross the limit, you have to move to regular GST.</p>
            <div className="mt-3">{bar}</div>
            <Button className="mt-3" size="sm" variant="outline" onClick={quarterCsv}><Download /> This quarter's sales (Excel)</Button>
          </Panel>
        </>
      )}
      {s.gst_mode === "regular" && (
        <>
          <div className="flex flex-wrap items-center gap-2"><Input type="month" className="h-10 w-44" value={month} onChange={(e) => setMonth(e.target.value)} /><span className="text-sm">GSTR-1 by {day(g.due.gstr1)} · GSTR-3B by {day(g.due.gstr3b)}</span></div>
          {g.missingRate > 0 && <Panel tone="bg-sun"><button type="button" className="flex items-center gap-2 text-left font-semibold" onClick={() => nav.go("stock")}><AlertTriangle className="h-5 w-5" /> {plural(g.missingRate, "item")} have no GST rate. Set them in Products.</button></Panel>}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="GST on sales" value={inr(g.output)} tone="bg-sun" hint={plural(g.bills, "bill")} />
            <Stat label="GST on purchases" value={inr(g.input)} hint="you can claim this" />
            <Stat label="To pay" value={inr(g.payable)} tone="bg-coral" />
            <Stat label="Carry forward" value={inr(g.carry)} />
          </div>
          <Panel className="overflow-x-auto">
            <h3 className="mb-2 font-bold">Sales by rate ({monthName(month)})</h3>
            {g.rates.length ? (
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground"><tr><th className="py-1">Rate</th><th className="py-1 text-right">Value</th><th className="py-1 text-right">CGST</th><th className="py-1 text-right">SGST</th><th className="py-1 text-right">IGST</th></tr></thead>
                <tbody className="divide-y divide-ink/10">{g.rates.map((r) => <tr key={r.rate}><td className="py-1.5">{r.rate}%</td><td className="py-1.5 text-right tabular-nums">{inr(r.taxable)}</td><td className="py-1.5 text-right tabular-nums">{inr(r.cgst)}</td><td className="py-1.5 text-right tabular-nums">{inr(r.sgst)}</td><td className="py-1.5 text-right tabular-nums">{inr(r.igst)}</td></tr>)}</tbody>
              </table>
            ) : <p className="text-sm text-muted-foreground">No taxed bills this month.</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => download(`gstr1-b2b-${month}.csv`, toCsv([["Invoice", "Date", "Buyer", "GSTIN", "Taxable value", "Tax", "Invoice value"], ...g.b2b.map((b) => [b.number, b.date, b.name, b.gstin, b.taxable, b.tax, b.total])]))}><Download /> Business buyers (B2B)</Button>
              <Button size="sm" variant="outline" onClick={() => download(`gstr1-rates-${month}.csv`, toCsv([["Rate", "Taxable value", "CGST", "SGST", "IGST"], ...g.rates.map((r) => [r.rate, r.taxable, r.cgst, r.sgst, r.igst])]))}><Download /> By rate</Button>
              <Button size="sm" variant="outline" onClick={() => download(`gstr1-hsn-${month}.csv`, toCsv([["HSN or SAC", "Item", "Qty", "Rate", "Taxable value", "Tax"], ...g.hsn.map((h) => [h.hsn, h.name, h.qty, h.rate, h.taxable, h.tax])]))}><Download /> HSN summary</Button>
            </div>
          </Panel>
          {g.b2b.length > 0 && <Panel><h3 className="mb-2 font-bold">Bills to business buyers</h3><ul className="divide-y divide-ink/10 text-sm">{g.b2b.map((b) => <li key={b.number} className="flex justify-between py-1.5"><span>{b.number} · {b.name} · {b.gstin}</span><span className="tabular-nums">{inr(b.total)}</span></li>)}</ul></Panel>}
        </>
      )}
      {s.gst_mode !== "none" && !s.gstin && <p className="text-sm">Add your GSTIN in Settings so it prints on bills.</p>}
    </div>
  );
}

/* ---------- Staff ---------- */

export function Staff({ db }: { db: Db }) {
  const nav = useNav();
  const { run } = useBusiness();
  const staff = list(db.recs, "staff").filter((x) => x.data.active);
  const t = today();
  const month = t.slice(0, 7);
  const marks = new Map(list(db.recs, "attendance").filter((a) => a.data.date === t).map((a) => [a.data.staff_id, a.data.mark]));
  const totalPay = staff.reduce((a, x) => a + staffMonth(db.recs, x.id, month).pay, 0);
  return (
    <div className="space-y-5">
      <SectionHead title="Staff" sub="Mark today in one tap. Pay is worked out from attendance, and paying adds it to expenses.">
        <Button onClick={() => nav.form({ kind: "staff" })}><Plus /> Add staff</Button>
      </SectionHead>
      {!staff.length ? <Empty title="No staff added" text="Add the people who work with you to track attendance and pay." action={<Button onClick={() => nav.form({ kind: "staff" })}><Plus /> Add staff</Button>} /> : (
        <>
          <Stat label={`Pay for ${monthName(month)} so far`} value={inr(totalPay)} />
          <Panel className="p-0 sm:p-0">
            <ul className="divide-y divide-ink/10">
              {staff.map((x) => {
                const m = staffMonth(db.recs, x.id, month);
                return (
                  <li key={x.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div><LinkTo to={{ t: "staff", id: x.id }}>{x.data.name}</LinkTo> <span className="text-sm text-muted-foreground">· {x.data.role} · {m.absent} absent, {m.half} half this month · pay left {inr(m.left)}</span></div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Today:</span>
                      <Choice value={(marks.get(x.id) ?? "") as AttendanceMark} onChange={(v) => run((d) => markAttendance(d, x.id, t, v), { quiet: true })} options={[["present", "Here"], ["half", "Half"], ["absent", "Absent"], ["leave", "Leave"]]} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </>
      )}
    </div>
  );
}

/* ---------- Marketing ---------- */

export function Marketing({ db }: { db: Db }) {
  const nav = useNav();
  const { run } = useBusiness();
  const camps = list(db.recs, "campaign").sort((a, b) => b.created_at.localeCompare(a.created_at));
  const [openId, setOpenId] = useState<string | null>(camps[0]?.id ?? null);
  const c = camps.find((x) => x.id === openId);
  const people = c ? campaignAudience(db.recs, c.data.audience) : [];
  const fill = (msg: string, name: string) => msg.replace(/\{name\}/g, name).replace(/\{shop\}/g, db.ws.name);
  return (
    <div className="space-y-5">
      <SectionHead title="Offers and messages" sub="Pick who, write once, send from your own WhatsApp one tap at a time. Free, and it keeps your number safe.">
        <Button onClick={() => nav.form({ kind: "campaign" })}><Plus /> New message</Button>
      </SectionHead>
      {!camps.length ? <Empty title="No messages yet" text="Festival offers, new arrivals, or a hello to people you have not seen in a while." action={<Button onClick={() => nav.form({ kind: "campaign" })}><Plus /> New message</Button>} /> : (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            {camps.map((x) => (
              <button key={x.id} type="button" onClick={() => setOpenId(x.id)} className={cn("w-full rounded-xl border-2 border-ink p-3 text-left shadow-block-sm", x.id === openId ? "bg-sun" : "bg-card hover:bg-sun/40")}>
                <b>{x.data.title}</b><span className="block text-xs">{day(x.data.send_on)} · sent to {x.data.sent_to.length}</span>
              </button>
            ))}
          </div>
          {c && (
            <Panel>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><h3 className="font-display text-xl font-bold">{c.data.title}</h3><p className="mt-1 whitespace-pre-wrap text-sm">{c.data.message}</p></div>
                <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => nav.form({ kind: "campaign", id: c.id })}>Edit</Button><Button size="sm" variant="ghost" onClick={() => { if (confirm("Remove this message?")) run((d) => removeRecord(d, c.id)); }}>Remove</Button></div>
              </div>
              <p className="mt-3 text-sm font-semibold">{c.data.sent_to.length} of {people.length} sent</p>
              <div className="mt-1 h-2 overflow-hidden rounded-full border border-ink"><div className="h-full bg-lime" style={{ width: `${people.length ? (c.data.sent_to.filter((id) => people.some((p) => p.id === id)).length / people.length) * 100 : 0}%` }} /></div>
              <ul className="mt-3 divide-y divide-ink/10">
                {people.map((p) => {
                  const sent = c.data.sent_to.includes(p.id);
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                      <span className={cn(sent && "text-muted-foreground line-through")}>{p.name} <span className="text-xs">{p.phone}</span></span>
                      <WaButton phone={p.phone} text={fill(c.data.message, p.name.split(" ")[0])} label={sent ? "Again" : "Send"} onSent={() => run((d) => markCampaignSent(d, c.id, p.id), { quiet: true })} />
                    </li>
                  );
                })}
              </ul>
              {!people.length && <p className="mt-2 text-sm text-muted-foreground">Nobody in this group has a phone number yet.</p>}
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Website ---------- */

const COLOURS = ["sun", "pink", "teal", "sky", "lime", "coral"];

export function Website({ db, cloud }: { db: Db; cloud: boolean }) {
  const { run } = useBusiness();
  const s = db.ws.settings;
  const [site, setSite] = useState(s.site);
  const url = `${typeof location !== "undefined" ? location.origin : "https://ezyourlife.com"}/b/${site.slug}`;
  const items = list(db.recs, "product").filter((p) => p.data.active);
  const dirty = JSON.stringify(site) !== JSON.stringify(s.site);
  const save = (next = site) => run((d) => updateSettings(d, { site: { ...next, slug: slugify(next.slug) } }));
  return (
    <div className="space-y-5">
      <SectionHead title="Your website" sub="A page for your business with your items and prices. Orders and enquiries from it land in this app by themselves." />
      {!cloud && <Panel tone="bg-sun"><p className="font-semibold">You are trying this on this device. <Link to="/auth" state={{ from: "/business/app" }} className="underline">Sign in</Link> to put your website live for customers.</p></Panel>}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Panel className="space-y-4">
          <Field label="Web address" hint={url}>
            <div className="flex items-center gap-1"><span className="text-sm text-muted-foreground">/b/</span><Input value={site.slug} onChange={(e) => setSite({ ...site, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} /></div>
          </Field>
          <Field label="About you (shown at the top)"><Textarea rows={3} value={site.about} onChange={(e) => setSite({ ...site, about: e.target.value })} /></Field>
          <Field label="Colour"><div className="flex gap-2">{COLOURS.map((c) => <button key={c} type="button" onClick={() => setSite({ ...site, colour: c })} className={cn(`h-9 w-9 rounded-full border-2 border-ink bg-${c}`, site.colour === c && "ring-2 ring-ink ring-offset-2")} aria-label={c} />)}</div></Field>
          <label className="flex items-center gap-2 font-semibold"><Switch checked={site.take_orders} onCheckedChange={(v) => setSite({ ...site, take_orders: v })} /> Take orders on the website</label>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!dirty} onClick={() => save()}>Save</Button>
            {cloud && (site.published
              ? <Button variant="outline" onClick={() => { const n = { ...site, published: false }; setSite(n); save(n); }}>Take it offline</Button>
              : <Button variant="outline" className="bg-lime" onClick={() => { const n = { ...site, published: true }; setSite(n); save(n); }}>Put it live</Button>)}
          </div>
          <div>
            <p className="mb-1 text-sm font-semibold">Items shown ({items.filter((p) => p.data.on_site).length} of {items.length}). Change in each item.</p>
            <div className="flex flex-wrap gap-1.5">{items.map((p) => <LinkTo key={p.id} to={{ t: "product", id: p.id }} className={cn("rounded-full border-2 border-ink px-2.5 py-0.5 text-xs no-underline", p.data.on_site ? "bg-lime" : "bg-card opacity-60")}>{p.data.name}</LinkTo>)}</div>
          </div>
        </Panel>
        <Panel className="space-y-3 text-center">
          <Pill s={s.site.published ? "done" : "open"} label={s.site.published ? "Live" : "Not live yet"} />
          <div className="mx-auto w-fit rounded-xl border-2 border-ink bg-white p-3"><QRCodeSVG value={url} size={160} /></div>
          <p className="text-sm">Print this at your counter so people can order from their phone.</p>
          {s.site.published && (
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" variant="outline" asChild><a href={`/b/${s.site.slug}`} target="_blank" rel="noreferrer"><ExternalLink /> Open</a></Button>
              <Button size="sm" variant="outline" asChild className="bg-lime"><a href={waLink(undefined, `Order from ${db.ws.name} online: ${url}`)} target="_blank" rel="noreferrer">Share on WhatsApp</a></Button>
            </div>
          )}
        </Panel>
      </div>
      <div>
        <h3 className="mb-2 font-bold">Preview</h3>
        <div className="overflow-hidden rounded-2xl border-2 border-ink shadow-block-sm">
          <SiteView preview slug={site.slug} site={{ name: db.ws.name, type_id: db.ws.type_id, about: site.about, colour: site.colour, take_orders: site.take_orders, city: s.city, address: s.address, phone: s.phone, labels: s.labels, items: items.filter((p) => p.data.on_site).map((p) => ({ id: p.id, name: p.data.name, price: p.data.price, unit: p.data.unit, type: p.data.type })) }} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Reports ---------- */

export function Reports({ db }: { db: Db }) {
  const s = db.ws.settings;
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const p = useMemo(() => pnl(db.recs, s, from, to), [db.recs, s, from, to]);
  const months = useMemo(() => salesByMonth(db.recs, s, 6), [db.recs, s]);
  const tp = useMemo(() => topProducts(db.recs, from, to), [db.recs, from, to]);
  const tc = useMemo(() => topCustomers(db.recs, from, to), [db.recs, from, to]);
  const exportAll = () => {
    const bills = list(db.recs, "bill");
    download(`bills-${db.ws.name}.csv`, toCsv([["Bill", "Date", "Customer", "Phone", "Value", "CGST", "SGST", "IGST", "Total", "Cancelled"], ...bills.map((b) => [b.data.number, b.data.date, b.data.customer_name, b.data.phone, b.data.taxable, b.data.cgst, b.data.sgst, b.data.igst, b.data.total, b.data.cancelled ? "yes" : ""])]));
  };
  const Line = ({ k, v, bold, minus }: { k: string; v: number; bold?: boolean; minus?: boolean }) => <li className={cn("flex justify-between py-1.5", bold && "border-t-2 border-ink pt-2 text-base font-bold")}><span>{k}</span><span className="tabular-nums">{minus ? "−" : ""}{inr(v)}</span></li>;
  return (
    <div className="space-y-5">
      <SectionHead title="Reports" sub="Profit, best sellers and best customers, from what you entered.">
        <Button variant="outline" onClick={exportAll}><Download /> All bills (Excel)</Button>
      </SectionHead>
      <Period from={from} to={to} set={(f, t) => { setFrom(f); setTo(t); }} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <h3 className="font-bold">Profit, {day(from)} to {day(to)}</h3>
          <ul className="mt-2 text-sm">
            <Line k={`Sales (${plural(p.bills, "bill")})${s.gst_mode === "regular" ? ", without GST" : ""}`} v={p.sales} />
            <Line k="Stock bought" v={p.purchases} minus />
            {p.expenses.map((e) => <Line key={e.category} k={e.category} v={e.amount} minus />)}
            {p.composition_tax > 0 && <Line k={`Composition tax (${s.composition_rate}%)`} v={p.composition_tax} minus />}
            <Line k={p.profit >= 0 ? "Profit" : "Loss"} v={Math.abs(p.profit)} bold />
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">A simple view: stock bought is counted when bought, not when sold. Money the owner took out is not an expense.</p>
        </Panel>
        <Panel><h3 className="mb-2 font-bold">Last 6 months</h3><MonthlyInOut data={months} /></Panel>
        <Panel>
          <h3 className="mb-2 font-bold">Best sellers</h3>
          {tp.length ? <ul className="divide-y divide-ink/10 text-sm">{tp.map((x) => <li key={x.name} className="flex justify-between py-1.5"><span>{x.name} <span className="text-muted-foreground">× {num(x.qty)}</span></span><span className="tabular-nums">{inr(x.amount)}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No sales in these dates.</p>}
        </Panel>
        <Panel>
          <h3 className="mb-2 font-bold">Best {s.labels.customers.toLowerCase()}</h3>
          {tc.length ? <ul className="divide-y divide-ink/10 text-sm">{tc.map((x) => <li key={x.name} className="flex justify-between py-1.5"><span>{x.name} <span className="text-muted-foreground">· {plural(x.bills, "bill")}</span></span><span className="tabular-nums">{inr(x.amount)}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No named customers in these dates.</p>}
        </Panel>
        <Panel className="lg:col-span-2 overflow-x-auto">
          <h3 className="mb-2 font-bold">Month by month</h3>
          <table className="w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-1">Month</th><th className="py-1 text-right">Sales</th><th className="py-1 text-right">Bought and spent</th><th className="py-1 text-right">Profit</th></tr></thead>
            <tbody className="divide-y divide-ink/10">{months.map((m) => <tr key={m.month}><td className="py-1.5">{monthName(m.month)}</td><td className="py-1.5 text-right tabular-nums">{inr(m.sales)}</td><td className="py-1.5 text-right tabular-nums">{inr(m.spent)}</td><td className={cn("py-1.5 text-right tabular-nums", m.profit < 0 && "text-destructive")}>{inr(m.profit)}</td></tr>)}</tbody></table>
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Settings ---------- */

const ALL_MODULES: ModuleId[] = ["orders", "appointments", "leads", "customers", "bills", "dues", "stock", "purchases", "money", "taxes", "staff", "reminders", "marketing", "website", "reports"];

export function SettingsSection({ db }: { db: Db }) {
  const { run, rename, removeCurrent, store, localWaiting, moveToAccount } = useBusiness();
  const nav = useNav();
  const s = db.ws.settings;
  const [name, setName] = useState(db.ws.name);
  const [d, setD] = useState<Settings>(s);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setD({ ...d, [k]: v });
  const licences = list(db.recs, "licence");
  const save = async () => {
    if (d.gstin && !validGstin(d.gstin)) return void run(() => { throw new Error("That GSTIN does not look right. Check it or leave it empty."); });
    if (d.gst_mode === "regular" && !d.gstin) return void run(() => { throw new Error("Add your GSTIN for regular GST."); });
    if (name.trim() !== db.ws.name) await rename(name);
    run((x) => updateSettings(x, { ...d, gstin: d.gstin?.toUpperCase() }));
  };
  const backup = () => download(`${slugify(db.ws.name)}-backup-${today()}.json`, JSON.stringify(db, null, 1), "application/json");
  return (
    <div className="space-y-5">
      <SectionHead title="Settings" sub="Your details print on every bill and message.">
        <Button onClick={() => void save()}>Save settings</Button>
      </SectionHead>
      {localWaiting && store.mode === "cloud" && <Panel tone="bg-sun"><p className="font-semibold">You have a business saved on this device from before you signed in.</p><Button className="mt-2" size="sm" onClick={() => void moveToAccount()}><Upload /> Move it to my account</Button></Panel>}
      <Panel className="grid gap-3 sm:grid-cols-2">
        <Field label="Business name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Your name"><Input value={d.owner_name ?? ""} onChange={(e) => set("owner_name", e.target.value || undefined)} /></Field>
        <Field label="Phone"><Input value={d.phone ?? ""} onChange={(e) => set("phone", e.target.value || undefined)} /></Field>
        <Field label="Email"><Input value={d.email ?? ""} onChange={(e) => set("email", e.target.value || undefined)} /></Field>
        <Field label="Address" className="sm:col-span-2"><Input value={d.address ?? ""} onChange={(e) => set("address", e.target.value || undefined)} /></Field>
        <Field label="City"><Input value={d.city ?? ""} onChange={(e) => set("city", e.target.value || undefined)} /></Field>
        <Field label="State"><select className={selectCls} value={d.state} onChange={(e) => set("state", e.target.value)}>{STATES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="UPI ID" hint="Puts a pay QR on unpaid bills"><Input value={d.upi_id ?? ""} onChange={(e) => set("upi_id", e.target.value || undefined)} placeholder="name@bank" /></Field>
        <Field label="FSSAI number (food businesses)"><Input value={d.fssai ?? ""} onChange={(e) => set("fssai", e.target.value || undefined)} /></Field>
      </Panel>
      <Panel className="space-y-3">
        <h3 className="font-bold">GST</h3>
        <Choice value={d.gst_mode} onChange={(v) => set("gst_mode", v)} options={[["none", "Not registered"], ["composition", "Composition"], ["regular", "Regular"]]} />
        <div className="grid gap-3 sm:grid-cols-3">
          {d.gst_mode !== "none" && <Field label="GSTIN"><Input value={d.gstin ?? ""} onChange={(e) => set("gstin", e.target.value || undefined)} /></Field>}
          {d.gst_mode === "composition" && <Field label="Composition rate"><select className={selectCls} value={d.composition_rate} onChange={(e) => set("composition_rate", Number(e.target.value))}><option value={1}>1% (traders and makers)</option><option value={5}>5% (restaurants)</option><option value={6}>6% (services)</option></select></Field>}
          {d.gst_mode === "regular" && <label className="flex items-center gap-2 self-end pb-2 font-semibold"><Switch checked={d.prices_include_tax} onCheckedChange={(v) => set("prices_include_tax", v)} /> My prices include GST</label>}
        </div>
        <p className="text-xs text-muted-foreground">Changing this affects new bills only.</p>
      </Panel>
      <Panel className="grid gap-3 sm:grid-cols-3">
        <h3 className="font-bold sm:col-span-3">Numbers and money</h3>
        <Field label="Bill numbers start with"><Input value={d.bill_prefix} onChange={(e) => set("bill_prefix", e.target.value)} /></Field>
        <Field label={`${s.labels.order} numbers start with`}><Input value={d.order_prefix} onChange={(e) => set("order_prefix", e.target.value)} /></Field>
        <Field label="Cash in hand when you started ₹"><Input type="number" value={d.opening_cash || ""} onChange={(e) => set("opening_cash", Number(e.target.value))} /></Field>
      </Panel>
      <Panel className="grid gap-3 sm:grid-cols-2">
        <h3 className="font-bold sm:col-span-2">Reminders</h3>
        <Field label="Dues reminders, days after delivery" hint="For example 3, 7"><Input value={d.reminders.dues_days.join(", ")} onChange={(e) => set("reminders", { ...d.reminders, dues_days: e.target.value.split(/[ ,]+/).map(Number).filter((n) => n > 0).slice(0, 4) })} /></Field>
        <Field label="Enquiry follow-ups, days after" hint="For example 2, 5"><Input value={d.reminders.lead_days.join(", ")} onChange={(e) => set("reminders", { ...d.reminders, lead_days: e.target.value.split(/[ ,]+/).map(Number).filter((n) => n > 0).slice(0, 4) })} /></Field>
        <Field label="Pickup reminder, hours before"><Input type="number" min={0} value={d.reminders.pickup_hours_before} onChange={(e) => set("reminders", { ...d.reminders, pickup_hours_before: Number(e.target.value) })} /></Field>
        <Field label="Visit reminder, hours before"><Input type="number" min={0} value={d.reminders.appt_hours_before} onChange={(e) => set("reminders", { ...d.reminders, appt_hours_before: Number(e.target.value) })} /></Field>
      </Panel>
      <Panel>
        <h3 className="font-bold">Sections you use</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ALL_MODULES.map((m) => {
            const on = d.modules.includes(m);
            return <button key={m} type="button" onClick={() => set("modules", on ? d.modules.filter((x) => x !== m) : [...d.modules, m])} className={cn("rounded-full border-2 border-ink px-3 py-1 text-sm font-semibold", on ? "bg-lime" : "bg-card opacity-60")}>{MODULE_NAMES(s)[m]}</button>;
          })}
        </div>
      </Panel>
      <Panel>
        <div className="flex items-center justify-between"><h3 className="font-bold">Licences and renewals</h3><Button size="sm" variant="outline" onClick={() => nav.form({ kind: "licence" })}><Plus /> Add</Button></div>
        {licences.length ? <ul className="mt-2 divide-y divide-ink/10 text-sm">{licences.map((l) => <li key={l.id} className="flex items-center justify-between py-2"><button type="button" className="text-left hover:underline" onClick={() => nav.form({ kind: "licence", id: l.id })}>{l.data.name}{l.data.number ? ` · ${l.data.number}` : ""}</button><span className={cn(l.data.expires_on < addDays(today(), 30) && "font-bold text-destructive")}>ends {day(l.data.expires_on)}</span></li>)}</ul> : <p className="mt-1 text-sm text-muted-foreground">FSSAI, shop licence, trade licence, insurance. You get a reminder 30 days before each ends.</p>}
      </Panel>
      <Panel className="space-y-3">
        <h3 className="font-bold">Your data</h3>
        <p className="text-sm">{store.mode === "cloud" ? "Saved in your account. Only you can see it." : "Saved on this device only. Sign in to keep it safe and use it on your phone and laptop."}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={backup}><Download /> Download a backup</Button>
          <Button size="sm" variant="destructive" onClick={() => { if (prompt(`This deletes ${db.ws.name} and everything in it. Type DELETE to go ahead.`) === "DELETE") void removeCurrent(); }}>Delete this business</Button>
        </div>
      </Panel>
    </div>
  );
}
