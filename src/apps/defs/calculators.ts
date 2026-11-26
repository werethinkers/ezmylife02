import { p, isoToday } from "./shared";
import { num } from "../shell/Fields";
import type { CalcDef, CalcOutput } from "../types";

/*
 * Phase 2: calculators. The sums run in the browser as you type (no AI cost); "Explain in plain
 * words" is the only AI step. Only plain maths here: anything that depends on a rate set by the
 * government (GST, PPF, gratuity…) needs an official source in `sources` before it is added.
 */

const rs = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const pct = (n: number, d = 2) => `${(Math.round(n * 10 ** d) / 10 ** d).toLocaleString("en-IN", { maximumFractionDigits: d })}%`;
const int = (n: number) => Math.round(n).toLocaleString("en-IN");
const yearsLabel = (m: number) => {
  const y = Math.floor(m / 12);
  const r = m % 12;
  return [y && `${y} year${y === 1 ? "" : "s"}`, r && `${r} month${r === 1 ? "" : "s"}`].filter(Boolean).join(" ") || "0 months";
};
const err = (error: string) => ({ error });

const RATE = (label = "Interest rate (% a year)", def?: string) => ({ key: "rate", label, type: "number" as const, half: true, default: def });

/** Monthly EMI for a loan. r = monthly rate as a fraction. */
export const emiOf = (principal: number, r: number, n: number) => (r === 0 ? principal / n : (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1));

/** Year-by-year split of a loan's payments. */
function loanTable(principal: number, r: number, n: number, emi: number) {
  const rows: string[][] = [];
  let bal = principal;
  for (let y = 0; y * 12 < n; y++) {
    let pp = 0;
    let ip = 0;
    for (let m = 0; m < 12 && y * 12 + m < n; m++) {
      const i = bal * r;
      const pr = Math.min(bal, emi - i);
      ip += i;
      pp += pr;
      bal -= pr;
    }
    rows.push([`Year ${y + 1}`, rs(pp), rs(ip), rs(Math.max(0, bal))]);
  }
  return { columns: ["Year", "Principal paid", "Interest paid", "Loan left"], rows };
}

export const emi: CalcDef = {
  engine: "calc",
  credits: p("emi-calculator"),
  intro: "Your monthly EMI, the total interest and a year-by-year repayment table for any loan.",
  steps: ["Enter the loan amount", "Add the interest rate and tenure", "See your EMI and the table"],
  related: ["loan-prepayment-calculator", "tool-69", "percentage-calculator"],
  fields: [
    { key: "amount", label: "Loan amount (₹)", type: "money", required: true, half: true },
    RATE(),
    { key: "tenure", label: "Tenure", type: "number", required: true, half: true },
    { key: "unit", label: "Tenure in", type: "select", options: ["Years", "Months"], default: "Years", half: true },
  ],
  sample: { amount: "1000000", rate: "9", tenure: "15", unit: "Years" },
  calc: (v) => {
    const P = num(v.amount);
    const rate = num(v.rate);
    const n = Math.round(num(v.tenure) * (v.unit === "Months" ? 1 : 12));
    if (P <= 0) return err("Enter the loan amount.");
    if (n <= 0 || n > 600) return err("Enter a tenure between 1 month and 50 years.");
    if (rate < 0 || rate > 50) return err("Enter an interest rate between 0% and 50% a year.");
    const r = rate / 12 / 100;
    const e = emiOf(P, r, n);
    const total = e * n;
    return {
      results: [
        { label: "Monthly EMI", value: rs(e), main: true },
        { label: "Total interest", value: rs(total - P) },
        { label: "Total you pay", value: rs(total) },
        { label: "Number of EMIs", value: `${n} (${yearsLabel(n)})` },
      ],
      split: [
        { label: "Loan amount", value: P },
        { label: "Interest", value: total - P },
      ],
      table: loanTable(P, r, n, e),
      note: "Worked out on a reducing balance with interest charged monthly, the way most Indian banks do. Your lender's figure can differ by a few rupees because of rounding or fees.",
    };
  },
  fileName: "emi",
};

