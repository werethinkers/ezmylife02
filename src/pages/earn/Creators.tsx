import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeIndianRupee, Globe, IdCard, Instagram, LayoutDashboard, Link2, Mail } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { PageSeo } from "@/components/seo/PageSeo";
import { ToolCard } from "@/components/modern/ToolCard";
import { ModernPage } from "@/components/modern/ModernPage";
import { SectionHead } from "@/components/modern/ui";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, CONTAINER, FOCUS_RING } from "@/components/modern/styles";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useAppCountLabel } from "@/lib/appCount";
import { seoFor } from "@/lib/seo/pages";
import { placedIn } from "@/data/placements";
import { KIT, TRADES } from "@/data/kit";
import { INSTAGRAM_HANDLE, SUPPORT_EMAIL, instagramDm } from "@/data/social";
import { cn } from "@/lib/utils";

const GETS = [
  { Icon: Globe, h: "A free website", d: "Live in your name, with your services and your Instagram." },
  { Icon: IdCard, h: "A free visiting card", d: "A digital card to share on WhatsApp and in your bio." },
  { Icon: Link2, h: "Your own offer page", d: "“For your followers”, with the end date and the number of offers you choose." },
  { Icon: BadgeIndianRupee, h: "Commission on every sale", d: "Every sale from your link earns you commission, shown sale by sale." },
];

const STEPS = [
  { h: "Create your account", d: "Sign up free with your email. Your link, dashboard and offer page open straight away." },
  { h: "We approve you", d: "We look at your profile, agree your commission with you and switch your link on." },
  { h: "Share your link", d: "Post it in a story, your bio or WhatsApp, marked as an ad as Instagram's rules ask." },
  { h: "Get paid", d: "Commission is approved after the buyer's 7-day refund window and paid by bank transfer." },
];

const FAQ = [
  { q: "How much commission do I get?", a: "We agree it with you before you start, and your dashboard shows it on every sale." },
  { q: "What if a buyer asks for a refund?", a: "Buyers have 7 days to ask. A refunded sale earns no commission, and you see every refund request on your dashboard." },
  { q: "Does it cost me anything?", a: "No. Your website and visiting card are free, and sharing your link costs nothing." },
  { q: "Who does it suit?", a: "Creators whose followers run or are starting a business: makeup artists and academies, social media managers, food and city pages, photographers, and business owners who post. If most of your followers are students, tell us and we will be honest about whether it fits." },
];

const DASH = ["Clicks", "Buyers", "Refund requests", "Your commission"];

// Below md: a single-row snap-scroll strip so cards peek in from the right; at md+ this is the same grid the page used before.
const APPS_CAROUSEL = "flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-3 -mx-4 px-4 scroll-px-4 no-scrollbar md:grid md:gap-5 md:pb-0 md:mx-0 md:px-0 md:grid-cols-2 lg:grid-cols-4";
const APPS_CARD = "min-w-[82%] shrink-0 snap-start sm:min-w-[65%] md:min-w-0 h-[230px] min-h-0 md:h-[260px]";
// Shared by "How it works" and "What you get": both are icon + title + paragraph cards in a 4-up grid.
const TEXT_CARD_CAROUSEL = "flex overflow-x-auto snap-x snap-mandatory items-stretch gap-3.5 pb-3 -mx-4 px-4 scroll-px-4 no-scrollbar md:grid md:gap-4 md:pb-0 md:mx-0 md:px-0 md:grid-cols-2 lg:grid-cols-4";
// A width (not just a min-width) so the card's text wraps instead of stretching the card to fit it unwrapped.
const TEXT_CARD = "w-[82vw] max-w-[320px] shrink-0 snap-start whitespace-normal break-words md:w-auto md:max-w-none md:min-w-0 h-auto self-stretch";

// Earnings calculator: a rough guide, not a promise. Commission is fixed at 10% and the kit is the
// one offer on /kit; the creator moves how many followers they have and what share of them buy.
const COMMISSION_PCT = 10;
const STANDARD_CONVERSION_PCT = 5;
const FOLLOWERS_MIN = 1_000;
const FOLLOWERS_MAX = 20_000_000;
const POS_MAX = 129;
const followersAt = (pos: number) => {
  if (pos >= POS_MAX) return FOLLOWERS_MAX;
  const raw = FOLLOWERS_MIN * Math.pow(10, pos / 30);
  const step = raw >= 10_000_000 ? 500_000 : raw >= 1_000_000 ? 50_000 : raw >= 100_000 ? 5_000 : raw >= 10_000 ? 500 : raw >= 2_000 ? 100 : 50;
  return Math.min(FOLLOWERS_MAX, Math.round(raw / step) * step);
};
const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const inWords = (n: number) => {
  const trim = (x: number) => String(Math.round(x * 10) / 10);
  if (n >= 10_000_000) return `${trim(n / 10_000_000)} crore`;
  if (n >= 100_000) return `${trim(n / 100_000)} lakh`;
  return "";
};

