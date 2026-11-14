// @ts-nocheck
/* eslint-disable */
import CoverflowCarousel from "@/components/ui/coverflow-carousel";

const items = [
  {
    id: "1",
    image:
      "https://cdn.21st.dev/assets/mirror/cd/cdd2e87247dbfc2f2bdcbb281d15a429b2c59bb092c6d226da5eb616da6340cb.jpg",
    alt: "Mountain lake at sunrise",
  },
  {
    id: "2",
    image:
      "https://cdn.21st.dev/assets/mirror/70/70352deee3acd2161b8bdb21af04fcccaac8ca1df01e4e10417908176e085c94.jpg",
    alt: "Forest path",
  },
  {
    id: "3",
    image:
      "https://cdn.21st.dev/assets/mirror/03/03372a06a52943fef3dadaebbd47e5920bca508b986f3d88c1ccb62c070a0545.jpg",
    alt: "Desert dunes",
  },
  {
    id: "4",
    image:
      "https://cdn.21st.dev/assets/mirror/45/45e982e887f501f679b3ff76c179dfa5efaf8dd65e6f7f7d6c9187a3fd9f3cb7.jpg",
    alt: "Coastal cliffs",
  },
  {
    id: "5",
    image:
      "https://cdn.21st.dev/assets/mirror/12/123317fd601a38d1ff7dd97b70d77401a95ebec52a8291c58a6f29149330f67c.jpg",
    alt: "Valley overlook",
  },
];

export default function CoverflowCarouselDemo() {
  return (
    <div className="flex w-full items-center justify-center py-10">
      <CoverflowCarousel items={items} loop />
    </div>
  );
}
