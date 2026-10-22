import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GiveGet } from "@/components/brand/GiveGet";
import { ProductRenderer } from "@/instant/renderers";
import { inr, pageUrlFor } from "@/instant/util";
import type { Product } from "@/instant/types";
import { cn } from "@/lib/utils";

/** Products whose /make page uses the editorial layout below instead of the shared promo layout. */
export const EDITORIAL_PROMOS = new Set<string>(["get-well-soon"]);

interface Promo {
  eyebrow: string;
  audience: string;
  headline: string;
  pitch: string;
  features: { icon: string; title: string; text: string }[];
  steps: [string, string][];
  faqs: [string, string][];
}

interface Props {
  product: Product;
  promo: Promo;
  priceText: string;
  hasPrice: boolean;
  hosting: string;
  create: string;
  related: { product: Product; price: number }[];
}

const TICKS = ["Ready in about 5 minutes", "Opens on any phone, no app needed", "Free edits, same link"];
// One tile per feature, in order. Colours are the site's block colours; ink text stays readable on every one.
const TILES = [
  { span: "md:col-span-7", bg: "bg-coral", icon: "text-7xl" },
  { span: "md:col-span-5", bg: "bg-sun", icon: "text-7xl" },
  { span: "md:col-span-5", bg: "bg-teal", icon: "text-7xl" },
  { span: "md:col-span-7", bg: "bg-card", icon: "text-7xl" },
];

function Sunflower({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={className}>
      <g className="fill-sun stroke-ink" strokeWidth={5} strokeLinejoin="round">
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse key={i} cx="100" cy="34" rx="14" ry="34" transform={`rotate(${i * 30} 100 100)`} />
        ))}
      </g>
      <circle cx="100" cy="100" r="34" className="fill-ink stroke-ink" strokeWidth={5} />
      <circle cx="100" cy="100" r="22" fill="none" className="stroke-sun" strokeWidth={5} strokeDasharray="0.1 9" strokeLinecap="round" />
      <circle cx="100" cy="100" r="11" fill="none" className="stroke-sun" strokeWidth={5} strokeDasharray="0.1 8" strokeLinecap="round" />
    </svg>
  );
}

const field = "w-full rounded-xl border-2 border-ink bg-card px-4 text-base font-medium text-ink placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2";

