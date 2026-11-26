/* Two small charts: money in by day, and sales against spending by month. Colours checked for colour blindness. */

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { inr, inrShort, monthName } from "@/business/format";

const IN = "#1a8c78";
const OUT = "#e8572a";
const axis = { fontSize: 12, fill: "hsl(0 0% 29%)" };

function Tip({ active, payload, label, fmt }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; fmt: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm shadow-lg dark:border-white/10 dark:bg-[#16161A]">
      <p className="font-bold">{fmt(label ?? "")}</p>
      {payload.map((p) => <p key={p.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />{p.name}: <b className="tabular-nums">{inr(p.value)}</b></p>)}
    </div>
  );
}

const shortDay = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export function DailySales({ data }: { data: { date: string; sales: number }[] }) {
  return (
    <div className="h-48 w-full" role="img" aria-label={`Sales for the last ${data.length} days`}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke="hsl(0 0% 7% / 0.08)" />
          <XAxis dataKey="date" tickFormatter={shortDay} tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tickFormatter={inrShort} tick={axis} tickLine={false} axisLine={false} width={56} />
          <Tooltip cursor={{ fill: "hsl(0 0% 7% / 0.05)" }} content={<Tip fmt={shortDay} />} />
          <Bar dataKey="sales" name="Sales" fill={IN} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyInOut({ data }: { data: { month: string; sales: number; spent: number }[] }) {
  return (
    <div className="h-60 w-full" role="img" aria-label="Sales and spending by month">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="hsl(0 0% 7% / 0.08)" />
          <XAxis dataKey="month" tickFormatter={(m: string) => new Date(`${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short" })} tick={axis} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={inrShort} tick={axis} tickLine={false} axisLine={false} width={56} />
          <Tooltip cursor={{ fill: "hsl(0 0% 7% / 0.05)" }} content={<Tip fmt={monthName} />} />
          <Legend iconType="square" wrapperStyle={{ fontSize: 13 }} />
          <Bar dataKey="sales" name="Sales" fill={IN} radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="spent" name="Bought and spent" fill={OUT} radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
