// @ts-nocheck
/* eslint-disable */
import { ProductCard } from "@/components/ui/product-card-1";

export default function DemoOne() {
  return <ProductCard   name="Everyday Leather Sneaker"
        price={129.99}
        originalPrice={169.99}
        rating={4.7}
        reviewCount={325}
        discount={25}
        freeShipping
        isNew
        isBestSeller
        colors={["#1e293b", "#f43f5e", "#0ea5e9", "#10b981"]}
        sizes={["38", "39", "40", "41", "42", "43"]}
        images={[
          "https://cdn.21st.dev/assets/mirror/ad/ade63a3c4df44b7c8e7277a749d732494e317e8289fd2ed72d57de841ff63896.jpg",
          "https://cdn.21st.dev/assets/mirror/7c/7cf794d66ccf2e6a3e361e97ba42f976b694a518b425127da9d3375545beeaf6.jpg",
          "https://cdn.21st.dev/assets/mirror/25/25c842cc27771b65a574283e9cabd64eb220df7f45276ee20024dd620bf11da4.jpg"
        ]} />;
}
