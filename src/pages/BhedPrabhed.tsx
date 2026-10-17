import { Navbar } from "@/components/Navbar";
import { PageSeo } from "@/components/seo/PageSeo";
import { seoFor } from "@/lib/seo/pages";
import { Studio } from "@/bhed/components/studio";
import "@/bhed/bhed.css";

/** Bhed Prabhed: split a topic into भेद, and each of those into प्रभेद, as a table or a map. */
export default function BhedPrabhed() {
  return (
    <div className="min-h-screen bg-background">
      <PageSeo
        {...seoFor("/studios/bhed-prabhed", "")}
        jsonLd={{ "@context": "https://schema.org", "@type": "WebPage", name: "Bhed Prabhed", url: "https://ezyourlife.com/studios/bhed-prabhed" }}
      />
      <Navbar />
      <main>
        <Studio />
      </main>
    </div>
  );
}