const prepay: CalcDef = {
  engine: "calc",
  credits: p("loan-prepayment-calculator"),
  intro: "See how much interest and how many EMIs a part-payment saves, or how much lower your EMI gets.",
  steps: ["Enter what's left on the loan", "Add your part-payment", "Compare: shorter loan or lower EMI"],
  related: ["emi-calculator", "percentage-calculator", "cagr-calculator"],
  fields: [
    { key: "balance", label: "Loan left today (₹)", type: "money", required: true, half: true },
    RATE(),
    { key: "months", label: "EMIs left (months)", type: "number", required: true, half: true },
    { key: "prepay", label: "Part-payment now (₹)", type: "money", required: true, half: true },
    { key: "mode", label: "After paying, keep", type: "select", options: ["Same EMI, finish sooner", "Same end date, lower EMI"], default: "Same EMI, finish sooner" },
  ],
  sample: { balance: "800000", rate: "9", months: "144", prepay: "100000", mode: "Same EMI, finish sooner" },
  calc: (v) => {
    const B = num(v.balance);
    const rate = num(v.rate);
    const n = Math.round(num(v.months));
    const X = num(v.prepay);
    if (B <= 0) return err("Enter how much of the loan is left.");
    if (n <= 0 || n > 600) return err("Enter the number of EMIs left (1 to 600).");
    if (rate < 0 || rate > 50) return err("Enter an interest rate between 0% and 50% a year.");
    if (X <= 0) return err("Enter the part-payment amount.");
    if (X >= B) return err("That pays off the whole loan. Enter a smaller part-payment.");
    const r = rate / 12 / 100;
    const e = emiOf(B, r, n);
    const before = e * n - B;
    const left = B - X;
    if (v.mode === "Same end date, lower EMI") {
      const e2 = emiOf(left, r, n);
      const after = e2 * n - left;
      return {
        results: [
          { label: "New EMI", value: rs(e2), main: true },
          { label: "EMI now", value: rs(e) },
          { label: "Lower by", value: `${rs(e - e2)} a month`, tone: "good" },
          { label: "Interest saved", value: rs(before - after), tone: "good" },
        ],
        split: [
          { label: "Interest still to pay", value: after },
          { label: "Interest saved", value: before - after },
        ],
        note: "Assumes the rate stays the same. Ask your lender whether a part-payment reduces the EMI or the tenure, and whether any charge applies.",
      };
    }
    // Same EMI: count the months until the smaller balance is repaid.
    let bal = left;
    let m = 0;
    let interest = 0;
    while (bal > 0.5 && m < 1200) {
      const i = bal * r;
      interest += i;
      bal = bal + i - e;
      m++;
    }
    return {
      results: [
        { label: "Interest saved", value: rs(before - interest), main: true, tone: "good" },
        { label: "EMIs saved", value: `${n - m} (${yearsLabel(n - m)})`, tone: "good" },
        { label: "Loan now ends in", value: yearsLabel(m) },
        { label: "EMI stays", value: rs(e) },
      ],
      split: [
        { label: "Interest still to pay", value: interest },
        { label: "Interest saved", value: before - interest },
      ],
      note: "Assumes the rate stays the same. Ask your lender whether a part-payment reduces the EMI or the tenure, and whether any charge applies.",
    };
  },
  fileName: "loan-prepayment",
};

