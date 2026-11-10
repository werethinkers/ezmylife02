import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import type { HeroSlide } from "@/components/store/HeroCarousel";
import { FlowSteps } from "@/components/brand/FlowSteps";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The moving showcases on the home page (Nov 2026 redesign). Each one shows real apps or designs,
// can be worked with the keyboard, pauses under the pointer and stays still for people who ask for
// less motion. Rows stay on one line and scroll sideways on small screens.

const wrap = (i: number, n: number) => ((i % n) + n) % n;
/** Signed distance from the current item, the short way round (-n/2 … n/2). */
const dist = (i: number, cur: number, n: number) => {
  let d = wrap(i - cur, n);
  if (d > n / 2) d -= n;
  return d;
};
const calm = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Steps on by itself every `ms` unless paused. */
function useAutoStep(count: number, ms: number) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || count < 2 || calm()) return;
    const t = setInterval(() => setStep((s) => s + 1), ms);
    return () => clearInterval(t);
  }, [paused, count, ms]);
  const hold = { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false), onFocusCapture: () => setPaused(true), onBlurCapture: () => setPaused(false) };
  return { step, setStep, hold };
}

const roundBtn = "flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-card shadow-block-sm transition-colors hover:bg-sun focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const pill = "rounded-full border-2 border-ink bg-card px-2.5 py-0.5 text-xs font-bold";

