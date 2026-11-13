import type { WorkspaceProfile } from "../lib/workspace";
import { TEMPLATE_ACCENT, templateFor, todayText } from "./choice";
import { markdownToBlocks, plainLine } from "./markdown";
import type { Letterhead, PdfBlock, PdfDoc, TemplateId } from "./types";

/** The saved business details as a letterhead, or nothing when no business name is saved. */
export function letterheadFrom(p: WorkspaceProfile): Letterhead | undefined {
  const name = p.businessName?.trim();
  if (!name) return undefined;
  const contact = [p.phone, p.email].map((s) => s?.trim()).filter(Boolean).join(" · ");
  const place = p.address?.trim() || [p.city, p.state].map((s) => s?.trim()).filter(Boolean).join(", ");
  const lines = [place, contact, p.gstin?.trim() ? `GSTIN ${p.gstin.trim()}` : "", p.website?.trim() ?? ""].filter(Boolean) as string[];
  return { name, tagline: p.industry?.trim() || undefined, lines };
}

/** First one or two sentences of the first paragraph: the line under a report's title. */
function summaryOf(blocks: PdfBlock[]): string | undefined {
  const p = blocks.find((b) => b.t === "p") as { text: string } | undefined;
  if (!p) return undefined;
  const text = plainLine(p.text.replace(/\n/g, " "));
  const sentences = text.match(/[^.!?।]+[.!?।]+/g) ?? [text];
  const s = sentences.slice(0, 2).join(" ").trim();
  return s.length > 240 ? `${s.slice(0, 237).trim()}…` : s;
}

/** An AI result (Markdown) as a PDF document in the app's template. */
export function docFromText(opts: {
  toolId: string;
  text: string;
  appName: string;
  fileName: string;
  profile: WorkspaceProfile;
  template?: TemplateId;
}): PdfDoc {
  const template = opts.template ?? templateFor(opts.toolId);
  const { title, blocks } = markdownToBlocks(opts.text);
  return {
    template,
    title: title ? plainLine(title) : opts.appName,
    kicker: opts.appName,
    subtitle: template === "report" ? summaryOf(blocks) : undefined,
    date: /[\u0900-\u097F]/.test(opts.text) ? new Date().toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" }) : todayText(),
    accent: TEMPLATE_ACCENT[template],
    landscape: template === "register",
    letterhead: letterheadFrom(opts.profile),
    blocks,
    fileName: opts.fileName,
  };
}

const inr = (v: string) => {
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) && v.trim() ? `₹${n.toLocaleString("en-IN")}` : v;
};

/** A calculator's answer as a Statement PDF: what was entered, the answer, the split, the full table, the AI note. */
export function docFromCalc(opts: {
  toolId: string;
  appName: string;
  fileName: string;
  profile: WorkspaceProfile;
  fields: { key: string; label: string; type?: string }[];
  values: Record<string, string>;
  out: { results: { label: string; value: string; main?: boolean }[]; split?: { label: string; value: number }[]; table?: { columns: string[]; rows: string[][] }; note?: string };
  explanation?: string;
}): PdfDoc {
  const given = opts.fields
    .filter((f) => (opts.values[f.key] ?? "").trim())
    .map((f) => [f.label, f.type === "money" ? inr(opts.values[f.key]) : opts.values[f.key]] as [string, string]);
  const results = [...opts.out.results].sort((a, b) => Number(!!b.main) - Number(!!a.main));
  const blocks: PdfBlock[] = [];
  if (given.length) blocks.push({ t: "box", label: "You entered", tint: true, blocks: [{ t: "kv", rows: given }] });
  for (let i = 0; i < results.length; i += 4) blocks.push({ t: "tiles", items: results.slice(i, i + 4).map((r, j) => ({ label: r.label, value: r.value, main: i + j === 0 })) });
  if (opts.out.split?.some((p) => p.value > 0)) {
    blocks.push({ t: "h", level: 3, text: "Where the money goes" });
    blocks.push({ t: "split", parts: opts.out.split });
  }
  if (opts.out.table?.rows.length) {
    blocks.push({ t: "h", level: 2, text: "Full breakdown" });
    blocks.push({ t: "table", head: opts.out.table.columns, rows: opts.out.table.rows });
  }
  if (opts.explanation?.trim()) {
    const { blocks: ex } = markdownToBlocks(opts.explanation);
    blocks.push({ t: "h", level: 2, text: "What this means" }, ...ex);
  }
  if (opts.out.note) blocks.push({ t: "note", text: opts.out.note });
  blocks.push({ t: "note", text: "Worked out exactly from the numbers above. Your bank's or office's figures can differ slightly because of rounding and dates." });
  return {
    template: "statement",
    title: opts.appName,
    kicker: opts.appName,
    date: todayText(),
    accent: TEMPLATE_ACCENT.statement,
    letterhead: letterheadFrom(opts.profile),
    blocks,
    fileName: opts.fileName,
  };
}

