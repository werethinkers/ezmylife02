import { Link } from "react-router-dom";
import { LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bottom-right floating "talk to us" button for pages that don't otherwise carry the modern chrome. */
export function SupportFab({ className }: { className?: string }) {
  return (
    <Link
      to="/about#contact"
      aria-label="Talk to us"
      className={cn(
        "fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-foreground bg-primary text-primary-foreground shadow-block-sm transition hover:bg-pink-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className,
      )}
    >
      <LifeBuoy className="h-5 w-5" aria-hidden />
    </Link>
  );
}
