import { callFunction } from "@/lib/credits";
import { getBulkConfig } from "@/data/bulkTools";
import { APPS } from "../registry";
import { runApp } from "../lib/api";
import { dataUrlToBlob, fileText, imageToDataUrl, markdownToHtml, openPdf, pdfPageImage, pdfPageText, toCsv } from "../lib/files";
import { serializeValues } from "../shell/Fields";
import { googleBusinessBulk } from "../google-business/bulk";
import type { BulkColumn, BulkEnv, BulkResult, BulkSpec, RowsBulk } from "./types";
import type { AppDef, DocAppDef, Field, FormValues, RowColumn } from "../types";

/*
 * Bulk Mode for every app. Each app gets one of:
 *   - dropzone: the image tools' existing many-files flow,
 *   - rows: a CSV/table of inputs, one AI run (or local calculation) per row,
 *   - files: many files, one run per file.
 * Results download as one ZIP plus results.csv. Each item is charged on its own and only if
 * it succeeds (AI runs on the server; browser-only work via tool-charge).
 */

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "item";
const first = (row: Record<string, string>) => Object.values(row).find((v) => v?.trim()) ?? "item";
const num = (v: unknown) => {
  const n = parseFloat(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const r2 = (n: number) => Math.round(n * 100) / 100;
const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Readable Markdown from whatever JSON an AI app returns. */
export function toMarkdown(o: unknown): string {
  if (typeof o === "string") return o;
  if (Array.isArray(o)) return o.map((x) => (typeof x === "string" ? `- ${x}` : `- ${Object.values(x as object).join(" — ")}`)).join("\n");
  if (o && typeof o === "object") {
    return Object.entries(o as Record<string, unknown>)
      .map(([k, v]) => `## ${k.replace(/_/g, " ")}\n\n${typeof v === "string" ? v : Array.isArray(v) || typeof v === "object" ? toMarkdown(v) : String(v)}`)
      .join("\n\n");
  }
  return String(o ?? "");
}

const md = (name: string, text: string, csvRow?: BulkResult["csvRow"]): BulkResult => ({ name, text, ext: "md", csvRow });
const htmlDoc = (title: string, body: string) =>
  `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:24px auto;padding:0 16px;font-size:11pt}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px;text-align:left}th{background:#f3f4f6}</style></head><body>${body}</body></html>`;

// ───────────── Generic builders for engine apps ─────────────

/*
 * Bulk mode runs one app per CSV row, so an app's item table has to fit in a single cell.
 * The shape is `col=value | col=value ; col=value | col=value` — pipes between columns,
 * semicolons between rows — and the template's example cell shows it filled in. Plain
 * values in column order work too, for someone who would rather not type the keys.
 */
const ROW_SEP = ";";
const COL_SEP = "|";

function flattenRowsCell(rows: Record<string, string>[], cols: RowColumn[]): string {
  return rows
    .filter((r) => cols.some((c) => (r[c.key] ?? "").trim()))
    .map((r) =>
      cols
        .filter((c) => (r[c.key] ?? "").trim())
        .map((c) => `${c.key}=${r[c.key]}`)
        .join(` ${COL_SEP} `),
    )
    .join(`${ROW_SEP} `);
}

function parseRowsCell(text: string, cols: RowColumn[]): Record<string, string>[] {
  const keys = cols.map((c) => c.key);
  return text
    .split(ROW_SEP)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const row: Record<string, string> = {};
      const cells = part.split(COL_SEP).map((c) => c.trim());
      cells.forEach((cell, i) => {
        if (!cell) return;
        const named = cell.match(/^([A-Za-z0-9_]+)\s*=\s*([\s\S]*)$/);
        if (named && keys.includes(named[1])) row[named[1]] = named[2].trim();
        else if (keys[i]) row[keys[i]] = cell;
      });
      return row;
    })
    .filter((r) => Object.values(r).some((v) => v?.trim()));
}

function docBulk(toolId: string, def: DocAppDef): RowsBulk {
  const fields = def.fields;
  // The example cell: a plain sample value, an item table flattened to one cell, or the hint.
  const exampleFor = (f: Field) => {
    const v = def.sample?.[f.key];
    if (Array.isArray(v)) return f.columns ? flattenRowsCell(v, f.columns) : undefined;
    if (typeof v === "string" && v) return v;
    // A date cell is useless without the expected format, and a fixed date would go stale.
    if (f.type === "date") return f.placeholder ?? "YYYY-MM-DD";
    if (f.type === "select" && f.options?.length) return f.placeholder ?? f.options[0];
    return f.placeholder;
  };
  const columns: BulkColumn[] = fields.map((f) => ({ key: f.key, label: f.label, required: f.required, example: exampleFor(f) }));
  const tables = fields.filter((f) => f.type === "rows").map((f) => f.label);
  return {
    mode: "rows",
    columns,
    note:
      `One ${def.fileName.replace(/-/g, " ")} per row. Leave a cell empty and it becomes a [placeholder].` +
      (tables.length ? ` For ${tables.join(" and ")}, put the whole table in the cell as \`col=value ${COL_SEP} col=value ${ROW_SEP} next row\` — the example row shows the shape.` : ""),
    run: async (row, env) => {
      const values: FormValues = {};
      for (const f of fields) {
        const raw = (row[f.key] ?? "").trim();
        if (f.type === "rows") values[f.key] = raw && f.columns ? parseRowsCell(raw, f.columns) : [];
        else values[f.key] = raw || (f.profile ? env.profile[f.profile] ?? "" : "");
      }
      // Same inputs the form would send, so totals and tables come out identical.
      const inputs = { ...serializeValues(fields, values), ...(def.compute?.(values) ?? {}) };
      const out = await runApp<string>(toolId, { inputs, action: "generate" });
      return md(`${def.fileName}-${slug(first(row))}`, out);
    },
  };
}

