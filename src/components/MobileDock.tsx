import { NavLink, useLocation } from "react-router-dom";
import { Gift, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { NAV_SECTIONS, sectionOf } from "@/components/brand/nav";
import { cn } from "@/lib/utils";

// Pages where the tab bar helps people move around. Inside an app (/tool/…) and in the website
// and card pages (/make/:id, /create/:id) the screen belongs to the task and has its own buy bar,
// so the tab bar steps aside.
const DOCK_PATHS = [
  /^\/$/, /^\/ai-apps/, /^\/explore/, /^\/credits$/, /^\/about/, /^\/promo\//, /^\/ai-for\//, /^\/ai-tool-for\//,
  /^\/profile$/, /^\/create$/, /^\/websites/, /^\/cards/, /^\/my-pages$/, /^\/refund-policy$/,
];

const TABS = ["home", "apps", "websites", "cards"] as const;

/** Phone-only tab bar: Home · Apps · Websites · Cards · You (or Sign up). */
export function MobileDock() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { total } = useWallet();
  if (!DOCK_PATHS.some((r) => r.test(pathname))) return null;
  const current = sectionOf(pathname);

  const cell =
    "relative flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 px-1 py-1.5 text-[11px] font-bold leading-none text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

  return (
    <>
      {/* Spacer so page content never hides behind the bar. */}
      <div className="h-[68px] md:hidden" aria-hidden />
      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex border-t-2 border-ink bg-card md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {TABS.map((id) => {
          const s = NAV_SECTIONS.find((x) => x.id === id)!;
          const on = current === id;
          return (
            <NavLink key={id} to={s.to} end={id === "home"} aria-current={on ? "page" : undefined} className={cn(cell, on && "bg-sun")}>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-ink" style={{ background: s.color }}>
                <s.Icon className="h-4 w-4" aria-hidden />
              </span>
              {s.short}
            </NavLink>
          );
        })}
        {user ? (
          <NavLink to="/profile" className={({ isActive }) => cn(cell, isActive && "bg-sun")}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-ink bg-sky">
              <User className="h-4 w-4" aria-hidden />
            </span>
            <span className="tabular-nums">{total > 999 ? "999+" : total} credits</span>
          </NavLink>
        ) : (
          <NavLink to="/auth?mode=signup" className={cn(cell, "bg-pink")}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-ink bg-card">
              <Gift className="h-4 w-4" aria-hidden />
            </span>
            Sign up free
          </NavLink>
        )}
      </nav>
    </>
  );
}
