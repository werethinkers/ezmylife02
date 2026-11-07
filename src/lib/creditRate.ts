/*
 * Websites and cards are priced and paid in credits only. Their credit price is ip_products.price_credits;
 * products without one fall back to their old rupee value at 2.2 credits per rupee, rounded up (the rate of
 * the 1,000 rupee pack). The server decides the real amount (ip_product_credits / ip_credits_for_inr in
 * supabase/migrations); this copy is only for showing the price, so keep the numbers the same.
 */
export const CREDITS_PER_INR = 2.2;

export const creditsForInr = (inr: number) => Math.ceil(Math.max(0, inr) * CREDITS_PER_INR);

/** What a credit balance is worth in rupees, to the nearest rupee. */
export const inrForCredits = (credits: number) => Math.round(Math.max(0, credits) / CREDITS_PER_INR);

/**
 * "Send all on WhatsApp". The server charges ip_bulk_send_price() (migration 20261107120000); keep these the same.
 *   from my WhatsApp:  1 credit per 10 people, rounded up
 *   automatic:         4 credits per person (EZYOURLIFE's WhatsApp number sends them; failed ones are refunded)
 */
export const SEND_ALL_PEOPLE_PER_CREDIT = 10;
export const SEND_ALL_AUTO_CREDITS_EACH = 4;
export const SEND_ALL_MAX = 2000;
export const sendAllCredits = (mode: "queue" | "auto", people: number) =>
  people <= 0 ? 0 : mode === "auto" ? people * SEND_ALL_AUTO_CREDITS_EACH : Math.ceil(people / SEND_ALL_PEOPLE_PER_CREDIT);

export const fmtCredits = (n: number) => `${Math.max(0, n).toLocaleString("en-IN")} ${n === 1 ? "credit" : "credits"}`;
