import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { categoriesOf, goalOf } from "@/data/goals";

/*
 * Design ideas: the shops of the Bazaar home page and the bundles of the Thali.
 * Everything shown (names, prices, counts) is read from the live catalogue; only the grouping
 * below is design. An app can sit in one shop only, the first that matches it.
 */

export type Shop = {
  id: string;
  /** The painted board over the door. */
  name: string;
  /** Plain words under it. */
  line: string;
  /** Awning colour (a brand colour variable). */
  color: string;
  match: (t: CatalogTool) => boolean;
};

const inCats = (cats: string[]) => (t: CatalogTool) => categoriesOf(t).some((c) => cats.includes(c));

export const SHOPS: Shop[] = [
  { id: "bill-ghar", name: "Bill Ghar", line: "Invoices, tax and money sums", color: "hsl(var(--sun))", match: inCats(["Finance & Accounting"]) },
  {
    id: "photo-studio",
    name: "Photo Studio",
    line: "Passport photos, backgrounds and edits",
    color: "hsl(var(--teal))",
    match: inCats(["Image Tools", "ID & Exam Photos", "Photo Enhance & Retouch", "Blur & Privacy", "Social Media Sizes", "AI Image Generation"]),
  },
  { id: "vakeel-sahab", name: "Vakeel Sahab", line: "Agreements, notices and legal letters", color: "hsl(var(--lime))", match: inCats(["Legal & Compliance"]) },
  { id: "munim-ji", name: "Munim Ji", line: "Staff, salary, stock and shifts", color: "hsl(var(--coral))", match: inCats(["HR & Staffing", "Operations & Inventory"]) },
  { id: "grahak-gali", name: "Grahak Gali", line: "Find buyers, write posts, answer customers", color: "hsl(var(--pink))", match: inCats(["Marketing & Sales", "Customer Service", "Networking", "Content Creation"]) },
  { id: "sahayak", name: "Sahayak", line: "Helpers that read, check and write for you", color: "hsl(var(--sky))", match: (t) => goalOf(t.category).id === "helpers" },
];

/** Splits live apps into shops. Apps that fit no shop are left out of the lane (they still show on the full board). */
export function appsByShop(live: CatalogTool[]): Map<string, CatalogTool[]> {
  const out = new Map<string, CatalogTool[]>(SHOPS.map((s) => [s.id, []]));
  for (const t of live) {
    const shop = SHOPS.find((s) => s.match(t));
    if (shop) out.get(shop.id)!.push(t);
  }
  return out;
}

export function shopOf(t: CatalogTool): Shop | undefined {
  return SHOPS.find((s) => s.match(t));
}

/** A thali: a few apps that go together. Each slot is found by name in the live catalogue, so nothing is shown that does not exist. */
export type Bundle = { id: string; name: string; line: string; color: string; slots: RegExp[] };

export const BUNDLES: Bundle[] = [
  { id: "dukaan", name: "Dukaan Thali", line: "Everything to bill your customers", color: "hsl(var(--sun))", slots: [/invoice/i, /gst|tax/i, /expense|stock|inventory/i, /quotation|estimate/i] },
  { id: "naukri", name: "Naukri Thali", line: "Get ready for a job", color: "hsl(var(--sky))", slots: [/resume/i, /interview/i, /linkedin/i, /cover letter/i] },
  { id: "photo", name: "Photo Thali", line: "Photos that forms accept", color: "hsl(var(--teal))", slots: [/passport/i, /background/i, /signature/i, /resize|compress/i] },
  { id: "kagaz", name: "Kagaz Thali", line: "Papers without a lawyer's visit", color: "hsl(var(--lime))", slots: [/rent/i, /legal notice|notice/i, /offer letter/i, /contract|agreement/i] },
];

export type ResolvedBundle = Bundle & { apps: CatalogTool[] };

export function resolveBundles(live: CatalogTool[]): ResolvedBundle[] {
  return BUNDLES.map((b) => {
    const used = new Set<string>();
    const apps: CatalogTool[] = [];
    for (const re of b.slots) {
      const hit = live.find((t) => re.test(t.name) && !used.has(t.id));
      if (hit) {
        used.add(hit.id);
        apps.push(hit);
      }
    }
    return { ...b, apps };
  }).filter((b) => b.apps.length >= 3);
}
