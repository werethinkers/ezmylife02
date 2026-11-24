import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, Mail, MessageSquareText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageSeo } from "@/components/seo/PageSeo";
import { ToolCard } from "@/components/modern/ToolCard";
import { ModernPage } from "@/components/modern/ModernPage";
import { SectionHead } from "@/components/modern/ui";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, CONTAINER } from "@/components/modern/styles";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useAppCountLabel } from "@/lib/appCount";
import { seoFor } from "@/lib/seo/pages";
import { placedIn } from "@/data/placements";
import { SUPPORT_EMAIL } from "@/data/social";
import { cn } from "@/lib/utils";

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

// Below md: a single-row snap-scroll strip so cards peek in from the right; at md+ this is the same grid the page used before.
const STEPS_CAROUSEL = "flex overflow-x-auto snap-x snap-mandatory items-stretch gap-3.5 pb-3 -mx-4 px-4 scroll-px-4 no-scrollbar md:grid md:gap-4 md:pb-0 md:mx-0 md:px-0 sm:grid-cols-2 lg:grid-cols-5";
// A width (not just a min-width) so the card's text wraps instead of stretching the card to fit it unwrapped.
const STEP_CARD = "w-[82vw] max-w-[320px] shrink-0 snap-start whitespace-normal break-words md:w-auto md:max-w-none md:min-w-0 h-auto self-stretch";

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

  const mailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("I want to list my app")}&body=${encodeURIComponent("LIST\n\nMy name:\nMy app or a link to it:\nAbout it:\n")}`;

  const copy = () => {
    void navigator.clipboard?.writeText(connectorUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModernPage section="earn" className="overflow-x-hidden">
      <PageSeo {...seoFor("/list-your-app", countLabel)} />

      {/* Hero */}
      <section className={cn(CONTAINER, "grid gap-10 pb-12 pt-8 md:pt-14 lg:grid-cols-12 lg:items-center lg:gap-12")}>
        <div className="min-w-0 lg:col-span-7">
          <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-[13px] font-bold text-orange-800 dark:bg-orange-950 dark:text-orange-300">For builders</span>
          <h1 className="mt-5 font-display text-[2.1rem] font-extrabold leading-[1.08] sm:text-5xl xl:text-[3.6rem]">
            Built an app?{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-rose-500">List it with us.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Put your web app in the Ezyourlife store, next to {countLabel} business apps. People pay in credits when they use it, and you earn a share.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="#start" className={cn(BTN_PRIMARY, "h-12 px-6 text-base")}>
              List your app
            </a>
            <a href="#message" className={cn(BTN_OUTLINE, "h-12 px-6 text-base")}>
              Ask us first
            </a>
          </div>
        </div>

        <div className="min-w-0 lg:col-span-5">
          <div className={cn("flex flex-col gap-4 p-5 shadow-soft md:p-6", CARD)}>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950">
                <MessageSquareText className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden />
              </span>
              <h2 className="text-lg font-bold">Say this to Claude</h2>
            </div>
            <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-display text-lg font-bold dark:border-zinc-800 dark:bg-zinc-800/60">
              “Put my app on EzYourLife.”
            </p>
            <p className="text-[15px] text-zinc-600 dark:text-zinc-400">
              Claude adapts the code to our rules, sends it, fills in the store listing and runs our checks. You try it, then send it for review.
            </p>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-zinc-200 bg-zinc-50 py-12 dark:border-zinc-800 dark:bg-zinc-950/40 md:py-16">
        <div className={CONTAINER}>
          <SectionHead title="How it works" />
          <ol className={STEPS_CAROUSEL}>
            {STEPS.map((s, i) => (
              <li key={s.h} className={cn("flex flex-col gap-2 p-5", CARD, STEP_CARD)}>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-display text-base font-extrabold text-orange-700 dark:bg-orange-950 dark:text-orange-300" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="whitespace-normal break-words text-lg font-bold leading-snug">{s.h}</h3>
                <p className="whitespace-normal break-words text-[15px] text-zinc-600 dark:text-zinc-400">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={cn(CONTAINER, "py-12 md:py-16")}>
        <SectionHead title="What fits today" line="Good fits: calculators, planners, trackers, small business tools and study tools." />
        <div className="grid gap-8 lg:grid-cols-2">
          <ul className="space-y-3">
            {FITS.map((f) => (
              <li key={f} className={cn("flex items-start gap-3 px-4 py-3 text-[16px]", CARD)}>
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                  <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" aria-hidden />
                </span>
                {f}
              </li>
            ))}
          </ul>
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

      <section id="start" className="border-y border-zinc-200 bg-zinc-50 py-12 dark:border-zinc-800 dark:bg-zinc-950/40 md:py-16">
        <div className={CONTAINER}>
          <SectionHead title="Start here" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className={cn("flex min-w-0 flex-col gap-3 p-5 md:p-6", CARD)}>
              <h3 className="text-xl font-bold">In Claude</h3>
              <p className="text-[15px] text-zinc-600 dark:text-zinc-400">Add this address as a connector in Claude's settings, sign in, then say “Put my app on EzYourLife”.</p>
              <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all px-2 py-1 text-[13px]">{connectorUrl}</code>
                <button
                  type="button"
                  onClick={copy}
                  aria-label="Copy connector address"
                  className={cn(BTN_OUTLINE, "shrink-0 px-3 py-1.5 text-xs")}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div className={cn("flex min-w-0 flex-col gap-3 p-5 md:p-6", CARD)}>
              <h3 className="text-xl font-bold">On the website</h3>
              <p className="text-[15px] text-zinc-600 dark:text-zinc-400">Sign in, open your developer page, start an app and upload your file there.</p>
              <Link to="/developer" className={cn(BTN_PRIMARY, "mt-auto self-start")}>
                Open my developer page
              </Link>
            </div>
          </div>
        </div>
      </section>

      {listed.length > 0 && (
        <section className={cn(CONTAINER, "py-12")}>
          <SectionHead title="Apps from builders" line="Already in the store" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {listed.map((t) => (
              <ToolCard key={t.id} tool={t} size="md" />
            ))}
          </div>
        </section>
      )}

      <section id="message" className={cn(CONTAINER, "scroll-mt-24 py-12 md:py-16")}>
        <div className="flex flex-col gap-6 rounded-3xl bg-zinc-950 p-6 text-white shadow-soft-xl dark:bg-zinc-900 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="min-w-0 md:max-w-xl">
            <h2 className="font-display text-2xl font-extrabold leading-tight md:text-3xl">Not sure your app fits? Ask us.</h2>
            <p className="mt-2 text-[16px] text-zinc-300">Send the word LIST with a link to your app or a few lines about it. We tell you what to change, if anything.</p>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-80 md:shrink-0">
            <a href={mailHref} className={cn(BTN_PRIMARY, "h-12 w-full")}>
              <Mail className="h-4 w-4" /> Write to us
            </a>
            <p className="text-center text-[13px] text-zinc-400">{SUPPORT_EMAIL}</p>
          </div>
        </div>
      </section>
    </ModernPage>
  );
}
