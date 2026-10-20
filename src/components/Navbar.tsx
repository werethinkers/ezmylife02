import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/supabase";
import { Menu, X, User, LogOut, Wallet, LayoutTemplate, Puzzle, Compass, ChevronDown } from "lucide-react";
import WalletBadge from "@/components/wallet/WalletBadge";
import { Logo } from "@/components/brand/Logo";
import { EARN_LINKS, NAV_SECTIONS, sectionOf, type SectionId } from "@/components/brand/nav";
import { cn } from "@/lib/utils";

/**
 * Site header. It stays at the top while you scroll, names every section in plain words and
 * highlights the one you are in. Pages that belong to a section the URL can't tell (a website or
 * card design page) pass `section`.
 */
export const Navbar = ({ section }: { section?: SectionId | null }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const current = section ?? sectionOf(pathname);

  const handleSignOut = async () => {
    await authService.signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="EZYOURLIFE home">
          <Logo />
        </Link>

        <nav aria-label="Main" className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV_SECTIONS.map((s) => {
            const on = current === s.id;
            const pill = cn(
              "inline-flex items-center gap-1 whitespace-nowrap rounded-full border-2 px-2.5 py-1.5 text-[14px] xl:px-3 xl:text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on ? "border-ink bg-ink text-cream" : "border-transparent text-ink hover:border-ink hover:bg-card",
            );
            // Short names until there is room for the full ones (8 sections fit a 1024 px screen this way).
            const name = (
              <>
                <span className="xl:hidden">{s.short}</span>
                <span className="hidden xl:inline">{s.label}</span>
              </>
            );
            if (s.id === "earn") {
              return (
                <DropdownMenu key={s.id}>
                  <DropdownMenuTrigger className={pill} aria-current={on ? "page" : undefined}>
                    {name}
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-80 rounded-2xl border-2 border-ink p-2 shadow-block">
                    {EARN_LINKS.map((l) => (
                      <DropdownMenuItem key={l.to} asChild className="cursor-pointer rounded-xl p-3 focus:bg-sand">
                        <Link to={l.to} className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink text-ink" style={{ background: l.color }}>
                            <l.Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[15px] font-bold">{l.label}</span>
                            <span className="block text-[13px] leading-snug text-muted-foreground">{l.line}</span>
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            return (
              <NavLink key={s.id} to={s.to} aria-current={on ? "page" : undefined} className={pill}>
                {name}
              </NavLink>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user && <WalletBadge />}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full border-2 border-ink shadow-[2px_2px_0_0_hsl(var(--ink))] transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Your account"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{(user.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <div className="px-2 py-2">
                  <p className="truncate text-sm font-bold">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Your account</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer"><User className="mr-2 h-4 w-4" /> Profile and saved work</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/my-pages" className="cursor-pointer"><LayoutTemplate className="mr-2 h-4 w-4" /> My websites and cards</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/credits" className="cursor-pointer"><Wallet className="mr-2 h-4 w-4" /> Credits and payments</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/get-extension" className="cursor-pointer"><Puzzle className="mr-2 h-4 w-4" /> Browser add-on</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="h-10 px-4">
                <Link to="/auth?mode=signup">Sign up free</Link>
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav id="site-menu" aria-label="Main" className="border-t-2 border-ink bg-background lg:hidden">
          <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-4 sm:grid-cols-3">
            {NAV_SECTIONS.map((s) => {
              const on = current === s.id;
              if (s.id === "earn") {
                return (
                  <li key={s.id} className="col-span-2 sm:col-span-3">
                    <div className="rounded-xl border-2 border-ink bg-sun p-2 shadow-[3px_3px_0_0_hsl(var(--ink))]">
                      <p className="px-1.5 pb-1.5 pt-0.5 text-xs font-bold uppercase tracking-wider">{s.label}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {EARN_LINKS.map((l) => (
                          <Link
                            key={l.to}
                            to={l.to}
                            onClick={() => setOpen(false)}
                            aria-current={pathname === l.to ? "page" : undefined}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg border-2 border-ink px-3 py-2.5 text-[15px] font-semibold",
                              pathname === l.to ? "bg-ink text-cream" : "bg-card",
                            )}
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-ink text-ink" style={{ background: l.color }}>
                              <l.Icon className="h-4 w-4" aria-hidden />
                            </span>
                            {l.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </li>
                );
              }
              return (
                <li key={s.id}>
                  <Link
                    to={s.to}
                    onClick={() => setOpen(false)}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border-2 border-ink px-3 py-2.5 text-[15px] font-semibold shadow-[3px_3px_0_0_hsl(var(--ink))]",
                      on ? "bg-ink text-cream" : "bg-card",
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-ink text-ink" style={{ background: s.color }}>
                      <s.Icon className="h-4 w-4" aria-hidden />
                    </span>
                    {s.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                to="/explore"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl border-2 border-ink bg-card px-3 py-2.5 text-[15px] font-semibold shadow-[3px_3px_0_0_hsl(var(--ink))]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-lime text-ink">
                  <Compass className="h-4 w-4" aria-hidden />
                </span>
                Find by business
              </Link>
            </li>
            {!user && (
              <li className="sm:hidden">
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl border-2 border-ink bg-card px-3 py-2.5 text-[15px] font-semibold shadow-[3px_3px_0_0_hsl(var(--ink))]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-card text-ink">
                    <User className="h-4 w-4" aria-hidden />
                  </span>
                  Sign in
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
};
