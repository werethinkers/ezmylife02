import { lazy } from "react";
import { DEFAULT_PRICES } from "./prices";
import { num, inr } from "./shell/Fields";
import type { AppDef, FormValues, TrackerRow } from "./types";

/*
 * Every app built on the shared engines, by catalog id. Prices mirror the server
 * (supabase/functions/_shared/appSpecs.ts) and are only used for display before the
 * first run.
 */

const p = (id: string) => DEFAULT_PRICES[id] ?? 0;
const custom = (loader: () => Promise<{ default: React.ComponentType<{ toolId: string }> }>) => lazy(loader);
const s = (v: FormValues, k: string) => (typeof v[k] === "string" ? (v[k] as string) : "");
const sum = (rows: TrackerRow[], f: (r: TrackerRow) => number) => rows.reduce((a, r) => a + f(r), 0);
const isoToday = () => new Date().toISOString().slice(0, 10);
const daysFrom = (d: string) => (d ? Math.round((new Date(d + "T00:00:00").getTime() - new Date(isoToday() + "T00:00:00").getTime()) / 86400000) : NaN);

const BUSINESS = { key: "Business", label: "Business name", profile: "businessName" as const, half: true };
const INDUSTRY = { key: "Industry", label: "Type of business", profile: "industry" as const, half: true, placeholder: "Restaurant, clinic, boutique…" };
const CITY = { key: "City", label: "City / state", profile: "city" as const, half: true };
const LANG = { key: "Language", label: "Language", type: "select" as const, options: ["English", "Hindi", "Hinglish", "English + Hindi"], default: "English", half: true };
const SENDER = { key: "Sender", label: "Your name & designation", profile: "ownerName" as const, half: true };

const LETTER_CHIPS = ["More firm", "More polite", "Shorter", "Translate to Hindi"];
const MSG_CHIPS = ["Shorter", "Friendlier", "Add Hindi version", "More urgent"];

