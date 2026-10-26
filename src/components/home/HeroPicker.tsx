import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { useToolMedia } from "@/hooks/useToolMedia";
import { usePricingMap, RUPEES_PER_CREDIT_MAX, formatRupees } from "@/hooks/usePricingMap";
import { QUICK_TASKS } from "@/data/personas";
import { designPreviewUrl } from "@/data/previewManifest";
import { AppIcon } from "@/components/store/AppIcon";
import { useQuickLook } from "@/components/store/QuickLook";
import { cn } from "@/lib/utils";

/** "Try it in 3 taps": pick a task → see the real app and its price → open it. */
export function HeroPicker({ catalog }: { catalog: CatalogTool[] }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { costOf } = usePricingMap();
  const { openQuickLook } = useQuickLook();
  const tasks = QUICK_TASKS.filter((t) => (t.design ? designPreviewUrl(t.toolId) !== null : catalog.some((c) => c.id === t.toolId && c.is_live)));
  const [chosen, setChosen] = useState<string | null>(null);
  // Default to the first task once the catalogue has loaded.
  const picked = chosen ?? tasks[0]?.toolId ?? null;
  const setPicked = setChosen;
  const task = tasks.find((t) => t.toolId === picked);
  const design = task?.design ?? null;
  const tool = design ? undefined : catalog.find((c) => c.id === picked);
  const media = useToolMedia(tool?.id, tool?.category);

  if (!tasks.length) return null;

  const cost = tool ? costOf(tool.id) : 1;
  const go = () => {
    if (design && task) {
      navigate(`/make/${task.toolId}`);
      return;
    }
    if (!tool) return;
    if (user) {
      navigate(`/tool/${tool.id}`);
      return;
    }
    try {
      localStorage.setItem("auth_redirect_to", `/tool/${tool.id}`);
    } catch {
      /* storage unavailable */
    }
    navigate("/auth?mode=signup");
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-ink bg-card p-5 shadow-block-lg md:p-6">
      <div className="relative">
        <p className="inline-flex rounded-full border-2 border-ink bg-sun px-2.5 py-0.5 text-xs font-bold">Try it in 3 taps</p>
        <p className="mt-3 text-lg font-bold">1. What do you need done?</p>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Pick a task">
          {tasks.map((t) => (
            <button
              key={t.toolId}
              type="button"
              role="radio"
              aria-checked={picked === t.toolId}
              onClick={() => setPicked(t.toolId)}
              className={cn(
                "rounded-full border-2 border-ink px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                picked === t.toolId ? "bg-ink text-cream" : "bg-card hover:bg-sun",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="mt-5 text-lg font-bold">2. Here's the app for it</p>
        {design && task && (
          <button
            type="button"
            onClick={() => navigate(`/make/${task.toolId}`)}
            className="mt-3 w-full overflow-hidden rounded-2xl border-2 border-ink bg-background text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${design.name}: see the design`}
          >
            <div className="flex aspect-[16/8] w-full items-end justify-center overflow-hidden border-b-2 border-ink bg-sand">
              <img src={designPreviewUrl(task.toolId) ?? ""} alt="" className="h-full w-auto max-w-full object-cover object-top" />
            </div>
            <div className="p-3">
              <p className="truncate font-bold">{design.name}</p>
              <p className="text-xs text-muted-foreground">A ready design. Add your details and share one link.</p>
            </div>
          </button>
        )}
        <AnimatePresence mode="wait">
          {tool && (
            <motion.button
              key={tool.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              onClick={() => openQuickLook(tool.id)}
              className="mt-3 w-full overflow-hidden rounded-2xl border-2 border-ink bg-background text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${tool.name}, quick look`}
            >
              {media.previewImageUrl && (
                <div className="aspect-[16/8] w-full overflow-hidden border-b-2 border-ink bg-sand">
                  <img src={media.previewImageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex items-center gap-3 p-3">
                <AppIcon toolId={tool.id} category={tool.category} name={tool.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cost === 0 ? "Free to use" : <>{cost} credit{cost === 1 ? "" : "s"} each time · about {formatRupees(cost * RUPEES_PER_CREDIT_MAX)}</>}
                  </p>
                </div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        <p className="mt-5 text-lg font-bold">3. {design ? "Open it" : user ? "Open it" : "Claim free credits and open it"}</p>
        <Button size="lg" onClick={go} className="group mt-3 h-12 w-full text-base">
          {design ? (
            <>
              See this design
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          ) : user ? (
            <>
              Open {tool?.name ?? "app"}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          ) : (
            <>
              <Gift className="mr-2 h-4 w-4" /> Get 100 free credits
            </>
          )}
        </Button>
        {!user && !design && <p className="mt-2 text-center text-xs text-muted-foreground">No card needed. Sign up with Google or email.</p>}
      </div>
    </div>
  );
}
