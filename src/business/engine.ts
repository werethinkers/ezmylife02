/* My Business engine: what each action does to the books. Pure code, no AI and no network.
   Every action takes the current data and returns one Change, so one entry can make a bill, record the
   advance, take stock, set reminders and update the customer, and the store saves it all together.
   The owner sees each of these as a plain line ("Bill B-0012 made"). */

import type {
  AnyRec, Appointment, ApptStatus, AttendanceMark, Bill, Change, Customer, Expense, Kind, Lead, LeadStatus, LineItem, Order,
  OrderStatus, PayMode, Product, Rec, RecordKinds, Reminder, ReminderStatus, Settings, StockMove, Workspace,
} from "./types";
import { type BizType, compositionRateFor, defaultGstMode, labelsFor, modulesFor, startersFor } from "./catalog";
import { computeBill, r2 } from "./gst";
import { addDays, inr, num, today } from "./format";
import { texts } from "./whatsapp";

export interface Db { ws: Workspace; recs: AnyRec[] }

export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16));

const nowIso = () => new Date().toISOString();

export function list<K extends Kind>(recs: AnyRec[], kind: K): Rec<K>[] {
  return recs.filter((r) => r.kind === kind) as Rec<K>[];
}

const digits = (p?: string) => (p ?? "").replace(/\D/g, "").slice(-10);

/** Collects what one action changes, and lets later steps see earlier ones. */
class Tx {
  private up = new Map<string, AnyRec>();
  private rm = new Set<string>();
  private set: Partial<Settings> = {};
  notes: string[] = [];
  private ids: Set<string>;
  constructor(private db: Db) {
    this.ids = new Set(db.recs.map((r) => r.id));
  }

  get s(): Settings {
    return { ...this.db.ws.settings, ...this.set };
  }
  get shop(): string {
    return this.db.ws.name;
  }
  get recs(): AnyRec[] {
    const out: AnyRec[] = [];
    for (const r of this.db.recs) if (!this.rm.has(r.id)) out.push(this.up.get(r.id) ?? r);
    for (const r of this.up.values()) if (!this.ids.has(r.id)) out.push(r);
    return out;
  }
  all<K extends Kind>(kind: K): Rec<K>[] {
    return list(this.recs, kind);
  }
  find<K extends Kind>(kind: K, id?: string): Rec<K> | undefined {
    if (!id || this.rm.has(id)) return undefined;
    const r = this.up.get(id) ?? this.db.recs.find((x) => x.id === id);
    return r && r.kind === kind ? (r as Rec<K>) : undefined;
  }
  add<K extends Kind>(kind: K, data: RecordKinds[K], id = uid()): Rec<K> {
    const t = nowIso();
    const rec = { id, kind, data, created_at: t, updated_at: t } as Rec<K>;
    this.up.set(id, rec as AnyRec);
    return rec;
  }
  patch<K extends Kind>(rec: Rec<K>, patch: Partial<RecordKinds[K]>): Rec<K> {
    const cur = (this.up.get(rec.id) as Rec<K> | undefined) ?? rec;
    const next = { ...cur, data: { ...cur.data, ...patch }, updated_at: nowIso() } as Rec<K>;
    this.up.set(rec.id, next as AnyRec);
    return next;
  }
  del(id: string) {
    this.up.delete(id);
    this.rm.add(id);
  }
  settings(patch: Partial<Settings>) {
    Object.assign(this.set, patch);
  }
  note(line: string) {
    this.notes.push(line);
  }
  /** Next number for bills, orders or purchases, like B-0012. */
  next(which: "bill" | "order" | "purchase"): string {
    const s = this.s;
    const n = (s.counters[which] ?? 0) + 1;
    this.settings({ counters: { ...s.counters, [which]: n } });
    const prefix = which === "bill" ? s.bill_prefix : which === "order" ? s.order_prefix : s.purchase_prefix;
    return `${prefix}${String(n).padStart(4, "0")}`;
  }
  done(): Change {
    return { upsert: [...this.up.values()], remove: [...this.rm], settings: Object.keys(this.set).length ? this.set : undefined, notes: this.notes };
  }
}

/* ---------- Reading the books ---------- */

export function stockOf(recs: AnyRec[], itemId: string): number {
  let q = 0;
  for (const r of recs) if (r.kind === "stock_move" && r.data.item_id === itemId) q += r.data.qty;
  return r2(q);
}

export function paidOnBill(recs: AnyRec[], billId: string): number {
  let p = 0;
  for (const r of recs) if (r.kind === "payment" && r.data.bill_id === billId) p += r.data.direction === "in" ? r.data.amount : -r.data.amount;
  return r2(p);
}

export function billBalance(recs: AnyRec[], bill: Rec<"bill">): number {
  if (bill.data.cancelled) return 0;
  return r2(bill.data.total - paidOnBill(recs, bill.id));
}

/** Money a customer still owes, across all their bills. */
export function customerDue(recs: AnyRec[], customerId: string): number {
  return r2(list(recs, "bill").filter((b) => b.data.customer_id === customerId).reduce((a, b) => a + Math.max(0, billBalance(recs, b)), 0));
}

/** Money still owed to a supplier. */
export function supplierDue(recs: AnyRec[], supplierId: string): number {
  const bought = list(recs, "purchase").filter((p) => p.data.supplier_id === supplierId).reduce((a, p) => a + p.data.total, 0);
  const paid = list(recs, "payment").filter((p) => p.data.direction === "out" && p.data.supplier_id === supplierId).reduce((a, p) => a + p.data.amount, 0);
  return r2(bought - paid);
}

export function orderTotal(recs: AnyRec[], s: Settings, o: Rec<"order">): number {
  const bill = o.data.bill_id ? list(recs, "bill").find((b) => b.id === o.data.bill_id) : undefined;
  if (bill) return bill.data.total;
  return computeBill({ lines: o.data.items, gst_mode: s.gst_mode, inter_state: false, prices_include_tax: s.prices_include_tax }).total;
}

