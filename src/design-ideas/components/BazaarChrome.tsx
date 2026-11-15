import { Link } from "react-router-dom";
import { ArrowRight, Gift, ShieldCheck, WalletCards } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NAV_SECTIONS } from "@/components/brand/nav";

/** Slim header for the design pages (the real header is not used so each idea can be seen on its own). */
export function BazaarHeader() {
  const items = NAV_SECTIONS.filter((s) => ["apps", "studios", "websites", "cards", "prices"].includes(s.id));
  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" aria-label="EZYOURLIFE home"><Logo /></Link>
        <nav aria-label="Main" className="hidden gap-1 md:flex">
          {items.map((s) => (
            <Link key={s.id} to={s.to} className="rounded-full px-3 py-1.5 text-[15px] font-semibold hover:bg-secondary">{s.label}</Link>
          ))}
        </nav>
        <Link to="/auth" className="rounded-full border-2 border-ink bg-sun px-4 py-1.5 text-sm font-bold shadow-block-sm">Sign in</Link>
      </div>
    </header>
  );
}

const TRUST = [
  { Icon: Gift, title: "100 free credits", line: "To start. No card needed." },
  { Icon: WalletCards, title: "Pay for results", line: "Credits are used only when an app gives you something." },
  { Icon: ShieldCheck, title: "Failed runs are free", line: "If it does not work, your credits come back." },
];

export function TrustStrip() {
  return (
    <section aria-label="How it is priced" className="mx-auto max-w-7xl px-4 pb-4">
      <ul className="grid gap-4 md:grid-cols-3">
        {TRUST.map(({ Icon, title, line }) => (
          <li key={title} className="block-card flex items-start gap-3 bg-card p-4">
            <Icon className="mt-0.5 h-6 w-6 shrink-0" aria-hidden />
            <div><p className="font-display text-[15px] font-bold">{title}</p><p className="text-[14px] text-muted-foreground">{line}</p></div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GateBand() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="block-card flex flex-wrap items-center justify-between gap-4 bg-pink p-6 md:p-8">
        <div>
          <h2 className="font-display text-2xl font-bold md:text-3xl">Swagat hai. Your first 100 credits are on us.</h2>
          <p className="mt-1 text-[16px]">Sign up, step into any shop and get your first result free.</p>
        </div>
        <Link to="/auth" className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-card px-6 py-3 font-bold shadow-block-sm hover:-translate-y-0.5">
          Claim 100 free credits <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
