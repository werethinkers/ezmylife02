import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { useToolMedia } from "@/hooks/useToolMedia";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { COLLECTIONS, type Collection } from "@/data/personas";
import { AppIcon } from "@/components/store/AppIcon";
import { AppRow } from "@/components/store/AppTile";
import { PricePill } from "@/components/store/PricePill";
import { useQuickLook } from "@/components/store/QuickLook";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
} as const;

/** Rotates through the editor's picks once a day (same pick for everyone on a given day). */
function pickOfTheDay(picks: CatalogTool[]): CatalogTool | undefined {
  if (!picks.length) return undefined;
  const now = new Date();
  const dayIndex = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86_400_000);
  return picks[dayIndex % picks.length];
}

export function TodaySection({
  catalog,
  editorsPicks,
  personaId,
}: {
  catalog: CatalogTool[];
  editorsPicks: CatalogTool[];
  personaId: string | null;
}) {
  const byId = useMemo(() => new Map(catalog.filter((t) => t.is_live).map((t) => [t.id, t])), [catalog]);
  const featured = pickOfTheDay(editorsPicks);
  const [openCollection, setOpenCollection] = useState<Collection | null>(null);

  const collections = useMemo(() => {
    const usable = COLLECTIONS.map((c) => ({ ...c, tools: c.toolIds.map((id) => byId.get(id)).filter(Boolean) as CatalogTool[] })).filter(
      (c) => c.tools.length >= 3,
    );
    if (!personaId) return usable;
    return [...usable.filter((c) => c.personaId === personaId), ...usable.filter((c) => c.personaId !== personaId)];
  }, [byId, personaId]);

  const bento = collections.slice(0, 4);
  const extra = collections.slice(4);

  const card = (c: (typeof collections)[number], i: number, extraClass = "") => (
    <motion.button
      key={c.id}
      layout
      type="button"
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: i * 0.05 }}
      onClick={() => setOpenCollection(c)}
      className={`group flex w-[82%] shrink-0 snap-start flex-col justify-between rounded-[1.75rem] border border-border/60 bg-card p-5 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[46%] lg:w-auto lg:min-w-0 ${extraClass}`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Collection</p>
        <h3 className="mt-2 text-lg font-bold leading-snug">
          <span aria-hidden>{c.emoji} </span>
          {c.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{c.subtitle}</p>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex -space-x-3">
          {c.tools.slice(0, 4).map((t) => (
            <AppIcon key={t.id} toolId={t.id} category={t.category} name={t.name} size="sm" className="ring-2 ring-card" />
          ))}
        </div>
        <span className="inline-flex items-center text-sm font-semibold text-primary">
          {c.tools.length} apps <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </motion.button>
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-4">
        {featured && <AppOfTheDay tool={featured} />}
        {/* Swipeable row on phones and tablets, 2×2 bento beside the feature on desktop. */}
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:col-span-2 lg:mx-0 lg:grid lg:grid-cols-2 lg:grid-rows-2 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
          {bento.map((c, i) => card(c, i))}
          {extra.map((c, i) => card(c, bento.length + i, "lg:hidden"))}
        </div>
      </div>

      {extra.map((c) => (
        <motion.button
          key={c.id}
          layout
          type="button"
          {...fadeUp}
          onClick={() => setOpenCollection(c)}
          className="group hidden w-full items-center justify-between gap-4 rounded-[1.75rem] border border-border/60 bg-card p-5 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex"
        >
          <div className="min-w-0">
            <h3 className="text-lg font-bold">
              <span aria-hidden>{c.emoji} </span>
              {c.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{c.subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="flex -space-x-3">
              {c.tools.slice(0, 5).map((t) => (
                <AppIcon key={t.id} toolId={t.id} category={t.category} name={t.name} size="sm" className="ring-2 ring-card" />
              ))}
            </div>
            <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-0.5" />
          </div>
        </motion.button>
      ))}

      <CollectionPanel collection={openCollection} byId={byId} onClose={() => setOpenCollection(null)} />
    </div>
  );
}

function AppOfTheDay({ tool }: { tool: CatalogTool }) {
  const media = useToolMedia(tool.id, tool.category);
  const { openQuickLook } = useQuickLook();
  return (
    <motion.div
      {...fadeUp}
      role="button"
      tabIndex={0}
      onClick={() => openQuickLook(tool.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openQuickLook(tool.id);
        }
      }}
      aria-label={`App of the day: ${tool.name}`}
      className="group relative min-h-[420px] cursor-pointer overflow-hidden rounded-[1.75rem] bg-gradient-hero text-white shadow-xl shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:col-span-2"
    >
      {media.previewImageUrl && (
        <img
          src={media.previewImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-700 motion-safe:group-hover:scale-[1.03]"
        />
      )}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
      <div className="relative flex h-full min-h-[420px] flex-col justify-between p-6 md:p-8">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          App of the day
        </span>
        <div>
          <h3 className="max-w-lg font-display text-3xl font-bold leading-tight md:text-5xl">{tool.name}</h3>
          <p className="mt-3 line-clamp-3 max-w-lg text-base text-white/90 md:text-lg">{tool.description}</p>
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur-md">
            <AppIcon toolId={tool.id} category={tool.category} name={tool.name} size="sm" className="ring-1 ring-white/30" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{tool.name}</p>
              <p className="truncate text-xs text-white/80">{tool.category}</p>
            </div>
            <PricePill toolId={tool.id} size="md" className="bg-white text-primary hover:bg-white/90" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CollectionPanel({
  collection,
  byId,
  onClose,
}: {
  collection: Collection | null;
  byId: Map<string, CatalogTool>;
  onClose: () => void;
}) {
  const isMobile = useIsMobile();
  const tools = (collection?.toolIds ?? []).map((id) => byId.get(id)).filter(Boolean) as CatalogTool[];
  const body = collection && (
    // Opening an app from the list closes this panel so only one sheet is ever on screen.
    <div className="space-y-1 px-3 pb-6 sm:px-4" onClickCapture={onClose}>
      {tools.map((t) => (
        <AppRow key={t.id} tool={t} />
      ))}
    </div>
  );
  if (isMobile) {
    return (
      <Drawer open={!!collection} onOpenChange={(v) => !v && onClose()} shouldScaleBackground={false}>
        <DrawerContent className="max-h-[88vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl">
              {collection?.emoji} {collection?.title}
            </DrawerTitle>
            <DrawerDescription>{collection?.subtitle}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Sheet open={!!collection} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="text-xl">
            {collection?.emoji} {collection?.title}
          </SheetTitle>
          <SheetDescription>{collection?.subtitle}</SheetDescription>
        </SheetHeader>
        {body}
      </SheetContent>
    </Sheet>
  );
}