/** A tracker's rows as a landscape Register PDF, with sign-off lines. */
export function docFromRows(opts: {
  appName: string;
  fileName: string;
  profile: WorkspaceProfile;
  columns: { key: string; label: string }[];
  rows: Record<string, unknown>[];
  summary?: string;
}): PdfDoc {
  const blocks: PdfBlock[] = [];
  if (opts.summary?.trim()) blocks.push(...markdownToBlocks(opts.summary).blocks);
  blocks.push({
    t: "table",
    head: ["#", ...opts.columns.map((c) => c.label)],
    rows: opts.rows.map((r, i) => [String(i + 1), ...opts.columns.map((c) => String(r[c.key] ?? ""))]),
  });
  blocks.push({ t: "sign", lines: ["Checked by", "Approved by", "Date"] });
  return {
    template: "register",
    title: opts.appName,
    kicker: opts.appName,
    subtitle: `${opts.rows.length} ${opts.rows.length === 1 ? "entry" : "entries"}`,
    date: todayText(),
    accent: TEMPLATE_ACCENT.register,
    landscape: true,
    letterhead: letterheadFrom(opts.profile),
    blocks,
    fileName: opts.fileName,
  };
}

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const twoDigits = (n: number) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ""}`);
const threeDigits = (n: number) => [n >= 100 ? `${ONES[Math.floor(n / 100)]} hundred` : "", twoDigits(n % 100)].filter(Boolean).join(" ");

/** 123456.5 → "Rupees one lakh twenty-three thousand four hundred fifty-six and fifty paise only". */
export function rupeesInWords(amount: number): string {
  const r = Math.floor(Math.abs(amount));
  const p = Math.round((Math.abs(amount) - r) * 100);
  const parts: string[] = [];
  const crore = Math.floor(r / 1e7);
  const lakh = Math.floor((r % 1e7) / 1e5);
  const thousand = Math.floor((r % 1e5) / 1e3);
  const rest = r % 1e3;
  if (crore) parts.push(`${crore >= 100 ? rupeesInWords(crore).replace(/^Rupees | only$/g, "") : twoDigits(crore)} crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} thousand`);
  if (rest) parts.push(threeDigits(rest));
  const words = parts.join(" ") || "zero";
  return `Rupees ${words}${p ? ` and ${twoDigits(p)} paise` : ""} only`;
}

const money = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** An invoice on the seller's letterhead: bill-to, items with GST, totals, amount in words, signature. */
export function docFromInvoice(v: {
  companyName: string;
  companyAddress: string;
  companyGST: string;
  clientName: string;
  clientAddress: string;
  clientGST: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: { description: string; quantity: number; rate: number; gstRate: number }[];
  notes: string;
  profile: WorkspaceProfile;
}): PdfDoc {
  const fmtDate = (d: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");
  const items = v.items.filter((i) => i.description.trim());
  const subtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);
  const gst = items.reduce((s, i) => s + (i.quantity * i.rate * i.gstRate) / 100, 0);
  const total = subtotal + gst;
  const fromProfile = letterheadFrom(v.profile);
  const contact = [v.profile.phone, v.profile.email].map((s) => s?.trim()).filter(Boolean).join(" · ");
  const blocks: PdfBlock[] = [
    {
      t: "kv",
      rows: [
        ["Bill to", [v.clientName, v.clientAddress].filter(Boolean).join("\n")],
        ["Invoice no.", v.invoiceNumber],
        ["Customer GSTIN", v.clientGST || "Not given"],
        ["Invoice date", fmtDate(v.invoiceDate)],
        ...(v.dueDate ? ([["", ""], ["Due date", fmtDate(v.dueDate)]] as [string, string][]) : []),
      ],
    },
    {
      t: "table",
      head: ["#", "Item or service", "Qty", "Rate (₹)", "GST", "Amount (₹)"],
      rows: items.map((i, n) => [String(n + 1), i.description, String(i.quantity), money(i.rate), `${i.gstRate}%`, money(i.quantity * i.rate)]),
      foot: ["", "Taxable value", "", "", "", money(subtotal)],
    },
    {
      t: "tiles",
      items: [
        { label: "Taxable value", value: `₹${money(subtotal)}` },
        { label: "GST", value: `₹${money(gst)}` },
        { label: "Invoice total", value: `₹${money(total)}`, main: true },
      ],
    },
    { t: "p", text: `**Amount in words:** ${rupeesInWords(total)}` },
  ];
  if (v.notes.trim()) blocks.push({ t: "box", label: "Notes and payment details", tint: true, blocks: [{ t: "p", text: v.notes.trim() }] });
  blocks.push({ t: "sign", lines: [`Customer's signature`, `For ${v.companyName}\nAuthorised signatory`] });
  return {
    template: "letter",
    title: "Tax invoice",
    kicker: "Invoice Generator",
    date: fmtDate(v.invoiceDate) || todayText(),
    accent: TEMPLATE_ACCENT.letter,
    letterhead: {
      name: v.companyName,
      tagline: fromProfile?.name === v.companyName ? fromProfile?.tagline : undefined,
      lines: [v.companyAddress, contact, v.companyGST ? `GSTIN ${v.companyGST}` : ""].filter(Boolean),
    },
    blocks,
    fileName: `invoice-${v.invoiceNumber.replace(/[^\w-]+/g, "")}`,
  };
}

