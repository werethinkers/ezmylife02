import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Instagram, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EARN_LINKS } from "@/components/brand/nav";
import { INSTAGRAM_HANDLE, SUPPORT_EMAIL, instagramDm } from "@/data/social";
import { cn } from "@/lib/utils";

/** Section wrapper used on both earn pages. `tone` "card" gives a white band with ink rules. */
export function EarnSection({ id, title, line, tone, children }: { id?: string; title: string; line?: string; tone?: "card"; children: ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-24", tone === "card" && "border-y-2 border-ink bg-card")}>
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <h2 className="text-2xl font-bold md:text-[2rem]">{title}</h2>
        {line && <p className="mt-1.5 max-w-2xl text-[16px] text-muted-foreground">{line}</p>}
        <div className="mt-7">{children}</div>
      </div>
    </section>
  );
}

/** Numbered steps: one column on a phone, a row from tablets up. */
export function EarnSteps({ steps, colour }: { steps: { h: string; d: string }[]; colour: string }) {
  return (
    <ol className={cn("grid gap-4 sm:grid-cols-2", steps.length > 4 ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
      {steps.map((s, i) => (
        <li key={s.h} className={cn("block-card flex flex-col gap-2 p-5", colour)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-sun font-display text-base font-extrabold" aria-hidden>
            {i + 1}
          </span>
          <h3 className="text-lg font-bold leading-snug">{s.h}</h3>
          <p className="text-[15px] text-ink/85">{s.d}</p>
        </li>
      ))}
    </ol>
  );
}

export function EarnFaq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <Accordion type="single" collapsible className="space-y-3">
      {items.map((f) => (
        <AccordionItem key={f.q} value={f.q} className="rounded-xl border-2 border-ink bg-background px-4">
          <AccordionTrigger className="text-left text-[16px] font-bold hover:no-underline">{f.q}</AccordionTrigger>
          <AccordionContent className="text-[15px] text-ink/85">{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/**
 * "Message us" box. Email always works; the Instagram button appears once the handle is set in
 * src/data/social.ts. `word` is what people send, so replies are easy to sort.
 */
export function MessageUs({ title, line, word, subject, colour }: { title: string; line: string; word: string; subject: string; colour: string }) {
  const mail = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${word}\n\nMy name:\nMy Instagram or website:\nAbout me:\n`)}`;
  return (
    <section id="message" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 md:py-16">
      <div className={cn("flex flex-col gap-6 rounded-3xl border-2 border-ink p-6 shadow-block-lg md:flex-row md:items-center md:justify-between md:p-10", colour)}>
        <div className="min-w-0 md:max-w-xl">
          <h2 className="text-2xl font-extrabold leading-tight md:text-3xl">{title}</h2>
          <p className="mt-2 text-[16px] text-ink/85">{line}</p>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-80 md:shrink-0">
          {INSTAGRAM_HANDLE && (
            <Button asChild size="lg" className="h-12 w-full bg-ink text-cream hover:bg-ink/90">
              <a href={instagramDm(INSTAGRAM_HANDLE)} target="_blank" rel="noopener noreferrer">
                <Instagram className="h-4 w-4" /> DM @{INSTAGRAM_HANDLE}
              </a>
            </Button>
          )}
          <Button asChild size="lg" variant={INSTAGRAM_HANDLE ? "outline" : "default"} className={cn("h-12 w-full", !INSTAGRAM_HANDLE && "bg-ink text-cream hover:bg-ink/90")}>
            <a href={mail}>
              <Mail className="h-4 w-4" /> Write to us
            </a>
          </Button>
          <p className="text-center text-[13px] text-ink/75">{SUPPORT_EMAIL}</p>
        </div>
      </div>
    </section>
  );
}

/** The home page band: one card for creators, one for builders. */
export function EarnBand() {
  const cards = [
    { ...EARN_LINKS[0], tag: "For creators", h: "Share Ezyourlife. Earn on every sale.", d: "A free website and visiting card in your name, your own link, and a live dashboard of clicks, buyers and commission.", go: "See how it works", bg: "bg-pink" },
    { ...EARN_LINKS[1], tag: "For builders", h: "Built an app? List it with us.", d: "Say “Put my app on EzYourLife” in Claude. We review it, set the price, and you earn a share when people use it.", go: "List your app", bg: "bg-teal" },
  ];
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {cards.map((c) => (
        <Link key={c.to} to={c.to} className={cn("block-card block-lift flex flex-col gap-3 p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", c.bg)}>
          <div className="flex items-center justify-between gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-card">
              <c.Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="rounded-full border-2 border-ink bg-card px-2.5 py-0.5 text-xs font-bold">{c.tag}</span>
          </div>
          <h3 className="text-[22px] font-extrabold leading-tight">{c.h}</h3>
          <p className="text-[16px] text-ink/85">{c.d}</p>
          <span className="mt-auto inline-flex items-center gap-1.5 pt-2 font-bold">
            {c.go} <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      ))}
    </div>
  );
}
