import { businessDocs } from "./business-docs";
import { businessTrackers } from "./business-trackers";
import { calculators } from "./calculators";
import { converters } from "./converters";
import { examPresets } from "./exam-presets";
import { contentAi } from "./content-ai";
import { customApps } from "./custom";
import { bhedPrices } from "./bhed";
import { extras } from "./extras";
import { flagshipBusiness } from "./flagship-business";
import { flagshipCommon } from "./flagship-common";
import { flagshipMarketing } from "./flagship-marketing";
import { flagshipEcommerce } from "./flagship-ecommerce";
import { flagshipCreators } from "./flagship-creators";
import { flagshipMoney } from "./flagship-money";
import { flagshipLegal } from "./flagship-legal";
import { flagshipCareers } from "./flagship-careers";
import { flagshipEducation } from "./flagship-education";
import { flagshipFamily } from "./flagship-family";
import { flagshipHealth } from "./flagship-health";

// Every vertical file in this folder: one import line and one entry line each.
// Merged with git's "union" driver (see docs/branching.md) so branches that each add a vertical
// never conflict. Keep every line self-contained, and put apps in the vertical's own file.
export const PRICE_GROUPS: Record<string, Record<string, number>> = {
  "business-docs": businessDocs,
  "business-trackers": businessTrackers,
  "content-ai": contentAi,
  custom: customApps,
  bhed: bhedPrices,
  extras,
  calculators,
  converters,
  "exam-presets": examPresets,
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
