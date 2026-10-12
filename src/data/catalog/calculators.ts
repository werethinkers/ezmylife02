import type { ToolEntry } from "../toolsDatabase";

// Phase 2: calculators (src/apps/defs/calculators.ts). The sums run in the browser.
export const calculators: ToolEntry[] = [
  { id: "emi-calculator", name: "EMI Calculator", description: "Monthly EMI, total interest and a year-by-year repayment table for home, car or personal loans", category: "Calculators", alsoIn: ["Finance & Accounting"], toolType: ["Calculators", "Finance & Billing"], source: "business", isLive: true },
  { id: "loan-prepayment-calculator", name: "Loan Prepayment Calculator", description: "Interest and EMIs a part-payment saves, or your lower EMI after paying some of the loan early", category: "Calculators", alsoIn: ["Finance & Accounting"], toolType: ["Calculators", "Finance & Billing"], source: "business", isLive: true },
  { id: "sip-calculator", name: "SIP Calculator", description: "What a monthly SIP could grow to, with a yearly step-up option and a year-wise table", category: "Calculators", toolType: ["Calculators", "Finance & Billing"], source: "business", isLive: true },
  { id: "fd-calculator", name: "FD Calculator", description: "Fixed deposit maturity amount and interest, with monthly, quarterly or yearly compounding", category: "Calculators", toolType: ["Calculators", "Finance & Billing"], source: "business", isLive: true },
  { id: "rd-calculator", name: "RD Calculator", description: "Recurring deposit maturity value for a fixed monthly amount, with interest added quarterly", category: "Calculators", toolType: ["Calculators", "Finance & Billing"], source: "business", isLive: true },
  { id: "cagr-calculator", name: "CAGR Calculator", description: "Yearly growth rate between a start and end value, for sales, investments or prices", category: "Calculators", alsoIn: ["Finance & Accounting"], toolType: ["Calculators", "Analytics Tools"], source: "business", isLive: true },
  { id: "break-even-calculator", name: "Break-Even Calculator", description: "Units and sales a month you need to cover fixed costs, and profit at your expected sales", category: "Calculators", alsoIn: ["Finance & Accounting", "Operations & Inventory"], toolType: ["Calculators", "Finance & Billing"], source: "business", isLive: true },
  { id: "percentage-calculator", name: "Percentage Calculator", description: "Percent of a number, percent change, adding or removing a percent, and the amount before a percent", category: "Calculators", toolType: ["Calculators", "Productivity"], source: "business", isLive: true },
  { id: "age-calculator", name: "Age Calculator", description: "Exact age in years, months and days on any date, with an exam or job age-limit check", category: "For Students", alsoIn: ["Calculators"], toolType: ["Calculators", "Education"], source: "business", isLive: true },
];
