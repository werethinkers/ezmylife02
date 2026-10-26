import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  key: string;
  eyebrow: string;
  title: string;
  line: string;
  /** Background colour of the slide (a goal colour). */
  color: string;
  /** One wide picture (an app preview, 16:9). */
  image?: string;
  /** Or up to three phone pictures (a website or a card). */
  phones?: string[];
  to: string;
  cta: string;
  price?: ReactNode;
};

const SLIDE_MS = 8000;
const TICK_MS = 80;

/**
 * Big promo carousel in the Epic Games style: one slide in the middle with its neighbours
 * peeking in, it moves on by itself every 8 seconds (pauses on hover or focus, stops for
 * people who prefer less motion), swipes smoothly on a phone, and has small pictures with a
 * progress bar to pick from on a laptop (dots on a phone).
 */
export function HeroCarousel({ slides, label = "Featured", className }: { slides: HeroSlide[]; label?: string; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const settle = useRef<number>();
  const activeRef = useRef(0);
  activeRef.current = active;
  const n = slides.length;

  const go = useCallback(
    (i: number) => {
      const next = (i + n) % n;
      setActive(next);
      setProgress(0);
      const el = track.current;
      const s = el?.children[next] as HTMLElement | undefined;
      if (el && s) el.scrollTo({ left: s.offsetLeft - (el.clientWidth - s.clientWidth) / 2, behavior: "smooth" });
    },
    [n],
  );

  // Work out which slide is in the middle after a swipe.
  const onScroll = () => {
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const el = track.current;
      if (!el) return;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bd = Infinity;
      Array.from(el.children).forEach((c, i) => {
        const d = Math.abs((c as HTMLElement).offsetLeft + (c as HTMLElement).clientWidth / 2 - mid);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      if (best !== activeRef.current) {
        setActive(best);
        setProgress(0);
      }
    }, 140);
  };

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => {
      if (paused || document.hidden) return;
      setProgress((p) => p + (TICK_MS / SLIDE_MS) * 100);
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, [paused]);

  useEffect(() => {
    if (progress >= 100) go(active + 1);
  }, [progress, active, go]);

  if (n === 0) return null;
  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className={cn("min-w-0", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        ref={track}
        onScroll={onScroll}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-[7%] pb-6 pt-1 [scrollbar-width:none] md:gap-5 md:px-[14%] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, i) => (
          <Link
            key={s.key}
            to={s.to}
            aria-label={`${s.title}: ${s.cta}`}
            aria-current={i === active ? "true" : undefined}
            className={cn(
              "group grid min-h-[520px] w-[86%] shrink-0 snap-center grid-cols-1 overflow-hidden rounded-[22px] border-[3px] border-ink shadow-[5px_5px_0_0_hsl(var(--ink))] transition-[opacity,transform] duration-500 md:min-h-[430px] md:w-[72%] md:grid-cols-[5fr_6fr] md:rounded-[26px] md:shadow-[8px_8px_0_0_hsl(var(--ink))]",
              i === active ? "opacity-100" : "scale-[.96] opacity-50",
            )}
            style={{ background: s.color }}
            tabIndex={i === active ? 0 : -1}
          >
            <div className="flex flex-col justify-center gap-3 p-6 pb-0 md:gap-3.5 md:p-9 md:pr-0">
              <span className="w-fit rounded-full border-2 border-ink bg-card px-3 py-0.5 text-[13px] font-bold">{s.eyebrow}</span>
              <h2 className="font-display text-[26px] font-extrabold leading-[1.05] tracking-tight md:text-[34px]">{s.title}</h2>
              <p className="line-clamp-3 max-w-[26rem] text-[16px] leading-snug md:text-[17px]">{s.line}</p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <span className="inline-flex h-11 items-center rounded-full border-2 border-ink bg-pink px-5 text-[15px] font-bold shadow-[3px_3px_0_0_hsl(var(--ink))] transition-transform group-hover:-translate-y-0.5">{s.cta} →</span>
                {s.price}
              </div>
            </div>
            {s.phones ? (
              <div className="flex min-h-[240px] items-end justify-center gap-[2%] overflow-hidden px-4 pt-8 md:px-5">
                {s.phones.slice(0, 3).map((src, k, a) => (
                  <img
                    key={k}
                    src={src}
                    alt={k === Math.floor(a.length / 2) ? s.title : ""}
                    className={cn(
                      "aspect-[420/709] rounded-t-[22px] border-[3px] border-b-0 border-ink bg-card object-cover object-top",
                      k === Math.floor(a.length / 2) ? "w-[40%]" : "-mb-14 w-[31%]",
                    )}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 self-end overflow-hidden rounded-tl-[20px] border-[3px] border-b-0 border-r-0 border-ink bg-card md:mt-10 md:ml-2.5">
                {s.image && <img src={s.image} alt={`${s.title}: what the app looks like`} className="aspect-[16/9] w-full object-cover" />}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Laptop: small pictures with a progress bar. */}
      <div className="hidden justify-center gap-3 md:flex">
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => go(i)}
            aria-label={`Show ${s.title}`}
            aria-pressed={i === active}
            className={cn(
              "relative flex w-[170px] flex-col gap-1.5 overflow-hidden rounded-[14px] border-2 border-ink bg-card p-2 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              i === active ? "shadow-[3px_3px_0_0_hsl(var(--ink))]" : "opacity-80",
            )}
          >
            <img src={s.image ?? s.phones?.[Math.floor((s.phones.length - 1) / 2)] ?? ""} alt="" className={cn("w-full rounded-lg border-2 border-ink bg-card object-cover", s.phones ? "aspect-[420/300] object-top" : "aspect-[16/9]")} />
            <span className="truncate text-[13px] font-bold leading-tight">{s.title}</span>
            {i === active && <i className="absolute bottom-0 left-0 h-1.5 bg-ink" style={{ width: `${Math.min(progress, 100)}%` }} />}
          </button>
        ))}
      </div>

      {/* Phone: dots. */}
      <div className="flex justify-center gap-2 md:hidden">
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => go(i)}
            aria-label={`Show ${s.title}`}
            className={cn("h-3 rounded-full border-2 border-ink transition-[width] duration-200", i === active ? "w-8 bg-ink" : "w-3 bg-card")}
          />
        ))}
      </div>
    </section>
  );
}