const sip: CalcDef = {
  engine: "calc",
  credits: p("sip-calculator"),
  intro: "What a monthly SIP could grow to, with an optional yearly step-up, and how much of it is gain.",
  steps: ["Enter your monthly amount", "Pick a return rate and years", "See the value and the yearly table"],
  related: ["cagr-calculator", "fd-calculator", "rd-calculator"],
  fields: [
    { key: "monthly", label: "Monthly SIP (₹)", type: "money", required: true, half: true },
    RATE("Expected return (% a year)"),
    { key: "years", label: "For how many years", type: "number", required: true, half: true },
    { key: "stepup", label: "Raise the SIP every year by (%)", type: "number", half: true, default: "0", help: "0 if the amount stays the same." },
  ],
  sample: { monthly: "5000", rate: "12", years: "10", stepup: "10" },
  calc: (v) => {
    const P = num(v.monthly);
    const rate = num(v.rate);
    const years = Math.round(num(v.years));
    const step = num(v.stepup);
    if (P <= 0) return err("Enter the monthly SIP amount.");
    if (years <= 0 || years > 50) return err("Enter between 1 and 50 years.");
    if (rate < 0 || rate > 40) return err("Enter a return between 0% and 40% a year.");
    if (step < 0 || step > 100) return err("Enter a step-up between 0% and 100%.");
    const i = rate / 12 / 100;
    let value = 0;
    let invested = 0;
    let amt = P;
    const rows: string[][] = [];
    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        // Paid at the start of each month, then grows for the month.
        value = (value + amt) * (1 + i);
        invested += amt;
      }
      rows.push([`Year ${y}`, rs(amt), rs(invested), rs(value)]);
      amt *= 1 + step / 100;
    }
    return {
      results: [
        { label: `Value after ${years} year${years === 1 ? "" : "s"}`, value: rs(value), main: true },
        { label: "You invest", value: rs(invested) },
        { label: "Estimated gain", value: rs(value - invested), tone: "good" },
        { label: "Value is", value: `${(value / invested).toFixed(2)}× what you put in` },
      ],
      split: [
        { label: "Invested", value: invested },
        { label: "Gain", value: value - invested },
      ],
      table: { columns: ["Year", "Monthly SIP", "Invested so far", "Value at year end"], rows },
      note: "An estimate at a steady return. Real mutual fund returns go up and down and are not guaranteed; this is not investment advice.",
    };
  },
  fileName: "sip",
};

const FREQ: Record<string, number> = { Monthly: 12, Quarterly: 4, "Half-yearly": 2, Yearly: 1 };

const fd: CalcDef = {
  engine: "calc",
  credits: p("fd-calculator"),
  intro: "Maturity amount and interest on a fixed deposit, for any tenure and compounding.",
  steps: ["Enter the deposit and rate", "Pick the tenure and compounding", "See the maturity amount"],
  related: ["rd-calculator", "sip-calculator", "cagr-calculator"],
  fields: [
    { key: "amount", label: "Deposit (₹)", type: "money", required: true, half: true },
    RATE(),
    { key: "years", label: "Years", type: "number", half: true, default: "0" },
    { key: "months", label: "Months", type: "number", half: true, default: "0" },
    { key: "freq", label: "Interest added", type: "select", options: ["Quarterly", "Monthly", "Half-yearly", "Yearly", "Paid out (not added)"], default: "Quarterly", help: "Most Indian banks add FD interest every quarter. Check your bank's terms." },
  ],
  sample: { amount: "200000", rate: "7", years: "3", months: "0", freq: "Quarterly" },
  calc: (v) => {
    const P = num(v.amount);
    const rate = num(v.rate);
    const months = Math.round(num(v.years) * 12 + num(v.months));
    if (P <= 0) return err("Enter the deposit amount.");
    if (months <= 0 || months > 600) return err("Enter a tenure of at least 1 month.");
    if (rate < 0 || rate > 20) return err("Enter an interest rate between 0% and 20% a year.");
    const t = months / 12;
    const r = rate / 100;
    if (v.freq === "Paid out (not added)") {
      const interest = P * r * t;
      return {
        results: [
          { label: "Total interest paid out", value: rs(interest), main: true },
          { label: "Each quarter", value: rs((P * r) / 4) },
          { label: "Each month", value: rs((P * r) / 12) },
          { label: "You get back at the end", value: rs(P) },
        ],
        split: [
          { label: "Deposit", value: P },
          { label: "Interest", value: interest },
        ],
        note: "Simple interest, paid out instead of added to the deposit. Banks may pay a slightly lower monthly figure (discounted). Interest is taxable and TDS may be cut.",
      };
    }
    const n = FREQ[v.freq] ?? 4;
    const rows: string[][] = [];
    for (let y = 1; y <= Math.ceil(t); y++) {
      const ty = Math.min(y, t);
      const a = P * (1 + r / n) ** (n * ty);
      rows.push([y <= t ? `Year ${y}` : `End (${yearsLabel(months)})`, rs(a - P), rs(a)]);
    }
    const A = P * (1 + r / n) ** (n * t);
    const effective = ((1 + r / n) ** n - 1) * 100;
    return {
      results: [
        { label: "Maturity amount", value: rs(A), main: true },
        { label: "Interest earned", value: rs(A - P), tone: "good" },
        { label: "Effective yearly return", value: pct(effective) },
        { label: "Tenure", value: yearsLabel(months) },
      ],
      split: [
        { label: "Deposit", value: P },
        { label: "Interest", value: A - P },
      ],
      table: { columns: ["Year", "Interest so far", "Amount"], rows },
      note: "Interest is taxable and TDS may be cut by the bank. Banks round their figures in their own way, so the bank's amount can differ by a few rupees.",
    };
  },
  fileName: "fd",
};

