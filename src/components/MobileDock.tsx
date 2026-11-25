import { NavLink, useLocation } from "react-router-dom";
import { Gift, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { NAV_SECTIONS, sectionOf } from "@/components/brand/nav";
import { isModernPath, useModernTheme } from "@/components/modern/theme";
import { cn } from "@/lib/utils";

// Pages where the tab bar helps people move around. Inside an app (/tool/…) and in the website
// and card pages (/make/:id, /create/:id) the screen belongs to the task and has its own buy bar,
// so the tab bar steps aside.
const DOCK_PATHS = [
  /^\/$/, /^\/ai-apps/, /^\/studios/, /^\/explore/, /^\/credits$/, /^\/about/, /^\/promo\//, /^\/ai-for\//, /^\/ai-tool-for\//,
  /^\/profile$/, /^\/create$/, /^\/websites/, /^\/cards/, /^\/my-pages$/, /^\/refund-policy$/, /^\/creators$/, /^\/list-your-app$/,
];

const TABS = ["home", "apps", "websites", "cards"] as const;

/** The same tab bar on the modern pages (src/components/modern/): glass bar, zinc text, orange for the current tab. */
function ModernDock({ current, signedIn, total, dark }: { current: ReturnType<typeof sectionOf>; signedIn: boolean; total: number; dark: boolean }) {
  const cell =
    "relative flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 px-1 py-1.5 text-[11px] font-semibold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500";
  const tone = (on: boolean) => (on ? "text-orange-700 dark:text-orange-400" : "text-zinc-600 dark:text-zinc-400");
  const icon = (on: boolean) => cn("flex h-7 w-7 items-center justify-center rounded-lg", on && "bg-orange-100 dark:bg-orange-950");
  return (
    <div className={dark ? "dark" : undefined}>
      {/* Spacer so page content never hides behind the bar. */}
      <div className="h-[68px] md:hidden" aria-hidden />
      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-zinc-200/80 bg-[#F7F6F2]/90 backdrop-blur-[14px] md:hidden dark:border-zinc-800/80 dark:bg-[#0F1115]/90"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {TABS.map((id) => {
          const s = NAV_SECTIONS.find((x) => x.id === id)!;
          const on = current === id;
          return (
            <NavLink key={id} to={s.to} end={id === "home"} aria-current={on ? "page" : undefined} className={cn(cell, tone(on))}>
              <span className={icon(on)}>
                <s.Icon className="h-4 w-4" aria-hidden />
              </span>
              {s.short}
            </NavLink>
          );
        })}
        {signedIn ? (
          <NavLink to="/profile" className={({ isActive }) => cn(cell, tone(isActive))}>
            {({ isActive }) => (
              <>
                <span className={icon(isActive)}>
                  <User className="h-4 w-4" aria-hidden />
                </span>
                <span className="tabular-nums">{total > 999 ? "999+" : total} credits</span>
              </>
            )}
          </NavLink>
        ) : (
          <NavLink to="/auth?mode=signup" className={cn(cell, "text-zinc-900 dark:text-white")}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border-[1.5px] border-foreground bg-primary text-primary-foreground">
              <Gift className="h-4 w-4" aria-hidden />
            </span>
            Sign up free
          </NavLink>
        )}
      </nav>
    </div>
  );
}

/** Phone-only tab bar: Home · Apps · Websites · Cards · You (or Sign up). */
export function MobileDock() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { total } = useWallet();
  const { dark } = useModernTheme();
  if (!DOCK_PATHS.some((r) => r.test(pathname))) return null;
  const current = sectionOf(pathname);
  if (isModernPath(pathname)) return <ModernDock current={current} signedIn={!!user} total={total} dark={dark} />;

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
