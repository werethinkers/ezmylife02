export interface CreditPack {
  id: string;
  inr: number;
  credits: number;
  badge?: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "p10",   inr: 10,   credits: 15 },
  { id: "p50",   inr: 50,   credits: 80 },
  { id: "p100",  inr: 100,  credits: 180 },
  { id: "p250",  inr: 250,  credits: 500,  badge: "Popular" },
  { id: "p500",  inr: 500,  credits: 1100, badge: "Better value" },
  { id: "p1000", inr: 1000, credits: 2200, badge: "Best value" },
];

/** Credits per ₹ for the smallest pack — used to highlight savings. */
export const BASELINE_CREDITS_PER_RUPEE = CREDIT_PACKS[0].credits / CREDIT_PACKS[0].inr;
