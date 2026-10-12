import type { AppSpec } from "./base.ts";
import { businessDocs } from "./business-docs.ts";
import { businessTrackers } from "./business-trackers.ts";
import { contentAi } from "./content-ai.ts";
import { customApps } from "./custom.ts";
import { extras } from "./extras.ts";
import { calculators } from "./calculators.ts";

// Every vertical file in this folder: one import line and one entry line each.
// Merged with git's "union" driver (see docs/branching.md) so branches that each add a vertical
// never conflict. Keep every line self-contained, and put apps in the vertical's own file.
export const SPEC_GROUPS: Record<string, Record<string, AppSpec>> = {
  "business-docs": businessDocs,
  "business-trackers": businessTrackers,
  "content-ai": contentAi,
  custom: customApps,
  extras,
  calculators,
};
