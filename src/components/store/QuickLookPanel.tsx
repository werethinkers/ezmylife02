import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";
import { useToolMedia } from "@/hooks/useToolMedia";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { usePricingMap } from "@/hooks/usePricingMap";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import { PERSONAS } from "@/data/personas";
import { categoryInfo, goalOf, inCategory, KIND_TEXT } from "@/data/goals";
import { appIntroOf, appKindOf, appStepsOf } from "@/data/appKind";
import { STUDIO_IDS } from "@/data/studios";
import { OUTPUT_FORMAT } from "@/data/outputFormat";
import { formatSummary } from "@/apps/output/choice";
import { AppIcon } from "./AppIcon";
import { ShareButton } from "@/components/modern/ShareButton";
import { MetricsStrip } from "@/components/modern/MetricsStrip";
import { AboutCard } from "@/components/modern/AboutCard";
import { ToolCard } from "@/components/modern/ToolCard";
import { BTN_PRIMARY, BTN_OUTLINE, CARD, GOAL_GRADIENT } from "@/components/modern/styles";
import { cn } from "@/lib/utils";

/*
 * Quick Look: tap any app or studio to see it — a condensed version of its /promo/:slug landing
 * page in a sheet (bottom drawer you can swipe down on phones, side panel on desktop). Esc closes
 * it. Website and card designs have no Quick Look; their cards link straight to /make/:id.
 */

interface Slide {
  url: string;
  caption?: string;
}

/** Gallery image or step/related tile that falls back to a gradient card instead of a broken <img>. */
function SafeImage({ src, alt, gradient, label, className, onClick }: { src: string; alt: string; gradient: string; label?: string; className?: string; onClick?: () => void }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br p-4 text-center text-sm font-bold text-white", gradient, className)}>
        {label ?? alt}
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onClick={onClick} onError={() => setBroken(true)} className={className} />;
}

