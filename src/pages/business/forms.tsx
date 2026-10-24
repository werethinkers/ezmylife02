/* Every "add" and "edit" form of My Business, in one dialog host. Each form calls one engine action,
   which does the follow-on work (bill, stock, reminders, books) by itself. */

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useBusiness } from "@/business/useBusiness";
import type { AnyRec, Campaign, LeadStatus, LineItem, PayMode, Product, Rec, RecordKinds, Settings } from "@/business/types";
import {
  adjustStock, applyChange, billBalance, bookAppointment, convertLead, createOrder, customerDue, editOrder, EXPENSE_CATEGORIES, list, mergeChanges,
  paySupplier, quickSale, receivePayment, recordExpense, recordPurchase, saveLead, saveRecord, stockOf, supplierDue, addReminder, campaignAudience,
} from "@/business/engine";
import { computeBill, GST_RATES, STATES, validGstin } from "@/business/gst";
import { addDays, inr, localInput, today } from "@/business/format";
import { CAMPAIGN_TEMPLATES } from "@/business/whatsapp";
import { blankLine, Choice, Field, LinesEditor, PAY_MODES, PartyPicker, type PartyValue, selectCls, useNav, type FormOpen } from "./ui";

export function FormHost({ form, onClose }: { form: FormOpen | null; onClose: () => void }) {
  const { db } = useBusiness();
  if (!form || !db) return null;
  const P = FORMS[form.kind];
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto rounded-2xl border-2 border-ink p-5 sm:p-6">
        <P form={form} onDone={onClose} recs={db.recs} s={db.ws.settings} />
      </DialogContent>
    </Dialog>
  );
}

interface FormProps { form: FormOpen; onDone: () => void; recs: AnyRec[]; s: Settings }

function Head({ title, sub }: { title: string; sub?: string }) {
  return (
    <DialogHeader className="text-left">
      <DialogTitle className="font-display text-xl">{title}</DialogTitle>
      <DialogDescription>{sub ?? "Fill what you know; the rest is done for you."}</DialogDescription>
    </DialogHeader>
  );
}

function Shell({ title, sub, onSubmit, children, submit = "Save", busy }: { title: string; sub?: string; onSubmit: () => void; children: ReactNode; submit?: string; busy?: boolean }) {
  return (
    <form className="space-y-4" onSubmit={(e: FormEvent) => { e.preventDefault(); onSubmit(); }}>
      <Head title={title} sub={sub} />
      {children}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" size="lg" disabled={busy}>{submit}</Button>
      </div>
    </form>
  );
}

const find = <K extends keyof RecordKinds>(recs: AnyRec[], kind: K, id?: string) => (id ? (list(recs, kind).find((r) => r.id === id) as Rec<K> | undefined) : undefined);
const preset = (f: FormOpen, k: string) => f.preset?.[k] as string | undefined;
const partyOf = (recs: AnyRec[], id?: string): PartyValue => {
  const c = find(recs, "customer", id);
  return c ? { id: c.id, name: c.data.name, phone: c.data.phone, state: c.data.state, gstin: c.data.gstin } : { name: "" };
};

function PayRow({ amount, setAmount, mode, setMode, label = "Paid now", max }: { amount: number; setAmount: (n: number) => void; mode: PayMode; setMode: (m: PayMode) => void; label?: string; max?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr] sm:items-end">
      <Field label={label} hint={max !== undefined ? `Total ${inr(max)}. Anything left is added to dues.` : undefined}>
        <Input type="number" inputMode="decimal" min={0} value={Number.isFinite(amount) ? amount : ""} onChange={(e) => setAmount(Number(e.target.value))} />
      </Field>
      <Field group label="How"><Choice value={mode} onChange={setMode} options={PAY_MODES} /></Field>
    </div>
  );
}

/* ---------- Order ---------- */

