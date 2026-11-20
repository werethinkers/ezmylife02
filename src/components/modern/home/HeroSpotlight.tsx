import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "../styles";

export interface SpotItem {
  key: string;
  name: string;
  sub: string;
  /** Fills the picture area. */
  media: ReactNode;
  /** A link (designs) or an action (apps open their store page). */
  to?: string;
  onOpen?: () => void;
}

export interface SpotTab {
  id: string;
  /** Short tab name. */
  tab: string;
  badge: string;
  title: string;
  line: string;
  cost: string;
  /** null while the items load. */
  items: SpotItem[] | null;
  to: string;
  cta: string;
}

const itemClass = cn(
  "group flex flex-col justify-between gap-2 rounded-xl border-2 border-ink bg-card p-2.5 text-left shadow-block-sm transition hover:bg-sand",
  FOCUS_RING,
);

function ItemBody({ item }: { item: SpotItem }) {
  return (
    <>
      <span className="relative block h-40 w-full overflow-hidden rounded-xl border border-ink/20 bg-sand">{item.media}</span>
      <span className="block">
        <span className="flex items-center justify-between gap-1">
          <span className="font-display text-xs font-bold leading-snug text-ink">{item.name}</span>
          <span aria-hidden className="text-xs font-bold text-primary transition group-hover:translate-x-0.5">
            &rarr;
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[11px] leading-tight text-muted-foreground">{item.sub}</span>
      </span>
    </>
  );
}

/** The hero's spotlight card: four tabs (website, card, studio, app), two real picks each, and a way in. */
export function HeroSpotlight({ tabs }: { tabs: SpotTab[] }) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const t = tabs[active] ?? tabs[0];
  if (!t) return null;

  const onKey = (e: KeyboardEvent) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (active + step + tabs.length) % tabs.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="block-card space-y-4 bg-card p-5 motion-safe:animate-float-slow sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-pink" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-sun" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-teal" aria-hidden />
          <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-ink/50">Start here</span>
        </div>
        <span className="truncate rounded-full border border-ink/30 bg-sun px-2.5 py-0.5 text-[11px] font-semibold text-ink">{t.badge}</span>
      </div>

      <div role="tablist" aria-label="What to make" onKeyDown={onKey} className="grid grid-cols-4 gap-1.5 rounded-xl border-2 border-ink bg-sand p-1 text-xs font-semibold">
        {tabs.map((x, i) => (
          <button
            key={x.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`spot-tab-${x.id}`}
            aria-selected={i === active}
            aria-controls="spot-panel"
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={cn(
              "truncate rounded-lg px-1 py-1.5 transition",
              FOCUS_RING,
              i === active ? "border border-ink bg-card font-bold text-ink shadow-block-sm" : "text-ink/60 hover:text-ink",
            )}
          >
            {x.tab}
          </button>
        ))}
      </div>

      <div id="spot-panel" role="tabpanel" aria-labelledby={`spot-tab-${t.id}`} className="space-y-3 rounded-2xl border-2 border-ink/20 bg-background p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold">{t.title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.line}</p>
          </div>
          <span className="shrink-0 rounded-lg border-2 border-ink bg-sun px-2 py-1 text-xs font-bold text-ink shadow-block-sm">{t.cost}</span>
        </div>

        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
          {t.items === null
            ? [0, 1].map((i) => <div key={i} aria-hidden className="h-[13.5rem] animate-pulse rounded-xl border-2 border-ink/20 bg-sand" />)
            : t.items.map((item) =>
                item.to ? (
                  <Link key={item.key} to={item.to} className={itemClass}>
                    <ItemBody item={item} />
                  </Link>
                ) : (
                  <button key={item.key} type="button" onClick={item.onOpen} className={itemClass}>
                    <ItemBody item={item} />
                  </button>
                ),
              )}
        </div>

        <Link
          to={t.to}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-ink py-2.5 text-xs font-bold text-cream shadow-block-sm transition hover:opacity-90",
            FOCUS_RING,
          )}
        >
          <span>{t.cta}</span>
          <span aria-hidden>&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
