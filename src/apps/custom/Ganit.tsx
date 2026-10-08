import { useState } from "react";
import { Input } from "@/components/ui/input";
import { AppShell } from "../shell/AppShell";
import { APPS } from "../registry";
import { MiniChat } from "./MiniChat";

/*
 * Commonly cited relations from Jain texts. Length (utsedh measure):
 *   12 angul = 1 vitasti, 2 vitasti = 1 hasta, 4 hasta = 1 dhanush, 2000 dhanush = 1 kos, 4 kos = 1 yojan.
 * Time: 1 ghadi = 24 minutes, 2 ghadi = 1 muhurta (48 min), 30 muhurta = 1 day-night,
 *   15 days = 1 paksha, 2 paksha = 1 maas, 12 maas = 1 varsh.
 * Units like palyopam and sagaropam are "innumerable" (asankhyat) years and can't be converted
 * to a finite number; 1 sagaropam = 10 kodakodi (10¹⁵) palyopam.
 */
const LENGTH: [string, number][] = [["Angul", 1], ["Vitasti", 12], ["Hasta (cubit)", 24], ["Dhanush / Danda", 96], ["Kos (gavyuti)", 192000], ["Yojan", 768000]];
const TIME: [string, number][] = [["Minute", 1], ["Ghadi", 24], ["Muhurta", 48], ["Prahar (avg)", 180], ["Day-night (ahoratra)", 1440], ["Paksha", 21600], ["Maas", 43200], ["Varsh", 518400]];

function Converter({ title, units, note }: { title: string; units: [string, number][]; note: string }) {
  const [val, setVal] = useState("1");
  const [from, setFrom] = useState(units[units.length - 1][0]);
  const base = (parseFloat(val) || 0) * (units.find((u) => u[0] === from)?.[1] ?? 1);
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 flex gap-2">
        <Input type="number" value={val} onChange={(e) => setVal(e.target.value)} className="w-28" aria-label={`${title} value`} />
        <select className="h-10 flex-1 rounded-md border border-input bg-background px-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} aria-label={`${title} unit`}>{units.map(([u]) => <option key={u}>{u}</option>)}</select>
      </div>
      <table className="mt-3 w-full text-sm">
        <tbody>{units.map(([u, f]) => <tr key={u} className="border-b border-border/40 last:border-0"><td className="py-1.5 text-muted-foreground">{u}</td><td className="py-1.5 text-right font-medium tabular-nums">{(base / f).toLocaleString("en-IN", { maximumFractionDigits: 4 })}</td></tr>)}</tbody>
      </table>
      <p className="mt-2 text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}

export default function Ganit({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Converter title="Length (utsedh measure)" units={LENGTH} note="12 angul = 1 vitasti · 2 vitasti = 1 hasta · 4 hasta = 1 dhanush · 2000 dhanush = 1 kos · 4 kos = 1 yojan. The pramana (standard) measure used for continents is much larger; texts differ on its ratio." />
        <Converter title="Time" units={TIME} note="1 muhurta = 48 minutes = 2 ghadi · 30 muhurta = 1 day-night. A prahar is ¼ of the day or night, so its length varies with the season (3 hours on average)." />
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 text-sm">
          <p className="font-semibold">Innumerable time</p>
          <p className="text-muted-foreground">Samay is the smallest indivisible instant; an avali is an innumerable number of samay.</p>
          <p className="text-muted-foreground">Palyopam and sagaropam measure spans too long to count in years. 1 sagaropam = 10 kodakodi (10 × crore × crore = 10¹⁵) palyopam.</p>
          <p className="text-muted-foreground">One kalchakra (time cycle) = 20 kodakodi sagaropam: an utsarpini and an avasarpini of 10 kodakodi each, with six aras apiece.</p>
        </div>
      </div>
      <div className="mt-5">
        <MiniChat toolId={toolId} title="Ganit tutor — step-by-step answers" suggestions={["How many hasta are in one yojan?", "Explain palyopam with the well example", "How long is Bharat kshetra in kos?", "What are the six aras of avasarpini?"]} />
      </div>
    </AppShell>
  );
}
