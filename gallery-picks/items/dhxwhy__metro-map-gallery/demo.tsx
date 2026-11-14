// @ts-nocheck
/* eslint-disable */
"use client";

import { MetroMapGallery } from "@/components/ui/metro-map-gallery";
import type { MetroLine, MetroStation } from "@/components/ui/metro-map-gallery";

export const METRO_DEMO_LINES: MetroLine[] = [
  { name: "Platform", tone: 1 },
  { name: "Design", tone: 2 },
  { name: "Growth", tone: 4 },
];

export const METRO_DEMO_ITEMS: MetroStation[] = [
  {
    id: "private-alpha",
    line: 0,
    title: "Private alpha",
    label: "Alpha",
    date: "2026 Q1",
    description: "Twenty design partners get the first build, with weekly calls and a shared bug board.",
    image: "https://cdn.21st.dev/assets/mirror/c1/c1b550ffb2562642322efe9dfb56e47cb9691468da23c3610043f656bf32aa34.jpg",
  },
  {
    id: "public-beta",
    line: 0,
    title: "Public beta",
    label: "Beta",
    date: "2026 Q1",
    description: "Sign-ups open to everyone, with fair usage limits and a feedback button on every screen.",
    image: "https://cdn.21st.dev/assets/mirror/c7/c75e6b309f8aae349993d2a09a709e5c6175393bf8e1acbec72dd641a30e8ad9.jpg",
  },
  {
    id: "realtime-sync",
    line: 0,
    title: "Realtime sync",
    label: "Launch",
    date: "2026 Q2",
    description: "Edits reach every collaborator in under a second, with live cursors and presence.",
    image: "https://cdn.21st.dev/assets/mirror/2a/2a5d470de8801a4e27742d9979ec43cc0884a334597969000d9d16b823e38e8a.jpg",
  },
  {
    id: "offline-mode",
    line: 0,
    title: "Offline mode",
    label: "Launch",
    date: "2026 Q3",
    description: "Work keeps going without a connection and merges cleanly once you are back online.",
    image: "https://cdn.21st.dev/assets/mirror/bc/bcaff36cb6ae1091a4d9e461fd1707b82315dc076f2eeb9afca6475410a063f6.jpg",
  },
  {
    id: "version-one",
    line: 0,
    title: "1.0 release",
    label: "GA",
    date: "2026 Q4",
    description: "Stable APIs, an uptime promise and long-term support for the whole 1.x line.",
    image: "https://cdn.21st.dev/assets/mirror/d3/d36350eb305971632a2fdaa9565f1c5a1f309556347073b3963940185796c6e2.jpg",
  },
  {
    id: "design-tokens",
    line: 1,
    title: "Design tokens v2",
    label: "System",
    date: "2026 Q1",
    description: "One token set for colour, type and spacing, shared by the product, the docs and the website.",
    image: "https://cdn.21st.dev/assets/mirror/2b/2b3e7146ad14d53c65c66d89bf3e30ebd2ea80a786ec3a2670ae6b0574fcaee1.jpg",
  },
  {
    id: "dark-mode",
    line: 1,
    title: "Dark mode",
    label: "Interface",
    date: "2026 Q2",
    description: "Every screen gets a tuned dark theme that follows the system setting.",
    image: "https://cdn.21st.dev/assets/mirror/94/940152ebca6d6ed99a5193251b9b5a80d1499e8bf790cd95fea5b69dd2b0e8e8.jpg",
  },
  {
    id: "motion-guidelines",
    line: 1,
    title: "Motion guidelines",
    label: "Interface",
    date: "2026 Q3",
    description: "Shared timing and easing rules, so every transition feels like the same product.",
    image: "https://cdn.21st.dev/assets/mirror/c9/c9bea0aa6808278ee1fa59dca11836674fa28eb1d00f5e5b070f25181647657e.jpg",
  },
  {
    id: "accessibility-audit",
    line: 1,
    title: "Accessibility audit",
    label: "Quality",
    date: "2026 Q4",
    description: "An outside review of keyboard paths, contrast and screen reader labels across the app.",
    image: "https://cdn.21st.dev/assets/mirror/85/85f4ba0f74ff4532b2f718bb78477f63570f2040b8ec3d4c71059df0d637d02f.jpg",
  },
  {
    id: "referral-program",
    line: 2,
    title: "Referral program",
    label: "Growth",
    date: "2026 Q1",
    description: "Invite a teammate and you both get an extra month on any paid plan.",
    image: "https://cdn.21st.dev/assets/mirror/ec/ecb9c1ab881b69136827e0b4a71c38b6d42a5e2780afd2b11a13d3bb7860fdd6.jpg",
  },
  {
    id: "eu-launch",
    line: 2,
    title: "EU launch",
    label: "Market",
    date: "2026 Q2",
    description: "Hosting inside the EU, local billing and onboarding in four more languages.",
    image: "https://cdn.21st.dev/assets/mirror/a4/a4c40b7ee86f45ff137e5522fc7c6fa152ac11cffc71bb391f18ea96c93d7c29.jpg",
  },
  {
    id: "partner-marketplace",
    line: 2,
    title: "Partner marketplace",
    label: "Market",
    date: "2026 Q3",
    description: "Templates and integrations from partners, each reviewed before it goes live.",
    image: "https://cdn.21st.dev/assets/mirror/53/5337a6ed9c40df047236517c667e7259c190b667c7a3489856b5c1f0cd80e48b.jpg",
  },
  {
    id: "apac-launch",
    line: 2,
    title: "APAC launch",
    label: "Market",
    date: "2026 Q4",
    description: "A new Asia-Pacific region, regional pricing and support hours that match the time zone.",
    image: "https://cdn.21st.dev/assets/mirror/0c/0ca9ac87fae30356b3f0f6c4793351b631afe8f1bcefb95d7670fc84e529b396.jpg",
  },
];

export default function MetroMapGalleryDemo({ autoplay = true }: { autoplay?: boolean }) {
  return (
    <div data-metro-demo className="flex min-h-svh w-full items-center justify-center bg-background text-foreground">
      <MetroMapGallery
        items={METRO_DEMO_ITEMS}
        lines={METRO_DEMO_LINES}
        eyebrow="Product journey · 2026 roadmap"
        heading="A roadmap you can ride, station by station."
        caption="Hover a station to preview it, click to open the milestone."
        autoplay={autoplay}
        className="max-w-[1240px]"
      />
    </div>
  );
}
