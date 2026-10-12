import { APPS } from "@/apps/registry";
import { categoryInfo, giveGetFor, KIND_BY_ENGINE, type AppKind } from "@/data/goals";

/**
 * How an app opens, for the plain "how it works" line: worked out from the app's real engine
 * when it is built on the shared engines, otherwise from its category.
 */
export function appKindOf(toolId: string | undefined, category?: string | null): AppKind {
  const def = toolId ? APPS[toolId] : undefined;
  if (def && def.engine !== "custom") return KIND_BY_ENGINE[def.engine] ?? categoryInfo(category).kind;
  return categoryInfo(category).kind;
}

/**
 * "You give / you get" for an app, matched to what the app really produces rather than only
 * to its category, so a letter in a sheet-heavy category is not described as a sheet.
 */
export function appGiveGetOf(toolId: string | undefined, category?: string | null) {
  return giveGetFor(category, { kind: appKindOf(toolId, category) });
}

/** Plain one-line purpose from the shared engines (their own intro), when there is one. */
export function appIntroOf(toolId: string | undefined): string | undefined {
  return toolId ? APPS[toolId]?.intro : undefined;
}

/** The app's own "how it works" steps from the shared engines, when there are any. */
export function appStepsOf(toolId: string | undefined): string[] | undefined {
  return toolId ? APPS[toolId]?.steps : undefined;
}
