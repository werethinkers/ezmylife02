// @ts-nocheck
/* stand-in for the pick's own fancy button helper, which the API leaves out */
import * as React from "react";
import { cn } from "@/lib/utils";
export const FancyButton = React.forwardRef(({ className, size, ...p }, ref) => (
  <button ref={ref} className={cn("inline-flex items-center justify-center gap-2 rounded-xl bg-primary font-medium text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-[.98] [&_svg]:size-4", size === "lg" ? "h-12 px-6 text-base" : "h-10 px-4 text-sm", className)} {...p} />
));
export default FancyButton;