/** Products made or sold, and what they take from stock. */
function stockNeeds(tx: Tx, items: LineItem[]): Map<string, { kind: "product" | "material"; qty: number; name: string; unit: string }> {
  const need = new Map<string, { kind: "product" | "material"; qty: number; name: string; unit: string }>();
  const addNeed = (id: string, kind: "product" | "material", qty: number, name: string, unit: string) => {
    const cur = need.get(id);
    need.set(id, { kind, qty: r2((cur?.qty ?? 0) + qty), name, unit });
  };
  for (const it of items) {
    const p = tx.find("product", it.product_id);
    if (!p) continue;
    if (p.data.stock_mode === "self") addNeed(p.id, "product", it.qty, p.data.name, p.data.unit);
    if (p.data.stock_mode === "recipe") {
      for (const part of p.data.recipe ?? []) {
        const m = tx.find("material", part.material_id);
        if (m) addNeed(m.id, "material", part.qty * it.qty, m.data.name, m.data.unit);
      }
    }
  }
  return need;
}

/** Takes stock for a sale (sign -1) or puts it back (sign +1), and warns when anything runs low. */
function moveStock(tx: Tx, items: LineItem[], refId: string, date: string, sign: -1 | 1) {
  const need = stockNeeds(tx, items);
  if (!need.size) return;
  const used: string[] = [];
  for (const [id, n] of need) {
    tx.add("stock_move", { date, item_id: id, item_kind: n.kind, qty: sign * n.qty, reason: sign < 0 ? (n.kind === "material" ? "used" : "sale") : "return", ref_id: refId });
    used.push(`${n.name} ${num(n.qty)} ${n.unit}`);
  }
  tx.note(sign < 0 ? `Taken from stock: ${used.join(", ")}` : `Put back in stock: ${used.join(", ")}`);
  if (sign < 0) checkLow(tx, [...need.keys()]);
}

function checkLow(tx: Tx, ids: string[]) {
  const recs = tx.recs;
  for (const id of ids) {
    const item = tx.find("material", id) ?? tx.find("product", id);
    if (!item) continue;
    const low = item.data.low_at ?? 0;
    const left = stockOf(recs, id);
    if (low <= 0 || left > low) continue;
    const open = tx.all("reminder").some((r) => r.data.kind === "stock" && r.data.ref_id === id && r.data.status === "open");
    if (open) continue;
    const unit = item.data.unit;
    tx.add("reminder", { due_at: nowIso(), kind: "stock", to_name: "You", text: `${item.data.name} is low: ${num(left)} ${unit} left. Time to buy more.`, ref_id: id, status: "open" });
    tx.note(`${item.data.name} is running low (${num(left)} ${unit} left), so a reminder to buy more is on your list`);
  }
}

function closeReminders(tx: Tx, refId: string, kinds?: Reminder["kind"][]) {
  for (const r of tx.all("reminder")) {
    if (r.data.ref_id === refId && r.data.status === "open" && (!kinds || kinds.includes(r.data.kind))) tx.patch(r, { status: "done" });
  }
}

/* ---------- People ---------- */

export interface PartyIn { id?: string; name: string; phone?: string; state?: string; gstin?: string }

/** Finds the customer by id or phone, or adds them. Fills in a missing phone or state. */
function ensureCustomer(tx: Tx, p: PartyIn): Rec<"customer"> | undefined {
  const name = p.name.trim();
  if (!p.id && !name) return undefined;
  let c = tx.find("customer", p.id);
  if (!c && digits(p.phone).length === 10) c = tx.all("customer").find((x) => digits(x.data.phone) === digits(p.phone));
  if (!c && !digits(p.phone) && name) c = tx.all("customer").find((x) => x.data.name.toLowerCase() === name.toLowerCase());
  if (!c) {
    c = tx.add("customer", { name, phone: p.phone?.trim() || undefined, state: p.state, gstin: p.gstin?.trim().toUpperCase() || undefined });
    tx.note(`${name} added to your ${tx.s.labels.customers.toLowerCase()}`);
    return c;
  }
  const patch: Partial<Customer> = {};
  if (!c.data.phone && p.phone) patch.phone = p.phone.trim();
  if (!c.data.state && p.state) patch.state = p.state;
  if (!c.data.gstin && p.gstin) patch.gstin = p.gstin.trim().toUpperCase();
  return Object.keys(patch).length ? tx.patch(c, patch) : c;
}

function ensureSupplier(tx: Tx, p: PartyIn): Rec<"supplier"> | undefined {
  const name = p.name.trim();
  let s = tx.find("supplier", p.id);
  if (!s && name) s = tx.all("supplier").find((x) => x.data.name.toLowerCase() === name.toLowerCase());
  if (!s && name) {
    s = tx.add("supplier", { name, phone: p.phone?.trim() || undefined, gstin: p.gstin?.trim().toUpperCase() || undefined });
    tx.note(`${name} added to your suppliers`);
  }
  return s;
}

/* ---------- Bills and payments ---------- */

interface BillIn { customer?: Rec<"customer">; customer_name: string; phone?: string; lines: LineItem[]; discount?: number; date: string; order_id?: string; appointment_id?: string; notes?: string }

function makeBill(tx: Tx, b: BillIn): Rec<"bill"> {
  const s = tx.s;
  const inter = s.gst_mode === "regular" && !!b.customer?.data.state && !!s.state && b.customer.data.state !== s.state;
  const m = computeBill({ lines: b.lines, gst_mode: s.gst_mode, inter_state: inter, prices_include_tax: s.prices_include_tax, discount: b.discount });
  const bill = tx.add("bill", {
    number: tx.next("bill"), date: b.date, customer_id: b.customer?.id, customer_name: b.customer?.data.name ?? (b.customer_name || "Walk-in customer"),
    phone: b.customer?.data.phone ?? b.phone, customer_gstin: b.customer?.data.gstin, order_id: b.order_id, appointment_id: b.appointment_id,
    gst_mode: s.gst_mode, inter_state: inter, ...m, notes: b.notes,
  });
  const tax = m.cgst + m.sgst + m.igst;
  tx.note(`Bill ${bill.data.number} made for ${inr(m.total)}${tax > 0 ? ` (GST ${inr(tax)})` : ""}`);
  return bill;
}

