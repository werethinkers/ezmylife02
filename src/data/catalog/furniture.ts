import type { ToolEntry } from "../toolsDatabase";

// Furniture Sheets studio: has its own page (src/pages/FurnitureSheets.tsx), so it is a catalogue row with a dedicatedRoute and no app definition.
export const furnitureTools: ToolEntry[] = [
  { id: "furniture-sheets", name: "Furniture Sheets", description: "Photo of any furniture in, a full technical design sheet out: exploded view, sizes, section, materials and parts list. Plus colourways and room scenes.", category: "AI Image Generation", alsoIn: ["Online Selling"], toolType: ["Design Tools", "Image Tools", "AI & Automation"], source: "featured", isLive: true, dedicatedRoute: "/studios/furniture-sheets", placements: ["home-strip", "home-new"] },
];
