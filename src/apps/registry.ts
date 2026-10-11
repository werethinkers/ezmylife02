import type { AppDef } from "./types";
import { businessDocs } from "./defs/business-docs";
import { businessTrackers } from "./defs/business-trackers";
import { contentAi } from "./defs/content-ai";
import { customApps } from "./defs/custom";

/*
 * Every app built on the shared engines, by catalogue id.
 * Each vertical has its own file in ./defs; a new vertical adds one file and one line here.
 * `npm run check:apps` fails if two files define the same id.
 */
export const APP_GROUPS: Record<string, Record<string, AppDef>> = {
  "business-docs": businessDocs,
  "business-trackers": businessTrackers,
  "content-ai": contentAi,
  custom: customApps,
};

export const APPS: Record<string, AppDef> = Object.assign({}, ...Object.values(APP_GROUPS));

export const hasEngineApp = (toolId: string) => toolId in APPS;
