import { Navbar } from "@/components/Navbar";
import { PageSeo } from "@/components/seo/PageSeo";
import { seoFor } from "@/lib/seo/pages";
import { FurnitureStudio } from "@/furniture/FurnitureStudio";

/** Furniture Sheets: upload a furniture photo, get a technical design sheet drawn by Gemini. */
export default function FurnitureSheets() {
  return (
    <div className="min-h-screen bg-background">
      <PageSeo
        {...seoFor("/studios/furniture-sheets", "")}
        jsonLd={{ "@context": "https://schema.org", "@type": "WebPage", name: "Furniture Sheets", url: "https://ezyourlife.com/studios/furniture-sheets" }}
      />
      <Navbar />
      <main>
        <FurnitureStudio />
      </main>
    </div>
  );
}