const rd: CalcDef = {
  engine: "calc",
  credits: p("rd-calculator"),
  intro: "Maturity value of a recurring deposit: a fixed amount every month, interest added every quarter.",
  steps: ["Enter the monthly deposit", "Add the rate and number of months", "See the maturity value"],
  related: ["fd-calculator", "sip-calculator", "percentage-calculator"],
  fields: [
    { key: "monthly", label: "Every month (₹)", type: "money", required: true, half: true },
    RATE(),
    { key: "months", label: "Number of months", type: "number", required: true, half: true },
  ],
  sample: { monthly: "5000", rate: "6.5", months: "60" },
  calc: (v) => {
    const R = num(v.monthly);
    const rate = num(v.rate);
    const n = Math.round(num(v.months));
    if (R <= 0) return err("Enter the monthly deposit.");
    if (n <= 0 || n > 600) return err("Enter between 1 and 600 months.");
    if (rate < 0 || rate > 20) return err("Enter an interest rate between 0% and 20% a year.");
    const r = rate / 100;
    // Each deposit grows, with interest added quarterly, for the months it stays in.
    let A = 0;
    const rows: string[][] = [];
    for (let k = 1; k <= n; k++) {
      A += R * (1 + r / 4) ** (4 * ((n - k + 1) / 12));
    }
    for (let y = 1; y * 12 <= n || (y - 1) * 12 < n; y++) {
      const m = Math.min(n, y * 12);
      let a = 0;
      for (let k = 1; k <= m; k++) a += R * (1 + r / 4) ** (4 * ((m - k + 1) / 12));
      rows.push([m === y * 12 ? `Year ${y}` : `Month ${m}`, rs(R * m), rs(a)]);
      if (m === n) break;
    }
    const paid = R * n;
    return {
      results: [
        { label: "Maturity value", value: rs(A), main: true },
        { label: "You deposit", value: rs(paid) },
        { label: "Interest earned", value: rs(A - paid), tone: "good" },
        { label: "Tenure", value: yearsLabel(n) },
      ],
      split: [
        { label: "Deposits", value: paid },
        { label: "Interest", value: A - paid },
      ],
      table: { columns: ["Period", "Deposited so far", "Value"], rows },
      note: "Worked out with interest added every quarter, as Indian banks and the post office usually do for RDs. Your bank's figure can differ slightly because of rounding.",
    };
  },
  fileName: "rd",
};

