import { useParams } from "react-router-dom";
import { useMemo } from "react";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { Navbar } from "@/components/Navbar";
import { LandingBody } from "@/components/seo/LandingBody";
import { PageSeo } from "@/components/seo/PageSeo";
import { humanize, landingMatches, industrySeo } from "@/lib/seoData";
import { MIN_LANDING_APPS } from "@/lib/seo/pages";
import { useAppCountLabel } from "@/lib/appCount";

const IndustryLanding = () => {
  const countLabel = useAppCountLabel();
  const { industry = "" } = useParams<{ industry: string }>();
  const human = humanize(industry);
  const { data: catalogue = [], isLoading: loading } = useToolsCatalog();
  const tools = useMemo(() => landingMatches(industry, catalogue.filter((t) => t.is_live)).slice(0, 60), [industry, catalogue]);

  const { title, description, keywords } = industrySeo(industry);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSeo
        title={title}
        description={description}
        keywords={keywords}
        path={`/ai-for/${industry}`}
        noindex={loading ? "keep" : tools.length < MIN_LANDING_APPS}
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
