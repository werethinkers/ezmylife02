/* The sections of the app, their names (in the business's own words) and icons. */

import { BarChart3, Bell, Boxes, CalendarDays, Globe, Home, Landmark, Megaphone, ReceiptIndianRupee, Settings as Cog, ShoppingBag, Truck, UserPlus, Users, UsersRound, Wallet, HandCoins } from "lucide-react";
import type { ModuleId, Settings } from "@/business/types";

export const MODULE_NAMES = (s: Settings): Record<ModuleId, string> => ({
  overview: "Today", orders: s.labels.orders, appointments: s.labels.orders, leads: "Enquiries", customers: s.labels.customers, bills: "Bills",
  dues: "To collect", stock: s.labels.products, purchases: "Buying", money: "Money", taxes: "Taxes", staff: "Staff", reminders: "Reminders",
  marketing: "Offers", website: "Website", reports: "Reports", settings: "Settings",
});

export const MODULE_ICONS: Record<ModuleId, typeof Home> = {
  overview: Home, orders: ShoppingBag, appointments: CalendarDays, leads: UserPlus, customers: Users, bills: ReceiptIndianRupee, dues: HandCoins,
  stock: Boxes, purchases: Truck, money: Wallet, taxes: Landmark, staff: UsersRound, reminders: Bell, marketing: Megaphone, website: Globe,
  reports: BarChart3, settings: Cog,
};

/** Sections shown, in a fixed order; Today and Settings are always there. */
export const ORDERED: ModuleId[] = ["overview", "orders", "appointments", "bills", "dues", "customers", "leads", "stock", "purchases", "money", "reminders", "marketing", "staff", "taxes", "website", "reports", "settings"];
export const visibleModules = (s: Settings): ModuleId[] => ORDERED.filter((m) => m === "overview" || m === "settings" || s.modules.includes(m));

/** Sidebar grouping, by daily workflow. A module appears in exactly one group. */
export const SECTION_GROUPS: { label: string; items: ModuleId[] }[] = [
  { label: "Daily", items: ["overview", "orders", "appointments", "bills", "dues"] },
  { label: "Customers", items: ["customers", "leads", "reminders"] },
  { label: "Business", items: ["stock", "purchases", "money"] },
  { label: "Manage", items: ["marketing", "staff", "taxes", "website", "reports", "settings"] },
];
/** The four on the phone's bottom bar. */
export const phoneBar = (s: Settings): ModuleId[] => {
  const v = visibleModules(s);
  return ["overview", v.includes("appointments") ? "appointments" : v.includes("orders") ? "orders" : "bills", "dues", "money"].filter((m) => v.includes(m as ModuleId)) as ModuleId[];
};
