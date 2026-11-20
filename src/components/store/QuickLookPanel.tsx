import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Heart, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useToolMedia } from "@/hooks/useToolMedia";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { usePricingMap, RUPEES_PER_CREDIT_MAX, formatRupees } from "@/hooks/usePricingMap";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import { PERSONAS } from "@/data/personas";
import { AppIcon } from "./AppIcon";
import { PricePill } from "./PricePill";
import { cn } from "@/lib/utils";
import { GiveGet } from "@/components/brand/GiveGet";
import { categoryInfo, goalOf, KIND_TEXT } from "@/data/goals";
import { appGiveGetOf, appIntroOf, appKindOf } from "@/data/appKind";

/*
 * Quick Look: tap any app to see its screenshots, price and an Open button in a sheet
 * (bottom drawer you can swipe down on phones, side panel on desktop). Esc closes it.
 */


/** The Quick Look sheet itself — loaded only the first time someone opens Quick Look. */
export default function QuickLookPanel({ toolId, onClose }: { toolId: string | null; onClose: () => void }) {
  const isMobile = useIsMobile();
  const open = !!toolId;
  const onOpenChange = (v: boolean) => !v && onClose();
  return isMobile ? (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="max-h-[92dvh]">{toolId && <QuickLookBody toolId={toolId} onClose={onClose} mobile />}</DrawerContent>
    </Drawer>
  ) : (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-lg">{toolId && <QuickLookBody toolId={toolId} onClose={onClose} />}</SheetContent>
    </Sheet>
  );
}

const slugOf = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function GalleryImg({ src, alt, single }: { src: string; alt: string; single: boolean }) {
  const [err, setErr] = useState(false);
  if (err) return null;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErr(true)}
      className={cn(
        "aspect-[4/3] shrink-0 snap-start rounded-2xl border-2 border-ink bg-sand object-cover",
        single ? "w-full" : "w-[82%]",
      )}
    />
  );
}

function QuickLookBody({ toolId, onClose, mobile }: { toolId: string; onClose: () => void; mobile?: boolean }) {
  const navigate = useNavigate();
  const { data: catalog = [] } = useToolsCatalog();
  const tool = catalog.find((t) => t.id === toolId);
  const media = useToolMedia(toolId, tool?.category);
  const { costOf } = usePricingMap();
  const cost = costOf(toolId);
  const { favorites } = useFavorites();
  const { toggle, loginOpen, setLoginOpen } = useToggleFavorite();
  const isFav = favorites.has(toolId);

  const { data: shots = [] } = useQuery({
    queryKey: ["tool-media", toolId],
    queryFn: async () => {
      const { data } = await supabase
        .from("tool_media")
        .select("url, kind, alt, poster_url, sort_order")
        .eq("tool_id", toolId)
        .order("sort_order", { ascending: true });
      return (data ?? []).filter((m) => m.kind === "image" && m.url);
    },
    staleTime: 10 * 60 * 1000,
  });

  const gallery = useMemo(() => {
    const urls = [media.previewImageUrl, ...shots.map((s) => s.url)].filter(Boolean) as string[];
    return Array.from(new Set(urls)).slice(0, 6);
  }, [media.previewImageUrl, shots]);

  const personas = PERSONAS.filter((p) => p.toolIds.includes(toolId));
  const Title = mobile ? DrawerTitle : SheetTitle;
  const Desc = mobile ? DrawerDescription : SheetDescription;
  const Header = mobile ? DrawerHeader : SheetHeader;

  const openApp = () => {
    onClose();
    navigate(`/tool/${toolId}`);
  };

  if (!tool) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className={cn("flex flex-col", mobile && "overflow-y-auto")}>
      <Header className="space-y-0 p-5 pb-4 text-left sm:p-6 sm:pb-4">
        <div className="flex items-start gap-4">
          <AppIcon toolId={toolId} category={tool.category} name={tool.name} size="lg" />
          <div className="min-w-0 flex-1 pr-6">
            <Title className="font-display text-xl font-bold leading-tight">{tool.name}</Title>
            <Desc className="mt-1 text-sm text-muted-foreground">{goalOf(tool.category).name} · {tool.category}</Desc>
            <div className="mt-3">
              <PricePill toolId={toolId} size="md" />
            </div>
          </div>
        </div>
      </Header>

      {gallery.length > 0 && (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {gallery.map((url, i) => (
            <GalleryImg
              key={url}
              src={url}
              alt={`${tool.name} screenshot ${i + 1}`}
              single={gallery.length === 1}
            />
          ))}
        </div>
      )}

      <div className="space-y-5 p-5 sm:p-6">
        <section>
          <h3 className="text-sm font-bold">What it does</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{appIntroOf(toolId) ?? tool.description}</p>
        </section>

        <GiveGet {...appGiveGetOf(toolId, tool.category)} time={null} />

        <section className="border-l-[6px] border-ink pl-3">
          <p className="text-[15px] font-bold">{KIND_TEXT[appKindOf(toolId, tool.category)].title}</p>
          <p className="text-sm text-muted-foreground">{KIND_TEXT[appKindOf(toolId, tool.category)].line}</p>
        </section>

        {personas.length > 0 && (
          <section>
            <h3 className="text-sm font-bold">Good for</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {personas.map((p) => (
                <li key={p.id} className="rounded-full border-2 border-ink bg-card px-3 py-1 text-xs font-semibold">
                  {p.emoji} {p.label}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border-2 border-ink bg-sand p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-sun">
              <Zap className="h-5 w-5 text-ink" />
            </div>
            <div className="text-sm">
              <p className="font-semibold">
                {`${Math.max(1, cost)} credit${Math.max(1, cost) === 1 ? "" : "s"} each time you get a result`}
              </p>
              <p className="text-muted-foreground">
                {`About ${formatRupees(cost * RUPEES_PER_CREDIT_MAX)} with the ₹10 pack, less with bigger packs. If it fails, you are not charged.`}
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="lg" className="h-12 flex-1" onClick={openApp}>
            Open the app <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12"
            onClick={() => toggle(toolId, isFav)}
            aria-pressed={isFav}
          >
            <Heart className={cn("mr-2 h-4 w-4", isFav && "fill-rose-500 text-rose-500")} />
            {isFav ? "Saved" : "Save"}
          </Button>
        </div>
        <Link
          to={`/promo/${slugOf(tool.name)}`}
          onClick={onClose}
          className="block text-center text-sm font-bold text-primary underline decoration-2 underline-offset-4"
        >
          See how it works
        </Link>
      </div>

      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} returnTo={typeof window !== "undefined" ? window.location.pathname : "/"} />
    </div>
  );
}
