// @ts-nocheck
/* eslint-disable */
import SushiConveyorMenu from "./component";

const dot = (hue) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='44' fill='hsl(${hue} 70% 80%)' stroke='%23111' stroke-width='4'/><circle cx='50' cy='50' r='22' fill='hsl(${hue} 70% 55%)'/></svg>`)}`;

const items = [
  { id: "a", name: "Salmon nigiri", price: "$4.20", tier: 2, image: dot(15), description: "Two pieces of salmon on rice.", details: ["2 pieces"] },
  { id: "b", name: "Tuna roll", price: "$5.80", tier: 3, image: dot(340), description: "Tuna and cucumber, rolled in nori.", details: ["8 pieces"] },
  { id: "c", name: "Tamago", price: "$3.10", tier: 1, image: dot(50), description: "Sweet egg omelette nigiri.", details: ["2 pieces"] },
  { id: "d", name: "Dragon roll", price: "$9.50", tier: 4, image: dot(130), description: "Eel and avocado, on top of a roll.", details: ["8 pieces"] },
];

export default function Demo() {
  return (
    <div className="min-h-screen bg-background p-6">
      <SushiConveyorMenu items={items} eyebrow="Menu" heading="Pick a plate" caption="Pick a plate from the belt." autoplay speed={26} onAdd={() => {}} labels={{ add: "Add", close: "Close", previous: "Previous", next: "Next" }} />
    </div>
  );
}
