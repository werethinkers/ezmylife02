import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Shelf } from "@/components/store/Shelf";
import { AppTile } from "@/components/store/AppTile";
import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { STUDIO_TABS } from "@/data/studios";

/**
 * The big, start-to-finish apps, one tab per group. A tab with no live apps yet (for
 * example before the catalogue rows are applied) is left out, and so is the whole section.
 */
export function StudiosShelf({ apps }: { apps: CatalogTool[] }) {
  const byId = useMemo(() => new Map(apps.map((t) => [t.id, t])), [apps]);
  const tabs = useMemo(
    () =>
      STUDIO_TABS.map((t) => ({ ...t, tools: t.ids.map((id) => byId.get(id)).filter(Boolean) as CatalogTool[] })).filter((t) => t.tools.length > 0),
    [byId],
  );
  const [tabId, setTabId] = useState<string | null>(null);

  if (!tabs.length) return null;
  const tab = tabs.find((t) => t.id === tabId) ?? tabs[0];

  return (
    <div>
      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Studio groups">
        {tabs.map((t) => {
          const active = t.id === tab.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setTabId(t.id);
              }}
              className={cn(
                "shrink-0 rounded-full border-2 border-ink px-4 py-2 text-[15px] font-semibold shadow-[2px_2px_0_0_hsl(var(--ink))] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "bg-ink text-cream" : "bg-card hover:bg-sun",
              )}
            >
              {t.label} <span className={cn("text-xs font-bold", active ? "text-cream/70" : "text-muted-foreground")}>{t.tools.length}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-[15px] text-muted-foreground" aria-live="polite">
        {tab.line}
      </p>
      <Shelf key={tab.id} className="mt-3" seeAllTo="/studios">
        {tab.tools.map((t) => (
          <AppTile key={t.id} tool={t} />
        ))}
      </Shelf>
    </div>
  );
}

export default StudiosShelf;
