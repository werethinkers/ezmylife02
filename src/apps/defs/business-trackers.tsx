// Business trackers (tracker engine). Prices mirror supabase/functions/_shared/appSpecs/business-trackers.ts.
import { p, sum, isoToday, daysFrom, num, inr } from "./shared";
import type { AppDef, TrackerRow } from "../types";

export const businessTrackers: Record<string, AppDef> = {
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
};
