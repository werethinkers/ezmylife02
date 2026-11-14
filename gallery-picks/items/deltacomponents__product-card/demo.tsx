// @ts-nocheck
/* eslint-disable */
import {
  ProductCard,
  ProductCardContent,
  ProductCardHeader,
  ProductCardImage,
  ProductCardMetric,
  ProductCardSubtitle,
  ProductCardTitle,
} from "@/components/ui/product-card";

export default function ProductCardDemo() {
  return (
    <ProductCard>
      <ProductCardImage
        src="https://cdn.21st.dev/assets/localized/fb1c2b03e0bf5da10d8286d5496e559f07f5d7e011f8f4922a601974467d7986.png"
        alt="Twemco Clock"
      />
      <ProductCardContent>
        <ProductCardHeader>
          <ProductCardTitle>Twemco Clock</ProductCardTitle>
          <ProductCardSubtitle>Clock</ProductCardSubtitle>
        </ProductCardHeader>
        <ProductCardMetric>$219</ProductCardMetric>
      </ProductCardContent>
    </ProductCard>
  );
}
