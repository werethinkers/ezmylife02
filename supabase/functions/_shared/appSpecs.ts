// Server-side definitions for apps powered by the shared `ai-app` function.
// The browser only sends form values; the instructions, model, output limit and
// default price live here so a request can't change what a run costs.
//
// One file per vertical in ./appSpecs; a new vertical adds one file and one line here.
// `npm run check:apps` fails if two files define the same id.
import type { AppSpec } from "./appSpecs/base.ts";
import { businessDocs } from "./appSpecs/business-docs.ts";
import { businessTrackers } from "./appSpecs/business-trackers.ts";
import { contentAi } from "./appSpecs/content-ai.ts";
import { customApps } from "./appSpecs/custom.ts";
import { extras } from "./appSpecs/extras.ts";
import { calculators } from "./appSpecs/calculators.ts";

export type { AppKind, AppSpec } from "./appSpecs/base.ts";
export { COMMON_RULES } from "./appSpecs/base.ts";

export const SPEC_GROUPS: Record<string, Record<string, AppSpec>> = {
  "business-docs": businessDocs,
  "business-trackers": businessTrackers,
  "content-ai": contentAi,
  custom: customApps,
  extras,
  calculators,
};

export const APP_SPECS: Record<string, AppSpec> = Object.assign({}, ...Object.values(SPEC_GROUPS));
