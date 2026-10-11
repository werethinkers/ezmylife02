import type { ToolEntry } from "../toolsDatabase";

/*
 * Catalogue rows for apps added by the 2,000-app launch (docs/launch-plan.md).
 * One file per vertical in this folder; a new vertical adds one file and one line here.
 *
 * These rows are the source for the database: `npm run gen:catalog -- <vertical>` writes
 * the SQL file that adds them to tools_catalog. Never type catalogue SQL by hand.
 * The 154 apps that were live before the launch stay in ../toolsDatabase.ts.
 */
export const CATALOG_GROUPS: Record<string, ToolEntry[]> = {};
