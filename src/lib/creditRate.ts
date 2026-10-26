/*
 * Websites and cards cost credits as well as rupees: 2.2 credits per rupee, rounded up. That is the
 * rate of the 1,000 rupee pack (2,200 credits). The server decides the real amount
 * (ip_credits_for_inr in supabase/migrations/20261026100000_promo_uncapped_and_page_credits.sql);
 * this copy is only for showing the price, so keep the two numbers the same.
 */
export const CREDITS_PER_INR = 2.2;

export const creditsForInr = (inr: number) => Math.ceil(Math.max(0, inr) * CREDITS_PER_INR);

/** What a credit balance is worth in rupees, to the nearest rupee. */
export const inrForCredits = (credits: number) => Math.round(Math.max(0, credits) / CREDITS_PER_INR);
