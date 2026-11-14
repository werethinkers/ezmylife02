/*
 * 3D Animated Tilt & Dynamic Glow Card
 * Author: @themeocean   Source: https://21st.dev/@themeocean/components/3d-animated-tilt-dynamic-glow-card   21st.dev id: 44838
 * Licence: covered by the paid 21st.dev plan Ezyourlife bought on 14 Nov 2026 (the API returns no
 * per-component licence text, so the author's own terms were not checked line by line).
 * Kept as published; only this header was added.
 */
// @ts-nocheck
/* eslint-disable */
// This is file of your component
// You can use any dependencies from npm; we import them automatically in package.json

import { forwardRef, useCallback, useEffect, useId, useRef, useState } from "react";
import type {
  CSSProperties,
  ElementType,
  FocusEvent,
  HTMLAttributes,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";

/* ==========================================================================
   Types
   ========================================================================== */

export interface TiltGlowCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Main heading of the card. */
  title?: ReactNode;
  /** Short line under the heading. */
  subtitle?: ReactNode;
  /** Icon shown in a small tile above the heading. */
  icon?: ReactNode;
  /** Small pill shown next to the icon, for example "Most popular". */
  badge?: ReactNode;
  /** Pinned to the bottom of the card, under a thin divider. */
  footer?: ReactNode;
  /** The main content of the card. */
  children?: ReactNode;

  /** Which element to render. "article" is the default. */
  as?: "article" | "section" | "div" | "aside";
  /** Heading level for the title, 2 to 4. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** "stack" puts the content under the heading. "split" puts them side by side on medium screens and up. */
  layout?: "stack" | "split";
  /** Inner spacing. */
  padding?: "sm" | "md" | "lg";
  /** Extra classes for the content area. `className` goes on the outer wrapper, so grid and width classes just work. */
  contentClassName?: string;

  /** The most the card leans, in degrees. Default 8. */
  maxTilt?: number;
  /** Camera distance in pixels. Lower is more dramatic. Default 1000. */
  perspective?: number;
  /** How much the card grows while the mouse is on it. Default 1.02. */
  scale?: number;
  /** Width of the glow that follows the cursor, in pixels. Default 360. */
  glowSize?: number;
  /** Any CSS color. Defaults to the theme's primary color. */
  glowColor?: string;
  /** Optional second color mixed into the glow. */
  accentColor?: string;
  disableTilt?: boolean;
  disableGlow?: boolean;
}

// end of types


/* ==========================================================================
   Constants and helpers
   ========================================================================== */

const PADDING: Record<NonNullable<TiltGlowCardProps["padding"]>, string> = {
  sm: "p-5",
  md: "p-6 sm:p-8",
  lg: "p-8 sm:p-10",
};

// How quickly the card and the glow catch up with the mouse. Lower is smoother, higher is snappier.
const TILT_EASING = 0.14;
const GLOW_EASING = 0.22;

// Join class names, skipping anything falsy
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// Makes any CSS color partly see-through
const mix = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduce(e.matches);
    setReduce(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduce;
}

// end of constants and helpers


/* ==========================================================================
   TiltGlowCard
   ========================================================================== */

