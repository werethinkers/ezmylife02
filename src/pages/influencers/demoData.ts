// Demo numbers for the creator dashboard of the work.abhijay account.
// Nothing is written to the database: the numbers are laid over the real
// campaign (name, code, link, offer settings stay real) when that account is
// signed in, so no fake sale can reach admin reports, refunds or payouts.
//
// Totals: 415 sales through the link, ₹4,15,000 sold, 30% commission,
// ₹1,24,500 earned = ₹90,000 paid + ₹24,500 ready + ₹10,000 waiting.
// ₹90,000 was paid in three ₹30,000 payments with 10% TDS each.

type Sale = { label: string; purchased_at: string; amount_inr: number; commission_inr: number;
              commission_pct: number; status: string; payable_after: string };

const DEMO_EMAIL_NAME = "work.abhijay";

export const isDemoAccount = (email?: string | null) =>
  (email ?? "").toLowerCase().split("@")[0] === DEMO_EMAIL_NAME;

const ago = (days: number, hour = 12) => {
  const t = new Date();
  t.setDate(t.getDate() - days);
  t.setHours(hour, 0, 0, 0);
  return t;
};
const iso = (t: Date) => t.toISOString();
const ymd = (t: Date) => t.toISOString().slice(0, 10);

const CITIES = ["Indore", "Pune", "Jaipur", "Bhopal", "Surat", "Nagpur", "Lucknow", "Ahmedabad", "Nashik", "Raipur", "Kochi", "Delhi"];
const WINDOW_DAYS = 7;

export function demoOverlay<T extends Record<string, any>>(real: T): T {
  const pct = 30;
  const sales: Sale[] = Array.from({ length: 14 }, (_, i) => {
    const days = i < 3 ? 0 : i; // three today, then roughly one a day going back
    const bought = ago(days, 20 - (i % 9));
    const payable = new Date(bought.getTime() + WINDOW_DAYS * 86_400_000);
    const status = payable.getTime() > Date.now() ? "pending" : "approved";
    return {
      label: `₹999 kit · ${CITIES[i % CITIES.length]}`,
      purchased_at: iso(bought),
      amount_inr: 999,
      commission_inr: 299.7,
      commission_pct: pct,
      status,
      payable_after: iso(payable),
    };
  });

  const clickCounts = [212, 187, 240, 305, 198, 276, 322, 254, 231, 289, 341, 296, 268, 318];
  const clicks_by_day = clickCounts.map((clicks, i) => ({ day: ymd(ago(13 - i)), clicks }));

  const payments = [
    { paid_at: iso(ago(8)), ref: "UTR-DEMO-0003" },
    { paid_at: iso(ago(38)), ref: "UTR-DEMO-0002" },
    { paid_at: iso(ago(68)), ref: "UTR-DEMO-0001" },
  ].map((p) => ({ paid_at: p.paid_at, commission_inr: 30_000, tds_inr: 3_000, received_inr: 27_000, reference: p.ref }));

  return {
    ...real,
    commission_pct: pct,
    clicks: 6_920,
    buyers: 415,
    orders: 415,
    conversion_pct: 6,
    sales_inr: 415_000,
    earning_waiting_inr: 10_000,
    earning_ready_inr: 24_500,
    earning_paid_inr: 90_000,
    tds_deducted_inr: 9_000,
    net_received_inr: 81_000,
    sales,
    clicks_by_day,
    payments,
  };
}
