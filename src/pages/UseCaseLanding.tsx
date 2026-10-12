import { useParams } from "react-router-dom";
import { useMemo } from "react";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { Navbar } from "@/components/Navbar";
import { LandingBody } from "@/components/seo/LandingBody";
import { PageSeo } from "@/components/seo/PageSeo";
import { humanize, landingMatches, useCaseSeo } from "@/lib/seoData";
import { MIN_LANDING_APPS } from "@/lib/seo/pages";
import { useAppCountLabel } from "@/lib/appCount";

const UseCaseLanding = () => {
  const countLabel = useAppCountLabel();
  const { query = "" } = useParams<{ query: string }>();
  const human = humanize(query);
  const { data: catalogue = [], isLoading: loading } = useToolsCatalog();
  const tools = useMemo(() => landingMatches(query, catalogue.filter((t) => t.is_live)).slice(0, 36), [query, catalogue]);

  const { title, description, keywords } = useCaseSeo(query, tools.length);

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
      <PageSeo title={title} description={description} keywords={keywords} path={`/ai-tool-for/${query}`} jsonLd={jsonLd}
        noindex={loading ? "keep" : tools.length < MIN_LANDING_APPS} />
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
