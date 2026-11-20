import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/store/AppIcon";
import { giveGetFor } from "@/data/goals";
import SEOFooter from "@/components/SEOFooter";
import { ScrollRow } from "@/components/ui/scroll-row";

export interface LandingTool {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  tool_types?: string[] | null;
}

/**
 * Shared body for the "Apps for <business>" and "<job> made easy" landing pages: a coloured
 * header, the matching apps, a website nudge for businesses, plain reasons, and a request box.
 */
export function LandingBody({
  tag,
  title,
  line,
  color,
  tools,
  loading,
  countLabel,
  showWebsites,
  topic,
}: {
  tag: string;
  title: React.ReactNode;
  line: string;
  color: string;
  tools: LandingTool[];
  loading: boolean;
  countLabel: string;
  showWebsites?: boolean;
  topic: string;
}) {
  return (
    <>
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 md:pt-10">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm font-medium text-muted-foreground">
          <Link to="/explore" className="underline underline-offset-4 hover:text-ink">Find by business</Link>
          <span aria-hidden> › </span>
          <span>{topic}</span>
        </nav>
        <header className="rounded-3xl border-2 border-ink p-6 shadow-block-lg md:p-10" style={{ background: color }}>
          <span className="inline-flex rounded-full border-2 border-ink bg-card px-2.5 py-0.5 text-xs font-bold">{tag}</span>
          <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-lg text-ink/85">{line}</p>
        </header>

        <section className="mt-10">
          <h2 className="mb-5 text-2xl font-bold">
            {loading ? "Finding the right apps…" : tools.length ? `${tools.length} app${tools.length === 1 ? "" : "s"} for you` : "No exact match yet"}
          </h2>
          {!loading && tools.length === 0 ? (
            <div className="grid justify-items-center gap-3 rounded-2xl border-2 border-dashed border-ink/60 bg-sand/60 p-10 text-center">
              <p className="text-lg font-bold">We don't have an app just for {topic.toLowerCase()} yet</p>
              <p className="max-w-lg text-muted-foreground">Browse all {countLabel} apps, or tell us what you need and we'll look at building it.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild><Link to="/ai-apps">See all apps</Link></Button>
                <Button asChild variant="outline"><Link to="/ai-apps?request=1">Ask for this app</Link></Button>
              </div>
            </div>
          ) : (
            <ScrollRow size="card">
              {tools.map((t) => (
                <Link key={t.id} to={`/tool/${t.id}`} className="block-card block-lift group flex flex-col gap-3 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="flex items-center gap-3">
                    <AppIcon toolId={t.id} category={t.category ?? undefined} name={t.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{t.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{t.category}</p>
                    </div>
                  </div>
                  {t.description && <p className="line-clamp-2 text-sm text-muted-foreground">{t.description}</p>}
                  <p className="text-sm font-semibold">You get {giveGetFor(t.category, { toolTypes: t.tool_types }).get}</p>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold">
                    Open the app <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </ScrollRow>
          )}
        </section>

        {showWebsites && (
          <section className="mt-12 flex flex-col items-start justify-between gap-4 rounded-3xl border-2 border-ink bg-teal p-6 shadow-block md:flex-row md:items-center md:p-8">
            <div>
              <h2 className="text-2xl font-bold">A website for your {topic.toLowerCase()} business</h2>
              <p className="mt-1 text-ink/85">Ready-made designs with call and WhatsApp buttons. Pay once, online for a year.</p>
            </div>
            <Button asChild size="lg" variant="outline">
              <Link to="/websites">See website designs <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </section>
        )}

        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold">Why people use EZYOURLIFE</h2>
          <ul className="mt-4 space-y-2.5 text-[16px]">
            {[
              `${countLabel} apps for bills, customers, staff, photos and content in one place.`,
              "Pay only for results: credit packs from ₹10, no monthly plan.",
              "Runs in your browser on any phone or computer. Nothing to install.",
              "New accounts get 100 free credits to try things out.",
            ].map((x) => (
              <li key={x} className="flex gap-2">
                <Check className="mt-1 h-4 w-4 shrink-0 text-teal" /> {x}
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SEOFooter />
    </>
  );
}
