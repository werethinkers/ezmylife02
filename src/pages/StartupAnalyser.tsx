import { SEOHead } from "@/components/SEOHead";
import StartupAnalyserApp from "@/startup-analyser/StartupAnalyserApp";

const StartupAnalyser = () => {
  return (
    <>
      <SEOHead
        title="AI Startup Analyser - Analyse Any Startup Instantly"
        description="Use EZYOURLIFE's AI Startup Analyser to get instant competitor analysis, financial projections, team assessment, and investment-ready reports for any startup."
        path="/startup-analyser"
        keywords="ai startup analyser, startup analysis tool, competitor analysis ai, startup evaluation, ezyourlife startup analyser"
      />
      <StartupAnalyserApp />
    </>
  );
};

export default StartupAnalyser;
