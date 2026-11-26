/* The side panel that opens any record, with everything linked to it: a customer shows their orders, bills,
   payments, dues and messages; a bill shows its order, payments and the customer; an item shows its stock. */

import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Ban, CheckCircle2, Pencil, Printer, ReceiptIndianRupee, Trash2, Wallet } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useModernTheme } from "@/components/modern/theme";
import { cn } from "@/lib/utils";
import { useBusiness } from "@/business/useBusiness";
import type { AnyRec, AttendanceMark, OrderStatus, PayMode, Rec, Settings, Workspace } from "@/business/types";
import {
  acceptOrder, billBalance, cancelBill, customerDue, finishAppointment, list, markAttendance, orderTotal, paidOnBill, payStaff,
  refund, removeRecord, setLeadStatus, setOrderStatus, setStockCount, staffMonth, stockOf, supplierDue,
} from "@/business/engine";
import { canMake, recipeCost } from "@/business/reports";
import { day, dayTime, inr, num, today } from "@/business/format";
import { texts } from "@/business/whatsapp";
import { BillView } from "./BillView";
import { Choice, Input, LinkTo, PAY_MODES, Pill, useNav, WaButton, type Target } from "./ui";

export function DetailHost({ target, onClose }: { target: Target | null; onClose: () => void }) {
  const { db } = useBusiness();
  const { dark } = useModernTheme();
  const rec = target && db ? db.recs.find((r) => r.id === target.id) : undefined;
  return (
    <Sheet open={!!target} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className={cn("ez-modern biz-app w-full overflow-y-auto border-black/10 bg-[#FAF7F2] p-0 dark:border-white/10 dark:bg-[#0D0D0F] sm:max-w-xl", dark && "dark")}>
        {db && rec ? <Detail rec={rec} ws={db.ws} recs={db.recs} onClose={onClose} /> : <div className="p-6"><SheetHeader><SheetTitle>Not found</SheetTitle><SheetDescription>It may have been removed.</SheetDescription></SheetHeader></div>}
      </SheetContent>
    </Sheet>
  );
}

interface P<K extends AnyRec["kind"]> { rec: Rec<K>; ws: Workspace; recs: AnyRec[]; onClose: () => void }

function Detail({ rec, ws, recs, onClose }: { rec: AnyRec; ws: Workspace; recs: AnyRec[]; onClose: () => void }) {
  switch (rec.kind) {
    case "customer": return <CustomerDetail rec={rec} ws={ws} recs={recs} onClose={onClose} />;
    case "bill": return <BillDetail rec={rec} ws={ws} recs={recs} onClose={onClose} />;
    case "order": return <OrderDetail rec={rec} ws={ws} recs={recs} onClose={onClose} />;
    case "lead": return <LeadDetail rec={rec} ws={ws} recs={recs} onClose={onClose} />;
    case "product": case "material": return <ItemDetail rec={rec as Rec<"product"> | Rec<"material">} ws={ws} recs={recs} onClose={onClose} />;
    case "supplier": return <SupplierDetail rec={rec} ws={ws} recs={recs} onClose={onClose} />;
    case "staff": return <StaffDetail rec={rec} ws={ws} recs={recs} onClose={onClose} />;
    case "appointment": return <ApptDetail rec={rec} ws={ws} recs={recs} onClose={onClose} />;
    case "purchase": return <PurchaseDetail rec={rec} ws={ws} recs={recs} onClose={onClose} />;
    default: return null;
  }
}

