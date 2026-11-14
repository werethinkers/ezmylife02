// @ts-nocheck
/* eslint-disable */
// Demo Wrapper Component
import WavingHandPoster from "@/components/ui/waving-hand-poster";

export default function DemoOne() {
  return (
    <main className="min-h-screen w-full bg-[#ECECEC] dark:bg-[#05070E] transition-colors duration-500 flex flex-col items-center justify-center p-4">
      <WavingHandPoster nameText="Ezyourlife" introPrefix="We are" greetingText="Hey!" />
    </main>
  );
}