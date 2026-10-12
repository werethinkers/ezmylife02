/*
 * Every kind of app definition, one per engine. A new engine (shell) adds one line here and one
 * line in ./engines/index.ts. This file is merged with git's "union" driver (see docs/branching.md),
 * so every line must stand on its own.
 */
export type AppDef =
  | import("./types").DocAppDef
  | import("./types").TrackerDef
  | import("./types").ChatAppDef
  | import("./types").VisionAppDef
  | import("./types").ImageAppDef
  | import("./types").CustomAppDef
  | import("./types").CalcDef
  | import("./types").ConvertDef
  | import("./types").PresetDef
  | import("./flagship/types").FlagshipDef
;
