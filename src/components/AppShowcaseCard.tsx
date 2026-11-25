/**
 * AppShowcaseCard
 *
 * Showcases an app or website with:
 *  - A 16:9 media slot: static image with hover-zoom, OR a 3-4 s looping video
 *    that autoplays on hover (falls back to the still on mobile / touch)
 *  - App name (font-unbounded), category chip, and a 2-3 line description
 *  - An EZ-branded "Try App" CTA
 *
 * Design tokens: EZ brand (ink border, block shadow, sun CTA, cream/ink palette)
 * Layout: fixed width for use inside horizontal scroll rows
 *
 * Adapted from:
 *   ravikatiyar162/project-card  (21st.dev)   – card structure + hover-zoom
 *   ruixen.ui/featured-crm-demo-section        – image ↔ video switching
 */

import { useRef, useState } from "react";
import { ArrowRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { CARD, BTN_PRIMARY, EYEBROW } from "@/components/modern/styles";

export interface AppShowcaseCardProps {
  /** App / website name */
  name: string;
  /** 2–3 sentence description of what it does */
  description: string;
  /** Still image — always required; shown while video is not playing */
  imageSrc: string;
  /** Optional 3–4 s looping mp4 that plays on hover */
  videoSrc?: string;
  /** Category or type badge, e.g. "Image Tools" */
  category?: string;
  /** CTA destination */
  href: string;
  /** Override CTA label (default: "Try App") */
  ctaLabel?: string;
  /** Additional className on the outer card */
  className?: string;
  /** Fixed card width class — override for grids. Default: w-[300px] */
  widthClass?: string;
}

export function AppShowcaseCard({
  name,
  description,
  imageSrc,
  videoSrc,
  category,
  href,
  ctaLabel = "Try App",
  className,
  widthClass = "w-[300px]",
}: AppShowcaseCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  /* ── pointer-enter: start video if one is provided ──────── */
  const handleMouseEnter = () => {
    if (!videoSrc) return;
    setIsPlaying(true);
    // slight delay so the state flip re-renders the <video> before play()
    setTimeout(() => videoRef.current?.play().catch(() => {}), 50);
  };

  /* ── pointer-leave: pause + rewind ──────────────────────── */
  const handleMouseLeave = () => {
    if (!videoSrc) return;
    videoRef.current?.pause();
    if (videoRef.current) videoRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  return (
    <article
      className={cn(CARD, "shrink-0 flex flex-col overflow-hidden", widthClass, className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Media slot ──────────────────────────────────────── */}
      <div className="relative aspect-video overflow-hidden border-b-2 border-ink bg-sand">

        {/* Still image — always rendered, hidden when video is playing */}
        <img
          src={imageSrc}
          alt={name}
          loading="lazy"
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-in-out",
            /* zoom on hover when no video; fade out when video takes over */
            videoSrc
              ? isPlaying
                ? "opacity-0"
                : "opacity-100 group-hover:scale-105"
              : "group-hover:scale-110"
          )}
        />

        {/* Video — rendered only once a src is provided */}
        {videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            loop
            playsInline
            preload="none"
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
              isPlaying ? "opacity-100" : "opacity-0"
            )}
          />
        )}

        {/* Play badge — shown on hover when video is available and not yet playing */}
        {videoSrc && !isPlaying && (
          <div
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full border border-ink bg-cream/90 px-2 py-0.5 text-[10px] font-bold text-ink backdrop-blur-sm"
            aria-hidden
          >
            <Play className="h-2.5 w-2.5 fill-ink" />
            Preview
          </div>
        )}

        {/* Category chip — top-left */}
        {category && (
          <span className="absolute left-2 top-2 inline-flex items-center rounded-full border border-ink bg-cream/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink backdrop-blur-sm">
            {category}
          </span>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-unbounded text-sm font-black leading-tight text-ink line-clamp-2">
          {name}
        </h3>

        <p className="flex-1 text-xs leading-relaxed text-ink/60 line-clamp-3">
          {description}
        </p>

        {/* CTA */}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(BTN_PRIMARY, "mt-auto w-full justify-center text-xs")}
          onClick={e => e.stopPropagation()}
        >
          {ctaLabel}
          <ArrowRight className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * AppShowcaseRow
 *
 * Ready-made horizontal scroll row of AppShowcaseCards.
 * Drop this straight onto any page section.
 * ───────────────────────────────────────────────────────────────────────────── */

export interface ShowcaseApp {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  videoSrc?: string;
  category?: string;
  href: string;
  ctaLabel?: string;
}

interface AppShowcaseRowProps {
  apps: ShowcaseApp[];
  /** Optional section heading */
  heading?: string;
  /** Optional sub-heading */
  subheading?: string;
  cardWidthClass?: string;
}

export function AppShowcaseRow({
  apps,
  heading,
  subheading,
  cardWidthClass,
}: AppShowcaseRowProps) {
  return (
    <section className="space-y-4">
      {(heading || subheading) && (
        <div className="px-1">
          {subheading && <p className={EYEBROW}>{subheading}</p>}
          {heading && (
            <h2 className="font-unbounded text-xl font-black text-ink">{heading}</h2>
          )}
        </div>
      )}

      {/* Horizontal scroll row — single line, hidden scrollbar */}
      <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {apps.map(app => (
          <AppShowcaseCard
            key={app.id}
            name={app.name}
            description={app.description}
            imageSrc={app.imageSrc}
            videoSrc={app.videoSrc}
            category={app.category}
            href={app.href}
            ctaLabel={app.ctaLabel}
            widthClass={cardWidthClass}
          />
        ))}
      </div>
    </section>
  );
}