function addPaymentIn(tx: Tx, bill: Rec<"bill">, amount: number, mode: PayMode, date: string, note?: string) {
  if (amount <= 0) return;
  tx.add("payment", { date, amount: r2(amount), mode, direction: "in", customer_id: bill.data.customer_id, bill_id: bill.id, note });
  tx.note(`${inr(amount)} received by ${modeName(mode)} on bill ${bill.data.number}`);
}

export const modeName = (m: PayMode) => ({ cash: "cash", upi: "UPI", card: "card", bank: "bank transfer" })[m];

/** Sets dues reminders on the days the owner chose (by default 3 and 7 days after). */
function scheduleDues(tx: Tx, bill: Rec<"bill">, from: string) {
  const balance = billBalance(tx.recs, bill);
  if (balance <= 0 || !bill.data.customer_id) return;
  closeReminders(tx, bill.id, ["dues"]);
  const days = tx.s.reminders.dues_days;
  days.forEach((d, i) => {
    tx.add("reminder", {
      due_at: `${addDays(from, d)}T10:00:00.000Z`, kind: "dues", customer_id: bill.data.customer_id, phone: bill.data.phone, to_name: bill.data.customer_name,
      text: texts.dues(tx.s, tx.shop, bill.data.customer_name, balance, bill.data.number), ref_id: bill.id, status: "open", step: i + 1,
    });
  });
  if (days.length) tx.note(`${inr(balance)} is still to come, so dues reminders are set for day ${days.join(" and day ")}`);
}

/** Rewrites open dues reminders after a part payment, or closes them when the bill is paid. */
function refreshDues(tx: Tx, bill: Rec<"bill">) {
  const balance = billBalance(tx.recs, bill);
  for (const r of tx.all("reminder")) {
    if (r.data.ref_id !== bill.id || r.data.kind !== "dues" || r.data.status !== "open") continue;
    if (balance <= 0) tx.patch(r, { status: "done" });
    else tx.patch(r, { text: texts.dues(tx.s, tx.shop, bill.data.customer_name, balance, bill.data.number) });
  }
  if (balance <= 0) tx.note(`Bill ${bill.data.number} is fully paid, so its dues reminders are closed`);
}

/* ---------- Orders ---------- */

export interface OrderIn {
  customer: PartyIn;
  items: LineItem[];
  due_at?: string;
  source?: string;
  notes?: string;
  advance?: number;
  advance_mode?: PayMode;
  discount?: number;
}

function orderEffects(tx: Tx, order: Rec<"order">, customer: Rec<"customer"> | undefined, discount: number, advance: number, mode: PayMode) {
  const date = today();
  const bill = makeBill(tx, { customer, customer_name: order.data.customer_name, phone: order.data.phone, lines: order.data.items, discount, date, order_id: order.id });
  tx.patch(order, { bill_id: bill.id });
  addPaymentIn(tx, bill, Math.min(advance, bill.data.total), mode, date, "Advance");
  moveStock(tx, order.data.items, order.id, date, -1);
  if (order.data.due_at) {
    const hours = tx.s.reminders.pickup_hours_before;
    const at = new Date(Date.parse(order.data.due_at) - hours * 3_600_000).toISOString();
    tx.add("reminder", { due_at: at, kind: "pickup", customer_id: customer?.id, phone: order.data.phone, to_name: order.data.customer_name, text: texts.pickup(tx.s, tx.shop, order.data), ref_id: order.id, status: "open" });
    tx.note(`Reminder set ${hours} hours before it is due`);
  }
  return bill;
}

export function createOrder(db: Db, input: OrderIn): Change {
  const tx = new Tx(db);
  const items = input.items.filter((i) => i.name.trim() && i.qty > 0);
  if (!items.length) throw new Error("Add at least one item.");
  const customer = ensureCustomer(tx, input.customer);
  const order = tx.add("order", {
    number: tx.next("order"), customer_id: customer?.id, customer_name: customer?.data.name ?? (input.customer.name.trim() || "Walk-in customer"),
    phone: customer?.data.phone ?? input.customer.phone, items, due_at: input.due_at, status: "new", source: input.source ?? "shop", notes: input.notes, advance: r2(input.advance ?? 0),
  });
  tx.note(`${tx.s.labels.order} ${order.data.number} saved`);
  orderEffects(tx, order, customer, input.discount ?? 0, input.advance ?? 0, input.advance_mode ?? "cash");
  return tx.done();
}

/** A website order the owner accepts: now it gets its number, bill, stock and reminders. */
export function acceptOrder(db: Db, orderId: string): Change {
  const tx = new Tx(db);
  const order = tx.find("order", orderId);
  if (!order || order.data.bill_id) throw new Error("This order is already accepted.");
  const customer = ensureCustomer(tx, { id: order.data.customer_id, name: order.data.customer_name, phone: order.data.phone });
  const accepted = tx.patch(order, { number: tx.next("order"), customer_id: customer?.id, status: "new" });
  tx.note(`Website ${tx.s.labels.order.toLowerCase()} accepted as ${accepted.data.number}`);
  orderEffects(tx, accepted, customer, 0, 0, "cash");
  return tx.done();
}

