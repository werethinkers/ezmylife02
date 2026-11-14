// @ts-nocheck
/* eslint-disable */
"use client";

import { FlipCard } from "@/components/ui/flip-card";

const data = {
  name: "Dr. Meera Shah",
  username: "drmeera.dental",
  image:
    "https://cdn.21st.dev/assets/localized/2714e0a93ebb6f7921d0ba9edbcb5c9a2db2b3bac7af1cfa94ff24664b49eede.jpg",
  bio: "Family dentist with 12 years of gentle care. Open six days a week.",
  stats: { following: 200, followers: 2900, posts: 120 },
  socialLinks: {
    linkedin: "https://linkedin.com",
    github: "https://github.com",
    twitter: "https://twitter.com",
  },
};

export default function FlipCardDemo() {
  return <FlipCard data={data} />;
}
