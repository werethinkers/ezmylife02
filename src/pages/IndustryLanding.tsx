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
  const description = `AI apps for ${human.toLowerCase()} businesses on EZYOURLIFE: bills, customers, staff and content. Runs in your browser, pay only for results, packs from ₹10, 100 free credits to start.`;
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

      <LandingBody
        tag="Business type"
        title={<>Apps for <span className="marker">{human.toLowerCase()}</span></>}
        line={`Apps that ${human.toLowerCase()} businesses use for bills, customers, staff and content. Open any app and pay only for results.`}
        color="hsl(var(--teal))"
        tools={tools}
        loading={loading}
        countLabel={countLabel}
        topic={human}
        showWebsites
      />
    </div>
  );
};

export default IndustryLanding;