const cagr: CalcDef = {
  engine: "calc",
  credits: p("cagr-calculator"),
  intro: "The yearly growth rate between a start and an end value: for sales, investments or prices.",
  steps: ["Enter the start and end values", "Add the number of years", "See the yearly growth rate"],
  related: ["sip-calculator", "percentage-calculator", "break-even-calculator"],
  fields: [
    { key: "start", label: "Value at the start", type: "money", required: true, half: true },
    { key: "end", label: "Value at the end", type: "money", required: true, half: true },
    { key: "years", label: "Years in between", type: "number", required: true, half: true },
  ],
  sample: { start: "500000", end: "1200000", years: "5" },
  calc: (v) => {
    const a = num(v.start);
    const b = num(v.end);
    const t = num(v.years);
    if (a <= 0 || b <= 0) return err("Enter start and end values above zero.");
    if (t <= 0 || t > 100) return err("Enter the number of years (more than 0).");
    const g = (b / a) ** (1 / t) - 1;
    const rows: string[][] = [];
    for (let y = 0; y <= Math.min(Math.ceil(t), 50); y++) rows.push([`Year ${y}`, int(a * (1 + g) ** Math.min(y, t))]);
    return {
      results: [
        { label: "Growth each year (CAGR)", value: pct(g * 100), main: true, tone: g >= 0 ? "good" : "bad" },
        { label: "Total change", value: pct(((b - a) / a) * 100) },
        { label: "Grew by", value: `${(b / a).toFixed(2)}×` },
        { label: "Change in value", value: int(b - a) },
      ],
      table: { columns: ["Year", "Value at a steady rate"], rows },
      note: "CAGR smooths the path into one steady yearly rate. Real yearly figures may have gone up and down.",
    };
  },
  fileName: "cagr",
};

const breakEven: CalcDef = {
  engine: "calc",
  credits: p("break-even-calculator"),
  intro: "How many units you must sell each month to cover your costs, and the profit at your expected sales.",
  steps: ["Enter fixed costs for a month", "Add the price and cost per unit", "See the break-even point"],
  related: ["tool-3", "cagr-calculator", "percentage-calculator"],
  fields: [
    { key: "fixed", label: "Fixed costs a month (₹)", type: "money", required: true, half: true, help: "Rent, salaries, EMIs, subscriptions." },
    { key: "price", label: "Selling price per unit (₹)", type: "money", required: true, half: true },
    { key: "cost", label: "Cost per unit (₹)", type: "money", required: true, half: true, help: "Material, packing, delivery, commission." },
    { key: "expected", label: "Units you expect to sell a month", type: "number", half: true },
  ],
  sample: { fixed: "120000", price: "450", cost: "250", expected: "900" },
  calc: (v) => {
    const F = num(v.fixed);
    const P = num(v.price);
    const C = num(v.cost);
    const Q = num(v.expected);
    if (F < 0 || P <= 0) return err("Enter your fixed costs and the selling price.");
    if (C < 0) return err("Enter the cost per unit (0 or more).");
    if (P <= C) return err("The price must be higher than the cost per unit, or every sale loses money.");
    const cm = P - C;
    const units = Math.ceil(F / cm);
    const results: CalcOutput["results"] = [
      { label: "Units to break even (a month)", value: int(units), main: true },
      { label: "Sales to break even", value: rs(units * P) },
      { label: "You keep per unit", value: `${rs(cm)} (${pct((cm / P) * 100, 1)})` },
      { label: "Each day (30 days)", value: `${int(Math.ceil(units / 30))} units` },
    ];
    if (Q > 0) {
      const profit = Q * cm - F;
      results.push({ label: `Profit at ${int(Q)} units`, value: rs(profit), tone: profit >= 0 ? "good" : "bad" });
      results.push({ label: "Safety margin", value: Q >= units ? `${pct(((Q - units) / Q) * 100, 1)} above break-even` : `${int(units - Q)} units short`, tone: Q >= units ? "good" : "warn" });
    }
    const steps = [0.5, 0.75, 1, 1.25, 1.5, 2].map((k) => Math.round(units * k));
    return {
      results,
      table: { columns: ["Units sold", "Sales", "Costs", "Profit"], rows: steps.map((u) => [int(u), rs(u * P), rs(F + u * C), rs(u * cm - F)]) },
      note: "Prices before GST. Fixed costs stay the same however much you sell; cost per unit rises with each sale.",
    };
  },
  fileName: "break-even",
};

