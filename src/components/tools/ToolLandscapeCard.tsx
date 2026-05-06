import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, PlayCircle, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToolPricing } from "@/hooks/useToolPricing";
import { useWallet } from "@/hooks/useWallet";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { getToolIconUrl } from "@/data/toolIconMap";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import { ReactNode } from "react";

interface ToolLandscapeCardProps {
  toolId: string;
  name: string;
  description: string;
  category: string;
  isLive: boolean;
  iconUrl?: string | null;
  previewImageUrl?: string | null;
  previewImageFit?: "cover" | "contain";
  iconFit?: "cover" | "contain";
  rating?: number | null;
  reviewCount?: number | null;
  icon?: ReactNode;
  onPreview?: () => void;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const GRADIENTS = [
  "from-violet-500 via-purple-500 to-indigo-600",
  "from-orange-400 via-pink-500 to-rose-500",
  "from-amber-400 via-orange-500 to-red-500",
  "from-pink-400 via-fuchsia-500 to-purple-600",
  "from-cyan-400 via-blue-500 to-indigo-600",
  "from-emerald-400 via-teal-500 to-cyan-600",
];

export const ToolLandscapeCard = ({
  toolId,
  name,
  description,
  category,
  isLive,
  iconUrl,
  previewImageUrl,
  previewImageFit = "cover",
  iconFit = "cover",
  rating: ratingProp,
  reviewCount: reviewCountProp,
  icon,
  onPreview,
}: ToolLandscapeCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { creditCost, costInr } = useToolPricing(toolId);
  const { total: walletTotal } = useWallet();
  const [loginOpen, setLoginOpen] = useState(false);
  const { favorites } = useFavorites();
  const { toggle: toggleFav, loginOpen: favLoginOpen, setLoginOpen: setFavLoginOpen } = useToggleFavorite();
  const isFav = favorites.has(toolId);

  const aiIcon = iconUrl || getToolIconUrl(toolId, category);

  const { rating, reviews, version } = useMemo(() => {
    const h = hash(toolId);
    const fallbackRating = (4 + ((h % 60) / 100));
    const fallbackReviews = (((h >> 3) % 90) + 10) * 100; // ~1000-9900
    const major = ((h >> 5) % 5) + 1;
    const minor = ((h >> 7) % 9) + 1;
    const r = ratingProp ?? fallbackRating;
    const rc = reviewCountProp ?? fallbackReviews;
    const reviewsLabel = rc >= 1000 ? `${(rc / 1000).toFixed(1)}k` : `${rc}`;
    return {
      rating: r.toFixed(2),
      reviews: reviewsLabel,
      version: `v${major}.${minor}`,
    };
  }, [toolId, ratingProp, reviewCountProp]);

  const handleStart = () => {
    // Always let users enter the tool — login is requested at generate-time.
    if (isLive) navigate(`/tool/${toolId}`);
    else navigate(`/tool-preview/${toolId}`, { state: { name, description, isLive } });
  };

  const inrValue = (costInr || creditCost * 0.45).toFixed(2);

  return (
    <div
      onClick={handleStart}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleStart(); } }}
      className="relative w-full rounded-3xl bg-card/90 backdrop-blur-sm border-2 border-border/60 p-5 shadow-[0_10px_30px_-12px_hsl(var(--primary)/0.35),0_2px_6px_-2px_hsl(var(--foreground)/0.08)] hover:shadow-[0_20px_50px_-12px_hsl(var(--primary)/0.5),0_4px_12px_-2px_hsl(var(--foreground)/0.12)] hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Favourite */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); toggleFav(toolId, isFav); }}
        aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
        className={cn(
          "absolute top-3 right-3 z-10 h-9 w-9 rounded-full flex items-center justify-center border transition-all",
          isFav
            ? "bg-rose-500/15 border-rose-500/40 text-rose-500"
            : "bg-background/80 border-border/60 text-muted-foreground hover:text-rose-500 hover:border-rose-500/40"
        )}
      >
        <Heart className={cn("h-4 w-4", isFav && "fill-rose-500")} />
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-4 pr-10">
        <div className="flex-shrink-0 h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10 overflow-hidden">
          {aiIcon ? (
            <img src={aiIcon} alt={name} className={cn("h-full w-full rounded-xl", iconFit === "contain" ? "object-contain p-2" : "object-cover")} />
          ) : (
            <div className="text-primary">{icon}</div>
          )}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="text-2xl font-bold text-foreground leading-tight truncate">{name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {version} · {category || "AI App"}
          </p>
        </div>
      </div>

      <p className="text-sm text-foreground/80 mb-3 line-clamp-2 leading-snug">{description}</p>

      {/* App Preview - single big image */}
      <div className="mb-4">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPreview?.(); }}
          className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden flex items-center justify-center group bg-gradient-to-br from-violet-500 via-fuchsia-500 to-purple-600"
        >
          {previewImageUrl ? (
            previewImageFit === "contain" ? (
              <>
                <img src={previewImageUrl} aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-purple-600/30" />
                <img
                  src={previewImageUrl}
                  alt={`${name} preview`}
                  className="relative z-10 max-w-[92%] max-h-[92%] object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-500 rounded-xl"
                  loading="lazy"
                />
              </>
            ) : (
              <img
                src={previewImageUrl}
                alt={`${name} preview`}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            )
          ) : (
            <PlayCircle className="h-20 w-20 text-white/90 drop-shadow-lg group-hover:scale-110 transition-transform" />
          )}
        </button>
        {onPreview && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
            className="text-sm text-cyan-500 hover:text-cyan-400 hover:underline mt-3 block w-full text-center font-medium"
          >
            View more screenshots and video demos →
          </button>
        )}
      </div>

      {/* Credits panel */}
      <div className="mt-auto">
        <p className="text-base font-bold mb-2">To Start Trying</p>
        <div className="rounded-2xl bg-muted/50 border border-border/40 p-4 flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-background/60 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-foreground" />
          </div>
          <div className="text-sm leading-tight">
            <p className="text-muted-foreground text-xs">Minimum Credit to Start:</p>
            <p className="font-bold text-base">
              {creditCost} CREDIT{creditCost === 1 ? "" : "S"} for 1 Generation
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">(Approx. ₹{inrValue} value)</p>
          </div>
        </div>

        <Button
          onClick={handleStart}
          className="w-full h-14 text-base font-bold bg-gradient-to-r from-violet-500 via-fuchsia-500 to-purple-600 hover:opacity-95 text-white border-0 shadow-lg rounded-full"
        >
          START USING · {creditCost} CREDIT{creditCost === 1 ? "" : "S"}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-3">
          {user ? (
            <>
              You have <span className="font-semibold text-foreground">{walletTotal.toLocaleString()}</span> credits ·{" "}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/credits");
                }}
                className="text-cyan-500 hover:underline font-medium"
              >
                Buy more
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLoginOpen(true);
                }}
                className="text-cyan-500 hover:underline font-medium"
              >
                Sign in
              </button>{" "}
              when you're ready to run
            </>
          )}
        </p>
      </div>

      <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} returnTo={`/tool/${toolId}`} />
      <LoginPromptDialog open={favLoginOpen} onOpenChange={setFavLoginOpen} />
    </div>
  );
};

export default ToolLandscapeCard;
