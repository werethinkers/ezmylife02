/* Shared pieces for My Business screens: panels, tiles, fields, the item lines editor, people pickers,
   and the links that open any customer, bill or order from anywhere in the app. */

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { MessageCircle, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AnyRec, LineItem, PayMode, Settings } from "@/business/types";
import { list, stockOf } from "@/business/engine";
import { computeBill, GST_RATES } from "@/business/gst";
import { inr, num } from "@/business/format";
import { waLink } from "@/business/whatsapp";

/* ---------- Opening things from anywhere ---------- */

export type Target =
  | { t: "customer" | "bill" | "order" | "lead" | "product" | "material" | "supplier" | "staff" | "appointment" | "purchase"; id: string };
export type FormKind =
  | "order" | "sale" | "payment" | "expense" | "purchase" | "lead" | "appointment" | "customer" | "product" | "material" | "supplier"
  | "staff" | "reminder" | "campaign" | "licence" | "supplier_payment";
export interface FormOpen { kind: FormKind; id?: string; preset?: Record<string, unknown> }

interface Nav {
  open: (t: Target) => void;
  form: (f: FormOpen) => void;
  go: (section: string) => void;
}
export const NavCtx = createContext<Nav>({ open: () => undefined, form: () => undefined, go: () => undefined });
export const useNav = () => useContext(NavCtx);

export function LinkTo({ to, children, className }: { to: Target; children: ReactNode; className?: string }) {
  const { open } = useNav();
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); open(to); }} className={cn("text-left font-semibold underline decoration-ink/30 decoration-2 underline-offset-2 hover:decoration-pink", className)}>
      {children}
    </button>
  );
}

/* ---------- Layout ---------- */

export function Panel({ children, className, tone = "bg-card" }: { children: ReactNode; className?: string; tone?: string }) {
  return <div className={cn("rounded-2xl border-2 border-ink p-4 shadow-block-sm sm:p-5", tone, className)}>{children}</div>;
}

export function SectionHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {sub && <p className="mt-1 max-w-2xl text-muted-foreground">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, tone = "bg-card", onClick, hint }: { label: string; value: ReactNode; tone?: string; onClick?: () => void; hint?: string }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick} className={cn("rounded-2xl border-2 border-ink p-4 text-left shadow-block-sm", tone, onClick && "transition-transform hover:-translate-y-0.5 hover:shadow-block")}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums sm:text-[28px]">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink/70">{hint}</p>}
    </Tag>
  );
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/40 bg-card/60 p-8 text-center">
      <p className="font-bold">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

const PILL: Record<string, string> = {
  new: "bg-sky", making: "bg-sun", ready: "bg-lime", delivered: "bg-sand", cancelled: "bg-muted text-muted-foreground line-through",
  booked: "bg-sky", done: "bg-lime", no_show: "bg-coral", talking: "bg-sun", quoted: "bg-pink", won: "bg-lime", lost: "bg-muted text-muted-foreground",
  open: "bg-sun", sent: "bg-sky", skipped: "bg-muted text-muted-foreground", paid: "bg-lime", due: "bg-coral", part: "bg-sun",
};
const PILL_TEXT: Record<string, string> = { no_show: "Did not come", part: "Part paid", due: "Unpaid", new: "New", making: "Making", ready: "Ready", delivered: "Delivered", cancelled: "Cancelled", booked: "Booked", done: "Done", talking: "Talking", quoted: "Quote sent", won: "Won", lost: "Lost", open: "To do", sent: "Sent", skipped: "Skipped", paid: "Paid" };

export function Pill({ s, label }: { s: string; label?: string }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full border-2 border-ink px-2 py-0.5 text-xs font-bold", PILL[s] ?? "bg-card")}>{label ?? PILL_TEXT[s] ?? s}</span>;
}

/** A labelled field. Use group for a set of buttons (a label around buttons would click the first one). */
export function Field({ label, hint, children, className, group }: { label: string; hint?: string; children: ReactNode; className?: string; group?: boolean }) {
  const Tag = group ? "div" : "label";
  return (
    <Tag className={cn("block", className)} role={group ? "group" : undefined} aria-label={group ? label : undefined}>
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </Tag>
  );
}

export const selectCls = "h-11 w-full rounded-xl border-2 border-ink bg-card px-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-ring";

export function Choice<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: NoInfer<T>) => void; options: [NoInfer<T>, string][]; className?: string }) {
  return (
    <div role="radiogroup" className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={cn("rounded-full border-2 border-ink px-3 py-1.5 text-sm font-semibold transition-colors", value === v ? "bg-ink text-cream" : "bg-card hover:bg-sun")}>
          {l}
        </button>
      ))}
    </div>
  );
}

