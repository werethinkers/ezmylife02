import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Cloud, HardDrive, Loader2, ShieldCheck } from "lucide-react";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { AppIcon } from "@/components/store/AppIcon";
import { CreditCostBadge } from "@/components/tools/CreditCostBadge";
import { cn } from "@/lib/utils";
import { GiveGet } from "@/components/brand/GiveGet";
import { categoryInfo } from "@/data/goals";

/**
 * The common frame for every app built on the shared engines, so all of them look and behave
 * the same: icon, name, one-line purpose, price, how it works, the app itself, related apps.
 */
export function AppShell({
  toolId,
  intro,
  steps,
  related,
  syncState,
  children,
  wide,
  priceNote,
}: {
  toolId: string;
  intro: string;
  steps?: string[];
  related?: string[];
  syncState?: "local" | "syncing" | "synced" | "error";
  children: ReactNode;
  wide?: boolean;
  priceNote?: string;
}) {
  const { data: catalog = [] } = useToolsCatalog();
  const tool = catalog.find((t) => t.id === toolId);
  const name = tool?.name ?? "App";

  return (
    <div className={cn("mx-auto w-full px-4 py-5 md:py-8", wide ? "max-w-7xl" : "max-w-6xl")}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <AppIcon toolId={toolId} category={tool?.category} name={name} size="sm" />
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{name}</h1>
            <p className="mt-1.5 max-w-2xl text-[16px] text-muted-foreground">{intro}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <CreditCostBadge toolId={toolId} />
          {priceNote && <span className="text-xs text-muted-foreground">{priceNote}</span>}
          {syncState && <SyncChip state={syncState} />}
        </div>
      </header>

      {tool?.category && <GiveGet className="mt-4 max-w-2xl" give={categoryInfo(tool.category).give} get={categoryInfo(tool.category).get} time={null} />}

      {steps && steps.length > 0 && (
        <ol className="mt-4 flex snap-x gap-2 overflow-x-auto pb-1 text-[13px] font-semibold text-ink no-scrollbar" aria-label="How to use it">
          {steps.map((s, i) => (
            <li key={s} className="flex shrink-0 snap-start items-center gap-2 rounded-full border-2 border-ink bg-card px-3 py-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-sun text-[11px] font-bold">{i + 1}</span>
              {s}
            </li>
          ))}
          <li className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1.5">
            <ShieldCheck className="h-4 w-4 text-teal" /> Credits only when it works
          </li>
        </ol>
      )}

      <div className="mt-5">{children}</div>

      {related && related.length > 0 && <RelatedApps ids={related} />}
    </div>
  );
}

function SyncChip({ state }: { state: "local" | "syncing" | "synced" | "error" }) {
  const map = {
    local: { Icon: HardDrive, text: "Saved on this device", cls: "text-muted-foreground" },
    syncing: { Icon: Loader2, text: "Saving…", cls: "text-muted-foreground" },
    synced: { Icon: Cloud, text: "Saved to your account", cls: "text-emerald-600 dark:text-emerald-400" },
    error: { Icon: HardDrive, text: "Saved on this device (sync failed)", cls: "text-amber-600" },
  } as const;
  const { Icon, text, cls } = map[state];
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px]", cls)}>
      <Icon className={cn("h-3.5 w-3.5", state === "syncing" && "animate-spin")} /> {text}
    </span>
  );
}

export function RelatedApps({ ids, title = "Works well with" }: { ids: string[]; title?: string }) {
  const { data: catalog = [] } = useToolsCatalog();
  const apps = ids.map((id) => catalog.find((t) => t.id === id && t.is_live)).filter(Boolean) as typeof catalog;
  if (!apps.length) return null;
  return (
    <section className="mt-12 border-t-2 border-ink pt-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {apps.map((t) => (
          <Link
            key={t.id}
            to={`/tool/${t.id}`}
            className="block-card block-lift group flex items-center gap-3 p-3"
          >
            <AppIcon toolId={t.id} category={t.category} name={t.name} size="sm" className="h-10 w-10" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold">{t.name}</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">{t.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