/** A wheel of names on the left and a stack of cards on the right. Picking a name brings its card to the front. */
export function FeatureCarousel({ slides, label, line }: { slides: HeroSlide[]; label: string; line?: string }) {
  const n = slides.length;
  const { step, setStep, hold } = useAutoStep(n, 3200);
  if (n < 3) return null;
  const cur = wrap(step, n);
  return (
    <section aria-label={label}>
      <h2 className="text-2xl font-bold md:text-[2rem]">{label}</h2>
      {line && <p className="mt-1.5 text-[16px] text-muted-foreground">{line}</p>}
      <div className="mt-6 flex flex-col overflow-hidden rounded-[28px] border-2 border-ink bg-sand shadow-block-lg lg:flex-row" {...hold}>
        <div className="relative h-[230px] overflow-hidden border-b-2 border-ink bg-pink lg:h-[500px] lg:w-[36%] lg:border-b-0 lg:border-r-2">
          {slides.map((s, i) => {
            const d = dist(i, cur, n);
            const on = d === 0;
            return (
              <div key={s.key} className="absolute left-6 top-1/2 -mt-6 h-12 transition-[transform,opacity] duration-700 ease-out lg:left-9" style={{ transform: `translateY(${d * 60}px)`, opacity: Math.max(0, 1 - Math.abs(d) * 0.25) }}>
                <button
                  type="button"
                  aria-pressed={on}
                  tabIndex={Math.abs(d) > 3 ? -1 : 0}
                  onClick={() => setStep((x) => x + d)}
                  className={cn(
                    "flex h-12 items-center gap-3 whitespace-nowrap rounded-full border-2 border-ink pl-2 pr-5 text-[15px] font-bold transition-[background-color,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on ? "bg-card shadow-block-sm" : "bg-transparent",
                  )}
                >
                  <span aria-hidden className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-ink font-display text-[11px] font-bold" style={{ background: s.color }}>
                    {s.title.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                  </span>
                  {s.title}
                </button>
              </div>
            );
          })}
        </div>
        <div className="relative flex h-[500px] min-w-0 flex-1 items-center justify-center overflow-hidden p-6">
          <div className="relative h-[430px] w-full max-w-[440px]">
            {slides.map((s, i) => {
              const d = dist(i, cur, n);
              const on = d === 0;
              const side = Math.abs(d) === 1;
              return (
                <div
                  key={s.key}
                  aria-hidden={!on}
                  className="block-card absolute inset-0 flex flex-col overflow-hidden transition-[transform,opacity] duration-500 ease-out"
                  style={{
                    background: `color-mix(in srgb, ${s.color} 38%, hsl(var(--card)))`,
                    transform: `translateX(${on ? 0 : side ? d * 110 : 0}px) scale(${on ? 1 : side ? 0.85 : 0.7}) rotate(${side ? d * 3 : 0}deg)`,
                    opacity: on ? 1 : side ? 0.45 : 0,
                    zIndex: on ? 20 : side ? 10 : 0,
                    pointerEvents: on ? "auto" : "none",
                  }}
                >
                  {s.image ? (
                    <img src={s.image} alt={on ? `${s.title}: what the app looks like` : ""} loading="lazy" className="aspect-video w-full border-b-2 border-ink bg-card object-cover" />
                  ) : (
                    <div aria-hidden className="aspect-video w-full border-b-2 border-ink" style={{ background: s.color }} />
                  )}
                  <div className="flex flex-1 flex-col gap-2 px-[18px] pb-[18px] pt-3.5">
                    <p className="font-display text-[19px] font-bold leading-tight">{s.title}</p>
                    <p className="text-[12.5px] font-semibold text-ink/75">{s.eyebrow}</p>
                    <p className="line-clamp-3 text-[14.5px] leading-snug">{s.line}</p>
                    <div className="mt-auto flex items-center gap-2.5">
                      <Button asChild variant="outline" size="sm" tabIndex={on ? 0 : -1}>
                        <Link to={s.to} tabIndex={on ? 0 : -1}>{s.cta}</Link>
                      </Button>
                      {s.price && <span className={pill}>{s.price}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/** One wide panel, the rest squeezed into strips. Tap a strip to open it. */
export function SqueezeCarousel({ slides, label }: { slides: HeroSlide[]; label: string }) {
  const n = slides.length;
  const [at, setAt] = useState(0);
  if (n < 3) return null;
  const cur = wrap(at, n);
  const s = slides[cur];
  return (
    <div>
      <div className="no-scrollbar overflow-x-auto pb-1.5">
        <div role="tablist" aria-label={label} className="flex h-[240px] min-w-[720px] gap-3 md:h-[340px]">
          {slides.map((p, i) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={i === cur}
              aria-label={p.title}
              onClick={() => setAt(i)}
              className={cn(
                "relative min-w-0 basis-0 overflow-hidden rounded-2xl border-2 border-ink shadow-block-sm transition-[flex-grow] duration-700 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                i !== cur && "hover:!grow-[1.8]",
              )}
              style={{ flexGrow: i === cur ? 9 : 1, background: p.color }}
            >
              {p.image && <img src={p.image} alt="" loading="lazy" className="absolute left-1/2 top-0 aspect-video h-full w-auto max-w-none -translate-x-1/2 object-cover" />}
              <span aria-hidden className={cn("absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-ink bg-card px-[3px] py-2.5 text-xs font-bold transition-opacity duration-300 [writing-mode:vertical-rl]", i === cur && "opacity-0")}>
                {p.title}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" aria-live="polite" className="mt-5 flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 flex-1 basis-[420px]">
          <p className="font-display text-[22px] font-bold leading-tight">{s.title}</p>
          <p className="mt-1.5 max-w-3xl text-[17px] text-muted-foreground">{s.line}</p>
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            <Button asChild>
              <Link to={s.to}>{s.cta}</Link>
            </Button>
            {s.price && <span className={cn(pill, "px-3 py-1 text-[13px]")}>{s.price}</span>}
            <span className="text-[13px] font-semibold text-muted-foreground">{s.eyebrow}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" className={roundBtn} aria-label="Previous" onClick={() => setAt((x) => x - 1)}><ArrowLeft className="h-[18px] w-[18px]" /></button>
          <button type="button" className={roundBtn} aria-label="Next" onClick={() => setAt((x) => x + 1)}><ArrowRight className="h-[18px] w-[18px]" /></button>
        </div>
      </div>
    </div>
  );
}

export interface DesignPick { id: string; name: string; img: string; to: string }

const RAIL_CSS = `
.rail-hang{perspective:900px;transform-origin:top center}
.rail-hang .gar{transform:rotateY(-44deg);transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.rail-hang:hover .gar,.rail-hang:focus-visible .gar,.rail-hang[aria-pressed="true"] .gar{transform:rotateY(0deg)}
.rail-hang:hover{animation:rail-sw 1.1s ease}
@keyframes rail-sw{0%{transform:rotate(0)}25%{transform:rotate(4deg)}55%{transform:rotate(-3deg)}80%{transform:rotate(1.5deg)}100%{transform:rotate(0)}}
@media (prefers-reduced-motion:reduce){.rail-hang:hover{animation:none}.rail-hang .gar{transition:none}}
`;

/** Designs hanging from a rail like clothes in a shop. They turn to face you on hover; pick one to see its steps. */
export function RailGallery({ items, flow, badge }: { items: DesignPick[]; flow: "website" | "card"; badge: string }) {
  const [at, setAt] = useState(0);
  if (items.length < 3) return null;
  const sel = items[Math.min(at, items.length - 1)];
  return (
    <div>
      <style>{RAIL_CSS}</style>
      <div className="no-scrollbar overflow-x-auto pb-3">
        <div className="min-w-[900px]">
          <div aria-hidden className="relative mx-2 h-3.5 rounded-full bg-ink">
            <span className="absolute -left-1.5 -top-[5px] h-6 w-6 rounded-full border-2 border-ink bg-sun" />
            <span className="absolute -right-1.5 -top-[5px] h-6 w-6 rounded-full border-2 border-ink bg-sun" />
          </div>
          <div className="flex justify-around px-7">
            {items.map((r, i) => (
              <button key={r.id} type="button" aria-pressed={i === at} aria-label={r.name} onClick={() => setAt(i)} className="rail-hang flex flex-col items-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <svg width="40" height="46" viewBox="0 0 40 46" fill="none" stroke="hsl(var(--ink))" strokeWidth="3" strokeLinecap="round" aria-hidden>
                  <path d="M20 0v10c0 5 7 4 7 9s-7 5-7 9" />
                  <path d="M20 28L3 43h34z" strokeLinejoin="round" />
                </svg>
                <span className={cn("gar -mt-1.5 block h-[284px] w-[168px] overflow-hidden rounded-[18px] border-2 border-ink bg-card", i === at ? "shadow-block-lg" : "shadow-block-sm")}>
                  <img src={r.img} alt="" loading="lazy" className="block h-full w-full object-cover object-top" />
                </span>
                <span className={cn("mt-3 max-w-[168px] truncate rounded-full border-2 border-ink px-3 py-0.5 text-[13px] font-bold", i === at ? "bg-sun" : "bg-card")}>{r.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="block-card mt-5 flex flex-wrap items-center gap-6 p-5" style={{ background: "color-mix(in srgb, hsl(var(--teal)) 30%, hsl(var(--card)))" }} aria-live="polite">
        <div className="min-w-0 flex-1 basis-[380px]">
          <span className={pill}>{badge}</span>
          <p className="mt-2.5 font-display text-2xl font-bold leading-tight">{sel.name}</p>
          <p className="mt-1.5">A ready design. Add your details and share one link.</p>
          <div className="mt-4 rounded-2xl border-2 border-ink bg-card px-3.5 pb-3.5 pt-2.5">
            <FlowSteps flow={flow} step={1} />
          </div>
        </div>
        <Button asChild size="lg">
          <Link to={sel.to}>See this design</Link>
        </Button>
      </div>
    </div>
  );
}

const ORBIT_COLOURS = ["hsl(var(--sun))", "hsl(var(--pink))", "hsl(var(--sky))", "hsl(var(--lime))", "hsl(var(--coral))"];

/** Cards riding a ring. Each step swings the next card to the top while the band changes colour. */
export function OrbitCarousel({ items, title, line, seeAllTo, seeAll }: { items: DesignPick[]; title: string; line: string; seeAllTo: string; seeAll: string }) {
  const m = Math.min(items.length, 6);
  const { step, setStep, hold } = useAutoStep(m, 4600);
  if (m < 3) return null;
  const list = items.slice(0, m);
  const cur = wrap(step, m);
  const turn = 360 / m;
  const rot = -step * turn;
  const sel = list[cur];
  return (
    <section className="border-y-2 border-ink transition-colors duration-1000" style={{ background: ORBIT_COLOURS[cur % ORBIT_COLOURS.length] }}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-8 px-4">
        <div className="min-w-0 flex-1 basis-[380px] py-12">
          <span className={pill}>Sent once</span>
          <h2 className="mt-3.5 text-2xl font-bold md:text-[2rem]">{title}</h2>
          <p className="mt-1.5 text-[16px]">{line}</p>
          <p aria-live="polite" className="mt-6 font-display text-[clamp(1.6rem,3vw,2.5rem)] font-extrabold leading-[1.1]">{sel.name}</p>
          <div className="mt-4 rounded-2xl border-2 border-ink bg-card px-3.5 pb-3.5 pt-2.5 shadow-block-sm">
            <FlowSteps flow="card" step={1} />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button type="button" className={roundBtn} aria-label="Previous card" onClick={() => setStep((x) => x - 1)}><ArrowLeft className="h-[18px] w-[18px]" /></button>
            <button type="button" className={roundBtn} aria-label="Next card" onClick={() => setStep((x) => x + 1)}><ArrowRight className="h-[18px] w-[18px]" /></button>
            <Button asChild>
              <Link to={sel.to}>See this design</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={seeAllTo}>{seeAll}</Link>
            </Button>
          </div>
        </div>
        <div className="relative h-[520px] min-w-0 flex-1 basis-[420px] overflow-hidden" {...hold}>
          <div aria-hidden className="absolute left-[calc(50%-300px)] top-[170px] h-[600px] w-[600px] rounded-full border-[3px] border-dashed border-ink" />
          <div className="absolute left-1/2 top-[470px] h-0 w-0 transition-transform duration-1000 ease-out" style={{ transform: `rotate(${rot}deg)` }}>
            {list.map((o, i) => (
              <div key={o.id} className="absolute left-0 top-0 h-0 w-0" style={{ transform: `rotate(${i * turn}deg) translateY(-300px)` }}>
                <button
                  type="button"
                  aria-label={o.name}
                  tabIndex={Math.abs(dist(i, cur, m)) > 1 ? -1 : 0}
                  onClick={() => setStep((x) => x + dist(i, cur, m))}
                  className="absolute -left-[84px] -top-[142px] h-[284px] w-[168px] overflow-hidden rounded-[18px] border-2 border-ink bg-card shadow-block transition-transform duration-1000 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ transform: `rotate(${-(rot + i * turn)}deg) scale(${i === cur ? 1.12 : 0.82})` }}
                >
                  <img src={o.img} alt="" loading="lazy" className="block h-full w-full object-cover object-top" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** A small fold under a card. Opening one closes the others (the parent holds which one is open). */
export function Fold({ open, onToggle, title, dark, children }: { open: boolean; onToggle: () => void; title: string; dark?: boolean; children: ReactNode }) {
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className={cn("flex min-h-[44px] w-full items-center justify-between border-t-2 px-6 py-2.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", dark ? "border-cream/60" : "border-ink")}
      >
        {title}
        <ChevronDown aria-hidden className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </>
  );
}
