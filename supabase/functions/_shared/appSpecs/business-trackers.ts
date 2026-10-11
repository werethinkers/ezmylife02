// Business trackers (AI insights on the logged data).
// credits is the default price; the page copy of it is in src/apps/prices/business-trackers.ts.
import { type AppSpec, BIZ, LITE } from "./base.ts";

export const businessTrackers: Record<string, AppSpec> = {
  "tool-21": { kind: "doc", credits: 1, model: LITE, system: BIZ, task: "Analyse this wastage log: total loss, top items and reasons by value, patterns by day/category, and 5 specific actions to cut wastage next month with the expected saving." },
  "tool-23": { kind: "doc", credits: 1, model: LITE, system: BIZ, task: "Review this maintenance log: list equipment that is overdue or due in the next 14 days, recurring breakdowns, spend by equipment, and a preventive maintenance schedule for the next quarter (table)." },
  "tool-32": { kind: "doc", credits: 1, model: LITE, system: BIZ, task: "Turn this task list into a practical plan for today: order tasks by priority and deadline per person, flag overloaded people and unassigned or overdue tasks, and suggest what to delegate or postpone." },
  "tool-33": { kind: "doc", credits: 2, system: BIZ, task: "Create a weekly shift roster as a Markdown table (rows = staff, columns = Mon–Sun) using the staff, availability, shift timings and rules given. Ensure every shift has the minimum staff, respect weekly offs and hour limits, and list any conflicts you could not resolve." },
  "tool-34": { kind: "doc", credits: 1, model: LITE, system: BIZ, task: "Review this payroll sheet (net pay already calculated): flag unusual items (high overtime, large advances, negative or zero net pay), total payout and deductions, and draft a short note to the owner summarising this month's payroll." },
  "tool-37": { kind: "doc", credits: 1, model: LITE, system: BIZ, task: "Analyse these support tickets: counts by status and priority, oldest open tickets, recurring issue themes, and a suggested reply for each high-priority open ticket." },
  "tool-35": { kind: "doc", credits: 1, model: LITE, system: BIZ, task: "Summarise this attendance data: attendance % per employee, late arrivals, absence patterns (e.g. Mondays), and suggestions for the owner. Keep it factual." },
  "tool-25": { kind: "doc", credits: 1, model: LITE, system: BIZ, task: "Review this stock list: items at or below reorder level, suggested order quantities (aim for 2–3 weeks of cover if usage is given), grouped by supplier as draft purchase lists, and slow-moving items to clear." },
  "tool-26": { kind: "doc", credits: 1, model: LITE, system: BIZ, task: "Compare these vendors using the ratings given: rank them, explain the strengths and weaknesses of each, recommend who to prefer for which items, and draft a polite improvement note to the lowest-rated vendor." },
  "tool-20": { kind: "doc", credits: 1, model: LITE, system: BIZ, task: "Analyse this stock audit: total variance in quantity and value, items with the largest shortages/excess, likely causes, and corrective actions (process, recording, security)." },
  "tool-24": { kind: "doc", credits: 1, model: LITE, system: BIZ, task: "Write a clear shift handover note from these entries: pending tasks with owners, incidents and their status, cash/stock notes, and the top 3 things the next shift must do first." },
  "tool-39": { kind: "doc", credits: 1, model: LITE, system: BIZ, task: "Analyse this customer feedback: overall sentiment, the main themes with how often each appears and example quotes, the most urgent problems, quick wins, and suggested replies for negative feedback." },
};
