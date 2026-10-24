/* Ready messages, sent by tapping: each opens WhatsApp on the owner's phone with the text filled in.
   Sending this way is free and comes from the owner's own number. */

import type { Bill, Order, Settings } from "./types";
import { day, dayTime, inr, waPhone } from "./format";

export function waLink(phone: string | undefined, text: string): string {
  const p = waPhone(phone);
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}

export function upiLink(s: Settings, amount: number, note: string): string | null {
  if (!s.upi_id) return null;
  const params = new URLSearchParams({ pa: s.upi_id, pn: s.owner_name || "Shop", am: amount.toFixed(2), cu: "INR", tn: note.slice(0, 50) });
  return `upi://pay?${params.toString()}`;
}

const sign = (s: Settings, name: string) => `\n\n${name}${s.phone ? `\n${s.phone}` : ""}`;
const payLine = (s: Settings, amount: number) => (s.upi_id && amount > 0 ? `\nPay by UPI to ${s.upi_id}` : "");

export const texts = {
  bill(s: Settings, shop: string, b: Bill, balance: number) {
    const items = b.lines.map((l) => `• ${l.name} × ${l.qty} = ${inr(l.total)}`).join("\n");
    const due = balance > 0 ? `\nPaid ${inr(b.total - balance)}. Left to pay: ${inr(balance)}${payLine(s, balance)}` : "\nFully paid. Thank you!";
    return `Hello ${b.customer_name}, here is your bill ${b.number} from ${shop} (${day(b.date)}):\n${items}\nTotal: ${inr(b.total)}${due}${sign(s, shop)}`;
  },
  orderTaken(s: Settings, shop: string, o: Order, total: number) {
    const when = o.due_at ? ` It will be ready by ${dayTime(o.due_at)}.` : "";
    return `Hello ${o.customer_name}, we have your ${s.labels.order.toLowerCase()} ${o.number} for ${inr(total)}.${when}${o.advance > 0 ? ` Advance received: ${inr(o.advance)}.` : ""} Thank you!${sign(s, shop)}`;
  },
  ready(s: Settings, shop: string, o: Order, balance: number) {
    return `Hello ${o.customer_name}, your ${s.labels.order.toLowerCase()} ${o.number} is ready.${balance > 0 ? ` Amount to pay: ${inr(balance)}.${payLine(s, balance)}` : ""}${sign(s, shop)}`;
  },
  pickup(s: Settings, shop: string, o: Order) {
    return `Hello ${o.customer_name}, a reminder that your ${s.labels.order.toLowerCase()} ${o.number} is due ${dayTime(o.due_at)}.${sign(s, shop)}`;
  },
  dues(s: Settings, shop: string, name: string, amount: number, billNo?: string) {
    return `Hello ${name}, a gentle reminder that ${inr(amount)} is pending${billNo ? ` on bill ${billNo}` : ""} with ${shop}.${payLine(s, amount)} Please ignore if already paid.${sign(s, shop)}`;
  },
  lead(s: Settings, shop: string, name: string, want: string) {
    return `Hello ${name}, this is ${s.owner_name || shop} from ${shop}. Following up on your enquiry${want ? ` about ${want}` : ""}. Shall we go ahead?${sign(s, shop)}`;
  },
  appointment(s: Settings, shop: string, name: string, service: string, at: string) {
    return `Hello ${name}, a reminder of your ${service} at ${shop} on ${dayTime(at)}. Reply to change the time.${sign(s, shop)}`;
  },
  birthday(s: Settings, shop: string, name: string) {
    return `Happy birthday ${name}! Wishing you a great year from all of us at ${shop}.${sign(s, shop)}`;
  },
  thanks(s: Settings, shop: string, name: string) {
    return `Thank you for visiting ${shop}, ${name}! We hope to see you again soon.${sign(s, shop)}`;
  },
};

/** Ready campaign messages the owner can start from. {name} becomes each person's name. */
export const CAMPAIGN_TEMPLATES: { title: string; message: string }[] = [
  { title: "Festival offer", message: "Hello {name}! This festive season enjoy 10% off at {shop}. Valid till this Sunday. See you soon!" },
  { title: "New arrivals", message: "Hello {name}, new items just arrived at {shop}. Drop by or reply here to see photos." },
  { title: "We miss you", message: "Hello {name}, it has been a while! Come back to {shop} this week and get a special discount." },
  { title: "Thank you", message: "Hello {name}, thank you for being a regular at {shop}. Your support means a lot to us." },
];