/** Changes the items of an order: the bill is redone with the same number and stock is taken again. */
export function editOrder(db: Db, orderId: string, input: Pick<OrderIn, "items" | "due_at" | "notes" | "discount">): Change {
  const tx = new Tx(db);
  const order = tx.find("order", orderId);
  if (!order) throw new Error("Order not found.");
  const items = input.items.filter((i) => i.name.trim() && i.qty > 0);
  if (!items.length) throw new Error("Add at least one item.");
  for (const m of tx.all("stock_move")) if (m.data.ref_id === order.id) tx.del(m.id);
  const next = tx.patch(order, { items, due_at: input.due_at, notes: input.notes });
  const bill = tx.find("bill", order.data.bill_id);
  if (bill) {
    const s = tx.s;
    const m = computeBill({ lines: items, gst_mode: bill.data.gst_mode, inter_state: bill.data.inter_state, prices_include_tax: s.prices_include_tax, discount: input.discount ?? bill.data.discount });
    const nb = tx.patch(bill, m);
    tx.note(`Bill ${bill.data.number} redone: now ${inr(m.total)}`);
    moveStock(tx, items, order.id, today(), -1);
    if (["delivered"].includes(order.data.status)) scheduleDues(tx, nb, today());
    else refreshDues(tx, nb);
  }
  if (input.due_at !== order.data.due_at) {
    closeReminders(tx, order.id, ["pickup"]);
    if (input.due_at) {
      const at = new Date(Date.parse(input.due_at) - tx.s.reminders.pickup_hours_before * 3_600_000).toISOString();
      tx.add("reminder", { due_at: at, kind: "pickup", customer_id: order.data.customer_id, phone: order.data.phone, to_name: order.data.customer_name, text: texts.pickup(tx.s, tx.shop, next.data), ref_id: order.id, status: "open" });
    }
  }
  return tx.done();
}

export function setOrderStatus(db: Db, orderId: string, status: OrderStatus): Change {
  const tx = new Tx(db);
  const order = tx.find("order", orderId);
  if (!order) throw new Error("Order not found.");
  if (order.data.status === status) return tx.done();
  const was = order.data.status;
  const next = tx.patch(order, { status });
  const bill = tx.find("bill", order.data.bill_id);
  const balance = bill ? billBalance(tx.recs, bill) : 0;
  const label = tx.s.labels.order;
  if (status === "ready") {
    tx.add("reminder", { due_at: nowIso(), kind: "pickup", customer_id: order.data.customer_id, phone: order.data.phone, to_name: order.data.customer_name, text: texts.ready(tx.s, tx.shop, next.data, balance), ref_id: order.id, status: "open" });
    tx.note(`${label} ${order.data.number} is ready. A message to tell ${order.data.customer_name} is on your list`);
  }
  if (status === "delivered") {
    closeReminders(tx, order.id, ["pickup"]);
    tx.note(`${label} ${order.data.number} delivered`);
    if (bill) scheduleDues(tx, bill, today());
  }
  if (status === "cancelled") {
    closeReminders(tx, order.id);
    if (bill && !bill.data.cancelled) {
      tx.patch(bill, { cancelled: true });
      closeReminders(tx, bill.id);
      tx.note(`Bill ${bill.data.number} cancelled`);
      const paid = paidOnBill(tx.recs, bill.id);
      if (paid > 0) tx.note(`${inr(paid)} was paid on it. Record a refund in Money if you return it`);
    }
    if (was !== "delivered") moveStock(tx, order.data.items, order.id, today(), 1);
  }
  return tx.done();
}

/* ---------- Counter sale ---------- */

export interface SaleIn { customer?: PartyIn; items: LineItem[]; discount?: number; paid: number; mode: PayMode; date?: string; notes?: string }

/** A sale at the counter: bill, payment and stock in one go. Anything unpaid becomes dues. */
export function quickSale(db: Db, input: SaleIn): { change: Change; billId: string } {
  const tx = new Tx(db);
  const items = input.items.filter((i) => i.name.trim() && i.qty > 0);
  if (!items.length) throw new Error("Add at least one item.");
  const date = input.date ?? today();
  const customer = input.customer?.name.trim() || input.customer?.id ? ensureCustomer(tx, input.customer) : undefined;
  const bill = makeBill(tx, { customer, customer_name: customer?.data.name ?? "Walk-in customer", lines: items, discount: input.discount, date, notes: input.notes });
  addPaymentIn(tx, bill, Math.min(input.paid, bill.data.total), input.mode, date);
  moveStock(tx, items, bill.id, date, -1);
  const balance = billBalance(tx.recs, bill);
  if (balance > 0 && !customer) tx.note(`${inr(balance)} is unpaid. Add the ${tx.s.labels.customer.toLowerCase()}'s name next time so it shows in dues`);
  scheduleDues(tx, bill, date);
  return { change: tx.done(), billId: bill.id };
}

export function cancelBill(db: Db, billId: string): Change {
  const tx = new Tx(db);
  const bill = tx.find("bill", billId);
  if (!bill || bill.data.cancelled) throw new Error("Bill not found.");
  if (bill.data.order_id) return setOrderStatus(db, bill.data.order_id, "cancelled");
  tx.patch(bill, { cancelled: true });
  closeReminders(tx, bill.id);
  const moved = tx.all("stock_move").filter((m) => m.data.ref_id === bill.id);
  for (const m of moved) tx.add("stock_move", { ...m.data, qty: -m.data.qty, reason: "return", date: today() });
  tx.note(`Bill ${bill.data.number} cancelled${moved.length ? " and its stock put back" : ""}`);
  const paid = paidOnBill(tx.recs, bill.id);
  if (paid > 0) tx.note(`${inr(paid)} was paid on it. Record a refund in Money if you return it`);
  return tx.done();
}

export interface PaymentIn { customer_id?: string; bill_id?: string; amount: number; mode: PayMode; date?: string; note?: string }

/** Money received. Against one bill, or against a customer's oldest unpaid bills first. */
export function receivePayment(db: Db, input: PaymentIn): Change {
  const tx = new Tx(db);
  const date = input.date ?? today();
  let left = r2(input.amount);
  if (left <= 0) throw new Error("Enter an amount.");
  const bills = input.bill_id
    ? [tx.find("bill", input.bill_id)].filter(Boolean) as Rec<"bill">[]
    : tx.all("bill").filter((b) => b.data.customer_id === input.customer_id && billBalance(tx.recs, b) > 0).sort((a, b) => a.data.date.localeCompare(b.data.date) || a.data.number.localeCompare(b.data.number));
  for (const b of bills) {
    if (left <= 0) break;
    const bal = billBalance(tx.recs, b);
    const pay = Math.min(bal, left);
    if (pay <= 0) continue;
    addPaymentIn(tx, b, pay, input.mode, date, input.note);
    left = r2(left - pay);
    refreshDues(tx, b);
  }
  if (left > 0) {
    tx.add("payment", { date, amount: left, mode: input.mode, direction: "in", customer_id: input.customer_id, note: input.note ?? "Advance, not on a bill yet" });
    tx.note(`${inr(left)} more than the bills, kept as advance`);
  }
  return tx.done();
}