export const TiltGlowCard = forwardRef<HTMLElement, TiltGlowCardProps>(function TiltGlowCard(
  {
    title,
    subtitle,
    icon,
    badge,
    footer,
    children,
    as = "article",
    headingLevel = 3,
    layout = "stack",
    padding = "md",
    className,
    contentClassName,
    maxTilt = 8,
    perspective = 1000,
    scale = 1.02,
    glowSize = 360,
    glowColor = "hsl(var(--primary))",
    accentColor,
    disableTilt = false,
    disableGlow = false,
    style,
    onFocus,
    onBlur,
    ...rest
  },
  forwardedRef
) {
  // ---- State: only changes when the pointer enters or leaves, never while it moves ----
  const [active, setActive] = useState(false);
  const [focused, setFocused] = useState(false);
  // end of state

  // ---- Refs ----
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const reduceMotion = usePrefersReducedMotion();
  const reduceRef = useRef(reduceMotion);

  // Everything that changes on every mouse move lives here, outside React
  const motion = useRef({
    rx: 0, ry: 0, scale: 1, mx: 0, my: 0,
    targetRx: 0, targetRy: 0, targetScale: 1, targetMx: 0, targetMy: 0,
    hover: false,
    frame: 0,
  });
  // end of refs

  useEffect(() => {
    reduceRef.current = reduceMotion;
  }, [reduceMotion]);

  // Lets the parent get at the card element too
  const setCardRef = useCallback(
    (node: HTMLElement | null) => {
      cardRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef]
  );

  // ---- Animation loop ----
  // Each frame the card moves a fraction of the way to where the mouse says it should be.
  // The numbers go straight into CSS variables, so React never re-renders while you move the mouse.
  const tick = useCallback(() => {
    const card = cardRef.current;
    const m = motion.current;
    if (!card) {
      m.frame = 0;
      return;
    }

    const snap = reduceRef.current; // reduced motion: no easing, the glow just follows
    const tiltK = snap ? 1 : TILT_EASING;
    const glowK = snap ? 1 : GLOW_EASING;

    m.rx += (m.targetRx - m.rx) * tiltK;
    m.ry += (m.targetRy - m.ry) * tiltK;
    m.scale += (m.targetScale - m.scale) * tiltK;
    m.mx += (m.targetMx - m.mx) * glowK;
    m.my += (m.targetMy - m.my) * glowK;

    card.style.setProperty("--rx", m.rx.toFixed(3));
    card.style.setProperty("--ry", m.ry.toFixed(3));
    card.style.setProperty("--s", m.scale.toFixed(4));
    card.style.setProperty("--mx", m.mx.toFixed(2));
    card.style.setProperty("--my", m.my.toFixed(2));

    const settled =
      Math.abs(m.targetRx - m.rx) < 0.01 &&
      Math.abs(m.targetRy - m.ry) < 0.01 &&
      Math.abs(m.targetScale - m.scale) < 0.0005 &&
      Math.abs(m.targetMx - m.mx) < 0.1 &&
      Math.abs(m.targetMy - m.my) < 0.1;

    // Keep going while the mouse is on the card, or until everything has settled
    m.frame = settled && !m.hover ? 0 : requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    if (!motion.current.frame) motion.current.frame = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    const m = motion.current;
    return () => cancelAnimationFrame(m.frame);
  }, []);
  // end of animation loop

  // ---- Pointer handlers ----
  // The wrapper never tilts, so measuring it gives steady numbers even while the card is leaning.
  const canTilt = (e: ReactPointerEvent<HTMLDivElement>) => !disableTilt && !reduceRef.current && e.pointerType !== "touch";

  const aim = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    const m = motion.current;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    m.targetMx = x;
    m.targetMy = y;

    if (canTilt(e)) {
      m.targetRy = (x / rect.width - 0.5) * 2 * maxTilt;
      m.targetRx = -(y / rect.height - 0.5) * 2 * maxTilt;
      m.targetScale = scale;
    }
    start();
  };

  const handlePointerEnter = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    const m = motion.current;
    m.hover = true;

    // Start the glow right under the cursor, so it never glides in from a corner
    if (rect) {
      m.mx = m.targetMx = e.clientX - rect.left;
      m.my = m.targetMy = e.clientY - rect.top;
    }
    setActive(true);
    aim(e);
  };

  const handlePointerLeave = () => {
    const m = motion.current;
    m.hover = false;
    m.targetRx = 0;
    m.targetRy = 0;
    m.targetScale = 1;
    setActive(false);
    start();
  };

  // Keyboard users get the glow too, resting near the top of the card
  const handleFocus = (e: FocusEvent<HTMLElement>) => {
    onFocus?.(e);
    const rect = wrapperRef.current?.getBoundingClientRect();
    const m = motion.current;
    if (rect && !m.hover) {
      m.targetMx = rect.width / 2;
      m.targetMy = rect.height * 0.3;
      m.mx = m.targetMx;
      m.my = m.targetMy;
      start();
    }
    setFocused(true);
  };

  const handleBlur = (e: FocusEvent<HTMLElement>) => {
    onBlur?.(e);
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
  };
  // end of pointer handlers

  const glowVisible = !disableGlow && (active || focused);
  const tiltActive = active && !disableTilt && !reduceMotion;
  const Tag = as as ElementType;
  const Heading = `h${headingLevel}` as ElementType;
  const hasHeader = Boolean(title || subtitle || icon || badge);
  const split = layout === "split";

  // Pushes a layer toward the viewer while the card is leaning, so the text seems to float above the glass.
  // At rest the layers sit flat, which keeps the text perfectly crisp.
  const lift = (px: number): CSSProperties => ({
    transform: `translateZ(${tiltActive ? px : 0}px)`,
    transition: "transform 450ms cubic-bezier(0.22, 1, 0.36, 1)",
  });

  const spotlight = accentColor
    ? `radial-gradient(circle at 42% 42%, ${mix(glowColor, 24)}, transparent 62%), radial-gradient(circle at 66% 66%, ${mix(accentColor, 20)}, transparent 60%)`
    : `radial-gradient(circle, ${mix(glowColor, 22)}, transparent 68%)`;

  const edgeLight = accentColor
    ? `radial-gradient(circle at 45% 45%, ${mix(glowColor, 90)}, ${mix(accentColor, 60)} 45%, transparent 70%)`
    : `radial-gradient(circle, ${mix(glowColor, 90)}, transparent 70%)`;

  // The glow layers move with transform only, which the browser can do on the GPU without repainting
  const followCursor = "translate3d(calc(var(--mx, 0) * 1px - 50%), calc(var(--my, 0) * 1px - 50%), 0)";

  const cardStyle: CSSProperties = {
    transform: `perspective(${perspective}px) rotateX(calc(var(--rx, 0) * 1deg)) rotateY(calc(var(--ry, 0) * 1deg)) scale3d(var(--s, 1), var(--s, 1), 1)`,
    // The shadow slides the opposite way to the lean, which makes the card feel like it is floating
    boxShadow:
      "calc(var(--ry, 0) * -2px) calc(var(--rx, 0) * 2px + 20px) 44px -16px hsl(var(--foreground) / 0.22), inset 0 1px 0 0 hsl(var(--foreground) / 0.06)",
    ...style,
  };

  return (
    <div
      ref={wrapperRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={aim}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      className={cn("relative", className)}
    >
      <Tag
        ref={setCardRef}
        aria-labelledby={title ? titleId : undefined}
        {...rest}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={cardStyle}
        className={cn(
          "relative isolate h-full w-full rounded-2xl border border-border text-card-foreground outline-none [transform-style:preserve-3d]",
          active && "[will-change:transform]"
        )}
      >
        {/* Glass surface. It holds no 3D layers of its own, so blur and clipping are safe here. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] bg-[hsl(var(--muted)/0.55)] backdrop-blur-xl backdrop-saturate-150"
        >
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-foreground/[0.05] to-transparent" />

          {/* Soft light under the cursor */}
          {!disableGlow && (
            <div
              className="absolute left-0 top-0 rounded-full transition-opacity duration-500 ease-out"
              style={{ width: glowSize, height: glowSize, opacity: glowVisible ? 1 : 0, transform: followCursor, background: spotlight }}
            />
          )}
        </div>

        {/* Glowing edge: the same light, shown only along the border by a mask */}
        {!disableGlow && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px overflow-hidden rounded-[inherit] p-px transition-opacity duration-500 ease-out"
            style={{
              opacity: glowVisible ? 1 : 0,
              WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
            }}
          >
            <span
              className="absolute left-0 top-0 block rounded-full"
              style={{ width: glowSize * 0.8, height: glowSize * 0.8, transform: followCursor, background: edgeLight }}
            />
          </span>
        )}

        {/* Content */}
        <div className={cn("relative flex h-full flex-col [transform-style:preserve-3d]", PADDING[padding])}>
          <div
            className={cn(
              "flex-1",
              split ? "grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-start md:gap-10" : "flex flex-col gap-6"
            )}
          >
            {hasHeader && (
              <header className="min-w-0" style={lift(34)}>
                {(icon || badge) && (
                  <div className="mb-4 flex items-start justify-between gap-3">
                    {icon ? (
                      <span
                        aria-hidden="true"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background/60 text-primary shadow-sm"
                      >
                        {icon}
                      </span>
                    ) : (
                      <span />
                    )}
                    {badge && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        {badge}
                      </span>
                    )}
                  </div>
                )}
                {title && (
                  <Heading id={titleId} className="text-xl font-semibold tracking-tight">
                    {title}
                  </Heading>
                )}
                {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
              </header>
            )}

            {children && (
              <div className={cn("min-w-0", contentClassName)} style={lift(20)}>
                {children}
              </div>
            )}
          </div>

          {footer && (
            <footer className="mt-6 border-t border-border/70 pt-5" style={lift(28)}>
              {footer}
            </footer>
          )}
        </div>
      </Tag>
    </div>
  );
});

export default TiltGlowCard;

// end of TiltGlowCard
