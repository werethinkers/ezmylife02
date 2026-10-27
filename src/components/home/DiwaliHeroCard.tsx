import { getProduct } from "@/instant/catalog";
import { DeviceFrame } from "@/instant/DesignPreview";
import { INDORI_LINES } from "@/instant/festLang";
import { useProducts } from "@/instant/useProducts";
import { inr } from "@/instant/util";

/** The Diwali card in the Rajwada design, live and tappable, or its real price from ip_products. */
export default function DiwaliHeroCard({ part }: { part: "card" | "price" }) {
  const product = getProduct("diwali");
  const { list } = useProducts();
  if (!product) return null;
  if (part === "price") {
    const price = list.find((l) => l.product.id === "diwali")?.price ?? product.price;
    return <span className="text-sm font-bold">{price === 0 ? "Free to send" : `${inr(price)} per card, everyone on your list included`}</span>;
  }
  const theme = product.themes.find((t) => t.id === "rajwada") ?? product.themes[0];
  const content = { ...product.sample, sender: "Aapka naam", message: INDORI_LINES[0], cover: "" };
  return (
    <div>
      <DeviceFrame product={product} theme={theme} content={content} device="phone" height={520} />
      <p className="mt-3 text-center text-sm font-semibold text-ink/70">Rajwada par tap karke dekho</p>
    </div>
  );
}
