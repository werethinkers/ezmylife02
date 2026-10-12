import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/*
 * The screen for each engine, by the `engine` value in an app's definition.
 * A new engine (shell) adds its file in this folder, one line here, and one line in ../appDefs.ts.
 * This file is merged with git's "union" driver (see docs/branching.md): one line per engine.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ENGINES: Record<string, LazyExoticComponent<ComponentType<{ toolId: string; def: any }>>> = {
  doc: lazy(() => import("./DocApp")),
  tracker: lazy(() => import("./TrackerApp")),
  chat: lazy(() => import("./ChatApp")),
  vision: lazy(() => import("./VisionApp")),
  image: lazy(() => import("./ImageGenApp")),
  calc: lazy(() => import("./CalcApp")),
  convert: lazy(() => import("./ConvertApp")),
  preset: lazy(() => import("./PresetApp")),
  interview: lazy(() => import("./InterviewApp")),
  analyse: lazy(() => import("./AnalyseApp")),
  studio: lazy(() => import("./StudioApp")),
  plan: lazy(() => import("./PlanApp")),
  pack: lazy(() => import("./PlanApp")),
  coach: lazy(() => import("./CoachApp")),
};
