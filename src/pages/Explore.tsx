import { Navbar } from "@/components/Navbar";
import SEOFooter from "@/components/SEOFooter";
import { PageSeo } from "@/components/seo/PageSeo";
import { Link } from "react-router-dom";
import { USE_CASE_SEEDS, INDUSTRY_SEEDS, humanize } from "@/lib/seoData";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useAppCountLabel } from "@/lib/appCount";
import { categoriesOf } from "@/data/goals";

const TOP_USE_CASES = USE_CASE_SEEDS.slice(0, 80);
const TOP_INDUSTRIES = INDUSTRY_SEEDS.slice(0, 50);

const Explore = () => {
  const countLabel = useAppCountLabel();
  const { data: catalog = [] } = useToolsCatalog();
  const liveTools = catalog.filter((t) => t.is_live).sort((a, b) => a.name.localeCompare(b.name));
  const categories = Array.from(new Set(liveTools.flatMap((t) => categoriesOf(t)))).sort();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Explore AI apps by use case and industry",
    url: "https://ezyourlife.com/explore",
    description:
      `Browse ${countLabel} live AI apps by use case, industry, and category on EZYOURLIFE — the future's first AI app store.`,
  };

  return (
    <div className="min-h-screen bg-background">
      <PageSeo
        title="Explore AI Apps by Use Case & Industry | EZYOURLIFE"
        description="Browse every AI app on EZYOURLIFE by use case, industry, and category. Find the right AI app for any task — pay-as-you-go from ₹10."
        keywords="ai tool for, ai apps directory, ai for industry, browse ai tools, ai tool explorer, ezyourlife"
        path="/explore"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <header className="mb-12 rounded-3xl border-2 border-ink bg-lime p-6 shadow-block-lg md:p-10">
          <h1 className="text-3xl font-extrabold md:text-5xl">Find apps for your work</h1>
          <p className="mt-2 max-w-2xl text-lg text-ink/85">
            Pick your type of business or the job you need done. We show the apps that fit.
          </p>
        </header>

        <Section title="By business type" count={TOP_INDUSTRIES.length}>
          <LinkList items={TOP_INDUSTRIES.map((slug) => ({ to: `/ai-for/${slug}`, label: humanize(slug) }))} />
        </Section>

        <Section title="By job to do" count={TOP_USE_CASES.length}>
          <LinkList items={TOP_USE_CASES.map((slug) => ({ to: `/ai-tool-for/${slug}`, label: humanize(slug) }))} />
        </Section>

        <Section title="By type of app" count={categories.length}>
          <LinkList items={categories.map((c) => ({ to: `/ai-apps?category=${encodeURIComponent(c)}`, label: c }))} />
        </Section>

        <Section title={`All ${liveTools.length} apps`} count={liveTools.length}>
          <LinkList items={liveTools.map((t) => ({ to: `/tool/${t.id}`, label: t.name }))} />
        </Section>
      </main>
      <SEOFooter />
    </div>
  );
};

const Section = ({ title, count, children }: { title: string; count: number; children: React.ReactNode }) => (
  <section className="mb-12">
    <h2 className="mb-4 flex items-baseline gap-3 border-b-2 border-ink pb-3 text-2xl font-bold">
      {title}
      <span className="text-sm font-normal text-muted-foreground">{count}</span>
    </h2>
    {children}
  </section>
);

const LinkList = ({ items }: { items: { to: string; label: string }[] }) => (
  <ul className="flex flex-wrap gap-2">
    {items.map((it) => (
      <li key={it.to}>
        <Link to={it.to} className="inline-block rounded-full border-2 border-ink bg-card px-3 py-1 text-sm font-semibold transition-colors hover:bg-sun">
          {it.label}
        </Link>
      </li>
    ))}
  </ul>
);

export default Explore;
