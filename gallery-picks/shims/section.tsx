/* Stand-in for the "Section" / "SectionHeader" helpers some block picks import but don't ship. */
import * as React from "react";
import { cn } from "@/lib/utils";
export function Section({ className, children, ...p }: React.HTMLAttributes<HTMLElement>) {
  return <section {...p} className={cn("w-full px-6 py-16 sm:py-24", className)}><div className="mx-auto w-full max-w-6xl">{children}</div></section>;
}
export function SectionHeader({ eyebrow, title, description, align = "center" }: { eyebrow?: string; title: React.ReactNode; description?: React.ReactNode; align?: "left" | "center" }) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-muted-foreground">{description}</p>}
    </div>
  );
}
export default Section;
