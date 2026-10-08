import { Navbar } from "@/components/Navbar";
import { PageSeo } from "@/components/seo/PageSeo";
import { Link } from "react-router-dom";
import { USE_CASE_SEEDS, INDUSTRY_SEEDS, humanize } from "@/lib/seoData";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useAppCountLabel } from "@/lib/appCount";

const TOP_USE_CASES = USE_CASE_SEEDS.slice(0, 80);
const TOP_INDUSTRIES = INDUSTRY_SEEDS.slice(0, 50);

const Explore = () => {
  const countLabel = useAppCountLabel();
  const { data: catalog = [] } = useToolsCatalog();
  const liveTools = catalog.filter((t) => t.is_live).sort((a, b) => a.name.localeCompare(b.name));
  const categories = Array.from(new Set(liveTools.map((t) => t.category))).sort();

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

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Explore AI apps by use case and industry
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            An internal hub linking every "AI tool for…" page on EZYOURLIFE. Pick a use case, industry,
            category, or jump straight to a specific tool.
          </p>
        </header>

        <Section title="AI apps by use case" count={TOP_USE_CASES.length}>
          <LinkList items={TOP_USE_CASES.map((slug) => ({ to: `/ai-tool-for/${slug}`, label: `AI app for ${humanize(slug)}` }))} />
        </Section>

        <Section title="AI apps by industry" count={TOP_INDUSTRIES.length}>
          <LinkList items={TOP_INDUSTRIES.map((slug) => ({ to: `/ai-for/${slug}`, label: `AI for ${humanize(slug)}` }))} />
        </Section>

        <Section title="Browse by category" count={categories.length}>
          <LinkList items={categories.map((c) => ({ to: `/ai-apps?category=${encodeURIComponent(c)}`, label: c }))} />
        </Section>

        <Section title={`All ${liveTools.length} live AI apps`} count={liveTools.length}>
          <LinkList items={liveTools.map((t) => ({ to: `/tool/${t.id}`, label: t.name }))} />
        </Section>
      </main>
    </div>
  );
};

const Section = ({ title, count, children }: { title: string; count: number; children: React.ReactNode }) => (
  <section className="mb-12">
    <h2 className="text-2xl font-semibold mb-4 flex items-baseline gap-3">
      {title}
      <span className="text-sm font-normal text-muted-foreground">{count}</span>
    </h2>
    {children}
  </section>
);

const LinkList = ({ items }: { items: { to: string; label: string }[] }) => (
  <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 text-sm">
    {items.map((it) => (
      <li key={it.to}>
        <Link to={it.to} className="text-foreground/80 hover:text-primary hover:underline transition-colors">
          {it.label}
        </Link>
      </li>
    ))}
  </ul>
);

export default Explore;
