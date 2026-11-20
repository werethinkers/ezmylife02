import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToolMedia } from "@/hooks/useToolMedia";
import { goalOf } from "@/data/goals";

const SIZES = {
  sm: "h-12 w-12 text-sm",
  md: "h-16 w-16 text-lg",
  lg: "h-20 w-20 text-xl",
  xl: "h-24 w-24 text-2xl md:h-28 md:w-28",
} as const;

const initials = (name: string) =>
  name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "AI";

/** App icon: the app's own artwork on white, or its initials on the colour of its goal. */
export function AppIcon({
  toolId,
  category,
  name,
  size = "md",
  className,
}: {
  toolId: string;
  category?: string;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const media = useToolMedia(toolId, category);
  const goal = goalOf(category);
  const [failed, setFailed] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  const iconUrl = media.iconUrl && media.iconUrl !== failed ? media.iconUrl : null;
  const showing = !!iconUrl && loaded === iconUrl;
  // Initials show at once; the picture fades in over them only after it has really loaded.
  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-xl border-2 border-ink", SIZES[size], className)}
      style={{ background: showing ? "hsl(var(--card))" : goal.color }}
    >
      <div className="flex h-full w-full items-center justify-center font-display font-extrabold text-ink" aria-hidden>
        {initials(name)}
      </div>
      {iconUrl && (
        <img
          src={iconUrl}
          alt=""
          loading="lazy"
          onLoad={() => setLoaded(iconUrl)}
          onError={() => setFailed(iconUrl)}
          className={cn(
            "absolute inset-0 h-full w-full bg-card transition-opacity duration-200",
            media.iconFit === "contain" ? "object-contain p-1.5" : "object-cover",
            showing ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      <span className="sr-only">{name}</span>
    </div>
  );
}
