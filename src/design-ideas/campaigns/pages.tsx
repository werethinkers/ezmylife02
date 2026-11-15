import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { findApp } from "../data";
import { creditsLabel, useDesignData } from "../useDesignData";
import { BazaarHeader } from "../components/BazaarChrome";
import { FeaturePanel, type Feature } from "../FeaturePanel";
import { HERO_LINES, LOADING_LINES, POSTS, PUSH_LINES, ROASTS, priceJoke } from "./data";

/* Campaign pages for the stand-up voice. Each is a proper page with the real thing on it and a "Features to add" panel. */

function Frame({ kicker, title, where, features, children }: { kicker: string; title: string; where: string; features: Feature[]; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <BazaarHeader />
      <section className="mx-auto max-w-5xl px-4 pb-8 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{kicker}</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-[1.05] md:text-5xl">{title}</h1>
        <p className="mt-3 w-fit rounded-full border-2 border-ink bg-sun px-3 py-1 text-[13px] font-semibold">Shows up: {where}</p>
        <div className="mt-8">{children}</div>
        <ul className="mt-10 space-y-1 rounded-xl border-2 border-ink bg-ink p-4 text-[14px] text-background">
          <li>Roast the habit, never the person.</li>
          <li>Joke about ourselves first.</li>
          <li>End on a real app and its real price. No invented numbers.</li>
        </ul>
      </section>
      <FeaturePanel title={title} features={features} />
    </div>
  );
}

const STICKER = "block-card bg-card p-5";

/* 1. Roast My Dukaan */
export function RoastMachine() {
  const { live, costOf } = useDesignData();
  const kinds = Object.keys(ROASTS);
  const [kind, setKind] = useState(kinds[0]);
  const [n, setN] = useState(0);
  const list = ROASTS[kind];
  const r = list[n % list.length];
  const app = useMemo(() => findApp(live, r.app), [live, r]);
  return (
    <Frame kicker="Campaign · playable" title="Roast My Dukaan" where="Home page, below the search box" features={[
      { title: "Share card", line: "Every roast becomes a square image with the app name, ready for Instagram.", needs: "Design only" },
      { title: "More businesses", line: "Ten more kinds of shop, each with three roasts, checked by someone who runs one.", needs: "Needs new content" },
      { title: "Roast count", line: "Show which roast is picked most. Counted without names.", needs: "Needs a database change" },
    ]}>
      <div className="block-card bg-card p-5 md:p-7">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Pick your business">
          {kinds.map((k) => (
            <button key={k} type="button" aria-pressed={k === kind} onClick={() => { setKind(k); setN(0); }} className={cn("rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold", k === kind ? "bg-pink text-white" : "bg-card hover:bg-sun")}>{k}</button>
          ))}
        </div>
        <div className="mt-5 rounded-xl border-2 border-dashed border-ink p-5" aria-live="polite">
          <p className="font-display text-xl font-bold leading-snug md:text-2xl">{r.line}</p>
          <p className="mt-3 text-muted-foreground">{r.fix}</p>
          {app && (
            <Link to={`/promo/${app.id}`} className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-sun px-5 py-2 font-bold shadow-block-sm">
              {app.name} <span className="text-[13px] font-semibold">{creditsLabel(costOf(app.id))}</span>
            </Link>
          )}
        </div>
        <button type="button" onClick={() => setN(n + 1)} className="mt-4 rounded-full border-2 border-ink bg-teal px-5 py-2 font-bold shadow-block-sm">Roast me again</button>
      </div>
    </Frame>
  );
}

/* 2. Home page lines */
export function HeroLines() {
  const [i, setI] = useState(0);
  const l = HERO_LINES[i];
  return (
    <Frame kicker="Campaign" title="The honest home page line" where="Home page, top" features={[
      { title: "Test two lines", line: "Show half the visitors one line and half another, then keep the one more people tap.", needs: "Needs a database change" },
      { title: "Hindi and English toggle", line: "The same joke in plain English for people who want it.", needs: "Needs new content" },
    ]}>
      <div className="flex flex-wrap gap-2">
        {HERO_LINES.map((h, k) => (
          <button key={h.title} type="button" aria-pressed={k === i} onClick={() => setI(k)} className={cn("rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold", k === i ? "bg-pink text-white" : "bg-card hover:bg-sun")}>{h.title}</button>
        ))}
      </div>
      <div className="mt-6 border-[3px] border-ink bg-sun p-8 shadow-block-lg md:p-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]">Ezyourlife</p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-extrabold leading-[1.1] md:text-5xl">{l.text}</h2>
        <div className="mt-6 flex max-w-xl items-center gap-2 rounded-full border-2 border-ink bg-card px-4 py-3 text-muted-foreground">Kya kaam hai? Bill, photo, website…</div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{l.where}</p>
    </Frame>
  );
}

