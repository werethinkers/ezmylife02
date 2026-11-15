import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { categoriesOf } from "@/data/goals";
import { creditsLabel } from "../useDesignData";

const IDEAS = ["invoice", "passport photo", "salary", "remove background", "contract"];

/** The shopkeeper's counter: a greeting and one search box. Results list under it. */
export function ShopkeeperSearch({ live, costOf }: { live: CatalogTool[]; costOf: (id: string) => number }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!query) return [];
    const rank = (t: CatalogTool) => (t.name.toLowerCase().startsWith(query) ? 0 : t.name.toLowerCase().includes(query) ? 1 : 2);
    return live
      .filter((t) => `${t.name} ${t.description} ${categoriesOf(t).join(" ")}`.toLowerCase().includes(query))
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, 6);
  }, [live, query]);

  return (
    <div className="block-card bg-card p-4 md:p-5">
      <p className="font-display text-[17px] font-bold">Namaste! What do you want done today?</p>
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="mt-3 flex items-center gap-2 rounded-xl border-2 border-ink bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring"
      >
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try: GST bill, passport photo…"
          aria-label="Search the apps"
          className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground"
        />
      </form>
      {results.length > 0 ? (
        <ul className="mt-3 divide-y-2 divide-ink/10 rounded-xl border-2 border-ink bg-background">
          {results.map((t) => (
            <li key={t.id}>
              <Link to={`/promo/${t.id}`} className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-secondary">
                <span className="min-w-0 truncate font-semibold">{t.name}</span>
                <span className="shrink-0 text-[13px] text-muted-foreground">{creditsLabel(costOf(t.id))}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : query ? (
        <p className="mt-3 text-[14px] text-muted-foreground">Nothing found for “{q}”. Try a simpler word.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {IDEAS.map((i) => (
            <button key={i} type="button" onClick={() => setQ(i)} className="rounded-full border-2 border-ink bg-card px-3 py-1 text-[13px] font-semibold hover:bg-secondary">
              {i}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
