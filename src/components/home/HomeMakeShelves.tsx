import { Link } from "react-router-dom";
import { useProducts } from "@/instant/useProducts";
import { ProductCard } from "@/components/instant/ProductCard";
import { Shelf } from "@/components/store/Shelf";
import { Button } from "@/components/ui/button";
import { WEBSITE_CATEGORIES } from "@/components/brand/nav";
import { designPreviewUrl } from "@/data/previewManifest";
import { OrbitCarousel, RailGallery, type DesignPick } from "./Showcases";

/** Home page shelves for ready-made websites and festival cards (loads the design catalogue lazily). */
export default function HomeMakeShelves() {
  const { list } = useProducts();
  const allSites = list.filter((l) => (WEBSITE_CATEGORIES as readonly string[]).includes(l.product.category));
  const allFestival = list.filter((l) => l.product.category === "festivals");
  const sites = allSites.slice(0, 8);
  const festival = allFestival.slice(0, 8);
  // The rail and the ring need a phone picture of each design; without enough of them the plain shelves show instead.
  const picks = (items: typeof list, n: number): DesignPick[] =>
    items.filter((l) => designPreviewUrl(l.product.id)).slice(0, n).map((l) => ({ id: l.product.id, name: l.product.name, img: designPreviewUrl(l.product.id)!, to: `/make/${l.product.id}` }));
  const railSites = picks(allSites, 5);
  const ringCards = picks(allFestival, 5);
  const siteLine = `Websites, QR menus and visiting cards with WhatsApp built in. Pay once${Number.isFinite(Math.min(...allSites.map((l) => l.credits).filter((n) => n > 0))) ? `, from ${Math.min(...allSites.map((l) => l.credits).filter((n) => n > 0)).toLocaleString("en-IN")} credits` : ""}, online for a year.`;

  const shelf = (title: string, line: string, to: string, items: typeof list) =>
    items.length > 0 && (
      <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold md:text-[2rem]">{title}</h2>
            <p className="mt-1.5 max-w-2xl text-[16px] text-muted-foreground">{line}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={to}>See all</Link>
          </Button>
        </div>
        <Shelf>
          {items.map((l) => (
            <ProductCard key={l.product.id} l={l} />
          ))}
        </Shelf>
      </section>
    );

  return (
    <>
      {railSites.length >= 3 ? (
        <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold md:text-[2rem]">Your own website, tonight</h2>
              <p className="mt-1.5 max-w-2xl text-[16px] text-muted-foreground">{siteLine}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/websites">See all</Link>
            </Button>
          </div>
          <RailGallery items={railSites} flow="website" badge="Stays online" />
        </section>
      ) : (
        shelf("Your own website, tonight", siteLine, "/websites", sites)
      )}
      {ringCards.length >= 3 ? (
        <OrbitCarousel items={ringCards} title="Festival wishes" line="Send your family and customers a card that opens with a tap." seeAllTo="/cards?cat=festivals" seeAll="See all" />
      ) : (
        shelf("Festival wishes", "Send your family and customers a card that opens with a tap.", "/cards?cat=festivals", festival)
      )}
    </>
  );
}
