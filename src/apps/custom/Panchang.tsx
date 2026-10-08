import { useMemo, useState } from "react";
import { LocateFixed, Moon, Sunrise, Sunset } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "../shell/AppShell";
import { useAppStore } from "../lib/store";
import { APPS } from "../registry";

/*
 * Free, offline Jain day-timings calculator.
 * Sunrise/sunset: NOAA solar equations (about ±1 minute). Tithi: low-precision sun and moon
 * longitudes (Meeus), evaluated at local sunrise (udaya tithi). Pachchakkhan times use the
 * common definitions: Navkarsi = sunrise + 48 min; Porsi = 1 prahar (¼ of daytime);
 * Sadh-porsi = 1½ prahar; Purimaddh = 2 prahar; Avaddh = 3 prahar.
 */

const CITIES: Record<string, [number, number]> = {
  Indore: [22.7196, 75.8577], Mumbai: [19.076, 72.8777], Delhi: [28.6139, 77.209], Ahmedabad: [23.0225, 72.5714], Surat: [21.1702, 72.8311],
  Jaipur: [26.9124, 75.7873], Udaipur: [24.5854, 73.7125], Kolkata: [22.5726, 88.3639], Chennai: [13.0827, 80.2707], Bengaluru: [12.9716, 77.5946],
  Hyderabad: [17.385, 78.4867], Pune: [18.5204, 73.8567], Bhopal: [23.2599, 77.4126], Nagpur: [21.1458, 79.0882], Raipur: [21.2514, 81.6296],
  Lucknow: [26.8467, 80.9462], Palitana: [21.5222, 71.8237], "Shikharji (Madhuban)": [23.9617, 86.1345], Shravanabelagola: [12.8594, 76.4884], Gurugram: [28.4595, 77.0266],
};

const TITHI = ["Pratipada (Ekam)", "Dwitiya (Beej)", "Tritiya (Teej)", "Chaturthi (Choth)", "Panchami (Pancham)", "Shashthi (Chhath)", "Saptami (Satam)", "Ashtami (Atham)", "Navami (Nom)", "Dashami (Dasham)", "Ekadashi (Agiyaras)", "Dwadashi (Baras)", "Trayodashi (Teras)", "Chaturdashi (Chaudas)"];
const PARVA = new Set([2, 5, 8, 11, 14]);
const rad = Math.PI / 180;
const mod = (a: number, n: number) => ((a % n) + n) % n;

function sunTimes(date: Date, lat: number, lon: number, tz: number) {
  const start = Date.UTC(date.getFullYear(), 0, 1);
  const N = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000) + 1;
  const g = ((2 * Math.PI) / 365) * (N - 1);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl)) - Math.tan(lat * rad) * Math.tan(decl)) / rad;
  return { rise: 720 - 4 * (lon + ha) - eq + tz * 60, set: 720 - 4 * (lon - ha) - eq + tz * 60 };
}

function elongation(utcMs: number) {
  const d = utcMs / 86400000 + 2440587.5 - 2451545.0;
  const L = 280.46 + 0.9856474 * d, g = (357.528 + 0.9856003 * d) * rad;
  const sun = L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g);
  const Lm = 218.316 + 13.176396 * d, Mm = (134.963 + 13.064993 * d) * rad, F = (93.272 + 13.22935 * d) * rad, D = (297.85 + 12.190749 * d) * rad, M = (357.529 + 0.98560028 * d) * rad;
  const moon = Lm + 6.289 * Math.sin(Mm) + 1.274 * Math.sin(2 * D - Mm) + 0.658 * Math.sin(2 * D) + 0.214 * Math.sin(2 * Mm) - 0.186 * Math.sin(M) - 0.114 * Math.sin(2 * F);
  return mod(moon - sun, 360);
}

const hhmm = (min: number) => {
  const m = mod(Math.round(min), 1440);
  const h = Math.floor(m / 60), mm = m % 60;
  return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

function dayInfo(date: Date, lat: number, lon: number, tz: number) {
  const { rise, set } = sunTimes(date, lat, lon, tz);
  const day = set - rise;
  const riseUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) + (rise - tz * 60) * 60000;
  const e = elongation(riseUtc);
  const idx = Math.floor(e / 12); // 0..29
  // Find when this tithi ends (scan forward in 10-minute steps, up to 30 hours).
  let end = NaN;
  for (let t = 10; t <= 1800; t += 10) {
    if (Math.floor(elongation(riseUtc + t * 60000) / 12) !== idx) {
      end = rise + t;
      break;
    }
  }
  const shukla = idx < 15;
  const n = (idx % 15) + 1;
  const name = n === 15 ? (shukla ? "Purnima" : "Amavasya") : TITHI[n - 1];
  return {
    rise, set, day,
    navkarsi: rise + 48, porsi: rise + day / 4, sadhPorsi: rise + (day * 3) / 8, purimaddh: rise + day / 2, avaddh: rise + (day * 3) / 4,
    tithi: `${shukla ? "Shukla" : "Krishna"} ${name}`, parva: PARVA.has(n) || n === 15, tithiEnd: end,
  };
}

