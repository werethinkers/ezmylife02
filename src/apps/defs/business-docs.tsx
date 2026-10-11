// Business documents (doc engine). Prices mirror supabase/functions/_shared/appSpecs/business-docs.ts.
import { p, s, daysFrom, BUSINESS, INDUSTRY, CITY, LANG, SENDER, LETTER_CHIPS, MSG_CHIPS, num, inr } from "./shared";
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
};
