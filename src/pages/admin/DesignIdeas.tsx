import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PageSeo } from "@/components/seo/PageSeo";
import { isAdmin } from "@/lib/devApps";
import { cn } from "@/lib/utils";
import { IDEAS } from "@/design-ideas/registry";

/*
 * Private list of design ideas (/admin/design-ideas), for admins only. Every idea has a live preview
 * and opens on its own page. Not in src/lib/seo/pages.ts, so it has no static page or sitemap entry.
 */
export default function DesignIdeas() {
  const [tab, setTab] = useState<"design" | "campaign">("design");
  const shown = IDEAS.filter((i) => (i.group === "campaign") === (tab === "campaign"));
  const admin = useQuery({ queryKey: ["dev-is-admin"], queryFn: isAdmin, staleTime: 10 * 60 * 1000 });
  return (
    <div className="min-h-screen bg-background">
      <PageSeo title="Design ideas | EZYOURLIFE" description="Private page with new design ideas." path="/admin/design-ideas" noindex />
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        {admin.isLoading && <p className="p-8">Checking your access…</p>}
        {!admin.isLoading && admin.data !== true && <p className="p-8">This page is for admins only.</p>}
        {admin.data === true && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Private · admins only</p>
            <h1 className="mt-1 text-3xl font-bold">Design ideas</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">New looks for the site, built from real parts and real apps. Open one to see it full page, or use the phone view to check small screens.</p>
            <div className="mt-6 flex gap-2" role="tablist" aria-label="Kind of idea">
              {([["design", "Designs"], ["campaign", "Campaigns"]] as const).map(([k, label]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-full border-2 border-ink px-5 py-1.5 text-sm font-bold", tab === k ? "bg-sun shadow-block-sm" : "bg-card hover:bg-secondary")}>{label}</button>
              ))}
            </div>
            <ul className="mt-6 grid gap-6 md:grid-cols-2">
              {shown.map((i) => (
                <li key={i.id} className="block-card flex flex-col overflow-hidden bg-card">
                  <div className="relative h-[230px] w-full overflow-hidden border-b-2 border-ink bg-background">
                    <iframe title={`${i.title} preview`} src={`/admin/design-ideas/${i.id}?bare=1`} loading="lazy" tabIndex={-1} className="pointer-events-none absolute left-0 top-0 origin-top-left border-0" style={{ width: 1280, height: 820, transform: "scale(0.42)" }} />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <span className="w-fit rounded-full border-2 border-ink bg-sun px-2.5 py-0.5 text-[12px] font-semibold">{i.tag}</span>
                    <h2 className="font-display text-lg font-bold">{i.title}</h2>
                    <p className="text-[15px] text-muted-foreground">{i.line}</p>
                    <div className="mt-auto flex gap-2 pt-2">
                      <Link to={`/admin/design-ideas/${i.id}`} className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-teal px-4 py-1.5 text-sm font-bold">
                        Open full page <ExternalLink className="h-4 w-4" aria-hidden />
                      </Link>
                      <Link to={`/admin/design-ideas/${i.id}?view=phone`} className="rounded-full border-2 border-ink bg-card px-4 py-1.5 text-sm font-bold hover:bg-secondary">Phone view</Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
