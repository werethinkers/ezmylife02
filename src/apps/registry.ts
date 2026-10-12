import type { AppDef } from "./types";
import { APP_GROUPS } from "./defs/groups";

/*
 * Every app built on the shared engines, by catalogue id.
 * Each vertical has its own file in ./defs; a new vertical adds one file and its lines in ./defs/groups.ts.
 * `npm run check:apps` fails if two files define the same id.
 */
export { APP_GROUPS };

export const APPS: Record<string, AppDef> = Object.assign({}, ...Object.values(APP_GROUPS));

export const hasEngineApp = (toolId: string) => toolId in APPS;
