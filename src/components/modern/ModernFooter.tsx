import { Link } from "react-router-dom";
import { useAppCountLabel } from "@/lib/appCount";
import { GOALS } from "@/data/goals";
import { FOOTER_COMPANY_LINKS, FOOTER_EARN_LINKS, FOOTER_MAKE_LINKS, FOOTER_SPECIAL_LINKS, NAV_SECTIONS } from "@/components/brand/nav";
import { cn } from "@/lib/utils";
import { ModernLogo } from "./ModernHeader";
import { CONTAINER, FOCUS_RING } from "./styles";

/** Footer of the modern pages: the same link columns as the site footer, in the quiet modern style. */
export function ModernFooter() {
  const countLabel = useAppCountLabel();
  const head = "font-display text-xs font-bold uppercase tracking-wider text-ink";
  const link = cn("block rounded py-0.5 text-sm text-ink/60 transition hover:text-ink", FOCUS_RING);
  const columns = [
    { title: "Business apps", links: [...GOALS.filter((g) => g.id !== "more").map((g) => ({ to: `/ai-apps?goal=${g.id}`, label: g.name })), { to: "/ai-apps", label: `All ${countLabel} apps` }] },
    { title: "Websites and cards", links: FOOTER_MAKE_LINKS },
    { title: "Special apps", links: FOOTER_SPECIAL_LINKS },
    { title: "Earn with us", links: FOOTER_EARN_LINKS },
    { title: "Company", links: FOOTER_COMPANY_LINKS },
  ];
  return (
    <footer className="border-t-2 border-ink py-10 text-xs text-ink/60">
      <div className={CONTAINER}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-5">
          {columns.map((c) => (
            <div key={c.title} className="space-y-3">
              <h3 className={head}>{c.title}</h3>
              <ul>
                {c.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className={link}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t-2 border-ink/20 pt-6 sm:flex-row">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            <ModernLogo className="text-zinc-900 dark:text-white" />
            <p className="max-w-md">Business apps, websites and cards for small businesses in India — pay only for what you use. &copy; 2026 EZYOURLIFE.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-5">
            {NAV_SECTIONS.filter((s) => s.id !== "earn").map((s) => (
              <Link key={s.id} to={s.to} className={cn("rounded transition hover:text-ink", FOCUS_RING)}>
                {s.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
