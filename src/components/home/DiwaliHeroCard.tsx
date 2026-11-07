import { getProduct } from "@/instant/catalog";
import { DeviceFrame } from "@/instant/DesignPreview";
import { INDORI_LINES } from "@/instant/festLang";
import { useProducts } from "@/instant/useProducts";
import { fmtCredits } from "@/lib/creditRate";

/** The Diwali card in the Rajwada design, live and tappable, or its real price from ip_products. */
export default function DiwaliHeroCard({ part }: { part: "card" | "price" }) {
  const product = getProduct("diwali");
  const { list } = useProducts();
  if (!product) return null;
  if (part === "price") {
    const credits = list.find((l) => l.product.id === "diwali")?.credits ?? 0;
    return <span className="text-sm font-bold">{credits ? `${fmtCredits(credits)} per card · send to all your contacts at 1 credit per 10 people` : "Free card · send to all your contacts at 1 credit per 10 people"}</span>;
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
