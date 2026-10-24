/* My Business: the records one business keeps, and the settings of its workspace.
   Every record is one row of biz_records ({ id, kind, data }), so adding a field never needs SQL.
   Money is in rupees with paise as decimals; dates are ISO strings (YYYY-MM-DD or full timestamps). */

export type GstMode = "none" | "composition" | "regular";
export type PayMode = "cash" | "upi" | "card" | "bank";

export interface LineItem {
  product_id?: string;
  name: string;
  qty: number;
  unit?: string;
  price: number; // per unit, as typed by the owner
  gst_rate: number; // percent, used only in regular GST
}

export interface TaxedLine extends LineItem {
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface Customer { name: string; phone?: string; email?: string; address?: string; birthday?: string; state?: string; gstin?: string; notes?: string; tags?: string[] }
export type LeadStatus = "new" | "talking" | "quoted" | "won" | "lost";
export interface Lead { name: string; phone?: string; want: string; source: string; status: LeadStatus; value?: number; next_at?: string; customer_id?: string; order_id?: string }
export type StockMode = "none" | "self" | "recipe";
export interface Product { name: string; type: "product" | "service"; unit: string; price: number; gst_rate: number; hsn?: string; stock_mode: StockMode; low_at?: number; recipe?: { material_id: string; qty: number }[]; duration_min?: number; active: boolean; on_site: boolean; cost?: number }
export interface Material { name: string; unit: string; cost: number; low_at: number }
export type OrderStatus = "new" | "making" | "ready" | "delivered" | "cancelled";
export interface Order { number: string; customer_id?: string; customer_name: string; phone?: string; items: LineItem[]; due_at?: string; status: OrderStatus; source: string; notes?: string; bill_id?: string; advance: number }
export type ApptStatus = "booked" | "done" | "no_show" | "cancelled";
export interface Appointment { customer_id?: string; customer_name: string; phone?: string; product_id?: string; service: string; price: number; staff_id?: string; start_at: string; duration_min: number; status: ApptStatus; bill_id?: string }
export interface Bill { number: string; date: string; customer_id?: string; customer_name: string; phone?: string; customer_gstin?: string; order_id?: string; appointment_id?: string; gst_mode: GstMode; inter_state: boolean; lines: TaxedLine[]; discount: number; taxable: number; cgst: number; sgst: number; igst: number; round_off: number; total: number; cancelled?: boolean; notes?: string }
export interface Payment { date: string; amount: number; mode: PayMode; direction: "in" | "out"; customer_id?: string; bill_id?: string; supplier_id?: string; purchase_id?: string; note?: string }
export interface Supplier { name: string; phone?: string; gstin?: string; items?: string }
export interface Purchase { number: string; date: string; supplier_id?: string; supplier_name: string; bill_no?: string; lines: (LineItem & { material_id?: string })[]; taxable: number; tax: number; total: number }
export interface Expense { date: string; category: string; amount: number; mode: PayMode; note?: string; staff_id?: string }
export interface StockMove { date: string; item_id: string; item_kind: "product" | "material"; qty: number; reason: "sale" | "purchase" | "adjust" | "used" | "return"; ref_id?: string }
export interface Staff { name: string; phone?: string; role: string; monthly_pay: number; joined?: string; active: boolean }
export type AttendanceMark = "present" | "half" | "absent" | "leave";
export interface Attendance { date: string; staff_id: string; mark: AttendanceMark }
export type ReminderStatus = "open" | "sent" | "done" | "skipped";
export interface Reminder { due_at: string; kind: "pickup" | "dues" | "lead" | "appointment" | "licence" | "stock" | "birthday" | "custom"; customer_id?: string; phone?: string; to_name: string; text: string; ref_id?: string; status: ReminderStatus; step?: number }
export interface Campaign { title: string; message: string; audience: "all" | "regulars" | "lapsed" | "birthdays" | "leads"; send_on: string; sent_to: string[]; status: "draft" | "ready" | "sent" }
export interface Licence { name: string; number?: string; expires_on: string }

export interface RecordKinds {
  customer: Customer; lead: Lead; product: Product; material: Material; order: Order; appointment: Appointment; bill: Bill;
  payment: Payment; supplier: Supplier; purchase: Purchase; expense: Expense; stock_move: StockMove; staff: Staff;
  attendance: Attendance; reminder: Reminder; campaign: Campaign; licence: Licence;
}
export type Kind = keyof RecordKinds;
export const KINDS: Kind[] = ["customer", "lead", "product", "material", "order", "appointment", "bill", "payment", "supplier", "purchase", "expense", "stock_move", "staff", "attendance", "reminder", "campaign", "licence"];

export interface Rec<K extends Kind = Kind> { id: string; kind: K; data: RecordKinds[K]; created_at: string; updated_at: string }
export type AnyRec = { [K in Kind]: Rec<K> }[Kind];

export type ModuleId =
  | "overview" | "orders" | "appointments" | "leads" | "customers" | "bills" | "dues" | "stock" | "purchases"
  | "money" | "taxes" | "staff" | "reminders" | "marketing" | "website" | "reports" | "settings";

export interface Workspace {
  id: string;
  name: string;
  type_id: string; // business type from catalog.ts
  settings: Settings;
  created_at: string;
}

export interface Settings {
  owner_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state: string; // state name, used for CGST+SGST vs IGST
  gstin?: string;
  gst_mode: GstMode;
  composition_rate: number; // 1, 5 or 6 percent
  prices_include_tax: boolean;
  fssai?: string;
  upi_id?: string;
  bill_prefix: string;
  order_prefix: string;
  purchase_prefix: string;
  counters: { bill: number; order: number; purchase: number };
  opening_cash: number;
  modules: ModuleId[];
  labels: { order: string; orders: string; customer: string; customers: string; product: string; products: string };
  language: "en" | "hi";
  site: { slug: string; published: boolean; about: string; take_orders: boolean; colour: string };
  reminders: { pickup_hours_before: number; dues_days: number[]; lead_days: number[]; appt_hours_before: number };
  stage: "starting" | "running";
}

/** What one action changes. The store saves it in one go. */
export interface Change {
  upsert: AnyRec[];
  remove: string[];
  settings?: Partial<Settings>;
  /** Plain lines shown to the owner: what happened by itself. */
  notes: string[];
}
