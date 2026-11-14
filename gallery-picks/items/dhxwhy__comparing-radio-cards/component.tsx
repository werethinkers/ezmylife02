/*
 * Comparing Radio Cards – Plan Picker that Shows the Difference from Your Selection
 * Author: @dhxwhy   Source: https://21st.dev/@dhxwhy/components/comparing-radio-cards   21st.dev id: 44854
 * Licence: covered by the paid 21st.dev plan Ezyourlife bought on 14 Nov 2026 (the API returns no
 * per-component licence text, so the author's own terms were not checked line by line).
 * Kept as published; only this header was added.
 */
// @ts-nocheck
/* eslint-disable */
"use client";

import * as React from "react";

type DivProps = React.ComponentProps<"div">;
type Tone = "good" | "neutral";
type Box = { x: number; y: number; w: number; h: number };

export type RadioCardPrice = {
  amount: number;
  /** Billing period written after the amount: "mo" renders as "/mo". */
  period: string;
};

export type RadioCardAttributeValue = { key: string; value: number };

export type RadioCardOption = {
  value: string;
  title: string;
  price: RadioCardPrice;
  /** Raw numbers keyed by attribute key (100, not "100 GB"); the attribute formats them. */
  attributes: RadioCardAttributeValue[];
  /** One line that unfolds under the card while it is selected. */
  detail?: string;
  /** Small text badge such as "Most popular". */
  badge?: string;
  disabled?: boolean;
};

export type RadioCardAttribute = {
  key: string;
  label: string;
  /** Written after plain numbers: 5 + "GB" → "5 GB". Ignored when format is given. */
  unit?: string;
  /** Formats a value and the size of a difference. */
  format?: (value: number) => string;
  /** Which way is better. Default "up"; costs and latencies want "down". */
  betterDirection?: "up" | "down";
  /** "level" attributes are ordered tiers (1 Email, 2 Priority, 3 Dedicated): the chip reads "Priority →" before the value instead of a signed number. */
  kind?: "number" | "level";
};

export type RadioCardDifference = {
  key: string;
  label: string;
  delta: number;
  /** Chip text: "+700 GB", "−$12/mo" or "Priority →". */
  text: string;
  /** Sentence form for the live summary: "Storage +700 GB" or "Support Priority → Dedicated". */
  spoken: string;
  tone: Tone;
  /** Level chips sit before the value; signed chips after it. */
  leading: boolean;
};

