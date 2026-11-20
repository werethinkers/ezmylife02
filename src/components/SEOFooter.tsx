import { Link } from "react-router-dom";
import { useAppCountLabel } from "@/lib/appCount";
import { GOALS } from "@/data/goals";
import { Logo } from "@/components/brand/Logo";
import {
  FOOTER_COMPANY_LINKS as COMPANY_LINKS,
  FOOTER_EARN_LINKS as EARN_FOOTER_LINKS,
  FOOTER_MAKE_LINKS as MAKE_LINKS,
  FOOTER_SPECIAL_LINKS as SPECIAL_LINKS,
} from "@/components/brand/nav";

/** Site footer: every section in plain words, on an ink background. */
const SEOFooter = () => {
  const countLabel = useAppCountLabel();
  const col = "space-y-3";
  const head = "font-display text-sm font-bold uppercase tracking-wider text-sun";
  const link = "block py-0.5 text-[15px] text-cream/85 transition-colors hover:text-pink";
  return (
    <footer className="mt-10 border-t-2 border-ink bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
          <div className={col}>
            <h3 className={head}>Business apps</h3>
            <ul>
              {GOALS.filter((g) => g.id !== "more").map((g) => (
                <li key={g.id}>
                  <Link to={`/ai-apps?goal=${g.id}`} className={link}>{g.name}</Link>
                </li>
              ))}
              <li><Link to="/ai-apps" className={link}>All {countLabel} apps</Link></li>
            </ul>
          </div>
          <div className={col}>
            <h3 className={head}>Websites and cards</h3>
            <ul>
              {MAKE_LINKS.map((l) => (
                <li key={l.to}><Link to={l.to} className={link}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div className={col}>
            <h3 className={head}>Special apps</h3>
            <ul>
              {SPECIAL_LINKS.map((l) => (
                <li key={l.to}><Link to={l.to} className={link}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div className={col}>
            <h3 className={head}>Earn with us</h3>
            <ul>
              {EARN_FOOTER_LINKS.map((l) => (
                <li key={l.to}><Link to={l.to} className={link}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div className={col}>
            <h3 className={head}>Company</h3>
            <ul>
              {COMPANY_LINKS.map((l) => (
                <li key={l.to}><Link to={l.to} className={link}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-cream/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-xl bg-cream px-3 py-2">
            <Logo />
          </div>
          <p className="max-w-xl text-sm text-cream/70">
            Business apps, websites and cards for small businesses in India — pay only for what you use. © 2026 EZYOURLIFE.
          </p>
        </div>
      </div>
      <p aria-hidden className="select-none overflow-hidden whitespace-nowrap px-4 pb-4 font-display text-[clamp(44px,12vw,168px)] font-extrabold leading-none tracking-tight text-cream/[0.07]">
        EZYOURLIFE
      </p>
    </footer>
  );
};

export default SEOFooter;
