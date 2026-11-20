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
  /** A link (designs) or an action (apps open Quick Look). */
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
  "group flex flex-col justify-between gap-2 rounded-xl border border-zinc-200 bg-white p-2.5 text-left transition hover:border-orange-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-orange-500",
  FOCUS_RING,
);

function ItemBody({ item }: { item: SpotItem }) {
  return (
    <>
      <span className="relative block h-40 w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">{item.media}</span>
      <span className="block">
        <span className="flex items-center justify-between gap-1">
          <span className="font-display text-xs font-bold leading-snug text-zinc-900 dark:text-white">{item.name}</span>
          <span aria-hidden className="text-xs font-bold text-orange-600 transition group-hover:translate-x-0.5 dark:text-orange-400">
            &rarr;
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">{item.sub}</span>
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
    <div className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-soft-2xl shadow-orange-950/10 motion-safe:animate-float-slow sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
          <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Start here</span>
        </div>
        <span className="truncate rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-semibold text-orange-800 dark:bg-orange-950 dark:text-orange-300">{t.badge}</span>
      </div>

      <div role="tablist" aria-label="What to make" onKeyDown={onKey} className="grid grid-cols-4 gap-1.5 rounded-xl bg-zinc-100 p-1 text-xs font-semibold dark:bg-zinc-950">
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
              i === active ? "bg-white text-zinc-900 shadow-soft-sm dark:bg-zinc-800 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
            )}
          >
            {x.tab}
          </button>
        ))}
      </div>

      <div id="spot-panel" role="tabpanel" aria-labelledby={`spot-tab-${t.id}`} className="space-y-3 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold">{t.title}</h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t.line}</p>
          </div>
          <span className="shrink-0 rounded-lg bg-amber-400 px-2 py-1 text-xs font-bold text-zinc-950">{t.cost}</span>
        </div>

        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
          {t.items === null
            ? [0, 1].map((i) => <div key={i} aria-hidden className="h-[13.5rem] animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />)
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
            "flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 py-2.5 text-xs font-bold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-950",
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
