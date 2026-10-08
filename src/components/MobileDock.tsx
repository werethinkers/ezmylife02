import { NavLink, useLocation } from "react-router-dom";
import { Compass, LayoutGrid, Wallet, User, Gift, Layers } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";

// Pages where the dock helps people move around. Inside an app (/tool/…) the app owns the screen.
const DOCK_PATHS = [/^\/$/, /^\/ai-apps/, /^\/explore/, /^\/credits$/, /^\/about/, /^\/promo\//, /^\/ai-for\//, /^\/ai-tool-for\//, /^\/profile$/, /^\/workspace$/, /^\/create$/];

/** Phone-only bottom dock: Discover · Browse · Workspace · Wallet · Account (or free credits). */
export function MobileDock() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { total } = useWallet();
  if (!DOCK_PATHS.some((r) => r.test(pathname))) return null;

  const item = (to: string, label: string, Icon: typeof Compass, end = false, badge?: string) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )
      }
    >
      <Icon className="h-5 w-5" aria-hidden />
      {label}
      {badge && (
        <span className="absolute right-1/2 top-0.5 translate-x-5 rounded-full bg-primary px-1.5 text-[10px] font-bold leading-4 text-primary-foreground">
          {badge}
        </span>
      )}
    </NavLink>
  );

  return (
    <>
      {/* Spacer so page content never hides behind the dock. */}
      <div className="h-20 md:hidden" aria-hidden />
      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-3 bottom-3 z-50 flex items-stretch gap-1 rounded-3xl border border-border/60 bg-background/80 p-1.5 shadow-2xl shadow-black/10 backdrop-blur-xl md:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        {item("/", "Discover", Compass, true)}
        {item("/ai-apps", "Browse", LayoutGrid)}
        {item("/workspace", "Workspace", Layers)}
        {item("/credits", "Wallet", Wallet, false, user ? (total > 999 ? "999+" : String(total)) : undefined)}
        {user ? (
          item("/profile", "Account", User)
        ) : (
          <NavLink
            to="/auth?mode=signup"
            className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-2xl bg-primary px-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Gift className="h-4 w-4" aria-hidden />
            100 free credits
          </NavLink>
        )}
      </nav>
    </>
  );
}
