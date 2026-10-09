// Everything here is generated from what the owner typed: business name,
// industry, city/area and products. It is deterministic (same input, same
// output) and runs in the browser — no API key or database needed.
//
// Rule: never invent facts. No "award-winning", "since 1990", "No. 1",
// ratings or customer counts — the owner adds those only if true.

import { resolveIndustry } from "./industries";
import type { Product, PublicBusiness, Business, Location, Submission } from "./business";

export type KeywordGroup = { title: string; hint: string; keywords: string[] };

const lc = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const uniq = (list: string[]) => Array.from(new Set(list.map(lc).filter(Boolean)));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function productTerms(products: Product[]): string[] {
  const terms: string[] = [];
  for (const p of products) {
    if (p.type) terms.push(p.type);
    if (p.name && lc(p.name) !== lc(p.type)) terms.push(p.name);
  }
  return uniq(terms);
}

export function generateKeywords(b: Business): KeywordGroup[] {
  const ind = resolveIndustry(b);
  const cities = uniq(b.locations.map((l) => l.city));
  const areas = uniq(b.locations.map((l) => l.area));
  const city = cities[0] ?? "";
  const area = areas[0] ?? "";
  const places = uniq([ind.place, ...ind.placeSynonyms]);
  const types = uniq(b.products.map((p) => p.type).filter(Boolean));
  const terms = productTerms(b.products);
  const where = uniq([
    ...b.locations.map((l) => (l.area && l.city ? `${l.area} ${l.city}` : "")),
    ...areas,
    ...cities,
  ]);

  const core = uniq([
    ...places.flatMap((pl) => [pl, ...where.map((w) => `${pl} in ${w}`)]),
    ...places.map((pl) => `${pl} near me`),
    lc(b.name),
    city && `${lc(b.name)} ${city}`,
  ]);

  const product = uniq(
    (types.length ? types : terms).flatMap((t) => [
      t,
      ...cities.map((c) => `${t} in ${c}`),
      ...areas.map((a) => `${t} in ${a}`),
      `${t} near me`,
      ...(ind.place.split(" ").some((w) => t.includes(w)) ? [] : [`${t} ${ind.place}`]),
    ]),
  );

  const intent = uniq(
    ind.modifiers.flatMap((m) =>
      [...places.slice(0, 2), ...types.slice(0, 4)].map((t) =>
        m === "near me" ? `${t} near me` : city ? `${m} ${t} in ${city}` : `${m} ${t}`,
      ),
    ),
  );

  const longTail = uniq(
    terms.slice(0, 12).flatMap((t) => [
      city && `where to buy ${t} in ${city}`,
      area && `${t} shop near ${area}`,
      `${t} price`,
    ]),
  ).filter((k) => !k.startsWith("where to buy") || ind.id !== "clinic");

  return [
    { title: "Core", hint: "Your business type + location. Use in your Google description and website title.", keywords: core },
    { title: "Products & services", hint: "Add each as a Product/Service in Google Business Profile.", keywords: product },
    { title: "Buyer intent", hint: "What people type when they are ready to visit. Use in Google posts.", keywords: intent },
    { title: "Long-tail", hint: "Low competition phrases. Good for Q&A and post captions.", keywords: longTail },
  ].filter((g) => g.keywords.length > 0);
}

export function generateDescription(b: Business, l: Location): string {
  const ind = resolveIndustry(b);
  const loc = [l.area, l.city].filter(Boolean).join(", ");
  const types = uniq(b.products.map((p) => p.type).filter(Boolean)).slice(0, 6);
  const list = types.length ? types : productTerms(b.products).slice(0, 6);
  const parts = [
    `${b.name} is a ${ind.place}${loc ? ` in ${loc}` : ""}.`,
    list.length ? `We offer ${joinList(list)}.` : "",
    b.highlights.length ? `Customers visit us for ${joinList(b.highlights.slice(0, 3).map(lc))}.` : "",
    `Visit us${loc ? ` in ${l.area || l.city}` : ""}${b.phone ? ` or call ${b.phone}` : ""} — we are happy to help you choose.`,
  ];
  return parts.filter(Boolean).join(" ").slice(0, 750);
}

export function generatePosts(b: Business, l: Location): { title: string; body: string }[] {
  const loc = l.area || l.city;
  const items = b.products.slice(0, 6);
  const posts = items.map((p) => ({
    title: `${p.name}${p.type && lc(p.type) !== lc(p.name) ? ` (${p.type})` : ""}`,
    body: `Looking for ${lc(p.name)}${loc ? ` in ${loc}` : ""}? Drop by ${b.name} and our team will help you pick the right one. ${b.phone ? `Call ${b.phone} or ` : ""}visit us today.`,
  }));
  posts.push({
    title: "Thank you for your reviews",
    body: `Thank you to everyone who shared feedback about ${b.name}. Your reviews help other people${loc ? ` in ${loc}` : ""} find us — and help us keep improving.`,
  });
  return posts;
}

