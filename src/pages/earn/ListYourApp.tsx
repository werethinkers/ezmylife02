import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, MessageSquareText } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import SEOFooter from "@/components/SEOFooter";
import { PageSeo } from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";
import { Shelf } from "@/components/store/Shelf";
import { AppTile } from "@/components/store/AppTile";
import { EarnFaq, EarnSection, EarnSteps, MessageUs } from "@/components/earn/EarnBits";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useAppCountLabel } from "@/lib/appCount";
import { seoFor } from "@/lib/seo/pages";
import { placedIn } from "@/data/placements";

const connectorUrl = `${import.meta.env.VITE_SUPABASE_URL ?? ""}/functions/v1/mcp`;

const STEPS = [
  { h: "Connect", d: "Add the EzYourLife connector in Claude and sign in with your Ezyourlife account." },
  { h: "Send", d: "Give Claude your project. It turns it into one file and sends it to us." },
  { h: "Check", d: "Our server checks the size, phone fit and listing, and you get a free live preview." },
  { h: "We review", d: "Our team tries your app, sets the credits per use and your share, and approves it." },
  { h: "It goes live", d: "Your app gets its own page in the store, next to every other app." },
];

const FITS = [
  "A web app in one file, up to 10 MB",
  "Works on a phone screen",
  "No keys or passwords inside the file",
  "No AI calls, own login or own payments: we handle credits",
  "A clear listing: what it does, what people give and what they get",
];

const FAQ = [
  { q: "What do I earn?", a: "A share of the credits people spend on your app. We agree the share with you when we approve it." },
  { q: "Who sets the price?", a: "Our team sets the credits per use when it approves your app. Nothing goes live without that approval." },
  { q: "Can I change my app later?", a: "Yes. A change goes in as a new version that we approve, and the live version keeps running until then." },
  { q: "Is it safe for the people who use it?", a: "Every listed app runs in a closed box on our site, so it cannot read anyone's account, payments or saved data." },
  { q: "I don't use Claude. Can I still list an app?", a: "Yes. Sign in, open your developer page and upload the file there." },
];

export default function ListYourApp() {
  const countLabel = useAppCountLabel();
  const { data: catalog = [] } = useToolsCatalog();
  const [copied, setCopied] = useState(false);
  // Builders' apps (ids starting "dev-") and apps marked "builders" show here by themselves.
  const listed = useMemo(() => placedIn(catalog, "builders", 14), [catalog]);

  const copy = () => {
    void navigator.clipboard?.writeText(connectorUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageSeo {...seoFor("/list-your-app", countLabel)} />
      <Navbar />

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-8 md:pt-14 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="min-w-0 lg:col-span-7">
          <span className="inline-flex items-center rounded-full border-2 border-ink bg-teal px-3 py-1 text-[13px] font-bold">For builders</span>
          <h1 className="mt-5 text-[2.1rem] font-extrabold leading-[1.08] sm:text-5xl xl:text-[3.6rem]">
            Built an app? <span className="inline-block -rotate-1 rounded-xl border-2 border-ink bg-sun px-2 shadow-block">List it with us.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Put your web app in the Ezyourlife store, next to {countLabel} business apps. People pay in credits when they use it, and you earn a share.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <a href="#start">List your app</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <a href="#message">Ask us first</a>
            </Button>
          </div>
        </div>

        <div className="min-w-0 lg:col-span-5">
          <div className="block-card flex flex-col gap-4 bg-card p-5 md:p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-ink bg-teal">
                <MessageSquareText className="h-4 w-4" aria-hidden />
              </span>
              <h2 className="text-lg font-bold">Say this to Claude</h2>
            </div>
            <p className="rounded-xl border-2 border-ink bg-background px-4 py-3 font-display text-lg font-bold">“Put my app on EzYourLife.”</p>
            <p className="text-[15px] text-muted-foreground">
              Claude adapts the code to our rules, sends it, fills in the store listing and runs our checks. You try it, then send it for review.
            </p>
          </div>
        </div>
      </section>

      <EarnSection id="how" title="How it works" tone="card">
        <EarnSteps steps={STEPS} colour="bg-teal/30" />
      </EarnSection>

      <EarnSection title="What fits today" line="Good fits: calculators, planners, trackers, small business tools and study tools.">
        <div className="grid gap-8 lg:grid-cols-2">
          <ul className="space-y-3">
            {FITS.map((f) => (
              <li key={f} className="flex items-start gap-3 rounded-xl border-2 border-ink bg-card px-4 py-3 text-[16px]">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-lime">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <EarnFaq items={FAQ} />
        </div>
      </EarnSection>

      <EarnSection id="start" title="Start here" tone="card">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="block-card flex min-w-0 flex-col gap-3 bg-teal/30 p-5 md:p-6">
            <h3 className="text-xl font-bold">In Claude</h3>
            <p className="text-[15px] text-ink/85">Add this address as a connector in Claude's settings, sign in, then say “Put my app on EzYourLife”.</p>
            <div className="flex flex-col gap-2 rounded-xl border-2 border-ink bg-card p-2 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 break-all px-2 py-1 text-[13px]">{connectorUrl}</code>
              <Button type="button" size="sm" variant="outline" onClick={copy} aria-label="Copy connector address" className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
          <div className="block-card flex min-w-0 flex-col gap-3 bg-sun/40 p-5 md:p-6">
            <h3 className="text-xl font-bold">On the website</h3>
            <p className="text-[15px] text-ink/85">Sign in, open your developer page, start an app and upload your file there.</p>
            <Button asChild className="mt-auto self-start">
              <Link to="/developer">Open my developer page</Link>
            </Button>
          </div>
        </div>
      </EarnSection>

      {listed.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <Shelf title="Apps from builders" subtitle="Already in the store">
            {listed.map((t) => (
              <AppTile key={t.id} tool={t} />
            ))}
          </Shelf>
        </section>
      )}

      <MessageUs
        title="Not sure your app fits? Ask us."
        line="Send the word LIST with a link to your app or a few lines about it. We tell you what to change, if anything."
        word="LIST"
        subject="I want to list my app"
        colour="bg-teal"
      />

      <SEOFooter />
    </div>
  );
}