/** A purchase order on the buyer's letterhead: supplier, delivery, items with GST, totals, terms, signature. */
export function docFromPurchaseOrder(v: {
  number: string;
  date: string;
  deliveryDate: string;
  supplier: string;
  supplierGstin: string;
  supplierAddress: string;
  deliverTo: string;
  terms: string;
  notes: string;
  items: { item: string; hsn: string; qty: number; unit: string; rate: number; gst: number }[];
  profile: WorkspaceProfile;
}): PdfDoc {
  const fmtDate = (d: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");
  const subtotal = v.items.reduce((s, i) => s + i.qty * i.rate, 0);
  const gst = v.items.reduce((s, i) => s + (i.qty * i.rate * i.gst) / 100, 0);
  const total = subtotal + gst;
  const buyer = v.profile.businessName?.trim() || "Buyer";
  const blocks: PdfBlock[] = [
    {
      t: "kv",
      rows: [
        ["Supplier", [v.supplier, v.supplierAddress].filter(Boolean).join("\n")],
        ["PO no.", v.number],
        ["Supplier GSTIN", v.supplierGstin || "Not given"],
        ["PO date", fmtDate(v.date)],
        ["Deliver to", v.deliverTo || "—"],
        ["Deliver by", fmtDate(v.deliveryDate) || "As agreed"],
      ],
    },
    {
      t: "table",
      head: ["#", "Item", "HSN", "Qty", "Rate (₹)", "GST", "Amount (₹)"],
      rows: v.items.map((i, n) => [String(n + 1), i.item, i.hsn, `${i.qty} ${i.unit}`.trim(), money(i.rate), `${i.gst}%`, money(i.qty * i.rate)]),
      foot: ["", "Taxable value", "", "", "", "", money(subtotal)],
    },
    {
      t: "tiles",
      items: [
        { label: "Taxable value", value: `₹${money(subtotal)}` },
        { label: "GST", value: `₹${money(gst)}` },
        { label: "Order total", value: `₹${money(total)}`, main: true },
      ],
    },
    { t: "p", text: `**Amount in words:** ${rupeesInWords(total)}` },
  ];
  const terms = [v.terms && `**Payment terms:** ${v.terms}`, v.notes.trim()].filter(Boolean).join("\n\n");
  if (terms) blocks.push({ t: "box", label: "Terms and notes", tint: true, blocks: markdownToBlocks(terms).blocks });
  blocks.push({ t: "sign", lines: [`Accepted by supplier`, `For ${buyer}\nAuthorised signatory`] });
  return {
    template: "letter",
    title: "Purchase order",
    kicker: "Purchase Order",
    date: fmtDate(v.date) || todayText(),
    accent: TEMPLATE_ACCENT.letter,
    letterhead: letterheadFrom(v.profile),
    blocks,
    fileName: `purchase-order-${v.number.replace(/[^\w-]+/g, "")}`,
  };
}

/** Ready blocks as a document in one of the looks: for apps that build their own result. */
export function docFromBlocks(opts: {
  appName: string;
  template: TemplateId;
  blocks: PdfBlock[];
  profile: WorkspaceProfile;
  title?: string;
  subtitle?: string;
  fileName?: string;
}): PdfDoc {
  return {
    template: opts.template,
    title: opts.title || opts.appName,
    kicker: opts.appName,
    subtitle: opts.subtitle,
    date: todayText(),
    accent: TEMPLATE_ACCENT[opts.template],
    landscape: opts.template === "register",
    letterhead: letterheadFrom(opts.profile),
    blocks: opts.blocks,
    fileName: opts.fileName || `${opts.appName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().slice(0, 10)}`,
  };
}
