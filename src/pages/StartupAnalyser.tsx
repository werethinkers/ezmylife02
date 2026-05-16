import { SEOHead } from "@/components/SEOHead";
import StartupAnalyserApp from "@/startup-analyser/StartupAnalyserApp";
import { ToolBackButton } from "@/components/tools/ToolBackButton";

const StartupAnalyser = () => {
  return (
    <>
      <ToolBackButton floating />
      <SEOHead
        title="AI Startup Analyser - Analyse Any Startup Instantly"
        description="Use EZYOURLIFE's AI Startup Analyser to get instant competitor analysis, financial projections, team assessment, and investment-ready reports for any startup."
        path="/startup-analyser"
        keywords="ai startup analyser, startup analysis tool, competitor analysis ai, startup evaluation, ezyourlife startup analyser"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "AI Startup Analyser",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description: "AI-powered startup analysis tool for competitor research, financial projections, and investment-ready reports.",
            url: "https://ezyourlife.com/startup-analyser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            publisher: { "@type": "Organization", name: "EZYOURLIFE", url: "https://ezyourlife.com" },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://ezyourlife.com" },
              { "@type": "ListItem", position: 2, name: "Startup Analyser", item: "https://ezyourlife.com/startup-analyser" },
            ],
          },
        ]}
      />
      <StartupAnalyserApp />
    </>
  );
};

export default StartupAnalyser;
