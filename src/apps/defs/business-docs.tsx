// Business documents (doc engine). Prices mirror supabase/functions/_shared/appSpecs/business-docs.ts.
import {
  p, s, daysFrom, isoToday, inDays, billTotals, rowsOf,
  BUSINESS, INDUSTRY, CITY, LANG, SENDER,
  LETTER_CHIPS, MSG_CHIPS, BILL_CHIPS, HR_CHIPS, AGREEMENT_CHIPS, FORM_CHIPS,
  num, inr,
} from "./shared";
import { Totals } from "../shell/Totals";
import type { AppDef } from "../types";

export const businessDocs: Record<string, AppDef> = {
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

  // Phase 1: Quotations & invoicing (tool-40–tool-49)
  "tool-40": {
    engine: "doc", credits: p("tool-40"), fileName: "gst-quotation", cta: "Create quotation",
    intro: "A GST quotation with every line item priced, the tax worked out and your terms at the bottom.",
    steps: ["Add your items and rates", "Check the total", "Send it on WhatsApp or email"],
    related: ["tool-1", "tool-41", "tool-42", "tool-49"],
    fields: [
      BUSINESS,
      { key: "Business GSTIN", label: "Your GSTIN", profile: "gstin", half: true, placeholder: "27AABCU9603R1ZX" },
      { key: "To", label: "Customer name", required: true, half: true, ctxKey: "clientName", placeholder: "Deepak Traders" },
      { key: "To address", label: "Customer address", ctxKey: "clientAddress", half: true, placeholder: "Shop 14, MG Road, Indore 452001" },
      { key: "Quotation number", label: "Quotation number", half: true, placeholder: "QT-2026-014" },
      { key: "Items", label: "Items & services", type: "rows", required: true,
        columns: [
          { key: "desc", label: "Item", placeholder: "Kaju katli 1 kg box" },
          { key: "qty", label: "Qty", type: "number" },
          { key: "price", label: "Rate (₹)", type: "money" },
          { key: "tax", label: "GST %", type: "number" },
        ],
        defaultRows: [{ desc: "", qty: "1", price: "", tax: "18" }],
      },
      { key: "Validity", label: "Valid till", type: "date", half: true, default: inDays(15), help: "Most quotations hold for 15–30 days." },
      { key: "Delivery", label: "Delivery time", half: true, placeholder: "Within 7 working days of order" },
      { key: "Payment", label: "Payment terms", type: "select", options: ["100% advance", "50% advance, 50% on delivery", "Payment on delivery", "15 days from invoice", "30 days from invoice"], half: true },
      { key: "Terms", label: "Anything else to add", type: "textarea", rows: 2, placeholder: "Prices exclude freight. Packing charges extra." },
    ],
    compute: (v) => {
      const t = billTotals(rowsOf(v, "Items"));
      return t.total ? { Subtotal: inr(t.sub), "GST total": inr(t.tax), "Grand total": inr(t.total), "Line count": String(t.lines) } : {};
    },
    preview: (v) => {
      const t = billTotals(rowsOf(v, "Items"));
      return <Totals sub={t.sub} tax={t.tax} total={t.total} />;
    },
    refineChips: BILL_CHIPS,
    sample: {
      Business: "Sharma Sweets", "Business GSTIN": "23AABCS1429P1ZK", To: "Deepak Traders",
      "To address": "Shop 14, MG Road, Indore 452001", "Quotation number": "QT-2026-014",
      Items: [
        { desc: "Kaju katli 1 kg box", qty: "25", price: "1100", tax: "5" },
        { desc: "Assorted mithai 500 g box", qty: "40", price: "450", tax: "5" },
        { desc: "Printed gift carton", qty: "65", price: "40", tax: "18" },
      ],
      Delivery: "Within 7 working days of order", Payment: "50% advance, 50% on delivery",
      Terms: "Prices exclude freight. Orders above 50 boxes get free local delivery.",
    },
  },
  "tool-41": {
    engine: "doc", credits: p("tool-41"), fileName: "proforma-invoice", cta: "Create proforma",
    intro: "A proforma invoice so a customer can release an advance or open an LC before you raise the real bill.",
    steps: ["Add the items", "Set the advance you want", "Send it for payment"],
    related: ["tool-40", "tool-1", "tool-44", "tool-49"],
    fields: [
      BUSINESS,
      { key: "Business GSTIN", label: "Your GSTIN", profile: "gstin", half: true },
      { key: "To", label: "Customer", required: true, half: true, ctxKey: "clientName", placeholder: "Metro Hardware" },
      { key: "To address", label: "Customer address", ctxKey: "clientAddress", half: true },
      { key: "Items", label: "Items / services", type: "rows", required: true,
        columns: [
          { key: "desc", label: "Description", placeholder: "MS angle 50×50×6 mm" },
          { key: "qty", label: "Qty", type: "number" },
          { key: "price", label: "Rate (₹)", type: "money" },
          { key: "tax", label: "GST %", type: "number" },
        ],
        defaultRows: [{ desc: "", qty: "1", price: "", tax: "18" }],
      },
      { key: "Advance", label: "Advance required (%)", type: "number", half: true, default: "50" },
      { key: "Delivery", label: "Delivery timeline", half: true, placeholder: "3 weeks from advance" },
      { key: "Bank", label: "Bank details for payment", type: "textarea", rows: 2, placeholder: "HDFC Bank, A/c 50200012345678, IFSC HDFC0001234" },
    ],
    compute: (v) => {
      const t = billTotals(rowsOf(v, "Items"));
      if (!t.total) return {};
      const pct = num(s(v, "Advance")) || 0;
      return { Subtotal: inr(t.sub), "GST total": inr(t.tax), "Grand total": inr(t.total), "Advance payable": pct ? `${inr((t.total * pct) / 100)} (${pct}%)` : "" };
    },
    preview: (v) => {
      const t = billTotals(rowsOf(v, "Items"));
      const pct = num(s(v, "Advance"));
      return <Totals sub={t.sub} tax={t.tax} total={t.total} note={pct && t.total ? `Advance at ${pct}%: ${inr((t.total * pct) / 100)}` : undefined} />;
    },
    refineChips: BILL_CHIPS,
    sample: {
      Business: "Ratna Steel Traders", "Business GSTIN": "27AABCR5512M1Z9", To: "Metro Hardware",
      "To address": "Plot 7, Bhosari MIDC, Pune 411026",
      Items: [
        { desc: "MS angle 50×50×6 mm", qty: "120", price: "640", tax: "18" },
        { desc: "MS flat 40×6 mm", qty: "80", price: "520", tax: "18" },
      ],
      Advance: "40", Delivery: "3 weeks from receipt of advance",
      Bank: "HDFC Bank, Bhosari branch · A/c 50200012345678 · IFSC HDFC0001234",
    },
  },
  "tool-42": {
    engine: "doc", credits: p("tool-42"), fileName: "purchase-order", cta: "Create purchase order",
    intro: "A purchase order to your supplier with rates, delivery date and the terms you want held to.",
    steps: ["Enter supplier and items", "Set delivery and payment terms", "Send the PO"],
    related: ["tool-22", "tool-43", "tool-77", "tool-97"],
    fields: [
      BUSINESS,
      { key: "PO number", label: "PO number", half: true, placeholder: "PO-2026-087" },
      { key: "Date", label: "PO date", type: "date", half: true, default: isoToday() },
      { key: "Supplier", label: "Supplier name", required: true, half: true, placeholder: "Agarwal Packaging" },
      { key: "Supplier address", label: "Supplier address", half: true },
      { key: "Items", label: "What you are ordering", type: "rows", required: true,
        columns: [
          { key: "desc", label: "Item", placeholder: "Corrugated box 12×9×4 in" },
          { key: "qty", label: "Qty", type: "number" },
          { key: "price", label: "Rate (₹)", type: "money" },
          { key: "tax", label: "GST %", type: "number" },
        ],
        defaultRows: [{ desc: "", qty: "1", price: "", tax: "18" }],
      },
      { key: "Deliver to", label: "Deliver to", profile: "address", placeholder: "Godown 3, Sanwer Road, Indore" },
      { key: "Deliver by", label: "Required by", type: "date", half: true, default: inDays(15) },
      { key: "Payment", label: "Payment terms", type: "select", options: ["Advance with order", "On delivery", "15 days from delivery", "30 days from delivery", "45 days from delivery"], half: true },
      { key: "Conditions", label: "Conditions", type: "textarea", rows: 2, placeholder: "Reject short supply. Invoice must quote this PO number." },
    ],
    compute: (v) => {
      const t = billTotals(rowsOf(v, "Items"));
      return t.total ? { Subtotal: inr(t.sub), "GST total": inr(t.tax), "Order value": inr(t.total) } : {};
    },
    preview: (v) => {
      const t = billTotals(rowsOf(v, "Items"));
      return <Totals sub={t.sub} tax={t.tax} total={t.total} />;
    },
    refineChips: BILL_CHIPS,
    sample: {
      Business: "Sharma Sweets", "PO number": "PO-2026-087", Supplier: "Agarwal Packaging",
      "Supplier address": "22 Industrial Estate, Dewas Naka, Indore",
      Items: [
        { desc: "Corrugated box 12×9×4 in", qty: "500", price: "28", tax: "18" },
        { desc: "Printed sticker roll (1000 pcs)", qty: "6", price: "340", tax: "18" },
      ],
      "Deliver to": "Godown 3, Sanwer Road, Indore", Payment: "15 days from delivery",
      Conditions: "Invoice must quote this PO number. Short supply will be rejected.",
    },
  },
  "tool-43": {
    engine: "doc", credits: p("tool-43"), fileName: "delivery-challan", cta: "Create challan",
    intro: "A delivery challan for goods going out without a bill — job work, samples, branch transfer or returns.",
    steps: ["List what is going out", "Say why it is moving", "Print two copies for the driver"],
    related: ["tool-42", "tool-80", "tool-40", "tool-23"],
    fields: [
      BUSINESS,
      { key: "Business GSTIN", label: "Your GSTIN", profile: "gstin", half: true },
      { key: "Challan number", label: "Challan number", half: true, placeholder: "DC-2026-031" },
      { key: "Date", label: "Date", type: "date", half: true, default: isoToday() },
      { key: "Reason", label: "Why the goods are moving", type: "select", required: true, options: ["Job work", "Sample / demo", "Branch transfer", "Goods on approval", "Return to supplier", "Exhibition", "Repair"], half: true },
      { key: "Consignee", label: "Send to (name)", required: true, half: true, placeholder: "Hitesh Fabricators" },
      { key: "Consignee address", label: "Send to (address)", half: true },
      { key: "Items", label: "Goods", type: "rows", required: true,
        columns: [
          { key: "desc", label: "Description", placeholder: "Brass fittings, assorted" },
          { key: "qty", label: "Qty", type: "number" },
          { key: "unit", label: "Unit", type: "select", options: ["Nos", "Kg", "Box", "Metre", "Litre", "Set"] },
          { key: "price", label: "Value (₹)", type: "money" },
        ],
        defaultRows: [{ desc: "", qty: "1", unit: "Nos", price: "" }],
      },
      { key: "Vehicle", label: "Vehicle number", half: true, placeholder: "MP 09 KL 4421" },
      { key: "Return by", label: "Expected back by", type: "date", half: true, help: "For job work and goods on approval." },
    ],
    compute: (v) => {
      const t = billTotals(rowsOf(v, "Items"));
      return t.total ? { "Declared value of goods": inr(t.total), "Line count": String(t.lines) } : {};
    },
    preview: (v) => {
      const t = billTotals(rowsOf(v, "Items"));
      return t.total ? <Totals sub={t.sub} total={t.total} note="Declared value — a challan carries no tax." /> : null;
    },
    refineChips: FORM_CHIPS,
    sample: {
      Business: "Ratna Steel Traders", "Business GSTIN": "27AABCR5512M1Z9", "Challan number": "DC-2026-031",
      Reason: "Job work", Consignee: "Hitesh Fabricators",
      "Consignee address": "Gat 212, Chakan, Pune 410501",
      Items: [
        { desc: "MS sheet 2 mm, uncut", qty: "40", unit: "Nos", price: "880" },
        { desc: "Fixtures for bending", qty: "4", unit: "Set", price: "2500" },
      ],
      Vehicle: "MH 14 BK 7788",
    },
  },
  "tool-44": {
    engine: "doc", credits: p("tool-44"), fileName: "credit-note", cta: "Create credit note",
    intro: "A credit note against an invoice you have already raised — for a return, a rate correction or a discount.",
    steps: ["Quote the original invoice", "List what you are crediting", "Send it with the adjusted amount"],
    related: ["tool-1", "tool-81", "tool-40", "tool-4"],
    fields: [
      BUSINESS,
      { key: "Business GSTIN", label: "Your GSTIN", profile: "gstin", half: true },
      { key: "Credit note number", label: "Credit note number", half: true, placeholder: "CN-2026-009" },
      { key: "Date", label: "Date", type: "date", half: true, default: isoToday() },
      { key: "Customer", label: "Customer", required: true, half: true, ctxKey: "clientName" },
      { key: "Original invoice", label: "Against invoice number", required: true, half: true, ctxKey: "invoiceNumber", placeholder: "INV-2026-221" },
      { key: "Invoice date", label: "Original invoice date", type: "date", half: true },
      { key: "Reason", label: "Reason for the credit", type: "select", required: true, options: ["Goods returned", "Short supply", "Damaged in transit", "Rate charged too high", "Discount agreed later", "Order cancelled", "Tax charged wrongly"], half: true },
      { key: "Items", label: "What you are crediting", type: "rows", required: true,
        columns: [
          { key: "desc", label: "Item", placeholder: "Assorted mithai 500 g box" },
          { key: "qty", label: "Qty", type: "number" },
          { key: "price", label: "Rate (₹)", type: "money" },
          { key: "tax", label: "GST %", type: "number" },
        ],
        defaultRows: [{ desc: "", qty: "1", price: "", tax: "18" }],
      },
      { key: "Note", label: "Note to the customer", type: "textarea", rows: 2, placeholder: "Adjust this against your next order." },
    ],
    compute: (v) => {
      const t = billTotals(rowsOf(v, "Items"));
      return t.total ? { "Credit before tax": inr(t.sub), "GST credited": inr(t.tax), "Total credit": inr(t.total) } : {};
    },
    preview: (v) => {
      const t = billTotals(rowsOf(v, "Items"));
      return <Totals sub={t.sub} tax={t.tax} total={t.total} note="This is the amount coming off the customer's account." />;
    },
    refineChips: BILL_CHIPS,
    sample: {
      Business: "Sharma Sweets", "Business GSTIN": "23AABCS1429P1ZK", "Credit note number": "CN-2026-009",
      Customer: "Deepak Traders", "Original invoice": "INV-2026-221", Reason: "Damaged in transit",
      Items: [{ desc: "Assorted mithai 500 g box", qty: "6", price: "450", tax: "5" }],
      Note: "Adjust this against your next order. Replacement boxes already dispatched.",
    },
  },
  "tool-45": {
    engine: "doc", credits: p("tool-45"), fileName: "billing-schedule", cta: "Create billing schedule",
    intro: "A payment schedule tied to milestones, so a long job gets billed in stages instead of all at the end.",
    steps: ["Enter the contract value", "Split it across milestones", "Attach it to the agreement"],
    related: ["tool-83", "tool-75", "tool-49", "tool-40"],
    fields: [
      BUSINESS,
      { key: "Client", label: "Client", required: true, half: true, ctxKey: "clientName", placeholder: "Ashirwad Builders" },
      { key: "Project", label: "Project or work", required: true, half: true, ctxKey: "service", placeholder: "Interior fit-out, 2nd floor" },
      { key: "Contract value", label: "Total contract value (₹)", type: "money", required: true, half: true },
      { key: "Start", label: "Start date", type: "date", half: true, default: isoToday() },
      { key: "Milestones", label: "Milestones", type: "rows", required: true,
        columns: [
          { key: "stage", label: "Milestone", placeholder: "On signing" },
          { key: "pct", label: "Share %", type: "number" },
          { key: "due", label: "Expected date", type: "date" },
        ],
        defaultRows: [{ stage: "On signing", pct: "25", due: "" }, { stage: "", pct: "", due: "" }],
      },
      { key: "Late terms", label: "If payment is late", half: true, placeholder: "1.5% per month on overdue amounts" },
      { key: "Invoice note", label: "How you will invoice", type: "textarea", rows: 2, placeholder: "Invoice raised on milestone sign-off. Payment within 15 days." },
    ],
    compute: (v) => {
      const rows = rowsOf(v, "Milestones").filter((r) => num(r.pct));
      const value = num(s(v, "Contract value"));
      if (!rows.length) return {};
      const pct = rows.reduce((a, r) => a + num(r.pct), 0);
      const lines = rows.map((r) => `${r.stage || "Milestone"}: ${r.pct}% = ${inr((value * num(r.pct)) / 100)}`).join("; ");
      return { "Amount per milestone": lines, "Shares add up to": `${pct}%` };
    },
    preview: (v) => {
      const rows = rowsOf(v, "Milestones").filter((r) => num(r.pct));
      if (!rows.length) return null;
      const pct = rows.reduce((a, r) => a + num(r.pct), 0);
      const value = num(s(v, "Contract value"));
      return (
        <div className="rounded-xl bg-primary/5 p-3 text-sm">
          Milestones cover <strong>{pct}%</strong>
          {value ? <> of {inr(value)} — billed {inr((value * pct) / 100)}</> : null}
          {pct !== 100 && <span className="ml-2 text-xs text-amber-600">{pct < 100 ? `${100 - pct}% is unbilled.` : `That is ${pct - 100}% over the contract value.`}</span>}
        </div>
      );
    },
    refineChips: BILL_CHIPS,
    sample: {
      Business: "Verma Interiors", Client: "Ashirwad Builders", Project: "Interior fit-out, 2nd floor",
      "Contract value": "1850000",
      Milestones: [
        { stage: "On signing", pct: "25", due: "" },
        { stage: "Carpentry and false ceiling done", pct: "30", due: "" },
        { stage: "Electrical and painting done", pct: "30", due: "" },
        { stage: "Handover and snag list closed", pct: "15", due: "" },
      ],
      "Late terms": "1.5% per month on overdue amounts",
      "Invoice note": "Invoice raised on milestone sign-off by the site engineer. Payment within 15 days.",
    },
  },
  "tool-46": {
    engine: "doc", credits: p("tool-46"), fileName: "expense-report", cta: "Create expense report",
    intro: "A claim sheet for money spent on company work, grouped by head with the total to be reimbursed.",
    steps: ["List what you spent", "Check the total", "Send it for approval"],
    related: ["tool-2", "tool-92", "tool-97", "tool-3"],
    fields: [
      BUSINESS,
      { key: "Name", label: "Who is claiming", profile: "ownerName", required: true, half: true, placeholder: "Rohit Patil" },
      { key: "Department", label: "Department / role", half: true, placeholder: "Sales" },
      { key: "Period", label: "For the period", half: true, placeholder: "1–31 March 2026" },
      { key: "Purpose", label: "Purpose", half: true, placeholder: "Client visits, Bhopal and Jabalpur" },
      { key: "Expenses", label: "Expenses", type: "rows", required: true,
        columns: [
          { key: "date", label: "Date", type: "date" },
          { key: "head", label: "Head", type: "select", options: ["Travel", "Food", "Stay", "Fuel", "Phone / internet", "Printing", "Client entertainment", "Other"] },
          { key: "desc", label: "Details", placeholder: "Train Indore–Bhopal" },
          { key: "price", label: "Amount (₹)", type: "money" },
        ],
        defaultRows: [{ date: "", head: "Travel", desc: "", price: "" }],
      },
      { key: "Advance taken", label: "Advance already taken (₹)", type: "money", half: true },
      { key: "Bills attached", label: "Bills attached", type: "select", options: ["All bills attached", "Some bills missing", "No bills"], half: true },
    ],
    compute: (v) => {
      const rows = rowsOf(v, "Expenses");
      const t = billTotals(rows, { qty: "_none", price: "price" });
      if (!t.total) return {};
      const byHead = new Map<string, number>();
      for (const r of rows) if (num(r.price)) byHead.set(r.head || "Other", (byHead.get(r.head || "Other") ?? 0) + num(r.price));
      const adv = num(s(v, "Advance taken"));
      return {
        "Total claimed": inr(t.total),
        "By head": [...byHead].map(([h, n]) => `${h}: ${inr(n)}`).join("; "),
        ...(adv ? { "Net payable after advance": inr(t.total - adv) } : {}),
      };
    },
    preview: (v) => {
      const t = billTotals(rowsOf(v, "Expenses"), { qty: "_none", price: "price" });
      const adv = num(s(v, "Advance taken"));
      return <Totals sub={t.sub} total={t.total} note={adv && t.total ? `Less advance ${inr(adv)} → net ${inr(t.total - adv)}` : undefined} />;
    },
    refineChips: FORM_CHIPS,
    sample: {
      Business: "Verma Tax Consultants", Name: "Rohit Patil", Department: "Sales", Period: "1–31 March 2026",
      Purpose: "Client visits, Bhopal and Jabalpur",
      Expenses: [
        { date: "", head: "Travel", desc: "Train Indore–Bhopal, 2nd AC return", price: "1840" },
        { date: "", head: "Stay", desc: "Hotel Sagar, 2 nights", price: "4300" },
        { date: "", head: "Food", desc: "Meals, 3 days", price: "1150" },
        { date: "", head: "Fuel", desc: "Local taxi and auto", price: "920" },
      ],
      "Advance taken": "5000", "Bills attached": "All bills attached",
    },
  },
  "tool-47": {
    engine: "doc", credits: p("tool-47"), fileName: "advance-recovery-letter", cta: "Write recovery letter",
    intro: "A firm letter asking for an advance back when the work was never done or the goods never came.",
    steps: ["Enter the amount and when you paid", "Set a deadline", "Send it and keep the proof"],
    related: ["tool-5", "tool-64", "tool-9", "tool-71"],
    fields: [
      BUSINESS, SENDER,
      { key: "To", label: "Who you paid", required: true, half: true, placeholder: "Agarwal Packaging" },
      { key: "To address", label: "Their address", half: true },
      { key: "Amount", label: "Advance paid (₹)", type: "money", required: true, half: true },
      { key: "Paid on", label: "Paid on", type: "date", required: true, half: true },
      { key: "Proof", label: "How you paid", half: true, placeholder: "NEFT, UTR 2026031512345678" },
      { key: "For", label: "What it was for", required: true, half: true, placeholder: "5,000 printed cartons" },
      { key: "What happened", label: "What has happened since", type: "textarea", rows: 3, required: true, placeholder: "Delivery was promised in 3 weeks. Nothing has come in 11 weeks and calls are not returned." },
      { key: "Deadline", label: "Refund wanted by", type: "date", half: true, default: inDays(15) },
      { key: "Escalation", label: "What you will do if ignored", type: "select", options: ["Legal notice through a lawyer", "Consumer forum complaint", "Civil recovery suit", "MSME Samadhaan complaint", "Not decided yet"], half: true },
    ],
    compute: (v) => {
      const d = daysFrom(s(v, "Paid on"));
      return Number.isFinite(d) && d < 0 ? { "Days since payment": String(-d) } : {};
    },
    preview: (v) => {
      const d = daysFrom(s(v, "Paid on"));
      return Number.isFinite(d) && d < 0 ? <p className="rounded-xl bg-amber-500/10 p-3 text-sm">Paid <strong>{-d} days</strong> ago.</p> : null;
    },
    refineChips: LETTER_CHIPS,
    sample: {
      Business: "Sharma Sweets", Sender: "Anil Sharma, Proprietor", To: "Agarwal Packaging",
      "To address": "22 Industrial Estate, Dewas Naka, Indore",
      Amount: "84000", Proof: "NEFT, UTR 2026031512345678", For: "5,000 printed gift cartons",
      "What happened": "Delivery was promised within three weeks of the advance. Eleven weeks have passed, no cartons have been delivered, and calls and messages since 2 February have not been returned.",
      Escalation: "Legal notice through a lawyer",
    },
  },
  "tool-48": {
    engine: "doc", credits: p("tool-48"), fileName: "commission-slip", cta: "Create commission slip",
    intro: "A payout slip for an agent or distributor showing the sales, the rate and what is due after deductions.",
    steps: ["Enter sales and rate", "Check the payout", "Send it with the payment"],
    related: ["tool-50", "tool-102", "tool-46", "tool-11"],
    fields: [
      BUSINESS,
      { key: "Agent", label: "Agent / distributor", required: true, half: true, placeholder: "Imran Shaikh" },
      { key: "Agent code", label: "Agent code", half: true, placeholder: "AG-114" },
      { key: "Period", label: "For the period", required: true, half: true, placeholder: "March 2026" },
      { key: "Sales", label: "Sales in the period (₹)", type: "money", required: true, half: true },
      { key: "Rate", label: "Commission rate (%)", type: "number", required: true, half: true },
      { key: "Bonus", label: "Incentive or bonus (₹)", type: "money", half: true },
      { key: "Deductions", label: "Deductions", type: "rows",
        columns: [
          { key: "desc", label: "Deduction", placeholder: "TDS 194H @ 5%" },
          { key: "price", label: "Amount (₹)", type: "money" },
        ],
        defaultRows: [{ desc: "", price: "" }],
      },
      { key: "Paid by", label: "Paid by", type: "select", options: ["Bank transfer", "Cheque", "UPI", "Cash", "Adjusted against dues"], half: true },
      { key: "Note", label: "Note", type: "textarea", rows: 2, placeholder: "Target for next month: ₹12 lakh." },
    ],
    compute: (v) => {
      const sales = num(s(v, "Sales"));
      const rate = num(s(v, "Rate"));
      if (!sales || !rate) return {};
      const earned = (sales * rate) / 100;
      const bonus = num(s(v, "Bonus"));
      const ded = billTotals(rowsOf(v, "Deductions"), { qty: "_none", price: "price" }).total;
      return {
        "Commission earned": `${inr(earned)} (${rate}% of ${inr(sales)})`,
        ...(bonus ? { Incentive: inr(bonus) } : {}),
        ...(ded ? { "Total deductions": inr(ded) } : {}),
        "Net payable": inr(earned + bonus - ded),
      };
    },
    preview: (v) => {
      const sales = num(s(v, "Sales"));
      const rate = num(s(v, "Rate"));
      if (!sales || !rate) return null;
      const earned = (sales * rate) / 100;
      const bonus = num(s(v, "Bonus"));
      const ded = billTotals(rowsOf(v, "Deductions"), { qty: "_none", price: "price" }).total;
      return <Totals sub={earned} total={earned + bonus - ded} note={`Commission ${inr(earned)}${bonus ? ` + incentive ${inr(bonus)}` : ""}${ded ? ` − deductions ${inr(ded)}` : ""}`} />;
    },
    refineChips: BILL_CHIPS,
    sample: {
      Business: "Ratna Steel Traders", Agent: "Imran Shaikh", "Agent code": "AG-114", Period: "March 2026",
      Sales: "940000", Rate: "2.5", Bonus: "3000",
      Deductions: [{ desc: "TDS 194H @ 5%", price: "1175" }],
      "Paid by": "Bank transfer", Note: "Target for April: ₹12 lakh.",
    },
  },
  "tool-49": {
    engine: "doc", credits: p("tool-49"), fileName: "payment-terms", cta: "Write payment terms",
    intro: "The payment terms to print on your invoices and quotations — credit days, late interest and how disputes are handled.",
    steps: ["Pick your credit period", "Set late-payment interest", "Paste it into your bills"],
    related: ["tool-40", "tool-5", "tool-75", "tool-45"],
    fields: [
      BUSINESS, INDUSTRY,
      { key: "Credit days", label: "Credit period you allow", type: "select", required: true, options: ["Advance only", "Payment on delivery", "7 days", "15 days", "30 days", "45 days", "60 days"], half: true },
      { key: "Advance", label: "Advance you ask for (%)", type: "number", half: true, placeholder: "30" },
      { key: "Late interest", label: "Interest on late payment (% per month)", type: "number", half: true, default: "1.5" },
      { key: "Early discount", label: "Early-payment discount", half: true, placeholder: "2% if paid within 7 days" },
      { key: "Methods", label: "How customers can pay", type: "chips", options: ["Bank transfer / NEFT", "UPI", "Cheque", "Cash", "Credit card", "Letter of credit"] },
      { key: "Stop supply", label: "When you stop supplying", half: true, placeholder: "If dues cross 45 days or ₹2 lakh" },
      { key: "Jurisdiction", label: "Courts of which city", profile: "city", half: true, placeholder: "Indore" },
    ],
    refineChips: ["Shorter — one paragraph", "Stricter", "Friendlier wording", "Translate to Hindi"],
    sample: {
      Business: "Ratna Steel Traders", Industry: "Steel and hardware trading", "Credit days": "30 days",
      Advance: "30", "Late interest": "1.5", "Early discount": "2% if paid within 7 days",
      Methods: "Bank transfer / NEFT|UPI|Cheque", "Stop supply": "If dues cross 45 days or ₹2 lakh",
      Jurisdiction: "Pune",
    },
  },

  // Phase 1: Salary & HR documents (tool-50–tool-59)
  "tool-50": {
    engine: "doc", credits: p("tool-50"), fileName: "salary-slip", cta: "Create salary slip",
    intro: "A monthly salary slip with earnings, deductions and net pay, worked out and laid out as a payslip.",
    steps: ["Enter pay and deductions", "Check the net pay", "Send it to the employee"],
    related: ["tool-102", "tool-91", "tool-58", "tool-94"],
    fields: [
      BUSINESS,
      { key: "Month", label: "Salary month", required: true, half: true, placeholder: "March 2026" },
      { key: "Employee", label: "Employee name", required: true, half: true, placeholder: "Anjali Deshmukh" },
      { key: "Employee ID", label: "Employee ID", half: true, placeholder: "EMP-042" },
      { key: "Designation", label: "Designation", half: true, placeholder: "Accounts executive" },
      { key: "Days", label: "Days paid", type: "number", half: true, placeholder: "31" },
      { key: "LOP days", label: "Unpaid leave days", type: "number", half: true },
      { key: "Earnings", label: "Earnings", type: "rows", required: true,
        columns: [
          { key: "desc", label: "Head", placeholder: "Basic" },
          { key: "price", label: "Amount (₹)", type: "money" },
        ],
        defaultRows: [{ desc: "Basic", price: "" }, { desc: "HRA", price: "" }, { desc: "Conveyance", price: "" }],
      },
      { key: "Deductions", label: "Deductions", type: "rows",
        columns: [
          { key: "desc", label: "Head", placeholder: "EPF (employee)" },
          { key: "price", label: "Amount (₹)", type: "money" },
        ],
        defaultRows: [{ desc: "EPF (employee)", price: "" }, { desc: "Professional tax", price: "" }],
      },
      { key: "Bank", label: "Paid into", half: true, placeholder: "HDFC ••••4321" },
    ],
    compute: (v) => {
      const earn = billTotals(rowsOf(v, "Earnings"), { qty: "_none", price: "price" }).total;
      const ded = billTotals(rowsOf(v, "Deductions"), { qty: "_none", price: "price" }).total;
      return earn ? { "Gross earnings": inr(earn), "Total deductions": inr(ded), "Net pay": inr(earn - ded) } : {};
    },
    preview: (v) => {
      const earn = billTotals(rowsOf(v, "Earnings"), { qty: "_none", price: "price" }).total;
      const ded = billTotals(rowsOf(v, "Deductions"), { qty: "_none", price: "price" }).total;
      return earn ? <Totals sub={earn} total={earn - ded} note={`Gross ${inr(earn)} − deductions ${inr(ded)} = net pay`} /> : null;
    },
    refineChips: FORM_CHIPS,
    sample: {
      Business: "Verma Tax Consultants", Month: "March 2026", Employee: "Anjali Deshmukh",
      "Employee ID": "EMP-042", Designation: "Accounts executive", Days: "31", "LOP days": "0",
      Earnings: [
        { desc: "Basic", price: "22000" },
        { desc: "HRA", price: "8800" },
        { desc: "Conveyance", price: "2400" },
        { desc: "Special allowance", price: "3800" },
      ],
      Deductions: [
        { desc: "EPF (employee)", price: "2640" },
        { desc: "Professional tax", price: "200" },
      ],
      Bank: "HDFC ••••4321",
    },
  },
  "tool-51": {
    engine: "doc", credits: p("tool-51"), fileName: "offer-letter", cta: "Write offer letter",
    intro: "A job offer letter with the role, the pay break-up, the start date and the terms the person is accepting.",
    steps: ["Enter the role and pay", "Add the terms", "Send it for signature"],
    related: ["tool-94", "tool-58", "tool-96", "tool-102"],
    fields: [
      BUSINESS,
      { key: "Candidate", label: "Candidate name", required: true, half: true, placeholder: "Anjali Deshmukh" },
      { key: "Role", label: "Role offered", required: true, half: true, placeholder: "Accounts executive" },
      { key: "CTC", label: "Annual CTC (₹)", type: "money", required: true, half: true },
      { key: "Start date", label: "Date of joining", type: "date", required: true, half: true, default: inDays(15) },
      { key: "Reports to", label: "Reports to", half: true, placeholder: "Finance manager" },
      { key: "Location", label: "Place of posting", profile: "city", half: true },
      { key: "Probation", label: "Probation", type: "select", options: ["No probation", "3 months", "6 months"], half: true },
      { key: "Notice", label: "Notice period", type: "select", options: ["15 days", "1 month", "2 months", "3 months"], half: true },
      { key: "Working days", label: "Working days & hours", half: true, placeholder: "Mon–Sat, 10 am to 7 pm" },
      { key: "Benefits", label: "Benefits included", type: "chips", options: ["EPF", "ESI", "Health insurance", "Paid leave", "Annual bonus", "Performance incentive", "Mobile reimbursement", "Travel allowance"] },
      { key: "Accept by", label: "Please accept by", type: "date", half: true, default: inDays(7) },
      SENDER,
    ],
    refineChips: HR_CHIPS,
    sample: {
      Business: "Verma Tax Consultants", Candidate: "Anjali Deshmukh", Role: "Accounts executive",
      CTC: "444000", "Reports to": "Finance manager", Location: "Indore", Probation: "3 months",
      Notice: "1 month", "Working days": "Mon–Sat, 10 am to 7 pm",
      Benefits: "EPF|Paid leave|Annual bonus",
      Sender: "Suresh Verma, Partner",
    },
  },
  "tool-52": {
    engine: "doc", credits: p("tool-52"), fileName: "experience-letter", cta: "Write experience letter",
    intro: "An experience certificate for someone leaving, stating the dates, the role and a fair word about their work.",
    steps: ["Enter the dates and role", "Say what they did well", "Print it on your letterhead"],
    related: ["tool-54", "tool-95", "tool-89", "tool-51"],
    fields: [
      BUSINESS,
      { key: "Employee", label: "Employee name", required: true, half: true, placeholder: "Rohit Patil" },
      { key: "Designation", label: "Last designation", required: true, half: true, placeholder: "Senior sales executive" },
      { key: "From", label: "Joined on", type: "date", required: true, half: true },
      { key: "To", label: "Last working day", type: "date", required: true, half: true },
      { key: "Department", label: "Department", half: true, placeholder: "Sales" },
      { key: "Responsibilities", label: "What they handled", type: "textarea", rows: 3, placeholder: "Dealer accounts across Malwa, monthly collections of about ₹18 lakh, two junior executives." },
      { key: "Strengths", label: "What they were good at", type: "textarea", rows: 2, placeholder: "Reliable with collections, kept dealer relationships steady." },
      { key: "Conduct", label: "Conduct", type: "select", options: ["Good", "Very good", "Excellent", "Satisfactory"], half: true },
      { key: "Reason", label: "Reason for leaving", type: "select", options: ["Resigned", "Better opportunity", "Higher studies", "Contract ended", "Relocation", "Personal reasons"], half: true },
      SENDER,
    ],
    compute: (v) => {
      const a = s(v, "From");
      const b = s(v, "To");
      if (!a || !b) return {};
      const months = Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 2629800000));
      return months ? { "Length of service": `${Math.floor(months / 12)} years ${months % 12} months` } : {};
    },
    refineChips: HR_CHIPS,
    sample: {
      Business: "Ratna Steel Traders", Employee: "Rohit Patil", Designation: "Senior sales executive",
      Department: "Sales",
      Responsibilities: "Dealer accounts across the Malwa region, monthly collections of about ₹18 lakh, and two junior executives reporting to him.",
      Strengths: "Reliable with collections and kept dealer relationships steady through a difficult price year.",
      Conduct: "Very good", Reason: "Better opportunity", Sender: "Kavita Ratna, Director",
    },
  },
  "tool-53": {
    engine: "doc", credits: p("tool-53"), fileName: "appraisal-form", cta: "Create appraisal form",
    intro: "An appraisal form with ratings against the things that matter in the role, plus goals for the next year.",
    steps: ["Rate each area", "Add goals and support", "Discuss it with the employee"],
    related: ["tool-36", "tool-101", "tool-55", "tool-29"],
    fields: [
      BUSINESS,
      { key: "Employee", label: "Employee name", required: true, half: true },
      { key: "Designation", label: "Designation", half: true },
      { key: "Period", label: "Appraisal period", required: true, half: true, placeholder: "April 2025 – March 2026" },
      { key: "Reviewer", label: "Reviewed by", profile: "ownerName", half: true },
      { key: "Ratings", label: "Rate each area out of 5", type: "rows", required: true,
        columns: [
          { key: "area", label: "Area", placeholder: "Quality of work" },
          { key: "rating", label: "Rating /5", type: "number" },
          { key: "note", label: "Evidence / example" },
        ],
        defaultRows: [
          { area: "Quality of work", rating: "", note: "" },
          { area: "Reliability & attendance", rating: "", note: "" },
          { area: "Working with others", rating: "", note: "" },
          { area: "Customer handling", rating: "", note: "" },
        ],
      },
      { key: "Achievements", label: "Main achievements", type: "textarea", rows: 2 },
      { key: "Improve", label: "Where they need to improve", type: "textarea", rows: 2 },
      { key: "Goals", label: "Goals for next period", type: "textarea", rows: 2 },
      { key: "Increment", label: "Increment recommended", type: "select", options: ["Not due yet", "No increment", "Up to 5%", "5–10%", "10–15%", "Above 15%", "Promotion recommended"], half: true },
    ],
    compute: (v) => {
      const rows = rowsOf(v, "Ratings").filter((r) => num(r.rating));
      if (!rows.length) return {};
      const avg = rows.reduce((a, r) => a + num(r.rating), 0) / rows.length;
      return { "Average rating": `${avg.toFixed(2)} out of 5 across ${rows.length} areas` };
    },
    preview: (v) => {
      const rows = rowsOf(v, "Ratings").filter((r) => num(r.rating));
      if (!rows.length) return null;
      const avg = rows.reduce((a, r) => a + num(r.rating), 0) / rows.length;
      return <div className="rounded-xl bg-primary/5 p-3 text-sm">Average rating: <strong>{avg.toFixed(2)} / 5</strong> across {rows.length} areas</div>;
    },
    refineChips: HR_CHIPS,
    sample: {
      Business: "Verma Tax Consultants", Employee: "Anjali Deshmukh", Designation: "Accounts executive",
      Period: "April 2025 – March 2026", Reviewer: "Suresh Verma",
      Ratings: [
        { area: "Quality of work", rating: "4", note: "GST returns filed on time all 12 months, no notices" },
        { area: "Reliability & attendance", rating: "5", note: "No unplanned absence" },
        { area: "Working with others", rating: "3", note: "Works well alone, hesitant to ask for help early" },
        { area: "Customer handling", rating: "4", note: "Handled 40 client accounts, two escalations only" },
      ],
      Achievements: "Cleared a two-year backlog of reconciliations and trained the new junior.",
      Improve: "Raise problems sooner instead of absorbing them; take the lead in client calls.",
      Goals: "Handle 55 client accounts independently and complete the GST certification course.",
      Increment: "10–15%",
    },
  },
  "tool-54": {
    engine: "doc", credits: p("tool-54"), fileName: "resignation-acceptance", cta: "Write acceptance letter",
    intro: "A letter accepting a resignation, setting the last working day and listing what has to be settled and returned.",
    steps: ["Confirm the last working day", "List dues and handover", "Send it to the employee"],
    related: ["tool-52", "tool-95", "tool-71", "tool-91"],
    fields: [
      BUSINESS,
      { key: "Employee", label: "Employee name", required: true, half: true },
      { key: "Designation", label: "Designation", half: true },
      { key: "Resigned on", label: "Resignation received on", type: "date", required: true, half: true, default: isoToday() },
      { key: "Last day", label: "Last working day", type: "date", required: true, half: true, default: inDays(30) },
      { key: "Notice", label: "Notice period in the contract", type: "select", options: ["15 days", "1 month", "2 months", "3 months"], half: true },
      { key: "Notice status", label: "Notice served", type: "select", options: ["Serving it in full", "Partly waived by us", "Fully waived by us", "Being bought out by the employee"], half: true },
      { key: "Dues", label: "What is being settled", type: "chips", options: ["Salary till last day", "Leave encashment", "Gratuity", "Annual bonus (pro-rata)", "Reimbursements pending", "Notice-period recovery"] },
      { key: "Return", label: "Company property to return", type: "chips", options: ["Laptop", "Mobile / SIM", "ID card", "Keys", "Vehicle", "Tools", "Documents & files"] },
      { key: "Handover", label: "Handover expected", type: "textarea", rows: 2, placeholder: "Client list with status notes, pending GST filings, and a half-day walkthrough with the replacement." },
      { key: "Settlement date", label: "Full and final settlement by", type: "date", half: true, default: inDays(45) },
      SENDER,
    ],
    refineChips: HR_CHIPS,
    sample: {
      Business: "Ratna Steel Traders", Employee: "Rohit Patil", Designation: "Senior sales executive",
      Notice: "1 month", "Notice status": "Serving it in full",
      Dues: "Salary till last day|Leave encashment|Reimbursements pending",
      Return: "Laptop|Mobile / SIM|ID card|Documents & files",
      Handover: "Dealer list with outstanding amounts, pending collection follow-ups, and two days with the replacement.",
      Sender: "Kavita Ratna, Director",
    },
  },
  "tool-55": {
    engine: "doc", credits: p("tool-55"), fileName: "promotion-letter", cta: "Write promotion letter",
    intro: "A promotion letter with the new role, the new pay and what changes in what the person is responsible for.",
    steps: ["Enter the new role and pay", "Say what changes", "Hand it over in person"],
    related: ["tool-53", "tool-51", "tool-102", "tool-96"],
    fields: [
      BUSINESS,
      { key: "Employee", label: "Employee name", required: true, half: true },
      { key: "Current role", label: "Current role", required: true, half: true },
      { key: "New role", label: "New role", required: true, half: true },
      { key: "Current CTC", label: "Current CTC (₹)", type: "money", half: true },
      { key: "New CTC", label: "New CTC (₹)", type: "money", required: true, half: true },
      { key: "Effective", label: "Effective from", type: "date", required: true, half: true, default: inDays(1) },
      { key: "Reports to", label: "Now reports to", half: true },
      { key: "Team", label: "People now reporting to them", type: "number", half: true },
      { key: "New responsibilities", label: "What they will now own", type: "textarea", rows: 3, required: true },
      SENDER,
    ],
    compute: (v) => {
      const a = num(s(v, "Current CTC"));
      const b = num(s(v, "New CTC"));
      return a && b ? { "Increase": `${inr(b - a)} per year (${(((b - a) / a) * 100).toFixed(1)}%)` } : {};
    },
    preview: (v) => {
      const a = num(s(v, "Current CTC"));
      const b = num(s(v, "New CTC"));
      return a && b ? <div className="rounded-xl bg-primary/5 p-3 text-sm">Increase: <strong>{inr(b - a)}</strong> a year ({(((b - a) / a) * 100).toFixed(1)}%)</div> : null;
    },
    refineChips: HR_CHIPS,
    sample: {
      Business: "Verma Tax Consultants", Employee: "Anjali Deshmukh", "Current role": "Accounts executive",
      "New role": "Senior accounts executive", "Current CTC": "444000", "New CTC": "516000",
      "Reports to": "Finance manager", Team: "2",
      "New responsibilities": "All GST and TDS filings for the Indore office, reviewing the two junior executives' work before submission, and first contact for client queries on notices.",
      Sender: "Suresh Verma, Partner",
    },
  },
  "tool-56": {
    engine: "doc", credits: p("tool-56"), fileName: "attendance-notice", cta: "Write notice",
    intro: "A formal notice about repeated absence or late coming, with the record, what must change and by when.",
    steps: ["Enter the attendance record", "Set what must change", "Give a copy and keep one signed"],
    related: ["tool-31", "tool-101", "tool-91", "tool-103"],
    fields: [
      BUSINESS,
      { key: "Employee", label: "Employee name", required: true, half: true },
      { key: "Designation", label: "Designation", half: true },
      { key: "Period", label: "Period reviewed", required: true, half: true, placeholder: "1 February – 31 March 2026" },
      { key: "Working days", label: "Working days in the period", type: "number", half: true },
      { key: "Absent", label: "Days absent without leave", type: "number", required: true, half: true },
      { key: "Late", label: "Days late", type: "number", half: true },
      { key: "Policy", label: "What the policy allows", half: true, placeholder: "2 casual leaves a month with prior approval" },
      { key: "Earlier", label: "Earlier warnings given", type: "select", options: ["None — this is the first", "Spoken to once", "Spoken to more than once", "One written warning already"], half: true },
      { key: "Effect", label: "What it has affected", type: "textarea", rows: 2, placeholder: "Counter left unmanned on two Saturdays; a colleague covered 14 extra hours." },
      { key: "Expected", label: "What must change", type: "textarea", rows: 2, required: true, placeholder: "No unapproved absence, and leave applied for at least a day ahead." },
      { key: "By when", label: "Reviewed again on", type: "date", half: true },
      SENDER,
    ],
    compute: (v) => {
      const days = num(s(v, "Working days"));
      const abs = num(s(v, "Absent"));
      return days && abs ? { "Absence rate": `${abs} of ${days} working days (${((abs / days) * 100).toFixed(1)}%)` } : {};
    },
    refineChips: LETTER_CHIPS,
    sample: {
      Business: "Sharma Sweets", Employee: "Imran Shaikh", Designation: "Counter salesman",
      Period: "1 February – 31 March 2026", "Working days": "50", Absent: "7", Late: "11",
      Policy: "2 casual leaves a month with prior approval", Earlier: "Spoken to more than once",
      Effect: "The counter was left unmanned on two Saturdays and a colleague covered about 14 extra hours.",
      Expected: "No unapproved absence, and leave applied for at least one day in advance except in an emergency.",
    },
  },
  "tool-57": {
    engine: "doc", credits: p("tool-57"), fileName: "training-schedule", cta: "Create training plan",
    intro: "An induction or training plan with modules, who runs each one, and how you will know it worked.",
    steps: ["List the modules", "Assign trainers and days", "Share it on day one"],
    related: ["tool-94", "tool-89", "tool-96", "tool-29"],
    fields: [
      BUSINESS, INDUSTRY,
      { key: "Trainee", label: "Who is being trained", required: true, half: true, placeholder: "Anjali Deshmukh (new joiner)" },
      { key: "Role", label: "Role they are training for", required: true, half: true },
      { key: "Start", label: "Starts on", type: "date", half: true, default: isoToday() },
      { key: "Length", label: "Over how long", type: "select", options: ["3 days", "1 week", "2 weeks", "1 month", "3 months"], half: true },
      { key: "Modules", label: "Modules", type: "rows", required: true,
        columns: [
          { key: "topic", label: "Topic", placeholder: "Billing software" },
          { key: "who", label: "Run by" },
          { key: "hours", label: "Hours", type: "number" },
        ],
        defaultRows: [{ topic: "", who: "", hours: "" }],
      },
      { key: "Assessment", label: "How you will check they learnt it", type: "textarea", rows: 2, placeholder: "Bill 10 orders unaided with no errors; answer a 15-question quiz on GST basics." },
    ],
    compute: (v) => {
      const rows = rowsOf(v, "Modules").filter((r) => num(r.hours));
      if (!rows.length) return {};
      return { "Total training hours": String(rows.reduce((a, r) => a + num(r.hours), 0)), "Module count": String(rows.length) };
    },
    refineChips: FORM_CHIPS,
    sample: {
      Business: "Verma Tax Consultants", Industry: "GST & accounting services",
      Trainee: "Anjali Deshmukh (new joiner)", Role: "Accounts executive", Length: "2 weeks",
      Modules: [
        { topic: "Who our clients are and how we work", who: "Suresh Verma", hours: "2" },
        { topic: "Tally and the billing software", who: "Rohit Patil", hours: "8" },
        { topic: "GST returns: GSTR-1 and 3B end to end", who: "Suresh Verma", hours: "10" },
        { topic: "TDS basics and quarterly returns", who: "Anita Jain", hours: "6" },
        { topic: "Handling client calls and notices", who: "Suresh Verma", hours: "3" },
      ],
      Assessment: "File two live GSTR-3B returns under supervision with no corrections, and answer a 15-question quiz on GST basics.",
    },
  },
  "tool-58": {
    engine: "doc", credits: p("tool-58"), fileName: "employment-contract", cta: "Create contract",
    intro: "A full-time employment contract covering pay, hours, leave, confidentiality and how either side can end it.",
    steps: ["Enter the role and pay", "Pick the clauses you need", "Get both copies signed"],
    related: ["tool-51", "tool-84", "tool-62", "tool-104"],
    fields: [
      BUSINESS,
      { key: "Business address", label: "Your address", profile: "address", half: true },
      { key: "Employee", label: "Employee name", required: true, half: true },
      { key: "Employee address", label: "Employee address", half: true },
      { key: "Role", label: "Role", required: true, half: true },
      { key: "CTC", label: "Annual CTC (₹)", type: "money", required: true, half: true },
      { key: "Start date", label: "Start date", type: "date", required: true, half: true, default: inDays(7) },
      { key: "Term", label: "Type", type: "select", options: ["Permanent", "Fixed term — 1 year", "Fixed term — 2 years", "Fixed term — 3 years"], half: true },
      { key: "Probation", label: "Probation", type: "select", options: ["No probation", "3 months", "6 months"], half: true },
      { key: "Notice", label: "Notice period", type: "select", options: ["15 days", "1 month", "2 months", "3 months"], half: true },
      { key: "Hours", label: "Working days & hours", half: true, placeholder: "Mon–Sat, 10 am to 7 pm" },
      { key: "Leave", label: "Paid leave a year", type: "number", half: true, placeholder: "18" },
      { key: "Benefits", label: "Benefits", type: "chips", options: ["EPF", "ESI", "Health insurance", "Gratuity", "Annual bonus", "Performance incentive", "Travel allowance"] },
      { key: "Clauses", label: "Clauses to include", type: "chips", options: ["Confidentiality", "Company owns work created", "No moonlighting", "Non-solicitation of clients", "Non-compete after exit", "Background check", "Transfer to another branch"] },
      { key: "Jurisdiction", label: "Courts of which city", profile: "city", half: true },
    ],
    refineChips: AGREEMENT_CHIPS,
    sample: {
      Business: "Verma Tax Consultants", "Business address": "201 Sapna Sangeeta Road, Indore 452001",
      Employee: "Anjali Deshmukh", "Employee address": "14/B Vijay Nagar, Indore 452010",
      Role: "Accounts executive", CTC: "444000", Term: "Permanent", Probation: "3 months",
      Notice: "1 month", Hours: "Mon–Sat, 10 am to 7 pm", Leave: "18",
      Benefits: "EPF|Paid leave|Annual bonus",
      Clauses: "Confidentiality|Company owns work created|Non-solicitation of clients",
      Jurisdiction: "Indore",
    },
  },
  "tool-59": {
    engine: "doc", credits: p("tool-59"), fileName: "contractor-agreement", cta: "Create agreement",
    intro: "A contractor or consultant agreement that keeps the person outside your payroll — scope, fee and ownership of the work.",
    steps: ["Describe the work and fee", "Set the deliverables", "Get it signed before work starts"],
    related: ["tool-75", "tool-83", "tool-85", "tool-62"],
    fields: [
      BUSINESS,
      { key: "Contractor", label: "Contractor / consultant", required: true, half: true, placeholder: "Nilesh Kulkarni" },
      { key: "Contractor address", label: "Their address", half: true },
      { key: "PAN / GSTIN", label: "Their PAN or GSTIN", half: true },
      { key: "Work", label: "What they will do", type: "textarea", rows: 3, required: true, placeholder: "Rebuild the billing software's reports module and hand over the source code." },
      { key: "Deliverables", label: "Deliverables & milestones", type: "rows",
        columns: [
          { key: "item", label: "Deliverable", placeholder: "Report designs approved" },
          { key: "by", label: "By when", type: "date" },
          { key: "price", label: "Fee for it (₹)", type: "money" },
        ],
        defaultRows: [{ item: "", by: "", price: "" }],
      },
      { key: "Fee", label: "Fee basis", type: "select", options: ["Fixed fee for the whole job", "Per hour", "Per day", "Monthly retainer", "Per deliverable"], half: true },
      { key: "Fee amount", label: "Fee (₹)", type: "money", required: true, half: true, ctxKey: "fee" },
      { key: "Start", label: "Start date", type: "date", half: true, default: isoToday() },
      { key: "End", label: "End date", type: "date", half: true },
      { key: "Payment", label: "When you will pay", type: "select", options: ["On completion", "On each milestone", "Monthly against invoice", "50% advance, 50% on completion"], half: true },
      { key: "TDS", label: "TDS you will deduct", half: true, placeholder: "10% under section 194J" },
      { key: "Clauses", label: "Clauses to include", type: "chips", options: ["Confidentiality", "Company owns the work created", "No employment relationship", "Contractor pays own taxes", "Non-solicitation", "Fix defects free for 30 days"] },
    ],
    compute: (v) => {
      const t = billTotals(rowsOf(v, "Deliverables"), { qty: "_none", price: "price" });
      return t.total ? { "Milestone fees add up to": inr(t.total) } : {};
    },
    refineChips: AGREEMENT_CHIPS,
    sample: {
      Business: "Verma Tax Consultants", Contractor: "Nilesh Kulkarni",
      "Contractor address": "7 Shivaji Nagar, Pune 411005", "PAN / GSTIN": "ABCPK1234D",
      Work: "Rebuild the reports module of our billing software, migrate old data, and hand over the source code with a short written guide.",
      Deliverables: [
        { item: "Report designs approved", by: "", price: "25000" },
        { item: "Module live with old data migrated", by: "", price: "60000" },
        { item: "Source code and guide handed over", by: "", price: "15000" },
      ],
      Fee: "Per deliverable", "Fee amount": "100000", Payment: "On each milestone",
      TDS: "10% under section 194J",
      Clauses: "Confidentiality|Company owns the work created|No employment relationship|Contractor pays own taxes",
    },
  },

  // Phase 1: Legal & Compliance (tool-60–tool-74). Every one carries the "draft for
  // reference, not legal advice" line from the server spec.
  "tool-60": {
    engine: "doc", credits: p("tool-60"), fileName: "rent-agreement", cta: "Create rent agreement",
    intro: "A rent agreement for a shop, office or flat — rent, deposit, who repairs what, and how either side can end it.",
    steps: ["Enter the property and rent", "Set deposit and duration", "Print on stamp paper and register"],
    related: ["tool-61", "tool-68", "tool-72", "tool-64"],
    fields: [
      { key: "Owner", label: "Owner's name", required: true, half: true, placeholder: "Suresh Verma" },
      { key: "Owner address", label: "Owner's address", half: true },
      { key: "Tenant", label: "Tenant's name", required: true, half: true, placeholder: "Sharma Sweets (Prop. Anil Sharma)" },
      { key: "Tenant address", label: "Tenant's current address", half: true },
      { key: "Property", label: "Property being rented", type: "textarea", rows: 2, required: true, placeholder: "Shop 14, ground floor, Sapna Sangeeta Road, Indore 452001, about 420 sq ft with one toilet." },
      { key: "Use", label: "What it will be used for", type: "select", required: true, options: ["Shop / retail", "Office", "Residence", "Godown / storage", "Workshop", "Restaurant / kitchen", "Clinic"], half: true },
      { key: "Rent", label: "Monthly rent (₹)", type: "money", required: true, half: true },
      { key: "Deposit", label: "Security deposit (₹)", type: "money", required: true, half: true },
      { key: "Rent due", label: "Rent due by", type: "select", options: ["1st of the month", "5th of the month", "7th of the month", "10th of the month"], half: true },
      { key: "Months", label: "Duration (months)", type: "number", required: true, half: true, default: "11" },
      { key: "Start", label: "Starts on", type: "date", half: true, default: isoToday() },
      { key: "Increase", label: "Rent increase on renewal (%)", type: "number", half: true, placeholder: "5" },
      { key: "Lock-in", label: "Lock-in period (months)", type: "number", half: true },
      { key: "Notice", label: "Notice to vacate", type: "select", options: ["1 month", "2 months", "3 months"], half: true },
      { key: "Bills", label: "Tenant pays for", type: "chips", options: ["Electricity", "Water", "Property tax", "Society maintenance", "Internet", "Minor repairs", "Painting on exit"] },
      { key: "Owner repairs", label: "Owner repairs", type: "chips", options: ["Structure & walls", "Roof leakage", "Plumbing lines", "Electrical wiring", "Lift & common areas"] },
      { key: "Rules", label: "Anything else agreed", type: "textarea", rows: 2, placeholder: "No subletting. No structural changes without written permission." },
    ],
    compute: (v) => {
      const rent = num(s(v, "Rent"));
      const dep = num(s(v, "Deposit"));
      const months = num(s(v, "Months"));
      const out: Record<string, string> = {};
      if (rent && months) out["Total rent over the term"] = inr(rent * months);
      if (rent && dep) out["Deposit equals"] = `${(dep / rent).toFixed(1)} months' rent`;
      return out;
    },
    preview: (v) => {
      const rent = num(s(v, "Rent"));
      const dep = num(s(v, "Deposit"));
      const months = num(s(v, "Months"));
      if (!rent) return null;
      return (
        <div className="rounded-xl bg-primary/5 p-3 text-sm">
          {months ? <>Rent over {months} months: <strong>{inr(rent * months)}</strong></> : null}
          {dep ? <span className="ml-2">Deposit is {(dep / rent).toFixed(1)} months' rent.</span> : null}
        </div>
      );
    },
    refineChips: AGREEMENT_CHIPS,
    sample: {
      Owner: "Suresh Verma", "Owner address": "201 Sapna Sangeeta Road, Indore 452001",
      Tenant: "Sharma Sweets (Prop. Anil Sharma)", "Tenant address": "9 Palasia, Indore 452001",
      Property: "Shop 14, ground floor, Sapna Sangeeta Road, Indore 452001, about 420 sq ft with one toilet and a shutter facing the main road.",
      Use: "Shop / retail", Rent: "38000", Deposit: "228000", "Rent due": "5th of the month",
      Months: "11", Increase: "5", "Lock-in": "6", Notice: "2 months",
      Bills: "Electricity|Water|Minor repairs",
      "Owner repairs": "Structure & walls|Roof leakage|Plumbing lines",
      Rules: "No subletting. No structural changes without written permission. Shutter signage allowed within municipal rules.",
    },
  },
  "tool-61": {
    engine: "doc", credits: p("tool-61"), fileName: "eviction-notice", cta: "Write eviction notice",
    intro: "A notice to a tenant to vacate, stating the breach, the notice period and what happens if they stay on.",
    steps: ["State the breach", "Give the notice period in your agreement", "Serve it and keep proof"],
    related: ["tool-60", "tool-64", "tool-47", "tool-71"],
    fields: [
      { key: "Owner", label: "Owner's name", profile: "ownerName", required: true, half: true },
      { key: "Owner address", label: "Owner's address", profile: "address", half: true },
      { key: "Tenant", label: "Tenant's name", required: true, half: true },
      { key: "Property", label: "Property", type: "textarea", rows: 2, required: true, placeholder: "Shop 14, ground floor, Sapna Sangeeta Road, Indore 452001" },
      { key: "Agreement date", label: "Rent agreement dated", type: "date", half: true },
      { key: "Rent", label: "Monthly rent (₹)", type: "money", half: true },
      { key: "Reason", label: "Why you are asking them to leave", type: "select", required: true, options: ["Rent unpaid", "Agreement has expired", "Subletting without permission", "Property damaged", "Used for something not agreed", "Illegal activity", "Owner needs it back", "Repeated nuisance"], half: true },
      { key: "Months unpaid", label: "Months of rent unpaid", type: "number", half: true },
      { key: "Amount due", label: "Amount due (₹)", type: "money", half: true },
      { key: "Breach details", label: "What happened, with dates", type: "textarea", rows: 3, required: true, placeholder: "Rent for January, February and March 2026 is unpaid despite reminders on 8 Feb and 3 Mar." },
      { key: "Notice period", label: "Notice given", type: "select", required: true, options: ["15 days", "30 days", "60 days", "90 days"], default: "30 days", half: true },
      { key: "Vacate by", label: "Vacate by", type: "date", half: true, default: inDays(30) },
      { key: "State", label: "State (rent law differs)", profile: "state", half: true, placeholder: "Madhya Pradesh", help: "Use the notice period in your rent agreement. Rent law differs by state, so check it before serving." },
    ],
    refineChips: LETTER_CHIPS,
    sample: {
      Owner: "Suresh Verma", "Owner address": "201 Sapna Sangeeta Road, Indore 452001",
      Tenant: "Mahesh Yadav", Property: "Shop 7, first floor, Sapna Sangeeta Road, Indore 452001",
      Rent: "26000", Reason: "Rent unpaid", "Months unpaid": "3", "Amount due": "78000",
      "Breach details": "Rent for January, February and March 2026 is unpaid. Written reminders were given on 8 February and 3 March 2026 and the amount is still outstanding.",
      "Notice period": "30 days", State: "Madhya Pradesh",
    },
  },
  "tool-62": {
    engine: "doc", credits: p("tool-62"), fileName: "nda", cta: "Create NDA",
    intro: "A one-way NDA so you can show your numbers, customer list or designs to someone without them passing it on. If both sides will share, use Joint Project NDA.",
    steps: ["Name both sides", "Say what is confidential", "Get it signed before you share anything"],
    related: ["tool-73", "tool-59", "tool-85", "tool-75"],
    fields: [
      { key: "Disclosing party", label: "Who is sharing the information", profile: "businessName", required: true, half: true },
      { key: "Disclosing address", label: "Their address", profile: "address", half: true },
      { key: "Receiving party", label: "Who is receiving it", required: true, half: true, placeholder: "Nilesh Kulkarni / Kulkarni Softworks" },
      { key: "Receiving address", label: "Their address", half: true },
      { key: "Purpose", label: "Why you are sharing it", required: true, half: true, placeholder: "Evaluating a software build" },
      { key: "What is confidential", label: "What must stay confidential", type: "chips", options: ["Customer and supplier lists", "Prices and margins", "Financial statements", "Recipes & formulations", "Designs and drawings", "Source code", "Business plans", "Employee details", "Anything marked confidential"] },
      { key: "Years", label: "Stays confidential for (years)", type: "number", required: true, half: true, default: "3" },
      { key: "Can share with", label: "They may show it to", half: true, placeholder: "Their own employees working on this, on the same terms" },
      { key: "On ending", label: "When it ends", type: "select", options: ["Return everything", "Destroy everything and confirm in writing", "Return or destroy, their choice"], half: true },
      { key: "Jurisdiction", label: "Courts of which city", profile: "city", half: true },
    ],
    refineChips: AGREEMENT_CHIPS,
    sample: {
      "Disclosing party": "Verma Tax Consultants", "Disclosing address": "201 Sapna Sangeeta Road, Indore 452001",
      "Receiving party": "Kulkarni Softworks", "Receiving address": "7 Shivaji Nagar, Pune 411005", Purpose: "Evaluating and building a billing software module",
      "What is confidential": "Customer and supplier lists|Prices and margins|Source code|Anything marked confidential",
      Years: "3", "Can share with": "Their own employees working on this project, on the same terms",
      "On ending": "Destroy everything and confirm in writing", Jurisdiction: "Indore",
    },
  },
  "tool-63": {
    engine: "doc", credits: p("tool-63"), fileName: "affidavit", cta: "Create affidavit",
    intro: "A sworn affidavit setting out facts in numbered paragraphs, ready to print on stamp paper and swear before a notary.",
    steps: ["State the facts in order", "Say what it is for", "Swear it before a notary"],
    related: ["tool-90", "tool-72", "tool-74", "tool-64"],
    fields: [
      { key: "Deponent", label: "Your full name", profile: "ownerName", required: true, half: true },
      { key: "Parent name", label: "Son / daughter / wife of", half: true, placeholder: "S/o Ramesh Sharma" },
      { key: "Age", label: "Age", type: "number", half: true },
      { key: "Occupation", label: "Occupation", half: true, placeholder: "Businessman" },
      { key: "Address", label: "Full address", profile: "address", required: true },
      { key: "Purpose", label: "What the affidavit is for", type: "select", required: true, options: ["Proof of address", "Name change", "Date of birth", "Income declaration", "Loss of document", "No-objection", "Marital status", "Legal heir", "Gap in education / employment", "Court proceedings", "Other"], half: true },
      { key: "For whom", label: "Being submitted to", half: true, placeholder: "Regional Transport Office, Indore" },
      { key: "Facts", label: "The facts, one per line", type: "textarea", rows: 5, required: true, placeholder: "I am the sole proprietor of Sharma Sweets.\nMy original GST registration certificate was misplaced while shifting premises on 12 March 2026.\nI have searched for it and been unable to find it.\nNo duplicate has been obtained so far." },
      { key: "Place", label: "Place of swearing", profile: "city", half: true },
    ],
    refineChips: ["Add a verification clause", "Simpler language", "Number the paragraphs", "Translate to Hindi"],
    sample: {
      Deponent: "Anil Sharma", "Parent name": "S/o Ramesh Sharma", Age: "47", Occupation: "Businessman",
      Address: "9 Palasia, Indore, Madhya Pradesh 452001",
      Purpose: "Loss of document", "For whom": "Office of the Commissioner, State GST, Indore",
      Facts: "I am the sole proprietor of Sharma Sweets, holding GSTIN 23AABCS1429P1ZK.\nThe original GST registration certificate was misplaced while shifting premises on 12 March 2026.\nI have made a thorough search and have been unable to trace it.\nNo duplicate certificate has been applied for or obtained till date.\nI require a duplicate certificate for display at my place of business.",
      Place: "Indore",
    },
  },
  "tool-64": {
    engine: "doc", credits: p("tool-64"), fileName: "legal-notice", cta: "Write legal notice",
    intro: "A legal notice that sets out the facts, the breach and your demand with a deadline — the step before a court case.",
    steps: ["Set out the facts with dates", "State your demand and deadline", "Send it by registered post"],
    related: ["tool-47", "tool-5", "tool-9", "tool-86"],
    fields: [
      BUSINESS, SENDER,
      { key: "Sender address", label: "Your address", profile: "address", half: true },
      { key: "To", label: "Notice to (name)", required: true, half: true },
      { key: "To address", label: "Their address", required: true, half: true },
      { key: "Subject", label: "Subject", required: true, placeholder: "Notice for recovery of ₹84,000 with interest" },
      { key: "Relationship", label: "How you are connected", type: "select", options: ["Customer", "Supplier", "Tenant", "Landlord", "Employee", "Former employee", "Business partner", "Contractor", "No prior relationship"], half: true },
      { key: "Agreement", label: "Agreement / invoice it arises from", half: true, placeholder: "Purchase order PO-2026-087 dated 14 Jan 2026" },
      { key: "Facts", label: "What happened, in date order", type: "textarea", rows: 5, required: true, placeholder: "14 Jan 2026 — PO placed and 50% advance of ₹84,000 paid.\n04 Feb 2026 — Delivery promised in writing within 3 weeks.\n…" },
      { key: "Breach", label: "What they did wrong", type: "textarea", rows: 2, required: true },
      { key: "Loss", label: "Loss you have suffered (₹)", type: "money", half: true },
      { key: "Demand", label: "What you want them to do", type: "textarea", rows: 2, required: true, placeholder: "Refund ₹84,000 with interest at 12% per annum from 14 January 2026." },
      { key: "Deadline days", label: "Days to comply", type: "number", required: true, default: "15", half: true },
      { key: "If ignored", label: "What you will do if ignored", type: "select", options: ["Civil suit for recovery", "Criminal complaint", "Consumer forum", "Arbitration as per the agreement", "MSME Samadhaan", "Winding-up / insolvency petition"], half: true },
    ],
    refineChips: LETTER_CHIPS,
    sample: {
      Business: "Sharma Sweets", Sender: "Anil Sharma, Proprietor",
      "Sender address": "9 Palasia, Indore 452001", To: "Agarwal Packaging",
      "To address": "22 Industrial Estate, Dewas Naka, Indore 452015",
      Subject: "Notice for recovery of ₹84,000 with interest",
      Relationship: "Supplier", Agreement: "Purchase order PO-2026-087 dated 14 January 2026",
      Facts: "14 January 2026 — Purchase order PO-2026-087 placed for 5,000 printed gift cartons and 50% advance of ₹84,000 paid by NEFT, UTR 2026031512345678.\n04 February 2026 — Delivery confirmed in writing within three weeks.\n26 February 2026 — Nothing delivered; reminder sent on WhatsApp and acknowledged.\n15 March 2026 — Further reminder by email; no reply received since.",
      Breach: "Failure to deliver the ordered goods or refund the advance, despite repeated reminders and an express written commitment on delivery time.",
      Loss: "84000",
      Demand: "Refund ₹84,000 with interest at 12% per annum from 14 January 2026, or deliver the full ordered quantity within the notice period.",
      "Deadline days": "15", "If ignored": "Civil suit for recovery",
    },
  },
  "tool-65": {
    engine: "doc", credits: p("tool-65"), fileName: "partnership-deed", cta: "Create partnership deed",
    intro: "A partnership deed with capital, profit shares, who decides what, and what happens if a partner leaves.",
    steps: ["Add partners and capital", "Set profit shares and roles", "Register it with the Registrar of Firms"],
    related: ["tool-66", "tool-67", "tool-86", "tool-62"],
    fields: [
      { key: "Firm name", label: "Firm name", profile: "businessName", required: true, half: true },
      { key: "Business", label: "What the firm will do", required: true, half: true, placeholder: "Trading in steel and hardware" },
      { key: "Firm address", label: "Principal place of business", profile: "address", half: true },
      { key: "Start", label: "Partnership starts on", type: "date", half: true, default: isoToday() },
      { key: "Partners", label: "Partners", type: "rows", required: true,
        columns: [
          { key: "name", label: "Name" },
          { key: "price", label: "Capital brought (₹)", type: "money" },
          { key: "share", label: "Profit share %", type: "number" },
          { key: "role", label: "Role" },
        ],
        defaultRows: [{ name: "", price: "", share: "", role: "" }, { name: "", price: "", share: "", role: "" }],
      },
      { key: "Loss sharing", label: "Losses shared", type: "select", options: ["In the same ratio as profits", "Equally", "Only by working partners"], half: true },
      { key: "Interest on capital", label: "Interest on capital (% per year)", type: "number", half: true, placeholder: "12" },
      { key: "Remuneration", label: "Salary to working partners", half: true, placeholder: "₹40,000 a month each to Kavita and Mahesh" },
      { key: "Drawings", label: "How much partners may draw", half: true, placeholder: "Up to ₹50,000 a month against profit share" },
      { key: "Bank", label: "Who signs on the bank account", type: "select", options: ["Any one partner", "Any two partners jointly", "All partners jointly", "Only the managing partner"], half: true },
      { key: "Year end", label: "Accounting year ends", type: "select", options: ["31 March", "31 December"], half: true },
      { key: "Big decisions", label: "Decisions needing everyone's consent", type: "chips", options: ["Taking a loan", "Selling firm property", "Admitting a new partner", "Starting a new line of business", "Giving a guarantee", "Spending above a set limit"] },
      { key: "On exit", label: "If a partner leaves or dies", type: "textarea", rows: 2, placeholder: "Accounts settled within 90 days at book value plus their share of profit to that date. Heirs may be paid out rather than admitted." },
      { key: "Disputes", label: "How disputes are settled", type: "select", options: ["Arbitration by a mutually appointed arbitrator", "Mediation first, then arbitration", "Courts only"], half: true },
    ],
    compute: (v) => {
      const rows = rowsOf(v, "Partners").filter((r) => r.name?.trim());
      if (!rows.length) return {};
      const cap = rows.reduce((a, r) => a + num(r.price), 0);
      const share = rows.reduce((a, r) => a + num(r.share), 0);
      return { "Total capital": inr(cap), "Profit shares add up to": `${share}%`, "Number of partners": String(rows.length) };
    },
    preview: (v) => {
      const rows = rowsOf(v, "Partners").filter((r) => r.name?.trim());
      if (!rows.length) return null;
      const cap = rows.reduce((a, r) => a + num(r.price), 0);
      const share = rows.reduce((a, r) => a + num(r.share), 0);
      return (
        <div className="rounded-xl bg-primary/5 p-3 text-sm">
          {rows.length} partners · capital <strong>{inr(cap)}</strong> · shares {share}%
          {share !== 100 && <span className="ml-2 text-xs text-amber-600">Profit shares should add up to 100%.</span>}
        </div>
      );
    },
    refineChips: AGREEMENT_CHIPS,
    sample: {
      "Firm name": "Ratna Steel Traders", Business: "Trading in steel long products and hardware",
      "Firm address": "Plot 7, Bhosari MIDC, Pune 411026",
      Partners: [
        { name: "Kavita Ratna", price: "1500000", share: "50", role: "Managing partner — purchase and finance" },
        { name: "Mahesh Ratna", price: "900000", share: "30", role: "Working partner — sales and dispatch" },
        { name: "Sunita Rao", price: "600000", share: "20", role: "Sleeping partner" },
      ],
      "Loss sharing": "In the same ratio as profits", "Interest on capital": "12",
      Remuneration: "₹40,000 a month each to Kavita and Mahesh", Drawings: "Up to ₹50,000 a month against profit share",
      Bank: "Any two partners jointly", "Year end": "31 March",
      "Big decisions": "Taking a loan|Selling firm property|Admitting a new partner|Giving a guarantee",
      "On exit": "Accounts settled within 90 days at book value plus the partner's share of profit to that date. Legal heirs may be paid out rather than admitted as partners.",
      Disputes: "Arbitration by a mutually appointed arbitrator",
    },
  },
  "tool-66": {
    engine: "doc", credits: p("tool-66"), fileName: "llp-agreement", cta: "Create LLP agreement",
    intro: "An LLP agreement covering contributions, profit sharing, designated partners and how decisions get made.",
    // MCA: "LLP Agreement is required to be filed with the registrar in eForm 3 within 30 days of incorporation of LLP."
    // Source: https://www.mca.gov.in/MinistryV2/llpefiling.html (checked 12 Oct 2026)
    steps: ["Add partners and contributions", "Set roles and decision rules", "File it with the MCA within 30 days"],
    related: ["tool-65", "tool-67", "tool-62", "tool-86"],
    fields: [
      { key: "LLP name", label: "LLP name", profile: "businessName", required: true, half: true },
      { key: "LLPIN", label: "LLPIN (if allotted)", half: true },
      { key: "Business", label: "What the LLP will do", required: true, half: true },
      { key: "Address", label: "Registered office", profile: "address", half: true },
      { key: "Partners", label: "Partners", type: "rows", required: true,
        columns: [
          { key: "name", label: "Name" },
          { key: "price", label: "Contribution (₹)", type: "money" },
          { key: "share", label: "Profit share %", type: "number" },
          { key: "designated", label: "Designated partner?", type: "select", options: ["Yes", "No"] },
        ],
        defaultRows: [{ name: "", price: "", share: "", designated: "Yes" }, { name: "", price: "", share: "", designated: "Yes" }],
      },
      { key: "Contribution form", label: "Contribution brought as", type: "select", options: ["Cash", "Cash and equipment", "Cash and services", "Property"], half: true },
      { key: "Management", label: "Who runs the day-to-day work", half: true, placeholder: "Both designated partners jointly" },
      { key: "Decisions", label: "Ordinary decisions need", type: "select", options: ["A simple majority of partners", "Majority by profit share", "All partners to agree"], half: true },
      { key: "Big decisions", label: "Decisions needing everyone's consent", type: "chips", options: ["Borrowing money", "Admitting a partner", "Changing the business", "Selling LLP assets", "Amending this agreement"] },
      { key: "Meetings", label: "How often partners meet", type: "select", options: ["Monthly", "Quarterly", "Half-yearly", "Yearly"], half: true },
      { key: "Exit", label: "A partner may leave by giving", type: "select", options: ["30 days' notice", "60 days' notice", "90 days' notice"], half: true },
      { key: "Exit payment", label: "How a leaving partner is paid", type: "textarea", rows: 2, placeholder: "Contribution plus their share of accumulated profit, as per the last audited accounts, within 90 days." },
      { key: "Disputes", label: "How disputes are settled", type: "select", options: ["Arbitration under the Arbitration and Conciliation Act, 1996", "Mediation first, then arbitration", "Courts only"], half: true },
    ],
    compute: (v) => {
      const rows = rowsOf(v, "Partners").filter((r) => r.name?.trim());
      if (!rows.length) return {};
      const cap = rows.reduce((a, r) => a + num(r.price), 0);
      const share = rows.reduce((a, r) => a + num(r.share), 0);
      const dp = rows.filter((r) => r.designated === "Yes").length;
      return { "Total contribution": inr(cap), "Profit shares add up to": `${share}%`, "Designated partners": String(dp) };
    },
    preview: (v) => {
      const rows = rowsOf(v, "Partners").filter((r) => r.name?.trim());
      if (!rows.length) return null;
      const dp = rows.filter((r) => r.designated === "Yes").length;
      const share = rows.reduce((a, r) => a + num(r.share), 0);
      return (
        <div className="rounded-xl bg-primary/5 p-3 text-sm">
          {rows.length} partners · {dp} designated · shares {share}%
          {dp < 2 && <span className="ml-2 text-xs text-amber-600">An LLP needs at least two designated partners.</span>}
        </div>
      );
    },
    refineChips: AGREEMENT_CHIPS,
    sample: {
      "LLP name": "Verma & Associates LLP", Business: "GST, accounting and audit support services",
      Address: "201 Sapna Sangeeta Road, Indore 452001",
      Partners: [
        { name: "Suresh Verma", price: "800000", share: "60", designated: "Yes" },
        { name: "Anita Jain", price: "500000", share: "40", designated: "Yes" },
      ],
      "Contribution form": "Cash and equipment", Management: "Both designated partners jointly",
      Decisions: "Majority by profit share",
      "Big decisions": "Borrowing money|Admitting a partner|Changing the business|Amending this agreement",
      Meetings: "Quarterly", Exit: "90 days' notice",
      "Exit payment": "Contribution plus the partner's share of accumulated profit as per the last audited accounts, paid within 90 days of the effective date of retirement.",
      Disputes: "Arbitration under the Arbitration and Conciliation Act, 1996",
    },
  },
  "tool-67": {
    engine: "doc", credits: p("tool-67"), fileName: "company-bylaws", cta: "Create articles",
    intro: "Articles of association for a private company — share structure, directors, board meetings and voting.",
    steps: ["Enter capital and directors", "Set meeting and voting rules", "File with the Registrar of Companies"],
    related: ["tool-65", "tool-66", "tool-104", "tool-72"],
    fields: [
      { key: "Company", label: "Company name", profile: "businessName", required: true, half: true },
      { key: "Type", label: "Type of company", type: "select", required: true, options: ["Private limited", "One Person Company", "Public limited", "Section 8 (not for profit)"], half: true },
      { key: "CIN", label: "CIN (if allotted)", half: true },
      { key: "Office", label: "Registered office", profile: "address", half: true },
      { key: "Objects", label: "Main objects", type: "textarea", rows: 2, required: true, placeholder: "To manufacture and trade in confectionery and sweets, and to operate retail outlets." },
      { key: "Authorised capital", label: "Authorised share capital (₹)", type: "money", required: true, half: true },
      { key: "Paid-up capital", label: "Paid-up capital (₹)", type: "money", half: true },
      { key: "Face value", label: "Face value per share (₹)", type: "number", half: true, default: "10" },
      { key: "Share classes", label: "Classes of shares", type: "chips", options: ["Equity with voting rights", "Equity with differential rights", "Preference shares"] },
      { key: "Directors", label: "Directors", type: "rows",
        columns: [
          { key: "name", label: "Name" },
          { key: "role", label: "Designation", type: "select", options: ["Director", "Managing Director", "Whole-time Director", "Independent Director", "Nominee Director"] },
          { key: "din", label: "DIN" },
        ],
        defaultRows: [{ name: "", role: "Director", din: "" }, { name: "", role: "Director", din: "" }],
      },
      { key: "Min directors", label: "Minimum directors", type: "number", half: true, default: "2" },
      { key: "Board meetings", label: "Board meets at least", type: "select", options: ["Once a quarter", "Four times a year with no gap over 120 days", "Twice a year (small company)"], half: true },
      { key: "Quorum", label: "Board quorum", type: "select", options: ["One third of directors or two, whichever is higher", "Two directors", "Majority of directors"], half: true },
      { key: "Transfer", label: "Share transfer rule", type: "select", options: ["Board approval required", "Right of first refusal to existing members", "Freely transferable", "Board approval and right of first refusal"], half: true },
      { key: "Dividend", label: "Dividend policy", half: true, placeholder: "Declared from profits as recommended by the board and approved by members" },
      { key: "Borrowing cap", label: "Board may borrow up to", half: true, placeholder: "Paid-up capital plus free reserves; beyond that, members' approval" },
    ],
    compute: (v) => {
      const auth = num(s(v, "Authorised capital"));
      const fv = num(s(v, "Face value"));
      const paid = num(s(v, "Paid-up capital"));
      const out: Record<string, string> = {};
      if (auth && fv) out["Authorised shares"] = `${Math.floor(auth / fv).toLocaleString("en-IN")} shares of ₹${fv} each`;
      if (paid && fv) out["Paid-up shares"] = `${Math.floor(paid / fv).toLocaleString("en-IN")} shares of ₹${fv} each`;
      return out;
    },
    refineChips: AGREEMENT_CHIPS,
    sample: {
      Company: "Sharma Foods Private Limited", Type: "Private limited",
      Office: "9 Palasia, Indore, Madhya Pradesh 452001",
      Objects: "To manufacture, pack and trade in confectionery, sweets and namkeen, and to operate retail outlets and franchise arrangements.",
      "Authorised capital": "2500000", "Paid-up capital": "1000000", "Face value": "10",
      "Share classes": "Equity with voting rights",
      Directors: [
        { name: "Anil Sharma", role: "Managing Director", din: "01234567" },
        { name: "Rekha Sharma", role: "Director", din: "01234568" },
      ],
      "Min directors": "2", "Board meetings": "Four times a year with no gap over 120 days",
      Quorum: "One third of directors or two, whichever is higher",
      Transfer: "Board approval and right of first refusal",
      Dividend: "Declared from profits as recommended by the board and approved by members in general meeting",
      "Borrowing cap": "Paid-up capital plus free reserves; beyond that, members' approval by special resolution",
    },
  },
  "tool-68": {
    engine: "doc", credits: p("tool-68"), fileName: "property-deed", cta: "Create sale deed draft",
    intro: "A sale deed draft for transferring property — parties, the schedule of the property, price and possession.",
    steps: ["Enter buyer, seller and property", "Add price and payment", "Have a lawyer vet it, then register it"],
    related: ["tool-60", "tool-87", "tool-72", "tool-63"],
    fields: [
      { key: "Seller", label: "Seller's name", required: true, half: true },
      { key: "Seller address", label: "Seller's address", half: true },
      { key: "Buyer", label: "Buyer's name", required: true, half: true },
      { key: "Buyer address", label: "Buyer's address", half: true },
      { key: "Property type", label: "Type of property", type: "select", required: true, options: ["Residential flat", "Independent house", "Plot of land", "Agricultural land", "Shop / commercial unit", "Office space", "Industrial shed"], half: true },
      { key: "Schedule", label: "Property details (the schedule)", type: "textarea", rows: 3, required: true, placeholder: "Flat 304, third floor, Shree Residency, Survey 118/2, Vijay Nagar, Indore — 1,150 sq ft built-up, with one covered parking. Bounded on the north by…" },
      { key: "Area", label: "Area", half: true, placeholder: "1,150 sq ft built-up" },
      { key: "Survey", label: "Survey / plot / khasra number", half: true },
      { key: "Price", label: "Sale consideration (₹)", type: "money", required: true, half: true },
      { key: "Paid", label: "Amount already paid (₹)", type: "money", half: true },
      { key: "Payment mode", label: "How the money is paid", type: "textarea", rows: 2, placeholder: "₹5,00,000 by cheque 004512 dated 2 March 2026; balance ₹40,00,000 by RTGS on registration." },
      { key: "Possession", label: "Possession handed over on", type: "date", half: true },
      { key: "Encumbrance", label: "Loans or charges on the property", type: "select", options: ["None — free of all encumbrances", "Housing loan being closed from the sale proceeds", "Mortgage to be cleared before registration"], half: true },
      { key: "Who pays", label: "Registration cost borne by", type: "select", options: ["Buyer", "Seller", "Shared equally"], half: true },
      { key: "Witnesses", label: "Witness names", half: true },
    ],
    refineChips: ["Add a boundaries schedule", "Add seller warranties", "Simpler language", "Add a witness block"],
    sample: {
      Seller: "Suresh Verma", "Seller address": "201 Sapna Sangeeta Road, Indore 452001",
      Buyer: "Anil Sharma", "Buyer address": "9 Palasia, Indore 452001",
      "Property type": "Residential flat",
      Schedule: "Flat 304, third floor, Shree Residency, Survey No. 118/2, Vijay Nagar, Indore 452010, admeasuring 1,150 sq ft built-up with one covered car parking, bounded on the north by Flat 303, south by the open terrace, east by the internal passage and west by the compound wall.",
      Area: "1,150 sq ft built-up", Survey: "118/2", Price: "4500000", Paid: "500000",
      "Payment mode": "₹5,00,000 paid by cheque no. 004512 dated 2 March 2026 drawn on HDFC Bank; the balance ₹40,00,000 payable by RTGS at the time of registration.",
      Encumbrance: "None — free of all encumbrances", "Who pays": "Buyer",
      Witnesses: "Mahesh Yadav and Anita Jain",
    },
  },
  "tool-69": {
    engine: "doc", credits: p("tool-69"), fileName: "loan-agreement", cta: "Create loan agreement",
    intro: "A loan agreement between two private parties — amount, interest, repayment schedule and what happens on default.",
    steps: ["Enter amount and interest", "Set the repayment plan", "Sign it with witnesses"],
    related: ["tool-70", "tool-74", "tool-63", "tool-86"],
    fields: [
      { key: "Lender", label: "Lender's name", required: true, half: true },
      { key: "Lender address", label: "Lender's address", half: true },
      { key: "Borrower", label: "Borrower's name", required: true, half: true },
      { key: "Borrower address", label: "Borrower's address", half: true },
      { key: "Amount", label: "Loan amount (₹)", type: "money", required: true, half: true },
      { key: "Purpose", label: "What the loan is for", half: true, placeholder: "Working capital for the sweet shop" },
      { key: "Disbursed on", label: "Money given on", type: "date", half: true, default: isoToday() },
      { key: "Mode", label: "Paid by", type: "select", options: ["Bank transfer / NEFT", "RTGS", "Cheque", "UPI"], half: true },
      { key: "Rate", label: "Interest rate (% per year)", type: "number", required: true, half: true, default: "12" },
      { key: "Months", label: "Repayment over (months)", type: "number", required: true, half: true, default: "24" },
      { key: "Repayment", label: "How it will be repaid", type: "select", options: ["Equal monthly instalments", "Interest monthly, principal at the end", "Quarterly instalments", "Single payment at the end (bullet)"], half: true },
      { key: "First due", label: "First instalment due", type: "date", half: true },
      { key: "Security", label: "Security offered", type: "select", options: ["Unsecured", "Post-dated cheques", "Property mortgage", "Gold", "Vehicle hypothecation", "Personal guarantee"], half: true },
      { key: "Security details", label: "Security details", half: true, placeholder: "24 post-dated cheques of ₹23,537 each" },
      { key: "Default", label: "On default", type: "textarea", rows: 2, placeholder: "Penal interest of 18% a year on overdue amounts; the whole balance becomes payable at once if two instalments are missed." },
      { key: "Prepayment", label: "Early repayment", type: "select", options: ["Allowed with no charge", "Allowed with 2% charge", "Allowed after 6 months", "Not allowed"], half: true },
    ],
    compute: (v) => {
      const amt = num(s(v, "Amount"));
      const rate = num(s(v, "Rate"));
      const n = num(s(v, "Months"));
      if (!amt || !n) return {};
      const r = rate / 1200;
      const emi = r > 0 ? (amt * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : amt / n;
      return {
        "Equal monthly instalment": inr(emi),
        "Total repayable": inr(emi * n),
        "Total interest": inr(emi * n - amt),
      };
    },
    preview: (v) => {
      const amt = num(s(v, "Amount"));
      const rate = num(s(v, "Rate"));
      const n = num(s(v, "Months"));
      if (!amt || !n) return null;
      const r = rate / 1200;
      const emi = r > 0 ? (amt * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : amt / n;
      return (
        <div className="rounded-xl bg-primary/5 p-3 text-sm">
          Equal monthly instalment: <strong>{inr(emi)}</strong> × {n} = {inr(emi * n)}
          <span className="ml-2 text-xs text-muted-foreground">Interest {inr(emi * n - amt)}</span>
        </div>
      );
    },
    refineChips: AGREEMENT_CHIPS,
    sample: {
      Lender: "Sunita Rao", "Lender address": "4 Koregaon Park, Pune 411001",
      Borrower: "Sharma Sweets (Prop. Anil Sharma)", "Borrower address": "9 Palasia, Indore 452001",
      Amount: "500000", Purpose: "Working capital for the festival season", Mode: "Bank transfer / NEFT",
      Rate: "12", Months: "24", Repayment: "Equal monthly instalments",
      Security: "Post-dated cheques", "Security details": "24 post-dated cheques drawn on HDFC Bank, Indore",
      Default: "Penal interest of 18% a year on overdue amounts. If two consecutive instalments are missed, the entire outstanding balance becomes payable at once.",
      Prepayment: "Allowed with no charge",
    },
  },
  "tool-70": {
    engine: "doc", credits: p("tool-70"), fileName: "guarantor-letter", cta: "Write guarantee letter",
    intro: "A personal guarantee: you promise to pay if the person you are backing does not.",
    steps: ["Name who you are backing", "State the amount guaranteed", "Sign it before witnesses"],
    related: ["tool-69", "tool-74", "tool-63", "tool-90"],
    fields: [
      { key: "Guarantor", label: "Guarantor's name", profile: "ownerName", required: true, half: true },
      { key: "Guarantor address", label: "Guarantor's address", profile: "address", half: true },
      { key: "Guarantor PAN", label: "Guarantor's PAN", half: true },
      { key: "Beneficiary", label: "Guarantee given to", required: true, half: true, placeholder: "Sunita Rao / HDFC Bank" },
      { key: "Principal", label: "Whose obligation you are backing", required: true, half: true, placeholder: "Sharma Sweets (Prop. Anil Sharma)" },
      { key: "Obligation", label: "What you are guaranteeing", type: "select", required: true, options: ["Repayment of a loan", "Payment of rent", "Payment for goods supplied", "Performance of a contract", "Repayment of an advance"], half: true },
      { key: "Amount", label: "Amount guaranteed (₹)", type: "money", required: true, half: true },
      { key: "Agreement", label: "The agreement it relates to", half: true, placeholder: "Loan agreement dated 2 April 2026" },
      { key: "Scope", label: "How far the guarantee goes", type: "select", options: ["Only this amount", "This amount plus interest and costs", "The whole outstanding balance, whatever it is"], half: true },
      { key: "Valid till", label: "Guarantee valid till", type: "date", half: true },
      { key: "Type", label: "Type of guarantee", type: "select", options: ["Can be revoked with notice", "Cannot be revoked till the debt is cleared"], half: true },
      { key: "Relationship", label: "Your relation to them", half: true, placeholder: "Elder brother" },
    ],
    refineChips: AGREEMENT_CHIPS,
    sample: {
      Guarantor: "Rekha Sharma", "Guarantor address": "9 Palasia, Indore 452001", "Guarantor PAN": "ABCPS4321K",
      Beneficiary: "Sunita Rao", Principal: "Sharma Sweets (Prop. Anil Sharma)",
      Obligation: "Repayment of a loan", Amount: "500000",
      Agreement: "Loan agreement dated 2 April 2026", Scope: "This amount plus interest and costs",
      Type: "Cannot be revoked till the debt is cleared", Relationship: "Wife and co-owner of the premises",
    },
  },
  "tool-71": {
    engine: "doc", credits: p("tool-71"), fileName: "termination-letter", cta: "Write termination letter",
    intro: "A letter ending a contract or service, with the effective date, what is still owed and how handover happens.",
    steps: ["State what is ending and when", "List dues and handover", "Send it with proof of delivery"],
    related: ["tool-54", "tool-75", "tool-86", "tool-64"],
    fields: [
      BUSINESS, SENDER,
      { key: "To", label: "Other party", required: true, half: true },
      { key: "To address", label: "Their address", half: true },
      { key: "What", label: "What is being ended", required: true, half: true, placeholder: "Annual maintenance contract" },
      { key: "Agreement date", label: "Agreement dated", type: "date", half: true },
      { key: "Reason", label: "Why", type: "select", required: true, options: ["Term has run out", "Convenience — no fault", "Breach by the other side", "Repeated poor service", "Work no longer needed", "Mutual agreement", "Non-payment"], half: true },
      { key: "Notice clause", label: "Notice the agreement requires", type: "select", options: ["No notice needed", "15 days", "30 days", "60 days", "90 days"], half: true },
      { key: "Effective", label: "Ends on", type: "date", required: true, half: true, default: inDays(30) },
      { key: "Details", label: "What led to this", type: "textarea", rows: 3, placeholder: "Four service visits were missed between December and March despite reminders, against a contractual response time of 48 hours." },
      { key: "Dues", label: "Amounts still to settle (₹)", type: "money", half: true },
      { key: "Dues note", label: "Who owes what", half: true, placeholder: "₹18,000 refundable to us for the unexpired period" },
      { key: "Handover", label: "What must be returned or handed over", type: "textarea", rows: 2, placeholder: "Service records, spare keys and the two loaned pumps by the effective date." },
      { key: "Survives", label: "What stays in force after it ends", type: "chips", options: ["Confidentiality", "Warranty on work already done", "Payment of outstanding dues", "Non-solicitation", "Dispute resolution"] },
    ],
    refineChips: LETTER_CHIPS,
    sample: {
      Business: "Sharma Sweets", Sender: "Anil Sharma, Proprietor", To: "Cooltech Services",
      "To address": "18 Industrial Area, Dewas Naka, Indore",
      What: "Annual maintenance contract for refrigeration units", Reason: "Repeated poor service",
      "Notice clause": "30 days",
      Details: "Four scheduled service visits were missed between December 2025 and March 2026 despite written reminders, against a contractual response time of 48 hours. One display chiller remained out of service for nine days in February.",
      Dues: "18000", "Dues note": "₹18,000 refundable to us for the unexpired period of the contract",
      Handover: "Service records, spare keys and the two loaned condenser pumps to be returned by the effective date.",
      Survives: "Warranty on work already done|Payment of outstanding dues|Confidentiality",
    },
  },
  "tool-72": {
    engine: "doc", credits: p("tool-72"), fileName: "power-of-attorney", cta: "Create power of attorney",
    intro: "A power of attorney letting someone act for you — bank work, property, court matters or running the business.",
    steps: ["Name who acts for you", "List exactly what they may do", "Notarise or register it"],
    related: ["tool-90", "tool-63", "tool-68", "tool-67"],
    fields: [
      { key: "Principal", label: "Your name (the principal)", profile: "ownerName", required: true, half: true },
      { key: "Principal address", label: "Your address", profile: "address", half: true },
      { key: "Attorney", label: "Who will act for you", required: true, half: true },
      { key: "Attorney address", label: "Their address", half: true },
      { key: "Relationship", label: "Your relation to them", half: true, placeholder: "Brother" },
      { key: "Scope", label: "Type", type: "select", required: true, options: ["Specific — only the listed acts", "General — all acts in the stated area"], half: true },
      { key: "Area", label: "What it covers", type: "select", required: true, options: ["Bank and financial matters", "Property — sale or purchase", "Property — renting and management", "Court and legal matters", "Running the business", "Government and tax filings", "Collecting documents"], half: true },
      { key: "Powers", label: "Exactly what they may do", type: "textarea", rows: 4, required: true, placeholder: "Operate current account 50200012345678 with HDFC Bank, sign cheques up to ₹1,00,000, deposit and withdraw cash, and collect statements." },
      { key: "Cannot", label: "What they may not do", type: "textarea", rows: 2, placeholder: "May not sell or mortgage any property, take any loan, or close the account." },
      { key: "From", label: "Valid from", type: "date", half: true, default: isoToday() },
      { key: "Till", label: "Valid till", type: "date", half: true },
      { key: "Revocable", label: "Can you cancel it", type: "select", options: ["Yes, at any time with written notice", "Only after the stated purpose is done"], half: true },
      { key: "Witnesses", label: "Witness names", half: true },
    ],
    refineChips: ["Narrow the powers", "Add a revocation clause", "Simpler language", "Add a witness block"],
    sample: {
      Principal: "Anil Sharma", "Principal address": "9 Palasia, Indore 452001",
      Attorney: "Rekha Sharma", "Attorney address": "9 Palasia, Indore 452001", Relationship: "Wife",
      Scope: "Specific — only the listed acts", Area: "Bank and financial matters",
      Powers: "Operate current account no. 50200012345678 with HDFC Bank, Palasia branch; sign and deposit cheques up to ₹1,00,000 each; deposit and withdraw cash; collect statements and chequebooks; and sign routine correspondence with the bank.",
      Cannot: "May not sell, mortgage or create any charge on property, may not borrow in my name, and may not close the account or change the authorised signatories.",
      Revocable: "Yes, at any time with written notice", Witnesses: "Mahesh Yadav and Anita Jain",
    },
  },
  "tool-73": {
    engine: "doc", credits: p("tool-73"), fileName: "joint-project-nda", cta: "Create joint NDA",
    intro: "A two-way NDA for two businesses working on a project together: what each side shares, how long it stays secret, and no poaching.",
    steps: ["Name both businesses", "Say what each side will see", "Sign before the work starts"],
    related: ["tool-62", "tool-75", "tool-85", "tool-59"],
    fields: [
      { key: "Party A", label: "First business", profile: "businessName", required: true, half: true },
      { key: "Party A address", label: "Their address", profile: "address", half: true },
      { key: "Party B", label: "Second business", required: true, half: true },
      { key: "Party B address", label: "Their address", half: true },
      { key: "Working on", label: "What you are working on together", required: true, placeholder: "A co-branded festival gift box for the 2026 season" },
      { key: "A shares", label: "What the first business will share", type: "textarea", rows: 2, placeholder: "Recipes, packaging artwork, dealer pricing." },
      { key: "B shares", label: "What the second business will share", type: "textarea", rows: 2, placeholder: "Retail footfall data, shelf placement costs, customer purchase patterns." },
      { key: "Years", label: "Stays confidential for (years)", type: "number", required: true, half: true, default: "3" },
      { key: "Exceptions", label: "Not covered by the agreement", type: "chips", options: ["Already public", "Already known to the receiver", "Developed independently", "Required by law or a court", "Received from a third party lawfully"] },
      { key: "No poaching", label: "Also agree not to", type: "chips", options: ["Hire each other's staff for 12 months", "Approach each other's customers directly", "Work with a direct competitor on the same idea"] },
      { key: "On ending", label: "When the project ends", type: "select", options: ["Return or destroy everything", "Keep one copy for records only", "Destroy and confirm in writing"], half: true },
      { key: "Jurisdiction", label: "Courts of which city", profile: "city", half: true },
    ],
    refineChips: AGREEMENT_CHIPS,
    sample: {
      "Party A": "Sharma Sweets", "Party A address": "9 Palasia, Indore 452001",
      "Party B": "Metro Retail Stores", "Party B address": "Plot 3, AB Road, Indore 452008",
      "Working on": "A co-branded festival gift box for the 2026 Diwali season",
      "A shares": "Recipes and shelf-life data, packaging artwork, and dealer pricing structure.",
      "B shares": "Store footfall data, shelf placement costs, and customer purchase patterns for the sweets category.",
      Years: "3",
      Exceptions: "Already public|Already known to the receiver|Required by law or a court",
      "No poaching": "Hire each other's staff for 12 months|Work with a direct competitor on the same idea",
      "On ending": "Destroy and confirm in writing", Jurisdiction: "Indore",
    },
  },
  "tool-74": {
    engine: "doc", credits: p("tool-74"), fileName: "indemnity-bond", cta: "Create indemnity bond",
    intro: "An indemnity bond promising to make good someone's loss — often needed for duplicate documents or released goods.",
    steps: ["State the risk being covered", "Set the bond amount", "Print on stamp paper and notarise"],
    related: ["tool-70", "tool-63", "tool-69", "tool-90"],
    fields: [
      { key: "Indemnifier", label: "Who gives the indemnity", profile: "ownerName", required: true, half: true },
      { key: "Indemnifier address", label: "Their address", profile: "address", half: true },
      { key: "Beneficiary", label: "Who is being protected", required: true, half: true, placeholder: "State Bank of India, Palasia branch" },
      { key: "Purpose", label: "What it is for", type: "select", required: true, options: ["Duplicate document issued", "Goods released without original papers", "Loss of share certificate", "Transfer without a succession certificate", "Claim settled without full papers", "Vehicle transfer", "Other"], half: true },
      { key: "Amount", label: "Bond amount (₹)", type: "money", required: true, half: true },
      { key: "Background", label: "What happened", type: "textarea", rows: 3, required: true, placeholder: "The original fixed deposit receipt no. FD/2024/8891 for ₹2,00,000 has been misplaced and cannot be traced." },
      { key: "Risk", label: "The loss you are covering", type: "textarea", rows: 2, required: true, placeholder: "Any claim, demand or loss the bank suffers if the original receipt is later produced by anyone." },
      { key: "Valid till", label: "Bond valid till", type: "date", half: true },
      { key: "Witnesses", label: "Witness names", half: true },
      { key: "Place", label: "Place", profile: "city", half: true },
    ],
    refineChips: AGREEMENT_CHIPS,
    sample: {
      Indemnifier: "Anil Sharma", "Indemnifier address": "9 Palasia, Indore 452001",
      Beneficiary: "State Bank of India, Palasia branch, Indore",
      Purpose: "Duplicate document issued", Amount: "200000",
      Background: "The original fixed deposit receipt no. FD/2024/8891 dated 11 July 2024 for ₹2,00,000 issued in my name has been misplaced while shifting premises and cannot be traced despite a thorough search.",
      Risk: "Any claim, demand, loss or expense the bank may suffer if the original receipt is later produced by me or by any other person, or if any claim is made against the bank in respect of the said deposit.",
      Witnesses: "Rekha Sharma and Mahesh Yadav", Place: "Indore",
    },
  },

  // Phase 1: Contracts, HR forms and operations paperwork (tool-75–tool-104)
  "tool-75": {
    engine: "doc", credits: p("tool-75"), fileName: "service-agreement", cta: "Create service agreement",
    intro: "A service agreement setting out what you will do, for how much, to what standard, and how either side can walk away.",
    steps: ["Describe the service and fee", "Set the standard you promise", "Get it signed before you start"],
    related: ["tool-82", "tool-83", "tool-59", "tool-49"],
    fields: [
      { key: "Provider", label: "Service provider", profile: "businessName", required: true, half: true },
      { key: "Provider address", label: "Their address", profile: "address", half: true },
      { key: "Client", label: "Client", required: true, half: true, ctxKey: "clientName" },
      { key: "Client address", label: "Client's address", ctxKey: "clientAddress", half: true },
      { key: "Services", label: "What you will do", type: "textarea", rows: 3, required: true, ctxKey: "service", placeholder: "Monthly bookkeeping, GST returns (GSTR-1 and 3B), TDS returns, and one annual balance sheet." },
      { key: "Excluded", label: "What is not included", type: "textarea", rows: 2, placeholder: "Statutory audit, income-tax scrutiny representation, and any penalty or government fee." },
      { key: "Fee", label: "Fee (₹)", type: "money", required: true, half: true, ctxKey: "fee" },
      { key: "Fee basis", label: "Fee basis", type: "select", options: ["Per month", "Per quarter", "Per year", "Per job", "Per hour"], half: true },
      { key: "Billing", label: "When you invoice", type: "select", options: ["Monthly in advance", "Monthly in arrears", "On completion", "On milestones", "Quarterly in advance"], half: true },
      { key: "Payment days", label: "Payment due within", type: "select", options: ["On receipt", "7 days", "15 days", "30 days"], half: true },
      { key: "Start", label: "Starts on", type: "date", half: true, default: isoToday() },
      { key: "Term", label: "Runs for", type: "select", options: ["1 year, renewing", "2 years", "Until the job is done", "Rolling monthly"], half: true },
      { key: "Standard", label: "Service standard you promise", type: "textarea", rows: 2, placeholder: "Returns filed at least 3 days before the due date; queries answered within one working day." },
      { key: "Client must", label: "What the client must do", type: "textarea", rows: 2, placeholder: "Share bank statements and purchase bills by the 5th of each month." },
      { key: "Notice", label: "Notice to end it", type: "select", options: ["15 days", "30 days", "60 days", "90 days"], half: true },
      { key: "Clauses", label: "Clauses to include", type: "chips", options: ["Confidentiality", "Limit on our liability", "Late-payment interest", "Work stops if payment stops", "No poaching of staff", "Arbitration"] },
      { key: "Jurisdiction", label: "Courts of which city", profile: "city", half: true },
    ],
    refineChips: AGREEMENT_CHIPS,
    sample: {
      Provider: "Verma Tax Consultants", "Provider address": "201 Sapna Sangeeta Road, Indore 452001",
      Client: "Sharma Sweets", "Client address": "9 Palasia, Indore 452001",
      Services: "Monthly bookkeeping in Tally, GST returns (GSTR-1 and GSTR-3B), quarterly TDS returns, and one annual balance sheet with profit and loss account.",
      Excluded: "Statutory audit, representation in income-tax scrutiny, and any government fee, penalty or late fee.",
      Fee: "12000", "Fee basis": "Per month", Billing: "Monthly in arrears", "Payment days": "15 days",
      Term: "1 year, renewing",
      Standard: "Returns filed at least three days before the statutory due date. Queries answered within one working day.",
      "Client must": "Share bank statements, purchase bills and sales registers by the 5th of each month.",
      Notice: "30 days",
      Clauses: "Confidentiality|Late-payment interest|Work stops if payment stops|Limit on our liability",
      Jurisdiction: "Indore",
    },
  },
  "tool-76": {
    engine: "doc", credits: p("tool-76"), fileName: "work-order", cta: "Create work order",
    intro: "A work order telling a contractor exactly what to do, by when and for how much, with sign-off at the end.",
    steps: ["Describe the job and site", "Set cost and dates", "Issue it and keep a signed copy"],
    related: ["tool-42", "tool-83", "tool-89", "tool-97"],
    fields: [
      BUSINESS,
      { key: "WO number", label: "Work order number", half: true, placeholder: "WO-2026-022" },
      { key: "Date", label: "Date", type: "date", half: true, default: isoToday() },
      { key: "Contractor", label: "Contractor / vendor", required: true, half: true, placeholder: "Hitesh Fabricators" },
      { key: "Site", label: "Where the work is", required: true, half: true, placeholder: "Godown 3, Sanwer Road, Indore" },
      { key: "Work", label: "What is to be done", type: "textarea", rows: 3, required: true, placeholder: "Fabricate and install 14 running feet of MS storage racking, 3 tiers, powder-coated." },
      { key: "Items", label: "Cost break-up", type: "rows",
        columns: [
          { key: "desc", label: "Item of work", placeholder: "MS racking fabrication" },
          { key: "qty", label: "Qty", type: "number" },
          { key: "unit", label: "Unit", type: "select", options: ["Nos", "Rft", "Sqft", "Kg", "Lump sum", "Day"] },
          { key: "price", label: "Rate (₹)", type: "money" },
        ],
        defaultRows: [{ desc: "", qty: "1", unit: "Lump sum", price: "" }],
      },
      { key: "Start by", label: "Start by", type: "date", half: true, default: inDays(3) },
      { key: "Finish by", label: "Finish by", type: "date", half: true, default: inDays(21) },
      { key: "Materials", label: "Who supplies materials", type: "select", options: ["Contractor supplies everything", "We supply materials, contractor supplies labour", "Split — see notes"], half: true },
      { key: "Payment", label: "Payment terms", type: "select", options: ["On completion and sign-off", "50% advance, 50% on completion", "Running bills every fortnight", "30 days from sign-off"], half: true },
      { key: "Safety", label: "Site conditions & safety", type: "textarea", rows: 2, placeholder: "Work only between 9 am and 6 pm. Helmets and safety shoes compulsory. Debris cleared daily." },
      { key: "Penalty", label: "If the job runs late", half: true, placeholder: "₹1,000 a day beyond the finish date, capped at 5% of the order value" },
    ],
    compute: (v) => {
      const t = billTotals(rowsOf(v, "Items"));
      return t.total ? { "Work order value": inr(t.total) } : {};
    },
    preview: (v) => {
      const t = billTotals(rowsOf(v, "Items"));
      return <Totals sub={t.sub} total={t.total} />;
    },
    refineChips: BILL_CHIPS,
    sample: {
      Business: "Sharma Sweets", "WO number": "WO-2026-022", Contractor: "Hitesh Fabricators",
      Site: "Godown 3, Sanwer Road, Indore",
      Work: "Fabricate and install 14 running feet of MS storage racking, three tiers, powder-coated, including wall anchoring.",
      Items: [
        { desc: "MS racking fabrication and installation", qty: "14", unit: "Rft", price: "2400" },
        { desc: "Powder coating", qty: "1", unit: "Lump sum", price: "8000" },
      ],
      Materials: "Contractor supplies everything", Payment: "50% advance, 50% on completion",
      Safety: "Work only between 9 am and 6 pm. Helmets and safety shoes compulsory. Debris cleared at the end of each day.",
      Penalty: "₹1,000 a day beyond the finish date, capped at 5% of the order value",
    },
  },
  "tool-77": {
    engine: "doc", credits: p("tool-77"), fileName: "quotation-comparison", cta: "Compare quotes",
    intro: "Three or four supplier quotes lined up side by side, with a recommendation you can put in front of an approver.",
    steps: ["Enter each quote", "See the cheapest and the best value", "Attach it to the purchase approval"],
    related: ["tool-42", "tool-97", "tool-40", "tool-22"],
    fields: [
      BUSINESS,
      { key: "Buying", label: "What you are buying", required: true, placeholder: "5,000 printed gift cartons, 12×9×4 in, 3-ply" },
      { key: "Needed by", label: "Needed by", type: "date", half: true, default: inDays(14) },
      { key: "Budget", label: "Budget, if you have one (₹)", type: "money", half: true },
      { key: "Quotes", label: "The quotes", type: "rows", required: true,
        columns: [
          { key: "supplier", label: "Supplier" },
          { key: "price", label: "Quoted (₹)", type: "money" },
          { key: "days", label: "Delivery days", type: "number" },
          { key: "terms", label: "Payment terms" },
          { key: "note", label: "Quality / notes" },
        ],
        defaultRows: [{ supplier: "", price: "", days: "", terms: "", note: "" }, { supplier: "", price: "", days: "", terms: "", note: "" }],
      },
      { key: "Matters most", label: "What matters most here", type: "select", options: ["Lowest price", "Fastest delivery", "Best quality", "Longest credit", "Reliability — we have been let down before"], half: true },
      { key: "History", label: "Past experience with any of them", type: "textarea", rows: 2, placeholder: "Agarwal let us down on a ₹84,000 advance in January and still owes a refund." },
    ],
    compute: (v) => {
      const rows = rowsOf(v, "Quotes").filter((r) => num(r.price));
      if (!rows.length) return {};
      const sorted = [...rows].sort((a, b) => num(a.price) - num(b.price));
      const low = sorted[0];
      const high = sorted[sorted.length - 1];
      const spread = num(high.price) - num(low.price);
      return {
        "Lowest quote": `${low.supplier || "Supplier"} at ${inr(num(low.price))}`,
        "Highest quote": `${high.supplier || "Supplier"} at ${inr(num(high.price))}`,
        "Spread between quotes": `${inr(spread)} (${num(low.price) ? ((spread / num(low.price)) * 100).toFixed(1) : "0"}% over the lowest)`,
        "Quotes compared": String(rows.length),
      };
    },
    preview: (v) => {
      const rows = rowsOf(v, "Quotes").filter((r) => num(r.price));
      if (rows.length < 2) return null;
      const sorted = [...rows].sort((a, b) => num(a.price) - num(b.price));
      const low = sorted[0];
      const spread = num(sorted[sorted.length - 1].price) - num(low.price);
      return (
        <div className="rounded-xl bg-primary/5 p-3 text-sm">
          Cheapest: <strong>{low.supplier || "Supplier"}</strong> at {inr(num(low.price))}
          <span className="ml-2 text-xs text-muted-foreground">Spread {inr(spread)} across {rows.length} quotes</span>
        </div>
      );
    },
    refineChips: ["Recommend only on price", "Weigh quality higher", "Add a negotiation note", "Shorter"],
    sample: {
      Business: "Sharma Sweets",
      Buying: "5,000 printed gift cartons, 12×9×4 in, 3-ply with gold foiling",
      Budget: "150000",
      Quotes: [
        { supplier: "Agarwal Packaging", price: "134000", days: "21", terms: "50% advance", note: "Cheapest, but foiling quality was uneven on the last sample" },
        { supplier: "Shree Print House", price: "148500", days: "12", terms: "15 days credit", note: "Good sample, has done our boxes before" },
        { supplier: "Deccan Cartons", price: "159000", days: "10", terms: "30 days credit", note: "Best print quality, longest credit, highest price" },
      ],
      "Matters most": "Reliability — we have been let down before",
      History: "Agarwal took a ₹84,000 advance in January, did not deliver, and still owes a refund. Shree Print House has delivered on time twice.",
    },
  },
  "tool-79": {
    engine: "doc", credits: p("tool-79"), fileName: "warranty-certificate", cta: "Create warranty",
    intro: "A warranty certificate saying exactly what is covered, what is not, and how a customer claims it.",
    steps: ["Enter the product and period", "Set what is not covered", "Give it with the bill"],
    related: ["tool-81", "tool-82", "tool-38", "tool-98"],
    fields: [
      BUSINESS,
      { key: "Product", label: "Product or work", required: true, half: true, placeholder: "MS storage racking, 3 tiers" },
      { key: "Model", label: "Model / serial / batch", half: true },
      { key: "Customer", label: "Customer name", half: true, ctxKey: "clientName" },
      { key: "Invoice", label: "Invoice number", half: true, ctxKey: "invoiceNumber" },
      { key: "Purchase date", label: "Date of purchase", type: "date", half: true, default: isoToday() },
      { key: "Period", label: "Warranty period", type: "select", required: true, options: ["3 months", "6 months", "1 year", "2 years", "3 years", "5 years", "Lifetime of the product"], half: true },
      { key: "Covered", label: "What is covered", type: "textarea", rows: 2, required: true, placeholder: "Manufacturing defects in welding, structural failure under the rated load, and peeling of the powder coating." },
      { key: "Not covered", label: "What is not covered", type: "chips", options: ["Normal wear and tear", "Misuse or overloading", "Accidental damage", "Rust from water exposure", "Repairs by anyone else", "Consumable parts", "Damage in transit after delivery", "Acts of God"] },
      { key: "Remedy", label: "What you will do for a valid claim", type: "select", options: ["Repair free of charge", "Repair or replace, our choice", "Replace the part", "Replace the product", "Refund on a pro-rata basis"], half: true },
      { key: "Claim how", label: "How to claim", type: "textarea", rows: 2, placeholder: "Call 0731-4000000 or WhatsApp a photo to 98260 00000 with this certificate number and the invoice." },
      { key: "Response", label: "You will respond within", type: "select", options: ["24 hours", "48 hours", "3 working days", "7 working days"], half: true },
      { key: "Conditions", label: "Conditions the customer must meet", type: "textarea", rows: 2, placeholder: "Load not to exceed 150 kg a tier. This certificate and the original invoice must be produced." },
    ],
    refineChips: ["Shorter — one page", "Stricter exclusions", "Friendlier wording", "Translate to Hindi"],
    sample: {
      Business: "Hitesh Fabricators", Product: "MS storage racking, 3 tiers, powder-coated",
      Model: "HF-RK-14/2026", Customer: "Sharma Sweets", Invoice: "HF-2026-117", Period: "2 years",
      Covered: "Manufacturing defects in welding, structural failure under the rated load of 150 kg per tier, and peeling of the powder coating.",
      "Not covered": "Normal wear and tear|Misuse or overloading|Accidental damage|Rust from water exposure|Repairs by anyone else",
      Remedy: "Repair or replace, our choice",
      "Claim how": "Call 0731-4000000 or send a photo on WhatsApp to 98260 00000 quoting this certificate number along with the original invoice.",
      Response: "48 hours",
      Conditions: "Load must not exceed 150 kg per tier. The racking must not be relocated or modified. This certificate and the original invoice must be produced with any claim.",
    },
  },
  "tool-80": {
    engine: "doc", credits: p("tool-80"), fileName: "delivery-receipt", cta: "Create delivery receipt",
    intro: "A delivery receipt the customer signs, recording what arrived, in what condition, and anything short or damaged.",
    steps: ["List what was delivered", "Note the condition", "Get the receiver's signature"],
    related: ["tool-43", "tool-81", "tool-1", "tool-98"],
    fields: [
      BUSINESS,
      { key: "Receipt number", label: "Receipt number", half: true, placeholder: "DR-2026-204" },
      { key: "Date", label: "Delivery date", type: "date", half: true, default: isoToday() },
      { key: "Delivered to", label: "Delivered to", required: true, half: true, ctxKey: "clientName" },
      { key: "Address", label: "Delivery address", ctxKey: "clientAddress", half: true },
      { key: "Against", label: "Against order / invoice", half: true, placeholder: "INV-2026-221" },
      { key: "Items", label: "What was delivered", type: "rows", required: true,
        columns: [
          { key: "desc", label: "Item" },
          { key: "qty", label: "Qty sent", type: "number" },
          { key: "received", label: "Qty received", type: "number" },
          { key: "condition", label: "Condition", type: "select", options: ["Good", "Damaged", "Short", "Wrong item"] },
        ],
        defaultRows: [{ desc: "", qty: "", received: "", condition: "Good" }],
      },
      { key: "Vehicle", label: "Vehicle / courier", half: true, placeholder: "MP 09 KL 4421" },
      { key: "Driver", label: "Delivered by", half: true },
      { key: "Receiver", label: "Received by (name)", half: true },
      { key: "Remarks", label: "Remarks", type: "textarea", rows: 2, placeholder: "Two cartons dented on the top flap; contents checked and found intact." },
    ],
    compute: (v) => {
      const rows = rowsOf(v, "Items").filter((r) => r.desc?.trim());
      if (!rows.length) return {};
      const issues = rows.filter((r) => r.condition && r.condition !== "Good");
      const short = rows.filter((r) => num(r.received) && num(r.qty) && num(r.received) < num(r.qty));
      return {
        "Lines delivered": String(rows.length),
        ...(issues.length ? { "Lines with a problem": `${issues.length} — ${issues.map((r) => `${r.desc}: ${r.condition}`).join("; ")}` } : { "Condition": "All lines received in good condition" }),
        ...(short.length ? { "Short supply": short.map((r) => `${r.desc}: ${num(r.qty) - num(r.received)} short`).join("; ") } : {}),
      };
    },
    preview: (v) => {
      const rows = rowsOf(v, "Items").filter((r) => r.desc?.trim());
      if (!rows.length) return null;
      const issues = rows.filter((r) => r.condition && r.condition !== "Good").length;
      return (
        <div className="rounded-xl bg-primary/5 p-3 text-sm">
          {rows.length} lines
          {issues ? <span className="ml-2 text-amber-600">{issues} with a problem</span> : <span className="ml-2">all in good condition</span>}
        </div>
      );
    },
    refineChips: FORM_CHIPS,
    sample: {
      Business: "Sharma Sweets", "Receipt number": "DR-2026-204", "Delivered to": "Deepak Traders",
      Address: "Shop 14, MG Road, Indore 452001", Against: "INV-2026-221",
      Items: [
        { desc: "Kaju katli 1 kg box", qty: "25", received: "25", condition: "Good" },
        { desc: "Assorted mithai 500 g box", qty: "40", received: "38", condition: "Short" },
      ],
      Vehicle: "MP 09 KL 4421", Driver: "Imran Shaikh", Receiver: "Deepak Jain",
      Remarks: "Two boxes short; to be sent with the next delivery. Rest received in good condition.",
    },
  },
  "tool-81": {
    engine: "doc", credits: p("tool-81"), fileName: "return-authorisation", cta: "Create return form",
    intro: "A return authorisation that records what is coming back, why, and what the customer gets instead.",
    steps: ["Enter the item and reason", "Decide refund, replace or repair", "Send the number with the pickup"],
    related: ["tool-44", "tool-80", "tool-79", "tool-38"],
    fields: [
      BUSINESS,
      { key: "RMA number", label: "Return number", half: true, placeholder: "RMA-2026-038" },
      { key: "Date", label: "Date", type: "date", half: true, default: isoToday() },
      { key: "Customer", label: "Customer", required: true, half: true, ctxKey: "clientName" },
      { key: "Contact", label: "Phone / email", half: true },
      { key: "Invoice", label: "Original invoice", half: true, ctxKey: "invoiceNumber" },
      { key: "Purchase date", label: "Bought on", type: "date", half: true },
      { key: "Items", label: "What is coming back", type: "rows", required: true,
        columns: [
          { key: "desc", label: "Item" },
          { key: "qty", label: "Qty", type: "number" },
          { key: "price", label: "Value (₹)", type: "money" },
          { key: "reason", label: "Reason", type: "select", options: ["Damaged", "Defective", "Wrong item sent", "Not as described", "Short shelf life", "Changed mind", "Excess supply"] },
        ],
        defaultRows: [{ desc: "", qty: "1", price: "", reason: "Damaged" }],
      },
      { key: "Resolution", label: "What the customer gets", type: "select", required: true, options: ["Full refund", "Replacement", "Repair", "Credit note for a future order", "Partial refund", "Rejected — outside policy"], half: true },
      { key: "Pickup", label: "How it comes back", type: "select", options: ["We arrange pickup", "Customer sends it", "Customer drops it at the shop", "No return needed — photo proof accepted"], half: true },
      { key: "By when", label: "Return us by", type: "date", half: true, default: inDays(7) },
      { key: "Condition", label: "Condition it must come back in", half: true, placeholder: "Original packing, unused, with the invoice copy" },
      { key: "Notes", label: "Notes", type: "textarea", rows: 2 },
    ],
    compute: (v) => {
      const t = billTotals(rowsOf(v, "Items"));
      return t.total ? { "Value being returned": inr(t.total), "Lines returned": String(t.lines) } : {};
    },
    preview: (v) => {
      const t = billTotals(rowsOf(v, "Items"));
      return <Totals sub={t.sub} total={t.total} note="Value of the goods coming back." />;
    },
    refineChips: FORM_CHIPS,
    sample: {
      Business: "Sharma Sweets", "RMA number": "RMA-2026-038", Customer: "Deepak Traders",
      Contact: "98260 11111", Invoice: "INV-2026-221",
      Items: [{ desc: "Assorted mithai 500 g box", qty: "6", price: "450", reason: "Damaged" }],
      Resolution: "Replacement", Pickup: "We arrange pickup",
      Condition: "Original packing with the invoice copy",
      Notes: "Boxes dented in transit. Replacement dispatched with the next delivery; damaged stock to be collected by our driver.",
    },
  },
  "tool-82": {
    engine: "doc", credits: p("tool-82"), fileName: "customer-contract", cta: "Create contract",
    intro: "A customer service contract with response times, support hours and what happens when you miss them.",
    steps: ["Set the service and hours", "Put numbers on response times", "Get it signed"],
    related: ["tool-75", "tool-79", "tool-83", "tool-38"],
    fields: [
      BUSINESS,
      { key: "Customer", label: "Customer", required: true, half: true, ctxKey: "clientName" },
      { key: "Customer address", label: "Their address", ctxKey: "clientAddress", half: true },
      { key: "Service", label: "What you will support", type: "textarea", rows: 2, required: true, ctxKey: "service", placeholder: "Four display chillers and two deep freezers at the Palasia outlet." },
      { key: "Fee", label: "Annual fee (₹)", type: "money", required: true, half: true, ctxKey: "fee" },
      { key: "Billing", label: "Billed", type: "select", options: ["Yearly in advance", "Half-yearly", "Quarterly", "Monthly"], half: true },
      { key: "Hours", label: "Support hours", type: "select", required: true, options: ["Business hours, Mon–Sat", "Business hours, Mon–Fri", "Extended, 8 am – 10 pm all days", "24×7"], half: true },
      { key: "Response", label: "Response time", type: "select", required: true, options: ["Within 4 hours", "Within 24 hours", "Within 48 hours", "Same working day"], half: true },
      { key: "Fix time", label: "Target fix time", type: "select", options: ["Within 24 hours", "Within 48 hours", "Within 3 working days", "Within 7 working days"], half: true },
      { key: "Visits", label: "Preventive visits a year", type: "number", half: true, placeholder: "4" },
      { key: "Included", label: "Included in the fee", type: "chips", options: ["Labour", "Site visits", "Gas top-up", "Consumables", "Phone support", "Software updates", "Preventive servicing"] },
      { key: "Chargeable", label: "Charged separately", type: "chips", options: ["Spare parts", "Compressor replacement", "Damage by misuse", "Visits outside support hours", "Relocation of equipment"] },
      { key: "Escalation", label: "If it is not fixed in time", type: "textarea", rows: 2, placeholder: "Escalate to the service head within 24 hours; a standby unit provided free if downtime crosses 48 hours." },
      { key: "Term", label: "Contract period", type: "select", options: ["1 year", "2 years", "3 years"], half: true },
      { key: "Notice", label: "Notice to end it", type: "select", options: ["30 days", "60 days", "90 days"], half: true },
    ],
    refineChips: AGREEMENT_CHIPS,
    sample: {
      Business: "Cooltech Services", Customer: "Sharma Sweets",
      "Customer address": "9 Palasia, Indore 452001",
      Service: "Four display chillers and two deep freezers installed at the Palasia outlet, as listed in the annexure.",
      Fee: "48000", Billing: "Half-yearly", Hours: "Business hours, Mon–Sat",
      Response: "Within 24 hours", "Fix time": "Within 48 hours", Visits: "4",
      Included: "Labour|Site visits|Gas top-up|Phone support|Preventive servicing",
      Chargeable: "Spare parts|Compressor replacement|Damage by misuse|Visits outside support hours",
      Escalation: "Escalate to the service head within 24 hours of a missed target. If downtime crosses 48 hours, a standby unit is provided free until the fault is fixed.",
      Term: "1 year", Notice: "30 days",
    },
  },
  "tool-83": {
    engine: "doc", credits: p("tool-83"), fileName: "statement-of-work", cta: "Create statement of work",
    intro: "A statement of work pinning down scope, deliverables, dates and what counts as done — so nobody argues later.",
    steps: ["Set the scope and what is out", "List deliverables and dates", "Define sign-off, then get it signed"],
    related: ["tool-75", "tool-45", "tool-59", "tool-76"],
    fields: [
      BUSINESS,
      { key: "Client", label: "Client", required: true, half: true, ctxKey: "clientName" },
      { key: "Project", label: "Project name", required: true, half: true, ctxKey: "service" },
      { key: "Background", label: "Why this work is being done", type: "textarea", rows: 2, placeholder: "The current reports take two days to prepare by hand every month." },
      { key: "In scope", label: "What is in scope", type: "textarea", rows: 3, required: true, placeholder: "Rebuild the reports module, migrate three years of old data, and train two staff." },
      { key: "Out of scope", label: "What is out of scope", type: "textarea", rows: 2, required: true, placeholder: "Mobile app, changes to the billing screens, and hosting costs." },
      { key: "Deliverables", label: "Deliverables", type: "rows", required: true,
        columns: [
          { key: "item", label: "Deliverable" },
          { key: "by", label: "By when", type: "date" },
          { key: "accept", label: "Counts as done when" },
        ],
        defaultRows: [{ item: "", by: "", accept: "" }],
      },
      { key: "Value", label: "Total value (₹)", type: "money", required: true, half: true, ctxKey: "fee" },
      { key: "Payment", label: "Payment plan", type: "select", options: ["On completion", "On each deliverable", "50% advance, 50% on completion", "Monthly against progress"], half: true },
      { key: "Team", label: "Who will do the work", half: true, placeholder: "One senior developer and one tester" },
      { key: "Client provides", label: "What the client must provide", type: "textarea", rows: 2, placeholder: "Database access, a test server, and one person available for weekly reviews." },
      { key: "Sign-off", label: "Who signs off", half: true, placeholder: "Suresh Verma, Partner" },
      { key: "Review days", label: "Days to review a deliverable", type: "number", half: true, default: "5", help: "After this, it is taken as accepted." },
      { key: "Changes", label: "How changes are handled", type: "textarea", rows: 2, placeholder: "Any change to scope is quoted separately and started only after written approval." },
    ],
    compute: (v) => {
      const rows = rowsOf(v, "Deliverables").filter((r) => r.item?.trim());
      return rows.length ? { "Deliverable count": String(rows.length) } : {};
    },
    refineChips: AGREEMENT_CHIPS,
    sample: {
      Business: "Kulkarni Softworks", Client: "Verma Tax Consultants", Project: "Billing reports rebuild",
      Background: "The monthly client reports take about two days to prepare by hand and errors are caught late.",
      "In scope": "Rebuild the reports module with 12 standard reports, migrate three years of historical data, and train two staff members.",
      "Out of scope": "Any mobile app, changes to the billing entry screens, server hosting costs, and support after the warranty period.",
      Deliverables: [
        { item: "Report designs approved on paper", by: "", accept: "Client signs the design document" },
        { item: "Module live on the test server", by: "", accept: "All 12 reports run on test data with no errors" },
        { item: "Historical data migrated", by: "", accept: "Totals for 3 years match the old system" },
        { item: "Training done and code handed over", by: "", accept: "Two staff run reports unaided; source code in the client's repository" },
      ],
      Value: "180000", Payment: "On each deliverable", Team: "One senior developer and one tester",
      "Client provides": "Read access to the production database, a test server, and one person available for a weekly 30-minute review.",
      "Sign-off": "Suresh Verma, Partner", "Review days": "5",
      Changes: "Any change to the agreed scope is quoted separately and taken up only after written approval.",
    },
  },
  "tool-84": {
    engine: "doc", credits: p("tool-84"), fileName: "non-compete", cta: "Create agreement",
    intro: "A non-compete while they work for you, and a no-poaching and confidentiality promise after they leave — written the way Indian law allows.",
    steps: ["Say what they see in the job", "Pick what is restricted", "Sign it with the contract"],
    related: ["tool-58", "tool-62", "tool-85", "tool-54"],
    fields: [
      BUSINESS, INDUSTRY,
      { key: "Employee", label: "Employee name", required: true, half: true },
      { key: "Role", label: "Their role", required: true, half: true },
      { key: "What they access", label: "What they see in this job", type: "textarea", rows: 2, required: true, placeholder: "Dealer pricing, margin structure, and the full customer list for the Malwa region." },
      { key: "Months", label: "No-poaching period after leaving (months)", type: "number", required: true, half: true, default: "12", help: "In India a ban on working for a competitor after someone leaves is generally void (Indian Contract Act, s. 27), so after exit the agreement only stops them poaching customers or staff and using your data." },
      { key: "Area", label: "Customers it covers", type: "select", required: true, options: ["Customers they dealt with", "Customers in the region they handled", "All our customers"], half: true },
      { key: "Restricted", label: "What they may not do", type: "chips", options: ["Work for a competitor while employed", "Run a side business in our line while employed", "Approach our customers", "Approach our suppliers", "Hire our staff", "Use our pricing or customer data"] },
      { key: "Allowed", label: "What stays allowed", type: "textarea", rows: 2, placeholder: "After leaving, working anywhere, including for a competitor, as long as they do not use our data or approach our customers and staff." },
      { key: "Consideration", label: "What they get for agreeing", half: true, placeholder: "A retention bonus of ₹50,000 paid on exit" },
      { key: "Breach", label: "If they break it", type: "textarea", rows: 2, placeholder: "The company may seek an injunction and recover the retention bonus along with proven losses." },
      { key: "Jurisdiction", label: "Courts of which city", profile: "city", half: true },
    ],
    refineChips: AGREEMENT_CHIPS,
    sample: {
      Business: "Ratna Steel Traders", Industry: "Steel and hardware trading",
      Employee: "Rohit Patil", Role: "Senior sales executive",
      "What they access": "Dealer pricing and margin structure, the full customer list for the Malwa region, and our credit terms with each dealer.",
      Months: "12", Area: "Customers in the region they handled",
      Restricted: "Work for a competitor while employed|Approach our customers|Hire our staff|Use our pricing or customer data",
      Allowed: "After leaving, taking up any job, including with another steel trader, without using our pricing or customer data.",
      Consideration: "A retention bonus of ₹50,000 paid at the time of exit",
      Breach: "The company may seek an injunction, recover the retention bonus, and claim proven losses caused by the breach.",
      Jurisdiction: "Pune",
    },
  },
  "tool-85": {
    engine: "doc", credits: p("tool-85"), fileName: "ip-assignment", cta: "Create IP assignment",
    intro: "An assignment moving ownership of work — code, designs, a logo, writing — from the person who made it to you.",
    steps: ["Describe exactly what is being assigned", "State what was paid", "Get it signed with a witness"],
    related: ["tool-59", "tool-62", "tool-84", "tool-83"],
    fields: [
      { key: "Assignor", label: "Who made the work", required: true, half: true, placeholder: "Nilesh Kulkarni" },
      { key: "Assignor address", label: "Their address", half: true },
      { key: "Assignee", label: "Who is getting the ownership", profile: "businessName", required: true, half: true },
      { key: "Assignee address", label: "Their address", profile: "address", half: true },
      { key: "Type", label: "Type of work", type: "select", required: true, options: ["Software / source code", "Logo and brand identity", "Designs and artwork", "Written content", "Photographs", "Video", "Product design", "Invention / process"], half: true },
      { key: "Created for", label: "Created under", type: "select", options: ["A contractor agreement", "A one-off commission", "Employment", "A freelance platform order"], half: true },
      { key: "Work", label: "Exactly what is being assigned", type: "textarea", rows: 3, required: true, placeholder: "The source code of the reports module, all SQL migration scripts, and the written handover guide, as delivered on 14 May 2026." },
      { key: "Consideration", label: "What was paid for it (₹)", type: "money", required: true, half: true },
      { key: "Already paid", label: "Payment status", type: "select", options: ["Paid in full", "Being paid on signing", "Part of a larger fee already agreed"], half: true },
      { key: "Rights", label: "Rights being transferred", type: "chips", options: ["Copyright", "All economic rights", "Right to modify and build on it", "Right to sub-licence", "Right to register a trademark", "Worldwide, for all time"] },
      { key: "Assignor keeps", label: "What the maker keeps", type: "textarea", rows: 2, placeholder: "May show the work in a portfolio with credit, but may not reuse the code." },
      { key: "Warranty", label: "What the maker promises", type: "chips", options: ["The work is original", "It does not copy anyone else's work", "No one else has a claim on it", "Any open-source parts are listed and freely licensed"] },
      { key: "Date", label: "Effective date", type: "date", half: true, default: isoToday() },
    ],
    refineChips: AGREEMENT_CHIPS,
    sample: {
      Assignor: "Nilesh Kulkarni", "Assignor address": "7 Shivaji Nagar, Pune 411005",
      Assignee: "Verma Tax Consultants", "Assignee address": "201 Sapna Sangeeta Road, Indore 452001",
      Type: "Software / source code", "Created for": "A contractor agreement",
      Work: "The complete source code of the reports module built for the billing software, all SQL migration scripts, the database schema changes, and the written handover guide, as delivered on 14 May 2026.",
      Consideration: "180000", "Already paid": "Paid in full",
      Rights: "Copyright|All economic rights|Right to modify and build on it|Worldwide, for all time",
      "Assignor keeps": "May describe the project and show screenshots in a portfolio with credit, but may not reuse or relicense the code.",
      Warranty: "The work is original|It does not copy anyone else's work|No one else has a claim on it|Any open-source parts are listed and freely licensed",
    },
  },
  "tool-86": {
    engine: "doc", credits: p("tool-86"), fileName: "settlement-agreement", cta: "Create settlement",
    intro: "A settlement that closes a dispute for good — what each side does, and a release so it cannot be reopened.",
    steps: ["State the dispute", "Set what each side does", "Sign it and close the matter"],
    related: ["tool-64", "tool-71", "tool-69", "tool-65"],
    fields: [
      { key: "Party A", label: "First party", profile: "businessName", required: true, half: true },
      { key: "Party A address", label: "Their address", profile: "address", half: true },
      { key: "Party B", label: "Second party", required: true, half: true },
      { key: "Party B address", label: "Their address", half: true },
      { key: "Dispute", label: "What the dispute was about", type: "textarea", rows: 3, required: true, placeholder: "An advance of ₹84,000 paid in January 2026 against an undelivered order of printed cartons, and a legal notice issued on 20 March 2026." },
      { key: "Claims", label: "What each side was claiming", type: "textarea", rows: 2, placeholder: "We claimed a refund with interest. They claimed the order was varied verbally and part-manufactured." },
      { key: "Settlement", label: "What is agreed now", type: "textarea", rows: 3, required: true, placeholder: "They refund ₹70,000 in two instalments and deliver 1,000 finished cartons; we withdraw the legal notice." },
      { key: "Amount", label: "Amount being paid (₹)", type: "money", half: true },
      { key: "Who pays", label: "Paid by", half: true, placeholder: "Agarwal Packaging" },
      { key: "Schedule", label: "Payment schedule", type: "rows",
        columns: [
          { key: "when", label: "By when", type: "date" },
          { key: "price", label: "Amount (₹)", type: "money" },
          { key: "mode", label: "Mode", type: "select", options: ["Bank transfer", "Cheque", "UPI", "Cash", "Goods in kind"] },
        ],
        defaultRows: [{ when: "", price: "", mode: "Bank transfer" }],
      },
      { key: "Withdrawals", label: "What gets withdrawn", type: "chips", options: ["Legal notice withdrawn", "Court case withdrawn", "Police complaint withdrawn", "Consumer complaint withdrawn", "Online reviews taken down"] },
      { key: "Release", label: "Release", type: "select", required: true, options: ["Both sides give up all claims on this matter", "Only the first party gives up its claims", "Only the second party gives up its claims"], half: true },
      { key: "Confidential", label: "Keep the terms confidential", type: "select", options: ["Yes — neither side discusses the terms", "No", "Yes, except as required by law"], half: true },
      { key: "No admission", label: "Admission of fault", type: "select", options: ["Neither side admits fault", "The second party admits the default", "Not stated"], half: true },
      { key: "If breached", label: "If the settlement is broken", type: "textarea", rows: 2, placeholder: "The whole original claim of ₹84,000 with interest revives at once and the release falls away." },
    ],
    compute: (v) => {
      const t = billTotals(rowsOf(v, "Schedule"), { qty: "_none", price: "price" });
      const amt = num(s(v, "Amount"));
      if (!t.total) return {};
      return { "Instalments add up to": inr(t.total), ...(amt && Math.abs(amt - t.total) > 1 ? { "Mismatch warning": `The settlement amount is ${inr(amt)} but the instalments add up to ${inr(t.total)}` } : {}) };
    },
    preview: (v) => {
      const t = billTotals(rowsOf(v, "Schedule"), { qty: "_none", price: "price" });
      const amt = num(s(v, "Amount"));
      if (!t.total) return null;
      return (
        <div className="rounded-xl bg-primary/5 p-3 text-sm">
          Instalments add up to <strong>{inr(t.total)}</strong>
          {amt && Math.abs(amt - t.total) > 1 ? <span className="ml-2 text-xs text-amber-600">Settlement amount is {inr(amt)}.</span> : null}
        </div>
      );
    },
    refineChips: AGREEMENT_CHIPS,
    sample: {
      "Party A": "Sharma Sweets", "Party A address": "9 Palasia, Indore 452001",
      "Party B": "Agarwal Packaging", "Party B address": "22 Industrial Estate, Dewas Naka, Indore 452015",
      Dispute: "An advance of ₹84,000 paid on 14 January 2026 against purchase order PO-2026-087 for 5,000 printed gift cartons which were never delivered, and a legal notice issued on 20 March 2026.",
      Claims: "Sharma Sweets claimed a full refund with interest at 12%. Agarwal Packaging claimed the design was changed verbally and that 1,200 cartons had already been printed.",
      Settlement: "Agarwal Packaging refunds ₹70,000 in two instalments and delivers the 1,200 cartons already printed at no further charge. Sharma Sweets withdraws the legal notice and makes no further claim.",
      Amount: "70000", "Who pays": "Agarwal Packaging",
      Schedule: [
        { when: "", price: "40000", mode: "Bank transfer" },
        { when: "", price: "30000", mode: "Bank transfer" },
      ],
      Withdrawals: "Legal notice withdrawn",
      Release: "Both sides give up all claims on this matter",
      Confidential: "Yes, except as required by law", "No admission": "Neither side admits fault",
      "If breached": "If any instalment is missed by more than 15 days, the full original claim of ₹84,000 with interest at 12% a year revives at once and this release falls away.",
    },
  },
  "tool-87": {
    engine: "doc", credits: p("tool-87"), fileName: "bill-of-sale", cta: "Create bill of sale",
    intro: "A bill of sale proving goods or a vehicle changed hands — who sold, who bought, for how much, and in what condition.",
    steps: ["Describe the item", "Enter the price and condition", "Both sides sign a copy"],
    related: ["tool-68", "tool-98", "tool-74", "tool-90"],
    fields: [
      { key: "Seller", label: "Seller's name", profile: "ownerName", required: true, half: true },
      { key: "Seller address", label: "Seller's address", profile: "address", half: true },
      { key: "Buyer", label: "Buyer's name", required: true, half: true },
      { key: "Buyer address", label: "Buyer's address", half: true },
      { key: "Type", label: "What is being sold", type: "select", required: true, options: ["Vehicle", "Machinery / equipment", "Furniture & fixtures", "Stock in trade", "Livestock", "Electronics", "Business as a going concern", "Other goods"], half: true },
      { key: "Item", label: "Full description", type: "textarea", rows: 2, required: true, placeholder: "Tata Ace Gold, 2019 model, registration MP 09 KL 4421, chassis no. …, engine no. …, odometer 86,400 km." },
      { key: "Identifiers", label: "Registration / serial / engine number", half: true },
      { key: "Price", label: "Sale price (₹)", type: "money", required: true, half: true },
      { key: "Paid how", label: "Paid by", type: "select", options: ["Cash", "Bank transfer / NEFT", "Cheque", "UPI", "Part cash, part transfer"], half: true },
      { key: "Date", label: "Date of sale", type: "date", half: true, default: isoToday() },
      { key: "Condition", label: "Condition sold in", type: "select", required: true, options: ["As is, where is — no warranty", "Working condition warranted", "With the balance manufacturer warranty", "Known faults listed below"], half: true },
      { key: "Faults", label: "Known faults disclosed", type: "textarea", rows: 2, placeholder: "Clutch plate due for replacement; small dent on the left door." },
      { key: "Free of dues", label: "Seller confirms", type: "chips", options: ["No loan or hypothecation", "No pending challans or fines", "No tax or dues outstanding", "Clear title and right to sell", "Insurance transferred"] },
      { key: "Delivery", label: "Possession handed over on", type: "date", half: true },
      { key: "Witnesses", label: "Witness names", half: true },
    ],
    refineChips: ["Add an as-is disclaimer", "Add a witness block", "Simpler language", "Add a payment receipt line"],
    sample: {
      Seller: "Anil Sharma", "Seller address": "9 Palasia, Indore 452001",
      Buyer: "Mahesh Yadav", "Buyer address": "41 Sanwer Road, Indore 452015",
      Type: "Vehicle",
      Item: "Tata Ace Gold goods carrier, 2019 model, registration no. MP 09 KL 4421, white, diesel, odometer reading 86,400 km at the time of sale.",
      Identifiers: "MP 09 KL 4421", Price: "265000", "Paid how": "Bank transfer / NEFT",
      Condition: "Known faults listed below",
      Faults: "Clutch plate due for replacement within about 2,000 km. Small dent on the left door. Air conditioning not working.",
      "Free of dues": "No loan or hypothecation|No pending challans or fines|No tax or dues outstanding|Clear title and right to sell",
      Witnesses: "Rekha Sharma and Imran Shaikh",
    },
  },
  "tool-88": {
    engine: "doc", credits: p("tool-88"), fileName: "lien-notice", cta: "Write lien notice",
    intro: "A notice that you are holding someone's goods until they pay — common for repairs, storage and job work.",
    steps: ["State what you hold and why", "Give a deadline to pay", "Send it and keep proof"],
    related: ["tool-5", "tool-64", "tool-47", "tool-43"],
    fields: [
      BUSINESS, SENDER,
      { key: "To", label: "Goods belong to", required: true, half: true },
      { key: "To address", label: "Their address", half: true },
      { key: "Goods", label: "What you are holding", type: "textarea", rows: 2, required: true, placeholder: "40 MS sheets, 2 mm, sent for bending under challan DC-2026-031 dated 12 March 2026." },
      { key: "Where", label: "Where it is held", half: true, placeholder: "Our workshop at Gat 212, Chakan" },
      { key: "Since", label: "Held since", type: "date", half: true },
      { key: "Why", label: "Why you have a lien", type: "select", required: true, options: ["Repair charges unpaid", "Job-work charges unpaid", "Storage charges unpaid", "Freight unpaid", "Goods supplied unpaid", "Service charges unpaid"], half: true },
      { key: "Amount", label: "Amount owed (₹)", type: "money", required: true, half: true },
      { key: "Invoice", label: "Against invoice / challan", half: true },
      { key: "Due since", label: "Due since", type: "date", half: true },
      { key: "Storage charge", label: "Storage charge while held", half: true, placeholder: "₹200 a day from the date of this notice" },
      { key: "Deadline", label: "Pay and collect by", type: "date", required: true, half: true, default: inDays(15) },
      { key: "If ignored", label: "If they do not pay", type: "select", options: ["Goods will be sold to recover the dues", "Matter will go to court", "Goods will be sold after a further 30 days' notice"], half: true },
    ],
    compute: (v) => {
      const d = daysFrom(s(v, "Due since"));
      return Number.isFinite(d) && d < 0 ? { "Days overdue": String(-d) } : {};
    },
    refineChips: LETTER_CHIPS,
    sample: {
      Business: "Hitesh Fabricators", Sender: "Hitesh Jadhav, Proprietor",
      To: "Ratna Steel Traders", "To address": "Plot 7, Bhosari MIDC, Pune 411026",
      Goods: "Forty MS sheets of 2 mm thickness sent for bending and fabrication under delivery challan DC-2026-031 dated 12 March 2026, along with four bending fixtures.",
      Where: "Our workshop at Gat 212, Chakan, Pune 410501",
      Why: "Job-work charges unpaid", Amount: "96000", Invoice: "HF-2026-204",
      "Storage charge": "₹200 a day from the date of this notice",
      "If ignored": "Goods will be sold after a further 30 days' notice",
    },
  },
  "tool-89": {
    engine: "doc", credits: p("tool-89"), fileName: "completion-certificate", cta: "Create certificate",
    intro: "A completion certificate for a job finished or a course passed, worded so it can be shown to anyone.",
    steps: ["Enter what was completed", "Add dates and result", "Print and sign it"],
    related: ["tool-57", "tool-76", "tool-52", "tool-83"],
    fields: [
      BUSINESS,
      { key: "Type", label: "Certificate for", type: "select", required: true, options: ["Training completed", "Course completed", "Project completed", "Internship completed", "Work completed at site", "Apprenticeship completed"], half: true },
      { key: "Recipient", label: "Awarded to", required: true, half: true, placeholder: "Anjali Deshmukh" },
      { key: "Title", label: "What was completed", required: true, placeholder: "GST returns and TDS filing — in-house training programme" },
      { key: "From", label: "From", type: "date", half: true },
      { key: "To", label: "To", type: "date", half: true },
      { key: "Hours", label: "Duration", half: true, placeholder: "29 hours over 2 weeks" },
      { key: "Covered", label: "What it covered", type: "textarea", rows: 2, placeholder: "GSTR-1 and 3B filing end to end, TDS quarterly returns, and handling notices." },
      { key: "Result", label: "Result", type: "select", options: ["Completed successfully", "Completed with distinction", "Completed — assessment passed", "Completed — no assessment", "Completed satisfactorily"], half: true },
      { key: "Certificate number", label: "Certificate number", half: true, placeholder: "VTC/TR/2026/014" },
      { key: "Signed by", label: "Signed by", profile: "ownerName", half: true },
      { key: "Designation", label: "Their designation", half: true, placeholder: "Partner" },
      { key: "Place", label: "Place", profile: "city", half: true },
    ],
    refineChips: ["Shorter — fits one page", "More formal", "Add a verification line", "Translate to Hindi"],
    sample: {
      Business: "Verma Tax Consultants", Type: "Training completed", Recipient: "Anjali Deshmukh",
      Title: "GST returns and TDS filing — in-house training programme",
      Hours: "29 hours over 2 weeks",
      Covered: "GSTR-1 and GSTR-3B filing end to end, quarterly TDS returns, reconciliation with books, and handling routine notices.",
      Result: "Completed — assessment passed", "Certificate number": "VTC/TR/2026/014",
      "Signed by": "Suresh Verma", Designation: "Partner", Place: "Indore",
    },
  },
  "tool-90": {
    engine: "doc", credits: p("tool-90"), fileName: "authorisation-letter", cta: "Write authorisation letter",
    intro: "A letter authorising someone to collect, sign or act for you once — narrower and simpler than a power of attorney.",
    steps: ["Name who is authorised", "State exactly what for", "Sign it and attach your ID copy"],
    related: ["tool-72", "tool-63", "tool-87", "tool-74"],
    fields: [
      { key: "From", label: "Your name", profile: "ownerName", required: true, half: true },
      { key: "Business", label: "Business name, if any", profile: "businessName", half: true },
      { key: "From address", label: "Your address", profile: "address", half: true },
      { key: "ID", label: "Your ID reference", half: true, placeholder: "PAN ABCPS4321K" },
      { key: "Authorised person", label: "Who you are authorising", required: true, half: true },
      { key: "Their ID", label: "Their ID reference", half: true, placeholder: "Aadhaar ending 4421" },
      { key: "Relationship", label: "Their relation to you", half: true, placeholder: "Employee — accounts executive" },
      { key: "To", label: "Addressed to", required: true, half: true, placeholder: "The Branch Manager, HDFC Bank, Palasia" },
      { key: "For", label: "What they may do", type: "textarea", rows: 3, required: true, placeholder: "Collect the chequebook and account statements for current account 50200012345678 on my behalf." },
      { key: "Valid on", label: "Valid on / from", type: "date", half: true, default: isoToday() },
      { key: "Valid till", label: "Valid till", type: "date", half: true },
      { key: "One time", label: "How often", type: "select", options: ["This one time only", "Until the valid-till date", "Until I withdraw it in writing"], half: true },
      { key: "Enclosures", label: "Documents attached", type: "chips", options: ["Copy of my ID", "Copy of their ID", "Their photograph", "Board resolution", "Original receipt / token"] },
    ],
    refineChips: ["Shorter", "More formal", "Narrow the authority", "Translate to Hindi"],
    sample: {
      From: "Anil Sharma", Business: "Sharma Sweets", "From address": "9 Palasia, Indore 452001",
      ID: "PAN ABCPS4321K", "Authorised person": "Anjali Deshmukh", "Their ID": "Aadhaar ending 4421",
      Relationship: "Employee — accounts executive",
      To: "The Branch Manager, HDFC Bank, Palasia branch, Indore",
      For: "Collect the chequebook and the account statements for April 2025 to March 2026 for current account no. 50200012345678 held in the name of Sharma Sweets, and sign the acknowledgement for receipt of the same.",
      "One time": "This one time only",
      Enclosures: "Copy of my ID|Copy of their ID",
    },
  },
  "tool-91": {
    engine: "doc", credits: p("tool-91"), fileName: "attendance-register", cta: "Create register",
    intro: "A printable attendance register for the month, with the marking code and a summary row for payroll.",
    steps: ["Add your staff", "Print the month's sheet", "Mark it daily and file it"],
    related: ["tool-50", "tool-92", "tool-56", "tool-93"],
    fields: [
      BUSINESS,
      { key: "Month", label: "Month", required: true, half: true, placeholder: "April 2026" },
      { key: "Location", label: "Branch / site", profile: "city", half: true },
      { key: "Staff", label: "Staff", type: "rows", required: true,
        columns: [
          { key: "name", label: "Name" },
          { key: "id", label: "Employee ID" },
          { key: "role", label: "Role" },
          { key: "shift", label: "Shift", type: "select", options: ["General", "Morning", "Evening", "Night", "Rotating"] },
        ],
        defaultRows: [{ name: "", id: "", role: "", shift: "General" }],
      },
      { key: "Week off", label: "Weekly off", type: "select", options: ["Sunday", "Monday", "Tuesday", "Rotating", "No fixed off"], half: true },
      { key: "Holidays", label: "Holidays this month", half: true, placeholder: "14 April — Dr Ambedkar Jayanti" },
      { key: "Codes", label: "Marking codes to use", type: "chips", options: ["P — present", "A — absent", "L — paid leave", "LOP — unpaid leave", "H — holiday", "WO — weekly off", "HD — half day", "OD — on duty outside"] },
      { key: "Hours", label: "Standard hours a day", type: "number", half: true, default: "8" },
      { key: "Approver", label: "Verified by", profile: "ownerName", half: true },
    ],
    compute: (v) => {
      const rows = rowsOf(v, "Staff").filter((r) => r.name?.trim());
      return rows.length ? { "Staff count": String(rows.length) } : {};
    },
    refineChips: FORM_CHIPS,
    sample: {
      Business: "Sharma Sweets", Month: "April 2026", Location: "Palasia outlet, Indore",
      Staff: [
        { name: "Imran Shaikh", id: "EMP-011", role: "Counter salesman", shift: "Morning" },
        { name: "Sunita Rao", id: "EMP-014", role: "Counter salesman", shift: "Evening" },
        { name: "Ramesh Kale", id: "EMP-019", role: "Kitchen helper", shift: "General" },
        { name: "Anjali Deshmukh", id: "EMP-042", role: "Accounts executive", shift: "General" },
      ],
      "Week off": "Rotating", Holidays: "14 April — Dr Ambedkar Jayanti",
      Codes: "P — present|A — absent|L — paid leave|LOP — unpaid leave|WO — weekly off|HD — half day",
      Hours: "8", Approver: "Anil Sharma",
    },
  },
  "tool-92": {
    engine: "doc", credits: p("tool-92"), fileName: "time-sheet", cta: "Create time sheet",
    intro: "A time sheet recording hours against jobs or clients, with the totals and the amount if you bill by the hour.",
    steps: ["Enter the hours by job", "Check the total", "Send it for approval or billing"],
    related: ["tool-91", "tool-46", "tool-83", "tool-75"],
    fields: [
      BUSINESS,
      { key: "Name", label: "Whose time sheet", profile: "ownerName", required: true, half: true },
      { key: "Period", label: "For the period", required: true, half: true, placeholder: "Week of 6–11 April 2026" },
      { key: "Rate", label: "Billing rate per hour (₹)", type: "money", half: true, help: "Leave blank if you are not billing by the hour." },
      { key: "Entries", label: "Hours worked", type: "rows", required: true,
        columns: [
          { key: "date", label: "Date", type: "date" },
          { key: "job", label: "Client / job" },
          { key: "task", label: "What you did" },
          { key: "hours", label: "Hours", type: "number" },
          { key: "billable", label: "Billable?", type: "select", options: ["Yes", "No"] },
        ],
        defaultRows: [{ date: "", job: "", task: "", hours: "", billable: "Yes" }],
      },
      { key: "Approver", label: "Approved by", half: true },
      { key: "Notes", label: "Notes", type: "textarea", rows: 2 },
    ],
    compute: (v) => {
      const rows = rowsOf(v, "Entries").filter((r) => num(r.hours));
      if (!rows.length) return {};
      const total = rows.reduce((a, r) => a + num(r.hours), 0);
      const billable = rows.filter((r) => r.billable !== "No").reduce((a, r) => a + num(r.hours), 0);
      const rate = num(s(v, "Rate"));
      const byJob = new Map<string, number>();
      for (const r of rows) byJob.set(r.job || "Unassigned", (byJob.get(r.job || "Unassigned") ?? 0) + num(r.hours));
      return {
        "Total hours": String(total),
        "Billable hours": String(billable),
        "Hours by job": [...byJob].map(([j, h]) => `${j}: ${h}`).join("; "),
        ...(rate ? { "Amount billable": inr(billable * rate) } : {}),
      };
    },
    preview: (v) => {
      const rows = rowsOf(v, "Entries").filter((r) => num(r.hours));
      if (!rows.length) return null;
      const total = rows.reduce((a, r) => a + num(r.hours), 0);
      const billable = rows.filter((r) => r.billable !== "No").reduce((a, r) => a + num(r.hours), 0);
      const rate = num(s(v, "Rate"));
      return (
        <div className="rounded-xl bg-primary/5 p-3 text-sm">
          <strong>{total}</strong> hours · {billable} billable
          {rate ? <span className="ml-2">→ {inr(billable * rate)}</span> : null}
        </div>
      );
    },
    refineChips: FORM_CHIPS,
    sample: {
      Business: "Kulkarni Softworks", Name: "Nilesh Kulkarni", Period: "Week of 6–11 April 2026",
      Rate: "1200",
      Entries: [
        { date: "", job: "Verma Tax — reports module", task: "Report designs and client review", hours: "6", billable: "Yes" },
        { date: "", job: "Verma Tax — reports module", task: "Data migration scripts", hours: "9", billable: "Yes" },
        { date: "", job: "Internal", task: "Server maintenance", hours: "3", billable: "No" },
        { date: "", job: "Sharma Sweets — billing fix", task: "GST rounding bug", hours: "4", billable: "Yes" },
      ],
      Approver: "Suresh Verma",
      Notes: "Migration took longer than estimated because three years of data had duplicate entries.",
    },
  },
  "tool-93": {
    engine: "doc", credits: p("tool-93"), fileName: "leave-letter", cta: "Write leave letter",
    intro: "A leave application with the dates, the reason and who will cover the work while you are away.",
    steps: ["Enter the dates and reason", "Say who will cover", "Send it to your manager"],
    related: ["tool-91", "tool-54", "tool-99", "tool-103"],
    fields: [
      { key: "Name", label: "Your name", profile: "ownerName", required: true, half: true },
      { key: "Employee ID", label: "Employee ID", half: true },
      { key: "Designation", label: "Your designation", half: true },
      { key: "To", label: "Addressed to", required: true, half: true, placeholder: "Suresh Verma, Partner" },
      { key: "Type", label: "Type of leave", type: "select", required: true, options: ["Casual leave", "Sick leave", "Earned / privilege leave", "Maternity leave", "Paternity leave", "Unpaid leave", "Half day", "Work from home"], half: true },
      { key: "From", label: "From", type: "date", required: true, half: true, default: inDays(7) },
      { key: "To date", label: "To", type: "date", required: true, half: true, default: inDays(9) },
      { key: "Reason", label: "Reason", type: "textarea", rows: 2, required: true, placeholder: "My sister's wedding in Bhopal; I need to travel a day earlier to help with arrangements." },
      { key: "Handover", label: "Who will cover your work", type: "textarea", rows: 2, placeholder: "Rohit will handle the GST filings for Deepak Traders and Metro Hardware. Notes shared with him." },
      { key: "Reachable", label: "Reachable on", half: true, placeholder: "98260 00000 — available for urgent calls" },
      { key: "Balance", label: "Leave balance, if you know it", half: true, placeholder: "8 casual leaves left" },
    ],
    compute: (v) => {
      const a = s(v, "From");
      const b = s(v, "To date");
      if (!a || !b) return {};
      const days = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1;
      return days > 0 ? { "Days of leave": String(days) } : {};
    },
    preview: (v) => {
      const a = s(v, "From");
      const b = s(v, "To date");
      if (!a || !b) return null;
      const days = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1;
      return days > 0 ? <div className="rounded-xl bg-primary/5 p-3 text-sm">Leave for <strong>{days} day{days > 1 ? "s" : ""}</strong></div> : null;
    },
    refineChips: ["Shorter", "More formal", "Add a doctor's note mention", "Translate to Hindi"],
    sample: {
      Name: "Anjali Deshmukh", "Employee ID": "EMP-042", Designation: "Accounts executive",
      To: "Suresh Verma, Partner", Type: "Casual leave",
      Reason: "My sister's wedding in Bhopal. I need to travel a day earlier to help with the arrangements.",
      Handover: "Rohit Patil will handle the GST filings for Deepak Traders and Metro Hardware. Working notes and login details have been shared with him.",
      Reachable: "98260 00000 — available for urgent calls", Balance: "8 casual leaves left this year",
    },
  },
  "tool-94": {
    engine: "doc", credits: p("tool-94"), fileName: "joining-letter", cta: "Write joining letter",
    intro: "A joining letter confirming someone has started — role, date, reporting line and what to bring on day one.",
    steps: ["Confirm role and date", "List what to bring", "Send it before they join"],
    related: ["tool-51", "tool-58", "tool-57", "tool-102"],
    fields: [
      BUSINESS,
      { key: "Employee", label: "Employee name", required: true, half: true },
      { key: "Role", label: "Role", required: true, half: true },
      { key: "Employee ID", label: "Employee ID", half: true },
      { key: "Joined on", label: "Date of joining", type: "date", required: true, half: true, default: isoToday() },
      { key: "Reports to", label: "Reports to", half: true },
      { key: "Department", label: "Department", half: true },
      { key: "Location", label: "Place of work", profile: "city", half: true },
      { key: "Hours", label: "Working days & hours", half: true, placeholder: "Mon–Sat, 10 am to 7 pm" },
      { key: "CTC", label: "Annual CTC (₹)", type: "money", half: true },
      { key: "Probation", label: "Probation", type: "select", options: ["No probation", "3 months", "6 months"], half: true },
      { key: "Bring", label: "Documents to bring", type: "chips", options: ["PAN card copy", "Aadhaar copy", "Bank passbook / cancelled cheque", "Passport photos", "Education certificates", "Previous experience letter", "Last 3 salary slips", "Address proof"] },
      { key: "Day one", label: "Day-one instructions", type: "textarea", rows: 2, placeholder: "Report at 10 am to the Palasia office. Ask for Rohit at the reception. Induction runs till lunch." },
      SENDER,
    ],
    refineChips: HR_CHIPS,
    sample: {
      Business: "Verma Tax Consultants", Employee: "Anjali Deshmukh", Role: "Accounts executive",
      "Employee ID": "EMP-042", "Reports to": "Rohit Patil, Finance manager", Department: "Accounts",
      Location: "Indore", Hours: "Mon–Sat, 10 am to 7 pm", CTC: "444000", Probation: "3 months",
      Bring: "PAN card copy|Aadhaar copy|Bank passbook / cancelled cheque|Passport photos|Education certificates|Previous experience letter",
      "Day one": "Report at 10 am to the Sapna Sangeeta Road office and ask for Rohit at the reception. Induction and software setup run till lunch.",
      Sender: "Suresh Verma, Partner",
    },
  },
  "tool-95": {
    engine: "doc", credits: p("tool-95"), fileName: "exit-interview", cta: "Create exit form",
    intro: "An exit interview form that gets honest answers out of someone leaving, while there is still time to learn from it.",
    steps: ["Set the questions", "Sit with them and fill it", "Act on what repeats"],
    related: ["tool-54", "tool-52", "tool-103", "tool-53"],
    fields: [
      BUSINESS,
      { key: "Employee", label: "Employee name", required: true, half: true },
      { key: "Designation", label: "Designation", half: true },
      { key: "Department", label: "Department", half: true },
      { key: "Joined", label: "Joined on", type: "date", half: true },
      { key: "Last day", label: "Last working day", type: "date", required: true, half: true, default: isoToday() },
      { key: "Interviewer", label: "Interview taken by", profile: "ownerName", half: true },
      { key: "Main reason", label: "Main reason for leaving", type: "select", required: true, options: ["Better pay elsewhere", "Better role or growth", "Problem with the manager", "Work pressure or hours", "Personal or family reasons", "Relocation", "Health", "Higher studies", "Started own business", "Not stated"], half: true },
      { key: "Going to", label: "Where they are going", half: true, placeholder: "A larger CA firm in Pune" },
      { key: "Ask about", label: "Areas to ask about", type: "chips", options: ["The job itself", "Pay and benefits", "Their manager", "Training and growth", "Workload and hours", "Team and culture", "Tools and systems", "Safety", "What would have made them stay"] },
      { key: "Rate areas", label: "Rate each area out of 5", type: "rows",
        columns: [
          { key: "area", label: "Area" },
          { key: "rating", label: "Rating /5", type: "number" },
          { key: "comment", label: "Their comment" },
        ],
        defaultRows: [
          { area: "The job itself", rating: "", comment: "" },
          { area: "Pay and benefits", rating: "", comment: "" },
          { area: "Manager and support", rating: "", comment: "" },
          { area: "Growth and training", rating: "", comment: "" },
        ],
      },
      { key: "Would return", label: "Would they come back", type: "select", options: ["Yes", "Maybe", "No", "Did not say"], half: true },
      { key: "Recommend", label: "Would they recommend us as an employer", type: "select", options: ["Yes", "Maybe", "No", "Did not say"], half: true },
      { key: "Their words", label: "Anything they want recorded", type: "textarea", rows: 2 },
    ],
    compute: (v) => {
      const rows = rowsOf(v, "Rate areas").filter((r) => num(r.rating));
      if (!rows.length) return {};
      const avg = rows.reduce((a, r) => a + num(r.rating), 0) / rows.length;
      const low = rows.filter((r) => num(r.rating) <= 2).map((r) => r.area).filter(Boolean);
      return { "Average rating": `${avg.toFixed(2)} out of 5`, ...(low.length ? { "Rated 2 or below": low.join("; ") } : {}) };
    },
    refineChips: FORM_CHIPS,
    sample: {
      Business: "Ratna Steel Traders", Employee: "Rohit Patil", Designation: "Senior sales executive",
      Department: "Sales", Interviewer: "Kavita Ratna", "Main reason": "Better role or growth",
      "Going to": "A larger steel distributor in Nashik, as area manager",
      "Ask about": "The job itself|Pay and benefits|Their manager|Training and growth|What would have made them stay",
      "Rate areas": [
        { area: "The job itself", rating: "4", comment: "Liked the independence on dealer accounts" },
        { area: "Pay and benefits", rating: "3", comment: "Fair, but no clear incentive structure" },
        { area: "Manager and support", rating: "4", comment: "Good support, decisions sometimes slow" },
        { area: "Growth and training", rating: "2", comment: "No defined path from executive to manager here" },
      ],
      "Would return": "Maybe", Recommend: "Yes",
      "Their words": "A written incentive plan and a clear route to a manager role would have kept me another two years.",
    },
  },
  "tool-96": {
    engine: "doc", credits: p("tool-96"), fileName: "job-description", cta: "Write job description",
    intro: "A job description that says what the person will actually do all day, so the right people apply.",
    steps: ["Enter the role and duties", "Set what is essential", "Post it or send it to a consultant"],
    related: ["tool-29", "tool-51", "tool-55", "tool-28"],
    fields: [
      BUSINESS, INDUSTRY,
      { key: "Role", label: "Job title", required: true, half: true, placeholder: "Accounts executive" },
      { key: "Reports to", label: "Reports to", half: true },
      { key: "Location", label: "Location", profile: "city", half: true },
      { key: "Type", label: "Employment type", type: "select", options: ["Full time", "Part time", "Contract", "Internship", "Apprenticeship"], half: true },
      { key: "Purpose", label: "Why the role exists, in one line", half: true, placeholder: "Keep client books and filings correct and on time." },
      { key: "Duties", label: "What they will do day to day", type: "textarea", rows: 4, required: true, placeholder: "Book purchase and sales entries in Tally; prepare and file GSTR-1 and 3B for 40 clients; reconcile bank statements monthly…" },
      { key: "Essential", label: "Must have", type: "textarea", rows: 2, required: true, placeholder: "B.Com, 2+ years in a CA firm or accounts role, hands-on Tally and Excel, written Hindi and English." },
      { key: "Desirable", label: "Good to have", type: "textarea", rows: 2, placeholder: "GST certification, experience with notices, exposure to TDS returns." },
      { key: "Experience", label: "Experience wanted", type: "select", options: ["Fresher", "0–2 years", "2–5 years", "5–8 years", "8+ years"], half: true },
      { key: "Salary", label: "Salary range", half: true, placeholder: "₹3.6–4.8 lakh a year, depending on experience" },
      { key: "Benefits", label: "What you offer", type: "chips", options: ["EPF", "ESI", "Health insurance", "Paid leave", "Annual bonus", "Performance incentive", "Training paid for", "Flexible hours", "Travel allowance"] },
      { key: "Growth", label: "Where the role can lead", half: true, placeholder: "Senior executive in 2 years, then team lead" },
      { key: "Apply how", label: "How to apply", half: true, placeholder: "WhatsApp your CV to 98260 00000" },
    ],
    refineChips: ["Shorter — for a job board", "Less corporate", "Add a company intro", "Translate to Hindi"],
    sample: {
      Business: "Verma Tax Consultants", Industry: "GST & accounting services",
      Role: "Accounts executive", "Reports to": "Finance manager", Location: "Indore", Type: "Full time",
      Purpose: "Keep client books and statutory filings correct and on time.",
      Duties: "Book purchase and sales entries in Tally for about 40 small-business clients; prepare and file GSTR-1 and GSTR-3B each month; reconcile bank statements; prepare quarterly TDS returns; follow up with clients for missing bills; and draft replies to routine GST notices under supervision.",
      Essential: "B.Com or equivalent, two or more years in a CA firm or an accounts role, hands-on Tally and Excel, and comfortable writing in both Hindi and English.",
      Desirable: "GST certification, experience handling notices, and exposure to TDS quarterly returns.",
      Experience: "2–5 years", Salary: "₹3.6–4.8 lakh a year, depending on experience",
      Benefits: "EPF|Paid leave|Annual bonus|Training paid for",
      Growth: "Senior executive in about 2 years, then team lead for a client group",
      "Apply how": "WhatsApp your CV to 98260 00000 or email it to hr@vermatax.in",
    },
  },
  "tool-97": {
    engine: "doc", credits: p("tool-97"), fileName: "purchase-requisition", cta: "Create requisition",
    intro: "An internal request to buy something, with the reason and the budget, for an approver to sign before a PO goes out.",
    steps: ["List what you need and why", "Add the estimated cost", "Send it for approval"],
    related: ["tool-42", "tool-77", "tool-46", "tool-76"],
    fields: [
      BUSINESS,
      { key: "Requisition number", label: "Requisition number", half: true, placeholder: "PR-2026-041" },
      { key: "Date", label: "Date", type: "date", half: true, default: isoToday() },
      { key: "Raised by", label: "Raised by", profile: "ownerName", required: true, half: true },
      { key: "Department", label: "Department", half: true },
      { key: "Items", label: "What you need", type: "rows", required: true,
        columns: [
          { key: "desc", label: "Item" },
          { key: "qty", label: "Qty", type: "number" },
          { key: "unit", label: "Unit", type: "select", options: ["Nos", "Box", "Kg", "Litre", "Set", "Pack"] },
          { key: "price", label: "Estimated rate (₹)", type: "money" },
        ],
        defaultRows: [{ desc: "", qty: "1", unit: "Nos", price: "" }],
      },
      { key: "Why", label: "Why it is needed", type: "textarea", rows: 2, required: true, placeholder: "Existing racking is full; the festival stock arriving on 20 April has nowhere to go." },
      { key: "Needed by", label: "Needed by", type: "date", half: true, default: inDays(21) },
      { key: "Urgency", label: "Urgency", type: "select", options: ["Routine", "Needed this month", "Urgent — work is held up", "Emergency — safety or breakdown"], half: true },
      { key: "Budget head", label: "Budget head", half: true, placeholder: "Capital expenditure — storage" },
      { key: "Budget left", label: "Budget still available (₹)", type: "money", half: true },
      { key: "Suggested suppliers", label: "Suppliers you suggest", half: true, placeholder: "Hitesh Fabricators, Shree Steel" },
      { key: "Approver", label: "To be approved by", half: true },
    ],
    compute: (v) => {
      const t = billTotals(rowsOf(v, "Items"));
      const budget = num(s(v, "Budget left"));
      if (!t.total) return {};
      return {
        "Estimated cost": inr(t.total),
        ...(budget ? { "Against budget": `${inr(t.total)} of ${inr(budget)} available${t.total > budget ? " — over budget" : ""}` } : {}),
      };
    },
    preview: (v) => {
      const t = billTotals(rowsOf(v, "Items"));
      const budget = num(s(v, "Budget left"));
      if (!t.total) return null;
      return (
        <div className="rounded-xl bg-primary/5 p-3 text-sm">
          Estimated cost: <strong>{inr(t.total)}</strong>
          {budget ? <span className={t.total > budget ? "ml-2 text-amber-600" : "ml-2 text-muted-foreground"}>{t.total > budget ? `Over the ${inr(budget)} budget by ${inr(t.total - budget)}` : `Within the ${inr(budget)} budget`}</span> : null}
        </div>
      );
    },
    refineChips: FORM_CHIPS,
    sample: {
      Business: "Sharma Sweets", "Requisition number": "PR-2026-041", "Raised by": "Imran Shaikh",
      Department: "Store / godown",
      Items: [
        { desc: "MS storage racking, 3 tiers", qty: "14", unit: "Nos", price: "2400" },
        { desc: "Plastic crates, 50 litre", qty: "30", unit: "Nos", price: "420" },
      ],
      Why: "The existing racking in Godown 3 is full. Festival stock arriving on 20 April has nowhere to be stored and is currently stacked on the floor, which is a damage and pest risk.",
      Urgency: "Needed this month", "Budget head": "Capital expenditure — storage",
      "Budget left": "60000", "Suggested suppliers": "Hitesh Fabricators, Shree Steel",
      Approver: "Anil Sharma, Proprietor",
    },
  },
  "tool-98": {
    engine: "doc", credits: p("tool-98"), fileName: "receipt", cta: "Create receipt",
    intro: "A simple money receipt for a payment taken — cash, UPI or cheque — with what it was for and what is still due.",
    steps: ["Enter the amount and what for", "Note how it was paid", "Hand over or send the receipt"],
    related: ["tool-1", "tool-44", "tool-87", "tool-80"],
    fields: [
      BUSINESS,
      { key: "Business address", label: "Your address", profile: "address", half: true },
      { key: "Receipt number", label: "Receipt number", half: true, placeholder: "RC-2026-512" },
      { key: "Date", label: "Date", type: "date", half: true, default: isoToday() },
      { key: "Received from", label: "Received from", required: true, half: true, ctxKey: "clientName" },
      { key: "Amount", label: "Amount received (₹)", type: "money", required: true, half: true },
      { key: "For", label: "What it is for", required: true, half: true, placeholder: "Advance against order PO-2026-087" },
      { key: "Against", label: "Against invoice / order", half: true, ctxKey: "invoiceNumber" },
      { key: "Mode", label: "Paid by", type: "select", required: true, options: ["Cash", "UPI", "Bank transfer / NEFT", "Cheque", "Card", "Demand draft"], half: true },
      { key: "Reference", label: "Transaction / cheque number", half: true, placeholder: "UPI 412345678901" },
      { key: "Total due", label: "Total amount due (₹)", type: "money", half: true, help: "Fill this to show the balance left." },
      { key: "Received by", label: "Received by", profile: "ownerName", half: true },
    ],
    compute: (v) => {
      const got = num(s(v, "Amount"));
      const due = num(s(v, "Total due"));
      if (!got) return {};
      return { ...(due ? { "Balance still due": inr(Math.max(0, due - got)) } : {}), "Amount in words": "" };
    },
    preview: (v) => {
      const got = num(s(v, "Amount"));
      const due = num(s(v, "Total due"));
      if (!got || !due) return null;
      return <div className="rounded-xl bg-primary/5 p-3 text-sm">Received {inr(got)} of {inr(due)} — balance <strong>{inr(Math.max(0, due - got))}</strong></div>;
    },
    refineChips: FORM_CHIPS,
    sample: {
      Business: "Sharma Sweets", "Business address": "9 Palasia, Indore 452001",
      "Receipt number": "RC-2026-512", "Received from": "Deepak Traders", Amount: "25000",
      For: "Advance against the Diwali gift box order", Against: "QT-2026-014",
      Mode: "UPI", Reference: "UPI 412345678901", "Total due": "61425", "Received by": "Anil Sharma",
    },
  },
  "tool-99": {
    engine: "doc", credits: p("tool-99"), fileName: "memo", cta: "Write memo",
    intro: "An internal memo that says the thing clearly, names who must do what, and gives a date.",
    steps: ["Say what has changed", "List who does what by when", "Put it on the noticeboard or group"],
    related: ["tool-104", "tool-100", "tool-91", "tool-15"],
    fields: [
      BUSINESS,
      { key: "To", label: "To", required: true, half: true, placeholder: "All counter and kitchen staff" },
      { key: "From", label: "From", profile: "ownerName", required: true, half: true },
      { key: "Date", label: "Date", type: "date", half: true, default: isoToday() },
      { key: "Reference", label: "Memo number", half: true, placeholder: "MEMO/2026/07" },
      { key: "Subject", label: "Subject", required: true, placeholder: "Counter closing procedure from 15 April" },
      { key: "Type", label: "What kind of memo", type: "select", options: ["New rule or procedure", "Change to an existing rule", "Reminder", "Announcement", "Warning to the whole team", "Appreciation"], half: true },
      { key: "Message", label: "What you want to say", type: "textarea", rows: 4, required: true, placeholder: "From 15 April, the cash counter must be tallied and signed off by two people before closing." },
      { key: "Why", label: "Why this is being done", type: "textarea", rows: 2, placeholder: "Two shortfalls last month could not be traced to a shift." },
      { key: "Actions", label: "Who does what", type: "rows",
        columns: [
          { key: "what", label: "Action" },
          { key: "who", label: "Who" },
          { key: "by", label: "By when", type: "date" },
        ],
        defaultRows: [{ what: "", who: "", by: "" }],
      },
      { key: "Effective", label: "Effective from", type: "date", half: true },
      { key: "Acknowledge", label: "Acknowledgement needed", type: "select", options: ["Sign the copy on the noticeboard", "Reply on the WhatsApp group", "No acknowledgement needed"], half: true },
    ],
    refineChips: ["Shorter", "Friendlier", "More firm", "Translate to Hindi"],
    sample: {
      Business: "Sharma Sweets", To: "All counter and kitchen staff", From: "Anil Sharma, Proprietor",
      Reference: "MEMO/2026/07", Subject: "Counter closing procedure from 15 April",
      Type: "New rule or procedure",
      Message: "From 15 April, the cash counter must be tallied at closing by two people together — the counter salesman on duty and the shift senior. Both will sign the day's cash sheet before the cash goes into the safe. Any difference above ₹100 must be written on the sheet the same evening, not the next morning.",
      Why: "Two shortfalls last month could not be traced to a particular shift, which was unfair to everyone on duty.",
      Actions: [
        { what: "Print the new cash sheet and keep it at the counter", who: "Anjali", by: "" },
        { what: "Explain the procedure at the morning meeting", who: "Imran", by: "" },
        { what: "Check the signed sheets every week", who: "Anil Sharma", by: "" },
      ],
      Acknowledge: "Sign the copy on the noticeboard",
    },
  },
  "tool-100": {
    engine: "doc", credits: p("tool-100"), fileName: "checklist", cta: "Create checklist",
    intro: "A checklist for a job that must be done the same way every time, with what to accept and who signs.",
    steps: ["List the checks", "Set what counts as a pass", "Print it and use it daily"],
    related: ["tool-27", "tool-10", "tool-99", "tool-91"],
    fields: [
      BUSINESS,
      { key: "Name", label: "Checklist name", required: true, half: true, placeholder: "Daily shop opening checklist" },
      { key: "Purpose", label: "What it is for", required: true, half: true, placeholder: "Make sure the shop is safe and ready before the first customer" },
      { key: "Who uses it", label: "Who fills it", half: true, placeholder: "Shift senior on duty" },
      { key: "Frequency", label: "How often", type: "select", options: ["Every shift", "Daily", "Weekly", "Monthly", "Per batch", "Per order", "Per delivery"], half: true },
      { key: "Items", label: "The checks", type: "rows", required: true,
        columns: [
          { key: "item", label: "Check" },
          { key: "accept", label: "Pass means" },
          { key: "who", label: "Who" },
        ],
        defaultRows: [{ item: "", accept: "", who: "" }],
      },
      { key: "If fail", label: "What to do if a check fails", type: "textarea", rows: 2, placeholder: "Do not open the counter. Call the shift senior and record it in the register." },
      { key: "Sign off", label: "Signed off by", half: true },
      { key: "Keep for", label: "Keep the filled sheets for", type: "select", options: ["1 month", "3 months", "6 months", "1 year", "3 years"], half: true },
    ],
    compute: (v) => {
      const rows = rowsOf(v, "Items").filter((r) => r.item?.trim());
      return rows.length ? { "Number of checks": String(rows.length) } : {};
    },
    refineChips: FORM_CHIPS,
    sample: {
      Business: "Sharma Sweets", Name: "Daily shop opening checklist",
      Purpose: "Make sure the shop is clean, safe and ready before the first customer",
      "Who uses it": "Shift senior on duty", Frequency: "Daily",
      Items: [
        { item: "Display counter glass cleaned", accept: "No smudges, no fingerprints", who: "Counter staff" },
        { item: "Chiller temperature checked", accept: "Between 2°C and 6°C", who: "Shift senior" },
        { item: "Yesterday's unsold mithai segregated", accept: "Nothing past its date on display", who: "Kitchen helper" },
        { item: "Weighing scale checked against the 1 kg test weight", accept: "Reads 1.000 kg ± 5 g", who: "Shift senior" },
        { item: "Fire extinguisher pressure gauge in the green", accept: "Needle in the green band, seal intact", who: "Shift senior" },
        { item: "Floor dry and mats in place", accept: "No wet patches near the counter", who: "Counter staff" },
        { item: "Cash float counted", accept: "₹2,000 in change, tallies with the sheet", who: "Shift senior" },
      ],
      "If fail": "Do not open the counter for that section. Call the shift senior, record the failure in the register with the time, and fix it before trading.",
      "Sign off": "Shift senior, countersigned weekly by the proprietor", "Keep for": "6 months",
    },
  },
  "tool-101": {
    engine: "doc", credits: p("tool-101"), fileName: "improvement-plan", cta: "Create improvement plan",
    intro: "A performance improvement plan with measurable targets, the support you will give, and dates to review.",
    steps: ["Name the gap with evidence", "Set measurable targets", "Review on the dates you set"],
    related: ["tool-53", "tool-36", "tool-56", "tool-31"],
    fields: [
      BUSINESS,
      { key: "Employee", label: "Employee name", required: true, half: true },
      { key: "Designation", label: "Designation", half: true },
      { key: "Manager", label: "Manager", profile: "ownerName", half: true },
      { key: "Start", label: "Plan starts", type: "date", half: true, default: isoToday() },
      { key: "Months", label: "Plan runs for (months)", type: "number", required: true, default: "3", half: true },
      { key: "Gap", label: "The problem, with evidence", type: "textarea", rows: 3, required: true, placeholder: "Of 40 client filings in Q4, 9 were filed on the due date or later. Two attracted late fees totalling ₹3,400." },
      { key: "Already done", label: "What has already been tried", type: "textarea", rows: 2, placeholder: "Spoken to twice in January and February; a filing calendar was shared." },
      { key: "Targets", label: "Targets", type: "rows", required: true,
        columns: [
          { key: "target", label: "What must happen" },
          { key: "measure", label: "Measured how" },
          { key: "by", label: "By when", type: "date" },
        ],
        defaultRows: [{ target: "", measure: "", by: "" }],
      },
      { key: "Support", label: "Support you will give", type: "textarea", rows: 2, required: true, placeholder: "A weekly 20-minute review every Monday, the GST course fee paid for, and the two largest clients moved to Rohit for this period." },
      { key: "Reviews", label: "Review meetings", type: "select", options: ["Weekly", "Fortnightly", "Monthly"], half: true },
      { key: "If met", label: "If the targets are met", half: true, placeholder: "Plan closes and normal review resumes" },
      { key: "If not met", label: "If the targets are not met", type: "select", options: ["Plan extended once", "Move to a different role", "Formal warning", "Employment may be ended as per contract"], half: true },
    ],
    compute: (v) => {
      const rows = rowsOf(v, "Targets").filter((r) => r.target?.trim());
      return rows.length ? { "Number of targets": String(rows.length) } : {};
    },
    refineChips: ["Warmer — more supportive", "More formal", "Shorter", "Add a sign-off block"],
    sample: {
      Business: "Verma Tax Consultants", Employee: "Sachin Rathore", Designation: "Accounts executive",
      Manager: "Suresh Verma", Months: "3",
      Gap: "Of 40 client filings in the October–December quarter, nine were submitted on the due date itself or later. Two of these attracted late fees totalling ₹3,400, which the firm absorbed. Three clients raised it in writing.",
      "Already done": "Spoken to in January and again in February. A filing calendar with internal deadlines three days ahead of statutory dates was shared on 12 February.",
      Targets: [
        { target: "All assigned filings submitted at least 3 days before the due date", measure: "Filing log reviewed every Monday", by: "" },
        { target: "No late fee on any assigned client", measure: "Portal records", by: "" },
        { target: "Complete the GST compliance course", measure: "Certificate produced", by: "" },
      ],
      Support: "A weekly 20-minute review every Monday with the manager, the GST course fee paid for by the firm, and the two largest clients temporarily moved to Rohit so the workload is manageable during the plan.",
      Reviews: "Weekly", "If met": "The plan closes and normal appraisal review resumes",
      "If not met": "Move to a different role",
    },
  },
  "tool-102": {
    engine: "doc", credits: p("tool-102"), fileName: "benefit-statement", cta: "Create statement",
    intro: "A total-reward statement showing what an employee actually gets — salary plus everything the business pays on top.",
    steps: ["Enter salary and benefits", "See the total cost to company", "Share it at appraisal time"],
    related: ["tool-50", "tool-51", "tool-55", "tool-96"],
    fields: [
      BUSINESS,
      { key: "Employee", label: "Employee name", required: true, half: true },
      { key: "Designation", label: "Designation", half: true },
      { key: "Period", label: "For the year", required: true, half: true, placeholder: "April 2026 – March 2027" },
      { key: "Cash", label: "Cash components", type: "rows", required: true,
        columns: [
          { key: "desc", label: "Component", placeholder: "Basic" },
          { key: "price", label: "Per year (₹)", type: "money" },
        ],
        defaultRows: [{ desc: "Basic", price: "" }, { desc: "HRA", price: "" }, { desc: "Special allowance", price: "" }],
      },
      { key: "Benefits", label: "What the business pays on top", type: "rows",
        columns: [
          { key: "desc", label: "Benefit", placeholder: "EPF (employer share)" },
          { key: "price", label: "Per year (₹)", type: "money" },
          { key: "note", label: "Note" },
        ],
        defaultRows: [{ desc: "EPF (employer share)", price: "", note: "" }],
      },
      { key: "Non-cash", label: "Benefits with no rupee value", type: "chips", options: ["Paid leave", "Flexible hours", "Training paid for", "Festival gifts", "Free meals", "Uniform provided", "Transport provided", "Phone provided"] },
      { key: "Leave days", label: "Paid leave days a year", type: "number", half: true },
      { key: "Note", label: "Note to the employee", type: "textarea", rows: 2, placeholder: "This statement is for information. Your appointment terms remain as per your contract." },
    ],
    compute: (v) => {
      const cash = billTotals(rowsOf(v, "Cash"), { qty: "_none", price: "price" }).total;
      const ben = billTotals(rowsOf(v, "Benefits"), { qty: "_none", price: "price" }).total;
      if (!cash) return {};
      return {
        "Total cash a year": inr(cash),
        "Benefits a year": inr(ben),
        "Total cost to company": inr(cash + ben),
        "Cash per month": inr(cash / 12),
      };
    },
    preview: (v) => {
      const cash = billTotals(rowsOf(v, "Cash"), { qty: "_none", price: "price" }).total;
      const ben = billTotals(rowsOf(v, "Benefits"), { qty: "_none", price: "price" }).total;
      return cash ? <Totals sub={cash} total={cash + ben} note={`Cash ${inr(cash)} + benefits ${inr(ben)} · about ${inr(cash / 12)} a month in cash`} /> : null;
    },
    refineChips: HR_CHIPS,
    sample: {
      Business: "Verma Tax Consultants", Employee: "Anjali Deshmukh", Designation: "Accounts executive",
      Period: "April 2026 – March 2027",
      Cash: [
        { desc: "Basic", price: "264000" },
        { desc: "HRA", price: "105600" },
        { desc: "Conveyance", price: "28800" },
        { desc: "Special allowance", price: "45600" },
      ],
      Benefits: [
        { desc: "EPF (employer share)", price: "31680", note: "12% of basic" },
        { desc: "Annual bonus", price: "22000", note: "Paid at Diwali" },
        { desc: "Training and certification", price: "12000", note: "GST course fee" },
      ],
      "Non-cash": "Paid leave|Training paid for|Festival gifts|Flexible hours",
      "Leave days": "18",
      Note: "This statement is for information only. Your appointment terms remain as set out in your contract.",
    },
  },
  "tool-103": {
    engine: "doc", credits: p("tool-103"), fileName: "grievance-form", cta: "Create grievance form",
    intro: "A grievance form that lets a staff member put a complaint on record properly, and shows what happens next.",
    steps: ["Record the complaint and facts", "Set who looks into it", "Reply within the stated time"],
    related: ["tool-95", "tool-104", "tool-56", "tool-31"],
    fields: [
      BUSINESS,
      { key: "Complainant", label: "Name of the person complaining", required: true, half: true },
      { key: "Designation", label: "Designation", half: true },
      { key: "Department", label: "Department", half: true },
      { key: "Date", label: "Date of complaint", type: "date", half: true, default: isoToday() },
      { key: "Type", label: "What it is about", type: "select", required: true, options: ["Pay or dues", "Working hours or overtime", "Leave refused", "Behaviour of a colleague", "Behaviour of a manager", "Safety at work", "Facilities", "Harassment", "Discrimination", "Other"], half: true },
      { key: "Against", label: "Against whom, if applicable", half: true },
      { key: "When", label: "When it happened", half: true, placeholder: "Repeatedly since February 2026" },
      { key: "Where", label: "Where it happened", half: true },
      { key: "What happened", label: "What happened", type: "textarea", rows: 4, required: true, placeholder: "Overtime worked in February and March has not been paid. About 22 extra hours in February and 18 in March, recorded on the shift register." },
      { key: "Witnesses", label: "Anyone who saw it", half: true },
      { key: "Evidence", label: "Anything attached", type: "chips", options: ["Shift register copy", "Salary slips", "Messages or emails", "Photographs", "Medical papers", "Nothing attached"] },
      { key: "Raised before", label: "Raised before", type: "select", options: ["No — first time", "Raised verbally once", "Raised verbally more than once", "Raised in writing before"], half: true },
      { key: "Wants", label: "What they want done", type: "textarea", rows: 2, required: true, placeholder: "Overtime for February and March paid, and a clear overtime rate put in writing." },
      { key: "Looked into by", label: "To be looked into by", half: true },
      { key: "Reply within", label: "Reply within", type: "select", options: ["3 working days", "7 working days", "15 working days", "30 days"], half: true },
      { key: "Confidential", label: "Confidentiality", type: "select", options: ["Kept confidential as far as possible", "Name may be shared with the person complained against", "Anonymous — name withheld"], half: true },
    ],
    refineChips: ["More formal", "Add an escalation route", "Shorter", "Translate to Hindi"],
    sample: {
      Business: "Sharma Sweets", Complainant: "Imran Shaikh", Designation: "Counter salesman",
      Department: "Retail — Palasia outlet", Type: "Pay or dues", When: "February and March 2026",
      Where: "Palasia outlet",
      "What happened": "Overtime worked during the February and March festival rush has not been paid. About 22 extra hours in February and 18 in March, all recorded in the shift register and approved by the shift senior at the time. On asking in April, I was told there is no overtime policy, although overtime was paid for Diwali 2025.",
      Witnesses: "Sunita Rao and Ramesh Kale worked the same shifts",
      Evidence: "Shift register copy|Salary slips",
      "Raised before": "Raised verbally more than once",
      Wants: "Overtime for February and March paid at the same rate as Diwali 2025, and a written overtime rate put up on the noticeboard so this does not repeat.",
      "Looked into by": "Anil Sharma, Proprietor", "Reply within": "7 working days",
      Confidential: "Kept confidential as far as possible",
    },
  },
  "tool-104": {
    engine: "doc", credits: p("tool-104"), fileName: "company-policy", cta: "Write policy",
    intro: "A written policy in plain words — who it applies to, what the rule is, and what happens if it is broken.",
    steps: ["Pick the policy and scope", "Set the rules and consequences", "Circulate it and get acknowledgements"],
    related: ["tool-99", "tool-58", "tool-103", "tool-10"],
    fields: [
      BUSINESS, INDUSTRY,
      { key: "Policy", label: "Policy on", type: "select", required: true, options: ["Leave", "Attendance and punctuality", "Overtime", "Dress code", "Mobile phone use", "Workplace safety", "Anti-harassment (POSH)", "Social media", "Expense and reimbursement", "Travel", "Conflict of interest", "Data and confidentiality", "Work from home", "Notice period and exit", "Cash handling", "Hygiene and food safety"], half: true },
      { key: "Applies to", label: "Who it applies to", type: "select", required: true, options: ["All staff", "All permanent staff", "Office staff only", "Shop-floor staff only", "Managers and above", "Staff on probation too", "Contract staff too"], half: true },
      { key: "Staff count", label: "Number of staff", type: "number", half: true },
      { key: "Purpose", label: "Why this policy exists", type: "textarea", rows: 2, required: true, placeholder: "So leave is planned, the counter is never short-staffed, and everyone is treated the same way." },
      { key: "Rules", label: "The rules", type: "textarea", rows: 5, required: true, placeholder: "12 casual leaves and 6 sick leaves a year, pro-rated for part years.\nCasual leave applied at least 2 days ahead.\nNot more than 2 people on leave from the same shift…" },
      { key: "Who approves", label: "Who approves or decides", half: true, placeholder: "Shift senior for 1 day, proprietor beyond that" },
      { key: "How to ask", label: "How a request is made", half: true, placeholder: "Written slip to the shift senior, or on the staff WhatsApp group" },
      { key: "Exceptions", label: "Exceptions allowed", type: "textarea", rows: 2, placeholder: "Medical emergencies and bereavement — inform as soon as possible, paperwork later." },
      { key: "If broken", label: "If the policy is broken", type: "select", options: ["Spoken warning, then written warning", "Written warning straight away", "Pay deduction as per law", "Action as per the employment contract", "Depends on how serious it is"], half: true },
      { key: "Effective", label: "Effective from", type: "date", half: true, default: isoToday() },
      { key: "Review", label: "Reviewed every", type: "select", options: ["6 months", "1 year", "2 years", "When the law changes"], half: true },
      { key: "Acknowledge", label: "How staff acknowledge it", type: "select", options: ["Sign a copy kept in their file", "Sign the noticeboard copy", "Reply on the WhatsApp group", "No acknowledgement needed"], half: true },
    ],
    refineChips: ["Simpler language", "Shorter", "Stricter", "Translate to Hindi"],
    sample: {
      Business: "Sharma Sweets", Industry: "Sweet shop with kitchen", Policy: "Leave",
      "Applies to": "All permanent staff", "Staff count": "12",
      Purpose: "So leave is planned in advance, the counter and kitchen are never short-staffed, and everyone is treated the same way.",
      Rules: "Twelve casual leaves and six sick leaves a year, pro-rated for part years.\nCasual leave must be applied for at least two days in advance.\nNot more than two people may be on leave from the same shift on the same day.\nNo casual leave during the ten days before Diwali and Rakhi, except in an emergency.\nSick leave of more than two days needs a doctor's note.\nUnused casual leave does not carry over to the next year.\nUnapproved absence is treated as unpaid leave and is recorded in the attendance register.",
      "Who approves": "Shift senior for one day, proprietor for anything longer",
      "How to ask": "Written slip to the shift senior, or a message on the staff WhatsApp group",
      Exceptions: "Medical emergencies and bereavement — inform as soon as you can and complete the paperwork later.",
      "If broken": "Spoken warning, then written warning", Review: "1 year",
      Acknowledge: "Sign a copy kept in their file",
    },
  },
};
