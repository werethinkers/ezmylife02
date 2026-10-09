// Sample data so an owner can see the dashboards working before real
// customers arrive. Every row is flagged `sample: true` and can be cleared.

import { insertSubmissions, newId, STATUSES, type Business, type Submission } from "./business";
import { resolveIndustry } from "./industries";

const NAMES = ["Aarav", "Priya", "Rohan", "Sneha", "Vikram", "Ananya", "Karan", "Meera", "Arjun", "Divya", "Rahul", "Pooja", "Nikhil", "Isha"];
const LINES = [
  "Staff explained everything patiently.",
  "Found exactly what I needed.",
  "Will definitely come again.",
  "Waited a bit at the counter.",
  "Good experience overall.",
  "Very clean and well organised.",
  "",
];

export function loadSampleData(b: Business, count = 28) {
  const ind = resolveIndustry(b);
  const products = b.products.map((p) => p.name);
  const praise = b.highlights.length ? b.highlights : ind.praise;
  const now = Date.now();
  const rows: Submission[] = [];
  for (let i = 0; i < count; i++) {
    const loc = b.locations[i % b.locations.length];
    const rating = [5, 5, 5, 4, 4, 4, 3, 5, 2, 4, 5, 1][i % 12];
    const created = new Date(now - Math.floor((i / count) * 14 * 864e5) - (i % 5) * 36e5).toISOString();
    const consent = i % 7 !== 3;
    const status = !consent ? "Missing consent" : (["Pending approval", "Approved", "Posted on Google", "Pending approval", "Rejected", "Internal only", "Needs edit"] as const)[i % 7];
    const bought = products.length ? [products[i % products.length]] : [];
    const liked = rating >= 3 ? [praise[i % praise.length], praise[(i + 2) % praise.length]] : [];
    const feedback = LINES[i % LINES.length];
    rows.push({
      id: newId(),
      businessId: b.id,
      locationId: loc.id,
      customerName: NAMES[i % NAMES.length],
      customerPhone: `98${String(10000000 + i * 7919).slice(0, 8)}`,
      rating,
      products: bought,
      liked,
      feedback,
      reviewText: `Visited ${b.name}${bought.length ? ` for ${bought[0].toLowerCase()}` : ""}. ${liked.length ? `What I liked: ${liked.join(" and ").toLowerCase()}. ` : ""}${feedback}`.trim(),
      consentMarketing: consent,
      consentGenuine: true,
      reviewCopied: i % 4 !== 1,
      reviewOpened: i % 3 !== 1,
      status: STATUSES.includes(status) ? status : "Pending approval",
      caption: "",
      googlePostId: status === "Posted on Google" ? `sample-${i}` : "",
      postedAt: status === "Posted on Google" ? created : "",
      createdAt: created,
      updatedAt: created,
      log: [{ at: created, action: "Feedback submitted", by: "Customer" }],
      sample: true,
    });
  }
  insertSubmissions(rows);
}