function bulkFor(toolId: string, def: AppDef): BulkSpec | null {
  switch (def.engine) {
    case "doc":
      return docBulk(toolId, def);
    case "tracker":
      return {
        mode: "files",
        accept: ".csv,text/csv",
        note: "Add one CSV per branch, month or team (same columns as the tracker's export). You get an AI report for each.",
        run: async (file) => {
          const text = (await file.text()).slice(0, 28000);
          const out = await runApp<string>(toolId, { context: text, inputs: { File: file.name }, action: "generate" });
          return md(`report-${slug(file.name)}`, out);
        },
      };
    case "chat":
      return {
        mode: "rows",
        columns: [{ key: "q", label: "Question", required: true, example: def.suggestions[0] }],
        note: "One answer per question.",
        run: async (row) => md(`answer-${slug(row.q)}`, `**Q: ${row.q}**\n\n${await runApp<string>(toolId, { messages: [{ role: "user", content: row.q }] })}`),
      };
    case "vision":
      return {
        mode: "files",
        accept: "image/*,application/pdf",
        max: 40,
        note: "One result per photo or PDF (the first pages of each PDF are read).",
        run: async (file) => {
          const images: string[] = [];
          if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
            const doc = await openPdf(file);
            for (let p = 1; p <= Math.min(doc.numPages, toolId === "ocr" ? 3 : 4); p++) images.push(await pdfPageImage(doc, p));
          } else images.push(await imageToDataUrl(file, 2000));
          const out = await runApp<unknown>(toolId, { images });
          if (def.mode === "fields" && out && typeof out === "object") {
            const o = out as { document_type?: string; fields?: { label: string; value: string }[] };
            const row: Record<string, string> = { file: file.name, type: o.document_type ?? "" };
            for (const f of o.fields ?? []) row[f.label] = f.value;
            return { name: slug(file.name), text: JSON.stringify(out, null, 2), ext: "json", csvRow: row };
          }
          return md(slug(file.name), String(out));
        },
      };
    case "image":
      return {
        mode: "rows",
        columns: [
          { key: "prompt", label: "Describe the image", required: true, example: def.ideas[0] },
          { key: "style", label: "Style", example: def.styles[0] },
          { key: "aspect", label: "Shape (1:1, 16:9…)", example: def.aspects[0] },
        ],
        max: 25,
        note: "One image per row.",
        run: async (row) => {
          const url = await runApp<string>(toolId, { prompt: `${def.promptPrefix ? `${def.promptPrefix} ` : ""}${row.prompt}`, style: row.style || def.styles[0], aspect: row.aspect || def.aspects[0] });
          return { name: slug(row.prompt), blob: await dataUrlToBlob(url), ext: "png" };
        },
      };
    default:
      return null;
  }
}

// ───────────── Custom apps, native tools and dedicated pages ─────────────

const aiRows = (toolId: string, columns: BulkColumn[], toResult: (out: unknown, row: Record<string, string>) => BulkResult, opts: Partial<RowsBulk> = {}): RowsBulk => ({
  mode: "rows",
  columns,
  ...opts,
  run: async (row) => {
    const inputs = Object.fromEntries(columns.map((c) => [c.label, row[c.key] ?? ""]).filter(([, v]) => v));
    return toResult(await runApp<unknown>(toolId, { inputs, action: "generate" }), row);
  },
});

const content = async (body: Record<string, unknown>) => {
  const data = await callFunction<Record<string, unknown>>("content-generator", body);
  return toMarkdown(data.content ?? data.captions ?? data.hashtags ?? data.ideas ?? data.script ?? data.caption ?? data);
};

function invoiceHtml(row: Record<string, string>, env: BulkEnv) {
  const items = (row.items || "").split(";").map((s) => s.trim()).filter(Boolean).map((s) => {
    const [d, q, r, g] = s.split("|").map((x) => x.trim());
    return { d, q: num(q) || 1, r: num(r), g: g === undefined ? 18 : num(g) };
  });
  const sub = items.reduce((a, i) => a + i.q * i.r, 0);
  const gst = items.reduce((a, i) => a + (i.q * i.r * i.g) / 100, 0);
  const p = env.profile;
  const body = `<h1>Tax Invoice ${esc(row.number || "")}</h1><p>Date: ${esc(row.date || new Date().toISOString().slice(0, 10))}</p>
<table><tr><th>From</th><th>Bill to</th></tr><tr><td>${esc(p.businessName ?? "")}<br>${esc(p.address ?? "")}${p.gstin ? `<br>GSTIN ${esc(p.gstin)}` : ""}</td><td>${esc(row.client)}<br>${esc(row.address || "")}${row.gstin ? `<br>GSTIN ${esc(row.gstin)}` : ""}</td></tr></table><br>
<table><tr><th>Item</th><th>Qty</th><th>Rate</th><th>GST</th><th>Amount</th></tr>${items.map((i) => `<tr><td>${esc(i.d)}</td><td>${i.q}</td><td>₹${r2(i.r)}</td><td>${i.g}%</td><td>₹${r2(i.q * i.r * (1 + i.g / 100))}</td></tr>`).join("")}</table>
<p style="text-align:right">Subtotal ₹${r2(sub)}<br>GST ₹${r2(gst)} (CGST ₹${r2(gst / 2)} + SGST ₹${r2(gst / 2)})<br><b>Total ₹${r2(sub + gst)}</b></p>`;
  return { html: htmlDoc(`Invoice ${row.number || row.client}`, body), sub, gst };
}

