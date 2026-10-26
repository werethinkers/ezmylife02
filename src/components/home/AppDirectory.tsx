import { useMemo, useRef, useState } from "react";
import { creditsForInr } from "@/lib/creditRate";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { usePricingMap } from "@/hooks/usePricingMap";
import { useProducts, type Listed } from "@/instant/useProducts";
import { CATEGORIES as DESIGN_CATEGORIES } from "@/instant/catalog";
import { WEBSITE_CATEGORIES } from "@/components/brand/nav";
import { GOALS_WITH_MORE, byCategoryOrder, categoriesOf, categoryInfo } from "@/data/goals";
import { useQuickLook } from "@/components/store/QuickLook";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * The whole store on one page: every app and every website and card design, grouped
 * goal → category. Each category shows its first few items and opens to the full list,
 * and the search box filters every list at once. Designs are a goal of their own
 * ("Websites & cards") so a visitor finds them in the same place as the apps.
 */

const SHOWN = 5;
const DESIGNS = "designs";

interface Item {
  key: string;
  name: string;
  to: string;
  price: string;
  /** Lower-case text the search box matches against. */
  text: string;
  /** App id, to open the quick look instead of leaving the page. */
  appId?: string;
}

interface Group {
  name: string;
  line: string;
  color: string;
  items: Item[];
}

interface Block {
  id: string;
  name: string;
  line: string;
  color: string;
  groups: Group[];
}

const designColor = (category: string) =>
  (WEBSITE_CATEGORIES as readonly string[]).includes(category) ? "hsl(var(--teal))" : "hsl(var(--sun))";

