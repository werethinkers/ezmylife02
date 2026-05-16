import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, ArrowRight, Search } from "lucide-react";
import { PageSeo } from "@/components/seo/PageSeo";
import { humanize } from "@/lib/seoData";

interface Tool {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

const UseCaseLanding = () => {
  const { query = "" } = useParams<{ query: string }>();
  const human = humanize(query);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokens = query.split("-").filter(t => t.length > 2);
    (async () => {
      const ors = tokens
        .flatMap(t => [`name.ilike.%${t}%`, `description.ilike.%${t}%`, `category.ilike.%${t}%`])
        .join(",");
      const { data } = await supabase
        .from("tools_catalog")
        .select("id,name,description,category")
        .eq("is_live", true)
        .or(ors || `name.ilike.%${query}%`)
        .limit(36);
      setTools((data as Tool[]) || []);
      setLoading(false);
    })();
  }, [query]);

  const title = `AI Tool for ${human} — Best Free AI App for ${human} | EZYOURLIFE`;
  const description = `Find the best AI tool for ${human.toLowerCase()} on EZYOURLIFE. Free, instant, no-signup AI apps for ${human.toLowerCase()} — powered by Gemini. Browse ${tools.length}+ matching tools.`;
  const keywords = `ai tool for ${human.toLowerCase()}, best ai for ${human.toLowerCase()}, free ${human.toLowerCase()} ai, online ${human.toLowerCase()} generator, ${human.toLowerCase()} ai app, ai app for ${human.toLowerCase()}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `AI Tools for ${human}`,
      description,
      url: `https://ezyourlife.com/ai-tool-for/${query}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `What is the best AI tool for ${human.toLowerCase()}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `EZYOURLIFE offers ${tools.length || "multiple"} AI tools for ${human.toLowerCase()}. The best one depends on your specific need — browse the curated list above to pick the right ${human.toLowerCase()} AI app for you.`,
          },
        },
        {
          "@type": "Question",
          name: `Is the ${human.toLowerCase()} AI tool free?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Yes — most ${human.toLowerCase()} tools on EZYOURLIFE include a generous free tier. Pay-as-you-go credits start at ₹10 for premium AI generations.`,
          },
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSeo title={title} description={description} keywords={keywords} path={`/ai-tool-for/${query}`} jsonLd={jsonLd} />
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-28 pb-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI App Store · Pay-as-you-go
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            AI Tool for <span className="text-primary">{human}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The best free AI apps for {human.toLowerCase()} — instant, browser-based, no signup required. Powered by Google Gemini and EZYOURLIFE's pay-as-you-go credits.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">
            {loading ? "Finding matching AI tools…" : `${tools.length} AI app${tools.length === 1 ? "" : "s"} for ${human.toLowerCase()}`}
          </h2>
          {!loading && tools.length === 0 ? (
            <Card className="p-8 text-center">
              <Search className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No exact match yet for "{human}"</p>
              <p className="text-muted-foreground mb-6">
                We're shipping new AI tools every week. Browse all 200+ live apps or request "{human}" — we'll build it within 24–48 hours.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button asChild><Link to="/ai-apps">Browse all AI tools</Link></Button>
                <Button asChild variant="outline"><Link to="/ai-apps?request=1">Request this tool</Link></Button>
              </div>
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

        <section className="prose prose-invert max-w-none mb-12">
          <h2 className="text-2xl font-semibold mb-4">Why use EZYOURLIFE for {human.toLowerCase()}?</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>✓ 200+ live AI tools for {human.toLowerCase()} and adjacent workflows (2,000+ launching within a year).</li>
            <li>✓ Pay-as-you-go credits from ₹10 — no subscriptions, no monthly lock-in.</li>
            <li>✓ Runs in your browser — nothing to install, no developer setup.</li>
            <li>✓ Powered by Google Gemini 2.5 with a smart fallback so generations don't fail under load.</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default UseCaseLanding;