function poHtml(row: Record<string, string>, env: BulkEnv) {
  const items = (row.items || "").split(";").map((s) => s.trim()).filter(Boolean).map((s) => {
    const m = s.match(/^(\d+(?:\.\d+)?)\s*(\w*)\s*x\s*(.+?)\s*@\s*([\d.]+)(?:\s*\+?\s*(\d+)%)?$/i);
    return m ? { q: num(m[1]), u: m[2], d: m[3], r: num(m[4]), g: m[5] ? num(m[5]) : 18 } : { q: 1, u: "", d: s, r: 0, g: 18 };
  });
  const sub = items.reduce((a, i) => a + i.q * i.r, 0);
  const gst = items.reduce((a, i) => a + (i.q * i.r * i.g) / 100, 0);
  const body = `<h1>Purchase Order ${esc(row.number || "")}</h1><p>Date: ${new Date().toISOString().slice(0, 10)}${row.deliver ? ` · Deliver by ${esc(row.deliver)}` : ""}</p>
<table><tr><th>Buyer</th><th>Supplier</th></tr><tr><td>${esc(env.profile.businessName ?? "")}<br>${esc(env.profile.address ?? "")}</td><td>${esc(row.supplier)}</td></tr></table><br>
<table><tr><th>Item</th><th>Qty</th><th>Rate</th><th>GST</th><th>Amount</th></tr>${items.map((i) => `<tr><td>${esc(i.d)}</td><td>${i.q} ${esc(i.u)}</td><td>₹${r2(i.r)}</td><td>${i.g}%</td><td>₹${r2(i.q * i.r * (1 + i.g / 100))}</td></tr>`).join("")}</table>
<p style="text-align:right">Subtotal ₹${r2(sub)} · GST ₹${r2(gst)} · <b>Total ₹${r2(sub + gst)}</b></p><p>Terms: ${esc(row.terms || "Payment within 30 days of delivery")}</p>`;
  return { html: htmlDoc(`PO ${row.number || row.supplier}`, body), total: sub + gst };
}

const CBSE = (p: number) => (p >= 91 ? "A1" : p >= 81 ? "A2" : p >= 71 ? "B1" : p >= 61 ? "B2" : p >= 51 ? "C1" : p >= 41 ? "C2" : p >= 33 ? "D" : "E");