const slugOf = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function QuickLookPanel({ toolId, onClose }: { toolId: string | null; onClose: () => void }) {
  const isMobile = useIsMobile();
  const open = !!toolId;
  const onOpenChange = (v: boolean) => !v && onClose();
  return isMobile ? (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="max-h-[92dvh] bg-[#F7F6F2]">{toolId && <QuickLookBody toolId={toolId} onClose={onClose} mobile />}</DrawerContent>
    </Drawer>
  ) : (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-[#F7F6F2] p-0 sm:max-w-lg">{toolId && <QuickLookBody toolId={toolId} onClose={onClose} />}</SheetContent>
    </Sheet>
  );
}

function QuickLookBody({ toolId, onClose, mobile }: { toolId: string; onClose: () => void; mobile?: boolean }) {
  const navigate = useNavigate();
  const { data: catalog = [] } = useToolsCatalog();
  const tool = catalog.find((t) => t.id === toolId);
  const media = useToolMedia(toolId, tool?.category);
  const { costOf } = usePricingMap();
  const cost = Math.max(1, costOf(toolId)); // every app costs at least 1 credit; avoids a "0" flash while prices load
  const { favorites } = useFavorites();
  const { toggle, loginOpen, setLoginOpen } = useToggleFavorite();
  const isFav = favorites.has(toolId);
  const isStudio = STUDIO_IDS.has(toolId);
  const [idx, setIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const galleryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setIdx(0), [toolId]);

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

  const slides: Slide[] = useMemo(() => {
    const urls = [media.previewImageUrl, ...shots.map((s) => s.url)].filter(Boolean) as string[];
    return Array.from(new Set(urls)).slice(0, 6).map((url) => ({ url }));
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
    return <div className="p-8 text-center text-sm text-zinc-500">Loading…</div>;
  }

  const category = tool.category;
  const goal = goalOf(category);
  const info = categoryInfo(category);
  const kind = KIND_TEXT[appKindOf(toolId, category)];
  const intro = appIntroOf(toolId) ?? tool.description ?? "";
  const engineSteps = appStepsOf(toolId);
  const howSteps =
    engineSteps && engineSteps.length >= 3
      ? engineSteps.slice(0, 3).map((t, i) => ({ title: t, body: [`Give ${info.give}.`, "The app does the work in seconds.", `Get ${info.get}.`][i] }))
      : [
          { title: "Open the app", body: `${tool.name} opens in your browser. Nothing to install.` },
          { title: `Give ${info.give}`, body: "Type it in or upload a file. Examples are filled in for you." },
          { title: `Get ${info.get}`, body: "Check it, then copy, download or send it on WhatsApp." },
        ];
  const related = catalog.filter((t) => t.is_live && inCategory(t, category) && t.id !== toolId).slice(0, 6);
  const pageSlug = slugOf(tool.name);
  const current = slides[idx];

  return (
    <div className={cn("flex flex-col", mobile && "overflow-y-auto")}>
      <Header className="space-y-0 p-5 pb-4 text-left sm:p-6 sm:pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <AppIcon toolId={toolId} category={category} name={tool.name} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center whitespace-nowrap rounded-full border-[1.5px] border-foreground bg-primary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
                  {isStudio ? "Studio" : "Business app"}
                </span>
                <span className="text-xs font-semibold text-zinc-400">By EZYOURLIFE</span>
              </div>
              <Title className="mt-1 font-display text-xl font-bold leading-tight text-zinc-900">{tool.name}</Title>
              <Desc className="text-sm text-zinc-500">{goal.name} · {category}</Desc>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 md:gap-3 md:pr-8">
            <button
              type="button"
              onClick={() => toggle(toolId, isFav)}
              aria-pressed={isFav}
              aria-label={isFav ? "Remove from saved" : "Save for later"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50"
            >
              <Heart className={cn("h-4 w-4", isFav && "fill-rose-500 text-rose-500")} aria-hidden />
            </button>
            <ShareButton path={`/promo/${pageSlug}`} />
          </div>
        </div>

        {intro && <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">{intro}</p>}

        <MetricsStrip
          className="mt-4"
          cells={[
            { value: `${cost} credit${cost === 1 ? "" : "s"}`, label: "Pay per result" },
            { value: formatSummary(toolId) ?? OUTPUT_FORMAT[appKindOf(toolId, category)], label: "Format" },
            { value: "100 Free", label: "Starter credits", accent: true },
          ]}
        />

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row md:gap-5">
          <button type="button" onClick={openApp} className={cn(BTN_PRIMARY, "h-12 flex-1")}>
            {isStudio ? "Launch" : "Open"} {tool.name} <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
          {slides.length > 0 && (
            <button
              type="button"
              onClick={() => galleryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className={cn(BTN_OUTLINE, "h-12 px-5")}
            >
              Preview sample
            </button>
          )}
        </div>
      </Header>

      <div className="space-y-6 p-5 pt-2 sm:p-6 sm:pt-2">
        {slides.length > 0 && (
          <section ref={galleryRef} aria-label="Preview and sample outputs" className="scroll-mt-4">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100">
                <SafeImage
                  src={current.url}
                  alt={`${tool.name} — sample ${idx + 1}`}
                  gradient={GOAL_GRADIENT[goal.id]}
                  label={tool.name}
                  onClick={() => setZoomed(true)}
                  className="absolute inset-0 h-full w-full cursor-zoom-in object-cover"
                />
                {slides.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous"
                      onClick={() => setIdx((i) => (i - 1 + slides.length) % slides.length)}
                      className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Next"
                      onClick={() => setIdx((i) => (i + 1) % slides.length)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                  </>
                )}
              </div>
              {slides.length > 1 && (
                <div className="mt-2 flex items-center justify-center gap-1">
                  {slides.map((s, i) => (
                    <span key={s.url + i} className={cn("block h-1.5 rounded-full transition-all", i === idx ? "w-5 bg-orange-600" : "w-1.5 bg-zinc-300")} />
                  ))}
                </div>
              )}
            </div>
            <Dialog open={zoomed} onOpenChange={setZoomed}>
              <DialogContent className="max-w-2xl border-zinc-200 bg-white p-2">
                <SafeImage src={current.url} alt={`${tool.name} — sample ${idx + 1}`} gradient={GOAL_GRADIENT[goal.id]} label={tool.name} className="max-h-[75vh] w-full rounded-2xl object-contain" />
              </DialogContent>
            </Dialog>
          </section>
        )}

        <AboutCard
          title={`About this ${isStudio ? "studio" : "app"}`}
          giveItems={[info.give]}
          getItems={[info.get, kind.line, `${cost} credit${cost === 1 ? "" : "s"} each time it gives you a result · nothing charged if it fails`]}
          tags={[category, goal.name, isStudio ? "Guided studio" : "No install needed", ...personas.map((p) => p.label)].filter(Boolean).slice(0, 6)}
        />

        <section>
          <h3 className="font-display text-base font-bold text-zinc-900">How it works</h3>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {howSteps.map((s, i) => (
              <div key={s.title + i} className={cn("w-[78%] max-w-[260px] shrink-0 p-4", CARD)}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 font-display text-sm font-extrabold text-orange-700">{i + 1}</span>
                <h4 className="mt-2 text-sm font-bold leading-snug text-zinc-900">{s.title}</h4>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-600">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-zinc-900">More like this</h3>
              <Link to={isStudio ? "/studios" : `/ai-apps?category=${encodeURIComponent(category)}`} onClick={onClose} className="text-xs font-bold text-orange-600">
                See all →
              </Link>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {related.map((t: CatalogTool) => (
                <ToolCard key={t.id} tool={t} size="md" className="w-[62vw] max-w-[220px] shrink-0" />
              ))}
            </div>
          </section>
        )}

        <Link to={`/promo/${pageSlug}`} onClick={onClose} className="block pb-1 text-center text-sm font-bold text-orange-600 underline decoration-2 underline-offset-4">
          See the full page
        </Link>
      </div>

      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} returnTo={typeof window !== "undefined" ? window.location.pathname : "/"} />
    </div>
  );
}
