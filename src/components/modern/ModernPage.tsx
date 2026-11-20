import type { ReactNode } from "react";
import type { SectionId } from "@/components/brand/nav";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import SEOFooter from "@/components/SEOFooter";

/**
 * Page wrapper for the new catalogue pages: brand Navbar, content, and SEOFooter.
 * Uses the EZ brand theme (cream bg, ink borders, Unbounded/Hind fonts, block shadows).
 * `chrome={false}` drops the header and footer for focused pages like sign in/up.
 */
export function ModernPage({
  section,
  children,
  className,
  chrome = true,
}: {
  section?: SectionId | null;
  children: ReactNode;
  className?: string;
  chrome?: boolean;
}) {
  return (
    <div className={cn("min-h-screen bg-background text-foreground antialiased", className)}>
      {chrome && <Navbar section={section} />}
      {children}
      {chrome && <SEOFooter />}
    </div>
  );
}
