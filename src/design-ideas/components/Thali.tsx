import { useState } from "react";
import { Link } from "react-router-dom";
import type { ResolvedBundle } from "../data";
import { cn } from "@/lib/utils";
import { creditsLabel } from "../useDesignData";

/** A steel plate with one katori per app of the chosen bundle. */
export function ThaliPlate({ bundle }: { bundle: ResolvedBundle }) {
  const n = bundle.apps.length;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[440px]" role="img" aria-label={`${bundle.name}: ${bundle.apps.map((a) => a.name).join(", ")}`}>
      <div className="absolute inset-0 rounded-full border-[5px] border-ink bg-[radial-gradient(circle_at_35%_30%,#fff,#c9cfd4_58%,#9aa3aa)] shadow-[7px_7px_0_0_hsl(var(--ink))]" />
      <div className="absolute inset-[5%] rounded-full border-2 border-ink/30" />
      {bundle.apps.map((a, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(angle) * 32;
        const y = 50 + Math.sin(angle) * 32;
        return (
          <Link
            key={a.id}
            to={`/promo/${a.id}`}
            className="absolute flex aspect-square w-[27%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-ink p-1.5 text-center text-[11px] font-bold leading-tight text-ink transition-transform hover:scale-105 sm:text-[13px]"
            style={{ left: `${x}%`, top: `${y}%`, background: `radial-gradient(circle at 35% 30%, #fff, ${bundle.color} 70%)` }}
          >
            <span className="line-clamp-3">{a.name}</span>
          </Link>
        );
      })}
      <div className="absolute left-1/2 top-1/2 flex aspect-square w-[24%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink bg-[#f1c27a] p-1 text-center font-display text-[11px] font-bold leading-tight sm:text-[13px]">
        {bundle.name.replace(" Thali", "")}
      </div>
    </div>
  );
}

export function ThaliSection({ bundles, costOf }: { bundles: ResolvedBundle[]; costOf: (id: string) => number }) {
  const [id, setId] = useState(bundles[0]?.id);
  const bundle = bundles.find((b) => b.id === id) ?? bundles[0];
  if (!bundle) return null;
  const total = bundle.apps.reduce((s, a) => s + costOf(a.id), 0);
  return (
    <section aria-label="Thalis" className="mx-auto max-w-7xl px-4 py-12">
      <div className="block-card overflow-hidden bg-lime/50 p-5 md:p-8">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_minmax(0,440px)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Not sure what to pick?</p>
            <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">Take a thali: a few apps that go together</h2>
            <p className="mt-2 max-w-xl text-[16px] text-muted-foreground">Each thali is a set for one job. Open the apps one by one and pay credits only for each result.</p>
            <div role="tablist" aria-label="Choose a thali" className="mt-5 grid gap-2">
              {bundles.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={b.id === bundle.id}
                  onClick={() => setId(b.id)}
                  className={cn("flex items-center justify-between gap-3 rounded-xl border-2 border-ink px-4 py-3 text-left", b.id === bundle.id ? "bg-card shadow-block-sm" : "bg-card/60 hover:bg-card")}
                >
                  <span>
                    <span className="block font-display text-[15px] font-bold">{b.name}</span>
                    <span className="block text-[14px] text-muted-foreground">{b.line}</span>
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold">{b.apps.length} apps</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-[15px]">
              <b>{bundle.name}:</b> {bundle.apps.map((a) => a.name).join(", ")}. Using each once costs {creditsLabel(total)}.
            </p>
          </div>
          <ThaliPlate bundle={bundle} />
        </div>
      </div>
    </section>
  );
}
