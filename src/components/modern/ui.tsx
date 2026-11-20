import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BTN_PRIMARY, EYEBROW } from "./styles";

/** Eyebrow, title, one plain line, and an optional action on the right (the prototype's section heads). */
export function SectionHead({
  eyebrow,
  title,
  line,
  action,
  id,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  line?: ReactNode;
  action?: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end", className)}>
      <div className="min-w-0">
        {eyebrow && <span className={EYEBROW}>{eyebrow}</span>}
        <h2 id={id} className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>
        {line && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{line}</p>}
      </div>
      {action}
    </div>
  );
}

/** Top of a catalogue page: eyebrow, the page's one h1, a line, and a control on the right (search or tabs). */
export function PageHeader({
  eyebrow,
  title,
  line,
  aside,
  asideClassName,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  line?: ReactNode;
  aside?: ReactNode;
  /** Width of the right-hand control; a search box by default (md:w-80). */
  asideClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div className="min-w-0">
        {eyebrow && <span className={EYEBROW}>{eyebrow}</span>}
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {line && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{line}</p>}
        {children}
      </div>
      {aside && <div className={cn("w-full shrink-0 md:w-80", asideClassName)}>{aside}</div>}
    </div>
  );
}

/** Dashed box shown when a search or filter finds nothing. */
export function EmptyState({ message, action, onAction }: { message: ReactNode; action?: string; onAction?: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/30 py-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && onAction && (
        <button type="button" onClick={onAction} className={cn(BTN_PRIMARY, "mt-3 px-4 py-1.5 text-xs")}>
          {action}
        </button>
      )}
    </div>
  );
}

/** The dark strip with a chip, a big line and buttons (the prototype's credits strip). */
export function CtaBand({ chip, title, line, children, className }: { chip?: string; title: ReactNode; line?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-start justify-between gap-6 rounded-2xl border-2 border-ink bg-ink p-8 text-cream shadow-block sm:p-10 md:flex-row md:items-center",
        className,
      )}
    >
      <div className="max-w-xl space-y-2">
        {chip && <span className="inline-block rounded-full border border-cream/30 bg-sun px-2.5 py-0.5 text-[11px] font-bold uppercase text-ink">{chip}</span>}
        <h2 className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
        {line && <p className="text-sm text-cream/70">{line}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-3">{children}</div>}
    </div>
  );
}

/** Grey placeholder the size of a showcase card, while its data loads. */
export function CardSkeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("min-h-[240px] animate-pulse rounded-2xl border-2 border-ink/20 bg-sand", className)} />;
}
