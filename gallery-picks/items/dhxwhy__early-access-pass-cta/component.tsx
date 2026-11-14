/*
 * Early Access Pass CTA – Email Signup Section that Issues a Holographic Pass
 * Author: @dhxwhy   Source: https://21st.dev/@dhxwhy/components/early-access-pass-cta   21st.dev id: 44844
 * Licence: covered by the paid 21st.dev plan Ezyourlife bought on 14 Nov 2026 (the API returns no
 * per-component licence text, so the author's own terms were not checked line by line).
 * Kept as published; only this header was added.
 */
// @ts-nocheck
/* eslint-disable */
"use client";

import * as React from "react";
import { Check, LoaderCircle, RotateCcw } from "lucide-react";

type SectionProps = React.ComponentProps<"section">;

export type EarlyAccessPassData = {
  /** Printed on the pass. Defaults to the part of the email before the @ sign, capitalised. */
  name?: string;
  number: number;
  issuedAt: Date | string;
};

export type EarlyAccessPassBrand = { name: string; mark?: React.ReactNode };
export type EarlyAccessPassLayout = "auto" | "split" | "stack";
export type EarlyAccessPassStatus = "idle" | "submitting" | "error";

type SectionBase = { [key in keyof SectionProps as key extends "onSubmit" ? never : key]: SectionProps[key] };

export type EarlyAccessPassCtaProps = SectionBase & {
  brand: EarlyAccessPassBrand;
  eyebrow?: React.ReactNode;
  heading: React.ReactNode;
  lead?: React.ReactNode;
  /** Small line under the form while nothing else needs the space. */
  note?: React.ReactNode;
  /** Resolve with an EarlyAccessPassData to issue it (or set `pass` yourself when controlled); reject to show the retry state. */
  onSubmit: (email: string) => unknown;
  /** Controlled issued pass. `null` shows the unissued pass. */
  pass?: EarlyAccessPassData | null;
  defaultPass?: EarlyAccessPassData | null;
  onPassChange?: (pass: EarlyAccessPassData | null) => void;
  email?: string;
  defaultEmail?: string;
  onEmailChange?: (email: string) => void;
  onStatusChange?: (status: EarlyAccessPassStatus) => void;
  /** Pass tilts toward the pointer. */
  tilt?: boolean;
  /** Two-colour sheen follows the pointer and sweeps once when the pass is issued. */
  sheen?: boolean;
  /** Maximum tilt in degrees. */
  maxTilt?: number;
  numberFormat?: (value: number) => string;
  dateFormat?: (date: Date) => string;
  layout?: EarlyAccessPassLayout;
  /** Small caps next to the brand name on the pass. */
  passLabel?: string;
  /** Vertical word on the tear-off tab. */
  tearLabel?: string;
  placeholder?: string;
  namePlaceholder?: string;
  submitLabel?: React.ReactNode;
  submittingLabel?: React.ReactNode;
  issuedLabel?: React.ReactNode;
  retryLabel?: React.ReactNode;
  invalidMessage?: React.ReactNode;
  errorMessage?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BARS = [2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 1, 3, 1, 2];
const SPLIT_MIN = 768;
const REST = { "--rx": "0deg", "--ry": "0deg", "--shx": "0px", "--shy": "24px", "--mx": "50%", "--my": "50%", "--sheen-x": "50%" } as React.CSSProperties;

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

/** "jordan.lee@alder.studio" → "Jordan". */
export function nameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  const word = local.split(/[._+-]/)[0] ?? "";
  return word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : "";
}

const defaultNumberFormat = (value: number) => value.toLocaleString("en-US");
const defaultDateFormat = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));
const isPassData = (value: unknown): value is EarlyAccessPassData => typeof value === "object" && value !== null && typeof (value as { number?: unknown }).number === "number" && "issuedAt" in value;

function DefaultMark() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-[18px]">
      <path fill="currentColor" fillRule="evenodd" d="M10 1a9 9 0 1 0 0 18a9 9 0 1 0 0-18Zm3 3.5a5.5 5.5 0 1 0 0 11a5.5 5.5 0 1 0 0-11Z" />
    </svg>
  );
}

