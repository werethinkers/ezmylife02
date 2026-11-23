import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Small round button that copies this page's own link to the clipboard. `path` is the address to
 * copy (e.g. `/promo/sketchflow-ai`) — the origin is added at click time, never stored or sent anywhere.
 */
export function ShareButton({ path, className, label = "Copy link to this page" }: { path: string; className?: string; label?: string }) {
  const onClick = async () => {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard unavailable (older browser or no permission) — the toast below still fires */
    }
    toast.success("Link copied");
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
        className,
      )}
    >
      <Share2 className="h-4 w-4" aria-hidden />
    </button>
  );
}
