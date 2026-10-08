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
import { AppIcon } from "@/components/store/AppIcon";
import { useQuickLook } from "@/components/store/QuickLook";
import { cn } from "@/lib/utils";

/** "Try it in 3 taps": pick a task → see the real app and its price → open it. */
export function HeroPicker({ catalog }: { catalog: CatalogTool[] }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { costOf } = usePricingMap();
  const { openQuickLook } = useQuickLook();
  const tasks = QUICK_TASKS.filter((t) => catalog.some((c) => c.id === t.toolId && c.is_live));
  const [chosen, setChosen] = useState<string | null>(null);
  // Default to the first task once the catalogue has loaded.
  const picked = chosen ?? tasks[0]?.toolId ?? null;
  const setPicked = setChosen;
  const tool = catalog.find((c) => c.id === picked);
  const media = useToolMedia(tool?.id, tool?.category);

  if (!tasks.length) return null;

  const cost = tool ? costOf(tool.id) : 1;
  const go = () => {
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
    <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card p-5 shadow-xl shadow-primary/10 md:p-6">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Try it in 3 taps</p>
        <p className="mt-1 text-lg font-bold">1. What do you need done?</p>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Pick a task">
          {tasks.map((t) => (
            <button
              key={t.toolId}
              type="button"
              role="radio"
              aria-checked={picked === t.toolId}
              onClick={() => setPicked(t.toolId)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                picked === t.toolId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/70 bg-background hover:border-primary/40",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="mt-5 text-lg font-bold">2. Here's the app for it</p>
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
              className="mt-3 w-full overflow-hidden rounded-2xl border border-border/60 bg-background text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${tool.name}, quick look`}
            >
              {media.previewImageUrl && (
                <div className="aspect-[16/8] w-full overflow-hidden bg-muted">
                  <img src={media.previewImageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex items-center gap-3 p-3">
                <AppIcon toolId={tool.id} category={tool.category} name={tool.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cost === 0 ? "Free to use" : <>{cost} credit{cost === 1 ? "" : "s"} · about {formatRupees(cost * RUPEES_PER_CREDIT_MAX)} a run</>}
                  </p>
                </div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        <p className="mt-5 text-lg font-bold">3. {user ? "Open it" : "Claim free credits and open it"}</p>
        <Button size="lg" onClick={go} className="group mt-3 h-12 w-full rounded-xl text-base font-semibold">
          {user ? (
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
        {!user && <p className="mt-2 text-center text-xs text-muted-foreground">No card needed. Sign up with Google or email.</p>}
      </div>
    </div>
  );
}
