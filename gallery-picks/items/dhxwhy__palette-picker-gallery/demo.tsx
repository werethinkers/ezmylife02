// @ts-nocheck
/* eslint-disable */
"use client";

import * as React from "react";
import PalettePickerGallery from "@/components/ui/palette-picker-gallery";
import type { PaletteImage } from "@/components/ui/palette-picker-gallery";

// Each palette was sampled from the exact photo URL beside it with the gallery's own extractPalette().
export const PALETTE_DEMO_ITEMS: PaletteImage[] = [
  {
    id: "maple-against-the-sky",
    src: "https://cdn.21st.dev/assets/mirror/c3/c3fee24ff50f7091f007c00704fd2c77ba4d9e06c4378f600f37f34f7e623737.jpg",
    title: "Maple against the sky",
    alt: "Red-orange maple leaves against a blue sky",
    palette: ["#56B7D6", "#01A2C5", "#F32A01", "#BC1801", "#6B0802"],
  },
  {
    id: "blue-door",
    src: "https://cdn.21st.dev/assets/mirror/f8/f89313e0263ccfa87e80351f8cf67e92248fdb98d094b5b35ec7aff9275ab9ff.jpg",
    title: "Blue door",
    alt: "Weathered blue door in a white wall with potted plants",
    palette: ["#FCFCF8", "#E7BFA2", "#BA7B5F", "#014ADC", "#7F2F1C"],
  },
  {
    id: "sunflower-field",
    src: "https://cdn.21st.dev/assets/mirror/ca/cad7c72ff536a6d3b0cd81bb5e96ee5e86d11cd16544eaf9cfd997e7f37309b3.jpg",
    title: "Sunflower field",
    alt: "Sunflower field below a line of trees",
    palette: ["#BBB48E", "#AB6B02", "#663A00", "#2F2806", "#121501"],
  },
  {
    id: "lavender",
    src: "https://cdn.21st.dev/assets/mirror/ad/ad7945d73264e419b4a836baf8ccbb2ad7fd708fd30087ebf6f5ae9ef09a001f.jpg",
    title: "Lavender",
    alt: "Lavender spikes in a field",
    palette: ["#966CD9", "#875EC2", "#5C7A2E", "#6D4AAA", "#533686"],
  },
  {
    id: "flamingo",
    src: "https://cdn.21st.dev/assets/mirror/6a/6a4e7ac4d83463ff02630843224bf90d17e4af0154584fd17acb60712cb9b28c.jpg",
    title: "Flamingo",
    alt: "Close-up of a coral flamingo curling its neck",
    palette: ["#EF8666", "#BD7052", "#CF3617", "#842D1D", "#45221E"],
  },
  {
    id: "blue-archway",
    src: "https://cdn.21st.dev/assets/mirror/0e/0e75ee47ddf345639e7a83623a03ffa539157873001d90d407c703bc5ecdb251.jpg",
    title: "Blue archway",
    alt: "Blue-washed archway over a narrow stone alley",
    palette: ["#ABC5F8", "#7E9DD7", "#5081C8", "#166BA1", "#23436B"],
  },
  {
    id: "rice-terraces",
    src: "https://cdn.21st.dev/assets/mirror/7f/7f670225a7ab38bcda012a80bf54340811ed3eef29b4072ac2a5181f3e4c4b35.jpg",
    title: "Rice terraces",
    alt: "Aerial view of green rice terraces",
    palette: ["#82A11F", "#6E8815", "#577A24", "#426612", "#335014"],
  },
  {
    id: "lantern-street",
    src: "https://cdn.21st.dev/assets/mirror/4e/4e96b7ce40d478f831608e28ae4810dd834d7e146e15400b02a382b6e9675845.jpg",
    title: "Lantern street",
    alt: "Red paper lanterns strung across a street",
    palette: ["#F5D3BB", "#E77457", "#B15E50", "#C11B1B", "#6C2724"],
  },
  {
    id: "cherry-blossom",
    src: "https://cdn.21st.dev/assets/mirror/ff/ffabac04809d7b0dc17afbe805c6eb4e30481022e7ed87b3c76da86717854452.jpg",
    title: "Cherry blossom",
    alt: "Pale pink cherry blossoms against a blue sky",
    palette: ["#C2E0F3", "#ECC0C4", "#DDA7AB", "#D69294", "#BE716E"],
  },
  {
    id: "vintage-cab",
    src: "https://cdn.21st.dev/assets/mirror/23/239022c0651ee97aa8917158088ad2ad4c4ea3bb6915a98d7939c2791322beb3.jpg",
    title: "Vintage cab",
    alt: "Yellow vintage taxi on a city street",
    palette: ["#FC9F00", "#676849", "#3E412C", "#122F3B", "#021D26"],
  },
  {
    id: "fern",
    src: "https://cdn.21st.dev/assets/mirror/ea/ea32bc3b539a6c4fbd6e7554984a45a683ab8e86df2661eb2c746ecbb51931ed.jpg",
    title: "Fern",
    alt: "Fern fronds against soft green light",
    palette: ["#A1C68A", "#599940", "#39823C", "#236736", "#114C32"],
  },
  {
    id: "dune-by-the-sea",
    src: "https://cdn.21st.dev/assets/mirror/60/60f4e93b7b37d9daf70731b8d383e0a914bbcce002f2979a255cfa223b483be5.jpg",
    title: "Dune by the sea",
    alt: "Orange sand dune meeting the sea",
    palette: ["#BDCEF2", "#EB760A", "#D85C03", "#B54200", "#802B00"],
  },
  {
    id: "blue-alley",
    src: "https://cdn.21st.dev/assets/mirror/aa/aaa490c5bbb37f94c6f316da3f2b382c3ee23f24e90b6c39df82c723b7e56cdc.jpg",
    title: "Blue alley",
    alt: "Blue-washed stairway alley with flower pots",
    palette: ["#C0D2E9", "#8BA7D3", "#72819F", "#1C87C8", "#255FA9"],
  },
  {
    id: "red-parasol",
    src: "https://cdn.21st.dev/assets/mirror/97/973fa1cbc799dbc85653f7c16f9a8dbbfb60f9b4a980243f18b3d6d6980c2bbf.jpg",
    title: "Red parasol",
    alt: "Underside of a red paper parasol",
    palette: ["#F42440", "#DD1031", "#BB002C", "#930725", "#53002E"],
  },
  {
    id: "lavender-at-sunset",
    src: "https://cdn.21st.dev/assets/mirror/b5/b59dc5532ce914180886abd641bd36f3db3f74cbc9ed3e051b88087d0ea60dc9.jpg",
    title: "Lavender at sunset",
    alt: "Rows of lavender under a low orange sun",
    palette: ["#FEC98E", "#F2A080", "#B63F23", "#7F2782", "#0A054C"],
  },
  {
    id: "blue-hillside-town",
    src: "https://cdn.21st.dev/assets/mirror/08/0852f17aa70a48d13876435681a7ef1a0f43af4578fdae56608e843176ccb8ba.jpg",
    title: "Blue hillside town",
    alt: "Blue houses climbing a hillside under a clear sky",
    palette: ["#84E4EE", "#03D7EB", "#C9A393", "#B27A6E", "#186EB7"],
  },
];

function useFittedCount() {
  const [count, setCount] = React.useState(() => (typeof window !== "undefined" && window.innerHeight < 820 ? 12 : 16));
  React.useEffect(() => {
    const update = () => setCount(window.innerHeight < 820 ? 12 : 16);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return count;
}

export default function PalettePickerGalleryDemo({ autoplay = true }: { autoplay?: boolean }) {
  const count = useFittedCount();
  const items = PALETTE_DEMO_ITEMS.slice(0, count);
  return (
    <div data-palette-demo className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-4 text-foreground sm:px-6">
      <PalettePickerGallery
        items={items}
        eyebrow={`Mood board · ${items.length} photos`}
        heading="Pull a palette out of any photo, then shop the color."
        autoplay={autoplay}
        interval={3200}
        className="max-w-6xl"
      />
    </div>
  );
}