export const PAY_MODES: [PayMode, string][] = [["cash", "Cash"], ["upi", "UPI"], ["card", "Card"], ["bank", "Bank"]];

export function WaButton({ phone, text, onSent, label = "WhatsApp", size = "sm", className }: { phone?: string; text: string; onSent?: () => void; label?: string; size?: "sm" | "default"; className?: string }) {
  const ok = (phone ?? "").replace(/\D/g, "").length >= 10;
  return (
    <Button asChild size={size} variant="outline" className={cn("bg-lime hover:bg-lime", !ok && "pointer-events-none opacity-50", className)} title={ok ? "Opens WhatsApp with the message ready" : "Add a phone number first"}>
      <a href={ok ? waLink(phone, text) : undefined} target="_blank" rel="noreferrer" onClick={() => ok && onSent?.()} aria-disabled={!ok}>
        <MessageCircle /> {label}
      </a>
    </Button>
  );
}

/* ---------- Picking a customer or supplier ---------- */

export interface PartyValue { id?: string; name: string; phone?: string; state?: string; gstin?: string }

export function PartyPicker({ recs, kind = "customer", value, onChange, label, showGstin }: { recs: AnyRec[]; kind?: "customer" | "supplier"; value: PartyValue; onChange: (v: PartyValue) => void; label: string; showGstin?: boolean }) {
  const [focus, setFocus] = useState(false);
  const people = useMemo(() => (kind === "customer" ? list(recs, "customer").map((c) => ({ id: c.id, ...c.data })) : list(recs, "supplier").map((s) => ({ id: s.id, ...s.data, state: undefined as string | undefined }))), [recs, kind]);
  const q = value.name.trim().toLowerCase();
  const matches = q && !value.id ? people.filter((p) => p.name.toLowerCase().includes(q) || (p.phone ?? "").includes(q)).slice(0, 6) : [];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="relative">
        <Field label={label}>
          <Input value={value.name} placeholder="Name" autoComplete="off"
            onChange={(e) => onChange({ name: e.target.value, phone: value.id ? "" : value.phone })}
            onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)} />
        </Field>
        {focus && matches.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border-2 border-ink bg-card shadow-block">
            {matches.map((p) => (
              <li key={p.id}>
                <button type="button" className="flex w-full justify-between gap-2 px-3 py-2 text-left hover:bg-sun" onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onChange({ id: p.id, name: p.name, phone: p.phone, state: p.state, gstin: p.gstin }); setFocus(false); }}>
                  <span className="font-semibold">{p.name}</span><span className="text-sm text-muted-foreground">{p.phone}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {value.id && <p className="mt-1 text-xs text-muted-foreground">Picked from your list. <button type="button" className="underline" onClick={() => onChange({ name: "" })}>Change</button></p>}
      </div>
      <Field label="Phone (for WhatsApp)">
        <Input value={value.phone ?? ""} inputMode="tel" placeholder="10 digit mobile" disabled={!!value.id && !!people.find((p) => p.id === value.id)?.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })} />
      </Field>
      {showGstin && !value.id && (
        <Field label="Their GSTIN (only for a business buyer)" className="sm:col-span-2">
          <Input value={value.gstin ?? ""} onChange={(e) => onChange({ ...value, gstin: e.target.value })} placeholder="Leave empty for a person" />
        </Field>
      )}
    </div>
  );
}

/* ---------- Item lines ---------- */

