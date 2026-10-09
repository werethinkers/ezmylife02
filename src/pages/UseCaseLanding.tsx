import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { LandingBody } from "@/components/seo/LandingBody";
import { PageSeo } from "@/components/seo/PageSeo";
import { humanize } from "@/lib/seoData";
import { useAppCountLabel } from "@/lib/appCount";

interface Tool {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

const UseCaseLanding = () => {
  const countLabel = useAppCountLabel();
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
  const description = `AI apps for ${human.toLowerCase()} on EZYOURLIFE. Runs in your browser, pay only for results, 100 free credits to start. ${tools.length ? `${tools.length} matching apps.` : ""}`.trim();
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
            text: `EZYOURLIFE offers ${tools.length || "multiple"} AI tools for ${human.toLowerCase()}. The best one depends on your specific need — browse the list on this page to pick the right ${human.toLowerCase()} app for you.`,
          },
        },
        {
          "@type": "Question",
          name: `Can I try the ${human.toLowerCase()} apps for free?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `New accounts get 100 free credits to try any ${human.toLowerCase()} app. After that, credit packs start at ₹10 and an app uses credits only when it gives you a result.`,
          },
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSeo title={title} description={description} keywords={keywords} path={`/ai-tool-for/${query}`} jsonLd={jsonLd} />
      <Navbar />

      <LandingBody
        tag="Job to do"
        title={<><span className="marker">{human}</span> made easy</>}
        line={`Apps that help with ${human.toLowerCase()}. Open one, fill in a few details, and pay only when it gives you a result.`}
        color="hsl(var(--sky))"
        tools={tools}
        loading={loading}
        countLabel={countLabel}
        topic={human}
      />
    </div>
  );
};

export default UseCaseLanding;
