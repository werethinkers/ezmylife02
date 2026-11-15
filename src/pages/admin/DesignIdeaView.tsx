import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Laptop, Smartphone } from "lucide-react";
import { PageSeo } from "@/components/seo/PageSeo";
import { isAdmin } from "@/lib/devApps";
import { ideaById } from "@/design-ideas/registry";
import { cn } from "@/lib/utils";

/*
 * One design idea on its own page (/admin/design-ideas/:id), for admins only.
 * ?bare=1 shows only the design (used by the previews); ?view=phone shows it in a phone-sized frame.
 */
export default function DesignIdeaView() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const idea = ideaById(id);
  const admin = useQuery({ queryKey: ["dev-is-admin"], queryFn: isAdmin, staleTime: 10 * 60 * 1000 });
  const bare = params.get("bare") === "1";
  const phone = params.get("view") === "phone";

  if (admin.isLoading) return <p className="p-8">Checking your access…</p>;
  if (admin.data !== true) return <p className="p-8">This page is for admins only.</p>;
  if (!idea) return <p className="p-8">No design with that name. <Link className="underline" to="/admin/design-ideas">Back to all ideas</Link></p>;

  const Page = idea.Page;
  if (bare) return (<><PageSeo title={`${idea.title} | EZYOURLIFE`} description="Private design idea." path={`/admin/design-ideas/${idea.id}`} noindex /><Page /></>);

  const tab = (on: boolean) => cn("inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 text-sm font-semibold", on ? "bg-sun" : "bg-card hover:bg-secondary");
  return (
    <div className={phone ? "min-h-screen bg-secondary" : "min-h-screen bg-background"}>
      <PageSeo title={`${idea.title} | EZYOURLIFE`} description="Private design idea." path={`/admin/design-ideas/${idea.id}`} noindex />
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-ink px-4 py-2 text-background">
        <Link to="/admin/design-ideas" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden />All design ideas</Link>
        <span className="font-display text-sm font-bold">{idea.title}</span>
        <div className="flex gap-2 text-ink">
          <Link to={`/admin/design-ideas/${idea.id}`} className={tab(!phone)}><Laptop className="h-4 w-4" aria-hidden />Laptop</Link>
          <Link to={`/admin/design-ideas/${idea.id}?view=phone`} className={tab(phone)}><Smartphone className="h-4 w-4" aria-hidden />Phone</Link>
        </div>
      </div>
      {phone ? (
        <div className="flex justify-center p-6">
          <div className="h-[820px] w-[390px] overflow-hidden rounded-[36px] border-[10px] border-ink bg-background shadow-block-lg">
            <iframe title={`${idea.title} on a phone`} src={`/admin/design-ideas/${idea.id}?bare=1`} className="h-full w-full border-0" />
          </div>
        </div>
      ) : (
        <Page />
      )}
    </div>
  );
}
