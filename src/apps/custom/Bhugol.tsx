import { useState } from "react";
import { AppShell } from "../shell/AppShell";
import { APPS } from "../registry";
import { MiniChat } from "./MiniChat";

/*
 * Jambudvipa (1,00,000 yojan across) as described in Jain texts such as the Tattvartha Sutra:
 * seven kshetras separated by six varshadhar mountains; widths double from Bharat up to
 * Mahavideh and mirror to the north. Meru stands at the centre.
 */
interface Region {
  id: string;
  name: string;
  kind: "kshetra" | "mountain";
  width: number;
  color: string;
  about: string;
}

const R = (id: string, name: string, kind: Region["kind"], width: number, color: string, about: string): Region => ({ id, name, kind, width, color, about });
const SOUTH: Region[] = [
  R("bharat", "Bharat Kshetra", "kshetra", 526.3, "#f59e0b", "The southernmost kshetra, about 526 yojan wide. A karmabhumi (land of action) where the cycles of time — utsarpini and avasarpini — turn, and where tirthankaras arise in certain eras. The Vaitadhya range and the Ganga and Sindhu rivers divide it into six parts."),
  R("himavan", "Himavan (Chulla Himavant)", "mountain", 1052.6, "#a16207", "The first varshadhar (boundary) mountain, separating Bharat from Haimavat. Texts describe the Padma lake on its top as the source of the Ganga and Sindhu rivers."),
  R("haimavat", "Haimavat Kshetra", "kshetra", 2105.3, "#84cc16", "A bhogabhumi (land of enjoyment), where people live without toil from wish-fulfilling trees; described as the lowest grade of bhogabhumi."),
  R("mahahimavan", "Mahahimavan", "mountain", 4210.5, "#78716c", "The second varshadhar mountain, between Haimavat and Hari kshetra."),
  R("hari", "Hari (Harivarsh) Kshetra", "kshetra", 8421, "#22c55e", "A middle-grade bhogabhumi."),
  R("nishadh", "Nishadh", "mountain", 16842, "#b45309", "The third varshadhar mountain, bordering Mahavideh on the south."),
];
const VIDEH = R("videh", "Mahavideh Kshetra", "kshetra", 33684, "#0ea5e9", "The broad central kshetra with Mount Meru at its centre. A karmabhumi where, per tradition, tirthankaras are always present — Simandhar Swami is the best-known. Devkuru and Uttarkuru, regions of the highest bhogabhumi, lie on either side of Meru.");
const NORTH: Region[] = [
  R("neel", "Neel", "mountain", 16842, "#1d4ed8", "The fourth varshadhar mountain, bordering Mahavideh on the north."),
  R("ramyak", "Ramyak Kshetra", "kshetra", 8421, "#10b981", "A middle-grade bhogabhumi, mirroring Hari kshetra."),
  R("rukmi", "Rukmi", "mountain", 4210.5, "#d4d4d8", "The fifth varshadhar mountain."),
  R("hairanyavat", "Hairanyavat Kshetra", "kshetra", 2105.3, "#a3e635", "A lowest-grade bhogabhumi, mirroring Haimavat."),
  R("shikhari", "Shikhari", "mountain", 1052.6, "#92400e", "The sixth varshadhar mountain, separating Hairanyavat from Airavat."),
  R("airavat", "Airavat Kshetra", "kshetra", 526.3, "#f97316", "The northernmost kshetra, mirroring Bharat: a karmabhumi with the same turning cycles of time."),
];
const MERU = R("meru", "Mount Meru (Sumeru)", "mountain", 0, "#eab308", "The axis of the world in Jain cosmology, at the centre of Jambudvipa: described as 1,00,000 yojan tall (99,000 above ground, 1,000 below), with forests on its slopes and the Pandukvan on top, where the birth-bathing (janmabhishek) of tirthankaras is celebrated by the gods.");
const OCEAN = R("lavan", "Lavan Samudra", "kshetra", 0, "#38bdf8", "The salt ocean, 2,00,000 yojan wide, that encircles Jambudvipa. Beyond it lie further rings of continents and oceans — Dhatki Khand, Kalodadhi, Pushkarvar Dvip and more.");

