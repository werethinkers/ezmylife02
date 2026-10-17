import type { ToolEntry } from "../toolsDatabase";

// Bhed Prabhed studio: has its own page (src/pages/BhedPrabhed.tsx), so it is a catalogue row with a dedicatedRoute and no app definition.
export const bhedTools: ToolEntry[] = [
  { id: "bhed-prabhed", name: "Bhed Prabhed", description: "Split a topic into parts and finer parts, with notes and photos on each. See it as a table or a map, save it to your account, export it.", category: "For Students", alsoIn: ["Modern Science"], toolType: ["Study Tools", "Mind Mapping"], source: "featured", isLive: true, dedicatedRoute: "/studios/bhed-prabhed" },
];