function OrderForm({ form, onDone, recs, s }: FormProps) {
  const { run } = useBusiness();
  const nav = useNav();
  const editing = find(recs, "order", form.id);
  const lead = find(recs, "lead", preset(form, "lead_id"));
  const [party, setParty] = useState<PartyValue>(editing ? partyOf(recs, editing.data.customer_id) : lead ? { id: lead.data.customer_id, name: lead.data.name, phone: lead.data.phone } : partyOf(recs, preset(form, "customer_id")));
  const [lines, setLines] = useState<LineItem[]>(editing?.data.items ?? [blankLine()]);
  const [due, setDue] = useState(editing?.data.due_at ? localInput(editing.data.due_at) : "");
  const [advance, setAdvance] = useState(0);
  const [mode, setMode] = useState<PayMode>("upi");
  const [notes, setNotes] = useState(editing?.data.notes ?? (lead ? lead.data.want : ""));
  const [discount, setDiscount] = useState(editing ? find(recs, "bill", editing.data.bill_id)?.data.discount ?? 0 : 0);
  const label = s.labels.order.toLowerCase();
  const submit = () => {
    const due_at = due ? new Date(due).toISOString() : undefined;
    const ch = editing
      ? run((db) => editOrder(db, editing.id, { items: lines, due_at, notes, discount }))
      : run((db) => (lead ? convertLead(db, lead.id, { customer: party, items: lines, due_at, notes, advance, advance_mode: mode, discount }) : createOrder(db, { customer: party, items: lines, due_at, notes, advance, advance_mode: mode, discount })));
    if (!ch) return;
    onDone();
    const o = editing ?? ch.upsert.find((r) => r.kind === "order");
    if (o) nav.open({ t: "order", id: o.id });
  };
  return (
    <Shell title={editing ? `Change ${label} ${editing.data.number}` : lead ? `Turn ${lead.data.name}'s enquiry into an ${label}` : `New ${label}`}
      sub={editing ? "The bill is redone with the same number and stock is taken again." : "Saving makes the bill, records the advance, takes stock and sets the reminder."} onSubmit={submit}>
      {!editing && <PartyPicker recs={recs} value={party} onChange={setParty} label={s.labels.customer} showGstin={s.gst_mode === "regular"} />}
      <LinesEditor recs={recs} s={s} lines={lines} onChange={setLines} discount={discount} onDiscount={setDiscount} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Ready by (date and time)"><Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
        <Field label="Notes (message on cake, size, address)"><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      </div>
      {!editing && <PayRow amount={advance} setAmount={setAdvance} mode={mode} setMode={setMode} label="Advance paid" />}
    </Shell>
  );
}

/* ---------- Counter sale ---------- */

function SaleForm({ form, onDone, recs, s }: FormProps) {
  const { run } = useBusiness();
  const nav = useNav();
  const [party, setParty] = useState<PartyValue>(partyOf(recs, preset(form, "customer_id")));
  const [lines, setLines] = useState<LineItem[]>([blankLine()]);
  const [discount, setDiscount] = useState(0);
  const [mode, setMode] = useState<PayMode>("cash");
  const [full, setFull] = useState(true);
  const [paid, setPaid] = useState(0);
  const inter = s.gst_mode === "regular" && !!party.state && party.state !== s.state;
  const total = computeBill({ lines, gst_mode: s.gst_mode, inter_state: inter, prices_include_tax: s.prices_include_tax, discount }).total;
  const submit = () => {
    const ch = run((db) => quickSale(db, { customer: party.name || party.id ? party : undefined, items: lines, discount, paid: full ? total : paid, mode }));
    if (!ch) return;
    onDone();
    const b = ch.upsert.find((r) => r.kind === "bill");
    if (b) nav.open({ t: "bill", id: b.id });
  };
  return (
    <Shell title="New bill" sub="For a sale at the counter. Stock and your books update by themselves." onSubmit={submit} submit="Make bill">
      <PartyPicker recs={recs} value={party} onChange={setParty} label={`${s.labels.customer} (leave empty for walk-in)`} showGstin={s.gst_mode === "regular"} />
      {s.gst_mode === "regular" && !party.id && party.name && (
        <Field label="Their state" hint="Another state means IGST instead of CGST and SGST.">
          <select className={selectCls} value={party.state ?? s.state} onChange={(e) => setParty({ ...party, state: e.target.value })}>{STATES.map((x) => <option key={x}>{x}</option>)}</select>
        </Field>
      )}
      <LinesEditor recs={recs} s={s} lines={lines} onChange={setLines} discount={discount} onDiscount={setDiscount} interState={inter} />
      <div className="flex items-center gap-3"><Switch checked={full} onCheckedChange={setFull} id="full" /><label htmlFor="full" className="font-semibold">Paid in full</label></div>
      {full ? <Field group label="How"><Choice value={mode} onChange={setMode} options={PAY_MODES} /></Field> : <PayRow amount={paid} setAmount={setPaid} mode={mode} setMode={setMode} max={total} />}
    </Shell>
  );
}

/* ---------- Payments ---------- */

