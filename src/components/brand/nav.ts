import { Home, LayoutGrid, Globe, Mail, Sparkles, Wallet, Info, HandCoins, Megaphone, Boxes, User, LayoutTemplate, BadgeCheck, Keyboard, Puzzle, type LucideIcon } from "lucide-react";

/**
 * The site's main sections, in plain words. The header, the phone tab bar and the footer all
 * read from here, so a section is named the same way everywhere.
 */
export type SectionId = "home" | "apps" | "studios" | "websites" | "cards" | "prices" | "earn" | "about";

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
  { id: "studios", to: "/studios", label: "Studios", short: "Studios", Icon: Sparkles, color: "hsl(var(--pink))" },
  { id: "websites", to: "/websites", label: "Websites", short: "Websites", Icon: Globe, color: "hsl(var(--teal))" },
  { id: "cards", to: "/cards", label: "Cards & invites", short: "Cards", Icon: Mail, color: "hsl(var(--sun))" },
  { id: "prices", to: "/credits", label: "Prices", short: "Prices", Icon: Wallet, color: "hsl(var(--sky))" },
  { id: "earn", to: "/creators", label: "Earn with us", short: "Earn", Icon: HandCoins, color: "hsl(var(--sun))" },
  { id: "about", to: "/about", label: "About", short: "About", Icon: Info, color: "hsl(var(--coral))" },
];

/** The pages under "Earn with us". The header shows them as a small menu, the phone menu as a group. */
export const EARN_LINKS: { to: string; label: string; line: string; Icon: LucideIcon; color: string }[] = [
  { to: "/creators", label: "For creators", line: "Share Ezyourlife and earn on every sale you bring.", Icon: Megaphone, color: "hsl(var(--pink))" },
  { to: "/list-your-app", label: "List your app", line: "Put your web app in our store and earn a share when people use it.", Icon: Boxes, color: "hsl(var(--teal))" },
];

/** The signed-in account menu. `iosLabel` replaces the label inside the iPhone app; `webOnly` hides the item there. */
export const ACCOUNT_LINKS: { to: string; label: string; iosLabel?: string; webOnly?: boolean; Icon: LucideIcon }[] = [
  { to: "/profile", label: "Profile and saved work", Icon: User },
  { to: "/my-pages", label: "My websites and cards", Icon: LayoutTemplate },
  { to: "/credits", label: "Credits and payments", Icon: Wallet },
  { to: "/subscription", label: "Subscription", Icon: BadgeCheck },
  { to: "/keyboard", label: "iPhone keyboard and voice", iosLabel: "Keyboard and voice", Icon: Keyboard },
  { to: "/get-extension", label: "Browser add-on", webOnly: true, Icon: Puzzle },
];

type FooterLink = { to: string; label: string };

/** Footer columns (the business-app column is built from the goals in src/data/goals.ts). */
export const FOOTER_MAKE_LINKS: FooterLink[] = [
  { to: "/websites?cat=business", label: "Business websites" },
  { to: "/websites?cat=menus", label: "Menus and catalogues" },
  { to: "/websites?cat=profiles", label: "Visiting cards and resumes" },
  { to: "/cards?cat=events", label: "Invitations" },
  { to: "/cards?cat=festivals", label: "Festival wishes" },
  { to: "/cards?cat=celebrations", label: "Birthdays and celebrations" },
];

export const FOOTER_SPECIAL_LINKS: FooterLink[] = [
  { to: "/startup-analyser", label: "Startup Analyser" },
  { to: "/meet-nudge", label: "Meet Nudge — save people you meet" },
  { to: "/notebook", label: "Speedy Notebook" },
  { to: "/promptmaster", label: "Prompt Master" },
  { to: "/google-business", label: "Google Business kit" },
];

export const FOOTER_EARN_LINKS: FooterLink[] = [
  { to: "/creators", label: "Earn as a creator" },
  { to: "/list-your-app", label: "List your app" },
  { to: "/influencer", label: "Creator sign in" },
];

export const FOOTER_COMPANY_LINKS: FooterLink[] = [
  { to: "/about", label: "About us" },
  { to: "/about#contact", label: "Talk to us" },
  { to: "/credits", label: "Prices and credits" },
  { to: "/refund-policy", label: "Refund policy" },
  { to: "/terms", label: "Terms and conditions" },
  { to: "/privacy", label: "Privacy policy" },
  { to: "/get-extension", label: "Browser add-on" },
  { to: "/mobile-shortcuts", label: "Add to your phone" },
  { to: "/explore", label: "Find apps by business" },
];

/** Product categories in the website/card builder that count as websites (they stay online). */
export const WEBSITE_CATEGORIES = ["business", "menus", "profiles"] as const;
/** Product categories that are cards or invites (sent once, for one moment). */
export const CARD_CATEGORIES = ["celebrations", "festivals", "events"] as const;

/** Which main section a URL belongs to, so the menu can show where you are. */
export function sectionOf(pathname: string, productCategory?: string | null): SectionId | null {
  if (pathname === "/") return "home";
  if (/^\/(ai-apps|tool|tool-preview|promo|explore|ai-for|ai-tool-for)(\/|$)/.test(pathname)) return "apps";
  if (/^\/studios(\/|$)/.test(pathname)) return "studios";
  if (/^\/websites(\/|$)/.test(pathname)) return "websites";
  if (/^\/cards(\/|$)/.test(pathname)) return "cards";
  if (/^\/(create|make)\//.test(pathname) && productCategory) {
    return (WEBSITE_CATEGORIES as readonly string[]).includes(productCategory) ? "websites" : "cards";
  }
  if (/^\/(credits|subscription)(\/|$)/.test(pathname)) return "prices";
  if (/^\/(creators|list-your-app)(\/|$)/.test(pathname)) return "earn";
  if (/^\/(about|refund-policy)(\/|$)/.test(pathname)) return "about";
  return null;
}