export const APPS: Record<string, AppDef> = {
  // ═════════════ BUSINESS DOCUMENTS ═════════════
  "tool-10": {
    engine: "doc", credits: p("tool-10"), fileName: "safety-protocol", cta: "Create safety protocol",
    intro: "A workplace safety protocol and daily checklist written for your premises, team and equipment.",
    steps: ["Describe your workplace", "Get the protocol + checklist", "Print it for your team"],
    related: ["tool-7", "tool-23", "tool-32", "tool-27"],
    fields: [
      BUSINESS, INDUSTRY,
      { key: "Staff count", label: "Number of staff", type: "number", half: true },
      { key: "Premises", label: "Premises", type: "select", options: ["Shop / showroom", "Office", "Kitchen / restaurant", "Factory / workshop", "Warehouse", "Clinic", "Construction site", "Other"], half: true },
      { key: "Equipment & hazards", label: "Machines, chemicals or risks", type: "textarea", required: true, placeholder: "Gas stoves, deep fryers, wet floors, knives, 2 LPG cylinders…" },
      { key: "Existing measures", label: "What you already have (optional)", type: "textarea", rows: 2, placeholder: "2 fire extinguishers, first-aid box…" },
      LANG,
    ],
    sample: { "Business": "Sharma Sweets", "Industry": "Sweet shop with kitchen", "Staff count": "12", "Premises": "Kitchen / restaurant", "Equipment & hazards": "Commercial gas burners, 4 LPG cylinders, hot sugar syrup, knives, wet floors, delivery scooters", "Existing measures": "1 fire extinguisher, first-aid box" },
  },
  "tool-12": {
    engine: "doc", credits: p("tool-12"), fileName: "offers", cta: "Create offers",
    intro: "Three ready-to-run offers with the margin maths worked out, plus WhatsApp and SMS copy.",
    steps: ["Enter product & price", "Compare 3 offers", "Send the message"],
    related: ["tool-19", "tool-16", "tool-17", "social-post-generator"],
    fields: [
      BUSINESS,
      { key: "Product / service", label: "Product or service", required: true, half: true },
      { key: "Selling price (₹)", label: "Selling price (₹)", type: "money", required: true, half: true },
      { key: "Cost (₹)", label: "Your cost per unit (₹)", type: "money", half: true },
      { key: "Goal", label: "Goal", type: "select", options: ["Clear old stock", "Get new customers", "Increase order value", "Festival sale", "Bring back old customers"], half: true },
      { key: "Occasion", label: "Occasion / dates", placeholder: "Diwali, 1–5 Nov", half: true },
      { key: "Audience", label: "Who it's for", profile: "audience", placeholder: "Families in Indore" },
    ],
    compute: (v) => {
      const sp = num(v["Selling price (₹)"]), c = num(v["Cost (₹)"]);
      return sp && c ? { "Current margin": `${inr(sp - c)} per unit (${(((sp - c) / sp) * 100).toFixed(1)}%)` } : {};
    },
    sample: { "Product / service": "Kaju katli 500 g box", "Selling price (₹)": "550", "Cost (₹)": "360", "Goal": "Festival sale", "Occasion": "Diwali, 28 Oct – 2 Nov" },
  },
  "tool-18": {
    engine: "doc", credits: p("tool-18"), fileName: "lead-magnet", cta: "Design lead magnet",
    intro: "A free resource that turns visitors into leads — title, outline, landing page copy and follow-ups.",
    related: ["tool-11", "tool-14", "tool-16", "social-post-generator"],
    fields: [
      BUSINESS, INDUSTRY,
      { key: "Ideal customer", label: "Ideal customer", profile: "audience", required: true },
      { key: "Their biggest problem", label: "Their biggest problem", type: "textarea", rows: 2, required: true },
      { key: "Format", label: "Format", type: "select", options: ["Checklist", "PDF guide", "Calculator / template", "Mini video course", "Free consultation", "Discount coupon"], half: true },
      LANG,
    ],
    sample: { "Business": "Verma Tax Consultants", "Industry": "GST & accounting services", "Ideal customer": "Small shop owners who just crossed ₹40 lakh turnover", "Their biggest problem": "Confused about GST registration, returns and penalties", "Format": "Checklist" },
  },
  "tool-29": {
    engine: "doc", credits: p("tool-29"), fileName: "interview-guide", cta: "Create interview guide",
    intro: "A structured interview with role-specific questions, what good answers sound like, and a scoring rubric.",
    related: ["tool-28", "tool-30", "tool-36", "tool-35"],
    fields: [
      BUSINESS,
      { key: "Role", label: "Role", required: true, half: true, placeholder: "Store manager" },
      { key: "Experience", label: "Experience level", type: "select", options: ["Fresher", "1–3 years", "3–7 years", "Senior / manager"], half: true },
      { key: "Interview length", label: "Interview length", type: "select", options: ["15 minutes", "30 minutes", "45 minutes", "60 minutes"], default: "30 minutes", half: true },
      LANG,
      { key: "Must-have skills", label: "Must-have skills", type: "textarea", rows: 2, required: true, placeholder: "Handling cash, staff of 6, inventory, customer complaints" },
      { key: "Work culture", label: "What matters in your team (optional)", type: "textarea", rows: 2 },
    ],
  },
  "tool-38": {
    engine: "doc", credits: p("tool-38"), fileName: "faq", cta: "Build FAQ",
    intro: "A customer FAQ from your real policies, plus the code snippet that helps it show up in Google.",
    related: ["tool-13", "tool-37", "tool-39"],
    fields: [
      BUSINESS, INDUSTRY,
      { key: "Products / services", label: "Products or services", profile: "products", type: "textarea", rows: 2, required: true },
      { key: "Delivery", label: "Delivery / service area & timing", type: "textarea", rows: 2 },
      { key: "Payment", label: "Payment options", placeholder: "UPI, cards, COD up to ₹2,000", half: true },
      { key: "Returns", label: "Returns / refund policy", half: true },
      { key: "Common questions", label: "Questions customers ask you often (optional)", type: "textarea", rows: 3 },
      { key: "Contact", label: "How to reach you", profile: "phone", half: true },
      LANG,
    ],
  },
  "tool-8": {
    engine: "doc", credits: p("tool-8"), fileName: "notice-reply", cta: "Draft reply",
    intro: "A formal, point-by-point reply to a GST, income tax, municipal, legal or customer notice — with a document checklist.",
    steps: ["Paste the notice", "Add your side", "Review with your CA / lawyer"],
    related: ["tool-9", "tool-7", "ocr", "advance-text-extractor"],
    fields: [
      BUSINESS,
      { key: "Your GSTIN / PAN", label: "GSTIN / PAN (if relevant)", profile: "gstin", half: true },
      { key: "Notice from", label: "Notice from", type: "select", options: ["GST department", "Income Tax department", "Municipal corporation", "Labour department", "Bank / NBFC", "Customer / supplier (legal notice)", "Other"], half: true },
      { key: "Notice number & date", label: "Notice number & date", half: true },
      { key: "Reply deadline", label: "Reply deadline", type: "date", half: true },
      { key: "Notice text", label: "Notice text (paste or summarise)", type: "textarea", rows: 6, required: true, acceptsHandoff: true, help: "Have a photo or PDF? Run it through OCR first, then use 'Use in…' to bring it here." },
      { key: "Your explanation", label: "Your side / facts", type: "textarea", rows: 4, required: true },
      { key: "Documents you have", label: "Documents you can attach", type: "textarea", rows: 2 },
      SENDER,
    ],
    refineChips: LETTER_CHIPS,
  },
  "tool-36": {
    engine: "doc", credits: p("tool-36"), fileName: "performance-review", cta: "Write review",
    intro: "Score an employee on weighted criteria and get a fair, specific written review with next-quarter goals.",
    related: ["tool-31", "tool-35", "tool-34", "tool-29"],
    fields: [
      { key: "Employee", label: "Employee name", required: true, half: true },
      { key: "Role", label: "Role", half: true },
      { key: "Review period", label: "Review period", placeholder: "Apr–Sep 2026", half: true },
      { key: "Reviewer", label: "Reviewer", profile: "ownerName", half: true },
      {
        key: "Scorecard", label: "Scorecard (rating 1–5, weight %)", type: "rows",
        columns: [{ key: "criterion", label: "Criterion" }, { key: "rating", label: "Rating 1–5", type: "number" }, { key: "weight", label: "Weight %", type: "number" }, { key: "evidence", label: "Evidence / example" }],
        defaultRows: [
          { criterion: "Quality of work", rating: "", weight: "30", evidence: "" },
          { criterion: "Targets / output", rating: "", weight: "30", evidence: "" },
          { criterion: "Attendance & punctuality", rating: "", weight: "20", evidence: "" },
          { criterion: "Teamwork & attitude", rating: "", weight: "20", evidence: "" },
        ],
      },
      { key: "Manager notes", label: "Anything else", type: "textarea", rows: 2 },
    ],
    compute: (v) => {
      const rows = (Array.isArray(v.Scorecard) ? v.Scorecard : []).filter((r) => r.rating);
      const w = rows.reduce((a, r) => a + num(r.weight), 0);
      if (!rows.length || !w) return {};
      const score = rows.reduce((a, r) => a + num(r.rating) * num(r.weight), 0) / w;
      return { "Weighted score": `${score.toFixed(2)} / 5 (weights total ${w}%)` };
    },
    preview: (v) => {
      const rows = (Array.isArray(v.Scorecard) ? v.Scorecard : []).filter((r) => r.rating);
      const w = rows.reduce((a, r) => a + num(r.weight), 0);
      if (!rows.length || !w) return null;
      const score = rows.reduce((a, r) => a + num(r.rating) * num(r.weight), 0) / w;
      return (
        <div className="rounded-xl bg-primary/5 p-3 text-sm">
          Weighted score: <strong>{score.toFixed(2)} / 5</strong>
          {w !== 100 && <span className="ml-2 text-xs text-amber-600">Weights add up to {w}%, not 100%.</span>}
        </div>
      );
    },
  },
  "tool-9": {
    engine: "doc", credits: p("tool-9"), fileName: "dispute-letter", cta: "Draft letter",
    intro: "A firm, well-structured complaint or dispute letter with a clear timeline, demand and escalation path.",
    related: ["tool-8", "tool-5", "tool-26"],
    fields: [
      { key: "From", label: "Your name / business", profile: "businessName", half: true },
      { key: "Address", label: "Your address", profile: "address", half: true },
      { key: "Against", label: "Against (company / person)", required: true, half: true },
      { key: "Type", label: "Dispute about", type: "select", options: ["Defective product", "Service not delivered", "Wrong billing / overcharge", "Refund not given", "Bank / card charge", "Insurance claim", "Contract breach", "Other"], half: true },
      { key: "Amount", label: "Amount involved (₹)", type: "money", half: true },
      { key: "Reference", label: "Order / invoice / account no.", half: true },
      { key: "What happened", label: "What happened (with dates)", type: "textarea", rows: 5, required: true },
      { key: "What you want", label: "What you want, by when", type: "textarea", rows: 2, required: true },
    ],
    refineChips: LETTER_CHIPS,
  },
  "tool-16": {
    engine: "doc", credits: p("tool-16"), fileName: "campaign-plan", cta: "Plan campaign",
    intro: "A complete campaign plan: audience, offer, channel budget, day-by-day schedule and ready messages.",
    related: ["tool-12", "tool-15", "social-post-generator", "hashtag-generator"],
    fields: [
      BUSINESS,
      { key: "Campaign goal", label: "Goal", required: true, half: true, placeholder: "100 new orders" },
      { key: "Budget (₹)", label: "Budget (₹)", type: "money", half: true },
      { key: "Duration", label: "Duration", type: "select", options: ["1 week", "2 weeks", "1 month", "3 months"], half: true },
      { key: "Channels", label: "Channels", type: "chips", options: ["WhatsApp", "Instagram", "Facebook", "Google", "SMS", "Email", "Flyers", "In-store"] },
      { key: "Offer", label: "Offer / hook", half: true },
      { key: "Audience", label: "Audience", profile: "audience", half: true },
      CITY,
    ],
  },
  "tool-14": {
    engine: "doc", credits: p("tool-14"), fileName: "follow-up", cta: "Write follow-ups",
    intro: "A polite 3-step follow-up sequence for a lead or customer who went quiet.",
    related: ["tool-11", "tool-5", "tool-13"],
    fields: [
      BUSINESS,
      { key: "Customer", label: "Customer name", half: true, ctxKey: "clientName" },
      { key: "Context", label: "What happened last", type: "textarea", rows: 3, required: true, placeholder: "Sent a quotation for 50 corporate gift boxes on 2 Oct, no reply" },
      { key: "Channel", label: "Channel", type: "select", options: ["WhatsApp", "Email", "SMS", "Phone script"], default: "WhatsApp", half: true },
      LANG,
    ],
    refineChips: MSG_CHIPS,
  },
  "tool-7": {
    engine: "doc", credits: p("tool-7"), fileName: "compliance-checklist", cta: "Build checklist",
    intro: "The registrations, licences and recurring filings a business like yours usually needs in India.",
    related: ["tool-10", "tool-8", "tool-4", "tool-1"],
    fields: [
      BUSINESS, INDUSTRY,
      { key: "State", label: "State", profile: "state", required: true, half: true },
      { key: "Structure", label: "Business structure", type: "select", options: ["Proprietorship", "Partnership", "LLP", "Private limited", "OPC"], half: true },
      { key: "Annual turnover", label: "Annual turnover", type: "select", options: ["Under ₹20 lakh", "₹20–40 lakh", "₹40 lakh – 1.5 crore", "₹1.5–5 crore", "Above ₹5 crore"], half: true },
      { key: "Employees", label: "Employees", type: "number", half: true },
      { key: "Special activities", label: "Food, liquor, chemicals, exports, online sales…", type: "textarea", rows: 2 },
    ],
  },
  "tool-5": {
    engine: "doc", credits: p("tool-5"), fileName: "payment-recovery", cta: "Create recovery sequence",
    intro: "Four escalating payment reminders — from friendly nudge to final notice — for an overdue invoice.",
    related: ["tool-1", "tool-14", "tool-9", "tool-2"],
    fields: [
      BUSINESS,
      { key: "Customer", label: "Customer / company", required: true, half: true, ctxKey: "clientName" },
      { key: "Invoice no.", label: "Invoice number(s)", half: true, ctxKey: "invoiceNumber" },
      { key: "Amount due (₹)", label: "Amount due (₹)", type: "money", required: true, half: true, ctxKey: "invoiceTotal" },
      { key: "Due date", label: "Original due date", type: "date", half: true },
      { key: "Interest", label: "Late interest (if agreed)", placeholder: "18% p.a.", half: true },
      { key: "History", label: "Reminders already sent / promises made", type: "textarea", rows: 2 },
      LANG,
    ],
    preview: (v) => {
      const d = daysFrom(s(v, "Due date"));
      return Number.isFinite(d) && d < 0 ? <p className="rounded-xl bg-amber-500/10 p-3 text-sm">Overdue by <strong>{-d} days</strong>.</p> : null;
    },
    compute: (v) => {
      const d = daysFrom(s(v, "Due date"));
      return Number.isFinite(d) && d < 0 ? { "Days overdue": String(-d) } : {};
    },
    refineChips: LETTER_CHIPS,
  },
  "tool-27": {
    engine: "doc", credits: p("tool-27"), fileName: "quality-checklist", cta: "Create checklist",
    intro: "A stage-by-stage quality inspection checklist with acceptance criteria and defect handling.",
    related: ["tool-20", "tool-21", "tool-26", "tool-10"],
    fields: [
      BUSINESS,
      { key: "Product", label: "Product / service", required: true, half: true },
      { key: "Process", label: "How it's made or delivered", type: "textarea", rows: 3 },
      { key: "Common defects", label: "Problems you see most", type: "textarea", rows: 2 },
      { key: "Standards", label: "Standards to follow (optional)", placeholder: "FSSAI, BIS, customer spec", half: true },
    ],
  },
  "tool-13": {
    engine: "doc", credits: p("tool-13"), fileName: "review-replies", cta: "Write replies",
    intro: "Three professional reply options for any Google, Zomato, Amazon or Justdial review.",
    related: ["tool-39", "tool-38", "tool-14"],
    fields: [
      BUSINESS,
      { key: "Platform", label: "Platform", type: "select", options: ["Google", "Zomato / Swiggy", "Amazon / Flipkart", "Justdial", "Instagram / Facebook", "Other"], half: true },
      { key: "Rating", label: "Star rating", type: "select", options: ["5", "4", "3", "2", "1"], half: true },
      { key: "Reviewer", label: "Reviewer name", half: true },
      { key: "Review", label: "The review", type: "textarea", rows: 4, required: true, acceptsHandoff: true },
      { key: "Facts", label: "What actually happened (optional)", type: "textarea", rows: 2 },
      LANG,
    ],
    refineChips: MSG_CHIPS,
  },
  "tool-11": {
    engine: "doc", credits: p("tool-11"), fileName: "cold-outreach", cta: "Write outreach",
    intro: "A short, personalised first message plus two follow-ups that sound like a person, not a template.",
    related: ["tool-14", "tool-18", "meet-nudge"],
    fields: [
      BUSINESS,
      { key: "What you offer", label: "What you offer", profile: "products", required: true, half: true },
      { key: "Prospect", label: "Prospect (name, company, role)", required: true, half: true, ctxKey: "clientName" },
      { key: "Channel", label: "Channel", type: "select", options: ["WhatsApp", "LinkedIn", "Email", "Instagram DM"], half: true },
      { key: "Why them", label: "Why you're contacting them", type: "textarea", rows: 2 },
      LANG,
    ],
    refineChips: MSG_CHIPS,
  },
  "tool-15": {
    engine: "doc", credits: p("tool-15"), fileName: "social-calendar", cta: "Create 4-week plan",
    intro: "A month of social posts — dates, formats, hooks and CTAs — including relevant Indian festivals.",
    related: ["social-post-generator", "caption-generator", "hashtag-generator", "content-idea-generator"],
    fields: [
      BUSINESS, INDUSTRY,
      { key: "Month", label: "Month", placeholder: "November 2026", required: true, half: true },
      { key: "Posts per week", label: "Posts per week", type: "select", options: ["2", "3", "5", "7"], default: "3", half: true },
      { key: "Platforms", label: "Platforms", type: "chips", options: ["Instagram", "Facebook", "LinkedIn", "YouTube Shorts", "WhatsApp Status", "X"] },
      { key: "Audience", label: "Audience", profile: "audience", half: true },
      { key: "Tone", label: "Tone", profile: "tone", half: true },
    ],
  },
  "tool-19": {
    engine: "doc", credits: p("tool-19"), fileName: "discount-strategy", cta: "Recommend strategy",
    intro: "See what each discount really costs you, how many extra sales you need to break even, and the smarter option.",
    related: ["tool-12", "tool-3", "tool-17"],
    fields: [
      { key: "Product", label: "Product", required: true, half: true },
      { key: "Price (₹)", label: "Selling price (₹)", type: "money", required: true, half: true },
      { key: "Cost (₹)", label: "Cost per unit (₹)", type: "money", required: true, half: true },
      { key: "Monthly units", label: "Units sold per month", type: "number", half: true },
      { key: "Discounts", label: "Discounts to compare (%)", default: "5, 10, 15, 20", half: true },
      { key: "Goal", label: "Goal", type: "select", options: ["More footfall", "Clear stock", "Beat a competitor", "Festival sale"], half: true },
    ],
    compute: (v) => {
      const pr = num(v["Price (₹)"]), c = num(v["Cost (₹)"]), u = num(v["Monthly units"]);
      if (!pr || !c) return {};
      const m = pr - c;
      const lines = s(v, "Discounts").split(/[,\s]+/).map(num).filter((d) => d > 0 && d < 100).map((d) => {
        const nm = pr * (1 - d / 100) - c;
        const need = nm > 0 ? m / nm : Infinity;
        return `${d}%: price ${inr(pr * (1 - d / 100))}, margin ${inr(nm)}/unit, need ${Number.isFinite(need) ? `${need.toFixed(2)}× sales${u ? ` (${Math.ceil(u * need)} units/month)` : ""}` : "— loss-making"} to keep the same profit`;
      });
      return { "Current margin": `${inr(m)} per unit`, "Scenarios": lines.join("\n") };
    },
    preview: (v) => {
      const pr = num(v["Price (₹)"]), c = num(v["Cost (₹)"]);
      if (!pr || !c) return null;
      const m = pr - c;
      const ds = s(v, "Discounts").split(/[,\s]+/).map(num).filter((d) => d > 0 && d < 100);
      return (
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-left"><tr><th className="p-2">Discount</th><th className="p-2">Price</th><th className="p-2">Margin/unit</th><th className="p-2">Sales needed</th></tr></thead>
            <tbody>
              {ds.map((d) => {
                const nm = pr * (1 - d / 100) - c;
                return (
                  <tr key={d} className="border-t border-border/50">
                    <td className="p-2">{d}%</td><td className="p-2">{inr(pr * (1 - d / 100))}</td>
                    <td className={`p-2 ${nm <= 0 ? "text-destructive" : ""}`}>{inr(nm)}</td>
                    <td className="p-2">{nm > 0 ? `${(m / nm).toFixed(2)}×` : "Loss"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    },
  },
  "tool-17": {
    engine: "doc", credits: p("tool-17"), fileName: "loyalty-program", cta: "Design programme",
    intro: "A loyalty programme you can afford — points, tiers, rules and launch messages, with the cost worked out.",
    related: ["tool-12", "tool-19", "tool-39"],
    fields: [
      BUSINESS, INDUSTRY,
      { key: "Average bill (₹)", label: "Average bill (₹)", type: "money", half: true },
      { key: "Visits per month", label: "Repeat visits per customer / month", type: "number", half: true },
      { key: "Gross margin %", label: "Gross margin %", type: "number", half: true },
      { key: "Budget", label: "Max reward cost (% of sales)", default: "3", type: "number", half: true },
      { key: "Ideas", label: "Rewards you like (optional)", type: "textarea", rows: 2 },
    ],
  },
  "tool-31": {
    engine: "doc", credits: p("tool-31"), fileName: "warning-letter", cta: "Draft warning letter",
    intro: "A factual, professional warning letter that documents the issue and the expected change.",
    related: ["tool-36", "tool-35", "tool-34"],
    fields: [
      BUSINESS,
      { key: "Employee", label: "Employee name & ID", required: true, half: true },
      { key: "Designation", label: "Designation", half: true },
      { key: "Warning level", label: "Warning", type: "select", options: ["First warning", "Second warning", "Final warning"], half: true },
      { key: "Issue", label: "Issue", type: "select", options: ["Late coming / absence", "Misconduct", "Poor performance", "Policy violation", "Insubordination", "Other"], half: true },
      { key: "Incidents", label: "What happened (dates & facts)", type: "textarea", rows: 4, required: true },
      { key: "Previous warnings", label: "Previous warnings (if any)", half: true },
      SENDER,
    ],
    refineChips: LETTER_CHIPS,
  },

  // ═════════════ BUSINESS TRACKERS ═════════════
  "tool-21": {
    engine: "tracker", credits: p("tool-21"), itemName: "entry", fileName: "wastage-log", aiLabel: "Find ways to cut wastage",
    intro: "Log every item thrown away, see what it costs you, and get specific ways to reduce it.",
    related: ["tool-25", "tool-20", "tool-27", "tool-3"],
    columns: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "item", label: "Item", type: "text", required: true },
      { key: "qty", label: "Qty", type: "number", required: true },
      { key: "unit", label: "Unit", type: "select", options: ["kg", "g", "litre", "pcs", "box", "plate"] },
      { key: "unitCost", label: "Cost / unit", type: "money" },
      { key: "loss", label: "Loss", type: "money", computed: (r) => num(r.qty) * num(r.unitCost) },
      { key: "reason", label: "Reason", type: "select", options: ["Expired", "Spoiled", "Over-prepared", "Damaged", "Customer return", "Other"] },
      { key: "by", label: "Logged by", type: "text", minor: true },
    ],
    summary: (rows) => {
      const total = sum(rows, (r) => num(r.qty) * num(r.unitCost));
      const month = isoToday().slice(0, 7);
      const m = sum(rows.filter((r) => (r.date ?? "").startsWith(month)), (r) => num(r.qty) * num(r.unitCost));
      const by: Record<string, number> = {};
      rows.forEach((r) => (by[r.reason || "Other"] = (by[r.reason || "Other"] ?? 0) + num(r.qty) * num(r.unitCost)));
      const top = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
      return [
        { label: "Total loss", value: inr(total), tone: total ? "bad" : undefined },
        { label: "This month", value: inr(m) },
        { label: "Entries", value: String(rows.length) },
        { label: "Top reason", value: top ? top[0] : "—" },
      ];
    },
    sample: [
      { date: isoToday(), item: "Paneer", qty: "2", unit: "kg", unitCost: "380", reason: "Spoiled", by: "Ramesh" },
      { date: isoToday(), item: "Gulab jamun", qty: "40", unit: "pcs", unitCost: "12", reason: "Over-prepared", by: "Sunita" },
      { date: isoToday(), item: "Milk", qty: "5", unit: "litre", unitCost: "62", reason: "Expired", by: "Ramesh" },
    ],
  },
  "tool-23": {
    engine: "tracker", credits: p("tool-23"), itemName: "service record", fileName: "maintenance-log", aiLabel: "Plan maintenance",
    intro: "Keep a service history for every machine and vehicle, see what's overdue, and plan the next quarter.",
    related: ["tool-10", "tool-26", "tool-2"],
    columns: [
      { key: "equipment", label: "Equipment", type: "text", required: true },
      { key: "date", label: "Serviced on", type: "date", required: true },
      { key: "type", label: "Type", type: "select", options: ["Preventive", "Repair", "Breakdown", "Inspection"] },
      { key: "cost", label: "Cost", type: "money" },
      { key: "vendor", label: "Technician / vendor", type: "text", minor: true },
      { key: "next", label: "Next due", type: "date" },
      { key: "status", label: "Due in", type: "text", computed: (r) => { const d = daysFrom(r.next); return Number.isFinite(d) ? (d < 0 ? `${-d} days overdue` : `${d} days`) : "—"; } },
      { key: "notes", label: "Notes", type: "text", minor: true },
    ],
    rowTone: (r) => { const d = daysFrom(r.next); return d < 0 ? "bad" : d <= 14 ? "warn" : undefined; },
    summary: (rows) => [
      { label: "Overdue", value: String(rows.filter((r) => daysFrom(r.next) < 0).length), tone: rows.some((r) => daysFrom(r.next) < 0) ? "bad" : "good" },
      { label: "Due in 14 days", value: String(rows.filter((r) => { const d = daysFrom(r.next); return d >= 0 && d <= 14; }).length), tone: "warn" },
      { label: "Spend", value: inr(sum(rows, (r) => num(r.cost))) },
      { label: "Records", value: String(rows.length) },
    ],
    sample: [
      { equipment: "Deep freezer", date: "2026-07-10", type: "Preventive", cost: "1200", vendor: "CoolTech", next: "2026-10-10", notes: "Gas top-up" },
      { equipment: "Generator 15 kVA", date: "2026-09-01", type: "Repair", cost: "4500", vendor: "Sai Power", next: "2026-12-01", notes: "Changed filter" },
      { equipment: "Delivery scooter MP09", date: "2026-08-20", type: "Preventive", cost: "900", vendor: "Hero service", next: "2026-10-20", notes: "" },
    ],
  },
  "tool-32": {
    engine: "tracker", credits: p("tool-32"), itemName: "task", fileName: "tasks", aiLabel: "Plan my day",
    intro: "A shared task list for the team — owners, deadlines, priorities — and an AI plan for today.",
    related: ["tool-33", "tool-24", "tool-37"],
    columns: [
      { key: "task", label: "Task", type: "text", required: true },
      { key: "owner", label: "Owner", type: "text" },
      { key: "due", label: "Due", type: "date" },
      { key: "priority", label: "Priority", type: "select", options: ["High", "Medium", "Low"] },
      { key: "done", label: "Done", type: "check" },
      { key: "notes", label: "Notes", type: "text", minor: true },
    ],
    rowTone: (r) => (r.done !== "yes" && daysFrom(r.due) < 0 ? "bad" : r.done !== "yes" && r.priority === "High" ? "warn" : undefined),
    summary: (rows) => [
      { label: "Open", value: String(rows.filter((r) => r.done !== "yes").length) },
      { label: "Overdue", value: String(rows.filter((r) => r.done !== "yes" && daysFrom(r.due) < 0).length), tone: "bad" },
      { label: "Due today", value: String(rows.filter((r) => r.done !== "yes" && daysFrom(r.due) === 0).length), tone: "warn" },
      { label: "Done", value: String(rows.filter((r) => r.done === "yes").length), tone: "good" },
    ],
    sample: [
      { task: "Order packaging boxes", owner: "Amit", due: isoToday(), priority: "High", done: "no", notes: "500 pcs" },
      { task: "Update price board", owner: "Neha", due: isoToday(), priority: "Medium", done: "no", notes: "" },
      { task: "Bank deposit", owner: "Amit", due: isoToday(), priority: "High", done: "yes", notes: "" },
    ],
  },
  "tool-33": {
    engine: "tracker", credits: p("tool-33"), itemName: "staff member", fileName: "shift-planner", aiLabel: "Create weekly roster",
    intro: "List your staff and their availability; the AI builds a fair weekly shift roster that covers every shift.",
    related: ["tool-35", "tool-34", "tool-24", "tool-32"],
    columns: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "role", label: "Role", type: "text" },
      { key: "off", label: "Weekly off", type: "select", options: ["Any", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
      { key: "pref", label: "Prefers", type: "select", options: ["Any", "Morning", "Evening", "Night"] },
      { key: "maxHours", label: "Max hrs/week", type: "number" },
      { key: "notes", label: "Notes", type: "text", minor: true },
    ],
    settings: [
      { key: "Shifts", label: "Shift timings", default: "Morning 8–4, Evening 2–10", half: true },
      { key: "Minimum staff", label: "Minimum staff per shift", default: "Morning 3, Evening 3", half: true },
      { key: "Rules", label: "Other rules", type: "textarea", rows: 2, placeholder: "At least one cashier per shift; Sunday is busiest" },
    ],
    summary: (rows) => [
      { label: "Staff", value: String(rows.length) },
      { label: "Weekly hours available", value: String(sum(rows, (r) => num(r.maxHours))) },
    ],
    sample: [
      { name: "Ravi", role: "Cashier", off: "Tue", pref: "Morning", maxHours: "48", notes: "" },
      { name: "Pooja", role: "Sales", off: "Wed", pref: "Evening", maxHours: "48", notes: "" },
      { name: "Imran", role: "Sales", off: "Any", pref: "Any", maxHours: "48", notes: "" },
      { name: "Kavita", role: "Cashier", off: "Mon", pref: "Evening", maxHours: "40", notes: "College till 1 pm" },
    ],
  },
  "tool-34": {
    engine: "tracker", credits: p("tool-34"), itemName: "employee", fileName: "payroll", aiLabel: "Check this payroll",
    intro: "Monthly payroll with attendance-based pay, overtime, advances and deductions worked out for every employee.",
    related: ["tool-35", "tool-30", "tool-33", "tool-2"],
    columns: [
      { key: "name", label: "Employee", type: "text", required: true },
      { key: "salary", label: "Monthly salary", type: "money", required: true },
      { key: "days", label: "Days present", type: "number" },
      { key: "workDays", label: "Working days", type: "number" },
      { key: "otHours", label: "OT hrs", type: "number", minor: true },
      { key: "otRate", label: "OT ₹/hr", type: "money", minor: true },
      { key: "advance", label: "Advance", type: "money" },
      { key: "deductions", label: "PF/ESI/other", type: "money", minor: true },
      { key: "net", label: "Net pay", type: "money", computed: (r) => {
        const wd = num(r.workDays) || 26, d = r.days === "" || r.days === undefined ? wd : num(r.days);
        return Math.round(num(r.salary) * Math.min(1, d / wd) + num(r.otHours) * num(r.otRate) - num(r.advance) - num(r.deductions));
      } },
    ],
    rowTone: (r) => (num(r.salary) && num(r.advance) > num(r.salary) / 2 ? "warn" : undefined),
    summary: (rows) => {
      const net = (r: TrackerRow) => { const wd = num(r.workDays) || 26, d = r.days ? num(r.days) : wd; return num(r.salary) * Math.min(1, d / wd) + num(r.otHours) * num(r.otRate) - num(r.advance) - num(r.deductions); };
      return [
        { label: "Total payout", value: inr(Math.round(sum(rows, net))) },
        { label: "Gross salaries", value: inr(sum(rows, (r) => num(r.salary))) },
        { label: "Advances recovered", value: inr(sum(rows, (r) => num(r.advance))) },
        { label: "Employees", value: String(rows.length) },
      ];
    },
    sample: [
      { name: "Ravi Kumar", salary: "15000", days: "25", workDays: "26", otHours: "6", otRate: "90", advance: "2000", deductions: "0" },
      { name: "Pooja Sen", salary: "18000", days: "26", workDays: "26", otHours: "0", otRate: "0", advance: "0", deductions: "1800" },
      { name: "Imran Khan", salary: "14000", days: "22", workDays: "26", otHours: "10", otRate: "80", advance: "0", deductions: "0" },
    ],
  },
  "tool-37": {
    engine: "tracker", credits: p("tool-37"), itemName: "ticket", fileName: "tickets", aiLabel: "Analyse tickets",
    intro: "A simple helpdesk: log customer issues, track status and priority, and get suggested replies.",
    related: ["tool-38", "tool-39", "tool-13"],
    columns: [
      { key: "opened", label: "Opened", type: "date", required: true },
      { key: "customer", label: "Customer", type: "text", required: true },
      { key: "issue", label: "Issue", type: "text", required: true },
      { key: "priority", label: "Priority", type: "select", options: ["High", "Medium", "Low"] },
      { key: "status", label: "Status", type: "select", options: ["Open", "In progress", "Waiting on customer", "Resolved"] },
      { key: "owner", label: "Assigned to", type: "text", minor: true },
      { key: "age", label: "Age", type: "text", computed: (r) => (r.status === "Resolved" ? "—" : `${Math.max(0, -daysFrom(r.opened))} d`) },
    ],
    rowTone: (r) => (r.status !== "Resolved" && r.priority === "High" ? "bad" : r.status !== "Resolved" && -daysFrom(r.opened) > 3 ? "warn" : undefined),
    summary: (rows) => [
      { label: "Open", value: String(rows.filter((r) => r.status !== "Resolved").length) },
      { label: "High priority open", value: String(rows.filter((r) => r.status !== "Resolved" && r.priority === "High").length), tone: "bad" },
      { label: "Resolved", value: String(rows.filter((r) => r.status === "Resolved").length), tone: "good" },
      { label: "Total", value: String(rows.length) },
    ],
    sample: [
      { opened: isoToday(), customer: "Mehta Traders", issue: "Wrong item delivered", priority: "High", status: "Open", owner: "Neha" },
      { opened: "2026-10-01", customer: "R. Gupta", issue: "Refund status", priority: "Medium", status: "In progress", owner: "Amit" },
    ],
  },
  "tool-35": {
    engine: "tracker", credits: p("tool-35"), itemName: "attendance entry", fileName: "attendance", aiLabel: "Summarise attendance",
    intro: "Mark daily attendance with in/out times, see hours and late arrivals, and export for payroll.",
    related: ["tool-34", "tool-33", "tool-31"],
    columns: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "name", label: "Employee", type: "text", required: true },
      { key: "status", label: "Status", type: "select", options: ["Present", "Absent", "Half day", "Leave", "Week off"] },
      { key: "in", label: "In", type: "time" },
      { key: "out", label: "Out", type: "time" },
      { key: "hours", label: "Hours", type: "number", computed: (r) => {
        if (!r.in || !r.out) return 0;
        const [a, b] = [r.in, r.out].map((t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; });
        return Math.round(((b - a + 1440) % 1440) / 6) / 10;
      } },
    ],
    settings: [{ key: "Shift start", label: "Shift starts at (for late marks)", default: "10:00", half: true }],
    summary: (rows) => {
      const today = rows.filter((r) => r.date === isoToday());
      return [
        { label: "Present today", value: String(today.filter((r) => r.status === "Present" || r.status === "Half day").length), tone: "good" },
        { label: "Absent today", value: String(today.filter((r) => r.status === "Absent").length), tone: "bad" },
        { label: "Entries", value: String(rows.length) },
        { label: "Employees", value: String(new Set(rows.map((r) => r.name)).size) },
      ];
    },
    sample: [
      { date: isoToday(), name: "Ravi Kumar", status: "Present", in: "09:55", out: "19:05" },
      { date: isoToday(), name: "Pooja Sen", status: "Present", in: "10:20", out: "19:00" },
      { date: isoToday(), name: "Imran Khan", status: "Absent", in: "", out: "" },
    ],
  },
  "tool-25": {
    engine: "tracker", credits: p("tool-25"), itemName: "item", fileName: "stock", aiLabel: "Plan reorders",
    intro: "Track stock levels against reorder points, see what to buy, and turn it into supplier orders.",
    related: ["tool-22", "tool-20", "tool-21", "tool-26"],
    columns: [
      { key: "item", label: "Item", type: "text", required: true },
      { key: "sku", label: "SKU", type: "text", minor: true },
      { key: "stock", label: "In stock", type: "number", required: true },
      { key: "reorder", label: "Reorder at", type: "number" },
      { key: "usage", label: "Used / week", type: "number", minor: true },
      { key: "supplier", label: "Supplier", type: "text" },
      { key: "cost", label: "Cost / unit", type: "money", minor: true },
      { key: "value", label: "Stock value", type: "money", computed: (r) => num(r.stock) * num(r.cost) },
      { key: "flag", label: "Status", type: "text", computed: (r) => (r.reorder && num(r.stock) <= num(r.reorder) ? "Reorder" : "OK") },
    ],
    rowTone: (r) => (r.reorder && num(r.stock) <= num(r.reorder) ? (num(r.stock) === 0 ? "bad" : "warn") : undefined),
    summary: (rows) => [
      { label: "To reorder", value: String(rows.filter((r) => r.reorder && num(r.stock) <= num(r.reorder)).length), tone: "warn" },
      { label: "Out of stock", value: String(rows.filter((r) => num(r.stock) === 0).length), tone: "bad" },
      { label: "Stock value", value: inr(sum(rows, (r) => num(r.stock) * num(r.cost))) },
      { label: "Items", value: String(rows.length) },
    ],
    sample: [
      { item: "Sugar 50 kg bag", sku: "SUG50", stock: "3", reorder: "4", usage: "3", supplier: "Agrawal Traders", cost: "2150" },
      { item: "Cashew W320 (kg)", sku: "CAS320", stock: "18", reorder: "10", usage: "8", supplier: "Kerala Nuts", cost: "780" },
      { item: "Sweet boxes 500 g", sku: "BOX500", stock: "0", reorder: "200", usage: "350", supplier: "PackRight", cost: "9" },
    ],
  },
  "tool-26": {
    engine: "tracker", credits: p("tool-26"), itemName: "vendor", fileName: "vendors", aiLabel: "Compare vendors",
    intro: "Rate suppliers on quality, price, delivery and service, and see who deserves more of your business.",
    related: ["tool-22", "tool-25", "tool-27"],
    columns: [
      { key: "vendor", label: "Vendor", type: "text", required: true },
      { key: "items", label: "Supplies", type: "text" },
      { key: "quality", label: "Quality", type: "rating" },
      { key: "price", label: "Price", type: "rating" },
      { key: "delivery", label: "On-time", type: "rating" },
      { key: "service", label: "Service", type: "rating" },
      { key: "score", label: "Score", type: "number", computed: (r) => { const v = ["quality", "price", "delivery", "service"].map((k) => num(r[k])).filter(Boolean); return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : 0; } },
      { key: "contact", label: "Contact", type: "text", minor: true },
    ],
    rowTone: (r) => { const v = ["quality", "price", "delivery", "service"].map((k) => num(r[k])).filter(Boolean); const a = v.length ? v.reduce((x, y) => x + y, 0) / v.length : 5; return a < 2.5 ? "bad" : a < 3.5 ? "warn" : undefined; },
    summary: (rows) => [{ label: "Vendors", value: String(rows.length) }],
    sample: [
      { vendor: "Agrawal Traders", items: "Sugar, flour", quality: "4", price: "4", delivery: "3", service: "4", contact: "98260xxxxx" },
      { vendor: "PackRight", items: "Boxes", quality: "3", price: "5", delivery: "2", service: "3", contact: "" },
    ],
  },
  "tool-20": {
    engine: "tracker", credits: p("tool-20"), itemName: "audit line", fileName: "stock-audit", aiLabel: "Analyse variance",
    intro: "Count physical stock against your records and see shortages, excess and their rupee value.",
    related: ["tool-25", "tool-21", "tool-27"],
    columns: [
      { key: "item", label: "Item", type: "text", required: true },
      { key: "system", label: "Book qty", type: "number", required: true },
      { key: "physical", label: "Counted", type: "number", required: true },
      { key: "cost", label: "Cost / unit", type: "money" },
      { key: "diff", label: "Variance", type: "number", computed: (r) => num(r.physical) - num(r.system) },
      { key: "value", label: "Value", type: "money", computed: (r) => (num(r.physical) - num(r.system)) * num(r.cost) },
      { key: "note", label: "Note", type: "text", minor: true },
    ],
    rowTone: (r) => (num(r.physical) < num(r.system) ? "bad" : num(r.physical) > num(r.system) ? "warn" : undefined),
    summary: (rows) => {
      const v = sum(rows, (r) => (num(r.physical) - num(r.system)) * num(r.cost));
      return [
        { label: "Net variance", value: inr(v), tone: v < 0 ? "bad" : v > 0 ? "warn" : "good" },
        { label: "Short items", value: String(rows.filter((r) => num(r.physical) < num(r.system)).length), tone: "bad" },
        { label: "Excess items", value: String(rows.filter((r) => num(r.physical) > num(r.system)).length), tone: "warn" },
        { label: "Lines", value: String(rows.length) },
      ];
    },
    sample: [
      { item: "Cashew W320 (kg)", system: "20", physical: "18", cost: "780", note: "" },
      { item: "Sweet boxes 500 g", system: "250", physical: "262", cost: "9", note: "" },
      { item: "Ghee 15 kg tin", system: "6", physical: "6", cost: "8900", note: "" },
    ],
  },
  "tool-24": {
    engine: "tracker", credits: p("tool-24"), itemName: "handover note", fileName: "shift-handover", aiLabel: "Write handover summary",
    intro: "Record what the next shift needs to know — pending work, incidents, cash and stock — and get a clean handover note.",
    related: ["tool-32", "tool-33", "tool-37"],
    columns: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "shift", label: "Shift", type: "select", options: ["Morning", "Evening", "Night"] },
      { key: "type", label: "Type", type: "select", options: ["Pending task", "Incident", "Cash", "Stock", "Customer", "Info"] },
      { key: "note", label: "Note", type: "text", required: true },
      { key: "owner", label: "Owner", type: "text" },
      { key: "closed", label: "Closed", type: "check" },
    ],
    rowTone: (r) => (r.closed !== "yes" && r.type === "Incident" ? "warn" : undefined),
    summary: (rows) => [
      { label: "Open items", value: String(rows.filter((r) => r.closed !== "yes").length), tone: "warn" },
      { label: "Today", value: String(rows.filter((r) => r.date === isoToday()).length) },
    ],
    sample: [
      { date: isoToday(), shift: "Morning", type: "Pending task", note: "Call PackRight about box delivery", owner: "Evening manager", closed: "no" },
      { date: isoToday(), shift: "Morning", type: "Cash", note: "Cash in drawer ₹8,450 after deposit", owner: "", closed: "yes" },
    ],
  },
  "tool-39": {
    engine: "tracker", credits: p("tool-39"), itemName: "feedback", fileName: "feedback", aiLabel: "Analyse feedback",
    intro: "Collect customer feedback in one place, spot recurring problems, and reply to unhappy customers quickly.",
    related: ["tool-13", "tool-37", "tool-17", "tool-38"],
    columns: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "customer", label: "Customer", type: "text" },
      { key: "rating", label: "Rating", type: "rating" },
      { key: "source", label: "Source", type: "select", options: ["In store", "WhatsApp", "Google", "Phone", "Email", "Social"] },
      { key: "comment", label: "Comment", type: "text", required: true },
      { key: "followed", label: "Followed up", type: "check" },
    ],
    rowTone: (r) => (num(r.rating) && num(r.rating) <= 2 && r.followed !== "yes" ? "bad" : undefined),
    summary: (rows) => {
      const rated = rows.filter((r) => num(r.rating));
      const avg = rated.length ? sum(rated, (r) => num(r.rating)) / rated.length : 0;
      return [
        { label: "Average rating", value: rated.length ? `${avg.toFixed(1)} ★` : "—", tone: avg >= 4 ? "good" : avg && avg < 3 ? "bad" : undefined },
        { label: "Unhappy (≤2★) open", value: String(rows.filter((r) => num(r.rating) <= 2 && num(r.rating) > 0 && r.followed !== "yes").length), tone: "bad" },
        { label: "Responses", value: String(rows.length) },
      ];
    },
    sample: [
      { date: isoToday(), customer: "Anita", rating: "5", source: "Google", comment: "Fresh sweets, polite staff", followed: "no" },
      { date: isoToday(), customer: "Rohit", rating: "2", source: "WhatsApp", comment: "Delivery 1 hour late, box was crushed", followed: "no" },
    ],
  },

  // ═════════════ CONTENT & THINKING ═════════════
  "cognimap": {
    engine: "doc", credits: p("cognimap"), fileName: "mental-models", cta: "Think it through",
    intro: "Run a decision or problem through six mental models — first principles, inversion, second-order effects and more.",
    related: ["soul-mirror", "smart-diagram-ai", "kundkund-mindmap", "startup-analyser"],
    fields: [
      { key: "Decision or problem", label: "Your decision or problem", type: "textarea", rows: 4, required: true, placeholder: "Should I open a second outlet in Vijay Nagar or invest in online delivery first?" },
      { key: "Options", label: "Options you're considering", type: "textarea", rows: 2 },
      { key: "Constraints", label: "Constraints (money, time, people)", type: "textarea", rows: 2 },
      LANG,
    ],
  },
  // ═════════════ CHAT ═════════════
  "advance-ai-bot": {
    engine: "chat", credits: p("advance-ai-bot"),
    intro: "A general AI assistant for writing, explaining, planning and everyday questions.",
    welcome: "Ask anything — draft an email, explain a concept, plan a trip, solve a maths problem.",
    suggestions: ["Write a polite payment reminder", "Explain GST input credit simply", "Plan a 3-day Udaipur trip", "Summarise this paragraph:"],
    related: ["shastra-multi-pdf-ai-bot", "rich-editor", "cognimap"],
  },
  "shastra-multi-pdf-ai-bot": {
    engine: "chat", credits: p("shastra-multi-pdf-ai-bot"), documents: true,
    intro: "Ask questions across several PDFs at once — answers cite the document and page.",
    welcome: "Add one or more PDFs on the right, then ask questions. Answers say which document and page they came from.",
    suggestions: ["Summarise each document in 5 points", "What do these documents say about deadlines?", "Compare the key terms across files"],
    related: ["shastra-pdf-reader", "pdf-metadata-ai-analyst", "dictionary-extractor-ai", "ocr"],
  },
  // ═════════════ VISION ═════════════
  "ocr": {
    engine: "vision", credits: p("ocr"), mode: "text", fileName: "ocr-text", cta: "Extract text",
    intro: "Turn photos, screenshots and scanned PDF pages into editable text — Hindi, English and more.",
    steps: ["Add a photo or PDF", "Extract", "Copy, save or send on"],
    related: ["advance-text-extractor", "auto-text-extractor", "tool-8", "ai-data-analysis"],
  },
  "advance-text-extractor": {
    engine: "vision", credits: p("advance-text-extractor"), mode: "text", fileName: "extracted", cta: "Extract & structure",
    intro: "Converts document images into clean, structured Markdown — headings, lists and tables preserved.",
    related: ["ocr", "auto-text-extractor", "rich-editor", "ai-data-analysis"],
  },
  "auto-text-extractor": {
    engine: "vision", credits: p("auto-text-extractor"), mode: "fields", fileName: "fields", cta: "Extract fields",
    intro: "Snap an invoice, bill, receipt or card — get every field and line item as an editable table and CSV.",
    related: ["tool-2", "tool-1", "ocr", "meet-nudge"],
  },

  // ═════════════ IMAGES ═════════════
  "image-creator": {
    engine: "image", credits: p("image-creator"), promptLabel: "Describe the image", promptPlaceholder: "A cosy Indian chai stall at sunrise, steam rising, warm light",
    intro: "Create original images from a description — for posts, posters, products and presentations.",
    styles: ["Photo-realistic", "Illustration", "Watercolour", "Flat vector", "Cinematic", "Minimal"],
    aspects: ["1:1", "4:5", "16:9", "9:16"], allowReference: true,
    ideas: ["Festive Diwali sweets box on a marble table, diyas glowing", "Modern clinic reception, clean and welcoming", "Hand-drawn map of a spice market"],
    related: ["create-3d-images", "sketchflow-ai", "thumbnail-maker", "social-post-generator"],
  },
  "create-3d-images": {
    engine: "image", credits: p("create-3d-images"), promptLabel: "What should the 3D image show?", promptPlaceholder: "A cute 3D mascot of a smiling delivery scooter",
    promptPrefix: "A high-quality 3D render:",
    intro: "3D-style renders — mascots, product mock-ups, icons and scenes with depth and soft lighting.",
    styles: ["Pixar-style", "Clay", "Glossy product render", "Low-poly", "Isometric", "Realistic"],
    aspects: ["1:1", "4:5", "16:9"], allowReference: true,
    ideas: ["Isometric 3D model of a small bakery shop", "Glossy 3D app icon of a wallet with coins", "Clay-style 3D elephant mascot waving"],
    related: ["image-creator", "productvision-360", "thumbnail-maker"],
  },
  "sketchflow-ai": {
    engine: "image", credits: p("sketchflow-ai"), promptLabel: "Describe the sketch, or add your own rough drawing", promptPlaceholder: "Turn my rough sketch into a clean line drawing of a house with a garden",
    intro: "Turn ideas or rough doodles into clean sketches, line art and concept drawings.",
    styles: ["Pencil sketch", "Ink line art", "Architectural sketch", "Fashion sketch", "Storyboard", "Colour concept"],
    aspects: ["1:1", "4:3", "16:9", "3:4"], allowReference: true,
    ideas: ["Pencil sketch of a Rajasthani haveli courtyard", "Storyboard frame: girl opening a gift box", "Fashion sketch of an Indo-western kurta"],
    related: ["image-creator", "smart-diagram-ai", "storybook-creator"],
  },

  // ═════════════ CUSTOM APPS ═════════════
  "tool-22": { engine: "custom", credits: p("tool-22"), intro: "Make a GST-ready purchase order, print or share it, and get the covering email to your supplier.", related: ["tool-25", "tool-26", "tool-20", "tool-1"], component: custom(() => import("./custom/PurchaseOrder")) },
  "wrong-written-words": { engine: "custom", credits: p("wrong-written-words"), intro: "Find and fix spelling and grammar mistakes in English, Hindi and Hinglish — see every change.", related: ["rich-editor", "book-editor", "dictionary-extractor-ai"], component: custom(() => import("./custom/Proofreader")) },
  "storybook-creator": { engine: "custom", credits: p("storybook-creator"), intro: "Write an illustrated story for any age — read it as a book, print it, and illustrate pages with AI.", related: ["sketchflow-ai", "image-creator", "book-editor"], component: custom(() => import("./custom/StoryBook")) },
  "smart-diagram-ai": { engine: "custom", credits: p("smart-diagram-ai"), intro: "Describe a process, plan or structure and get a clean diagram you can edit and download.", related: ["kundkund-mindmap", "cognimap", "html-editor"], component: custom(() => import("./custom/SmartDiagram")) },
  "kundkund-mindmap": { engine: "custom", credits: p("kundkund-mindmap"), intro: "Turn any topic or text into a mind map you can expand, edit and export.", related: ["smart-diagram-ai", "cognimap"], component: custom(() => import("./custom/MindMap")) },
  "interactive-videos": { engine: "custom", credits: p("interactive-videos"), intro: "Add quiz checkpoints to any YouTube lesson — the video pauses and asks questions as you watch.", related: ["quiz-maker", "flashcard-maker"], component: custom(() => import("./custom/InteractiveVideo")) },
  "soul-mirror": { engine: "custom", credits: p("soul-mirror"), intro: "A Johari Window: pick words that describe you, invite friends to do the same, and see your open, blind and hidden areas.", related: ["cognimap"], component: custom(() => import("./custom/SoulMirror")) },
  "ai-data-analysis": { engine: "custom", credits: p("ai-data-analysis"), intro: "Upload a CSV and get instant charts, column statistics and an AI-written analysis of what matters.", related: ["tool-2", "tool-25", "auto-text-extractor", "ocr"], component: custom(() => import("./custom/DataAnalysis")) },
  "html-editor": { engine: "custom", credits: p("html-editor"), intro: "Edit HTML, CSS and JavaScript with a live preview — and ask AI to build or change the page for you.", related: ["rich-editor", "smart-diagram-ai", "image-creator"], component: custom(() => import("./custom/HtmlEditor")) },
  "rich-editor": { engine: "custom", credits: p("rich-editor"), intro: "A clean writing editor with formatting, word count, autosave and AI rewrite, translate and continue.", related: ["book-editor", "wrong-written-words", "advance-text-extractor"], component: custom(() => import("./custom/RichEditor")) },
  "book-editor": { engine: "custom", credits: p("book-editor"), intro: "Write a book chapter by chapter — outline, autosave, word goals, AI co-writer and Word export.", related: ["book-editor-html", "rich-editor", "storybook-creator"], component: custom(() => import("./custom/BookEditor")) },
  "book-editor-html": { engine: "custom", credits: p("book-editor-html"), intro: "The book editor with an HTML view — write chapters and export a styled, web-ready book.", related: ["book-editor", "html-editor", "rich-editor"], component: custom(() => import("./custom/BookEditor")) },
  "shastra-pdf-reader": { engine: "custom", credits: p("shastra-pdf-reader"), intro: "Read PDFs page by page with zoom and search — and ask AI to summarise, explain or translate the page you're on.", related: ["shastra-multi-pdf-ai-bot", "pdf-chart-image-extractor"], component: custom(() => import("./custom/PdfReader")) },
  "pdf-metadata-ai-analyst": { engine: "custom", credits: p("pdf-metadata-ai-analyst"), intro: "See a PDF's hidden metadata — author, software, dates, pages — and get an AI read of what the document is.", related: ["shastra-pdf-reader", "pdf-profile-extractor", "view-metadata"], component: custom(() => import("./custom/PdfMetadata")) },
  "pdf-profile-extractor": { engine: "custom", credits: p("pdf-profile-extractor"), intro: "Pull a structured profile out of resume PDFs — contact, skills, experience, education — and export to CSV.", related: ["tool-29", "tool-28", "meet-nudge"], component: custom(() => import("./custom/ProfileExtractor")) },
  "dictionary-extractor-ai": { engine: "custom", credits: p("dictionary-extractor-ai"), intro: "Build a glossary from any text or PDF — key terms with definitions and examples, ready to export.", related: ["flashcard-maker"], component: custom(() => import("./custom/Glossary")) },
  "pdf-chart-image-extractor": { engine: "custom", credits: p("pdf-chart-image-extractor"), intro: "Save every page of a PDF as an image, or crop out charts and figures — all in your browser, free.", related: ["shastra-pdf-reader", "ocr", "ai-data-analysis"], component: custom(() => import("./custom/PdfImages")) },
};

export const hasEngineApp = (toolId: string) => toolId in APPS;
