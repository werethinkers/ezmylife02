import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { usePricingMap } from "@/hooks/usePricingMap";
import { useProducts, type Listed } from "@/instant/useProducts";
import { CATEGORIES as DESIGN_CATEGORIES } from "@/instant/catalog";
import { WEBSITE_CATEGORIES } from "@/components/brand/nav";
import { GOALS_WITH_MORE, byCategoryOrder, categoriesOf, categoryInfo } from "@/data/goals";
import { useQuickLook } from "@/components/store/QuickLook";
import { APP_PREVIEW_IDS } from "@/data/previewManifest";
import { AppTile } from "@/components/store/AppTile";
import { ProductCard } from "@/components/instant/ProductCard";
import { DESIGN_COLOUR } from "@/data/designColours";
import { cn } from "@/lib/utils";

/**
 * The whole store on one page: every app and every website and card design, grouped
 * goal → category. Each category shows its first few items and opens to the full list,
 * and one goal shows at a time, picked from the chips. Designs are a goal of their own
 * ("Websites & cards") so a visitor finds them in the same place as the apps.
 */

const MAX_CARDS = 40;
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
  /** One line under the name. */
  sub: string;
  /** Icon: an app's own artwork, or a design's glyph on its colour. */
  category?: string;
  glyph?: string;
  color?: string;
  /** The real thing, so the slider can show the same card as the rest of the site. */
  tool?: CatalogTool;
  design?: Listed;
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
        className="-mx-4 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto scroll-smooth scroll-px-4 px-4 pb-3 pt-1 no-scrollbar sm:mx-0 sm:gap-4 sm:scroll-px-0 sm:px-1"
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
  const [goal, setGoal] = useState<string>("");
  // The category chosen inside each goal ("" = all of that goal).
  const [cats, setCats] = useState<Record<string, string>>({});

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
        sub: t.description || categoryInfo(t.category).line,
        category: t.category,
        tool: t,
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
      price: l.price ? `₹${l.price}` : "Free",
      text: `${l.product.name} ${l.product.tagline ?? ""} ${l.product.category} ${DESIGN_CATEGORIES.find((c) => c.id === l.product.category)?.name ?? ""}`.toLowerCase(),
      sub: l.product.tagline ?? "",
      glyph: l.product.glyph,
      design: l,
      color: DESIGN_COLOUR[l.product.category] ?? designColor(l.product.category),
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

  // One section at a time: the one the visitor picked, else the first.
  const shown = useMemo(() => {
    const one = blocks.find((b) => b.id === goal) ?? blocks[0];
    return one ? [one] : [];
  }, [blocks, goal]);

  const count = (b: Block) => new Set(b.groups.flatMap((g) => g.items.map((i) => i.key))).size;
  const appCount = new Set(blocks.filter((b) => b.id !== DESIGNS).flatMap((b) => b.groups.flatMap((g) => g.items.map((i) => i.key)))).size;
  const designCount = blocks.find((b) => b.id === DESIGNS) ? count(blocks.find((b) => b.id === DESIGNS)!) : 0;

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

      {/* Goal picker */}
      <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Show">
        {[...blocks.map((b) => ({ id: b.id, name: b.name, color: b.color, n: count(b) }))].map((c) => {
          const active = (shown[0]?.id ?? "") === c.id;
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
              style={active ? { background: c.id === DESIGNS ? "hsl(var(--ink))" : c.color, color: c.id === DESIGNS ? "hsl(var(--card))" : undefined } : undefined}
            >
              {c.name} <span className="tabular-nums opacity-70">{c.n}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-12">
        {shown.map((b) => {
          const chosen = b.groups.find((g) => g.name === cats[b.id]);
          const seen = new Set<string>();
          const items = [...(chosen ? chosen.items : b.groups.flatMap((g) => g.items))].sort((x, y) => Number(!!y.tool && APP_PREVIEW_IDS.has(y.tool.id)) - Number(!!x.tool && APP_PREVIEW_IDS.has(x.tool.id))).filter((i) => !seen.has(i.key) && seen.add(i.key));
          const designGroup = (g: Group) => DESIGN_CATEGORIES.find((c) => c.name === g.name)?.id ?? "";
          const seeAll = chosen
            ? b.id === DESIGNS
              ? (WEBSITE_CATEGORIES as readonly string[]).includes(designGroup(chosen)) ? "/websites" : `/cards?cat=${designGroup(chosen)}`
              : `/ai-apps?category=${encodeURIComponent(chosen.name)}`
            : b.id === DESIGNS ? "/create" : `/ai-apps?goal=${b.id}`;
          return (
            <div key={b.id}>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
                <div className="min-w-0">
                  <h3 className="font-display text-xl font-bold md:text-2xl">{b.name}</h3>
                  <p className="text-[14px] text-muted-foreground">
                    {items.length} · {chosen?.line || b.line}
                  </p>
                </div>
                <Link to={seeAll} className="shrink-0 rounded-full border-2 border-ink bg-card px-3 py-1 text-sm font-bold shadow-[2px_2px_0_0_hsl(var(--ink))] hover:bg-sun">
                  See all
                </Link>
              </div>
              {b.groups.length > 1 && (
                <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:px-0" role="group" aria-label={`${b.name} categories`}>
                  {[{ name: "", label: "All", n: new Set(b.groups.flatMap((g) => g.items.map((i) => i.key))).size }, ...b.groups.map((g) => ({ name: g.name, label: g.name, n: g.items.length }))].map((c) => {
                    const active = (cats[b.id] ?? "") === c.name;
                    return (
                      <button
                        key={c.name || "all"}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setCats((m) => ({ ...m, [b.id]: c.name }))}
                        className={cn(
                          "shrink-0 rounded-full border-2 border-ink px-3.5 py-1.5 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active ? "bg-ink text-cream" : "bg-card hover:bg-sun",
                        )}
                      >
                        {c.label} <span className="tabular-nums opacity-60">{c.n}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {/* The same cards as the rest of the site, in a slider. */}
              <GoalRail label={b.name} key={`${b.id}:${cats[b.id] ?? ""}`}>
                {items.slice(0, MAX_CARDS).map((i) => (i.tool ? <AppTile key={i.key} tool={i.tool} /> : i.design ? <ProductCard key={i.key} l={i.design} /> : null))}
              </GoalRail>
            </div>
          );
        })}
      </div>
    </div>
  );
}