export function EarlyAccessPassCta({
  brand,
  eyebrow = "Early access",
  heading,
  lead,
  note,
  onSubmit,
  pass: passProp,
  defaultPass = null,
  onPassChange,
  email: emailProp,
  defaultEmail = "",
  onEmailChange,
  onStatusChange,
  tilt = true,
  sheen = true,
  maxTilt = 8,
  numberFormat = defaultNumberFormat,
  dateFormat = defaultDateFormat,
  layout = "auto",
  passLabel = "Early access",
  tearLabel = "Access",
  placeholder = "you@company.com",
  namePlaceholder = "Your name",
  submitLabel = "Get my pass",
  submittingLabel = "Issuing…",
  issuedLabel = "You're in",
  retryLabel = "Try again",
  invalidMessage = "Enter a valid email address.",
  errorMessage = "Something went wrong.",
  className = "",
  ref,
  ...rest
}: EarlyAccessPassCtaProps) {
  const reduced = useReducedMotion();
  const baseId = React.useId();
  const [localPass, setLocalPass] = React.useState(defaultPass);
  const pass = passProp === undefined ? localPass : passProp;
  const issued = pass !== null;
  const [localEmail, setLocalEmail] = React.useState(defaultEmail);
  const email = emailProp ?? localEmail;
  const [status, setStatus] = React.useState("idle" as EarlyAccessPassStatus);
  const [failure, setFailure] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [announce, setAnnounce] = React.useState("");
  const [resolvedLayout, setResolvedLayout] = React.useState(layout === "auto" ? "split" : layout);
  const valid = EMAIL.test(email.trim());
  const submitting = status === "submitting";

  const sectionRef = React.useRef(null as HTMLElement | null);
  const stageRef = React.useRef(null as HTMLDivElement | null);
  const passRef = React.useRef(null as HTMLDivElement | null);
  const sheenRef = React.useRef(null as HTMLSpanElement | null);
  const sweepRef = React.useRef(null as HTMLSpanElement | null);
  const nameRef = React.useRef(null as HTMLSpanElement | null);
  const numberRef = React.useRef(null as HTMLSpanElement | null);
  const dateRef = React.useRef(null as HTMLSpanElement | null);
  const inputRef = React.useRef(null as HTMLInputElement | null);
  const buttonRef = React.useRef(null as HTMLButtonElement | null);
  const breath = React.useRef(null as Animation | null);
  const animations = React.useRef([] as Animation[]);
  const roll = React.useRef(0);
  const request = React.useRef(0);
  const buttonWidth = React.useRef(0);
  const wasIssued = React.useRef(issued);
  const numberFormatRef = React.useRef(numberFormat);
  numberFormatRef.current = numberFormat;

  const setSection = (node: HTMLElement | null) => {
    sectionRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const changeStatus = (next: EarlyAccessPassStatus) => {
    setStatus(next);
    onStatusChange?.(next);
  };

  const changeEmail = (next: string) => {
    if (emailProp === undefined) setLocalEmail(next);
    onEmailChange?.(next);
    if (status === "error") changeStatus("idle");
  };

  const sweepOnce = React.useCallback(() => {
    const sweep = sweepRef.current;
    if (!sweep || typeof sweep.animate !== "function") return;
    animations.current.push(sweep.animate([{ transform: "translateX(-120%)" }, { transform: "translateX(120%)" }], { duration: 900, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || issued) return;
    if (!valid) {
      setTouched(true);
      inputRef.current?.focus();
      return;
    }
    const id = ++request.current;
    setFailure("");
    changeStatus("submitting");
    setAnnounce("Issuing your pass…");
    try {
      const result = await onSubmit(email.trim());
      if (id !== request.current) return;
      if (isPassData(result)) {
        if (passProp === undefined) setLocalPass(result);
        onPassChange?.(result);
      }
      changeStatus("idle");
    } catch (error) {
      if (id !== request.current) return;
      setFailure(error instanceof Error && error.message ? error.message : errorMessage);
      changeStatus("error");
      setAnnounce("Your pass could not be issued. Try again.");
    }
  };

  React.useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const apply = (width: number) => setResolvedLayout(layout === "auto" ? (width >= SPLIT_MIN ? "split" : "stack") : layout);
    apply(section.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => { for (const entry of entries) apply(entry.contentRect.width); });
    observer.observe(section);
    return () => observer.disconnect();
  }, [layout]);

  React.useLayoutEffect(() => {
    const stage = stageRef.current;
    const name = nameRef.current;
    const number = numberRef.current;
    const date = dateRef.current;
    const was = wasIssued.current;
    wasIssued.current = issued;
    if (!stage) return;
    breath.current?.cancel();
    breath.current = null;
    for (const animation of animations.current) animation.cancel();
    animations.current = [];
    if (roll.current) cancelAnimationFrame(roll.current);
    roll.current = 0;
    const animate = !reduced && typeof stage.animate === "function";
    const changed = was !== issued;
    stage.style.transform = issued ? "none" : "scale(0.96)";
    stage.style.opacity = issued ? "1" : "0.85";
    if (name) name.style.clipPath = "";
    if (date) date.style.opacity = "";
    if (number) number.dataset.rolling = "false";
    if (!issued) {
      if (!animate) return;
      if (changed) animations.current.push(stage.animate([{ transform: "none", opacity: 1 }, { transform: "scale(0.96)", opacity: 0.85 }], { duration: 420, easing: EASE }));
      breath.current = stage.animate(
        [{ transform: "translateY(0) scale(0.96)" }, { transform: "translateY(-3px) scale(0.96)", offset: 0.5 }, { transform: "translateY(0) scale(0.96)" }],
        { duration: 4000, iterations: Infinity, easing: "ease-in-out", delay: changed ? 420 : 0 },
      );
      return;
    }
    const target = pass.number;
    if (!animate || !changed) {
      if (number) number.textContent = numberFormatRef.current(target);
      return;
    }
    animations.current.push(stage.animate([{ transform: "scale(0.96)", opacity: 0.85 }, { transform: "none", opacity: 1 }], { duration: 520, easing: EASE }));
    if (name) animations.current.push(name.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }], { duration: 300, delay: 120, easing: EASE, fill: "backwards" }));
    if (date) animations.current.push(date.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, delay: 260, easing: EASE, fill: "backwards" }));
    if (number) {
      number.dataset.rolling = "true";
      number.textContent = numberFormatRef.current(0);
      const started = performance.now();
      const frame = (now: number) => {
        const progress = Math.min(1, Math.max(0, (now - started - 150) / 700));
        const eased = 1 - (1 - progress) ** 3;
        number.textContent = numberFormatRef.current(Math.round(target * eased));
        if (progress < 1) { roll.current = requestAnimationFrame(frame); return; }
        roll.current = 0;
        number.dataset.rolling = "false";
      };
      roll.current = requestAnimationFrame(frame);
    }
    const sweep = sweepRef.current;
    if (sweep) animations.current.push(sweep.animate([{ transform: "translateX(-120%)" }, { transform: "translateX(120%)" }], { duration: 900, delay: 220, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }));
    return () => { if (roll.current) cancelAnimationFrame(roll.current); roll.current = 0; };
  }, [issued, pass, reduced]);

  React.useEffect(() => {
    if (issued) setAnnounce(`Pass issued, number ${numberFormat(pass.number)}${pass.name ? ` for ${pass.name}` : ""}`);
  }, [issued, pass, numberFormat]);

  React.useLayoutEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    const next = button.offsetWidth;
    const previous = buttonWidth.current;
    buttonWidth.current = next;
    if (!previous || previous === next || reduced || typeof button.animate !== "function") return;
    button.animate([{ width: `${previous}px` }, { width: `${next}px` }], { duration: 320, easing: EASE });
  }, [status, issued, reduced]);

  React.useEffect(() => {
    const card = passRef.current;
    const stage = stageRef.current;
    if (!card || !stage || reduced || (!tilt && !sheen)) return;
    const sheenNode = sheenRef.current;
    const ease = `transform 400ms ${EASE}, box-shadow 400ms ${EASE}`;
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const fx = (event.clientX - rect.left) / rect.width;
      const fy = (event.clientY - rect.top) / rect.height;
      card.style.transition = "none";
      if (sheenNode) sheenNode.style.transition = "none";
      if (tilt) {
        const rx = Math.max(-maxTilt, Math.min(maxTilt, (fx * 2 - 1) * maxTilt));
        const ry = Math.max(-maxTilt, Math.min(maxTilt, (1 - fy * 2) * maxTilt));
        card.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
        card.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
        card.style.setProperty("--shx", `${(-(rx / maxTilt) * 14).toFixed(1)}px`);
        card.style.setProperty("--shy", `${(24 + (ry / maxTilt) * 14).toFixed(1)}px`);
      }
      const px = Math.max(0, Math.min(100, fx * 100));
      const py = Math.max(0, Math.min(100, fy * 100));
      card.style.setProperty("--mx", `${px.toFixed(1)}%`);
      card.style.setProperty("--my", `${py.toFixed(1)}%`);
      card.style.setProperty("--sheen-x", `${px.toFixed(1)}%`);
      card.dataset.tracking = "true";
    };
    const leave = () => {
      card.style.transition = ease;
      if (sheenNode) sheenNode.style.transition = `background-position 400ms ${EASE}`;
      for (const [key, value] of Object.entries(REST)) card.style.setProperty(key, String(value));
      card.dataset.tracking = "false";
    };
    const down = (event: PointerEvent) => { if (event.pointerType === "touch") sweepOnce(); };
    card.addEventListener("pointermove", move);
    card.addEventListener("pointerleave", leave);
    card.addEventListener("pointercancel", leave);
    card.addEventListener("pointerdown", down);
    return () => {
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerleave", leave);
      card.removeEventListener("pointercancel", leave);
      card.removeEventListener("pointerdown", down);
    };
  }, [reduced, tilt, sheen, maxTilt, sweepOnce]);

  React.useEffect(() => () => {
    request.current += 1;
    breath.current?.cancel();
    for (const animation of animations.current) animation.cancel();
    if (roll.current) cancelAnimationFrame(roll.current);
  }, []);

  const showInvalid = touched && !valid && !issued;
  const helpId = `${baseId}-help`;
  const name = issued ? pass.name ?? nameFromEmail(email) : "";
  const issuedAt = issued ? dateFormat(toDate(pass.issuedAt)) : "";
  const passDescription = issued ? `${brand.name} ${passLabel.toLowerCase()} pass No. ${numberFormat(pass.number)}${name ? ` for ${name}` : ""}, issued ${issuedAt}` : `${brand.name} ${passLabel.toLowerCase()} pass, not issued yet`;
  const line = status === "error" ? failure : showInvalid ? invalidMessage : note;
  const grid = layout === "split" ? "grid-cols-[minmax(0,1fr)_auto]" : layout === "stack" ? "grid-cols-1" : "grid-cols-1 @3xl:grid-cols-[minmax(0,1fr)_auto]";
  const place = layout === "split" ? "justify-self-end" : layout === "stack" ? "justify-self-center" : "justify-self-center @3xl:justify-self-end";

  return (
    <section
      ref={setSection}
      {...rest}
      data-slot="early-access-pass-cta"
      data-layout={resolvedLayout}
      data-status={status}
      data-issued={issued ? "true" : "false"}
      data-valid={valid ? "true" : "false"}
      className={`@container w-full [--ink:var(--color-foreground)] [--sheen-k:1] dark:[--ink:var(--color-background)] dark:[--sheen-k:0.7] ${className}`}
    >
      <div className={`grid items-center gap-10 @3xl:gap-14 @5xl:gap-20 ${grid}`}>
        <div className="min-w-0">
          {eyebrow && <p data-eyebrow className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>}
          <h2 className="text-[32px] font-semibold leading-[1.05] tracking-tight @3xl:text-[40px]">{heading}</h2>
          {lead && <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground @3xl:text-[16px]">{lead}</p>}
          <form data-form noValidate onSubmit={submit} className="mt-7 flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor={`${baseId}-email`} className="sr-only">Email</label>
              <input
                ref={inputRef}
                id={`${baseId}-email`}
                data-input
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                spellCheck={false}
                placeholder={placeholder}
                value={email}
                disabled={issued}
                readOnly={submitting}
                aria-invalid={showInvalid || status === "error" ? true : undefined}
                aria-describedby={line ? helpId : undefined}
                onChange={(event) => changeEmail(event.target.value)}
                onBlur={() => { if (email.length > 0) setTouched(true); }}
                className="h-11 w-full min-w-[160px] rounded-xl border border-border bg-background px-3.5 text-[15px] text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-300 motion-reduce:transition-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-default disabled:bg-muted/60 disabled:text-muted-foreground read-only:text-muted-foreground"
              />
            </div>
            <button
              ref={buttonRef}
              type="submit"
              data-submit
              data-button-state={issued ? "issued" : status}
              disabled={!valid || submitting || issued}
              aria-busy={submitting || undefined}
              className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl px-4 text-sm font-medium outline-none transition-[background-color,color,opacity] duration-300 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default ${issued ? "bg-chart-2/15 text-foreground" : status === "error" ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"}`}
            >
              {submitting && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {issued && <Check className="size-4 text-chart-2" aria-hidden="true" />}
              {status === "error" && !issued && <RotateCcw className="size-3.5" aria-hidden="true" />}
              <span>{issued ? issuedLabel : submitting ? submittingLabel : status === "error" ? retryLabel : submitLabel}</span>
            </button>
          </form>
          <p id={helpId} data-help data-help-kind={status === "error" ? "error" : showInvalid ? "invalid" : "note"} className="mt-3 min-h-5 text-[12.5px] leading-5 text-muted-foreground">{line}</p>
          <p role="status" aria-live="polite" className="sr-only">{announce}</p>
        </div>

        <div ref={stageRef} data-stage data-breathing={!issued && !reduced ? "true" : "false"} className={`w-[360px] max-w-full will-change-transform ${place}`} style={{ perspective: "900px" }}>
          <div
            ref={passRef}
            data-pass
            data-tracking="false"
            role="img"
            aria-label={passDescription}
            className="relative aspect-[1.586] w-full overflow-hidden rounded-[20px] bg-foreground text-background ring-1 ring-inset ring-background/15 will-change-transform"
            style={{
              ...REST,
              transformStyle: "preserve-3d",
              transform: "rotateX(var(--ry)) rotateY(var(--rx))",
              boxShadow: "var(--shx) var(--shy) 48px -16px color-mix(in oklch, var(--ink) 45%, transparent), 0 1px 2px color-mix(in oklch, var(--ink) 25%, transparent)",
              backgroundImage: "linear-gradient(to right, color-mix(in oklch, var(--color-background) 7%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--color-background) 7%, transparent) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              backgroundPosition: "11px 11px",
            }}
          >
            <div className="absolute inset-y-0 left-0 flex w-[calc(100%-64px)] flex-col justify-between p-5">
              <div className="flex items-center gap-2.5 text-background">
                <span data-mark className="flex shrink-0 items-center justify-center [&>svg]:size-[18px]">{brand.mark ?? <DefaultMark />}</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.22em] opacity-80">{brand.name} · {passLabel}</span>
              </div>
              <div className="min-w-0">
                <span ref={nameRef} data-name data-empty={issued ? "false" : "true"} className={`block truncate text-[26px] font-semibold leading-none tracking-tight ${issued ? "" : "opacity-35"}`}>{issued ? name || namePlaceholder : namePlaceholder}</span>
              </div>
              <div className="flex items-end justify-between gap-4">
                <div className="flex items-end gap-5">
                  <div>
                    <span className="block text-[9px] font-medium uppercase tracking-[0.2em] opacity-60">No.</span>
                    <span ref={numberRef} data-number data-value={issued ? pass.number : ""} data-rolling="false" className={`mt-0.5 block text-[15px] font-medium leading-none tabular-nums tracking-tight ${issued ? "" : "opacity-35"}`}>{issued ? numberFormat(pass.number) : "——"}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-medium uppercase tracking-[0.2em] opacity-60">Issued</span>
                    <span ref={dateRef} data-issued-at className={`mt-0.5 block text-[11px] leading-none tabular-nums ${issued ? "" : "opacity-35"}`}>{issued ? issuedAt : "——"}</span>
                  </div>
                </div>
                <span data-barcode aria-hidden="true" className="flex h-5 items-end gap-[2px] opacity-70">
                  {BARS.map((width, index) => <span key={index} className="block h-full bg-background" style={{ width }} />)}
                </span>
              </div>
            </div>
            <div data-tear className="absolute inset-y-0 right-0 flex w-16 items-center justify-center border-l border-dashed border-background/30">
              <span aria-hidden="true" className="absolute -top-1.5 left-0 size-3 -translate-x-1/2 rounded-full bg-background" />
              <span aria-hidden="true" className="absolute -bottom-1.5 left-0 size-3 -translate-x-1/2 rounded-full bg-background" />
              <span className="text-[10px] font-medium uppercase tracking-[0.3em] opacity-70 [writing-mode:vertical-rl] rotate-180">{tearLabel}</span>
            </div>
            {sheen && (
              <>
                <span
                  ref={sheenRef}
                  data-sheen
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-screen transition-opacity duration-500 motion-reduce:transition-none dark:mix-blend-multiply ${issued && !reduced ? "opacity-100" : "opacity-0"}`}
                  style={{
                    backgroundImage: "radial-gradient(200px circle at var(--mx) var(--my), color-mix(in oklch, var(--color-chart-2) calc(12% * var(--sheen-k)), transparent), transparent 70%), linear-gradient(115deg, transparent 36%, color-mix(in oklch, var(--color-chart-3) calc(11% * var(--sheen-k)), transparent) 46%, color-mix(in oklch, var(--color-chart-2) calc(15% * var(--sheen-k)), transparent) 54%, transparent 64%)",
                    backgroundSize: "100% 100%, 220% 100%",
                    backgroundPosition: "0 0, var(--sheen-x) 0",
                    backgroundRepeat: "no-repeat",
                  }}
                />
                <span
                  ref={sweepRef}
                  data-sweep
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-[120%] mix-blend-screen dark:mix-blend-multiply"
                  style={{ backgroundImage: "linear-gradient(115deg, transparent 38%, color-mix(in oklch, var(--color-chart-3) calc(14% * var(--sheen-k)), transparent) 47%, color-mix(in oklch, var(--color-chart-2) calc(18% * var(--sheen-k)), transparent) 53%, transparent 62%)" }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default EarlyAccessPassCta;