const ALL = [...SOUTH, VIDEH, ...NORTH];
const SIZE = 400, C = SIZE / 2, RAD = 150;

export default function Bhugol({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const [sel, setSel] = useState<Region>(VIDEH);
  // Bands from south (bottom) to north (top), scaled to the circle's diameter.
  let y = C + RAD;
  const bands = ALL.map((r) => {
    const h = (r.width / 100000) * RAD * 2;
    y -= h;
    return { r, y, h };
  });
  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
        <div className="rounded-2xl border border-border/60 bg-card p-3">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-[520px]" role="img" aria-label="Map of Jambudvipa">
            <defs><clipPath id="jambu"><circle cx={C} cy={C} r={RAD} /></clipPath></defs>
            <circle cx={C} cy={C} r={C - 6} fill={OCEAN.color} opacity={sel.id === "lavan" ? 0.55 : 0.3} onClick={() => setSel(OCEAN)} className="cursor-pointer" />
            <g clipPath="url(#jambu)">
              {bands.map(({ r, y: by, h }) => (
                <rect key={r.id} x={0} y={by} width={SIZE} height={Math.max(h, 1.5)} fill={r.color} opacity={sel.id === r.id ? 1 : 0.75} stroke={sel.id === r.id ? "#111" : "none"} strokeWidth={1} className="cursor-pointer" onClick={() => setSel(r)}>
                  <title>{r.name}</title>
                </rect>
              ))}
            </g>
            <circle cx={C} cy={C} r={RAD} fill="none" stroke="#334155" strokeWidth={1.5} />
            <circle cx={C} cy={C} r={7} fill={MERU.color} stroke="#111" strokeWidth={sel.id === "meru" ? 2 : 1} className="cursor-pointer" onClick={() => setSel(MERU)}><title>Meru</title></circle>
            <text x={C} y={C + RAD - 4} textAnchor="middle" fontSize={9} fill="#111">Bharat</text>
            <text x={C} y={C - RAD + 11} textAnchor="middle" fontSize={9} fill="#111">Airavat</text>
            <text x={C + 60} y={C + 4} textAnchor="middle" fontSize={11} fill="#0c4a6e" fontWeight={600}>Mahavideh</text>
            <text x={C} y={22} textAnchor="middle" fontSize={10} fill="#075985">Lavan Samudra</text>
            <text x={SIZE - 20} y={C} fontSize={9} fill="#475569">N ↑</text>
          </svg>
          <p className="text-center text-[11px] text-muted-foreground">North is up. Band widths are to scale (Bharat ≈ 526 yojan … Mahavideh ≈ 33,684 yojan). Tap any region.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {[...ALL, MERU, OCEAN].map((r) => <button key={r.id} type="button" onClick={() => setSel(r)} className={`rounded-full border px-2 py-0.5 text-[11px] ${sel.id === r.id ? "border-primary bg-primary/10" : "border-border text-muted-foreground"}`}>{r.name.split(" (")[0]}</button>)}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{sel.kind === "mountain" ? "Mountain" : sel.id === "lavan" ? "Ocean" : "Kshetra (region)"}</p>
            <h2 className="mt-1 text-xl font-bold">{sel.name}</h2>
            {sel.width > 0 && <p className="text-sm text-muted-foreground">Width north–south ≈ {sel.width.toLocaleString("en-IN")} yojan</p>}
            <p className="mt-3 text-sm leading-relaxed">{sel.about}</p>
            <p className="mt-3 text-[11px] text-muted-foreground">Based on classical descriptions (e.g. Tattvartha Sutra, ch. 3). Details differ between texts and traditions.</p>
          </div>
          <MiniChat toolId={toolId} title="Ask about Jain cosmology" contextNote={`The user is viewing: ${sel.name}.`} suggestions={[`Tell me more about ${sel.name.split(" (")[0]}`, "What is the difference between karmabhumi and bhogabhumi?", "What lies beyond Lavan Samudra?"]} />
        </div>
      </div>
    </AppShell>
  );
}
