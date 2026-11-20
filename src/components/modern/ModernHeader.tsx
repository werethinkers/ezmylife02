import { useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Compass, LogOut, Menu, Moon, Sun, User, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/supabase";
import { useWallet } from "@/hooks/useWallet";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useAppCountLabel } from "@/lib/appCount";
import { isIosApp } from "@/lib/nativeApp";
import { STUDIO_IDS } from "@/data/studios";
import { ACCOUNT_LINKS, EARN_LINKS, NAV_SECTIONS, sectionOf, type SectionId } from "@/components/brand/nav";
import { cn } from "@/lib/utils";
import { useModernTheme } from "./theme";
import { BTN_INK, CONTAINER, FOCUS_RING, roundedLabel } from "./styles";

/** The modern mark: "EZ" on an orange square, and the name. */
export function ModernLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-ink bg-sun font-display text-lg font-bold text-ink shadow-block-sm">
        EZ
      </span>
      <span className="font-display text-lg font-bold tracking-tight">EZYOURLIFE</span>
    </span>
  );
}

/**
 * Header of the modern pages: a thin strip with the store in numbers, then a sticky glass bar with
 * every section (from src/components/brand/nav.ts), the light/dark switch, credits and the account
 * menu. Menus open outside the page, so they carry the modern classes themselves.
 */
export function ModernHeader({ section }: { section?: SectionId | null }) {
  const { user } = useAuth();
  const { total, isLoading } = useWallet();
  const { dark, toggle } = useModernTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const current = section ?? sectionOf(pathname);
  const countLabel = useAppCountLabel();
  const { data: catalog = [] } = useToolsCatalog();
  const studios = useMemo(() => catalog.filter((t) => t.is_live && STUDIO_IDS.has(t.id)).length, [catalog]);
  const ios = isIosApp();
  const menuSurface = cn("ez-modern rounded-2xl border border-border p-2 shadow-soft-xl", dark && "dark");

  const signOut = async () => {
    await authService.signOut();
    navigate("/");
  };

  const navLink = (on: boolean) =>
    cn(
      "inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-1 py-1 transition",
      FOCUS_RING,
      on ? "font-semibold text-zinc-950 dark:text-white" : "hover:text-zinc-950 dark:hover:text-white",
    );
  const label = (s: (typeof NAV_SECTIONS)[number]) => (
    <>
      <span className="xl:hidden">{s.short}</span>
      <span className="hidden xl:inline">{s.label}</span>
    </>
  );

  return (
    <>
      <div className="bg-zinc-950 px-4 py-2 text-center text-xs font-medium text-white dark:bg-orange-600">
        <span>
          {countLabel} business apps{studios > 0 ? ` · ${roundedLabel(studios)} studios` : ""} · websites and cards in minutes —{" "}
        </span>
        <Link to={user ? "/credits" : "/auth?mode=signup"} className="font-semibold underline underline-offset-2 transition hover:text-amber-300">
          {user ? "Add credits" : "Start with 100 free credits"} &rarr;
        </Link>
      </div>

      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-[#F7F6F2]/85 backdrop-blur-[14px] dark:border-zinc-800/80 dark:bg-[#0F1115]/85">
        <div className={cn(CONTAINER, "flex h-16 items-center justify-between gap-4")}>
          <Link to="/" aria-label="EZYOURLIFE home" className={cn("shrink-0 rounded-xl", FOCUS_RING)}>
            <ModernLogo />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-4 text-sm font-medium text-zinc-600 lg:flex xl:gap-5 dark:text-zinc-300">
            {NAV_SECTIONS.map((s) => {
              const on = current === s.id;
              if (s.id === "earn") {
                return (
                  <DropdownMenu key={s.id}>
                    <DropdownMenuTrigger className={navLink(on)} aria-current={on ? "page" : undefined}>
                      {label(s)}
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className={cn(menuSurface, "w-80")}>
                      {EARN_LINKS.map((l) => (
                        <DropdownMenuItem key={l.to} asChild className="cursor-pointer rounded-xl p-3">
                          <Link to={l.to} className="flex items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                              <l.Icon className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-bold">{l.label}</span>
                              <span className="block text-xs leading-snug text-muted-foreground">{l.line}</span>
                            </span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              return (
                <NavLink key={s.id} to={s.to} end={s.id === "home"} aria-current={on ? "page" : undefined} className={navLink(on)}>
                  {label(s)}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggle}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900",
                FOCUS_RING,
              )}
            >
              {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
            </button>

            {user ? (
              <>
                <Link
                  to="/credits"
                  aria-label={`Your credits: ${total}`}
                  className={cn(
                    "hidden items-center gap-1.5 rounded-xl border border-emerald-300/60 bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-900 sm:inline-flex dark:border-emerald-700/50 dark:bg-emerald-950/60 dark:text-emerald-300",
                    FOCUS_RING,
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" aria-hidden />
                  <span className="tabular-nums">{isLoading ? "—" : total.toLocaleString("en-IN")}</span> credits
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Your account"
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-sm font-bold text-white dark:bg-white dark:text-zinc-950",
                        FOCUS_RING,
                      )}
                    >
                      {(user.email || "U").charAt(0).toUpperCase()}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={cn(menuSurface, "w-64")}>
                    <div className="px-2 py-2">
                      <p className="truncate text-sm font-bold">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Your account</p>
                    </div>
                    <DropdownMenuSeparator />
                    {ACCOUNT_LINKS.filter((l) => !(l.webOnly && ios)).map((l) => (
                      <DropdownMenuItem key={l.to} asChild>
                        <Link to={l.to} className="cursor-pointer">
                          <l.Icon className="mr-2 h-4 w-4" /> {ios && l.iosLabel ? l.iosLabel : l.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/auth" className={cn("hidden rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:text-zinc-950 sm:inline-flex dark:text-zinc-300 dark:hover:text-white", FOCUS_RING)}>
                  Sign in
                </Link>
                <Link to="/auth?mode=signup" className={BTN_INK}>
                  Sign up free
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="modern-site-menu"
              className={cn("flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 lg:hidden dark:border-zinc-800", FOCUS_RING)}
            >
              {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>

        {open && (
          <nav id="modern-site-menu" aria-label="Main" className="border-t border-zinc-200 bg-[#F7F6F2] px-4 py-3 lg:hidden dark:border-zinc-800 dark:bg-[#0F1115]">
            <ul className="mx-auto grid max-w-7xl gap-1 sm:grid-cols-2">
              {NAV_SECTIONS.flatMap((s) =>
                s.id === "earn"
                  ? EARN_LINKS.map((l) => ({ to: l.to, text: l.label, Icon: l.Icon, on: pathname === l.to }))
                  : [{ to: s.to, text: s.label, Icon: s.Icon, on: current === s.id }],
              )
                .concat([{ to: "/explore", text: "Find by business", Icon: Compass, on: pathname === "/explore" }])
                .concat(user ? [] : [{ to: "/auth", text: "Sign in", Icon: User, on: false }])
                .map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      onClick={() => setOpen(false)}
                      aria-current={l.on ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition",
                        FOCUS_RING,
                        l.on ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "hover:bg-zinc-100 dark:hover:bg-zinc-900",
                      )}
                    >
                      <l.Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {l.text}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
        )}
      </header>
    </>
  );
}
