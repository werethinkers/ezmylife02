import { cn } from "@/lib/utils";

export type Feature = { title: string; line: string; needs: "Design only" | "Needs sign-in data" | "Needs a database change" | "Needs new content" };

const CHIP: Record<Feature["needs"], string> = {
  "Design only": "bg-lime",
  "Needs sign-in data": "bg-sun",
  "Needs a database change": "bg-coral",
  "Needs new content": "bg-pink",
};

/** "Features to add": what turns this design into the real thing, and what each needs. */
export function FeaturePanel({ title, features }: { title: string; features: Feature[] }) {
  return (
    <section aria-label="Features to add" className="mx-auto max-w-5xl px-4 pb-12">
      <div className="block-card bg-card p-5 md:p-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Features to add</p>
        <h2 className="mt-1 font-display text-xl font-bold md:text-2xl">What makes {title} real</h2>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {features.map((f) => (
            <li key={f.title} className="rounded-xl border-2 border-ink bg-background p-4">
              <p className="font-display text-[15px] font-bold">{f.title}</p>
              <p className="mt-1 text-[14px] text-muted-foreground">{f.line}</p>
              <span className={cn("mt-2 inline-block rounded-full border-2 border-ink px-2.5 py-0.5 text-[11px] font-semibold", CHIP[f.needs])}>{f.needs}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
