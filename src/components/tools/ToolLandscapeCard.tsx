import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Zap, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToolPricing } from "@/hooks/useToolPricing";
import { useWallet } from "@/hooks/useWallet";
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
  icon,
  onPreview,
}: ToolLandscapeCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { creditCost, costInr } = useToolPricing(toolId);
  const { total: walletTotal } = useWallet();
  const [loginOpen, setLoginOpen] = useState(false);

  const aiIcon = iconUrl || getToolIconUrl(toolId, category);

  const { rating, reviews, version, gradients } = useMemo(() => {
    const h = hash(toolId);
    const rating = (4 + ((h % 60) / 100)).toFixed(2);
    const reviews = (((h >> 3) % 90) + 10) / 10;
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

  const requiresLogin = creditCost > 0;

  const handleStart = () => {
    // Browsing/viewing is always free. Only paid runs require login.
    if (requiresLogin && !user) {
      setLoginOpen(true);
      return;
    }
    if (isLive) navigate(`/tool/${toolId}`);
    else navigate(`/tool-preview/${toolId}`, { state: { name, description, isLive } });
  };

  const inrValue = (costInr || creditCost * 0.45).toFixed(2);

  return (
    <div className="w-full rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 p-5 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
          {aiIcon ? (
            <img src={aiIcon} alt={name} className="h-14 w-14 object-contain rounded-xl" />
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

      {/* Rating */}
      <div className="flex items-center gap-2 mb-5 text-sm">
        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
        <span className="font-bold text-foreground">{rating}</span>
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

      {/* App Preview - horizontal row of squares */}
      <div className="mb-4">
        <p className="text-base font-bold mb-3">App Preview</p>
        <div className="flex gap-2 overflow-hidden">
          {gradients.slice(0, 3).map((g, idx) => (
            <button
              key={idx}
              type="button"
              onClick={onPreview}
              className={cn(
                "relative aspect-square w-1/3 rounded-2xl bg-gradient-to-br overflow-hidden flex items-center justify-center group",
                g
              )}
            >
              <PlayCircle className="h-10 w-10 text-white/90 drop-shadow-lg group-hover:scale-110 transition-transform" />
            </button>
          ))}
        </div>
        {onPreview && (
          <button
            type="button"
            onClick={onPreview}
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
    </div>
  );
};

export default ToolLandscapeCard;
