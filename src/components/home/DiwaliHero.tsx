import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// The live card needs the design catalogue; it loads after the words are on screen.
const DiwaliHeroCard = lazy(() => import("./DiwaliHeroCard"));

/** Shown on the home page until the end of 12 Nov 2026 (India time), then it hides itself. */
export const DIWALI_HERO_UNTIL = Date.parse("2026-11-13T00:00:00+05:30");
export const showDiwaliHero = (now = Date.now()) => now < DIWALI_HERO_UNTIL;

const MAKE = "/create/diwali?design=rajwada&src=home-hero";

/** Diwali 2026: one job on the first screen, sending Diwali wishes, with the Rajwada card playing live beside it. */
export function DiwaliHero() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 md:pt-10" aria-labelledby="diwali-hero-title">
      <div className="grid items-center gap-8 rounded-3xl border-2 border-ink bg-sun p-5 shadow-block md:p-10 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <span className="inline-flex items-center rounded-full border-2 border-ink bg-card px-3 py-1 text-[13px] font-bold">Diwali 2026 · Sunday 8 November</span>
          <h2 id="diwali-hero-title" className="mt-5 text-[2.1rem] font-extrabold leading-[1.06] sm:text-5xl xl:text-[3.6rem]">
            Indore, apne Diwali wishes <span className="marker">30 second mein</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
            Rajwada jagmagata hai, aapka naam aur message, aur har ek ko uske naam wala card. Ek baar banao, sabko WhatsApp par bhejo.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link to={MAKE} className="block-lift inline-flex min-h-[56px] items-center gap-2 rounded-full border-2 border-ink bg-ink px-6 text-lg font-bold text-cream shadow-block-sm">
              Apna Diwali card banao <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Suspense fallback={null}><DiwaliHeroCard part="price" /></Suspense>
          </div>
          <p className="mt-4 text-sm font-semibold text-ink/70">Hindi, Indori, English, Gujarati, Marathi and Tamil. Dhanteras, Bhai Dooj and Jain Diwali cards too.</p>
        </div>
        <div className="min-w-0 lg:col-span-5">
          <Suspense fallback={<div className="mx-auto h-[520px] w-full max-w-[360px] rounded-[2.4rem] border-[9px] border-ink bg-[#2A0609]" aria-hidden />}>
            <DiwaliHeroCard part="card" />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
