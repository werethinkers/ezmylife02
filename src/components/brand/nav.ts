import { Home, LayoutGrid, Globe, Mail, Wallet, Info, type LucideIcon } from "lucide-react";

/**
 * The site's main sections, in plain words. The header, the phone tab bar and the footer all
 * read from here, so a section is named the same way everywhere.
 */
export type SectionId = "home" | "apps" | "websites" | "cards" | "prices" | "about";

export interface NavSection {
  id: SectionId;
  to: string;
  label: string;
  /** Shorter label for the phone tab bar. */
  short: string;
  Icon: LucideIcon;
  /** Brand colour of the section (CSS colour value). */
  color: string;
}

export const NAV_SECTIONS: NavSection[] = [
  { id: "home", to: "/", label: "Home", short: "Home", Icon: Home, color: "hsl(var(--lime))" },
  { id: "apps", to: "/ai-apps", label: "Business apps", short: "Apps", Icon: LayoutGrid, color: "hsl(var(--pink))" },
  { id: "websites", to: "/websites", label: "Websites", short: "Websites", Icon: Globe, color: "hsl(var(--teal))" },
  { id: "cards", to: "/cards", label: "Cards & invites", short: "Cards", Icon: Mail, color: "hsl(var(--sun))" },
  { id: "prices", to: "/credits", label: "Prices", short: "Prices", Icon: Wallet, color: "hsl(var(--sky))" },
  { id: "about", to: "/about", label: "About", short: "About", Icon: Info, color: "hsl(var(--coral))" },
];

/** Product categories in the website/card builder that count as websites (they stay online). */
export const WEBSITE_CATEGORIES = ["business", "menus", "profiles"] as const;
/** Product categories that are cards or invites (sent once, for one moment). */
export const CARD_CATEGORIES = ["celebrations", "festivals", "events"] as const;

/** Which main section a URL belongs to, so the menu can show where you are. */
export function sectionOf(pathname: string, productCategory?: string | null): SectionId | null {
  if (pathname === "/") return "home";
  if (/^\/(ai-apps|tool|tool-preview|promo|explore|ai-for|ai-tool-for)(\/|$)/.test(pathname)) return "apps";
  if (/^\/websites(\/|$)/.test(pathname)) return "websites";
  if (/^\/cards(\/|$)/.test(pathname)) return "cards";
  if (/^\/(create|make)\//.test(pathname) && productCategory) {
    return (WEBSITE_CATEGORIES as readonly string[]).includes(productCategory) ? "websites" : "cards";
  }
  if (/^\/(credits|subscription)(\/|$)/.test(pathname)) return "prices";
  if (/^\/(about|refund-policy)(\/|$)/.test(pathname)) return "about";
  return null;
}