const percentage: CalcDef = {
  engine: "calc",
  credits: p("percentage-calculator"),
  intro: "Every everyday percentage sum: a % of a number, what % one number is of another, % change, and adding or taking off a %.",
  steps: ["Pick what you want to find", "Enter the two numbers", "Read the answer"],
  related: ["cagr-calculator", "break-even-calculator", "emi-calculator"],
  fields: [
    {
      key: "mode",
      label: "What do you want to find?",
      type: "select",
      options: ["A % of a number", "What % one number is of another", "% change from one number to another", "Add a % to a number", "Take a % off a number", "Number before a % was added"],
      default: "A % of a number",
    },
    { key: "a", label: "First number", type: "number", required: true, half: true },
    { key: "b", label: "Second number", type: "number", required: true, half: true },
  ],
  sample: { mode: "% change from one number to another", a: "48000", b: "54000" },
  calc: (v) => {
    const a = num(v.a);
    const b = num(v.b);
    const mode = v.mode || "A % of a number";
    const two = (x: number) => (Math.round(x * 100) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
    if (!String(v.a ?? "").trim() || !String(v.b ?? "").trim()) return err("Enter both numbers.");
    switch (mode) {
      case "A % of a number":
        return { results: [{ label: `${two(a)}% of ${two(b)}`, value: two((a / 100) * b), main: true }], note: "First number is the %, second is the number." };
      case "What % one number is of another":
        if (b === 0) return err("The second number can't be 0.");
        return { results: [{ label: `${two(a)} is this much of ${two(b)}`, value: pct((a / b) * 100), main: true }] };
      case "% change from one number to another": {
        if (a === 0) return err("The first number can't be 0 for a % change.");
        const c = ((b - a) / Math.abs(a)) * 100;
        return {
          results: [
            { label: c >= 0 ? "Increase" : "Decrease", value: pct(Math.abs(c)), main: true, tone: c >= 0 ? "good" : "bad" },
            { label: "Difference", value: two(b - a) },
          ],
        };
      }
      case "Add a % to a number":
        return { results: [{ label: `${two(a)} plus ${two(b)}%`, value: two(a * (1 + b / 100)), main: true }, { label: "Amount added", value: two((a * b) / 100) }], note: "First number is the amount, second is the %." };
      case "Take a % off a number":
        return { results: [{ label: `${two(a)} less ${two(b)}%`, value: two(a * (1 - b / 100)), main: true }, { label: "Amount taken off", value: two((a * b) / 100) }], note: "First number is the amount, second is the %." };
      case "Number before a % was added":
        if (b <= -100) return err("The % must be above -100.");
        return {
          results: [{ label: `Before ${two(b)}% was added`, value: two(a / (1 + b / 100)), main: true }, { label: "The % part", value: two(a - a / (1 + b / 100)) }],
          note: "First number is the total including the %, second is the %. Useful to split a price that already includes tax or a markup.",
        };
      default:
        return err("Pick what you want to find.");
    }
  },
  fileName: "percentage",
};

/** Whole years, months and days between two dates, counting the way people state their age. */
export function ageBetween(from: Date, to: Date) {
  let y = to.getFullYear() - from.getFullYear();
  let m = to.getMonth() - from.getMonth();
  let d = to.getDate() - from.getDate();
  if (d < 0) {
    m -= 1;
    d += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  return { y, m, d };
}

const age: CalcDef = {
  engine: "calc",
  credits: p("age-calculator"),
  intro: "Exact age in years, months and days on any date, with a check against an exam or job's age limits.",
  steps: ["Enter the date of birth", "Pick the date to count to", "Add age limits if you have them"],
  related: ["exam-scheduler", "study-planner", "percentage-calculator"],
  fields: [
    { key: "dob", label: "Date of birth", type: "date", required: true, half: true },
    { key: "on", label: "Age as on", type: "date", half: true, help: "The date the notice says, e.g. 1 August. Leave empty for today." },
    { key: "min", label: "Minimum age (years)", type: "number", half: true },
    { key: "max", label: "Maximum age (years)", type: "number", half: true, help: "Use the limit for your category, including any relaxation." },
  ],
  sample: { dob: "2003-05-14", on: "", min: "20", max: "30" },
  calc: (v) => {
    if (!v.dob) return err("Enter the date of birth.");
    const from = new Date(v.dob + "T00:00:00");
    const to = new Date((v.on || isoToday()) + "T00:00:00");
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return err("Check the dates.");
    if (to < from) return err("The 'as on' date is before the date of birth.");
    const a = ageBetween(from, to);
    const days = Math.round((to.getTime() - from.getTime()) / 86400000);
    let next = new Date(to.getFullYear(), from.getMonth(), from.getDate());
    if (next <= to) next = new Date(to.getFullYear() + 1, from.getMonth(), from.getDate());
    const toNext = Math.round((next.getTime() - to.getTime()) / 86400000);
    const results: CalcOutput["results"] = [
      { label: `Age on ${to.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, value: `${a.y} years, ${a.m} months, ${a.d} days`, main: true },
      { label: "In days", value: int(days) },
      { label: "Next birthday in", value: `${toNext} days` },
    ];
    const min = String(v.min ?? "").trim() ? num(v.min) : undefined;
    const max = String(v.max ?? "").trim() ? num(v.max) : undefined;
    if (min !== undefined || max !== undefined) {
      // "Maximum 30" is read as: has not yet turned 31 on that date.
      const tooYoung = min !== undefined && a.y < min;
      const tooOld = max !== undefined && a.y > max;
      results.unshift({
        label: "Within the age limit?",
        value: tooYoung ? `No: under ${min}` : tooOld ? `No: over ${max}` : "Yes",
        tone: tooYoung || tooOld ? "bad" : "good",
      });
      // Born between: the birth dates the limits allow on this date.
      const latest = max !== undefined ? new Date(to.getFullYear() - max - 1, to.getMonth(), to.getDate() + 1) : undefined;
      const earliestBorn = min !== undefined ? new Date(to.getFullYear() - min, to.getMonth(), to.getDate()) : undefined;
      const f = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      if (latest || earliestBorn) results.push({ label: "Born between", value: `${latest ? f(latest) : "any date"} and ${earliestBorn ? f(earliestBorn) : "any date"}` });
    }
    return {
      results,
      note: "Notices count the age limit in different ways (for example 'not more than 30' or 'not reached 30'). Read the exact wording in your notice.",
    };
  },
  fileName: "age",
};

// "emi-calculator" has its own bespoke screen (src/apps/custom/EmiCalculator.tsx, registered in
// ./custom.tsx) instead of the generic CalcApp engine, so it is not listed below. The `emi` CalcDef
// above stays the single source of truth for its maths — EmiCalculator imports and reuses it.
export const calculators: Record<string, CalcDef> = {
  "loan-prepayment-calculator": prepay,
  "sip-calculator": sip,
  "fd-calculator": fd,
  "rd-calculator": rd,
  "cagr-calculator": cagr,
  "break-even-calculator": breakEven,
  "percentage-calculator": percentage,
  "age-calculator": age,
};
