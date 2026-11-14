// @ts-nocheck
/* eslint-disable */
"use client";

import {
  CardHandGallery,
  type FanCardItem,
} from "@/components/ui/card-hand-gallery";

const cards: FanCardItem[] = [
  {
    id: "deep-field",
    src: "https://cdn.21st.dev/assets/mirror/38/381691b8480ae8bbfd361096cdb92ba9778b3cdaf4f0d6482f2453ed2d661e64.jpg",
    title: "Deep Field",
    description:
      "A diver held inside a sunset horizon, the seascape cut to the shape of a profile. Printed at 300gsm on uncoated stock.",
  },
  {
    id: "city-exposure",
    src: "https://cdn.21st.dev/assets/mirror/4c/4c303460c0d508baa30af497b8bdad6d9e71dc151070fdba3eeb668682da64f2.jpg",
    title: "City Exposure",
    description:
      "Double exposure of a portrait and a skyline at dusk, where the streetlights read as freckles across the jaw.",
  },
  {
    id: "motion-study",
    src: "https://cdn.21st.dev/assets/mirror/3b/3bec7ace437245c7a268ba959acc08386b74654253daeb09cf5ebaa35fe564b4.jpg",
    title: "Motion Study",
    description:
      "One long exposure, one turn of the head. The orange backdrop stays still while everything in front of it smears.",
  },
  {
    id: "kinetic-bloom",
    src: "https://cdn.21st.dev/assets/mirror/b1/b1ae187217e870f39053363e115d7b9f3d3948730ef115a19778c7f75c03370a.jpg",
    title: "Kinetic Bloom",
    description:
      "A racket dissolving mid-swing into a cloud of colour, drawn the moment the follow-through leaves the frame.",
  },
  {
    id: "paper-flight",
    src: "https://cdn.21st.dev/assets/mirror/47/47e5e8e0e894dd439c0a7416f49722b35622f5a27e7964d1ca3ebcbed087656f.jpg",
    title: "Paper Flight",
    description:
      "A cut-paper bird threaded between two fingers, the only colour in an otherwise black and white plate.",
  },
];

export default function CardHandGalleryDemo() {
  return (
    <div className="flex w-full items-center justify-center bg-background px-6 py-10">
      <CardHandGallery cards={cards} className="max-w-5xl" />
    </div>
  );
}
