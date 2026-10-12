import type { AppSpec } from "./base.ts";
import { businessDocs } from "./business-docs.ts";
import { businessTrackers } from "./business-trackers.ts";
import { contentAi } from "./content-ai.ts";
import { customApps } from "./custom.ts";
import { extras } from "./extras.ts";
import { calculators } from "./calculators.ts";
import { flagshipBusiness } from "./flagship-business.ts";
import { flagshipCommon } from "./flagship-common.ts";
import { flagshipMarketing } from "./flagship-marketing.ts";
import { flagshipEcommerce } from "./flagship-ecommerce.ts";
import { flagshipCreators } from "./flagship-creators.ts";
import { flagshipMoney } from "./flagship-money.ts";
import { flagshipLegal } from "./flagship-legal.ts";
import { flagshipCareers } from "./flagship-careers.ts";
import { flagshipEducation } from "./flagship-education.ts";
import { flagshipFamily } from "./flagship-family.ts";
import { flagshipHealth } from "./flagship-health.ts";

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
  "flagship-business": flagshipBusiness,
  "flagship-common": flagshipCommon,
  "flagship-marketing": flagshipMarketing,
  "flagship-ecommerce": flagshipEcommerce,
  "flagship-creators": flagshipCreators,
  "flagship-money": flagshipMoney,
  "flagship-legal": flagshipLegal,
  "flagship-careers": flagshipCareers,
  "flagship-education": flagshipEducation,
  "flagship-family": flagshipFamily,
  "flagship-health": flagshipHealth,
};