function PaymentForm({ form, onDone, recs }: FormProps) {
  const { run } = useBusiness();
  const bill = find(recs, "bill", preset(form, "bill_id"));
  const [party, setParty] = useState<PartyValue>(partyOf(recs, bill?.data.customer_id ?? preset(form, "customer_id")));
  const due = bill ? billBalance(recs, bill) : party.id ? customerDue(recs, party.id) : 0;
  const [amount, setAmount] = useState(due);
  const [mode, setMode] = useState<PayMode>("upi");
  const [date, setDate] = useState(today());
  useEffect(() => { if (!bill) setAmount(party.id ? customerDue(recs, party.id) : 0); }, [party.id, bill, recs]);
  const submit = () => {
    if (!bill && !party.id) return void run(() => { throw new Error("Pick who paid from your list."); });
    if (run((db) => receivePayment(db, { bill_id: bill?.id, customer_id: party.id, amount, mode, date }))) onDone();
  };
  return (
    <Shell title={bill ? `Payment on bill ${bill.data.number}` : "Money received"} sub={bill ? `${bill.data.customer_name} owes ${inr(due)} on this bill.` : "It is put against their oldest unpaid bills first, and their reminders stop when paid."} onSubmit={submit} submit="Save payment">
      {!bill && <PartyPicker recs={recs} value={party} onChange={setParty} label="From" />}
      {!bill && party.id && <p className="text-sm font-semibold">They owe {inr(due)} in all.</p>}
      <PayRow amount={amount} setAmount={setAmount} mode={mode} setMode={setMode} label="Amount" />
      <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
    </Shell>
  );
}

function SupplierPaymentForm({ form, onDone, recs }: FormProps) {
  const { run } = useBusiness();
  const [id, setId] = useState(preset(form, "supplier_id") ?? list(recs, "supplier")[0]?.id ?? "");
  const due = id ? supplierDue(recs, id) : 0;
  const [amount, setAmount] = useState(due);
  const [mode, setMode] = useState<PayMode>("upi");
  useEffect(() => setAmount(id ? supplierDue(recs, id) : 0), [id, recs]);
  return (
    <Shell title="Pay a supplier" onSubmit={() => { if (run((db) => paySupplier(db, id, amount, mode))) onDone(); }} submit="Save payment">
      <Field label="Supplier" hint={`You owe ${inr(due)}.`}>
        <select className={selectCls} value={id} onChange={(e) => setId(e.target.value)}>{list(recs, "supplier").map((x) => <option key={x.id} value={x.id}>{x.data.name}</option>)}</select>
      </Field>
      <PayRow amount={amount} setAmount={setAmount} mode={mode} setMode={setMode} label="Amount" />
    </Shell>
  );
}

/* ---------- Spending and buying ---------- */

function ExpenseForm({ form, onDone, recs }: FormProps) {
  const { run } = useBusiness();
  const cur = find(recs, "expense", form.id);
  const [category, setCategory] = useState(cur?.data.category ?? preset(form, "category") ?? "Rent");
  const [amount, setAmount] = useState(cur?.data.amount ?? 0);
  const [mode, setMode] = useState<PayMode>(cur?.data.mode ?? "cash");
  const [date, setDate] = useState(cur?.data.date ?? today());
  const [note, setNote] = useState(cur?.data.note ?? "");
  return (
    <Shell title={cur ? "Change expense" : "Money spent"} sub="Rent, bills, salary, transport: it goes straight into your profit and cash book." onSubmit={() => { if (run((db) => recordExpense(db, { category, amount, mode, date, note: note || undefined, staff_id: cur?.data.staff_id }, cur?.id))) onDone(); }}>
      <Field label="What for"><select className={selectCls} value={category} onChange={(e) => setCategory(e.target.value)}>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <PayRow amount={amount} setAmount={setAmount} mode={mode} setMode={setMode} label="Amount" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Note"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
    </Shell>
  );
}