/** Money paid back to a customer. */
export function refund(db: Db, billId: string, amount: number, mode: PayMode): Change {
  const tx = new Tx(db);
  const bill = tx.find("bill", billId);
  if (!bill || amount <= 0) throw new Error("Enter an amount.");
  tx.add("payment", { date: today(), amount: r2(amount), mode, direction: "out", customer_id: bill.data.customer_id, bill_id: bill.id, note: "Refund" });
  tx.note(`Refund of ${inr(amount)} recorded on bill ${bill.data.number}`);
  return tx.done();
}

/* ---------- Leads ---------- */

function leadFollowUp(tx: Tx, lead: Rec<"lead">, fromDate: string) {
  closeReminders(tx, lead.id, ["lead"]);
  const days = tx.s.reminders.lead_days;
  const dueDays = days.length ? days : [2];
  dueDays.forEach((d, i) => {
    tx.add("reminder", { due_at: `${addDays(fromDate, d)}T09:30:00.000Z`, kind: "lead", customer_id: lead.data.customer_id, phone: lead.data.phone, to_name: lead.data.name, text: texts.lead(tx.s, tx.shop, lead.data.name, lead.data.want), ref_id: lead.id, status: "open", step: i + 1 });
  });
  tx.note(`Follow-ups set for day ${dueDays.join(" and day ")}`);
}

export function saveLead(db: Db, data: Omit<Lead, "status"> & { status?: LeadStatus }, id?: string): Change {
  const tx = new Tx(db);
  const cur = tx.find("lead", id);
  if (cur) {
    tx.patch(cur, data);
    tx.note(`${data.name} updated`);
    return tx.done();
  }
  const lead = tx.add("lead", { ...data, status: data.status ?? "new" });
  tx.note(`Enquiry from ${data.name} saved`);
  if (data.next_at) {
    tx.add("reminder", { due_at: `${data.next_at.slice(0, 10)}T09:30:00.000Z`, kind: "lead", phone: data.phone, to_name: data.name, text: texts.lead(tx.s, tx.shop, data.name, data.want), ref_id: lead.id, status: "open" });
    tx.note(`Follow-up set for the date you chose`);
  } else leadFollowUp(tx, lead, today());
  return tx.done();
}

export function setLeadStatus(db: Db, id: string, status: LeadStatus): Change {
  const tx = new Tx(db);
  const lead = tx.find("lead", id);
  if (!lead) throw new Error("Enquiry not found.");
  const next = tx.patch(lead, { status });
  if (status === "won" || status === "lost") {
    closeReminders(tx, lead.id, ["lead"]);
    tx.note(status === "won" ? `${lead.data.name} marked as won` : `${lead.data.name} marked as lost, follow-ups stopped`);
  } else if (status !== lead.data.status) {
    leadFollowUp(tx, next, today());
  }
  return tx.done();
}

/** An enquiry that says yes: the customer, the order, its bill and stock, all from the enquiry. */
export function convertLead(db: Db, leadId: string, input: OrderIn): Change {
  const lead = db.recs.find((r) => r.id === leadId && r.kind === "lead") as Rec<"lead"> | undefined;
  if (!lead) throw new Error("Enquiry not found.");
  const first = createOrder(db, { ...input, source: input.source ?? lead.data.source });
  const merged = applyChange(db, first);
  const tx = new Tx(merged);
  const order = first.upsert.find((r) => r.kind === "order") as Rec<"order">;
  tx.patch(lead, { status: "won", order_id: order.id, customer_id: order.data.customer_id });
  closeReminders(tx, lead.id, ["lead"]);
  tx.note(`Enquiry from ${lead.data.name} marked as won`);
  return mergeChanges(first, tx.done());
}

/* ---------- Appointments ---------- */

export interface ApptIn { customer: PartyIn; product_id?: string; service: string; price: number; staff_id?: string; start_at: string; duration_min: number }

export function bookAppointment(db: Db, input: ApptIn, id?: string): Change {
  const tx = new Tx(db);
  const customer = ensureCustomer(tx, input.customer);
  const data: Appointment = { customer_id: customer?.id, customer_name: customer?.data.name ?? input.customer.name, phone: customer?.data.phone ?? input.customer.phone, product_id: input.product_id, service: input.service, price: input.price, staff_id: input.staff_id, start_at: input.start_at, duration_min: input.duration_min, status: "booked" };
  const cur = tx.find("appointment", id);
  const appt = cur ? tx.patch(cur, data) : tx.add("appointment", data);
  closeReminders(tx, appt.id, ["appointment"]);
  const hours = tx.s.reminders.appt_hours_before;
  const at = new Date(Date.parse(input.start_at) - hours * 3_600_000).toISOString();
  tx.add("reminder", { due_at: at, kind: "appointment", customer_id: customer?.id, phone: data.phone, to_name: data.customer_name, text: texts.appointment(tx.s, tx.shop, data.customer_name, data.service, data.start_at), ref_id: appt.id, status: "open" });
  tx.note(`${tx.s.labels.order} ${cur ? "moved" : "booked"} for ${data.customer_name}, with a reminder ${hours} hours before`);
  return tx.done();
}