export type ComparingRadioCardsProps = DivProps & {
  options: RadioCardOption[];
  /** Column definitions, in display order. */
  attributes: RadioCardAttribute[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Show "difference from the selected card" chips on the other cards. Default true. */
  showDiffs?: boolean;
  /** Shared name of the underlying radio inputs. */
  name?: string;
  /** ISO currency code for the default price format. */
  currency?: string;
  formatPrice?: (amount: number) => string;
  /** Lift, ring slide and detail morph, in ms. */
  duration?: number;
  "aria-label"?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const MINUS = "−";
const PLAIN = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const TONE: { [tone in Tone]: string } = {
  good: "bg-chart-2/15 text-foreground dark:bg-chart-2/25",
  neutral: "bg-foreground/6 text-muted-foreground dark:bg-foreground/10",
};

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(true);
  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

function priceFormatter(currency: string, custom: ((amount: number) => string) | undefined) {
  if (custom) return custom;
  const whole = new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const cents = new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (amount: number) => (Number.isInteger(amount) ? whole : cents).format(amount);
}

export function formatAttributeValue(attribute: RadioCardAttribute, value: number) {
  if (attribute.format) return attribute.format(value);
  const text = PLAIN.format(value);
  return attribute.unit ? `${text} ${attribute.unit}` : text;
}

function valueOf(option: RadioCardOption, key: string) {
  return option.attributes.find((entry) => entry.key === key)?.value;
}

function toneOf(delta: number, better: "up" | "down" | undefined): Tone {
  const up = (better ?? "up") === "up";
  return (up ? delta > 0 : delta < 0) ? "good" : "neutral";
}

const signed = (delta: number, size: string) => `${delta > 0 ? "+" : MINUS}${size}`;

/** Differences of `option` against `selected`: price first, then attributes in order. Equal values are left out. */
export function differencesFrom(option: RadioCardOption, selected: RadioCardOption, attributes: RadioCardAttribute[], formatPrice: (amount: number) => string): RadioCardDifference[] {
  const list: RadioCardDifference[] = [];
  const priceDelta = option.price.amount - selected.price.amount;
  if (priceDelta !== 0) {
    const text = `${signed(priceDelta, formatPrice(Math.abs(priceDelta)))}/${option.price.period}`;
    list.push({ key: "price", label: "Price", delta: priceDelta, text, spoken: text, tone: toneOf(priceDelta, "down"), leading: false });
  }
  for (const attribute of attributes) {
    const from = valueOf(selected, attribute.key);
    const to = valueOf(option, attribute.key);
    if (from === undefined || to === undefined || from === to) continue;
    const delta = to - from;
    const tone = toneOf(delta, attribute.betterDirection);
    if (attribute.kind === "level") {
      const fromText = formatAttributeValue(attribute, from);
      list.push({ key: attribute.key, label: attribute.label, delta, text: `${fromText} →`, spoken: `${attribute.label} ${fromText} → ${formatAttributeValue(attribute, to)}`, tone, leading: true });
    } else {
      const text = signed(delta, formatAttributeValue(attribute, Math.abs(delta)));
      list.push({ key: attribute.key, label: attribute.label, delta, text, spoken: `${attribute.label} ${text}`, tone, leading: false });
    }
  }
  return list;
}

type RollProps = {
  text: string;
  /** Numeric order of the text; a higher order rolls upward. */
  order: number;
  /** Widest text this slot can show, so the chip keeps its width while rolling. */
  sizer?: string;
  instant: boolean;
  duration?: number;
};

function Roll({ text, order, sizer, instant, duration = 360 }: RollProps) {
  const currentRef = React.useRef(null as HTMLSpanElement | null);
  const ghostRef = React.useRef(null as HTMLSpanElement | null);
  const previous = React.useRef({ text, order });
  const [ghost, setGhost] = React.useState(null as { text: string; up: boolean } | null);

  React.useLayoutEffect(() => {
    const from = previous.current;
    previous.current = { text, order };
    const node = currentRef.current;
    if (from.text === text) return;
    if (instant || !node || typeof node.animate !== "function") {
      setGhost(null);
      return;
    }
    const up = order >= from.order;
    setGhost({ text: from.text, up });
    node.animate(
      [{ transform: up ? "translateY(100%)" : "translateY(-100%)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }],
      { duration, easing: EASE },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  React.useLayoutEffect(() => {
    const node = ghostRef.current;
    if (!ghost || !node || typeof node.animate !== "function") {
      if (ghost) setGhost(null);
      return;
    }
    const out = node.animate(
      [{ transform: "translateY(0)", opacity: 1 }, { transform: ghost.up ? "translateY(-100%)" : "translateY(100%)", opacity: 0 }],
      { duration, easing: EASE, fill: "forwards" },
    );
    out.onfinish = () => setGhost(null);
    return () => out.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ghost]);

  const reserved = sizer !== undefined;
  return (
    <span data-roll data-rolling={ghost ? "true" : "false"} className="relative inline-block overflow-hidden whitespace-nowrap align-bottom">
      {reserved && <span aria-hidden="true" className="invisible block">{sizer}</span>}
      <span ref={currentRef} data-roll-current className={reserved ? "absolute inset-0 block text-center" : "block"}>{text}</span>
      {ghost && <span ref={ghostRef} data-roll-ghost aria-hidden="true" className="absolute inset-0 block text-center">{ghost.text}</span>}
    </span>
  );
}

type ChipProps = {
  id: string;
  difference: RadioCardDifference | undefined;
  shown: boolean;
  sizer: string | undefined;
  delay: number;
  reduced: boolean;
  leading: boolean;
};

/** A pill that makes room for itself (grid track 0fr → 1fr) and rolls its text when the selection changes. */
function Chip({ id, difference, shown, sizer, delay, reduced, leading }: ChipProps) {
  const frozen = React.useRef(difference);
  const wasShown = React.useRef(false);
  if (shown && difference) frozen.current = difference;
  const current = frozen.current;
  const instant = reduced || !(shown && wasShown.current);
  React.useEffect(() => {
    wasShown.current = shown;
  });
  const style = { transitionDelay: shown && !reduced ? `${delay}ms` : "0ms" };
  return (
    <span
      data-chip={id}
      data-shown={shown ? "true" : "false"}
      data-tone={current?.tone ?? "neutral"}
      aria-hidden="true"
      style={style}
      className="group/chip grid shrink-0 transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none data-[shown=false]:grid-cols-[0fr] data-[shown=true]:grid-cols-[1fr]"
    >
      <span className="min-w-0 overflow-hidden">
        <span
          data-chip-pill
          style={style}
          className={`${leading ? "mr-2" : "ml-2"} inline-flex h-5 items-center rounded-full px-1.5 text-[11px] font-medium leading-[14px] tabular-nums transition-[opacity,translate,background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none group-data-[shown=false]/chip:-translate-x-1.5 group-data-[shown=false]/chip:opacity-0 ${TONE[current?.tone ?? "neutral"]}`}
        >
          <Roll text={current?.text ?? ""} order={current?.delta ?? 0} sizer={sizer} instant={instant} />
        </span>
      </span>
    </span>
  );
}

const boxOf = (node: HTMLElement): Box => ({ x: node.offsetLeft - 1, y: node.offsetTop - 1, w: node.offsetWidth + 2, h: node.offsetHeight + 2 });

const place = (ring: HTMLElement, box: Box) => {
  ring.style.transform = `translate(${box.x}px, ${box.y}px)`;
  ring.style.width = `${box.w}px`;
  ring.style.height = `${box.h}px`;
};

/** Where the ring is right now, read from the running animation. */
const liveBox = (ring: HTMLElement, fallback: Box): Box => {
  const computed = getComputedStyle(ring);
  const matrix = /matrix\(([^)]+)\)/.exec(computed.transform);
  if (!matrix) return fallback;
  const parts = (matrix[1] ?? "").split(",").map(Number);
  return {
    x: parts[4] ?? fallback.x,
    y: parts[5] ?? fallback.y,
    w: Number.parseFloat(computed.width) || fallback.w,
    h: Number.parseFloat(computed.height) || fallback.h,
  };
};

export function ComparingRadioCards({
  options,
  attributes,
  value,
  defaultValue,
  onValueChange,
  showDiffs = true,
  name,
  currency = "USD",
  formatPrice,
  duration = 420,
  "aria-label": ariaLabel = "Options",
  className = "",
  style,
  ref,
  ...rest
}: ComparingRadioCardsProps) {
  const reduced = useReducedMotion();
  const generatedName = React.useId();
  const groupName = name ?? generatedName;
  const firstEnabled = options.find((option) => !option.disabled)?.value ?? options[0]?.value ?? "";
  const [local, setLocal] = React.useState(defaultValue ?? firstEnabled);
  const active = value ?? local;
  const selected = options.find((option) => option.value === active) ?? null;
  const fmt = React.useMemo(() => priceFormatter(currency, formatPrice), [currency, formatPrice]);
  const [announce, setAnnounce] = React.useState("");
  const gridRef = React.useRef(null as HTMLDivElement | null);
  const ringRef = React.useRef(null as HTMLSpanElement | null);
  const cardRefs = React.useRef({} as { [value: string]: HTMLLabelElement | null });
  const detailRefs = React.useRef({} as { [value: string]: HTMLSpanElement | null });
  const innerRefs = React.useRef({} as { [value: string]: HTMLSpanElement | null });
  const previous = React.useRef(active);
  const ringBox = React.useRef(null as Box | null);
  const ringAnimation = React.useRef(null as Animation | null);
  const announcedFor = React.useRef(active);

  const select = (next: string) => {
    if (next === active) return;
    if (value === undefined) setLocal(next);
    onValueChange?.(next);
  };

  const differences = React.useMemo(() => {
    const map = {} as { [value: string]: RadioCardDifference[] };
    for (const option of options) map[option.value] = selected && option.value !== selected.value ? differencesFrom(option, selected, attributes, fmt) : [];
    return map;
  }, [options, attributes, selected, fmt]);

  // The widest chip text per column, so a chip keeps its width while its text rolls.
  const sizers = React.useMemo(() => {
    const widest = {} as { [key: string]: string };
    for (const a of options) for (const b of options) {
      if (a === b) continue;
      for (const difference of differencesFrom(a, b, attributes, fmt)) {
        if (difference.text.length > (widest[difference.key] ?? "").length) widest[difference.key] = difference.text;
      }
    }
    return widest;
  }, [options, attributes, fmt]);

  const summary = React.useMemo(() => {
    if (!selected) return "";
    const others = options
      .filter((option) => option.value !== selected.value)
      .map((option) => {
        const list = differences[option.value] ?? [];
        return `${option.title}: ${list.length ? list.map((difference) => difference.spoken).join(", ") : "same"}`;
      });
    return others.length ? `${selected.title} selected. ${others.join(". ")}.` : `${selected.title} selected.`;
  }, [options, selected, differences]);

  React.useEffect(() => {
    if (announcedFor.current === active) return;
    announcedFor.current = active;
    setAnnounce(summary);
  }, [active, summary]);

  // One commit moves everything: the old detail folds, the new one unfolds, and the ring slides between the two cards.
  React.useLayoutEffect(() => {
    const fromValue = previous.current;
    previous.current = active;
    const changed = fromValue !== active;
    const ring = ringRef.current;
    const card = cardRefs.current[active];
    const target = card ? boxOf(card) : null;

    if (changed) {
      for (const option of options) {
        const isSelected = option.value === active;
        const wasSelected = option.value === fromValue;
        if (!isSelected && !wasSelected) continue;
        const wrap = detailRefs.current[option.value];
        const inner = innerRefs.current[option.value];
        if (!wrap || !inner) continue;
        const running = wrap.getAnimations();
        const from = running.length ? wrap.getBoundingClientRect().height : wasSelected ? inner.offsetHeight : 0;
        for (const animation of running) animation.cancel();
        const to = isSelected ? inner.offsetHeight : 0;
        if (reduced || Math.abs(from - to) < 0.5 || typeof wrap.animate !== "function") continue;
        wrap.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration, easing: EASE });
      }
    }

    if (!ring) return;
    if (!target) {
      ring.dataset.visible = "false";
      ringBox.current = null;
      return;
    }
    const start = ringBox.current;
    ringBox.current = target;
    ring.dataset.visible = "true";
    if (!changed || !start || reduced || typeof ring.animate !== "function") {
      ringAnimation.current?.cancel();
      ringAnimation.current = null;
      place(ring, target);
      return;
    }
    const live = ringAnimation.current && ringAnimation.current.playState === "running" ? liveBox(ring, start) : start;
    ringAnimation.current?.cancel();
    place(ring, target);
    const animation = ring.animate(
      [
        { transform: `translate(${live.x}px, ${live.y}px)`, width: `${live.w}px`, height: `${live.h}px` },
        { transform: `translate(${target.x}px, ${target.y}px)`, width: `${target.w}px`, height: `${target.h}px` },
      ],
      { duration, easing: EASE },
    );
    ringAnimation.current = animation;
    animation.onfinish = () => {
      if (ringAnimation.current !== animation) return;
      ringAnimation.current = null;
      const settled = cardRefs.current[previous.current];
      if (settled) {
        const box = boxOf(settled);
        ringBox.current = box;
        place(ring, box);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Re-seat the ring when the layout changes (column count, detail text, fonts) and no slide is in flight.
  const optionKey = options.map((option) => option.value).join("|");
  React.useEffect(() => {
    const grid = gridRef.current;
    const ring = ringRef.current;
    if (!grid || !ring || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (ringAnimation.current && ringAnimation.current.playState === "running") return;
      const card = cardRefs.current[previous.current];
      if (!card) return;
      const box = boxOf(card);
      ringBox.current = box;
      place(ring, box);
    });
    observer.observe(grid, { box: "border-box" });
    for (const node of Object.values(cardRefs.current)) if (node) observer.observe(node, { box: "border-box" });
    return () => observer.disconnect();
  }, [optionKey]);

  React.useEffect(() => () => ringAnimation.current?.cancel(), []);

  return (
    <div
      ref={ref}
      {...rest}
      data-slot="comparing-radio-cards"
      data-value={active}
      data-diffs={showDiffs ? "true" : "false"}
      role="radiogroup"
      aria-label={ariaLabel}
      className={`@container/radio-cards w-full ${className}`}
      style={style}
    >
      <div
        ref={gridRef}
        data-grid
        className="relative grid gap-3 @xl/radio-cards:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
        style={{ "--cols": options.length } as React.CSSProperties}
      >
        <span
          ref={ringRef}
          data-ring
          aria-hidden="true"
          data-visible="false"
          className="pointer-events-none absolute left-0 top-0 z-10 h-0 w-0 -translate-y-1.5 rounded-[17px] border-2 border-primary opacity-0 transition-opacity duration-200 will-change-transform motion-reduce:transition-none data-[visible=true]:opacity-100"
        />
        {options.map((option) => {
          const isSelected = option.value === active;
          const list = differences[option.value] ?? [];
          const chipFor = (key: string) => list.find((difference) => difference.key === key);
          const price = chipFor("price");
          return (
            <label
              key={option.value}
              ref={(node) => { cardRefs.current[option.value] = node; }}
              data-card
              data-value={option.value}
              data-state={isSelected ? "checked" : "unchecked"}
              data-disabled={option.disabled ? "true" : undefined}
              style={{ transitionDuration: `${duration}ms` }}
              className="group relative flex cursor-pointer select-none flex-col rounded-2xl bg-card p-4 text-card-foreground shadow-sm ring-1 ring-border outline-none transition-[translate,box-shadow] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring has-[input:focus-visible]:ring-offset-2 has-[input:focus-visible]:ring-offset-background data-[state=checked]:-translate-y-1.5 data-[state=checked]:shadow-[0_18px_36px_-18px_color-mix(in_oklch,var(--color-foreground)_32%,transparent)] dark:data-[state=checked]:shadow-[0_18px_36px_-14px_color-mix(in_oklch,var(--color-background)_92%,transparent)] data-[state=unchecked]:hover:-translate-y-0.5 data-[state=unchecked]:hover:shadow-md data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60 data-[disabled=true]:hover:translate-y-0 data-[disabled=true]:hover:shadow-sm"
            >
              <input
                type="radio"
                data-radio-input
                className="sr-only"
                name={groupName}
                value={option.value}
                checked={isSelected}
                disabled={option.disabled}
                onChange={() => select(option.value)}
              />
              <span className="flex items-center gap-2.5">
                <span
                  data-radio
                  aria-hidden="true"
                  className="relative flex size-[18px] shrink-0 items-center justify-center rounded-full border border-border bg-background transition-colors duration-300 motion-reduce:transition-none group-data-[state=checked]:border-primary"
                >
                  <span data-radio-dot className="size-2 scale-0 rounded-full bg-primary transition-[scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none group-data-[state=checked]:scale-100" />
                </span>
                <span data-title className="truncate text-sm font-medium">{option.title}</span>
                {option.badge && (
                  <span data-badge className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {option.badge}
                  </span>
                )}
              </span>
              <span className="mt-3 flex items-end justify-between gap-2">
                <span className="flex items-baseline gap-1 whitespace-nowrap">
                  <span data-price className="text-2xl font-semibold leading-none tracking-tight tabular-nums">{fmt(option.price.amount)}</span>
                  <span data-period className="text-sm text-muted-foreground">/{option.price.period}</span>
                </span>
                {showDiffs && <Chip id="price" difference={price} shown={!isSelected && !!price} sizer={sizers.price} delay={0} reduced={reduced} leading={false} />}
              </span>
              <span className="mt-3 flex flex-col gap-1.5">
                {attributes.map((attribute, rowIndex) => {
                  const raw = valueOf(option, attribute.key);
                  const difference = chipFor(attribute.key);
                  const leading = attribute.kind === "level";
                  const chip = showDiffs && (
                    <Chip id={attribute.key} difference={difference} shown={!isSelected && !!difference} sizer={sizers[attribute.key]} delay={(rowIndex + 1) * 120} reduced={reduced} leading={leading} />
                  );
                  return (
                    <span key={attribute.key} data-row={attribute.key} className="flex items-center justify-between gap-3 text-sm leading-5">
                      <span className="text-muted-foreground">{attribute.label}</span>
                      <span className="flex min-w-0 items-center justify-end">
                        {leading && chip}
                        <span data-attr-value={attribute.key} className="whitespace-nowrap font-medium tabular-nums">{raw === undefined ? "—" : formatAttributeValue(attribute, raw)}</span>
                        {!leading && chip}
                      </span>
                    </span>
                  );
                })}
              </span>
              {option.detail && (
                <span
                  ref={(node) => { detailRefs.current[option.value] = node; }}
                  data-detail
                  aria-hidden={!isSelected}
                  className="block overflow-hidden"
                  style={{ height: isSelected ? "auto" : 0 }}
                >
                  <span ref={(node) => { innerRefs.current[option.value] = node; }} data-detail-inner className="block pt-3">
                    <span className="block border-t border-border pt-3 text-xs leading-4 text-muted-foreground">{option.detail}</span>
                  </span>
                </span>
              )}
            </label>
          );
        })}
      </div>
      <p role="status" aria-live="polite" data-announce className="sr-only">{announce}</p>
    </div>
  );
}

export default ComparingRadioCards;