/* 3. Loading lines */
export function LoadingLines() {
  const [i, setI] = useState(0);
  const [p, setP] = useState(8);
  useEffect(() => {
    const t = setInterval(() => { setP((x) => (x >= 96 ? 8 : x + 11)); setI((x) => (x + 1) % LOADING_LINES.length); }, 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <Frame kicker="Campaign" title="Loading lines" where="While an app is working" features={[
      { title: "Match the app", line: "A bill app says bill jokes, a photo app says photo jokes.", needs: "Needs new content" },
      { title: "Stop the joke on errors", line: "If something fails, the joke goes away and a plain message takes its place.", needs: "Design only" },
    ]}>
      <div className="block-card mx-auto max-w-md bg-card p-6 text-center">
        <p className="min-h-[3.5rem] font-display text-lg font-bold" aria-live="polite">{LOADING_LINES[i]}</p>
        <div className="mt-4 h-4 overflow-hidden rounded-full border-2 border-ink bg-background" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-teal transition-all duration-700" style={{ width: `${p}%` }} />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">The bar and the lines here are a demo and move on their own.</p>
      </div>
    </Frame>
  );
}

/* 4. 404 */
export function NotFoundJoke() {
  return (
    <Frame kicker="Campaign" title="The 404 page" where="Any page that does not exist" features={[
      { title: "Suggest what they meant", line: "Show the three apps closest to the address they typed.", needs: "Design only" },
    ]}>
      <div className="block-card bg-card p-8 text-center md:p-14">
        <p className="font-display text-7xl font-extrabold md:text-9xl">404</p>
        <p className="mx-auto mt-4 max-w-xl font-display text-xl font-bold md:text-2xl">Ye page bhi aapke GST return ki tarah gayab hai.</p>
        <p className="mt-2 text-muted-foreground">Koi baat nahi. Chaliye wapas ghar.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full border-2 border-ink bg-sun px-6 py-2.5 font-bold shadow-block-sm">Ghar chalein</Link>
      </div>
    </Frame>
  );
}

/* 5. Price tags in plain words (real prices) */
export function PriceTags() {
  const { live, costOf } = useDesignData();
  const apps = useMemo(() => {
    const seen = new Set<string>();
    return [/invoice/i, /passport/i, /background/i, /rent/i, /business plan/i, /logo/i].map((re) => { const a = findApp(live, re, seen); if (a) seen.add(a.id); return a; }).filter(Boolean);
  }, [live]);
  return (
    <Frame kicker="Campaign · real prices" title="Price tags in plain words" where="On app cards" features={[
      { title: "Joke only on cheap apps", line: "Higher priced apps get a plain line, so the joke never feels like a pitch.", needs: "Design only" },
      { title: "Keep it true", line: "The joke is picked from the live price. If the price changes the line changes too.", needs: "Design only" },
    ]}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((a) => (
          <li key={a!.id} className={STICKER}>
            <p className="font-display text-base font-bold">{a!.name}</p>
            <p className="mt-2 font-display text-2xl font-extrabold">{creditsLabel(costOf(a!.id))}</p>
            <p className="text-[15px] text-muted-foreground">{costOf(a!.id) <= 3 ? priceJoke(costOf(a!.id)) : "Ek kaam, ek baar, ek saaf price."}</p>
            <Link to={`/promo/${a!.id}`} className="mt-3 inline-flex rounded-full border-2 border-ink bg-sun px-4 py-1.5 text-sm font-bold">Open</Link>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

/* 6. Refund line */
export function RefundLine() {
  return (
    <Frame kicker="Campaign · needs a check" title="The refund line" where="Support page and checkout" features={[
      { title: "Match the real rule", line: "Replace the words with the actual refund rule before it goes anywhere. The joke can stay, the promise cannot change.", needs: "Needs new content" },
    ]}>
      <div className="block-card max-w-2xl bg-card p-6 md:p-8">
        <h2 className="font-display text-2xl font-bold">Pasand nahi aaya?</h2>
        <p className="mt-3 text-[18px]">Bata dijiye. Hum bura nahi maanenge, bas thoda rooyenge.</p>
        <p className="mt-4 rounded-lg border-2 border-dashed border-ink p-3 text-[14px] text-muted-foreground">[The real refund rule goes here, in plain words, once Abhi confirms it.]</p>
      </div>
    </Frame>
  );
}

/* 7. Push notifications */
export function PushNotes() {
  return (
    <Frame kicker="Campaign" title="Push notifications" where="Phone app, once a day, only if they said yes" features={[
      { title: "One a day, never more", line: "A hard limit, and an easy off switch inside the app.", needs: "Design only" },
      { title: "Right job at the right time", line: "Bill nudges in the evening, reminder nudges in the morning.", needs: "Needs sign-in data" },
    ]}>
      <div className="mx-auto w-full max-w-sm rounded-[32px] border-[8px] border-ink bg-secondary p-4">
        <p className="mb-3 text-center text-sm font-semibold text-muted-foreground">Lock screen demo</p>
        <ul className="space-y-3">
          {PUSH_LINES.map((m) => (
            <li key={m.body} className="rounded-2xl border-2 border-ink bg-card p-3">
              <div className="flex justify-between text-[12px] font-semibold text-muted-foreground"><span>{m.title}</span><span>{m.time}</span></div>
              <p className="mt-1 text-[15px]">{m.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

/* 8. Instagram posts (posts only, no reels) */
export function InstagramPosts() {
  return (
    <Frame kicker="Campaign · posts only" title="Instagram posts" where="Instagram feed, one post at a time" features={[
      { title: "Matching home page strip", line: "The post's joke appears on the site for a day, linked to the same app.", needs: "Design only" },
      { title: "Real song check", line: "Pick the actual sound before posting and check its licence.", needs: "Needs new content" },
    ]}>
      <ul className="grid gap-6 md:grid-cols-2">
        {POSTS.map((p) => (
          <li key={p.hook} className="block-card flex flex-col gap-3 bg-card p-5">
            <div className="flex aspect-square items-center justify-center border-[3px] border-ink bg-pink p-6 text-center text-white">
              <p className="font-display text-xl font-extrabold leading-snug md:text-2xl">{p.hook}</p>
            </div>
            <p className="text-[15px]">{p.caption}</p>
            <p className="text-[13px] text-muted-foreground">{p.tags}</p>
            <p className="text-[13px] font-semibold">Sound to look for: {p.sound}</p>
          </li>
        ))}
      </ul>
    </Frame>
  );
}
