import type { ToolEntry } from "../toolsDatabase";

// New apps with their own screen (custom engine, src/apps/defs/custom.tsx). One row per app.
export const customTools: ToolEntry[] = [
  { id: "mind-map-maker", name: "Mind Map Maker", description: "Plan a chapter, an essay or a revision topic as a mind map: add branches and points, it draws itself, save as an image or copy it as an outline.", category: "For Students", alsoIn: ["Modern Science"], toolType: ["Study Tools", "Mind Mapping"], source: "featured", isLive: true },
];
