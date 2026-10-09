import type { RowsBulk } from "../bulk/types";
import { emptyLocation, reviewPageUrl, saveBusiness, type Product } from "./lib/business";
import { INDUSTRIES, matchPreset, resolveIndustry } from "./lib/industries";
import { generateDescription, generateKeywords, generatePosts, generateQA } from "./lib/generate";

const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "business";

/** "Black forest cake: Cakes; Garlic bread: Breads" → products */
function parseProducts(text: string): Product[] {
  return text
    .split(/[;\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [name, type] = part.split(/\s*:\s*/);
      return { name: name ?? "", type: (type ?? "").trim() };
    });
}

/** Bulk mode: one Google Business kit per row; each business is also saved to the dashboard. */
export const googleBusinessBulk: RowsBulk = {
  mode: "rows",
  chargeLocal: true,
  max: 200,
  columns: [
    { key: "business", label: "Business name", required: true, example: "Sweet Crumbs" },
    { key: "type", label: "Business type (anything)", required: true, example: "Bakery" },
    { key: "products", label: "Products (name: type; …)", required: true, example: "Black forest cake: Cakes; Garlic bread: Breads" },
    { key: "city", label: "City", required: true, example: "Indore" },
    { key: "area", label: "Area", example: "Palasia" },
    { key: "phone", label: "Phone / WhatsApp", example: "9826012345" },
    { key: "review", label: "Google review link", example: "https://g.page/r/…/review" },
  ],
  note: "One Google Business kit per row (keywords, description, posts, Q&A, review link). Each business also appears in your Google Business Kit dashboard.",
  run: async (row) => {
    const typed = (row.type ?? "").trim();
    const preset = INDUSTRIES.find((i) => i.label.toLowerCase() === typed.toLowerCase()) ?? matchPreset(typed);
    const biz = saveBusiness({
      name: row.business.trim(),
      industry: preset && preset.id !== "other" ? preset.id : "custom",
      customIndustry: preset && preset.id !== "other" ? "" : typed,
      phone: (row.phone ?? "").trim(),
      products: parseProducts(row.products ?? ""),
      highlights: [],
      locations: [emptyLocation({ city: (row.city ?? "").trim(), area: (row.area ?? "").trim(), reviewLink: row.review ?? "" })],
    });
    const fixed = { ...biz, highlights: resolveIndustry(biz).praise };
    const loc = fixed.locations[0];
    const link = reviewPageUrl(fixed, loc);
    const keywords = generateKeywords(fixed);
    const section = (title: string, body: string) => `<h2>${esc(title)}</h2>${body}`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(fixed.name)} — Google Business Kit</title>
<style>body{font-family:Arial,sans-serif;max-width:820px;margin:24px auto;padding:0 16px;font-size:11pt;line-height:1.5}h1{margin-bottom:0}h2{margin-top:28px;border-bottom:1px solid #ddd;padding-bottom:4px}.kw span{display:inline-block;background:#f1f5f9;border-radius:4px;padding:2px 6px;margin:2px}small{color:#666}</style></head><body>
<h1>${esc(fixed.name)}</h1><small>${esc(resolveIndustry(fixed).label)} · ${esc([loc.area, loc.city].filter(Boolean).join(", "))}</small>
${section("Customer review link", `<p><a href="${esc(link)}">${esc(link)}</a></p><p><small>Share after every visit, or open the business in Google Business Kit to download its QR code.</small></p>`)}
${section("Business description", `<p>${esc(generateDescription(fixed, loc))}</p>`)}
${section("Keywords", keywords.map((g) => `<h3>${esc(g.title)}</h3><p><small>${esc(g.hint)}</small></p><div class="kw">${g.keywords.map((k) => `<span>${esc(k)}</span>`).join("")}</div>`).join(""))}
${section("Products & services to list", `<ul>${fixed.products.map((p) => `<li><b>${esc(p.name)}</b>${p.type ? ` — ${esc(p.type)}` : ""}</li>`).join("")}</ul>`)}
${section("Weekly post ideas", generatePosts(fixed, loc).map((p) => `<p><b>${esc(p.title)}</b><br>${esc(p.body)}</p>`).join(""))}
${section("Questions & answers", generateQA(fixed, loc).map((x) => `<p><b>${esc(x.q)}</b><br>${esc(x.a)}</p>`).join(""))}
</body></html>`;
    return {
      name: `gbk-${slug(fixed.name)}`,
      text: html,
      ext: "html",
      csvRow: { business: fixed.name, type: typed, city: loc.city, keywords: keywords.reduce((n, g) => n + g.keywords.length, 0), review_link: link },
    };
  },
};
