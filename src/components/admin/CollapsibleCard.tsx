import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  /** Heading. May include an icon and a count, e.g. `<><Globe className="h-4 w-4" /> Geo Breakdown</>`. */
  title: ReactNode;
  /** Small line under the heading, shown whether the card is open or closed. */
  description?: ReactNode;
  /** Buttons or badges shown on the right of the header. They do not toggle the card. */
  headerExtra?: ReactNode;
  /** Closed by default so a page shows all its sections at a glance. Use `true` for a page's only section. */
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
  /** Heading size: the admin used `text-base` for most panels and the larger size for page-level ones. */
  size?: "base" | "lg";
  children: ReactNode;
}

/**
 * An admin panel that folds away. It looks like the normal Card; the header is the toggle.
 * Content stays mounted while the card is closed (only hidden), so half-filled forms, scroll
 * positions and drag state survive folding a card away and back.
 */
export function CollapsibleCard({
  title,
  description,
  headerExtra,
  defaultOpen = false,
  className,
  contentClassName,
  size = "base",
  children,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={className}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-start gap-2 pr-4">
          <h3 className="min-w-0 flex-1 font-display font-bold leading-tight tracking-tight">
            <CollapsibleTrigger
              className={cn(
                "group flex w-full items-center gap-2 rounded-2xl p-6 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                size === "lg" ? "text-xl" : "text-base",
              )}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-center gap-2">{title}</span>
                {description && (
                  <span className="font-body text-sm font-normal tracking-normal text-muted-foreground">
                    {description}
                  </span>
                )}
              </span>
              <ChevronDown
                aria-hidden="true"
                className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
              />
            </CollapsibleTrigger>
          </h3>
          {headerExtra && <div className="flex shrink-0 items-center gap-2 pt-5">{headerExtra}</div>}
        </div>
        <CollapsibleContent forceMount className="data-[state=closed]:hidden">
          <CardContent className={contentClassName}>{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default CollapsibleCard;
