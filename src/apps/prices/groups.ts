import { businessDocs } from "./business-docs";
import { businessTrackers } from "./business-trackers";
import { calculators } from "./calculators";
import { converters } from "./converters";
import { examPresets } from "./exam-presets";
import { contentAi } from "./content-ai";
import { customApps } from "./custom";
import { extras } from "./extras";

// Every vertical file in this folder: one import line and one entry line each.
// Merged with git's "union" driver (see docs/branching.md) so branches that each add a vertical
// never conflict. Keep every line self-contained, and put apps in the vertical's own file.
export const PRICE_GROUPS: Record<string, Record<string, number>> = {
  "business-docs": businessDocs,
  "business-trackers": businessTrackers,
  "content-ai": contentAi,
  custom: customApps,
  extras,
  calculators,
  converters,
  "exam-presets": examPresets,
};
