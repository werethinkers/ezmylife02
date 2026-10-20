import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeIndianRupee, Globe, IdCard, LayoutDashboard, Link2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import SEOFooter from "@/components/SEOFooter";
import { PageSeo } from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";
import { Shelf } from "@/components/store/Shelf";
import { AppTile } from "@/components/store/AppTile";
import { EarningsEstimate } from "@/components/earn/EarningsEstimate";
import { EarnFaq, EarnSection, EarnSteps, MessageUs } from "@/components/earn/EarnBits";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useAppCountLabel } from "@/lib/appCount";
import { seoFor } from "@/lib/seo/pages";
import { placedIn } from "@/data/placements";
import { KIT, TRADES } from "@/data/kit";

const GETS = [
  { Icon: Globe, h: "A free website", d: "Live in your name, with your services and your Instagram.", bg: "bg-pink/40" },
  { Icon: IdCard, h: "A free visiting card", d: "A digital card to share on WhatsApp and in your bio.", bg: "bg-sun/50" },
  { Icon: Link2, h: "Your own offer page", d: "“For your followers”, with the end date and the number of offers you choose.", bg: "bg-teal/40" },
  { Icon: BadgeIndianRupee, h: "Commission on every sale", d: "Every sale from your link earns you commission, shown sale by sale.", bg: "bg-sky/40" },
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

const DASH = [
  { k: "Clicks", bg: "bg-pink/40" },
  { k: "Buyers", bg: "bg-teal/40" },
  { k: "Refund requests", bg: "bg-sun/50" },
  { k: "Your commission", bg: "bg-sky/40" },
];

export default function Creators() {
  const countLabel = useAppCountLabel();
  const { data: catalog = [] } = useToolsCatalog();
  // Apps marked "creators" in the catalogue show here by themselves (src/data/placements.ts).
  const kitApps = useMemo(() => placedIn(catalog, "creators", 14), [catalog]);

  return (
    <div className="min-h-screen bg-background">
      <PageSeo {...seoFor("/creators", countLabel)} />
      <Navbar />

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-8 md:pt-14 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="min-w-0 lg:col-span-7">
          <span className="inline-flex items-center rounded-full border-2 border-ink bg-pink px-3 py-1 text-[13px] font-bold">For creators</span>
          <h1 className="mt-5 text-[2.1rem] font-extrabold leading-[1.08] sm:text-5xl xl:text-[3.6rem]">
            Share Ezyourlife. <span className="inline-block -rotate-1 rounded-xl border-2 border-ink bg-sun px-2 shadow-block">Earn on every sale.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            If your followers run shops, salons or small businesses, give them our ₹{KIT.inr} kit: a website, a visiting card and {KIT.credits.toLocaleString("en-IN")} credits.
            You get your own link, and commission on every sale it brings.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link to="/influencer">Join free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <a href="#how">How it works</a>
            </Button>
          </div>
          <p className="mt-4 text-[15px] text-muted-foreground">
            Already joined?{" "}
            <Link to="/influencer" className="font-semibold text-ink underline underline-offset-4">
              Open your dashboard
            </Link>
          </p>
        </div>

        <div className="min-w-0 lg:col-span-5">
          <div className="block-card flex flex-col gap-4 bg-card p-5 md:p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-ink bg-sun">
                <LayoutDashboard className="h-4 w-4" aria-hidden />
              </span>
              <h2 className="text-lg font-bold">Your dashboard</h2>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {DASH.map((d) => (
                <div key={d.k} className={`rounded-xl border-2 border-ink p-3 ${d.bg}`}>
                  <dt className="text-[13px] font-semibold">{d.k}</dt>
                  <dd className="mt-1 font-display text-2xl font-bold">—</dd>
                </div>
              ))}
            </dl>
            <p className="text-[14px] text-muted-foreground">Your own numbers show here, live, with the commission on each sale.</p>
          </div>
        </div>
      </section>

      <EarnSection title="What you get" tone="card">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GETS.map((g) => (
            <li key={g.h} className={`block-card flex flex-col gap-2 p-5 ${g.bg}`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink bg-card">
                <g.Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="text-lg font-bold">{g.h}</h3>
              <p className="text-[15px] text-ink/85">{g.d}</p>
            </li>
          ))}
        </ul>
      </EarnSection>

      <EarnSection title="What your followers get" line={`One payment of ₹${KIT.inr}, made for each kind of business.`}>
        <div className="flex flex-col gap-6 rounded-3xl border-2 border-ink bg-sun/40 p-5 md:flex-row md:items-center md:justify-between md:p-8">
          <ul className="space-y-2 text-[16px]">
            {KIT.items.map((i) => (
              <li key={i.name} className="flex gap-2">
                <span aria-hidden>✓</span>
                <span>
                  {i.name} <span className="text-muted-foreground">(worth {i.worth})</span>
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
                <span key={t.key} className="rounded-full border-2 border-ink bg-card px-3 py-1 text-sm font-semibold">
                  {t.label}
                </span>
              ))}
            </div>
            <Button asChild variant="outline" className="self-start">
              <Link to="/kit">
                See the kit <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        {kitApps.length > 0 && (
          <div className="mt-10">
            <Shelf title="Apps they use most" subtitle="Included with their credits">
              {kitApps.map((t) => (
                <AppTile key={t.id} tool={t} />
              ))}
            </Shelf>
          </div>
        )}
      </EarnSection>

      <EarnSection id="how" title="How it works" tone="card">
        <EarnSteps steps={STEPS} colour="bg-background" />
        <div className="mx-auto mt-10 max-w-2xl">
          <EarningsEstimate />
        </div>
      </EarnSection>

      <EarnSection title="Questions">
        <div className="max-w-3xl">
          <EarnFaq items={FAQ} />
        </div>
      </EarnSection>

      <MessageUs
        title="Rather talk to us first?"
        line="Send the word CREATOR with your name and your Instagram. We reply with a preview of your free website."
        word="CREATOR"
        subject="I want to join as a creator"
        colour="bg-pink"
      />

      <SEOFooter />
    </div>
  );
}
