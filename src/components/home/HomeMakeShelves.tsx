import { Link } from "react-router-dom";
import { useProducts } from "@/instant/useProducts";
import { ProductCard } from "@/components/instant/ProductCard";
import { Shelf } from "@/components/store/Shelf";
import { Button } from "@/components/ui/button";
import { WEBSITE_CATEGORIES } from "@/components/brand/nav";

/** Home page shelves for ready-made websites and festival cards (loads the design catalogue lazily). */
export default function HomeMakeShelves() {
  const { list } = useProducts();
  const sites = list.filter((l) => (WEBSITE_CATEGORIES as readonly string[]).includes(l.product.category)).slice(0, 8);
  const festival = list.filter((l) => l.product.category === "festivals").slice(0, 8);
  const cheapestSite = Math.min(...list.filter((l) => (WEBSITE_CATEGORIES as readonly string[]).includes(l.product.category)).map((l) => l.credits).filter((n) => n > 0));

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
      {shelf(
        "Your own website, tonight",
        `Websites, QR menus and visiting cards with WhatsApp built in. Pay once${Number.isFinite(cheapestSite) ? `, from ${cheapestSite.toLocaleString("en-IN")} credits` : ""}, online for a year.`,
        "/websites",
        sites,
      )}
      {shelf("Festival wishes", "Send your family and customers a card that opens with a tap.", "/cards?cat=festivals", festival)}
    </>
  );
}
