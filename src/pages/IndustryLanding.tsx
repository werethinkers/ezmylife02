import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";
import { PageSeo } from "@/components/seo/PageSeo";
import { humanize } from "@/lib/seoData";
import { useAppCountLabel } from "@/lib/appCount";

interface Tool {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

const IndustryLanding = () => {
  const countLabel = useAppCountLabel();
  const { industry = "" } = useParams<{ industry: string }>();
  const human = humanize(industry);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokens = industry.split("-").filter(t => t.length > 2);
    (async () => {
      const ors = tokens
        .flatMap(t => [`name.ilike.%${t}%`, `description.ilike.%${t}%`, `category.ilike.%${t}%`])
        .join(",");
      const { data } = await supabase
        .from("tools_catalog")
        .select("id,name,description,category")
        .eq("is_live", true)
        .or(ors || `category.ilike.%${industry}%`)
        .limit(60);
      setTools((data as Tool[]) || []);
      setLoading(false);
    })();
  }, [industry]);

  const title = `AI for ${human} — Best AI Tools & Apps for ${human} Industry | EZYOURLIFE`;
  const description = `Discover the best AI tools for the ${human.toLowerCase()} industry on EZYOURLIFE. Free, browser-based AI apps for ${human.toLowerCase()} professionals — pay-as-you-go from ₹10.`;
  const keywords = `ai for ${human.toLowerCase()}, ai tools for ${human.toLowerCase()}, ${human.toLowerCase()} ai software, best ai for ${human.toLowerCase()} industry, ${human.toLowerCase()} automation, free ${human.toLowerCase()} ai tools`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSeo
        title={title}
        description={description}
        keywords={keywords}
        path={`/ai-for/${industry}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          description,
          url: `https://ezyourlife.com/ai-for/${industry}`,
        }}
      />
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-28 pb-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Building2 className="w-4 h-4" /> {human} Industry
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            AI for <span className="text-primary">{human}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hand-picked AI tools for {human.toLowerCase()} teams — browser-based, pay-as-you-go, no integrations to maintain.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">
            {loading ? `Loading ${human.toLowerCase()} tools…` : `${tools.length} tools curated for ${human.toLowerCase()}`}
          </h2>
          {!loading && tools.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-lg font-medium mb-4">We're curating AI tools for the {human.toLowerCase()} industry.</p>
              <Button asChild><Link to="/ai-apps">Browse all {countLabel} AI tools</Link></Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map(t => (
                <Link key={t.id} to={`/tool/${t.id}`} className="group">
                  <Card className="p-5 h-full hover:border-primary/40 hover:shadow-lg transition-all">
                    <div className="text-xs text-muted-foreground mb-2">{t.category}</div>
                    <div className="font-semibold text-lg mb-2 group-hover:text-primary">{t.name}</div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{t.description}</p>
                    <div className="mt-4 inline-flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Open tool <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default IndustryLanding;