export function EditorialPromo({ product, promo, priceText, hasPrice, hosting, create, related }: Props) {
  const [themeId, setThemeId] = useState(product.themes[0].id);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const theme = product.themes.find((t) => t.id === themeId) ?? product.themes[0];
  const sample = useMemo(
    () => ({ ...product.sample, recipient: name.trim() || product.sample.recipient, message: msg.trim() || product.sample.message }),
    [product.sample, name, msg],
  );
  const words = promo.headline.split(" ");
  const last = words.pop();
  const lead = words.join(" ");
  const cta = `Make your ${product.name.toLowerCase()}`;

  return (
    <>
      {/* HERO */}
      <section className="mx-auto max-w-7xl overflow-x-clip px-4 pb-14 pt-4 md:pt-8">
        <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="min-w-0 lg:pt-6">
            <p className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.16em]">
              <span className="h-0.5 w-7 bg-ink" aria-hidden="true" />
              {promo.eyebrow}
            </p>
            <h1 className="mt-5 font-display text-[2.7rem] font-extrabold leading-[1] tracking-tight text-balance sm:text-6xl xl:text-7xl">
              {lead}{" "}
              <span className="inline-flex items-center gap-3 whitespace-nowrap">
                <span className="marker">{last}</span>
                <Sunflower className="h-[0.8em] w-[0.8em] shrink-0 motion-safe:animate-ep-bob" />
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-xl font-semibold md:text-2xl">{product.tagline}</p>
            <p className="mt-3 max-w-xl text-lg text-muted-foreground">{promo.pitch}</p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Button asChild size="lg" className="h-14 px-8 text-base">
                <Link to={create}>{cta} <ArrowRight className="h-5 w-5" /></Link>
              </Button>
              <p className="text-[15px] leading-tight text-muted-foreground">
                <strong className="font-display text-xl text-ink">{priceText}</strong>{" "}
                {hasPrice ? "paid once" : "no payment"}
                <br />live for {hosting}
              </p>
            </div>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">You see the full result before you pay. Sign in is asked only when you publish.</p>

            <ul className="mt-8 grid gap-2.5 text-[15px] font-medium">
              {TICKS.map((x) => (
                <li key={x} className="flex items-center gap-2.5"><Check className="h-4 w-4 text-ink" strokeWidth={3} /> {x}</li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-[380px]">
            <div className="relative px-3 pt-6">
              <div aria-hidden="true" className="absolute left-1/2 top-14 aspect-square w-[108%] -translate-x-1/2 rounded-full border-2 border-ink bg-sun" />
              <div className="relative overflow-hidden rounded-[2.2rem] border-[9px] border-ink bg-ink shadow-block-lg">
                <div className="ip-frame relative h-[560px] overflow-hidden" style={{ transform: "translateZ(0)", ["--ip-vh" as string]: "560px", background: theme.c.bg }}>
                  <div className="h-full overflow-y-auto overflow-x-hidden">
                    <ProductRenderer product={product} theme={theme} content={sample} mode="preview" pageUrl={pageUrlFor()} />
                  </div>
                </div>
              </div>
              <span aria-hidden="true" className="pointer-events-none absolute right-2 top-0 rotate-6 rounded-xl border-2 border-ink bg-card px-3 py-1.5 text-sm font-bold shadow-block-sm">No app needed</span>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">Live sample · scroll and tap around</p>

            <div className="mt-6 rounded-2xl border-2 border-ink bg-card p-5 shadow-block">
              <p className="font-display text-base font-bold">Try it on the sample</p>
              <p className="mt-1 text-sm text-muted-foreground">Pick a style, type a name and a wish, then tap the card.</p>

              <fieldset className="mt-4">
                <legend className="mb-2 text-sm font-bold">{product.themes.length} styles to choose from</legend>
                <div className="flex flex-wrap gap-2">
                  {product.themes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={t.id === theme.id}
                      onClick={() => setThemeId(t.id)}
                      className={cn(
                        "flex min-h-11 items-center gap-2 rounded-xl border-2 border-ink px-3 text-sm font-semibold transition-colors",
                        t.id === theme.id ? "bg-sun shadow-block-sm" : "bg-card hover:bg-sand",
                      )}
                    >
                      <span className="flex gap-0.5" aria-hidden="true">
                        {[t.c.bg, t.c.ac, t.c.ac2].map((c, i) => <i key={i} className="h-4 w-4 rounded-full border-2 border-ink" style={{ background: c }} />)}
                      </span>
                      {t.name}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label htmlFor="ep-name" className="mt-4 block text-sm font-bold">Their name</label>
              <input id="ep-name" className={cn(field, "mt-1.5 h-12")} value={name} maxLength={24} placeholder={String(product.sample.recipient)} autoComplete="off" onChange={(e) => setName(e.target.value)} />
              <label htmlFor="ep-msg" className="mt-4 block text-sm font-bold">Your message</label>
              <textarea id="ep-msg" className={cn(field, "mt-1.5 py-3 leading-snug")} rows={3} value={msg} maxLength={220} placeholder={String(product.sample.message)} onChange={(e) => setMsg(e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section aria-labelledby="how-h" className="bg-ink text-cream">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <h2 id="how-h" className="font-display text-3xl font-extrabold md:text-5xl">How it <span className="text-sun">works</span></h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            {promo.steps.map(([t, d], i) => (
              <li key={t} className="border-t-2 border-cream pt-5">
                <span className="font-display text-6xl font-extrabold leading-none text-sun md:text-7xl">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-5 font-display text-xl font-bold">{t}</h3>
                <p className="mt-2 text-lg text-cream/85">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-28 md:pb-16">
        {/* WHAT YOU GET */}
        <section aria-labelledby="feat-h" className="pt-16 md:pt-24">
          <h2 id="feat-h" className="font-display text-3xl font-extrabold md:text-5xl">What you <span className="marker">get</span></h2>
          <div className="mt-10 grid gap-5 md:grid-cols-12">
            {promo.features.map((f, i) => {
              const t = TILES[i % TILES.length];
              return (
                <div key={f.title} className={cn("flex min-h-[260px] flex-col justify-between gap-8 rounded-3xl border-2 border-ink p-6 shadow-block md:p-8", t.span, t.bg)}>
                  <span className={cn("leading-none", t.icon)} aria-hidden="true">{f.icon}</span>
                  <div>
                    <h3 className="font-display text-2xl font-bold">{f.title}</h3>
                    <p className="mt-2 max-w-md text-lg">{f.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PRICE */}
        <section aria-labelledby="price-h" className="pt-16 md:pt-24">
          <div className="grid items-center gap-8 rounded-3xl border-2 border-ink bg-sun p-6 shadow-block-lg md:grid-cols-[auto_1fr] md:gap-14 md:p-12">
            <div>
              <p className="font-display text-7xl font-extrabold leading-none md:text-9xl">{priceText}</p>
              <p className="mt-3 text-lg font-semibold">{hasPrice ? "paid once" : "no payment"} · live for {hosting}</p>
            </div>
            <div className="min-w-0">
              <h2 id="price-h" className="font-display text-2xl font-bold md:text-3xl">{priceText}, paid once</h2>
              <p className="mt-2 text-lg">Your {product.name.toLowerCase()} {promo.audience}, live on its own link for {hosting}. Pay securely with UPI, cards or netbanking, and get your invoice by email right away.</p>
              <GiveGet className="mt-5" give="names, a photo and your message" get={`a card link to send on WhatsApp, live for ${hosting}`} time="about 5 minutes" />
              <Button asChild size="lg" className="mt-6 h-14 w-full px-8 text-base sm:w-auto">
                <Link to={create}>Start making <ArrowRight className="h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-h" className="grid gap-8 pt-16 md:pt-24 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <h2 id="faq-h" className="font-display text-3xl font-extrabold md:text-5xl">Questions</h2>
          <div className="grid gap-3">
            {promo.faqs.map(([q, a]) => (
              <details key={q} className="group rounded-2xl border-2 border-ink bg-card shadow-block-sm">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-5 text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink">
                  {q}
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-sun text-xl leading-none transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="px-5 pb-5 text-lg text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* OTHER DESIGNS */}
        {related.length > 0 && (
          <section aria-labelledby="rel-h" className="pt-16 md:pt-24">
            <h2 id="rel-h" className="font-display text-3xl font-extrabold md:text-5xl">Other <span className="marker">designs</span></h2>
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map(({ product: r, price: rp }) => (
                <Link key={r.id} to={`/make/${r.id}`} className="block-card block-lift p-4">
                  <span className="text-4xl" aria-hidden="true">{r.glyph}</span>
                  <p className="mt-2 font-bold leading-tight">{r.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{rp ? `${inr(rp)} once` : "Free"}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CLOSING CTA */}
        <section className="flex flex-col items-center gap-6 pt-20 text-center md:pt-28">
          <Sunflower className="h-20 w-20 motion-safe:animate-[spin_60s_linear_infinite]" />
          <h2 className="max-w-3xl font-display text-3xl font-extrabold text-balance md:text-5xl">Send a little <span className="marker">sunshine</span> today.</h2>
          <Button asChild size="lg" className="h-14 px-8 text-base">
            <Link to={create}>{cta} <ArrowRight className="h-5 w-5" /></Link>
          </Button>
          <p className="text-sm text-muted-foreground">{priceText} · {hasPrice ? "paid once" : "no payment"} · live for {hosting} · free edits, same link</p>
        </section>
      </main>
    </>
  );
}