function PurchaseForm({ form, onDone, recs, s }: FormProps) {
  const { run } = useBusiness();
  const sup = find(recs, "supplier", preset(form, "supplier_id"));
  const pre = preset(form, "item_id");
  const preItem = find(recs, "material", pre) ?? find(recs, "product", pre);
  const [party, setParty] = useState<PartyValue>(sup ? { id: sup.id, name: sup.data.name, phone: sup.data.phone } : { name: "" });
  const [lines, setLines] = useState<(LineItem & { material_id?: string })[]>(preItem
    ? [{ ...(preItem.kind === "material" ? { material_id: preItem.id } : { product_id: preItem.id }), name: preItem.data.name, unit: preItem.data.unit, qty: 1, price: preItem.kind === "material" ? preItem.data.cost : (preItem.data as Product).cost ?? 0, gst_rate: 0 }]
    : [blankLine()]);
  const [billNo, setBillNo] = useState("");
  const [date, setDate] = useState(today());
  const [mode, setMode] = useState<PayMode>("cash");
  const [paid, setPaid] = useState<number>(NaN);
  const total = Math.round(lines.reduce((a, l) => a + l.qty * l.price * (1 + (s.gst_mode === "regular" ? (l.gst_rate || 0) / 100 : 0)), 0));
  return (
    <Shell title="Stock bought" sub="Adds to stock, updates the cost price, and keeps what you still owe the supplier." onSubmit={() => { if (run((db) => recordPurchase(db, { supplier: party, bill_no: billNo || undefined, date, lines, paid: Number.isFinite(paid) ? paid : total, mode }))) onDone(); }}>
      <PartyPicker recs={recs} kind="supplier" value={party} onChange={setParty} label="Supplier (or market)" />
      <LinesEditor recs={recs} s={s} lines={lines} onChange={setLines} purchase />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Their bill number"><Input value={billNo} onChange={(e) => setBillNo(e.target.value)} /></Field>
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      </div>
      <PayRow amount={Number.isFinite(paid) ? paid : total} setAmount={setPaid} mode={mode} setMode={setMode} max={total} label="Paid now" />
    </Shell>
  );
}

/* ---------- Leads and appointments ---------- */

const SOURCES = ["Walk-in", "Phone call", "WhatsApp", "Instagram", "Facebook", "Google", "JustDial", "Referral", "Website", "Other"];

function LeadForm({ form, onDone, recs }: FormProps) {
  const { run } = useBusiness();
  const cur = find(recs, "lead", form.id);
  const [name, setName] = useState(cur?.data.name ?? "");
  const [phone, setPhone] = useState(cur?.data.phone ?? "");
  const [want, setWant] = useState(cur?.data.want ?? "");
  const [source, setSource] = useState(cur?.data.source ?? "WhatsApp");
  const [value, setValue] = useState(cur?.data.value ?? 0);
  const [next, setNext] = useState(cur?.data.next_at ?? "");
  return (
    <Shell title={cur ? "Change enquiry" : "New enquiry"} sub="Follow-ups are set by themselves, and stop when they say yes or no." onSubmit={() => {
      if (!name.trim()) return void run(() => { throw new Error("Enter a name."); });
      if (run((db) => saveLead(db, { name: name.trim(), phone: phone || undefined, want, source, value: value || undefined, next_at: next || undefined, status: (cur?.data.status ?? "new") as LeadStatus, customer_id: cur?.data.customer_id, order_id: cur?.data.order_id }, cur?.id))) onDone();
    }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Phone"><Input value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} /></Field>
      </div>
      <Field label="What they want"><Input value={want} onChange={(e) => setWant(e.target.value)} placeholder="2 kg cake for Sunday, wedding order, AC service" /></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Came from"><select className={selectCls} value={source} onChange={(e) => setSource(e.target.value)}>{SOURCES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Likely value ₹"><Input type="number" min={0} value={value || ""} onChange={(e) => setValue(Number(e.target.value))} /></Field>
        <Field label="Follow up on" hint="Empty: day 2 and day 5"><Input type="date" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
      </div>
    </Shell>
  );
}

function ApptForm({ form, onDone, recs, s }: FormProps) {
  const { run } = useBusiness();
  const cur = find(recs, "appointment", form.id);
  const services = list(recs, "product").filter((p) => p.data.active);
  const [party, setParty] = useState<PartyValue>(cur ? partyOf(recs, cur.data.customer_id) : partyOf(recs, preset(form, "customer_id")));
  const [pid, setPid] = useState(cur?.data.product_id ?? services.find((p) => p.data.type === "service")?.id ?? "");
  const p = services.find((x) => x.id === pid);
  const [service, setService] = useState(cur?.data.service ?? p?.data.name ?? "");
  const [price, setPrice] = useState(cur?.data.price ?? p?.data.price ?? 0);
  const [mins, setMins] = useState(cur?.data.duration_min ?? p?.data.duration_min ?? 30);
  const defaultStart = () => { const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0); return localInput(d.toISOString()); };
  const [start, setStart] = useState(cur ? localInput(cur.data.start_at) : (preset(form, "start") ?? defaultStart()));
  const [staff, setStaff] = useState(cur?.data.staff_id ?? "");
  const pick = (id: string) => {
    setPid(id);
    const x = services.find((q) => q.id === id);
    if (x) { setService(x.data.name); setPrice(x.data.price); setMins(x.data.duration_min ?? 30); }
  };
  const clash = list(recs, "appointment").find((a) => a.id !== cur?.id && a.data.status === "booked" && (!staff || a.data.staff_id === staff) && Math.abs(Date.parse(a.data.start_at) - Date.parse(start)) < Math.max(a.data.duration_min, mins) * 60_000);
  return (
    <Shell title={cur ? `Move ${s.labels.order.toLowerCase()}` : `Book ${s.labels.order.toLowerCase()}`} sub="A reminder for them is set before the time. When done, the bill is made in one tap." onSubmit={() => {
      if (!party.name && !party.id) return void run(() => { throw new Error(`Enter the ${s.labels.customer.toLowerCase()}'s name.`); });
      if (run((db) => bookAppointment(db, { customer: party, product_id: pid || undefined, service, price, staff_id: staff || undefined, start_at: new Date(start).toISOString(), duration_min: mins }, cur?.id))) onDone();
    }}>
      <PartyPicker recs={recs} value={party} onChange={setParty} label={s.labels.customer} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={s.labels.product}><select className={selectCls} value={pid} onChange={(e) => pick(e.target.value)}><option value="">Other</option>{services.map((x) => <option key={x.id} value={x.id}>{x.data.name}</option>)}</select></Field>
        {!pid && <Field label="Name"><Input value={service} onChange={(e) => setService(e.target.value)} /></Field>}
        <Field label="Price ₹"><Input type="number" min={0} value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} /></Field>
        <Field label="When"><Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="Minutes"><Input type="number" min={5} step={5} value={mins} onChange={(e) => setMins(Number(e.target.value))} /></Field>
        {list(recs, "staff").length > 0 && (
          <Field label="With"><select className={selectCls} value={staff} onChange={(e) => setStaff(e.target.value)}><option value="">Anyone</option>{list(recs, "staff").filter((x) => x.data.active).map((x) => <option key={x.id} value={x.id}>{x.data.name}</option>)}</select></Field>
        )}
      </div>
      {clash && <p className="rounded-xl bg-coral/40 p-3 text-sm font-semibold">This overlaps with {clash.data.customer_name} at {new Date(clash.data.start_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}.</p>}
    </Shell>
  );
}

