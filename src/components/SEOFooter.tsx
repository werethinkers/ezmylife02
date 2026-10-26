import { Link } from "react-router-dom";
import { useAppCountLabel } from "@/lib/appCount";
import { GOALS } from "@/data/goals";
import { Logo } from "@/components/brand/Logo";

const MAKE_LINKS = [
  { to: "/websites?cat=business", label: "Business websites" },
  { to: "/websites?cat=menus", label: "Menus and catalogues" },
  { to: "/websites?cat=profiles", label: "Visiting cards and resumes" },
  { to: "/cards?cat=events", label: "Invitations" },
  { to: "/cards?cat=festivals", label: "Festival wishes" },
  { to: "/cards?cat=celebrations", label: "Birthdays and celebrations" },
];

const SPECIAL_LINKS = [
  { to: "/startup-analyser", label: "Startup Analyser" },
  { to: "/meet-nudge", label: "Meet Nudge — save people you meet" },
  { to: "/notebook", label: "Speedy Notebook" },
  { to: "/promptmaster", label: "Prompt Master" },
  { to: "/google-business", label: "Google Business kit" },
];

const EARN_FOOTER_LINKS = [
  { to: "/creators", label: "Earn as a creator" },
  { to: "/list-your-app", label: "List your app" },
  { to: "/influencer", label: "Creator sign in" },
];

const COMPANY_LINKS = [
  { to: "/about", label: "About us" },
  { to: "/about#contact", label: "Talk to us" },
  { to: "/credits", label: "Prices and credits" },
  { to: "/refund-policy", label: "Refund policy" },
  { to: "/terms", label: "Terms and conditions" },
  { to: "/get-extension", label: "Browser add-on" },
  { to: "/mobile-shortcuts", label: "Add to your phone" },
  { to: "/explore", label: "Find apps by business" },
];

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
            The Future's First AI App Store. Business apps, websites and cards for small businesses in India — pay only for what you use. © 2026 EZYOURLIFE.
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