export default function Panchang({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const store = useAppStore<{ city: string; lat?: number; lon?: number; savedAt?: number }>(toolId, { city: "Indore" });
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const tz = -new Date().getTimezoneOffset() / 60;
  const coords: [number, number] = store.data.city === "My location" && store.data.lat !== undefined ? [store.data.lat, store.data.lon!] : CITIES[store.data.city] ?? CITIES.Indore;
  const date = new Date(dateStr + "T12:00:00");
  const info = useMemo(() => dayInfo(date, coords[0], coords[1], tz), [dateStr, coords[0], coords[1], tz]); // eslint-disable-line react-hooks/exhaustive-deps
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(date); d.setDate(d.getDate() + i); return { d, ...dayInfo(d, coords[0], coords[1], tz) }; }), [dateStr, coords[0], coords[1], tz]); // eslint-disable-line react-hooks/exhaustive-deps

  const locate = () => {
    if (!navigator.geolocation) return toast.error("Location isn't available in this browser.");
    navigator.geolocation.getCurrentPosition(
      (p) => store.update({ city: "My location", lat: p.coords.latitude, lon: p.coords.longitude }),
      () => toast.error("Location permission was denied — pick your city instead."),
    );
  };

  const rows: [string, number, string][] = [
    ["Navkarsi", info.navkarsi, "Sunrise + 48 minutes"],
    ["Porsi", info.porsi, "1 prahar after sunrise"],
    ["Sadh-porsi", info.sadhPorsi, "1½ prahar"],
    ["Purimaddh", info.purimaddh, "2 prahar (midday)"],
    ["Avaddh", info.avaddh, "3 prahar"],
    ["Chauvihar / sunset", info.set, "Finish food and water before sunset"],
  ];

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} syncState={store.syncState}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={store.data.city} onChange={(e) => store.update({ city: e.target.value })} aria-label="City">
          {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
          {store.data.city === "My location" && <option>My location</option>}
        </select>
        <Button variant="outline" className="gap-1.5" onClick={locate}><LocateFixed className="h-4 w-4" /> Use my location</Button>
        <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} className="w-auto" aria-label="Date" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border/60 bg-card p-4"><Sunrise className="h-5 w-5 text-amber-500" /><p className="mt-2 text-xs text-muted-foreground">Sunrise</p><p className="text-xl font-bold tabular-nums">{hhmm(info.rise)}</p></div>
            <div className="rounded-2xl border border-border/60 bg-card p-4"><Sunset className="h-5 w-5 text-orange-600" /><p className="mt-2 text-xs text-muted-foreground">Sunset</p><p className="text-xl font-bold tabular-nums">{hhmm(info.set)}</p></div>
            <div className={`rounded-2xl border p-4 ${info.parva ? "border-primary/50 bg-primary/5" : "border-border/60 bg-card"}`}><Moon className="h-5 w-5 text-indigo-500" /><p className="mt-2 text-xs text-muted-foreground">Tithi at sunrise</p><p className="text-sm font-bold leading-tight">{info.tithi}</p>{Number.isFinite(info.tithiEnd) && <p className="text-[11px] text-muted-foreground">until ~{hhmm(info.tithiEnd)}</p>}</div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <table className="w-full text-sm">
              <tbody>
                {rows.map(([n, t, sub]) => <tr key={n} className="border-b border-border/40 last:border-0"><td className="p-3"><p className="font-medium">{n}</p><p className="text-xs text-muted-foreground">{sub}</p></td><td className="p-3 text-right text-lg font-semibold tabular-nums">{hhmm(t)}</td></tr>)}
              </tbody>
            </table>
          </div>
          {info.parva && <p className="rounded-xl bg-primary/5 p-3 text-sm">Today is a parva tithi (Beej, Pancham, Atham, Agiyaras, Chaudas, Purnima or Amavasya) — many observe special vows.</p>}
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-3">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next 7 days</p>
          <ul className="mt-2 divide-y divide-border/40 text-sm">
            {week.map((w) => (
              <li key={w.d.toISOString()} className="flex items-center justify-between gap-2 px-1 py-2">
                <div><p className="font-medium">{w.d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p><p className={`text-xs ${w.parva ? "font-semibold text-primary" : "text-muted-foreground"}`}>{w.tithi}</p></div>
                <p className="text-right text-xs tabular-nums text-muted-foreground">↑ {hhmm(w.rise)}<br />↓ {hhmm(w.set)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Calculated in your browser for {store.data.city === "My location" ? "your location" : store.data.city} (accurate to about a minute for sun times; tithi changes are approximate). Your sangh's printed panchang decides parv dates and adhik/kshaya tithis.</p>
    </AppShell>
  );
}
