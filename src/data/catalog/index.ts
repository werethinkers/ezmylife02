import type { ToolEntry } from "../toolsDatabase";
import { businessDocs } from "./business-docs";
import { customTools } from "./custom-tools";
import { bhedTools } from "./bhed";
import { calculators } from "./calculators";
import { converters } from "./converters";
import { examPresets } from "./exam-presets";
import { flagshipBusiness } from "./flagship-business";
import { flagshipMarketing } from "./flagship-marketing";
import { flagshipEcommerce } from "./flagship-ecommerce";
import { flagshipCreators } from "./flagship-creators";
import { flagshipMoney } from "./flagship-money";
import { flagshipLegal } from "./flagship-legal";
import { flagshipCareers } from "./flagship-careers";
import { flagshipEducation } from "./flagship-education";
import { flagshipFamily } from "./flagship-family";
import { flagshipHealth } from "./flagship-health";

/*
 * Catalogue rows for apps added by the 2,000-app launch (docs/launch-plan.md).
 * One file per vertical in this folder; a new vertical adds one import line and one entry line here.
 * This file is merged with git's "union" driver (see docs/branching.md), so keep every line
 * self-contained and put rows in the vertical's own file, never here.
 *
 * These rows are the source for the database: `npm run gen:catalog -- <vertical>` writes
 * the SQL file that adds them to tools_catalog. Never type catalogue SQL by hand.
 * The 154 apps that were live before the launch stay in ../toolsDatabase.ts.
 */
export const CATALOG_GROUPS: Record<string, ToolEntry[]> = {
  businessDocs,
  customTools,
  bhedTools,
  calculators,
  converters,
  examPresets,
  flagshipBusiness,
  flagshipMarketing,
  flagshipEcommerce,
  flagshipCreators,
  flagshipMoney,
  flagshipLegal,
  flagshipCareers,
  flagshipEducation,
  flagshipFamily,
  flagshipHealth,
};
