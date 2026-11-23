import {
  Briefcase,
  Building2,
  Camera,
  Dumbbell,
  GraduationCap,
  HardHat,
  PartyPopper,
  Scissors,
  ShoppingBag,
  Stethoscope,
  Store,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/**
 * A short, real list of business types for the "Find by business" picker on /explore. `slug` is an
 * entry in INDUSTRY_SEEDS (src/lib/seoData.ts), so "See all" links to the matching /ai-for/<slug>
 * page and counts come from the same fuzzy match (landingMatches) that page uses — no made-up numbers.
 */
export interface ExploreBusinessType {
  slug: string;
  label: string;
  Icon: LucideIcon;
}

export const EXPLORE_BUSINESS_TYPES: ExploreBusinessType[] = [
  { slug: "retail", label: "Retail shop", Icon: Store },
  { slug: "beauty", label: "Salon & spa", Icon: Scissors },
  { slug: "fitness", label: "Gym & fitness", Icon: Dumbbell },
  { slug: "healthcare", label: "Clinic", Icon: Stethoscope },
  { slug: "restaurants", label: "Restaurant & cafe", Icon: UtensilsCrossed },
  { slug: "consulting", label: "Freelancer & agency", Icon: Briefcase },
  { slug: "construction", label: "Contractor", Icon: HardHat },
  { slug: "real-estate", label: "Real estate", Icon: Building2 },
  { slug: "education", label: "School & tuition", Icon: GraduationCap },
  { slug: "photography", label: "Photography studio", Icon: Camera },
  { slug: "events", label: "Event planner", Icon: PartyPopper },
  { slug: "ecommerce", label: "Online store", Icon: ShoppingBag },
];
