// Server-side definitions for apps powered by the shared `ai-app` function.
// The browser only sends form values; the instructions, model, output limit and
// default price live here so a request can't change what a run costs.
//
// One file per vertical in ./appSpecs; a new vertical adds one file and its lines in ./appSpecs/groups.ts.
// `npm run check:apps` fails if two files define the same id.
import type { AppSpec } from "./appSpecs/base.ts";
import { SPEC_GROUPS } from "./appSpecs/groups.ts";

export type { AppKind, AppSpec } from "./appSpecs/base.ts";
export { COMMON_RULES } from "./appSpecs/base.ts";

export { SPEC_GROUPS };

export const APP_SPECS: Record<string, AppSpec> = Object.assign({}, ...Object.values(SPEC_GROUPS));