/** One swipeable row per goal at every screen size; ‹ › buttons for mouse users on larger screens. */
function GoalRail({ label, children }: { label: string; children: React.ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const page = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <div className="relative">
      <div className="mb-2 hidden justify-end gap-1.5 md:flex">
        <button type="button" aria-label={`Scroll ${label} left`} onClick={() => page(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-card transition hover:bg-sun">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" aria-label={`Scroll ${label} right`} onClick={() => page(1)} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-card transition hover:bg-sun">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={rail}
        className="-mx-4 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto scroll-smooth scroll-px-4 px-4 pb-3 pt-1 no-scrollbar sm:mx-0 sm:gap-4 sm:scroll-px-0 sm:px-1"
      >
        {children}
      </div>
    </div>
  );
}

export default function AppDirectory({ apps }: { apps: CatalogTool[] }) {
  const { costOf } = usePricingMap();
  const { list: designs } = useProducts();
  const { openQuickLook } = useQuickLook();
  const [goal, setGoal] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const blocks = useMemo<Block[]>(() => {
    // Apps: every category an app is listed in, largest category first (or admin order).
    const byCat = new Map<string, CatalogTool[]>();
    for (const t of apps) for (const c of categoriesOf(t)) byCat.set(c, [...(byCat.get(c) ?? []), t]);
    const cats = [...byCat.entries()].map(([c, ts]) => [c, ts.length] as [string, number]).sort(byCategoryOrder);

    const appItem = (t: CatalogTool): Item => {
      const cost = costOf(t.id);
      return {
        key: t.id,
        name: t.name,
        to: `/tool/${t.id}`,
        price: `${cost} credit${cost === 1 ? "" : "s"}`,
        text: `${t.name} ${t.description} ${categoriesOf(t).join(" ")}`.toLowerCase(),
        appId: t.id,
      };
    };

    const appBlocks: Block[] = GOALS_WITH_MORE.map((g) => ({
      id: g.id,
      name: g.name,
      line: g.line,
      color: g.color,
      groups: cats
        .filter(([c]) => categoryInfo(c).goal === g.id)
        .map(([c]) => {
          // Apps whose main category this is first, then the ones also listed here; A–Z inside each.
          const ts = [...(byCat.get(c) ?? [])].sort(
            (a, b) => Number(b.category === c) - Number(a.category === c) || (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name),
          );
          return { name: c, line: categoryInfo(c).line, color: g.color, items: ts.map(appItem) };
        }),
    }));

    const designItem = (l: Listed): Item => ({
      key: `design-${l.product.id}`,
      name: l.product.name,
      to: `/make/${l.product.id}`,
      price: l.price ? `₹${l.price} or ${creditsForInr(l.price).toLocaleString("en-IN")} credits` : "Free",
      text: `${l.product.name} ${l.product.tagline ?? ""} ${l.product.category} ${DESIGN_CATEGORIES.find((c) => c.id === l.product.category)?.name ?? ""}`.toLowerCase(),
    });

    const designBlock: Block = {
      id: DESIGNS,
      name: "Websites & cards",
      line: "Ready designs you fill in. Pay once, share with a link.",
      color: "hsl(var(--card))",
      groups: DESIGN_CATEGORIES.map((c) => ({
        name: c.name,
        line: c.blurb,
        color: designColor(c.id),
        items: designs.filter((l) => l.product.category === c.id).map(designItem),
      })),
    };

    return [...appBlocks, designBlock]
      .map((b) => ({ ...b, groups: b.groups.filter((g) => g.items.length > 0) }))
      .filter((b) => b.groups.length > 0);
  }, [apps, designs, costOf]);

  const query = search.trim().toLowerCase();
  const shown = useMemo(() => {
    const inGoal = goal === "all" ? blocks : blocks.filter((b) => b.id === goal);
    if (!query) return inGoal;
    return inGoal
      .map((b) => ({
        ...b,
        groups: b.groups
          .map((g) => ({ ...g, items: g.items.filter((i) => i.text.includes(query) || g.name.toLowerCase().includes(query)) }))
          .filter((g) => g.items.length > 0),
      }))
      .filter((b) => b.groups.length > 0);
  }, [blocks, goal, query]);

  const count = (b: Block) => new Set(b.groups.flatMap((g) => g.items.map((i) => i.key))).size;
  const appCount = new Set(blocks.filter((b) => b.id !== DESIGNS).flatMap((b) => b.groups.flatMap((g) => g.items.map((i) => i.key)))).size;
  const designCount = blocks.find((b) => b.id === DESIGNS) ? count(blocks.find((b) => b.id === DESIGNS)!) : 0;
  const matches = shown.reduce((n, b) => n + b.groups.reduce((m, g) => m + g.items.length, 0), 0);

  const toggle = (k: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  const onItem = (e: React.MouseEvent, i: Item) => {
    // Plain click on an app opens the quick look; new tab and crawlers follow the link.
    if (!i.appId || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    openQuickLook(i.appId);
  };

  return (
    <div>
      <p className="-mt-3 mb-5 text-[15px] font-semibold">
        {appCount} apps · {designCount} website and card designs
      </p>

      {/* Search inside the list */}
      <div className="relative mb-4 max-w-xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find in this list: salary slip, passport, Diwali…"
          aria-label="Find an app, website or card in the list"
          className="h-12 rounded-xl border-2 border-ink bg-card pl-10 pr-10 text-[16px]"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 hover:bg-muted"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Goal picker */}
      <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Show">
        {[{ id: "all", name: "Everything", color: "hsl(var(--card))", n: appCount + designCount }, ...blocks.map((b) => ({ id: b.id, name: b.name, color: b.color, n: count(b) }))].map((c) => {
          const active = goal === c.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => setGoal(c.id)}
              className={cn(
                "shrink-0 rounded-full border-2 border-ink px-4 py-2 text-[14px] font-bold transition-transform",
                active ? "shadow-block-sm -translate-y-0.5" : "bg-card opacity-80 hover:opacity-100",
              )}
              style={active ? { background: c.id === "all" || c.id === DESIGNS ? "hsl(var(--ink))" : c.color, color: c.id === "all" || c.id === DESIGNS ? "hsl(var(--card))" : undefined } : undefined}
            >
              {c.name} <span className="tabular-nums opacity-70">{c.n}</span>
            </button>
          );
        })}
      </div>

      {query && (
        <p className="mb-6 text-[15px] text-muted-foreground" aria-live="polite">
          {matches === 0 ? (
            <>
              Nothing called "{search.trim()}" yet.{" "}
              <a href="#request-tool" className="font-semibold text-foreground underline">
                Ask us to add it
              </a>
              .
            </>
          ) : (
            <>
              {matches} match{matches === 1 ? "" : "es"} for "{search.trim()}"
            </>
          )}
        </p>
      )}

      <div className="space-y-10">
        {shown.map((b) => (
          <div key={b.id}>
            <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="font-display text-xl font-bold md:text-2xl">
                {b.id === DESIGNS ? <Link to="/create" className="hover:underline">{b.name}</Link> : <Link to={`/ai-apps?goal=${b.id}`} className="hover:underline">{b.name}</Link>}
              </h3>
              <span className="text-[14px] text-muted-foreground">
                {count(b)} · {b.line}
              </span>
              {b.groups.length > 1 && (
                <span className="w-full text-[13px] font-semibold text-muted-foreground">
                  {b.groups.length} categories · swipe to see all →
                </span>
              )}
            </div>
            {/* One swipeable row per goal, on phones and on larger screens alike. */}
            <GoalRail label={b.name}>
              {b.groups.map((g) => {
                const k = `${b.id}:${g.name}`;
                const expanded = !!query || open.has(k);
                const items = expanded ? g.items : g.items.slice(0, SHOWN);
                const more = g.items.length - SHOWN;
                const seeAll = b.id === DESIGNS ? (WEBSITE_CATEGORIES as readonly string[]).includes(DESIGN_CATEGORIES.find((c) => c.name === g.name)?.id ?? "") ? "/websites" : `/cards?cat=${DESIGN_CATEGORIES.find((c) => c.name === g.name)?.id}` : `/ai-apps?category=${encodeURIComponent(g.name)}`;
                return (
                  <section key={k} className="block-card w-[84%] shrink-0 snap-start overflow-hidden sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]" aria-label={g.name}>
                    <div className="flex items-start justify-between gap-3 border-b-2 border-ink px-4 py-3" style={{ background: g.color }}>
                      <div className="min-w-0">
                        <Link to={seeAll} className="font-bold leading-tight hover:underline">
                          {g.name}
                        </Link>
                        {g.line && <p className="mt-0.5 line-clamp-2 text-[13px] text-ink/80">{g.line}</p>}
                      </div>
                      <span className="shrink-0 rounded-full border-2 border-ink bg-card px-2 py-0.5 text-[12px] font-bold tabular-nums">{g.items.length}</span>
                    </div>
                    <ul className="divide-y divide-border px-1.5 py-1">
                      {items.map((i) => (
                        <li key={i.key}>
                          <Link
                            to={i.to}
                            onClick={(e) => onItem(e, i)}
                            className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-[15px] font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span className="min-w-0 truncate">{i.name}</span>
                            <span className="shrink-0 text-[12px] font-medium text-muted-foreground">{i.price}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {!query && more > 0 && (
                      <button
                        type="button"
                        onClick={() => toggle(k)}
                        aria-expanded={expanded}
                        className="flex w-full items-center justify-center gap-1.5 border-t-2 border-ink bg-card px-4 py-2.5 text-[14px] font-bold hover:bg-muted"
                      >
                        {expanded ? "Show fewer" : `Show all ${g.items.length}`}
                        <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} aria-hidden />
                      </button>
                    )}
                  </section>
                );
              })}
            </GoalRail>
          </div>
        ))}
      </div>
    </div>
  );
}