/* ---------- Lists: customers, items, suppliers, staff ---------- */

function CustomerForm({ form, onDone, recs, s }: FormProps) {
  const { run } = useBusiness();
  const cur = find(recs, "customer", form.id);
  const [d, setD] = useState<RecordKinds["customer"]>(cur?.data ?? { name: "" });
  const set = (k: keyof RecordKinds["customer"], v: string) => setD({ ...d, [k]: v || undefined });
  return (
    <Shell title={cur ? `Change ${d.name}` : `New ${s.labels.customer.toLowerCase()}`} onSubmit={() => {
      if (!d.name?.trim()) return void run(() => { throw new Error("Enter a name."); });
      if (d.gstin && !validGstin(d.gstin)) return void run(() => { throw new Error("That GSTIN does not look right. Check it or leave it empty."); });
      if (run((db) => saveRecord(db, "customer", { ...d, name: d.name.trim(), gstin: d.gstin?.toUpperCase() }, cur?.id))) onDone();
    }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name"><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
        <Field label="Phone"><Input value={d.phone ?? ""} inputMode="tel" onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={d.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Birthday" hint="A wish is put on your list the week before"><Input type="date" value={d.birthday ?? ""} onChange={(e) => set("birthday", e.target.value)} /></Field>
        <Field label="Address" className="sm:col-span-2"><Input value={d.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
        <Field label="State"><select className={selectCls} value={d.state ?? ""} onChange={(e) => set("state", e.target.value)}><option value="">Same as mine</option>{STATES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="GSTIN (business buyers)"><Input value={d.gstin ?? ""} onChange={(e) => set("gstin", e.target.value)} /></Field>
        <Field label="Notes" className="sm:col-span-2"><Textarea rows={2} value={d.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></Field>
      </div>
    </Shell>
  );
}

function ProductForm({ form, onDone, recs, s }: FormProps) {
  const { run } = useBusiness();
  const cur = find(recs, "product", form.id);
  const mats = list(recs, "material");
  const [d, setD] = useState<Product>(cur?.data ?? { name: "", type: preset(form, "type") === "service" ? "service" : "product", unit: "pc", price: 0, gst_rate: 0, stock_mode: "none", active: true, on_site: true });
  const [opening, setOpening] = useState(0);
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setD({ ...d, [k]: v });
  const recipe = d.recipe ?? [];
  const cost = recipe.reduce((a, r) => a + (mats.find((m) => m.id === r.material_id)?.data.cost ?? 0) * r.qty, 0);
  const submit = () => {
    if (!d.name.trim()) return void run(() => { throw new Error("Enter a name."); });
    const data: Product = { ...d, name: d.name.trim(), recipe: d.stock_mode === "recipe" ? recipe.filter((r) => r.material_id && r.qty > 0) : undefined, low_at: d.stock_mode === "self" ? d.low_at : undefined };
    if (run((db) => {
      const { change, id } = saveRecord(db, "product", data, cur?.id);
      return opening > 0 && data.stock_mode === "self" ? mergeChanges(change, adjustStock(applyChange(db, change), id, "product", opening)) : change;
    })) onDone();
  };
  return (
    <Shell title={cur ? `Change ${cur.data.name}` : `New ${s.labels.product.toLowerCase()}`} onSubmit={submit}>
      <Choice value={d.type} onChange={(v) => setD({ ...d, type: v, stock_mode: v === "service" ? "none" : d.stock_mode })} options={[["product", "Something I sell"], ["service", "A service I do"]]} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name" className="sm:col-span-3"><Input value={d.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label={`Price ₹${s.gst_mode === "regular" ? (s.prices_include_tax ? " (with GST)" : " (before GST)") : ""}`}><Input type="number" min={0} step="any" value={d.price || ""} onChange={(e) => set("price", Number(e.target.value))} /></Field>
        <Field label="Per (unit)"><Input value={d.unit} onChange={(e) => set("unit", e.target.value)} placeholder="pc, kg, box, visit" /></Field>
        {s.gst_mode === "regular" ? (
          <Field label="GST rate" hint="Check the rate for your item with your CA"><select className={selectCls} value={d.gst_rate} onChange={(e) => set("gst_rate", Number(e.target.value))}>{GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}</select></Field>
        ) : <Field label="Cost to you ₹"><Input type="number" min={0} step="any" value={d.cost || ""} onChange={(e) => set("cost", Number(e.target.value))} /></Field>}
        {s.gst_mode === "regular" && <Field label="HSN or SAC code"><Input value={d.hsn ?? ""} onChange={(e) => set("hsn", e.target.value || undefined)} /></Field>}
        {d.type === "service" && <Field label="Takes (minutes)"><Input type="number" min={0} step={5} value={d.duration_min ?? ""} onChange={(e) => set("duration_min", Number(e.target.value))} /></Field>}
      </div>
      {d.type === "product" && (
        <Field group label="Stock">
          <Choice value={d.stock_mode} onChange={(v) => set("stock_mode", v)} options={[["none", "Don't track"], ["self", "Count pieces"], ["recipe", "Made from materials"]]} />
        </Field>
      )}
      {d.stock_mode === "self" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Warn me when it falls to"><Input type="number" min={0} value={d.low_at ?? ""} onChange={(e) => set("low_at", Number(e.target.value))} /></Field>
          {!cur ? <Field label="How many you have now"><Input type="number" min={0} value={opening || ""} onChange={(e) => setOpening(Number(e.target.value))} /></Field> : <p className="self-end text-sm">In stock now: <b>{stockOf(recs, cur.id)}</b> {d.unit}. Change it from Stock.</p>}
        </div>
      )}
      {d.stock_mode === "recipe" && (
        <div className="space-y-2 rounded-xl border-2 border-ink/20 p-3">
          <p className="text-sm font-semibold">What one {d.unit} uses. Each sale takes these from stock.</p>
          {!mats.length && <p className="text-sm text-muted-foreground">Add your raw materials in Stock first.</p>}
          {recipe.map((r, i) => (
            <div key={i} className="flex gap-2">
              <select className={selectCls} value={r.material_id} onChange={(e) => set("recipe", recipe.map((x, j) => (j === i ? { ...x, material_id: e.target.value } : x)))}>
                <option value="">Pick a material</option>{mats.map((m) => <option key={m.id} value={m.id}>{m.data.name} ({m.data.unit})</option>)}
              </select>
              <Input className="w-28" type="number" min={0} step="any" value={r.qty || ""} onChange={(e) => set("recipe", recipe.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))} aria-label="Quantity" />
              <Button type="button" variant="ghost" size="icon" onClick={() => set("recipe", recipe.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 /></Button>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <Button type="button" size="sm" variant="outline" onClick={() => set("recipe", [...recipe, { material_id: "", qty: 0 }])}><Plus /> Add material</Button>
            {cost > 0 && <p className="text-sm">Material cost: <b>{inr(cost)}</b>{d.price > 0 && <> · margin <b>{Math.round(((d.price - cost) / d.price) * 100)}%</b></>}</p>}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 font-semibold"><Switch checked={d.on_site} onCheckedChange={(v) => set("on_site", v)} /> Show on my website</label>
        <label className="flex items-center gap-2 font-semibold"><Switch checked={d.active} onCheckedChange={(v) => set("active", v)} /> Selling now</label>
      </div>
    </Shell>
  );
}

function MaterialForm({ form, onDone, recs }: FormProps) {
  const { run } = useBusiness();
  const cur = find(recs, "material", form.id);
  const [d, setD] = useState<RecordKinds["material"]>(cur?.data ?? { name: "", unit: "kg", cost: 0, low_at: 0 });
  const [opening, setOpening] = useState(0);
  return (
    <Shell title={cur ? `Change ${cur.data.name}` : "New raw material"} sub="Things you make your products from: flour, cloth, spare parts." onSubmit={() => {
      if (!d.name.trim()) return void run(() => { throw new Error("Enter a name."); });
      if (run((db) => {
        const { change, id } = saveRecord(db, "material", { ...d, name: d.name.trim() }, cur?.id);
        return opening > 0 ? mergeChanges(change, adjustStock(applyChange(db, change), id, "material", opening)) : change;
      })) onDone();
    }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name"><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
        <Field label="Unit"><Input value={d.unit} onChange={(e) => setD({ ...d, unit: e.target.value })} /></Field>
        <Field label="Cost per unit ₹"><Input type="number" min={0} step="any" value={d.cost || ""} onChange={(e) => setD({ ...d, cost: Number(e.target.value) })} /></Field>
        <Field label="Warn me when it falls to"><Input type="number" min={0} step="any" value={d.low_at || ""} onChange={(e) => setD({ ...d, low_at: Number(e.target.value) })} /></Field>
        {!cur && <Field label="How much you have now"><Input type="number" min={0} step="any" value={opening || ""} onChange={(e) => setOpening(Number(e.target.value))} /></Field>}
      </div>
    </Shell>
  );
}

function SupplierForm({ form, onDone, recs }: FormProps) {
  const { run } = useBusiness();
  const cur = find(recs, "supplier", form.id);
  const [d, setD] = useState<RecordKinds["supplier"]>(cur?.data ?? { name: "" });
  return (
    <Shell title={cur ? `Change ${cur.data.name}` : "New supplier"} onSubmit={() => { if (d.name.trim() && run((db) => saveRecord(db, "supplier", { ...d, name: d.name.trim() }, cur?.id))) onDone(); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name"><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
        <Field label="Phone"><Input value={d.phone ?? ""} onChange={(e) => setD({ ...d, phone: e.target.value || undefined })} /></Field>
        <Field label="GSTIN"><Input value={d.gstin ?? ""} onChange={(e) => setD({ ...d, gstin: e.target.value || undefined })} /></Field>
        <Field label="What they supply"><Input value={d.items ?? ""} onChange={(e) => setD({ ...d, items: e.target.value || undefined })} /></Field>
      </div>
    </Shell>
  );
}

function StaffForm({ form, onDone, recs }: FormProps) {
  const { run } = useBusiness();
  const cur = find(recs, "staff", form.id);
  const [d, setD] = useState<RecordKinds["staff"]>(cur?.data ?? { name: "", role: "Helper", monthly_pay: 0, active: true, joined: today() });
  return (
    <Shell title={cur ? `Change ${cur.data.name}` : "New staff member"} onSubmit={() => { if (d.name.trim() && run((db) => saveRecord(db, "staff", { ...d, name: d.name.trim() }, cur?.id))) onDone(); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name"><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
        <Field label="Phone"><Input value={d.phone ?? ""} onChange={(e) => setD({ ...d, phone: e.target.value || undefined })} /></Field>
        <Field label="Work"><Input value={d.role} onChange={(e) => setD({ ...d, role: e.target.value })} /></Field>
        <Field label="Monthly pay ₹"><Input type="number" min={0} value={d.monthly_pay || ""} onChange={(e) => setD({ ...d, monthly_pay: Number(e.target.value) })} /></Field>
        <Field label="Joined"><Input type="date" value={d.joined ?? ""} onChange={(e) => setD({ ...d, joined: e.target.value })} /></Field>
        <label className="flex items-center gap-2 self-end pb-2 font-semibold"><Switch checked={d.active} onCheckedChange={(v) => setD({ ...d, active: v })} /> Working here now</label>
      </div>
    </Shell>
  );
}

function ReminderForm({ form, onDone, recs }: FormProps) {
  const { run } = useBusiness();
  const c = find(recs, "customer", preset(form, "customer_id"));
  const [to, setTo] = useState(c?.data.name ?? "You");
  const [phone, setPhone] = useState(c?.data.phone ?? "");
  const [at, setAt] = useState(localInput(new Date(Date.now() + 86_400_000).toISOString()));
  const [text, setText] = useState("");
  return (
    <Shell title="New reminder" onSubmit={() => { if (text.trim() && run((db) => addReminder(db, { due_at: new Date(at).toISOString(), kind: "custom", customer_id: c?.id, phone: phone || undefined, to_name: to, text: text.trim() }))) onDone(); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="For"><Input value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        <Field label="Their phone (to send it on WhatsApp)"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <Field label="When"><Input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} /></Field>
      </div>
      <Field label="Message or task"><Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} /></Field>
    </Shell>
  );
}

function CampaignForm({ form, onDone, recs }: FormProps) {
  const { run, db } = useBusiness();
  const nav = useNav();
  const cur = find(recs, "campaign", form.id);
  const [d, setD] = useState<Campaign>(cur?.data ?? { title: CAMPAIGN_TEMPLATES[0].title, message: CAMPAIGN_TEMPLATES[0].message, audience: "all", send_on: today(), sent_to: [], status: "ready" });
  const count = useMemo(() => campaignAudience(recs, d.audience).length, [recs, d.audience]);
  return (
    <Shell title={cur ? "Change message" : "New offer or message"} sub="You send it from your own WhatsApp, one tap per person. Free, and no risk to your number." onSubmit={() => {
      const ch = run((x) => saveRecord(x, "campaign", d, cur?.id));
      if (ch) { onDone(); nav.go("marketing"); }
    }}>
      {!cur && <div className="flex flex-wrap gap-1.5">{CAMPAIGN_TEMPLATES.map((t) => <button key={t.title} type="button" onClick={() => setD({ ...d, title: t.title, message: t.message })} className="rounded-full border-2 border-ink bg-card px-3 py-1 text-sm font-semibold hover:bg-sun">{t.title}</button>)}</div>}
      <Field label="Name"><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
      <Field label="Message" hint={`{name} becomes each person's name, {shop} becomes ${db?.ws.name ?? "your shop"}.`}><Textarea rows={4} value={d.message} onChange={(e) => setD({ ...d, message: e.target.value })} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Send to" hint={`${count} people with a phone number`}>
          <select className={selectCls} value={d.audience} onChange={(e) => setD({ ...d, audience: e.target.value as Campaign["audience"] })}>
            <option value="all">Everyone</option><option value="regulars">Regulars (3 or more bills)</option><option value="lapsed">Not seen in 45 days</option><option value="birthdays">Birthdays this week</option><option value="leads">Open enquiries</option>
          </select>
        </Field>
        <Field label="Send on"><Input type="date" value={d.send_on} onChange={(e) => setD({ ...d, send_on: e.target.value })} /></Field>
      </div>
    </Shell>
  );
}

function LicenceForm({ form, onDone, recs }: FormProps) {
  const { run } = useBusiness();
  const cur = find(recs, "licence", form.id);
  const [d, setD] = useState<RecordKinds["licence"]>(cur?.data ?? { name: "FSSAI licence", expires_on: addDays(today(), 365) });
  return (
    <Shell title={cur ? "Change licence" : "Add a licence or renewal"} sub="Shop licence, FSSAI, trade licence, insurance: a reminder comes 30 days before it ends." onSubmit={() => { if (d.name.trim() && run((x) => saveRecord(x, "licence", d, cur?.id))) onDone(); }}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name"><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
        <Field label="Number"><Input value={d.number ?? ""} onChange={(e) => setD({ ...d, number: e.target.value || undefined })} /></Field>
        <Field label="Ends on"><Input type="date" value={d.expires_on} onChange={(e) => setD({ ...d, expires_on: e.target.value })} /></Field>
      </div>
    </Shell>
  );
}

const FORMS: Record<FormOpen["kind"], (p: FormProps) => JSX.Element> = {
  order: OrderForm, sale: SaleForm, payment: PaymentForm, supplier_payment: SupplierPaymentForm, expense: ExpenseForm, purchase: PurchaseForm,
  lead: LeadForm, appointment: ApptForm, customer: CustomerForm, product: ProductForm, material: MaterialForm, supplier: SupplierForm,
  staff: StaffForm, reminder: ReminderForm, campaign: CampaignForm, licence: LicenceForm,
};