const CUSTOM: Record<string, BulkSpec> = {
  "google-business-kit": googleBusinessBulk,
  // Business, browser-only
  "tool-1": {
    mode: "rows", chargeLocal: true,
    columns: [
      { key: "client", label: "Client", required: true, example: "Mehta Traders" },
      { key: "gstin", label: "Client GSTIN", example: "23ABCDE1234F1Z5" },
      { key: "address", label: "Client address", example: "12 MG Road, Indore" },
      { key: "items", label: "Items (desc|qty|rate|gst%; …)", required: true, example: "GST filing|1|5000|18; Bookkeeping|1|3000|18" },
      { key: "number", label: "Invoice no.", example: "INV-101" },
      { key: "date", label: "Date", example: "2026-10-09" },
    ],
    note: "One printable GST invoice per row (your business details come from your profile).",
    run: async (row, env) => {
      const { html, sub, gst } = invoiceHtml(row, env);
      return { name: `invoice-${slug(row.number || row.client)}`, text: html, ext: "html", csvRow: { client: row.client, invoice: row.number ?? "", subtotal: r2(sub), gst: r2(gst), total: r2(sub + gst) } };
    },
  },
  "tool-2": {
    mode: "rows", chargeLocal: true, max: 500,
    columns: [
      { key: "date", label: "Date", example: "2026-10-01" }, { key: "description", label: "Description", required: true, example: "Shop rent" },
      { key: "category", label: "Category", example: "Rent & Utilities" }, { key: "amount", label: "Amount (₹)", required: true, example: "25000" }, { key: "method", label: "Payment method", example: "UPI" },
    ],
    note: "Checks and totals many expenses at once; results.csv has every line plus category totals.",
    run: async (row) => ({ name: slug(row.description), csvRow: { date: row.date ?? "", description: row.description, category: row.category || "Miscellaneous", amount: r2(num(row.amount)), method: row.method ?? "" } }),
  },
  "tool-3": {
    mode: "rows", chargeLocal: true, max: 500,
    columns: [{ key: "product", label: "Product", required: true, example: "Kaju katli 500 g" }, { key: "sp", label: "Selling price", required: true, example: "550" }, { key: "cp", label: "Cost", required: true, example: "360" }, { key: "qty", label: "Quantity", example: "100" }, { key: "gst", label: "GST % (included in price)", example: "5" }],
    note: "Profit and margin for every product in one sheet.",
    run: async (row) => {
      const sp = num(row.sp), cp = num(row.cp), q = num(row.qty) || 1, g = num(row.gst);
      const net = g ? sp / (1 + g / 100) : sp;
      const p = net - cp;
      return { name: slug(row.product), csvRow: { product: row.product, price_ex_gst: r2(net), cost: cp, profit_per_unit: r2(p), margin_pct: net ? r2((p / net) * 100) : 0, quantity: q, total_profit: r2(p * q) } };
    },
  },
  "tool-4": {
    mode: "rows", chargeLocal: true, max: 500,
    columns: [{ key: "label", label: "Bill / party", example: "Invoice 101" }, { key: "amount", label: "Amount (₹)", required: true, example: "10000" }, { key: "gst", label: "GST %", example: "18" }, { key: "inclusive", label: "Price includes GST? (yes/no)", example: "no" }, { key: "tds", label: "TDS %", example: "10" }],
    note: "GST (CGST/SGST) and TDS for many amounts at once.",
    run: async (row) => {
      const a = num(row.amount), g = num(row.gst || "18"), inc = /^y/i.test(row.inclusive || "");
      const base = inc ? a / (1 + g / 100) : a;
      const tax = base * (g / 100), tds = base * (num(row.tds) / 100);
      return { name: slug(row.label || String(a)), csvRow: { item: row.label ?? "", taxable: r2(base), gst: r2(tax), cgst: r2(tax / 2), sgst: r2(tax / 2), invoice_total: r2(base + tax), tds: r2(tds), net_receivable: r2(base + tax - tds) } };
    },
  },
  "tool-30": {
    mode: "rows", chargeLocal: true, max: 500,
    columns: [{ key: "name", label: "Employee", required: true, example: "Ravi Kumar" }, { key: "ctc", label: "Annual CTC (₹)", required: true, example: "360000" }],
    note: "Monthly salary break-up for each employee (standard split: basic 40%, HRA 50% of basic, PF 12% of basic up to ₹1,800, PT ₹200). Check against your own policy.",
    run: async (row) => {
      const m = num(row.ctc) / 12, basic = m * 0.4, hra = basic * 0.5, pf = Math.min(basic * 0.12, 1800), gross = m - pf;
      return { name: slug(row.name), csvRow: { employee: row.name, monthly_ctc: r2(m), basic: r2(basic), hra: r2(hra), special: r2(gross - basic - hra), employer_pf: r2(pf), gross: r2(gross), employee_pf: r2(pf), professional_tax: 200, net_take_home: r2(gross - pf - 200) } };
    },
  },
  "tool-22": {
    mode: "rows", chargeLocal: true,
    columns: [{ key: "supplier", label: "Supplier", required: true, example: "Agrawal Traders" }, { key: "items", label: "Items (qty unit x item @ rate +gst%; …)", required: true, example: "10 bag x Sugar 50kg @ 2150 +5%; 200 pcs x Box 500g @ 9 +18%" }, { key: "number", label: "PO no.", example: "PO-2026-101" }, { key: "deliver", label: "Deliver by", example: "2026-10-20" }, { key: "terms", label: "Payment terms", example: "30 days" }],
    note: "One printable purchase order per row.",
    run: async (row, env) => {
      const { html, total } = poHtml(row, env);
      return { name: `po-${slug(row.number || row.supplier)}`, text: html, ext: "html", csvRow: { po: row.number ?? "", supplier: row.supplier, total: r2(total) } };
    },
  },
  "grade-calculator": {
    mode: "rows", chargeLocal: true, max: 500,
    columns: [{ key: "student", label: "Student", required: true, example: "Aarav" }, { key: "marks", label: "Marks obtained", required: true, example: "432" }, { key: "max", label: "Maximum marks", required: true, example: "500" }],
    note: "Percentage and grade (CBSE-style scale) for a whole class.",
    run: async (row) => {
      const p = num(row.max) ? (num(row.marks) / num(row.max)) * 100 : 0;
      return { name: slug(row.student), csvRow: { student: row.student, marks: row.marks, max: row.max, percent: r2(p), grade: CBSE(p), result: p >= 33 ? "Pass" : "Needs improvement" } };
    },
  },
  "bibliography-generator": {
    mode: "rows", chargeLocal: true, max: 500,
    columns: [{ key: "author", label: "Author(s) (Last, First)", required: true, example: "Sen, Amartya" }, { key: "title", label: "Title", required: true, example: "The Argumentative Indian" }, { key: "year", label: "Year", example: "2005" }, { key: "publisher", label: "Publisher / site", example: "Penguin" }, { key: "url", label: "URL", example: "" }, { key: "style", label: "Style (APA/MLA)", example: "APA" }],
    note: "A formatted reference list for all your sources.",
    run: async (row) => {
      const mla = /mla/i.test(row.style || "");
      const c = mla
        ? `${row.author}. *${row.title}*. ${row.publisher ? `${row.publisher}, ` : ""}${row.year || "n.d."}.${row.url ? ` ${row.url}` : ""}`
        : `${row.author} (${row.year || "n.d."}). *${row.title}*.${row.publisher ? ` ${row.publisher}.` : ""}${row.url ? ` ${row.url}` : ""}`;
      return { name: slug(row.title), text: c, ext: "md", csvRow: { citation: c.replace(/\*/g, "") } };
    },
  },
  "assignment-tracker": {
    mode: "rows", chargeLocal: true, max: 500,
    columns: [{ key: "task", label: "Assignment", required: true, example: "Physics lab report" }, { key: "subject", label: "Subject", example: "Physics" }, { key: "due", label: "Due date", required: true, example: "2026-10-15" }],
    note: "Sorts all assignments by due date and flags overdue ones.",
    run: async (row) => {
      const d = Math.round((new Date(row.due + "T00:00:00").getTime() - new Date(new Date().toISOString().slice(0, 10) + "T00:00:00").getTime()) / 86400000);
      return { name: slug(row.task), csvRow: { assignment: row.task, subject: row.subject ?? "", due: row.due, days_left: Number.isFinite(d) ? d : "", status: !Number.isFinite(d) ? "" : d < 0 ? "Overdue" : d <= 2 ? "Due soon" : "On track" } };
    },
  },
  // Browser apps whose bulk version is written by AI
  "tool-6": aiRows("tool-6", [{ key: "type", label: "Agreement type", required: true, example: "Service agreement" }, { key: "a", label: "Party A (you)", example: "Verma Tax Consultants, Indore" }, { key: "b", label: "Party B", required: true, example: "Mehta Traders, Indore" }, { key: "scope", label: "Scope of work", example: "Monthly GST filing" }, { key: "fee", label: "Fee / payment", example: "₹5,000 per month" }, { key: "dates", label: "Start – end", example: "1 Nov 2026 – 31 Oct 2027" }], (o, r) => md(`agreement-${slug(r.b)}`, String(o)), { note: "One agreement per row." }),
  "tool-28": aiRows("tool-28", [{ key: "role", label: "Role", required: true, example: "Delivery executive" }, { key: "loc", label: "Location", example: "Indore" }, { key: "exp", label: "Experience", example: "0–2 years" }, { key: "pay", label: "Salary", example: "₹15,000–18,000" }, { key: "req", label: "Requirements", example: "Two-wheeler, licence" }], (o, r) => md(`job-${slug(r.role)}`, String(o)), { note: "One job post per row." }),
  "quiz-maker": aiRows("quiz-maker", [{ key: "topic", label: "Topic", required: true, example: "Photosynthesis" }, { key: "n", label: "Questions", example: "10" }, { key: "level", label: "Level / class", example: "Class 7" }], (o, r) => md(`quiz-${slug(r.topic)}`, String(o))),
  "quiz": aiRows("quiz", [{ key: "topic", label: "Topic", required: true, example: "Indian geography" }, { key: "n", label: "Questions", example: "10" }, { key: "level", label: "Level", example: "Beginner" }], (o, r) => md(`quiz-${slug(r.topic)}`, String(o))),
  "lesson-planner": aiRows("lesson-planner", [{ key: "topic", label: "Topic", required: true, example: "Fractions" }, { key: "grade", label: "Class", example: "Class 5" }, { key: "dur", label: "Duration", example: "40 minutes" }], (o, r) => md(`lesson-${slug(r.topic)}`, String(o))),
  "flashcard-maker": aiRows("flashcard-maker", [{ key: "topic", label: "Topic", required: true, example: "French Revolution" }, { key: "n", label: "Number of cards", example: "20" }], (o, r) => md(`flashcards-${slug(r.topic)}`, String(o))),
  "study-planner": aiRows("study-planner", [{ key: "student", label: "Student", example: "Riya" }, { key: "subjects", label: "Subjects", required: true, example: "Maths, Science, English" }, { key: "exam", label: "Exam date", example: "2026-12-01" }, { key: "hours", label: "Hours per day", example: "3" }], (o, r) => md(`plan-${slug(r.student || r.subjects)}`, String(o))),
  "exam-scheduler": aiRows("exam-scheduler", [{ key: "student", label: "Student", example: "Riya" }, { key: "exams", label: "Exams (subject – date; …)", required: true, example: "Maths – 2 Dec; Science – 5 Dec" }], (o, r) => md(`timetable-${slug(r.student || r.exams)}`, String(o))),

  // AI native tools
  "social-post-generator": { mode: "rows", columns: [{ key: "topic", label: "Topic", required: true, example: "Diwali offer on sweets" }, { key: "platform", label: "Platform", example: "Instagram" }, { key: "tone", label: "Tone", example: "Festive" }], note: "One post per row.", run: async (r) => md(`post-${slug(r.topic)}`, await content({ type: "social-post", topic: r.topic, platform: r.platform || "Instagram", tone: r.tone || "Friendly", charLimit: /twitter|x/i.test(r.platform) ? 280 : 2200 })) },
  "caption-generator": { mode: "rows", columns: [{ key: "description", label: "What the post shows", required: true, example: "New kaju katli gift box" }, { key: "style", label: "Style", example: "Fun" }, { key: "keywords", label: "Keywords (comma separated)", example: "diwali, gifting" }], run: async (r) => md(`captions-${slug(r.description)}`, await content({ type: "captions", description: r.description, style: r.style || "Engaging", keywords: (r.keywords || "").split(",").map((s) => s.trim()).filter(Boolean), count: 5 })) },
  "hashtag-generator": { mode: "rows", columns: [{ key: "topic", label: "Topic", required: true, example: "Indore street food" }], run: async (r) => md(`hashtags-${slug(r.topic)}`, await content({ type: "hashtags", topic: r.topic, count: 30 })) },
  "content-idea-generator": { mode: "rows", columns: [{ key: "niche", label: "Niche", required: true, example: "Home bakery" }, { key: "format", label: "Format (optional)", example: "Reel" }], run: async (r) => md(`ideas-${slug(r.niche)}`, await content({ type: "content-ideas", niche: r.niche, format: r.format || null, count: 10 })) },
  "video-script-writer": { mode: "rows", columns: [{ key: "topic", label: "Topic", required: true, example: "3 GST mistakes shops make" }, { key: "duration", label: "Length (seconds)", example: "60" }, { key: "style", label: "Style", example: "Educational" }], run: async (r) => md(`script-${slug(r.topic)}`, await content({ type: "video-script", topic: r.topic, duration: num(r.duration) || 60, style: r.style || "Educational", keyPoints: [] })) },
  "content-workflow": {
    mode: "rows", columns: [{ key: "niche", label: "Niche", required: true, example: "Fitness coaching" }, { key: "platform", label: "Platform", example: "instagram" }],
    note: "Idea + full post for each row (2 workflow steps each).",
    run: async (r) => {
      const idea = (await callFunction<{ idea?: { title?: string; hook?: string; format?: string } }>("content-generator", { type: "workflow-idea", niche: r.niche, platform: r.platform || "instagram" })).idea ?? {};
      const post = await callFunction<{ content?: string }>("content-generator", { type: "workflow-content", idea: idea.title ?? r.niche, platform: r.platform || "instagram", format: idea.format || "post" });
      return md(`content-${slug(r.niche)}`, `# ${idea.title ?? r.niche}\n\n**Hook:** ${idea.hook ?? ""}\n\n${post.content ?? ""}`);
    },
  },
  "thumbnail-maker": { mode: "rows", max: 25, columns: [{ key: "prompt", label: "What the thumbnail shows", required: true, example: "Shocked chef holding a giant samosa" }, { key: "title", label: "Headline text", example: "I made a 5 kg samosa!" }, { key: "style", label: "Style", example: "vibrant" }], run: async (r) => ({ name: slug(r.title || r.prompt), blob: await dataUrlToBlob(await runApp<string>("thumbnail-maker", { prompt: `A professional, eye-catching YouTube video thumbnail. ${r.title ? `Large, legible headline text: "${r.title}". ` : ""}${r.prompt}.`, style: r.style || "vibrant", aspect: "16:9" })), ext: "png" }) },
  "video-maker": { mode: "rows", max: 25, columns: [{ key: "prompt", label: "Describe the video", required: true, example: "Drone shot over a tea estate at sunrise" }, { key: "aspect", label: "Shape", example: "16:9" }], note: "One keyframe image per row.", run: async (r) => {
    const d = await callFunction<{ videoUrl?: string }>("video-generator", { prompt: r.prompt, duration: 5, aspectRatio: r.aspect || "16:9", resolution: "1080p" });
    if (!d.videoUrl) throw new Error("No frame was generated");
    return { name: slug(r.prompt), blob: await dataUrlToBlob(d.videoUrl), ext: "png" };
  } },

  // Custom engine apps
  "wrong-written-words": { mode: "rows", columns: [{ key: "text", label: "Text", required: true, example: "Thsi is a sampel." }], run: async (r) => { const o = (await runApp<{ corrected: string; changes: unknown[] }>("wrong-written-words", { inputs: { Text: r.text } })) ?? { corrected: r.text, changes: [] }; return md(`corrected-${slug(r.text)}`, o.corrected, { original: r.text, corrected: o.corrected, changes: (o.changes ?? []).length }); } },
  "storybook-creator": { mode: "rows", columns: [{ key: "theme", label: "Story about", required: true, example: "A little elephant afraid of water" }, { key: "age", label: "Age group", example: "4–6 years" }, { key: "pages", label: "Pages", example: "8" }, { key: "language", label: "Language", example: "English" }], run: async (r) => {
    const o = await runApp<{ title: string; pages: { text: string; illustration: string }[] }>("storybook-creator", { inputs: { Theme: r.theme, "Age group": r.age, "Number of pages": r.pages, Language: r.language } });
    return md(`story-${slug(o.title || r.theme)}`, `# ${o.title}\n\n${(o.pages ?? []).map((p, i) => `## Page ${i + 1}\n\n${p.text}\n\n_Illustration: ${p.illustration}_`).join("\n\n")}`);
  } },
  "smart-diagram-ai": { mode: "rows", columns: [{ key: "desc", label: "Describe the diagram", required: true, example: "Order process from WhatsApp to delivery" }, { key: "type", label: "Diagram type", example: "Flowchart" }], note: "Each diagram downloads as Mermaid code (open it in this app or mermaid.live).", run: async (r) => { const o = await runApp<{ mermaid: string; title?: string }>("smart-diagram-ai", { inputs: { Description: r.desc, "Diagram type": r.type || "Flowchart" } }); return { name: slug(o.title || r.desc), text: o.mermaid, ext: "mmd" }; } },
  "interactive-videos": { mode: "rows", columns: [{ key: "topic", label: "Video topic", required: true, example: "Photosynthesis class 7" }, { key: "duration", label: "Length (min)", example: "10" }, { key: "n", label: "Questions", example: "5" }, { key: "url", label: "YouTube link (for your reference)", example: "" }], run: async (r) => {
    const o = await runApp<{ checkpoints: { at: string; question: string; options: string[]; answer: number; explanation: string }[] }>("interactive-videos", { inputs: { Topic: r.topic, "Video duration (minutes)": r.duration, "Number of checkpoints": r.n } });
    return md(`checkpoints-${slug(r.topic)}`, `# ${r.topic}${r.url ? `\n\n${r.url}` : ""}\n\n${(o.checkpoints ?? []).map((c) => `**${c.at} — ${c.question}**\n\n${c.options.map((x, i) => `${i === c.answer ? "✅" : "▫️"} ${x}`).join("\n\n")}\n\n_${c.explanation}_`).join("\n\n---\n\n")}`);
  } },
  "soul-mirror": aiRows("soul-mirror", [{ key: "name", label: "Name", required: true, example: "Priya" }, { key: "open", label: "Open area words", example: "kind, organised" }, { key: "blind", label: "Blind area words", example: "confident" }, { key: "hidden", label: "Hidden area words", example: "nervous" }], (o, r) => md(`reflection-${slug(r.name)}`, String(o)), { note: "One reflection per person (for coaches and team workshops)." }),
  "html-editor": { mode: "rows", max: 20, columns: [{ key: "instruction", label: "Page to build", required: true, example: "One-page site for a bakery with menu and WhatsApp button" }], run: async (r) => { const o = await runApp<{ html: string; css: string; js: string }>("html-editor", { inputs: { Instruction: r.instruction } }); return { name: slug(r.instruction), text: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${o.css ?? ""}</style></head><body>${o.html ?? ""}<script>${o.js ?? ""}</scr` + `ipt></body></html>`, ext: "html" }; } },
  "rich-editor": { mode: "rows", columns: [{ key: "instruction", label: "What to do", required: true, example: "Fix grammar" }, { key: "text", label: "Text", required: true, example: "" }], run: async (r) => md(`edited-${slug(r.text)}`, await runApp<string>("rich-editor", { inputs: { Instruction: r.instruction, Text: r.text } })) },
  "book-editor": { mode: "rows", columns: [{ key: "instruction", label: "What to do", required: true, example: "Tighten the prose" }, { key: "title", label: "Chapter title", example: "Chapter 1" }, { key: "text", label: "Chapter text", required: true, example: "" }], run: async (r) => md(slug(r.title || r.text), await runApp<string>("book-editor", { inputs: { Instruction: r.instruction, "Chapter title": r.title, Chapter: r.text } })) },
  "book-editor-html": { mode: "rows", columns: [{ key: "instruction", label: "What to do", required: true, example: "Tighten the prose" }, { key: "title", label: "Chapter title", example: "Chapter 1" }, { key: "text", label: "Chapter text", required: true, example: "" }], run: async (r) => { const t = await runApp<string>("book-editor-html", { inputs: { Instruction: r.instruction, "Chapter title": r.title, Chapter: r.text } }); return { name: slug(r.title || r.text), text: htmlDoc(r.title || "Chapter", markdownToHtml(t)), ext: "html" }; } },
  "ai-data-analysis": { mode: "files", accept: ".csv,text/csv", note: "One AI analysis per CSV file.", run: async (f) => md(`analysis-${slug(f.name)}`, await runApp<string>("ai-data-analysis", { inputs: { Dataset: f.name }, context: (await f.text()).slice(0, 25000) })) },
  "pdf-metadata-ai-analyst": { mode: "files", accept: "application/pdf,.pdf", run: async (f) => {
    const doc = await openPdf(f);
    const { info } = await doc.getMetadata();
    let text = "";
    for (let i = 1; i <= Math.min(3, doc.numPages); i++) text += `\n--- Page ${i} ---\n${await pdfPageText(doc, i)}`;
    const meta = { File: f.name, Pages: String(doc.numPages), Title: info?.Title ?? "", Author: info?.Author ?? "", Creator: info?.Creator ?? "", Producer: info?.Producer ?? "", Created: info?.CreationDate ?? "", Modified: info?.ModDate ?? "" };
    return md(`analysis-${slug(f.name)}`, await runApp<string>("pdf-metadata-ai-analyst", { inputs: meta, context: text.slice(0, 15000) }), meta);
  } },
  "pdf-profile-extractor": { mode: "files", accept: ".pdf,.txt,application/pdf", note: "One profile per resume; results.csv has them all.", run: async (f) => {
    const p = await runApp<Record<string, unknown>>("pdf-profile-extractor", { context: (await fileText(f)).slice(0, 25000), inputs: { "File name": f.name } });
    const exp = (p.experience as { title?: string; company?: string }[] | undefined)?.[0];
    return { name: slug(String(p.name || f.name)), text: JSON.stringify(p, null, 2), ext: "json", csvRow: { file: f.name, name: String(p.name ?? ""), email: String(p.email ?? ""), phone: String(p.phone ?? ""), location: String(p.location ?? ""), latest_role: exp ? `${exp.title} at ${exp.company}` : "", skills: ((p.skills as string[]) ?? []).join("; ") } };
  } },
  "dictionary-extractor-ai": { mode: "files", accept: ".pdf,.txt,.md", note: "One glossary per file.", run: async (f) => {
    const o = await runApp<{ terms: { term: string; definition: string }[] }>("dictionary-extractor-ai", { inputs: { "Definition language": "English" }, context: (await fileText(f)).slice(0, 25000) });
    return { name: `glossary-${slug(f.name)}`, text: toCsv((o.terms ?? []) as unknown as Record<string, unknown>[], [{ key: "term", label: "Term" }, { key: "definition", label: "Definition" }]), ext: "csv" };
  } },
  "pdf-chart-image-extractor": { mode: "files", accept: "application/pdf,.pdf", chargeLocal: true, note: "Every page of each PDF saved as a JPEG (one charge per PDF).", run: async (f) => {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    const doc = await openPdf(f);
    for (let p = 1; p <= Math.min(doc.numPages, 200); p++) zip.file(`page-${p}.jpg`, await dataUrlToBlob(await pdfPageImage(doc, p, 2000)));
    return { name: slug(f.name), blob: await zip.generateAsync({ type: "blob" }), ext: "zip", csvRow: { file: f.name, pages: doc.numPages } };
  } },

  // Dedicated pages
  "speedy-notebook": { mode: "rows", columns: [{ key: "prompt", label: "What to write or explain", required: true, example: "Explain compound interest simply" }], run: async (r) => md(slug(r.prompt), String((await callFunction<{ text?: string }>("notebook-ai", { action: "generate", prompt: r.prompt })).text ?? "")) },
  "promptmaster-ai": { mode: "rows", columns: [{ key: "draft", label: "Draft or keywords", required: true, example: "sunset beach photo, warm" }, { key: "format", label: "Format (text/image/video)", example: "image" }], run: async (r) => {
    const t = String((await callFunction<{ text?: string }>("promptmaster-ai", { action: "magic_write", keywords: r.draft, format: r.format || "text" })).text ?? "[]");
    let list: { title: string; prompt: string }[] = [];
    try { list = JSON.parse(t); } catch { /* keep raw */ }
    return md(slug(r.draft), list.length ? list.map((x) => `### ${x.title}\n\n${x.prompt}`).join("\n\n") : t);
  } },
  "productvision-360": { mode: "files", accept: "image/*", max: 20, unitsPerItem: 4, note: "4 catalogue angles (front, right, back, left) per product photo, charged per angle produced.", run: async (f) => {
    const url = await imageToDataUrl(f, 1600);
    const d = await callFunction<{ images?: { angle: string; mimeType: string; base64: string }[] }>("productvision-angles", { imageBase64: url.split(",")[1], mimeType: "image/jpeg", angles: ["Front", "Right", "Back", "Left"] });
    if (!d.images?.length) throw new Error("No angles came back");
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    for (const im of d.images) zip.file(`${im.angle}.png`, Uint8Array.from(atob(im.base64), (c) => c.charCodeAt(0)));
    return { name: slug(f.name), blob: await zip.generateAsync({ type: "blob" }), ext: "zip", csvRow: { file: f.name, angles: d.images.length } };
  } },
  "virasat": { mode: "files", accept: ".txt,.md", max: 10, note: "Upload interview transcripts (lines starting with Q: and A:). One keepsake book per file.", run: async (f) => {
    const history = (await f.text()).split(/\n+/).map((l) => l.trim()).filter(Boolean).map((l) => (/^q\s*[:-]/i.test(l) ? { role: "model", text: l.replace(/^q\s*[:-]\s*/i, "") } : { role: "user", text: l.replace(/^a\s*[:-]\s*/i, "") }));
    const d = await callFunction<{ text?: string }>("virasat-ai", { action: "book", history, style: "emotional" });
    return md(`book-${slug(f.name)}`, d.text ?? "");
  } },
};

/** Image tools: catalogue id → the existing many-files configuration. */
const DROPZONE_ALIAS: Record<string, string> = {
  "remove-background": "background-remover", "remove-object-photo": "background-remover",
  "ai-photo-enhancer": "image-beautify", "beautify-image": "image-beautify", "blemish-remover": "image-beautify", "retouch-image": "image-beautify",
  "super-resolution": "image-beautify", "unblur-image": "image-beautify", "unblur-face": "image-beautify", "ai-face-generator": "image-beautify",
  "passport-photo-maker": "passport-photo-maker", "ai-id-photo-generator": "passport-photo-maker",
  "meet-nudge": "business-card-scanner", "startup-analyser": "startup-analyser",
};

export function getBulkSpec(toolId: string): BulkSpec | null {
  const dz = DROPZONE_ALIAS[toolId] ?? (getBulkConfig(toolId) ? toolId : undefined);
  if (dz && getBulkConfig(dz)) return { mode: "dropzone", configId: dz };
  if (CUSTOM[toolId]) return CUSTOM[toolId];
  const def = APPS[toolId];
  return def ? bulkFor(toolId, def) : null;
}