export function generateQA(b: Business, l: Location): { q: string; a: string }[] {
  const ind = resolveIndustry(b);
  const types = uniq(b.products.map((p) => p.type).filter(Boolean));
  const qa = [
    { q: `What does ${b.name} offer?`, a: types.length ? `We offer ${joinList(types.slice(0, 8))}.` : "Please add your products and services." },
    { q: `Where is ${b.name} located?`, a: [l.area, l.city].filter(Boolean).length ? `We are in ${[l.address, l.area, l.city].filter(Boolean).join(", ")}. Tap Directions on this listing to reach us.` : "Add your area and city." },
  ];
  if (b.phone) qa.push({ q: "How can I contact you?", a: `Call or WhatsApp us on ${b.phone}.` });
  types.slice(0, 3).forEach((t) => qa.push({ q: `Do you have ${lc(t)}?`, a: `Yes, ${b.name} has ${lc(t)}. Visit us or call to check what is available today.` }));
  if (ind.id === "restaurant") qa.push({ q: "Do you take party or bulk orders?", a: "Edit this answer to match what you offer." });
  return qa;
}

export type ReplyTone = "positive" | "neutral" | "negative";

export function generateReply(b: Pick<Business, "name" | "phone">, tone: ReplyTone, customer: string): string {
  const who = customer.trim() ? customer.trim().split(" ")[0] : "there";
  if (tone === "positive")
    return `Thank you so much, ${who}! We are really glad you had a good experience at ${b.name}. See you again soon.`;
  if (tone === "neutral")
    return `Thank you for the feedback, ${who}. We'd love to know what we could do better — please tell us on your next visit${b.phone ? ` or call ${b.phone}` : ""}.`;
  return `Hi ${who}, we're sorry your experience at ${b.name} was not what you expected. We'd like to make this right — please contact us${b.phone ? ` on ${b.phone}` : ""} so we can look into it.`;
}

export function reviewRequestMessage(name: string, link: string, customer = ""): string {
  const hi = customer.trim() ? `Hi ${customer.trim().split(" ")[0]}` : "Hi";
  return `${hi}, thank you for visiting ${name}! Could you take 30 seconds to share your honest experience? It really helps us: ${link}`;
}

/** Google Business Profile post caption for an approved customer moment. */
export function generateCaption(b: Business, l: Location | undefined, s: Submission): string {
  const where = l ? l.area || l.city : "";
  const name = s.customerName.trim().split(" ")[0];
  const bought = s.products.length ? ` for ${joinList(s.products.map(lc))}` : "";
  const quote = s.feedback.trim() ? `\n\n"${s.feedback.trim()}"${name ? ` — ${name}` : ""}` : "";
  return `Happy customer moment at ${b.name}${where ? `, ${where}` : ""}!\n\nThank you${name ? `, ${name},` : ""} for visiting us${bought}.${quote}\n\nVisit ${b.name}${l?.city ? ` in ${l.city}` : ""} — we'd love to help you too.`;
}

// ---------------------------------------------------------------------------
// Customer review draft — built ONLY from what the customer chose and typed.
// ---------------------------------------------------------------------------

export function buildReviewDraft(input: {
  biz: PublicBusiness;
  rating: number;
  products: string[];
  liked: string[];
  ownWords: string;
}): string {
  const { biz, rating, products, liked, ownWords } = input;
  const where = biz.a || biz.ln || biz.c;
  const place = `${biz.n}${where ? `, ${where}` : ""}`;
  const bought = products.length ? ` for ${joinList(products.map(lc))}` : "";
  const likedText = liked.length ? joinList(liked.map(lc)) : "";
  const own = ownWords.trim().replace(/\s+/g, " ");

  let opener: string;
  if (rating >= 5) opener = `Visited ${place}${bought}.`;
  else if (rating === 4) opener = `Visited ${place}${bought}. Good experience overall.`;
  else if (rating === 3) opener = `Visited ${place}${bought}. It was an average experience.`;
  else opener = `Visited ${place}${bought}. My experience was not good.`;

  const middle =
    rating >= 3
      ? likedText
        ? `What I liked: ${likedText}.`
        : ""
      : likedText
        ? `The positives: ${likedText}.`
        : "";

  return [opener, middle, own && (/[.!?]$/.test(own) ? own : `${own}.`)].filter(Boolean).join(" ");
}

function joinList(list: string[]) {
  if (list.length <= 1) return list.join("");
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

export { cap };