function Top({ kicker, title, sub, children }: { kicker: string; title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="border-b border-black/10 bg-sun p-5 pr-12 dark:border-white/10">
      <SheetHeader className="text-left">
        <p className="text-xs font-bold uppercase tracking-wider">{kicker}</p>
        <SheetTitle className="font-display text-2xl">{title}</SheetTitle>
        {sub && <SheetDescription asChild><div className="text-ink/80">{sub}</div></SheetDescription>}
      </SheetHeader>
      {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

function Block({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="border-b border-black/10 p-5 dark:border-white/10">
      <div className="mb-2 flex items-center justify-between gap-2"><h3 className="font-bold">{title}</h3>{right}</div>
      {children}
    </section>
  );
}

const Rows = ({ children }: { children: ReactNode }) => <ul className="divide-y divide-ink/10">{children}</ul>;
const RowItem = ({ children }: { children: ReactNode }) => <li className="flex items-center justify-between gap-3 py-2">{children}</li>;
const None = ({ text }: { text: string }) => <p className="text-sm text-muted-foreground">{text}</p>;

function billState(recs: AnyRec[], b: Rec<"bill">) {
  if (b.data.cancelled) return "cancelled";
  const bal = billBalance(recs, b);
  return bal <= 0.5 ? "paid" : bal < b.data.total ? "part" : "due";
}

export function BillRows({ recs, bills }: { recs: AnyRec[]; bills: Rec<"bill">[] }) {
  if (!bills.length) return <None text="No bills yet." />;
  return (
    <Rows>
      {bills.map((b) => (
        <RowItem key={b.id}>
          <span><LinkTo to={{ t: "bill", id: b.id }}>{b.data.number}</LinkTo> <span className="text-sm text-muted-foreground">{day(b.data.date)}</span></span>
          <span className="flex items-center gap-2"><span className="tabular-nums">{inr(b.data.total)}</span><Pill s={billState(recs, b)} /></span>
        </RowItem>
      ))}
    </Rows>
  );
}

/* ---------- Customer ---------- */

function CustomerDetail({ rec, ws, recs }: P<"customer">) {
  const nav = useNav();
  const c = rec.data;
  const s = ws.settings;
  const bills = list(recs, "bill").filter((b) => b.data.customer_id === rec.id).sort((a, b) => b.data.date.localeCompare(a.data.date));
  const orders = list(recs, "order").filter((o) => o.data.customer_id === rec.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const appts = list(recs, "appointment").filter((a) => a.data.customer_id === rec.id).sort((a, b) => b.data.start_at.localeCompare(a.data.start_at));
  const pays = list(recs, "payment").filter((p) => p.data.customer_id === rec.id).sort((a, b) => b.data.date.localeCompare(a.data.date));
  const reminders = list(recs, "reminder").filter((r) => r.data.customer_id === rec.id && r.data.status === "open");
  const due = customerDue(recs, rec.id);
  const spent = bills.filter((b) => !b.data.cancelled).reduce((a, b) => a + b.data.total, 0);
  const shop = ws.name;
  return (
    <>
      <Top kicker={s.labels.customer} title={c.name} sub={<>{c.phone ?? "No phone"}{c.address ? ` · ${c.address}` : ""}{c.gstin ? ` · GSTIN ${c.gstin}` : ""}</>}>
        <Button size="sm" onClick={() => nav.form({ kind: s.modules.includes("appointments") ? "appointment" : "order", preset: { customer_id: rec.id } })}>New {s.labels.order.toLowerCase()}</Button>
        <Button size="sm" variant="outline" onClick={() => nav.form({ kind: "sale", preset: { customer_id: rec.id } })}><ReceiptIndianRupee /> Bill</Button>
        {due > 0 && <Button size="sm" variant="outline" onClick={() => nav.form({ kind: "payment", preset: { customer_id: rec.id } })}><Wallet /> Got paid</Button>}
        <Button size="sm" variant="outline" onClick={() => nav.form({ kind: "customer", id: rec.id })}><Pencil /> Edit</Button>
      </Top>
      <div className="grid grid-cols-3 gap-2 border-b-2 border-ink/10 p-5 text-center">
        <div><p className="text-xs font-semibold">Spent</p><p className="font-display text-lg font-bold">{inr(spent)}</p></div>
        <div><p className="text-xs font-semibold">Owes you</p><p className={`font-display text-lg font-bold ${due > 0 ? "text-destructive" : ""}`}>{inr(due)}</p></div>
        <div><p className="text-xs font-semibold">Visits</p><p className="font-display text-lg font-bold">{bills.filter((b) => !b.data.cancelled).length}</p></div>
      </div>
      <Block title="Send a message">
        <div className="flex flex-wrap gap-2">
          {due > 0 && <WaButton phone={c.phone} text={texts.dues(s, shop, c.name, due)} label="Ask for dues" />}
          <WaButton phone={c.phone} text={texts.thanks(s, shop, c.name)} label="Say thank you" />
          {s.site.published && <WaButton phone={c.phone} text={`Hello ${c.name}, you can now order from ${shop} online: ${location.origin}/b/${s.site.slug}`} label="Share my website" />}
        </div>
      </Block>
      {reminders.length > 0 && (
        <Block title="Coming up">
          <Rows>{reminders.map((r) => <RowItem key={r.id}><span className="text-sm">{r.data.text.split("\n")[0]}</span><span className="whitespace-nowrap text-xs text-muted-foreground">{dayTime(r.data.due_at)}</span></RowItem>)}</Rows>
        </Block>
      )}
      {orders.length > 0 && (
        <Block title={s.labels.orders}>
          <Rows>{orders.map((o) => <RowItem key={o.id}><span><LinkTo to={{ t: "order", id: o.id }}>{o.data.number}</LinkTo> <span className="text-sm text-muted-foreground">{o.data.items.map((i) => i.name).join(", ")}</span></span><Pill s={o.data.status} /></RowItem>)}</Rows>
        </Block>
      )}
      {appts.length > 0 && (
        <Block title={s.labels.orders}>
          <Rows>{appts.map((a) => <RowItem key={a.id}><span><LinkTo to={{ t: "appointment", id: a.id }}>{a.data.service}</LinkTo> <span className="text-sm text-muted-foreground">{dayTime(a.data.start_at)}</span></span><Pill s={a.data.status} /></RowItem>)}</Rows>
        </Block>
      )}
      <Block title="Bills"><BillRows recs={recs} bills={bills} /></Block>
      <Block title="Payments">
        {pays.length ? <Rows>{pays.map((p) => <RowItem key={p.id}><span className="text-sm">{day(p.data.date)} · {PAY_MODES.find((m) => m[0] === p.data.mode)?.[1]}{p.data.note ? ` · ${p.data.note}` : ""}</span><span className={`tabular-nums ${p.data.direction === "out" ? "text-destructive" : ""}`}>{p.data.direction === "out" ? "−" : ""}{inr(p.data.amount)}</span></RowItem>)}</Rows> : <None text="No payments yet." />}
      </Block>
      {c.notes && <Block title="Notes"><p className="whitespace-pre-wrap text-sm">{c.notes}</p></Block>}
    </>
  );
}

/* ---------- Bill ---------- */

function BillDetail({ rec, ws, recs }: P<"bill">) {
  const { run } = useBusiness();
  const nav = useNav();
  const [refundAmt, setRefundAmt] = useState(0);
  const [mode, setMode] = useState<PayMode>("cash");
  const b = rec.data;
  const paid = paidOnBill(recs, rec.id);
  const bal = billBalance(recs, rec);
  const pays = list(recs, "payment").filter((p) => p.data.bill_id === rec.id);
  const s = ws.settings;
  return (
    <>
      <Top kicker="Bill" title={`${b.number} · ${inr(b.total)}`} sub={<>{b.customer_id ? <LinkTo to={{ t: "customer", id: b.customer_id }}>{b.customer_name}</LinkTo> : b.customer_name} · {day(b.date)} · <Pill s={billState(recs, rec)} /></>}>
        {bal > 0 && !b.cancelled && <Button size="sm" onClick={() => nav.form({ kind: "payment", preset: { bill_id: rec.id } })}><Wallet /> Got paid {inr(bal)}</Button>}
        <WaButton phone={b.phone} text={texts.bill(s, ws.name, b, bal)} label="Send bill" />
        <Button size="sm" variant="outline" asChild><Link to={`/business/print/${rec.id}`} target="_blank"><Printer /> Print</Link></Button>
        <Button size="sm" variant="outline" asChild><Link to={`/business/print/${rec.id}?size=80`} target="_blank"><Printer /> Bill printer</Link></Button>
      </Top>
      <div className="overflow-x-auto border-b border-black/10 bg-muted/40 p-4 dark:border-white/10"><div className="rounded-xl border border-black/15 dark:border-white/15"><BillView ws={ws} bill={rec} paid={paid} /></div></div>
      {b.order_id && <Block title={`From ${s.labels.order.toLowerCase()}`}><LinkTo to={{ t: "order", id: b.order_id }}>{list(recs, "order").find((o) => o.id === b.order_id)?.data.number ?? "Open"}</LinkTo></Block>}
      {b.appointment_id && <Block title={`From ${s.labels.order.toLowerCase()}`}><LinkTo to={{ t: "appointment", id: b.appointment_id }}>Open</LinkTo></Block>}
      <Block title="Payments">
        {pays.length ? <Rows>{pays.map((p) => <RowItem key={p.id}><span className="text-sm">{day(p.data.date)} · {PAY_MODES.find((m) => m[0] === p.data.mode)?.[1]}{p.data.note ? ` · ${p.data.note}` : ""}</span><span className="tabular-nums">{p.data.direction === "out" ? "−" : ""}{inr(p.data.amount)}</span></RowItem>)}</Rows> : <None text="Nothing paid yet." />}
      </Block>
      {!b.cancelled && (
        <Block title="Something wrong?">
          <div className="space-y-3">
            {paid > 0 && (
              <div className="flex flex-wrap items-end gap-2">
                <Input className="w-32" type="number" min={0} placeholder="Refund ₹" value={refundAmt || ""} onChange={(e) => setRefundAmt(Number(e.target.value))} />
                <Choice value={mode} onChange={setMode} options={PAY_MODES} />
                <Button size="sm" variant="outline" disabled={!refundAmt} onClick={() => { if (run((db) => refund(db, rec.id, refundAmt, mode))) setRefundAmt(0); }}>Record refund</Button>
              </div>
            )}
            <Button size="sm" variant="destructive" onClick={() => { if (confirm(`Cancel bill ${b.number}? Its stock goes back and its reminders stop.`)) run((db) => cancelBill(db, rec.id)); }}><Ban /> Cancel bill</Button>
          </div>
        </Block>
      )}
    </>
  );
}

/* ---------- Order ---------- */

const NEXT: Record<OrderStatus, OrderStatus[]> = { new: ["making", "ready", "delivered"], making: ["ready", "delivered"], ready: ["delivered"], delivered: [], cancelled: [] };
const STATUS_TEXT: Record<OrderStatus, string> = { new: "New", making: "Start making", ready: "Mark ready", delivered: "Delivered", cancelled: "Cancel" };

function OrderDetail({ rec, ws, recs }: P<"order">) {
  const { run } = useBusiness();
  const nav = useNav();
  const o = rec.data;
  const s = ws.settings;
  const bill = list(recs, "bill").find((b) => b.id === o.bill_id);
  const bal = bill ? billBalance(recs, bill) : orderTotal(recs, s, rec);
  const total = orderTotal(recs, s, rec);
  const pending = o.source === "website" && !o.bill_id && o.status !== "cancelled";
  return (
    <>
      <Top kicker={s.labels.order} title={`${o.number} · ${inr(total)}`} sub={<>{o.customer_id ? <LinkTo to={{ t: "customer", id: o.customer_id }}>{o.customer_name}</LinkTo> : o.customer_name}{o.phone ? ` · ${o.phone}` : ""} · <Pill s={o.status} />{o.source === "website" && <> · <Pill s="sent" label="From website" /></>}</>}>
        {pending ? (
          <Button size="sm" onClick={() => run((db) => acceptOrder(db, rec.id))}><CheckCircle2 /> Accept and make bill</Button>
        ) : NEXT[o.status].map((st) => <Button key={st} size="sm" variant={st === NEXT[o.status][0] ? "default" : "outline"} onClick={() => run((db) => setOrderStatus(db, rec.id, st))}>{STATUS_TEXT[st]}</Button>)}
        {bill && bal > 0 && o.status !== "cancelled" && <Button size="sm" variant="outline" onClick={() => nav.form({ kind: "payment", preset: { bill_id: bill.id } })}><Wallet /> Got paid</Button>}
        {!["delivered", "cancelled"].includes(o.status) && !pending && <Button size="sm" variant="outline" onClick={() => nav.form({ kind: "order", id: rec.id })}><Pencil /> Change</Button>}
      </Top>
      <Block title="Items">
        <Rows>{o.items.map((i, k) => <RowItem key={k}><span>{i.product_id ? <LinkTo to={{ t: "product", id: i.product_id }}>{i.name}</LinkTo> : i.name} × {num(i.qty)}</span><span className="tabular-nums">{inr(i.qty * i.price)}</span></RowItem>)}</Rows>
        {o.due_at && <p className="mt-2 text-sm">Ready by <b>{dayTime(o.due_at)}</b></p>}
        {o.notes && <p className="mt-1 text-sm">Note: {o.notes}</p>}
      </Block>
      <Block title="Bill and money">
        {bill ? <p><LinkTo to={{ t: "bill", id: bill.id }}>{bill.data.number}</LinkTo> · paid {inr(paidOnBill(recs, bill.id))} · {bal > 0 ? <b className="text-destructive">{inr(bal)} to come</b> : <b>fully paid</b>}</p> : <None text={pending ? "The bill is made when you accept." : "No bill."} />}
      </Block>
      <Block title="Messages">
        <div className="flex flex-wrap gap-2">
          <WaButton phone={o.phone} text={texts.orderTaken(s, ws.name, o, total)} label="Confirm order" />
          <WaButton phone={o.phone} text={texts.ready(s, ws.name, o, bal)} label="It's ready" />
          {bill && bal > 0 && <WaButton phone={o.phone} text={texts.dues(s, ws.name, o.customer_name, bal, bill.data.number)} label="Ask for payment" />}
        </div>
      </Block>
      {o.status !== "cancelled" && o.status !== "delivered" && (
        <Block title="Cancel">
          <Button size="sm" variant="destructive" onClick={() => { if (confirm(`Cancel ${o.number}? The bill is cancelled and stock goes back.`)) run((db) => setOrderStatus(db, rec.id, "cancelled")); }}><Ban /> Cancel {s.labels.order.toLowerCase()}</Button>
        </Block>
      )}
    </>
  );
}

/* ---------- Lead ---------- */

function LeadDetail({ rec, ws, recs, onClose }: P<"lead">) {
  const { run } = useBusiness();
  const nav = useNav();
  const l = rec.data;
  const s = ws.settings;
  const reminders = list(recs, "reminder").filter((r) => r.data.ref_id === rec.id && r.data.status === "open");
  return (
    <>
      <Top kicker="Enquiry" title={l.name} sub={<>{l.want} · {l.source}{l.value ? ` · about ${inr(l.value)}` : ""} · <Pill s={l.status} /></>}>
        {l.status !== "won" && l.status !== "lost" && <Button size="sm" onClick={() => { onClose(); nav.form({ kind: s.modules.includes("appointments") ? "appointment" : "order", preset: { lead_id: rec.id } }); }}><CheckCircle2 /> They said yes</Button>}
        <WaButton phone={l.phone} text={texts.lead(s, ws.name, l.name, l.want)} label="Follow up" />
        <Button size="sm" variant="outline" onClick={() => nav.form({ kind: "lead", id: rec.id })}><Pencil /> Edit</Button>
      </Top>
      <Block title="Stage">
        <Choice value={l.status} onChange={(v) => run((db) => setLeadStatus(db, rec.id, v))} options={[["new", "New"], ["talking", "Talking"], ["quoted", "Quote sent"], ["won", "Won"], ["lost", "Lost"]]} />
      </Block>
      <Block title="Follow-ups">
        {reminders.length ? <Rows>{reminders.map((r) => <RowItem key={r.id}><span className="text-sm">Follow-up {r.data.step ?? ""}</span><span className="text-sm text-muted-foreground">{dayTime(r.data.due_at)}</span></RowItem>)}</Rows> : <None text="None planned." />}
      </Block>
      {l.order_id && <Block title={s.labels.order}><LinkTo to={{ t: "order", id: l.order_id }}>Open</LinkTo></Block>}
      {l.customer_id && <Block title={s.labels.customer}><LinkTo to={{ t: "customer", id: l.customer_id }}>Open</LinkTo></Block>}
    </>
  );
}

/* ---------- Items ---------- */

function ItemDetail({ rec, ws, recs, onClose }: P<"product" | "material">) {
  const { run } = useBusiness();
  const nav = useNav();
  const [count, setCount] = useState<number>(NaN);
  const isProduct = rec.kind === "product";
  const p = isProduct ? (rec as Rec<"product">).data : null;
  const unit = rec.data.unit;
  const tracked = !isProduct || p?.stock_mode === "self";
  const qty = stockOf(recs, rec.id);
  const moves = list(recs, "stock_move").filter((m) => m.data.item_id === rec.id).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 30);
  const mats = list(recs, "material");
  const usedIn = !isProduct ? list(recs, "product").filter((x) => x.data.recipe?.some((r) => r.material_id === rec.id)) : [];
  const sold = isProduct ? list(recs, "bill").filter((b) => !b.data.cancelled).flatMap((b) => b.data.lines.filter((l) => l.product_id === rec.id).map((l) => ({ ...l, date: b.data.date }))) : [];
  const make = isProduct ? canMake(recs, rec.id) : null;
  const cost = isProduct ? recipeCost(recs, rec.id) : null;
  const REASON: Record<string, string> = { sale: "Sold", purchase: "Bought", adjust: "Counted or added", used: "Used", return: "Put back" };
  return (
    <>
      <Top kicker={isProduct ? (p!.type === "service" ? "Service" : "Product") : "Raw material"} title={rec.data.name} sub={<>{isProduct ? `${inr(p!.price)} per ${unit}` : `Costs ${inr((rec as Rec<"material">).data.cost)} per ${unit}`}{tracked ? ` · ${num(qty)} ${unit} in stock` : ""}{make !== null ? ` · can make ${make} now` : ""}</>}>
        <Button size="sm" variant="outline" onClick={() => nav.form({ kind: isProduct ? "product" : "material", id: rec.id })}><Pencil /> Edit</Button>
        {tracked && <Button size="sm" variant="outline" onClick={() => nav.form({ kind: "purchase", preset: { item_id: rec.id } })}>Bought more</Button>}
        <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Remove ${rec.data.name}? Old bills keep its name.`)) { run((db) => removeRecord(db, rec.id)); onClose(); } }}><Trash2 /> Remove</Button>
      </Top>
      {tracked && (
        <Block title="Count your stock">
          <div className="flex flex-wrap items-end gap-2">
            <Input className="w-36" type="number" step="any" placeholder={`${num(qty)} ${unit}`} value={Number.isFinite(count) ? count : ""} onChange={(e) => setCount(e.target.value === "" ? NaN : Number(e.target.value))} aria-label="Counted" />
            <Button size="sm" disabled={!Number.isFinite(count)} onClick={() => { if (run((db) => setStockCount(db, rec.id, rec.kind, count))) setCount(NaN); }}>Set to this count</Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Type what is on the shelf; the difference is recorded.</p>
        </Block>
      )}
      {p?.stock_mode === "recipe" && (
        <Block title="Made from">
          <Rows>{(p.recipe ?? []).map((r, i) => { const m = mats.find((x) => x.id === r.material_id); return <RowItem key={i}><span>{m ? <LinkTo to={{ t: "material", id: m.id }}>{m.data.name}</LinkTo> : "Removed"} {num(r.qty)} {m?.data.unit}</span><span className="text-sm text-muted-foreground">{m ? `${num(stockOf(recs, m.id))} ${m.data.unit} left` : ""}</span></RowItem>; })}</Rows>
          {cost !== null && <p className="mt-2 text-sm">Material cost {inr(cost)} · margin {p.price ? Math.round(((p.price - cost) / p.price) * 100) : 0}%</p>}
        </Block>
      )}
      {usedIn.length > 0 && <Block title="Used in"><div className="flex flex-wrap gap-2">{usedIn.map((x) => <LinkTo key={x.id} to={{ t: "product", id: x.id }}>{x.data.name}</LinkTo>)}</div></Block>}
      {isProduct && <Block title="Sold"><p className="text-sm">{num(sold.reduce((a, l) => a + l.qty, 0))} {unit} for {inr(sold.reduce((a, l) => a + l.total, 0))} in all</p></Block>}
      {moves.length > 0 && (
        <Block title="Stock moves">
          <Rows>{moves.map((m) => <RowItem key={m.id}><span className="text-sm">{day(m.data.date)} · {REASON[m.data.reason]}</span><span className={`tabular-nums ${m.data.qty < 0 ? "text-destructive" : ""}`}>{m.data.qty > 0 ? "+" : ""}{num(m.data.qty)} {unit}</span></RowItem>)}</Rows>
        </Block>
      )}
    </>
  );
}

/* ---------- Supplier and purchase ---------- */

function SupplierDetail({ rec, recs }: P<"supplier">) {
  const nav = useNav();
  const due = supplierDue(recs, rec.id);
  const buys = list(recs, "purchase").filter((p) => p.data.supplier_id === rec.id).sort((a, b) => b.data.date.localeCompare(a.data.date));
  const pays = list(recs, "payment").filter((p) => p.data.supplier_id === rec.id && p.data.direction === "out");
  return (
    <>
      <Top kicker="Supplier" title={rec.data.name} sub={<>{rec.data.phone ?? "No phone"}{rec.data.items ? ` · ${rec.data.items}` : ""} · you owe <b>{inr(due)}</b></>}>
        <Button size="sm" onClick={() => nav.form({ kind: "purchase", preset: { supplier_id: rec.id } })}>Bought stock</Button>
        {due > 0 && <Button size="sm" variant="outline" onClick={() => nav.form({ kind: "supplier_payment", preset: { supplier_id: rec.id } })}><Wallet /> Pay</Button>}
        <Button size="sm" variant="outline" onClick={() => nav.form({ kind: "supplier", id: rec.id })}><Pencil /> Edit</Button>
      </Top>
      <Block title="Purchases">{buys.length ? <Rows>{buys.map((p) => <RowItem key={p.id}><span><LinkTo to={{ t: "purchase", id: p.id }}>{p.data.number}</LinkTo> <span className="text-sm text-muted-foreground">{day(p.data.date)}</span></span><span className="tabular-nums">{inr(p.data.total)}</span></RowItem>)}</Rows> : <None text="No purchases yet." />}</Block>
      <Block title="Paid">{pays.length ? <Rows>{pays.map((p) => <RowItem key={p.id}><span className="text-sm">{day(p.data.date)}</span><span className="tabular-nums">{inr(p.data.amount)}</span></RowItem>)}</Rows> : <None text="Nothing paid yet." />}</Block>
    </>
  );
}

function PurchaseDetail({ rec, recs }: P<"purchase">) {
  const p = rec.data;
  const paid = list(recs, "payment").filter((x) => x.data.purchase_id === rec.id).reduce((a, x) => a + x.data.amount, 0);
  return (
    <>
      <Top kicker="Purchase" title={`${p.number} · ${inr(p.total)}`} sub={<>{p.supplier_id ? <LinkTo to={{ t: "supplier", id: p.supplier_id }}>{p.supplier_name}</LinkTo> : p.supplier_name} · {day(p.date)}{p.bill_no ? ` · their bill ${p.bill_no}` : ""}</>} />
      <Block title="Items"><Rows>{p.lines.map((l, i) => <RowItem key={i}><span>{l.name} × {num(l.qty)}</span><span className="tabular-nums">{inr(l.qty * l.price)}</span></RowItem>)}</Rows>
        {p.tax > 0 && <p className="mt-2 text-sm">GST paid {inr(p.tax)} (you can claim it)</p>}
        <p className="mt-1 text-sm">Paid at the time {inr(paid)}</p>
      </Block>
    </>
  );
}

/* ---------- Staff ---------- */

const MARKS: [AttendanceMark, string][] = [["present", "P"], ["half", "½"], ["absent", "A"], ["leave", "L"]];

function StaffDetail({ rec, recs }: P<"staff">) {
  const { run } = useBusiness();
  const nav = useNav();
  const [month, setMonth] = useState(today().slice(0, 7));
  const [mode, setMode] = useState<PayMode>("cash");
  const m = staffMonth(recs, rec.id, month);
  const marks = new Map(list(recs, "attendance").filter((a) => a.data.staff_id === rec.id && a.data.date.startsWith(month)).map((a) => [a.data.date, a.data.mark]));
  const days = Array.from({ length: m.daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
  const cycle = (d: string) => {
    const cur = marks.get(d);
    const order: AttendanceMark[] = ["present", "half", "absent", "leave"];
    const next = cur ? order[(order.indexOf(cur) + 1) % order.length] : "present";
    run((db) => markAttendance(db, rec.id, d, next), { quiet: true });
  };
  return (
    <>
      <Top kicker="Staff" title={rec.data.name} sub={`${rec.data.role} · ${inr(rec.data.monthly_pay)} a month${rec.data.phone ? ` · ${rec.data.phone}` : ""}`}>
        <Button size="sm" variant="outline" onClick={() => nav.form({ kind: "staff", id: rec.id })}><Pencil /> Edit</Button>
      </Top>
      <Block title="Attendance" right={<Input type="month" className="h-9 w-40" value={month} onChange={(e) => setMonth(e.target.value)} />}>
        <p className="mb-2 text-xs text-muted-foreground">Tap a day: P present, ½ half day, A absent, L paid leave. Days not marked count as present.</p>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const mk = marks.get(d);
            return (
              <button key={d} type="button" onClick={() => cycle(d)} className={`h-11 rounded-lg border border-black/15 text-xs font-bold dark:border-white/15 ${mk === "absent" ? "bg-coral" : mk === "half" ? "bg-sun" : mk === "leave" ? "bg-sky" : mk === "present" ? "bg-lime" : "bg-card"}`} aria-label={`${d} ${mk ?? "not marked"}`}>
                <span className="block text-[10px] font-normal">{Number(d.slice(8))}</span>{MARKS.find((x) => x[0] === mk)?.[1] ?? "·"}
              </button>
            );
          })}
        </div>
      </Block>
      <Block title={`Pay for ${month}`}>
        <p className="text-sm">{m.present} present, {m.half} half, {m.leave} leave, {m.absent} absent, {m.unmarked} not marked → {num(m.paidDays)} of {m.daysInMonth} days</p>
        <p className="mt-1">Pay <b>{inr(m.pay)}</b> · paid {inr(m.paid)} · left <b>{inr(m.left)}</b></p>
        {m.left > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Choice value={mode} onChange={setMode} options={PAY_MODES} />
            <Button size="sm" onClick={() => run((db) => payStaff(db, rec.id, month, m.left, mode))}>Pay {inr(m.left)}</Button>
          </div>
        )}
      </Block>
    </>
  );
}

/* ---------- Appointment ---------- */

function ApptDetail({ rec, ws, recs }: P<"appointment">) {
  const { run } = useBusiness();
  const nav = useNav();
  const a = rec.data;
  const s: Settings = ws.settings;
  const [paid, setPaid] = useState(a.price);
  const [mode, setMode] = useState<PayMode>("upi");
  const staff = list(recs, "staff").find((x) => x.id === a.staff_id);
  return (
    <>
      <Top kicker={s.labels.order} title={a.service} sub={<>{a.customer_id ? <LinkTo to={{ t: "customer", id: a.customer_id }}>{a.customer_name}</LinkTo> : a.customer_name} · {dayTime(a.start_at)} · {a.duration_min} min{staff ? ` · with ${staff.data.name}` : ""} · <Pill s={a.status} /></>}>
        {a.status === "booked" && <Button size="sm" variant="outline" onClick={() => nav.form({ kind: "appointment", id: rec.id })}><Pencil /> Move</Button>}
        <WaButton phone={a.phone} text={texts.appointment(s, ws.name, a.customer_name, a.service, a.start_at)} label="Remind" />
        {a.bill_id && <Button size="sm" variant="outline" onClick={() => nav.open({ t: "bill", id: a.bill_id! })}>Open bill</Button>}
      </Top>
      {a.status === "booked" && (
        <Block title="Finish">
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-sm font-semibold">Paid ₹<Input className="mt-1 w-32" type="number" min={0} value={paid} onChange={(e) => setPaid(Number(e.target.value))} /></label>
              <Choice value={mode} onChange={setMode} options={PAY_MODES} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => run((db) => finishAppointment(db, rec.id, "done", { paid, mode }))}><CheckCircle2 /> Done, make bill of {inr(a.price)}</Button>
              <Button variant="outline" onClick={() => run((db) => finishAppointment(db, rec.id, "no_show"))}>Did not come</Button>
              <Button variant="ghost" onClick={() => run((db) => finishAppointment(db, rec.id, "cancelled"))}>Cancel</Button>
            </div>
          </div>
        </Block>
      )}
    </>
  );
}
