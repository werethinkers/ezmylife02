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
    date: todayText(),
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
