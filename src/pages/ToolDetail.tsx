import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Sparkles, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { useToolPricing } from "@/hooks/useToolPricing";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { getToolIconUrl } from "@/data/toolIconMap";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import BuyCreditsDialog from "@/components/wallet/BuyCreditsDialog";
import { ToolGallery, ToolMediaItem } from "@/components/tools/ToolGallery";

const ToolDetail = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { total: walletTotal } = useWallet();
  const { creditCost, costInr, isLoading: pricingLoading } = useToolPricing(toolId);
  const { data: catalog = [] } = useToolsCatalog();
  const tool = catalog.find((t) => t.id === toolId);

  const [media, setMedia] = useState<ToolMediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);

  useEffect(() => {
    if (!toolId) return;
    let cancel = false;
    (async () => {
      setMediaLoading(true);
      const { data } = await supabase
        .from("tool_media")
        .select("id, kind, url, alt, poster_url, sort_order")
        .eq("tool_id", toolId)
        .order("sort_order");
      if (!cancel) {
        setMedia(((data as any[]) || []).filter((m) => m.kind !== "icon"));
        setMediaLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [toolId]);

  const iconUrl = useMemo(() => {
    return tool?.icon_url || (toolId ? getToolIconUrl(toolId, tool?.category || "") : null);
  }, [tool, toolId]);

  const isFree = !!tool?.is_free || creditCost === 0;
  const insufficient = !!user && !isFree && walletTotal < creditCost;

  const handleStart = () => {
    if (!user) { setLoginOpen(true); return; }
    if (insufficient) { setBuyOpen(true); return; }
    navigate(`/tool/${toolId}/use`);
  };

  if (!toolId) return null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${tool?.name || "Tool"} — EZYOURLIFE`}
        description={tool?.description || "AI tool on EZYOURLIFE."}
        path={`/tool/${toolId}`}
      />
      <Navbar />

      {/* Glow background */}
      <div className="absolute inset-x-0 top-16 h-96 bg-gradient-to-b from-primary/10 via-accent/5 to-transparent pointer-events-none" />

      <main className="container mx-auto px-4 py-6 relative">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-3xl mx-auto"
        >
          {/* Header: icon + title */}
          <div className="flex items-start gap-4 sm:gap-6 mb-8">
            <div className="relative shrink-0">
              <div className="absolute -inset-2 bg-gradient-to-br from-primary/30 to-accent/30 rounded-3xl blur-xl opacity-60" />
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl border border-primary/30 bg-gradient-to-br from-card to-muted flex items-center justify-center overflow-hidden shadow-2xl shadow-primary/20">
                {iconUrl ? (
                  <img src={iconUrl} alt={tool?.name || ""} className="h-full w-full object-cover" />
                ) : (
                  <Sparkles className="h-12 w-12 text-primary" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl sm:text-4xl font-bold leading-tight tracking-tight mb-2">
                {tool?.name || toolId}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 flex-wrap">
                <span>{tool?.category || "AI Tool"}</span>
                {tool?.is_live ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Live
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1">
                    <Clock className="h-3 w-3" /> Coming soon
                  </Badge>
                )}
                {isFree && (
                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">FREE</Badge>
                )}
              </div>
              <p className="text-base text-muted-foreground leading-relaxed line-clamp-3">
                {tool?.description}
              </p>
            </div>
          </div>

          {/* Gallery */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold mb-4">App Preview</h2>
            {mediaLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading previews…
              </div>
            ) : (
              <ToolGallery items={media} />
            )}
          </section>

          {/* To Start Using */}
          <section className="mb-6">
            <h2 className="font-display text-xl font-semibold mb-4">To Start Using</h2>
            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Credits per run
                </p>
                <p className="text-lg font-bold text-foreground">
                  {pricingLoading ? "…" : isFree ? "FREE" : `${creditCost} CREDITS`}
                </p>
                {!isFree && costInr > 0 && (
                  <p className="text-xs text-muted-foreground">Approx. ₹{costInr.toFixed(2)} value</p>
                )}
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="sticky bottom-4 z-20">
            <Button
              size="lg"
              onClick={handleStart}
              disabled={!tool?.is_live}
              className="w-full h-14 text-base font-semibold rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-95 hover:shadow-2xl hover:shadow-primary/40 transition-all"
            >
              {!tool?.is_live ? (
                "Coming Soon"
              ) : (
                <span className="flex items-center gap-2">
                  START USING {!isFree && <>· {creditCost} CREDITS</>}
                </span>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              {user ? (
                <>You have <span className="font-semibold text-foreground">{walletTotal}</span> credits · <Link to="/credits" className="text-primary underline">Buy more</Link></>
              ) : (
                <>New users get free credits to try every tool · <Link to="/auth?mode=signup" className="text-primary underline">Sign up</Link></>
              )}
            </p>
          </div>
        </motion.div>
      </main>

      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} returnTo={`/tool/${toolId}/use`} />
      <BuyCreditsDialog open={buyOpen} onOpenChange={setBuyOpen} required={creditCost} balance={walletTotal} />
    </div>
  );
};

export default ToolDetail;
