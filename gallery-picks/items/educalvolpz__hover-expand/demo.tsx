// @ts-nocheck
/* eslint-disable */
"use client";

import type { HoverExpandItem } from "@/components/ui/hover-expand";
import HoverExpand from "@/components/ui/hover-expand";

const items: HoverExpandItem[] = [
  {
    id: "maple-golden",
    title: "Maple",
    description: "Support mascot",
    alt: "Generated dog portrait: Maple",
    image:
      "https://cdn.21st.dev/assets/localized/2d8dbec6d27531d818486d34213b77024b18008dc1b3b278743da0e656557a6b.jpg",
  },
  {
    id: "mango-tabby",
    title: "Mango",
    description: "Product cat",
    alt: "Generated cat portrait: Mango",
    image:
      "https://cdn.21st.dev/assets/localized/a24f3608b706e47afcbedeaf8d42555e512b7bf0d07dbb82ca3c2906ac8d9ba4.jpg",
  },
  {
    id: "bay-star",
    title: "Bay",
    description: "Brand mare",
    alt: "Generated horse portrait: Bay",
    image:
      "https://cdn.21st.dev/assets/localized/567bf08558c7040e242942b7631f92703385db3546442d1f2f7d8b9acf5b65f0.jpg",
  },
  {
    id: "leaf-veiled",
    title: "Leaf",
    description: "Garden scout",
    alt: "Generated chameleon portrait: Leaf",
    image:
      "https://cdn.21st.dev/assets/localized/ec2a326c37844f2b02f894b1c5ad404de8c7c478bab740f4404a1e770b25d953.jpg",
  },
  {
    id: "rio-macaw",
    title: "Rio",
    description: "Community bird",
    alt: "Generated bird portrait: Rio",
    image:
      "https://cdn.21st.dev/assets/localized/7d64fb0f88e4c2475992130ddebaa30c830f15f2790469454146a848411b3bea.jpg",
  },
];

export default function HoverExpandDemo() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <HoverExpand items={items} orientation="horizontal" />
    </div>
  );
}
