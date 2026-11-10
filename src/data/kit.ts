import { CATALOG, fallbackTheme, getProduct } from "@/instant/catalog";
import type { Product } from "@/instant/types";

/** The one offer sold on /kit. Prices here are only for showing what the parts
 *  cost separately; the amount charged comes from the server (pack kit999).
 *  Every number on the page comes from here, so changing the offer is one edit
 *  here plus the matching server pack. */
export const KIT = {
  packId: "kit999",
  inr: 999,
  credits: 3000,
  /** What the normal ₹1,000 pack gives, and the free extra on top of it. */
  normalCredits: 2200,
  bonusCredits: 800,
  /** What the buyer can make, already paid for, after buying. */
  items: [
    { name: "A website for your business, published", worth: "₹149 to ₹299", scope: "business" as const },
    { name: "A digital visiting card, published", worth: "₹99", scope: "card" as const },
  ],
  /** Price ranges an influencer may choose designs from. Mirrors kit_product_scope in the database. */
  siteMaxInr: 299,
  cardMaxInr: 99,
  /** Shown until an influencer picks their own. */
  defaultSite: "boutique",
  defaultCard: "digital-visiting-card",
};

export type Trade = {
  key: string;
  label: string;
  who: string;
  whoPlural: string;
  siteWord: string;
  colour: string;
  hindi: string;
  sample: { name: string; tag: string; listTitle: string; rows: { n: string; p: string }[] };
  uses: { n: string; w: string }[];
  apps: { n: string; c: string }[];
};

export const TRADES: Trade[] = [
  {
    key: "shop", label: "Shop", who: "shop owner", whoPlural: "shop owners", siteWord: "shop website",
    colour: "#FFC800", hindi: "₹999 mein poori dukaan online.",
    sample: {
      name: "Shree Jewellers", tag: "Gold, silver and wedding sets", listTitle: "This Diwali",
      rows: [{ n: "Gold coins 22K", p: "Ask price" }, { n: "Silver payal pair", p: "₹1,850" }, { n: "Bridal sets", p: "Book a visit" }],
    },
    uses: [{ n: "2,200", w: "invoices" }, { n: "1,100", w: "GST quotations" }, { n: "180", w: "AI product photos" }],
    apps: [
      { n: "Invoice Generator", c: "1 credit" }, { n: "GST Quotation", c: "2 credits" },
      { n: "Remove Background", c: "1 credit" }, { n: "Offer Generator", c: "2 credits" },
      { n: "Discount Strategist", c: "1 credit" }, { n: "Customer Follow-up", c: "1 credit" },
    ],
  },
  {
    key: "salon", label: "Salon or parlour", who: "salon owner", whoPlural: "salon owners", siteWord: "salon website",
    colour: "#FF8FE9", hindi: "₹999 mein poora salon online.",
    sample: {
      name: "Glow Salon", tag: "Hair, skin and bridal makeup", listTitle: "Rate card",
      rows: [{ n: "Haircut and styling", p: "₹350" }, { n: "Facial", p: "₹900" }, { n: "Bridal makeup", p: "From ₹8,000" }],
    },
    uses: [{ n: "2,200", w: "review replies" }, { n: "1,100", w: "loyalty offers" }, { n: "2,200", w: "staff salary slips" }],
    apps: [
      { n: "Review Replier", c: "1 credit" }, { n: "Loyalty Program", c: "2 credits" },
      { n: "Social Media Plan", c: "2 credits" }, { n: "Offer Generator", c: "2 credits" },
      { n: "Salary Slip", c: "1 credit" }, { n: "Attendance Tracker", c: "1 credit" },
    ],
  },
  {
    key: "wedding", label: "Wedding service", who: "wedding vendor", whoPlural: "wedding vendors", siteWord: "studio website",
    colour: "#22C3A6", hindi: "₹999 mein aapka poora studio online.",
    sample: {
      name: "Frames by Arjun", tag: "Candid wedding photography", listTitle: "Packages",
      rows: [{ n: "Wedding day", p: "From ₹45,000" }, { n: "Pre-wedding shoot", p: "₹18,000" }, { n: "Album and reel", p: "Ask price" }],
    },
    uses: [{ n: "1,100", w: "client contracts" }, { n: "2,200", w: "photo enhancements" }, { n: "1,100", w: "social media plans" }],
    apps: [
      { n: "Service Agreement", c: "2 credits" }, { n: "Invoice Generator", c: "1 credit" },
      { n: "AI Photo Enhancer", c: "1 credit" }, { n: "Watermark Images", c: "1 credit" },
      { n: "Review Replier", c: "1 credit" }, { n: "Social Media Plan", c: "2 credits" },
    ],
  },
  {
    key: "pro", label: "Professional practice", who: "professional", whoPlural: "professionals", siteWord: "practice website",
    colour: "#8FB4FF", hindi: "₹999 mein aapki practice online.",
    sample: {
      name: "Sharma & Associates", tag: "Chartered accountants", listTitle: "Services",
      rows: [{ n: "GST filing", p: "Monthly" }, { n: "Income tax return", p: "Book a call" }, { n: "Company registration", p: "Ask fee" }],
    },
    uses: [{ n: "733", w: "rent agreements" }, { n: "1,100", w: "NDAs" }, { n: "733", w: "notice replies" }],
    apps: [
      { n: "Rent Agreement", c: "3 credits" }, { n: "Non-Disclosure Agreement", c: "2 credits" },
      { n: "Notice Reply Bot", c: "3 credits" }, { n: "Legal Notice", c: "2 credits" },
      { n: "Affidavit", c: "2 credits" }, { n: "Invoice Generator", c: "1 credit" },
    ],
  },
];

/** The kit's picks, as the influencer chose them (or the defaults). */
export type KitPicks = {
  site_product?: string | null; site_theme?: string | null;
  card_product?: string | null; card_theme?: string | null;
};

/** Websites an influencer may choose: business designs in the kit price range. */
export const kitSiteChoices = (priceOf: (p: Product) => number) =>
  CATALOG.filter((p) => p.family === "business" && priceOf(p) <= KIT.siteMaxInr);

/** Cards an influencer may choose: profile designs in the kit price range. */
export const kitCardChoices = (priceOf: (p: Product) => number) =>
  CATALOG.filter((p) => p.family === "profile" && priceOf(p) <= KIT.cardMaxInr);

/** Resolves a pick to a real product and design, falling back to the default. */
export function resolvePick(kind: "site" | "card", picks?: KitPicks | null) {
  const wantedP = kind === "site" ? picks?.site_product : picks?.card_product;
  const wantedT = kind === "site" ? picks?.site_theme : picks?.card_theme;
  const product = getProduct(wantedP) ?? getProduct(kind === "site" ? KIT.defaultSite : KIT.defaultCard)!;
  const theme = product.themes.find((t) => t.id === wantedT) ?? fallbackTheme(product);
  return { product, theme };
}
