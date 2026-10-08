import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToolMedia } from "@/hooks/useToolMedia";

const SIZES = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-20 w-20",
  xl: "h-24 w-24 md:h-28 md:w-28",
} as const;

/** iOS-style "squircle" app icon with a soft inner highlight. */
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
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[24%] bg-gradient-to-br from-primary/20 to-accent/20 shadow-sm",
        SIZES[size],
        className,
      )}
    >
      {media.iconUrl ? (
        <img
          src={media.iconUrl}
          alt=""
          loading="lazy"
          className={cn("h-full w-full", media.iconFit === "contain" ? "object-contain p-2" : "object-cover")}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-primary" aria-hidden>
          <Sparkles className="h-1/2 w-1/2" />
        </div>
      )}
      <span className="pointer-events-none absolute inset-0 rounded-[24%] ring-1 ring-inset ring-black/5 dark:ring-white/10" aria-hidden />
      <span className="sr-only">{name}</span>
    </div>
  );
}