export function finishAppointment(db: Db, id: string, status: Exclude<ApptStatus, "booked">, pay?: { paid: number; mode: PayMode; extra?: LineItem[] }): Change {
  const tx = new Tx(db);
  const appt = tx.find("appointment", id);
  if (!appt) throw new Error("Not found.");
  closeReminders(tx, appt.id, ["appointment"]);
  if (status !== "done") {
    tx.patch(appt, { status });
    tx.note(status === "no_show" ? `${appt.data.customer_name} marked as not come` : "Cancelled");
    return tx.done();
  }
  const product = tx.find("product", appt.data.product_id);
  const lines: LineItem[] = [{ product_id: appt.data.product_id, name: appt.data.service, qty: 1, unit: product?.data.unit, price: appt.data.price, gst_rate: product?.data.gst_rate ?? 0 }, ...(pay?.extra ?? [])];
  const customer = tx.find("customer", appt.data.customer_id);
  const date = today();
  const bill = makeBill(tx, { customer, customer_name: appt.data.customer_name, phone: appt.data.phone, lines, date, appointment_id: appt.id });
  tx.patch(appt, { status: "done", bill_id: bill.id });
  addPaymentIn(tx, bill, Math.min(pay?.paid ?? bill.data.total, bill.data.total), pay?.mode ?? "cash", date);
  moveStock(tx, lines, bill.id, date, -1);
  scheduleDues(tx, bill, date);
  return tx.done();
}

/* ---------- Buying and spending ---------- */

export interface PurchaseIn { supplier: PartyIn; bill_no?: string; date?: string; lines: (LineItem & { material_id?: string })[]; paid: number; mode: PayMode }

/** Stock bought: adds to stock, updates the cost price, records what was paid and what is still owed. */
export function recordPurchase(db: Db, input: PurchaseIn): Change {
  const tx = new Tx(db);
  const date = input.date ?? today();
  const lines = input.lines.filter((l) => l.name.trim() && l.qty > 0);
  if (!lines.length) throw new Error("Add at least one item.");
  const supplier = ensureSupplier(tx, input.supplier);
  let taxable = 0;
  let tax = 0;
  for (const l of lines) {
    const v = l.qty * l.price;
    taxable += v;
    tax += tx.s.gst_mode === "regular" ? (v * (l.gst_rate || 0)) / 100 : 0;
  }
  const total = Math.round(taxable + tax);
  const purchase = tx.add("purchase", { number: tx.next("purchase"), date, supplier_id: supplier?.id, supplier_name: supplier?.data.name ?? (input.supplier.name || "Market"), bill_no: input.bill_no, lines, taxable: r2(taxable), tax: r2(tax), total });
  tx.note(`Purchase ${purchase.data.number} saved for ${inr(total)}${tax > 0 ? ` (GST you can claim: ${inr(tax)})` : ""}`);
  const added: string[] = [];
  for (const l of lines) {
    const m = tx.find("material", l.material_id);
    const p = tx.find("product", l.product_id);
    if (m) {
      tx.add("stock_move", { date, item_id: m.id, item_kind: "material", qty: l.qty, reason: "purchase", ref_id: purchase.id });
      if (l.price > 0 && l.price !== m.data.cost) tx.patch(m, { cost: l.price });
      added.push(`${m.data.name} ${num(l.qty)} ${m.data.unit}`);
    } else if (p && p.data.stock_mode === "self") {
      tx.add("stock_move", { date, item_id: p.id, item_kind: "product", qty: l.qty, reason: "purchase", ref_id: purchase.id });
      if (l.price > 0) tx.patch(p, { cost: l.price });
      added.push(`${p.data.name} ${num(l.qty)} ${p.data.unit}`);
    }
    for (const r of tx.all("reminder")) if (r.data.kind === "stock" && r.data.status === "open" && (r.data.ref_id === m?.id || r.data.ref_id === p?.id)) tx.patch(r, { status: "done" });
  }
  if (added.length) tx.note(`Added to stock: ${added.join(", ")}`);
  const paid = Math.min(Math.max(0, input.paid), total);
  if (paid > 0) {
    tx.add("payment", { date, amount: r2(paid), mode: input.mode, direction: "out", supplier_id: supplier?.id, purchase_id: purchase.id, note: `Purchase ${purchase.data.number}` });
    tx.note(`${inr(paid)} paid by ${modeName(input.mode)}`);
  }
  if (total - paid > 0) tx.note(`${inr(total - paid)} still to pay ${supplier?.data.name ?? "the supplier"}`);
  return tx.done();
}

export function paySupplier(db: Db, supplierId: string, amount: number, mode: PayMode, date = today()): Change {
  const tx = new Tx(db);
  const s = tx.find("supplier", supplierId);
  if (!s || amount <= 0) throw new Error("Enter an amount.");
  tx.add("payment", { date, amount: r2(amount), mode, direction: "out", supplier_id: s.id, note: "Payment to supplier" });
  tx.note(`${inr(amount)} paid to ${s.data.name}`);
  return tx.done();
}

export const EXPENSE_CATEGORIES = ["Rent", "Salary", "Electricity", "Gas", "Transport", "Packing", "Repairs", "Marketing", "Phone and internet", "Fees and licences", "Tax paid", "Owner took out", "Other"];

export function recordExpense(db: Db, data: Expense, id?: string): Change {
  const tx = new Tx(db);
  if (!(data.amount > 0)) throw new Error("Enter an amount.");
  const cur = tx.find("expense", id);
  if (cur) tx.patch(cur, data);
  else tx.add("expense", { ...data, amount: r2(data.amount) });
  tx.note(`${data.category} of ${inr(data.amount)} ${cur ? "updated" : "recorded"} in your books`);
  return tx.done();
}

/* ---------- Stock ---------- */

export function adjustStock(db: Db, itemId: string, kind: "product" | "material", qty: number, reason: StockMove["reason"] = "adjust"): Change {
  const tx = new Tx(db);
  const item = tx.find(kind, itemId);
  if (!item || !qty) throw new Error("Enter a quantity.");
  tx.add("stock_move", { date: today(), item_id: itemId, item_kind: kind, qty: r2(qty), reason });
  tx.note(`${item.data.name}: ${qty > 0 ? "added" : "removed"} ${num(Math.abs(qty))} ${item.data.unit}`);
  if (qty < 0) checkLow(tx, [itemId]);
  else for (const r of tx.all("reminder")) if (r.data.kind === "stock" && r.data.status === "open" && r.data.ref_id === itemId && stockOf(tx.recs, itemId) > (item.data.low_at ?? 0)) tx.patch(r, { status: "done" });
  return tx.done();
}