export function LinesEditor({ recs, s, lines, onChange, discount, onDiscount, purchase, interState }: {
  recs: AnyRec[]; s: Settings; lines: LineItem[]; onChange: (l: LineItem[]) => void; discount?: number; onDiscount?: (n: number) => void;
  /** Buying: lists materials and products kept in stock, at cost price. */ purchase?: boolean; interState?: boolean;
}) {
  const products = list(recs, "product").filter((p) => p.data.active);
  const materials = purchase ? list(recs, "material") : [];
  const regular = s.gst_mode === "regular";
  const choices = [
    ...materials.map((m) => ({ key: `m:${m.id}`, name: m.data.name, unit: m.data.unit, price: m.data.cost, gst: 0, left: stockOf(recs, m.id), stock: true })),
    ...products.filter((p) => !purchase || p.data.stock_mode === "self").map((p) => ({ key: `p:${p.id}`, name: p.data.name, unit: p.data.unit, price: purchase ? p.data.cost ?? 0 : p.data.price, gst: p.data.gst_rate, left: p.data.stock_mode === "self" ? stockOf(recs, p.id) : null, stock: p.data.stock_mode !== "none" })),
  ];
  const set = (i: number, patch: Partial<LineItem & { material_id?: string }>) => onChange(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const pick = (i: number, key: string) => {
    const c = choices.find((x) => x.key === key);
    if (!c) return set(i, { product_id: undefined, material_id: undefined } as Partial<LineItem>);
    const id = key.slice(2);
    set(i, { ...(key.startsWith("m:") ? { material_id: id, product_id: undefined } : { product_id: id, material_id: undefined }), name: c.name, unit: c.unit, price: c.price, gst_rate: c.gst } as Partial<LineItem>);
  };
  const totals = !purchase ? computeBill({ lines, gst_mode: s.gst_mode, inter_state: !!interState, prices_include_tax: s.prices_include_tax, discount }) : null;
  const purchaseTotal = purchase ? lines.reduce((a, l) => a + l.qty * l.price * (1 + (regular ? (l.gst_rate || 0) / 100 : 0)), 0) : 0;
  return (
    <div className="space-y-3">
      {lines.map((l, i) => {
        const key = (l as LineItem & { material_id?: string }).material_id ? `m:${(l as LineItem & { material_id?: string }).material_id}` : l.product_id ? `p:${l.product_id}` : "";
        const c = choices.find((x) => x.key === key);
        return (
          <div key={i} className="rounded-xl border-2 border-ink/20 bg-background p-3">
            <div className="grid gap-2 sm:grid-cols-[1.6fr_0.6fr_0.8fr_auto] sm:items-end">
              <Field label={i === 0 ? "Item" : ""}>
                <select className={selectCls} value={key} onChange={(e) => pick(i, e.target.value)} aria-label="Item">
                  <option value="">Type your own below</option>
                  {choices.map((x) => <option key={x.key} value={x.key}>{x.name} · {inr(x.price)}{x.left !== null ? ` · ${num(x.left)} left` : ""}</option>)}
                </select>
              </Field>
              <Field label={i === 0 ? "Qty" : ""}><Input type="number" inputMode="decimal" min={0} step="any" value={l.qty || ""} onChange={(e) => set(i, { qty: Number(e.target.value) })} aria-label="Quantity" /></Field>
              <Field label={i === 0 ? (purchase ? "Cost each" : "Price each") : ""}><Input type="number" inputMode="decimal" min={0} step="any" value={l.price || ""} onChange={(e) => set(i, { price: Number(e.target.value) })} aria-label="Price" /></Field>
              <Button type="button" variant="ghost" size="icon" onClick={() => onChange(lines.filter((_, j) => j !== i))} aria-label="Remove item" disabled={lines.length === 1}><Trash2 /></Button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-[1.6fr_1.4fr]">
              {!c && <Input value={l.name} placeholder="Item name" onChange={(e) => set(i, { name: e.target.value })} aria-label="Item name" />}
              {regular && (
                <select className={cn(selectCls, "h-9 text-sm")} value={l.gst_rate} onChange={(e) => set(i, { gst_rate: Number(e.target.value) })} aria-label="GST rate">
                  {GST_RATES.map((r) => <option key={r} value={r}>GST {r}%</option>)}
                </select>
              )}
              {c?.left !== null && c?.left !== undefined && !purchase && c.left < l.qty && <p className="text-sm font-semibold text-destructive">Only {num(c.left)} {c.unit} in stock</p>}
            </div>
          </div>
        );
      })}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...lines, { name: "", qty: 1, price: 0, gst_rate: 0 }])}><Plus /> Add item</Button>
        {onDiscount && (
          <label className="flex items-center gap-2 text-sm font-semibold">Discount ₹
            <Input className="h-9 w-28" type="number" min={0} inputMode="decimal" value={discount || ""} onChange={(e) => onDiscount(Number(e.target.value))} />
          </label>
        )}
      </div>
      {totals && (
        <div className="rounded-xl bg-sand p-3 text-sm">
          {regular && totals.cgst + totals.sgst + totals.igst > 0 && (
            <p className="flex justify-between"><span>Value {s.prices_include_tax ? "(inside the price)" : ""}</span><span className="tabular-nums">{inr(totals.taxable)}</span></p>
          )}
          {totals.igst > 0 && <p className="flex justify-between"><span>IGST</span><span className="tabular-nums">{inr(totals.igst)}</span></p>}
          {totals.cgst > 0 && <p className="flex justify-between"><span>CGST + SGST</span><span className="tabular-nums">{inr(totals.cgst + totals.sgst)}</span></p>}
          {totals.discount > 0 && <p className="flex justify-between"><span>Discount</span><span className="tabular-nums">−{inr(totals.discount)}</span></p>}
          <p className="flex justify-between text-base font-bold"><span>Total</span><span className="tabular-nums">{inr(totals.total)}</span></p>
        </div>
      )}
      {purchase && <p className="rounded-xl bg-sand p-3 text-right text-base font-bold tabular-nums">Total {inr(Math.round(purchaseTotal))}</p>}
    </div>
  );
}

export const blankLine = (): LineItem => ({ name: "", qty: 1, price: 0, gst_rate: 0 });
