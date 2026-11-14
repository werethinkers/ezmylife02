// @ts-nocheck
/* eslint-disable */
"use client";

import { LighthouseGallery } from "@/components/ui/lighthouse-gallery";
import type { BeamOrigin, LighthouseItem } from "@/components/ui/lighthouse-gallery";

const settings = {
  origin: "top-left" as BeamOrigin,
  sweepDuration: 9000,
  beamWidth: 26,
  afterglow: 2200,
  peek: 0.25,
  torch: true,
  columns: 5,
};

const PHOTOS = [
  { id: "photo-1597860150045-3e4760e52ed5", title: "Cliff path" },
  { id: "photo-1522679056866-8dbbc8774a9d", title: "The keeper" },
  { id: "photo-1599939571322-792a326991f2", title: "Blue hour" },
  { id: "photo-1603979649806-5299879db16b", title: "First light" },
  { id: "photo-1531366936337-7c912a4589a7", title: "Green sky" },
  { id: "photo-1596391691172-3359c29c6451", title: "Low tide" },
  { id: "photo-1512649408904-c0a00fb810da", title: "Beacon at dusk" },
  { id: "photo-1664353655151-9d94a9170eb0", title: "Harbor lights" },
  { id: "photo-1681167779860-ceb10418d405", title: "Still water" },
  { id: "photo-1568607689150-17e625c1586e", title: "Northern lights" },
  { id: "photo-1760637243905-8f73f60fc240", title: "Harbor wall" },
  { id: "photo-1523955248191-0841a01f29aa", title: "North point" },
  { id: "photo-1617336422396-e1dfc4210ec5", title: "After midnight" },
  { id: "photo-1602557089158-f91c696af5fd", title: "Alpine mirror" },
  { id: "photo-1517411032315-54ef2cb783bb", title: "Polar night" },
];

const ITEMS: LighthouseItem[] = PHOTOS.map(({ id, title }) => ({
  src: `https://images.unsplash.com/${id}?w=600&h=600&fit=crop&q=80&auto=format`,
  alt: title,
  title,
}));


export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-background p-6">
      <LighthouseGallery
        items={ITEMS}
        columns={s.columns}
        origin={s.origin}
        sweepDuration={s.sweepDuration}
        beamWidth={s.beamWidth}
        afterglow={s.afterglow}
        peek={s.peek}
        torch={s.torch}
        className="w-full max-w-3xl"
      />
      <p className="text-xs text-muted-foreground">
        Tiles wake up as the beam passes, or under your pointer. Click one to park the light.
      </p>
    </div>
  );
}