function EarningsEstimate() {
  const [pos, setPos] = useState(30); // 10,000 followers
  const [conversion, setConversion] = useState(STANDARD_CONVERSION_PCT);
  const followers = followersAt(pos);
  const buyers = Math.floor((followers * conversion) / 100);
  const earn = Math.round((buyers * KIT.inr * COMMISSION_PCT) / 100);
  const words = inWords(followers);

  return (
    <div className={cn("space-y-5 p-5 shadow-soft md:p-6", CARD)}>
      <div>
        <h3 className="text-xl font-bold">What could I earn?</h3>
        <p className="mt-1 text-[15px] text-zinc-600 dark:text-zinc-400">
          Slide to try it. This counts only the ₹{KIT.inr} kit, at {COMMISSION_PCT}% commission.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <label htmlFor="est-followers" className="text-[15px] font-semibold">Your followers</label>
          <span className="font-display text-lg font-bold sm:text-right">
            {followers.toLocaleString("en-IN")}
            {words && <span className="ml-1.5 text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">({words})</span>}
          </span>
        </div>
        <Slider id="est-followers" min={0} max={POS_MAX} step={1} value={[pos]} onValueChange={(v) => setPos(v[0])} aria-label="Your followers" />
        <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400"><span>1,000</span><span>2 crore</span></div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="est-conversion" className="text-[15px] font-semibold">Conversion rate</label>
          <span className="font-display text-lg font-bold">{conversion}%</span>
        </div>
        <Slider id="est-conversion" min={1} max={10} step={0.5} value={[conversion]} onValueChange={(v) => setConversion(v[0])} aria-label="Conversion rate" />
        <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400"><span>1%</span><span>10%</span></div>
        {conversion !== STANDARD_CONVERSION_PCT && (
          <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[13px] text-orange-900 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-200" role="status">
            {STANDARD_CONVERSION_PCT}% is the industry standard for a creator's link. Slide wherever you like and check the maths yourself.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/60">
          <div className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-400">People who buy</div>
          <div className="mt-1 font-display text-xl font-bold md:text-2xl">{buyers.toLocaleString("en-IN")}</div>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/40">
          <div className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-400">You could earn about</div>
          <div className="mt-1 font-display text-xl font-bold md:text-2xl">{inr(earn)}</div>
        </div>
      </div>
      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
        An estimate only. Real sales depend on your posts, and a refunded sale earns nothing. Your own commission is the one we agree with you.
      </p>
    </div>
  );
}

export default function Creators() {
  const countLabel = useAppCountLabel();
  const { data: catalog = [] } = useToolsCatalog();
  // Apps marked "creators" in the catalogue show here by themselves (src/data/placements.ts).
  const kitApps = useMemo(() => placedIn(catalog, "creators", 14), [catalog]);

  const mailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("I want to join as a creator")}&body=${encodeURIComponent("CREATOR\n\nMy name:\nMy Instagram or website:\nAbout me:\n")}`;

  return (
    <ModernPage section="earn" className="overflow-x-hidden">
      <PageSeo {...seoFor("/creators", countLabel)} />

      {/* Hero */}
      <section className={cn(CONTAINER, "grid gap-10 pb-12 pt-8 md:pt-14 lg:grid-cols-12 lg:items-center lg:gap-12")}>
        <div className="min-w-0 lg:col-span-7">
          <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-[13px] font-bold text-orange-800 dark:bg-orange-950 dark:text-orange-300">For creators</span>
          <h1 className="mt-5 font-display text-[2.1rem] font-extrabold leading-[1.08] sm:text-5xl xl:text-[3.6rem]">
            Share Ezyourlife.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-rose-500">Earn on every sale.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            If your followers run shops, salons or small businesses, give them our ₹{KIT.inr} kit: a website, a visiting card and {KIT.credits.toLocaleString("en-IN")} credits.
            You get your own link, and commission on every sale it brings.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/influencer" className={cn(BTN_PRIMARY, "h-12 px-6 text-base")}>
              Join free
            </Link>
            <a href="#how" className={cn(BTN_OUTLINE, "h-12 px-6 text-base")}>
              How it works
            </a>
          </div>
          <p className="mt-4 text-[15px] text-zinc-600 dark:text-zinc-400">
            Already joined?{" "}
            <Link to="/influencer" className={cn("font-semibold text-zinc-900 underline underline-offset-4 dark:text-zinc-100", FOCUS_RING)}>
              Open your dashboard
            </Link>
          </p>
        </div>

        <div className="min-w-0 lg:col-span-5">
          <div className={cn("flex flex-col gap-4 p-5 shadow-soft md:p-6", CARD)}>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950">
                <LayoutDashboard className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden />
              </span>
              <h2 className="text-lg font-bold">Your dashboard</h2>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {DASH.map((k) => (
                <div key={k} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/60">
                  <dt className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-400">{k}</dt>
                  <dd className="mt-1 font-display text-2xl font-bold">—</dd>
                </div>
              ))}
            </dl>
            <p className="text-[14px] text-zinc-600 dark:text-zinc-400">Your own numbers show here, live, with the commission on each sale.</p>
          </div>
        </div>
      </section>

      <section className={cn(CONTAINER, "py-12 md:py-16")}>
        <SectionHead eyebrow="What you get" title="Everything you need to earn" />
        <ul className={TEXT_CARD_CAROUSEL}>
          {GETS.map((g) => (
            <li key={g.h} className={cn("flex flex-col gap-2 p-5", CARD, TEXT_CARD)}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950">
                <g.Icon className="h-5 w-5 text-orange-600 dark:text-orange-400" aria-hidden />
              </span>
              <h3 className="whitespace-normal break-words text-lg font-bold">{g.h}</h3>
              <p className="whitespace-normal break-words text-[15px] text-zinc-600 dark:text-zinc-400">{g.d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-zinc-200 bg-zinc-50 py-12 dark:border-zinc-800 dark:bg-zinc-950/40 md:py-16">
        <div className={CONTAINER}>
          <SectionHead title="What your followers get" line={`One payment of ₹${KIT.inr}, made for each kind of business.`} />
          <div className="flex flex-col gap-6 rounded-3xl border-[1.5px] border-foreground bg-primary p-5 text-primary-foreground md:flex-row md:items-center md:justify-between md:p-8">
            <ul className="space-y-2 text-[16px]">
              {KIT.items.map((i) => (
                <li key={i.name} className="flex gap-2">
                  <span aria-hidden>✓</span>
                  <span>
                    {i.name} <span className="text-foreground/75">(worth {i.worth})</span>
                  </span>
                </li>
              ))}
              <li className="flex gap-2">
                <span aria-hidden>✓</span>
                <span>{KIT.credits.toLocaleString("en-IN")} credits for every app in the store</span>
              </li>
            </ul>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {TRADES.map((t) => (
                  <span key={t.key} className="rounded-full border border-foreground/30 bg-foreground/10 px-3 py-1 text-sm font-semibold backdrop-blur">
                    {t.label}
                  </span>
                ))}
              </div>
              <Link to="/kit" className={cn(BTN_OUTLINE, "self-start border-foreground/40 bg-foreground/10 text-foreground hover:bg-foreground/20")}>
                See the kit <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          {kitApps.length > 0 && (
            <div className="mt-10">
              <SectionHead title="Apps they use most" line="Included with their credits" />
              <div className={APPS_CAROUSEL}>
                {kitApps.map((t) => (
                  <ToolCard key={t.id} tool={t} size="md" className={APPS_CARD} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="how" className={cn(CONTAINER, "scroll-mt-24 py-12 md:py-16")}>
        <SectionHead title="How it works" />
        <ol className={TEXT_CARD_CAROUSEL}>
          {STEPS.map((s, i) => (
            <li key={s.h} className={cn("flex flex-col gap-2 p-5", CARD, TEXT_CARD)}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-display text-base font-extrabold text-orange-700 dark:bg-orange-950 dark:text-orange-300" aria-hidden>
                {i + 1}
              </span>
              <h3 className="whitespace-normal break-words text-lg font-bold leading-snug">{s.h}</h3>
              <p className="whitespace-normal break-words text-[15px] text-zinc-600 dark:text-zinc-400">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mx-auto mt-10 max-w-2xl">
          <EarningsEstimate />
        </div>
      </section>

      <section className={cn(CONTAINER, "py-12 md:py-16")}>
        <SectionHead title="Questions" />
        <div className="max-w-3xl">
          <Accordion type="single" collapsible className="space-y-3">
            {FAQ.map((f) => (
              <AccordionItem key={f.q} value={f.q} className={cn("rounded-xl px-4", CARD)}>
                <AccordionTrigger className="text-left text-[16px] font-bold hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-[15px] text-zinc-600 dark:text-zinc-400">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section id="message" className={cn(CONTAINER, "scroll-mt-24 py-12 md:py-16")}>
        <div className="flex flex-col gap-6 rounded-3xl bg-zinc-950 p-6 text-white shadow-soft-xl dark:bg-zinc-900 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="min-w-0 md:max-w-xl">
            <h2 className="font-display text-2xl font-extrabold leading-tight md:text-3xl">Rather talk to us first?</h2>
            <p className="mt-2 text-[16px] text-zinc-300">Send the word CREATOR with your name and your Instagram. We reply with a preview of your free website.</p>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-80 md:shrink-0">
            {INSTAGRAM_HANDLE && (
              <a href={instagramDm(INSTAGRAM_HANDLE)} target="_blank" rel="noopener noreferrer" className={cn(BTN_PRIMARY, "h-12 w-full")}>
                <Instagram className="h-4 w-4" /> DM @{INSTAGRAM_HANDLE}
              </a>
            )}
            <a href={mailHref} className={cn(INSTAGRAM_HANDLE ? BTN_OUTLINE : BTN_PRIMARY, "h-12 w-full", INSTAGRAM_HANDLE && "border-white/25 bg-transparent text-white hover:bg-white/10")}>
              <Mail className="h-4 w-4" /> Write to us
            </a>
            <p className="text-center text-[13px] text-zinc-400">{SUPPORT_EMAIL}</p>
          </div>
        </div>
      </section>
    </ModernPage>
  );
}