/** Sets the count to what the owner actually counted. */
export function setStockCount(db: Db, itemId: string, kind: "product" | "material", counted: number): Change {
  const diff = r2(counted - stockOf(db.recs, itemId));
  if (!diff) return { upsert: [], remove: [], notes: ["Stock already matches"] };
  return adjustStock(db, itemId, kind, diff);
}

/* ---------- Staff ---------- */

export function markAttendance(db: Db, staffId: string, date: string, mark: AttendanceMark): Change {
  const tx = new Tx(db);
  const cur = tx.all("attendance").find((a) => a.data.staff_id === staffId && a.data.date === date);
  if (cur) tx.patch(cur, { mark });
  else tx.add("attendance", { date, staff_id: staffId, mark });
  return tx.done();
}

/** Pay for a month: monthly pay × (days present + half days ÷ 2 + leave days) ÷ days in the month, and what is already paid. */
export function staffMonth(recs: AnyRec[], staffId: string, month: string) {
  const staff = recs.find((r) => r.id === staffId && r.kind === "staff") as Rec<"staff"> | undefined;
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const marks = list(recs, "attendance").filter((a) => a.data.staff_id === staffId && a.data.date.startsWith(month));
  const count = (k: AttendanceMark) => marks.filter((a) => a.data.mark === k).length;
  const present = count("present");
  const half = count("half");
  const leave = count("leave");
  const absent = count("absent");
  const unmarked = daysInMonth - marks.length;
  const paidDays = present + half / 2 + leave + unmarked;
  const pay = staff ? Math.round((staff.data.monthly_pay * paidDays) / daysInMonth) : 0;
  const paid = r2(list(recs, "expense").filter((e) => e.data.staff_id === staffId && e.data.category === "Salary" && (e.data.note ?? "").includes(month)).reduce((a, e) => a + e.data.amount, 0));
  return { daysInMonth, present, half, leave, absent, unmarked, paidDays, pay, paid, left: Math.max(0, r2(pay - paid)) };
}

export function payStaff(db: Db, staffId: string, month: string, amount: number, mode: PayMode): Change {
  const tx = new Tx(db);
  const s = tx.find("staff", staffId);
  if (!s || amount <= 0) throw new Error("Enter an amount.");
  tx.add("expense", { date: today(), category: "Salary", amount: r2(amount), mode, staff_id: staffId, note: `${s.data.name}, pay for ${month}` });
  tx.note(`${inr(amount)} paid to ${s.data.name} and added to expenses`);
  return tx.done();
}

/* ---------- Reminders, marketing, records ---------- */

export function setReminderStatus(db: Db, id: string, status: ReminderStatus): Change {
  const tx = new Tx(db);
  const r = tx.find("reminder", id);
  if (r) tx.patch(r, { status });
  return tx.done();
}

export function addReminder(db: Db, data: Omit<Reminder, "status">): Change {
  const tx = new Tx(db);
  tx.add("reminder", { ...data, status: "open" });
  tx.note("Reminder added");
  return tx.done();
}

export function campaignAudience(recs: AnyRec[], audience: RecordKinds["campaign"]["audience"], on = today()): { id: string; name: string; phone: string }[] {
  const withPhone = (x: { id: string; name: string; phone?: string }) => digits(x.phone).length === 10;
  if (audience === "leads") return list(recs, "lead").filter((l) => l.data.status !== "won" && l.data.status !== "lost").map((l) => ({ id: l.id, name: l.data.name, phone: l.data.phone ?? "" })).filter(withPhone);
  const bills = list(recs, "bill").filter((b) => !b.data.cancelled);
  const visits = new Map<string, { n: number; last: string }>();
  for (const b of bills) if (b.data.customer_id) {
    const v = visits.get(b.data.customer_id) ?? { n: 0, last: "" };
    visits.set(b.data.customer_id, { n: v.n + 1, last: b.data.date > v.last ? b.data.date : v.last });
  }
  const md = on.slice(5, 10);
  return list(recs, "customer").filter((c) => {
    const v = visits.get(c.id);
    if (audience === "regulars") return (v?.n ?? 0) >= 3;
    if (audience === "lapsed") return !!v && v.last < addDays(on, -45);
    if (audience === "birthdays") return !!c.data.birthday && c.data.birthday.slice(5, 10) >= md && c.data.birthday.slice(5, 10) <= addDays(on, 7).slice(5, 10);
    return true;
  }).map((c) => ({ id: c.id, name: c.data.name, phone: c.data.phone ?? "" })).filter(withPhone);
}

export function markCampaignSent(db: Db, campaignId: string, personId: string): Change {
  const tx = new Tx(db);
  const c = tx.find("campaign", campaignId);
  if (!c) return tx.done();
  const sent = Array.from(new Set([...c.data.sent_to, personId]));
  tx.patch(c, { sent_to: sent, status: "ready" });
  return tx.done();
}

/** Saves a simple record (customer, product, material, supplier, staff, campaign, licence). */
export function saveRecord<K extends Kind>(db: Db, kind: K, data: RecordKinds[K], id?: string): { change: Change; id: string } {
  const tx = new Tx(db);
  const cur = tx.find(kind, id);
  const rec = cur ? tx.patch(cur, data) : tx.add(kind, data);
  const name = (data as { name?: string; title?: string }).name ?? (data as { title?: string }).title ?? "";
  tx.note(`${name ? `${name} ` : ""}${cur ? "updated" : "saved"}`);
  if (kind === "licence") {
    const l = data as RecordKinds["licence"];
    closeReminders(tx, rec.id, ["licence"]);
    tx.add("reminder", { due_at: `${addDays(l.expires_on, -30)}T09:00:00.000Z`, kind: "licence", to_name: "You", text: `${l.name}${l.number ? ` (${l.number})` : ""} ends on ${l.expires_on}. Renew it in time.`, ref_id: rec.id, status: "open" });
    tx.note("A renewal reminder is set 30 days before it ends");
  }
  if (kind === "product") {
    const p = data as Product;
    if (p.stock_mode === "self" && !cur) checkLow(tx, [rec.id]);
  }
  return { change: tx.done(), id: rec.id };
}

