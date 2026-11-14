// @ts-nocheck
/* eslint-disable */
import BusinessCard from "@/components/ui/holographic-business-card";

export default function BusinessCardDemo() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#DCE9F8] px-4 py-16">
      <BusinessCard effect="shards" intensity={0.25} />
    </main>
  );
}
