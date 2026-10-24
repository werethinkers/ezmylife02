/* Checks for the My Business engine. Run: npm run test:business */

import assert from "node:assert/strict";
import { bizType } from "./catalog";
import { computeBill, quarterOf, validGstin } from "./gst";
import {
  acceptOrder, applyChange, bookAppointment, cancelBill, convertLead, createOrder, type Db, finishAppointment, list, markAttendance,
  payStaff, quickSale, receivePayment, recordExpense, recordPurchase, saveLead, setOrderStatus, setupWorkspace, staffMonth, stockOf, billBalance,
} from "./engine";
import { cashBook, duesList, gstMonth, gstQuarter, overview, pnl } from "./reports";
import type { Change } from "./types";
import { today } from "./format";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok ${name}`);
}
const run = (db: Db, ch: Change) => applyChange(db, ch);

test("bill maths: composition has no tax lines", () => {
  const m = computeBill({ lines: [{ name: "Cake", qty: 2, price: 650, gst_rate: 18 }], gst_mode: "composition", inter_state: false, prices_include_tax: true });
  assert.equal(m.total, 1300);
  assert.equal(m.cgst + m.sgst + m.igst, 0);
});

test("bill maths: regular, price includes tax, split CGST and SGST", () => {
  const m = computeBill({ lines: [{ name: "Cake", qty: 1, price: 118, gst_rate: 18 }], gst_mode: "regular", inter_state: false, prices_include_tax: true });
  assert.equal(m.taxable, 100);
  assert.equal(m.cgst, 9);
  assert.equal(m.sgst, 9);
  assert.equal(m.total, 118);
});

test("bill maths: regular, tax on top, other state uses IGST, discount shared", () => {
  const m = computeBill({ lines: [{ name: "A", qty: 1, price: 1000, gst_rate: 18 }, { name: "B", qty: 1, price: 1000, gst_rate: 5 }], gst_mode: "regular", inter_state: true, prices_include_tax: false, discount: 200 });
  assert.equal(m.taxable, 1800);
  assert.equal(m.igst, 162 + 45);
  assert.equal(m.total, 2007);
});

test("GST quarter and GSTIN check", () => {
  const q = quarterOf("2026-11-05");
  assert.equal(q.from, "2026-10-01");
  assert.equal(q.to, "2026-12-31");
  assert.equal(q.due, "2027-01-18");
  assert.equal(quarterOf("2027-02-10").from, "2027-01-01");
  assert.equal(validGstin("27AAPFU0939F1ZV"), true);
  assert.equal(validGstin("27AAPFU0939F1ZX"), false);
});

const bakeryType = bizType("bakery")!;
let db = setupWorkspace(bakeryType, { name: "Sweet Crumbs", owner_name: "Riya", phone: "9876543210", state: "Madhya Pradesh", upi_id: "riya@upi" });

test("bakery setup: composition at 1%, materials, recipes and opening stock", () => {
  assert.equal(db.ws.settings.gst_mode, "composition");
  assert.equal(db.ws.settings.composition_rate, 1);
  const cake = list(db.recs, "product").find((p) => p.data.name.startsWith("Chocolate cake"))!;
  assert.equal(cake.data.stock_mode, "recipe");
  const flour = list(db.recs, "material").find((m) => m.data.name === "Flour")!;
  assert.equal(stockOf(db.recs, flour.id), 25);
});

test("one order makes the customer, bill, advance, stock use and a pickup reminder", () => {
  const cake = list(db.recs, "product").find((p) => p.data.name.startsWith("Chocolate cake"))!;
  const due = new Date(Date.now() + 2 * 86_400_000).toISOString();
  const ch = createOrder(db, { customer: { name: "Anjali", phone: "98260 11111" }, items: [{ product_id: cake.id, name: cake.data.name, qty: 2, price: 650, gst_rate: 0 }], due_at: due, advance: 500, advance_mode: "upi" });
  db = run(db, ch);
  const order = list(db.recs, "order")[0];
  const bill = list(db.recs, "bill")[0];
  assert.equal(order.data.number, "O-0001");
  assert.equal(bill.data.number, "B-0001");
  assert.equal(bill.data.total, 1300);
  assert.equal(billBalance(db.recs, bill), 800);
  assert.equal(list(db.recs, "customer").length, 1);
  const flour = list(db.recs, "material").find((m) => m.data.name === "Flour")!;
  assert.equal(stockOf(db.recs, flour.id), 24.4);
  assert.ok(list(db.recs, "reminder").some((r) => r.data.kind === "pickup" && r.data.ref_id === order.id));
  assert.ok(ch.notes.length >= 4);
});

test("same phone finds the same customer", () => {
  const bread = list(db.recs, "product").find((p) => p.data.name === "Bread loaf")!;
  db = run(db, createOrder(db, { customer: { name: "Anjali S", phone: "9826011111" }, items: [{ product_id: bread.id, name: "Bread loaf", qty: 1, price: 45, gst_rate: 0 }] }));
  assert.equal(list(db.recs, "customer").length, 1);
});

test("delivered with money left sets dues reminders on day 3 and 7; payment closes them", () => {
  const order = list(db.recs, "order").find((o) => o.data.number === "O-0001")!;
  db = run(db, setOrderStatus(db, order.id, "ready"));
  db = run(db, setOrderStatus(db, order.id, "delivered"));
  const dues = list(db.recs, "reminder").filter((r) => r.data.kind === "dues" && r.data.status === "open");
  assert.equal(dues.length, 2);
  assert.equal(duesList(db.recs)[0].amount, 845);
  const cust = list(db.recs, "customer")[0];
  db = run(db, receivePayment(db, { customer_id: cust.id, amount: 800, mode: "cash" }));
  const bill1 = list(db.recs, "bill").find((b) => b.data.number === "B-0001")!;
  assert.equal(billBalance(db.recs, bill1), 0);
  assert.equal(list(db.recs, "reminder").filter((r) => r.data.kind === "dues" && r.data.ref_id === bill1.id && r.data.status === "open").length, 0);
  assert.equal(duesList(db.recs)[0].amount, 45);
});

test("cancelling an order cancels its bill and puts stock back", () => {
  const cake = list(db.recs, "product").find((p) => p.data.name.startsWith("Pineapple"))!;
  const flour = list(db.recs, "material").find((m) => m.data.name === "Flour")!;
  const before = stockOf(db.recs, flour.id);
  db = run(db, createOrder(db, { customer: { name: "Ravi" }, items: [{ product_id: cake.id, name: cake.data.name, qty: 1, price: 550, gst_rate: 0 }] }));
  assert.equal(stockOf(db.recs, flour.id), before - 0.3);
  const o = list(db.recs, "order").find((x) => x.data.customer_name === "Ravi")!;
  db = run(db, setOrderStatus(db, o.id, "cancelled"));
  assert.equal(stockOf(db.recs, flour.id), before);
  assert.equal(list(db.recs, "bill").find((b) => b.id === o.data.bill_id)!.data.cancelled, true);
});

test("purchase adds stock, updates cost and leaves a payable; low stock warns", () => {
  const butter = list(db.recs, "material").find((m) => m.data.name === "Butter")!;
  const ch = recordPurchase(db, { supplier: { name: "Metro Dairy" }, lines: [{ material_id: butter.id, name: "Butter", qty: 5, price: 540, gst_rate: 0 }], paid: 2000, mode: "upi" });
  db = run(db, ch);
  assert.equal(list(db.recs, "material").find((m) => m.id === butter.id)!.data.cost, 540);
  assert.equal(list(db.recs, "purchase")[0].data.total, 2700);
  const cake = list(db.recs, "product").find((p) => p.data.name.startsWith("Chocolate cake"))!;
  const big = createOrder(db, { customer: { name: "Office party", phone: "9000000001" }, items: [{ product_id: cake.id, name: cake.data.name, qty: 20, price: 650, gst_rate: 0 }] });
  assert.ok(big.notes.some((n) => n.includes("running low")));
  db = run(db, big);
});

test("counter sale, expense, books and composition tax", () => {
  const cookies = list(db.recs, "product").find((p) => p.data.name.startsWith("Butter cookies"))!;
  const { change } = quickSale(db, { items: [{ product_id: cookies.id, name: cookies.data.name, qty: 3, price: 220, gst_rate: 0 }], paid: 660, mode: "cash" });
  db = run(db, change);
  db = run(db, recordExpense(db, { date: today(), category: "Rent", amount: 15000, mode: "bank" }));
  const p = pnl(db.recs, db.ws.settings, `${today().slice(0, 7)}-01`, today());
  assert.equal(p.sales, 1300 + 45 + 13000 + 660);
  assert.equal(p.composition_tax, Math.round(p.sales) / 100);
  const cb = cashBook(db.recs, db.ws.settings, today(), today());
  assert.equal(cb.closing.cash, 800 + 660);
  const q = gstQuarter(db.recs, db.ws.settings, today(), false);
  assert.equal(q.tax, Math.round(q.turnover) / 100);
  assert.ok(overview(db.recs, db.ws.settings).salesToday > 0);
});

test("cancel a counter bill puts its stock back", () => {
  const cookies = list(db.recs, "product").find((p) => p.data.name.startsWith("Butter cookies"))!;
  const flour = list(db.recs, "material").find((m) => m.data.name === "Flour")!;
  const before = stockOf(db.recs, flour.id);
  const { change, billId } = quickSale(db, { items: [{ product_id: cookies.id, name: cookies.data.name, qty: 2, price: 220, gst_rate: 0 }], paid: 0, mode: "cash", customer: { name: "Neha", phone: "9111111111" } });
  db = run(db, change);
  assert.ok(list(db.recs, "reminder").some((r) => r.data.kind === "dues" && r.data.ref_id === billId));
  db = run(db, cancelBill(db, billId));
  assert.equal(stockOf(db.recs, flour.id), before);
  assert.equal(list(db.recs, "reminder").filter((r) => r.data.ref_id === billId && r.data.status === "open").length, 0);
});

test("lead to order in one step", () => {
  db = run(db, saveLead(db, { name: "Mehta wedding", phone: "9222222222", want: "50 cupcake boxes", source: "Instagram", value: 15000 }));
  const lead = list(db.recs, "lead")[0];
  assert.ok(list(db.recs, "reminder").some((r) => r.data.kind === "lead" && r.data.ref_id === lead.id));
  const cup = list(db.recs, "product").find((p) => p.data.name.startsWith("Cupcakes"))!;
  db = run(db, convertLead(db, lead.id, { customer: { name: "Mehta wedding", phone: "9222222222" }, items: [{ product_id: cup.id, name: cup.data.name, qty: 50, price: 300, gst_rate: 0 }], advance: 5000, advance_mode: "bank" }));
  const won = list(db.recs, "lead")[0];
  assert.equal(won.data.status, "won");
  assert.ok(won.data.order_id);
  assert.equal(list(db.recs, "reminder").filter((r) => r.data.kind === "lead" && r.data.status === "open").length, 0);
});

test("website order waits, then accepting it numbers and bills it", () => {
  const cake = list(db.recs, "product").find((p) => p.data.name.startsWith("Chocolate cake"))!;
  const t = new Date().toISOString();
  db = { ...db, recs: [...db.recs, { id: "11111111-1111-4111-8111-111111111111", kind: "order", created_at: t, updated_at: t, data: { number: "W-1", customer_name: "Web buyer", phone: "9333333333", items: [{ product_id: cake.id, name: cake.data.name, qty: 1, price: 650, gst_rate: 0 }], status: "new", source: "website", advance: 0 } }] };
  assert.equal(overview(db.recs, db.ws.settings).website.length, 1);
  db = run(db, acceptOrder(db, "11111111-1111-4111-8111-111111111111"));
  const o = list(db.recs, "order").find((x) => x.id === "11111111-1111-4111-8111-111111111111")!;
  assert.match(o.data.number, /^O-\d{4}$/);
  assert.ok(o.data.bill_id);
  assert.equal(overview(db.recs, db.ws.settings).website.length, 0);
});

test("salon: regular GST appointment, done makes a taxed bill", () => {
  let s = setupWorkspace(bizType("salon")!, { name: "Glow", state: "Madhya Pradesh", gst_mode: "regular" });
  const cut = list(s.recs, "product").find((p) => p.data.name === "Haircut")!;
  s = run(s, { upsert: [{ ...cut, data: { ...cut.data, gst_rate: 18 } }], remove: [], notes: [] });
  s = run(s, bookAppointment(s, { customer: { name: "Kiran", phone: "9444444444", state: "Gujarat" }, product_id: cut.id, service: "Haircut", price: 236, start_at: new Date(Date.now() + 86_400_000).toISOString(), duration_min: 30 }));
  const appt = list(s.recs, "appointment")[0];
  s = run(s, finishAppointment(s, appt.id, "done", { paid: 236, mode: "upi" }));
  const bill = list(s.recs, "bill")[0];
  assert.equal(bill.data.inter_state, true);
  assert.equal(bill.data.igst, 36);
  const g = gstMonth(s.recs, today().slice(0, 7));
  assert.equal(g.output, 36);
});

test("staff pay from attendance", () => {
  let s = setupWorkspace(bizType("salon")!, { name: "Glow", state: "Madhya Pradesh" });
  const t = new Date().toISOString();
  s = { ...s, recs: [...s.recs, { id: "22222222-2222-4222-8222-222222222222", kind: "staff", created_at: t, updated_at: t, data: { name: "Sunil", role: "Stylist", monthly_pay: 15000, active: true } }] };
  s = run(s, markAttendance(s, "22222222-2222-4222-8222-222222222222", "2026-09-01", "absent"));
  s = run(s, markAttendance(s, "22222222-2222-4222-8222-222222222222", "2026-09-02", "half"));
  const m = staffMonth(s.recs, "22222222-2222-4222-8222-222222222222", "2026-09");
  assert.equal(m.daysInMonth, 30);
  assert.equal(m.pay, Math.round((15000 * 28.5) / 30));
  s = run(s, payStaff(s, "22222222-2222-4222-8222-222222222222", "2026-09", m.pay, "cash"));
  assert.equal(staffMonth(s.recs, "22222222-2222-4222-8222-222222222222", "2026-09").left, 0);
});

console.log(`\n${passed} checks passed`);
