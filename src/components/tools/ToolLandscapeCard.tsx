import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, Zap, PlayCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToolPricing } from "@/hooks/useToolPricing";
import { getToolIconUrl } from "@/data/toolIconMap";
import { ReactNode } from "react";

interface ToolLandscapeCardProps {
  toolId: string;
  name: string;
  description: string;
  category: string;
  isLive: boolean;
  iconUrl?: string | null;
  icon?: ReactNode;
  onPreview?: () => void;
}

// Deterministic pseudo-random per id
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
  "from-yellow-400 via-orange-400 to-pink-500",
  "from-slate-500 via-zinc-600 to-slate-700",
];

export const ToolLandscapeCard = ({
  toolId,
  name,
  description,
  category,
  isLive,
  iconUrl,
  icon,
  onPreview,
}: ToolLandscapeCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { creditCost } = useToolPricing(toolId);

  const aiIcon = iconUrl || getToolIconUrl(toolId, category);

  const { rating, reviews, version, gradients } = useMemo(() => {
    const h = hash(toolId);
    const rating = (4 + ((h % 60) / 100)).toFixed(2); // 4.00 - 4.59
    const reviews = (((h >> 3) % 90) + 10) / 10; // 1.0k - 9.9k
    const major = ((h >> 5) % 5) + 1;
    const minor = ((h >> 7) % 9) + 1;
    const grads = [
      GRADIENTS[h % GRADIENTS.length],
      GRADIENTS[(h >> 2) % GRADIENTS.length],
      GRADIENTS[(h >> 4) % GRADIENTS.length],
      GRADIENTS[(h >> 6) % GRADIENTS.length],
    ];
    return { rating, reviews: reviews.toFixed(1), version: `v${major}.${minor}`, gradients: grads };
  }, [toolId]);

  const handleStart = () => {
    if (isLive) navigate(`/tool/${toolId}`);
    else navigate(`/tool-preview/${toolId}`, { state: { name, description, isLive } });
  };

  return (
    <div className="w-full rounded-2xl bg-card/90 backdrop-blur-sm border border-border/50 p-5 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-4 mb-3">
        <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br from-background to-muted border border-border/60 flex items-center justify-center shadow-sm">
          {aiIcon ? (
            <img src={aiIcon} alt={name} className="h-12 w-12 object-contain rounded-xl" />
          ) : (
            <div className="text-primary">{icon}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-foreground truncate">{name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {version} · {category || "AI Tool"}
          </p>
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{description}</p>
          <div className="mt-2">
            {isLive ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Live
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Coming soon
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <span className="font-bold text-amber-500">{rating}</span>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={cn(
                "h-4 w-4",
                i <= Math.round(parseFloat(rating))
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              )}
            />
          ))}
        </div>
        <span className="text-muted-foreground text-xs">({reviews}k reviews)</span>
      </div>

      {/* App Preview grid */}
      <div className="mb-4">
        <p className="text-sm font-semibold mb-2">App Preview</p>
        <div className="grid grid-cols-2 gap-2">
          {gradients.map((g, idx) => (
            <button
              key={idx}
              type="button"
              onClick={onPreview}
              className={cn(
                "relative aspect-[16/10] rounded-xl bg-gradient-to-br overflow-hidden flex items-center justify-center",
                g
              )}
            >
              {idx === 0 && (
                <span className="absolute top-2 left-2 text-[10px] font-bold bg-black/70 text-white px-2 py-0.5 rounded">
                  DEMO
                </span>
              )}
              <div className="flex flex-col items-center gap-1">
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {idx === 0 ? (
                    <PlayCircle className="h-6 w-6 text-white" />
                  ) : aiIcon ? (
                    <img src={aiIcon} alt="" className="h-6 w-6 object-contain" />
                  ) : (
                    <Zap className="h-5 w-5 text-white" />
                  )}
                </div>
                <span className="text-white text-xs font-medium drop-shadow line-clamp-1 px-2">
                  {name}
                </span>
              </div>
            </button>
          ))}
        </div>
        {onPreview && (
          <button
            type="button"
            onClick={onPreview}
            className="text-sm text-primary hover:underline mt-3 block w-full text-center font-medium"
          >
            View more screenshots and video demos →
          </button>
        )}
      </div>

      {/* Credits panel */}
      <div className="mt-auto">
        <p className="text-sm font-semibold mb-2">To Start Trying</p>
        <div className="rounded-xl bg-muted/40 border border-border/40 p-3 flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground text-xs">Minimum Credit to Start:</p>
            <p className="font-bold">
              {creditCost} CREDIT{creditCost === 1 ? "" : "S"} for 1 Generation
            </p>
          </div>
        </div>

        <Button
          onClick={handleStart}
          className="w-full h-12 text-base font-bold bg-gradient-to-r from-violet-500 via-fuchsia-500 to-purple-600 hover:opacity-95 text-white border-0 shadow-md"
        >
          START USING · {creditCost} CREDIT{creditCost === 1 ? "" : "S"}
        </Button>
        {!user && (
          <p className="text-center text-xs text-muted-foreground mt-2">
            <span className="text-primary font-medium">Sign in</span> to start using
          </p>
        )}
      </div>
    </div>
  );
};

export default ToolLandscapeCard;