export function removeRecord(db: Db, id: string): Change {
  const tx = new Tx(db);
  tx.del(id);
  for (const r of tx.all("reminder")) if (r.data.ref_id === id) tx.del(r.id);
  tx.note("Removed");
  return tx.done();
}

export function updateSettings(_db: Db, patch: Partial<Settings>): Change {
  return { upsert: [], remove: [], settings: patch, notes: ["Settings saved"] };
}

/** Once a day: birthday wishes for the coming week. */
export function dailySweep(db: Db, on = today()): Change | null {
  const tx = new Tx(db);
  const year = on.slice(0, 4);
  for (const c of tx.all("customer")) {
    const b = c.data.birthday;
    if (!b || !c.data.phone) continue;
    const thisYear = `${year}-${b.slice(5, 10)}`;
    if (thisYear < on || thisYear > addDays(on, 7)) continue;
    const has = tx.all("reminder").some((r) => r.data.kind === "birthday" && r.data.ref_id === c.id && r.data.due_at.startsWith(year));
    if (has) continue;
    tx.add("reminder", { due_at: `${thisYear}T08:00:00.000Z`, kind: "birthday", customer_id: c.id, phone: c.data.phone, to_name: c.data.name, text: texts.birthday(tx.s, tx.shop, c.data.name), ref_id: c.id, status: "open" });
  }
  const ch = tx.done();
  return ch.upsert.length ? ch : null;
}

/* ---------- Setting up ---------- */

export interface SetupIn { name: string; owner_name?: string; phone?: string; city?: string; state: string; gst_mode?: Settings["gst_mode"]; gstin?: string; upi_id?: string; with_examples?: boolean }

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "my-shop";
}

export function defaultSettings(t: BizType, input: SetupIn): Settings {
  return {
    owner_name: input.owner_name?.trim() || undefined, phone: input.phone?.trim() || undefined, city: input.city?.trim() || undefined, state: input.state,
    gstin: input.gstin?.trim().toUpperCase() || undefined, gst_mode: input.gst_mode ?? defaultGstMode(t), composition_rate: compositionRateFor(t),
    prices_include_tax: true, upi_id: input.upi_id?.trim() || undefined, bill_prefix: "B-", order_prefix: usesJobs(t) ? "J-" : "O-", purchase_prefix: "P-",
    counters: { bill: 0, order: 0, purchase: 0 }, opening_cash: 0, modules: modulesFor(t), labels: labelsFor(t), language: "en",
    site: { slug: slugify(input.name), published: false, about: `${input.name.trim()}, ${t.name.toLowerCase()}${input.city ? ` in ${input.city.trim()}` : ""}. Order online or message us on WhatsApp.`, take_orders: true, colour: "sun" },
    reminders: { pickup_hours_before: 3, dues_days: [3, 7], lead_days: [2, 5], appt_hours_before: 3 }, stage: "running",
  };
}
const usesJobs = (t: BizType) => labelsFor(t).order === "Job";

/** A new business with example items (materials, products with recipes, opening stock) the owner edits. */
export function setupWorkspace(t: BizType, input: SetupIn, wsId = uid()): Db {
  const ws: Workspace = { id: wsId, name: input.name.trim(), type_id: t.id, settings: defaultSettings(t, input), created_at: nowIso() };
  const tx = new Tx({ ws, recs: [] });
  if (input.with_examples !== false) {
    const { products, materials } = startersFor(t);
    const mid = new Map<string, string>();
    for (const m of materials) {
      const rec = tx.add("material", { name: m.name, unit: m.unit, cost: m.cost, low_at: m.low_at });
      mid.set(m.key, rec.id);
      if (m.stock > 0) tx.add("stock_move", { date: today(), item_id: rec.id, item_kind: "material", qty: m.stock, reason: "adjust" });
    }
    for (const p of products) {
      const recipe = p.recipe?.map((x) => ({ material_id: mid.get(x.m)!, qty: x.qty })).filter((x) => x.material_id);
      const mode = recipe?.length ? "recipe" : p.type === "product" && (p.stock ?? 0) > 0 ? "self" : "none";
      const rec = tx.add("product", { name: p.name, type: p.type, unit: p.unit, price: p.price, gst_rate: 0, stock_mode: mode, low_at: mode === "self" ? p.low_at : undefined, recipe: recipe?.length ? recipe : undefined, duration_min: p.duration_min, active: true, on_site: true, cost: p.cost });
      if (mode === "self") tx.add("stock_move", { date: today(), item_id: rec.id, item_kind: "product", qty: p.stock!, reason: "adjust" });
    }
  }
  const ch = tx.done();
  return { ws: { ...ws, settings: { ...ws.settings, ...(ch.settings ?? {}) } }, recs: ch.upsert };
}

/* ---------- Applying changes ---------- */

export function applyChange(db: Db, ch: Change): Db {
  const rm = new Set(ch.remove);
  const up = new Map(ch.upsert.map((r) => [r.id, r]));
  const ids = new Set(db.recs.map((r) => r.id));
  const recs = db.recs.filter((r) => !rm.has(r.id)).map((r) => up.get(r.id) ?? r);
  for (const r of ch.upsert) if (!ids.has(r.id)) recs.push(r);
  return { ws: ch.settings ? { ...db.ws, settings: { ...db.ws.settings, ...ch.settings } } : db.ws, recs };
}

export function mergeChanges(a: Change, b: Change): Change {
  const up = new Map(a.upsert.map((r) => [r.id, r]));
  for (const r of b.upsert) up.set(r.id, r);
  const remove = [...new Set([...a.remove, ...b.remove])];
  for (const id of remove) up.delete(id);
  return { upsert: [...up.values()], remove, settings: a.settings || b.settings ? { ...a.settings, ...b.settings } : undefined, notes: [...a.notes, ...b.notes] };
}

export type { Bill, Order };
