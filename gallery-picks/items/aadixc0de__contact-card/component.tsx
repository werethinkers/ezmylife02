/*
 * Contact Card
 * Author: @aadixc0de   Source: https://21st.dev/@aadixc0de/components/contact-card   21st.dev id: 45590
 * Licence: covered by the paid 21st.dev plan Ezyourlife bought on 14 Nov 2026 (the API returns no
 * per-component licence text, so the author's own terms were not checked line by line).
 * Kept as published; only this header was added.
 */
// @ts-nocheck
/* eslint-disable */
"use client"

// From chatcn, chat, voice and agent UI for shadcn: https://chatcn.dev

import * as React from "react"
import { forwardRef, createElement, type SVGAttributes, type ForwardRefExoticComponent, type RefAttributes } from "react"
import { cn } from "@/lib/utils"

/** chatcn theme variables and utilities this file uses, light and dark. */
const CHATCN_CSS = ":root{--chatcn-accent:var(--chatcn-gray-1000);--chatcn-alpha-200:oklch(0 0 0 / 0.05);--chatcn-amber:oklch(0.555 0.125 60);--chatcn-bg:oklch(1 0 0);--chatcn-border:var(--chatcn-gray-400);--chatcn-card:oklch(1 0 0);--chatcn-ease-out:cubic-bezier(0.23, 1, 0.32, 1);--chatcn-ease-standard:ease;--chatcn-fg:var(--chatcn-gray-1000);--chatcn-fg-faint:var(--chatcn-gray-700);--chatcn-fg-muted:var(--chatcn-gray-900);--chatcn-fg-subtle:var(--chatcn-gray-800);--chatcn-fill:var(--chatcn-gray-100);--chatcn-fill-hover:var(--chatcn-gray-200);--chatcn-gray-100:oklch(0.970 0 0);--chatcn-gray-1000:oklch(0.145 0 0);--chatcn-gray-200:oklch(0.950 0 0);--chatcn-gray-400:oklch(0.910 0 0);--chatcn-gray-700:oklch(0.700 0 0);--chatcn-gray-800:oklch(0.525 0 0);--chatcn-gray-900:oklch(0.440 0 0);--chatcn-green:oklch(0.530 0.130 150);--chatcn-press-scale:0.97;--chatcn-press-scale-icon:0.94;--chatcn-primary:var(--chatcn-gray-1000);--chatcn-primary-fg:var(--chatcn-bg);--chatcn-primary-hover:var(--chatcn-gray-900);--chatcn-radius-lg:12px;--chatcn-radius-md:8px;--chatcn-radius-sm:6px;--chatcn-radius-xs:4px;--chatcn-red:oklch(0.560 0.200 27);--chatcn-shadow-sm:0 0 0 1px oklch(0 0 0 / 0.06), 0 1px 2px -1px oklch(0 0 0 / 0.06), 0 2px 4px oklch(0 0 0 / 0.04);--chatcn-shadow-xs:0 0 0 1px oklch(0 0 0 / 0.08), 0 1px 2px oklch(0 0 0 / 0.04)}.dark{--chatcn-accent:var(--chatcn-gray-1000);--chatcn-alpha-200:oklch(1 0 0 / 0.06);--chatcn-amber:oklch(0.800 0.140 74);--chatcn-bg:oklch(0.145 0 0);--chatcn-border:var(--chatcn-gray-400);--chatcn-card:oklch(0.175 0 0);--chatcn-fg:var(--chatcn-gray-1000);--chatcn-fg-faint:var(--chatcn-gray-700);--chatcn-fg-muted:var(--chatcn-gray-900);--chatcn-fg-subtle:var(--chatcn-gray-800);--chatcn-fill:var(--chatcn-gray-100);--chatcn-fill-hover:var(--chatcn-gray-200);--chatcn-gray-100:oklch(0.195 0 0);--chatcn-gray-1000:oklch(0.970 0 0);--chatcn-gray-200:oklch(0.225 0 0);--chatcn-gray-400:oklch(0.285 0 0);--chatcn-gray-700:oklch(0.500 0 0);--chatcn-gray-800:oklch(0.620 0 0);--chatcn-gray-900:oklch(0.720 0 0);--chatcn-green:oklch(0.760 0.150 152);--chatcn-primary:var(--chatcn-gray-1000);--chatcn-primary-fg:var(--chatcn-bg);--chatcn-primary-hover:var(--chatcn-gray-900);--chatcn-red:oklch(0.700 0.175 22);--chatcn-shadow-sm:0 0 0 1px oklch(1 0 0 / 0.08), inset 0 1px 0 oklch(1 0 0 / 0.03), 0 2px 4px oklch(0 0 0 / 0.4);--chatcn-shadow-xs:0 0 0 1px oklch(1 0 0 / 0.08), 0 1px 2px oklch(0 0 0 / 0.4)}.chatcn-focus{}.chatcn-focus:focus-visible{outline: 2px solid var(--chatcn-accent); outline-offset: 2px;}@media (prefers-reduced-motion: reduce){:root{--chatcn-press-scale:1;--chatcn-press-scale-icon:1;--chatcn-enter-scale:1}}"
if (typeof document !== "undefined" && !document.getElementById("chatcn-contact-card")) {
  const style = document.createElement("style")
  style.id = "chatcn-contact-card"
  style.textContent = CHATCN_CSS
  document.head.appendChild(style)
}

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/

export interface ContactLink {
  /** "Website", "GitHub", "LinkedIn". Text only: the kit draws no brand marks here. */
  label: string
  href: string
}

export interface ContactHours {
  /** 0 is Sunday. Days without an entry are closed. */
  day: number
  /** "08:00", 24 hour, in the contact's time zone. */
  open: string
  /** "18:00". A close earlier than open runs past midnight. */
  close: string
}

/** Every word the card shows or announces. Pass any of them through `labels` to translate. */
export interface ContactCardLabels {
  /** Sunday first, as `Date.getDay()` counts. */
  dayNames: readonly [string, string, string, string, string, string, string]
  openNow: string
  closesSoon: string
  until: (time: string) => string
  closed: string
  opens: (day: string | undefined, time: string) => string
  hours: string
  openingHours: string
  slot: (open: string, close: string) => string
  localTime: string
  sameTime: string
  /** "4 h 30 min" ahead or behind. */
  offset: (hours: number, minutes: number, ahead: boolean) => string
  email: string
  call: string
  emailPerson: (name: string) => string
  callPerson: (name: string) => string
  phone: string
  address: string
  links: string
  copyField: (field: string) => string
  copyEmail: string
  copyPhone: string
  copy: string
  copyContact: string
  unavailable: string
  retry: string
  noContact: string
  noMatch: string
}

export interface ContactCardProps extends Omit<React.ComponentProps<"div">, "children"> {
  kind?: "person" | "business"
  name?: string
  avatar?: string
  /** A person's job: "Staff engineer". */
  jobTitle?: string
  /** A business's category: "Bakery". */
  category?: string
  company?: string
  pronouns?: string
  email?: string
  phone?: string
  links?: ContactLink[]
  /** IANA zone. Shows their local time and how far it is from yours. */
  timeZone?: string
  address?: string
  /** Opens maps for the address. */
  addressHref?: string
  /** Business opening hours. Drives the open now line. */
  hours?: ContactHours[]
  /** Out of 5, for businesses. */
  rating?: number
  reviewCount?: number
  /** Fix the clock, for tests and screenshots. Defaults to now, refreshed every minute. */
  now?: Date | number
  locale?: string
  onEmail?: () => void
  onCall?: () => void
  layout?: "full" | "compact"
  loading?: boolean
  error?: React.ReactNode
  onRetry?: () => void
  empty?: React.ReactNode
  /** Translate or reword any text the card shows or announces. */
  labels?: Partial<ContactCardLabels>
}

const DEFAULT_LABELS: ContactCardLabels = {
  dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  openNow: "Open now",
  closesSoon: "Closes soon",
  until: (time) => `until ${time}`,
  closed: "Closed",
  opens: (day, time) => `opens ${day ? `${day} ` : ""}${time}`,
  hours: "Hours",
  openingHours: "Opening hours",
  slot: (open, close) => `${open} to ${close}`,
  localTime: "local time",
  sameTime: "same time as you",
  offset: (h, m, ahead) => `${m ? `${h} h ${m} min` : `${h} h`} ${ahead ? "ahead" : "behind"}`,
  email: "Email",
  call: "Call",
  emailPerson: (name) => `Email ${name}`,
  callPerson: (name) => `Call ${name}`,
  phone: "Phone",
  address: "Address",
  links: "Links",
  copyField: (field) => `Copy ${field.toLowerCase()}`,
  copyEmail: "Copy email",
  copyPhone: "Copy phone number",
  copy: "Copy",
  copyContact: "Copy contact",
  unavailable: "Contact unavailable",
  retry: "Try again",
  noContact: "No contact found",
  noMatch: "Nobody matched that name. Try a last name or an email address.",
}

/* -------------------------------------------------------------------------------------------------
 * Time
 * -----------------------------------------------------------------------------------------------*/

function useNow(fixed?: Date | number) {
  const [now, setNow] = React.useState(() => (fixed !== undefined ? new Date(fixed) : null))
  React.useEffect(() => {
    if (fixed !== undefined) {
      setNow(new Date(fixed))
      return
    }
    setNow(new Date())
    let interval: number | undefined
    // Tick on the minute so the clock never shows a stale minute.
    const first = window.setTimeout(
      () => {
        setNow(new Date())
        interval = window.setInterval(() => setNow(new Date()), 60_000)
      },
      60_000 - (Date.now() % 60_000),
    )
    return () => {
      window.clearTimeout(first)
      if (interval) window.clearInterval(interval)
    }
  }, [fixed])
  return now
}

/** Offset of a zone from UTC in minutes at a given instant. */
function offset(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"))
  return Math.round((asUtc - Math.floor(date.getTime() / 60_000) * 60_000) / 60_000)
}

type OpenState =
  | { open: true; closesAt: string; soon: boolean }
  | { open: false; opensAt?: string; opensDay?: number }

/** Weekday (0 Sunday) and minutes since midnight in a zone. */
function zoned(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ""
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"))
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) }
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** Works out open or closed, including hours that run past midnight. */
function openState(hours: ContactHours[], date: Date, timeZone?: string): OpenState {
  const { day, minutes } = zoned(date, timeZone)
  for (const h of hours) {
    const o = toMinutes(h.open)
    const c = toMinutes(h.close)
    const overnight = c <= o
    const today = h.day === day && minutes >= o && (overnight || minutes < c)
    const spill = overnight && (h.day + 1) % 7 === day && minutes < c
    if (today || spill) {
      const left = today && !overnight ? c - minutes : spill ? c - minutes : c + 1440 - minutes
      return { open: true, closesAt: h.close, soon: left <= 60 }
    }
  }
  for (let i = 0; i < 7; i++) {
    const d = (day + i) % 7
    const next = hours
      .filter((h) => h.day === d && (i > 0 || toMinutes(h.open) > minutes))
      .sort((a, b) => toMinutes(a.open) - toMinutes(b.open))[0]
    if (next) return { open: false, opensAt: next.open, opensDay: i === 0 ? undefined : d }
  }
  return { open: false }
}

/* -------------------------------------------------------------------------------------------------
 * ContactCard
 * -----------------------------------------------------------------------------------------------*/

const surface =
  "text-[0.875rem]/[1.25rem] tracking-[-0.003em] text-(color:--chatcn-fg) rounded-(--chatcn-radius-lg) bg-(color:--chatcn-card) shadow-(--chatcn-shadow-sm) flex min-w-0 flex-col"

interface IconProps extends SVGAttributes<SVGSVGElement> {
  /** Width and height. Number means px. Default 24. */
  size?: number | string
  /** Stroke width in viewBox units (24 grid). Default 1.5. */
  strokeWidth?: number | string
  /** Keep the rendered stroke at `strokeWidth` px at any size. */
  absoluteStrokeWidth?: boolean
  /** Stroke color. Default currentColor. */
  color?: string
  /** Accessible name. Renders <title> and sets role="img"; without it the icon is aria-hidden. */
  title?: string
}

type Icon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>

/** Shape elements an icon may contain. */
type IconElement = "path" | "circle" | "rect" | "ellipse" | "line" | "polyline" | "polygon"

/** An icon's drawing: a flat list of [element, attributes] pairs, lucide compatible. */
type IconNode = ReadonlyArray<readonly [IconElement, Readonly<Record<string, string>>]>

const toPascal = (name: string): string =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")

/**
 * Builds a React icon component from an icon node.
 * `name` is the kebab-case icon name, used for the class `chatcn-icon-<name>` and displayName.
 */
function createIcon(name: string, iconNode: IconNode): Icon {
  // biome-ignore lint/correctness/noComponentHookFactories: runs once per icon at module load
  const Component = forwardRef<SVGSVGElement, IconProps>(function ChatcnIcon(
    {
      size = 24,
      strokeWidth = 1.5,
      absoluteStrokeWidth = false,
      color = "currentColor",
      title,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const stroke = absoluteStrokeWidth
      ? (Number(strokeWidth) * 24) / Number.parseFloat(String(size))
      : strokeWidth
    const labelled = Boolean(title || rest["aria-label"] || rest["aria-labelledby"])
    return createElement(
      "svg",
      {
        ref,
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: color,
        strokeWidth: stroke,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "data-slot": "icon",
        className: className
          ? `chatcn-icon chatcn-icon-${name} ${className}`
          : `chatcn-icon chatcn-icon-${name}`,
        ...(labelled ? { role: "img" } : { "aria-hidden": true }),
        ...rest,
      },
      title ? createElement("title", null, title) : null,
      ...iconNode.map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs })),
      children,
    )
  })
  Component.displayName = `${toPascal(name)}Icon`
  return Component
}

const iconNode: IconNode = [
  ["path", {"d":"M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0"}],
  ["path", {"d":"M12 7.75v5"}],
  ["path", {"d":"M12 16.25h.01"}],
]

const CircleAlertIcon: Icon = /* @__PURE__ */ createIcon("circle-alert", iconNode)

type ButtonVariant = "solid" | "outline" | "ghost" | "subtle"

type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon-xs" | "icon-sm" | "icon-md" | "icon-lg"

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const base = cn(
  "chatcn-focus inline-flex shrink-0 items-center justify-center gap-1.5 font-medium whitespace-nowrap select-none",
  "ease-(--chatcn-ease-standard) transition-[background-color,color,box-shadow,scale] duration-150",
  "active:scale-(--chatcn-press-scale) active:duration-100 disabled:pointer-events-none disabled:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0",
)

const variants: Record<ButtonVariant, string> = {
  solid: "bg-(color:--chatcn-primary) text-(color:--chatcn-primary-fg) hover:bg-(color:--chatcn-primary-hover)",
  outline: "bg-(color:--chatcn-card) text-(color:--chatcn-fg) shadow-(--chatcn-shadow-xs) hover:bg-(color:--chatcn-fill-hover)",
  ghost: "text-(color:--chatcn-fg-muted) hover:bg-(color:--chatcn-fill-hover) hover:text-(color:--chatcn-fg)",
  subtle: "bg-(color:--chatcn-fill) text-(color:--chatcn-fg) hover:bg-(color:--chatcn-fill-hover)",
}

// Heights follow the control scale: 24, 28, 32, 36. Radii stay concentric inside 12 px surfaces.
const sizes: Record<ButtonSize, string> = {
  xs: "h-6 rounded-(--chatcn-radius-sm) px-2 text-[0.75rem]/[1rem] [&_svg]:size-3.5",
  sm: "h-7 rounded-(--chatcn-radius-sm) px-2.5 text-[0.8125rem]/[1.25rem] [&_svg]:size-3.5",
  md: "h-8 rounded-(--chatcn-radius-md) px-3 text-[0.875rem]/[1.25rem] tracking-[-0.003em] [&_svg]:size-4",
  lg: "h-9 rounded-(--chatcn-radius-md) px-3.5 text-[0.875rem]/[1.25rem] tracking-[-0.003em] [&_svg]:size-4",
  "icon-xs": "size-6 rounded-(--chatcn-radius-sm) active:scale-(--chatcn-press-scale-icon) [&_svg]:size-3.5",
  "icon-sm": "size-7 rounded-(--chatcn-radius-sm) active:scale-(--chatcn-press-scale-icon) [&_svg]:size-3.5",
  "icon-md": "size-8 rounded-(--chatcn-radius-md) active:scale-(--chatcn-press-scale-icon) [&_svg]:size-4",
  "icon-lg": "size-9 rounded-(--chatcn-radius-md) active:scale-(--chatcn-press-scale-icon) [&_svg]:size-4",
}

/** Class names for anything that should look like a button, such as a link. */
function buttonVariants({
  variant = "ghost",
  size = "md",
}: {
  variant?: ButtonVariant
  size?: ButtonSize
} = {}) {
  return cn(base, variants[variant], sizes[size])
}

function Button({
  variant = "ghost",
  size = "md",
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      data-slot="button"
      data-variant={variant}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

const iconNode2: IconNode = [
  ["path", {"d":"M5.49 17.46A8.5 8.5 0 1 0 6.54 5.49"}],
  ["path", {"d":"m8.21 8.65-2.94-.26a2 2 0 0 1-1.82-2.16l.26-2.94"}],
]

const RotateCcwIcon: Icon = /* @__PURE__ */ createIcon("rotate-ccw", iconNode2)

const iconNode3: IconNode = [
  ["path", {"d":"M5 7.75a4 4 0 1 0 8 0 4 4 0 1 0-8 0"}],
  ["path", {"d":"M2.5 21v-1.5a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4V21"}],
  ["path", {"d":"m17 8.5 4 4"}],
  ["path", {"d":"m21 8.5-4 4"}],
]

const UserXIcon: Icon = /* @__PURE__ */ createIcon("user-x", iconNode3)

const iconNode4: IconNode = [
  ["path", {"d":"M5.75 5h12.5a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5.75a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3"}],
  ["path", {"d":"m3.75 7.5 6.86 4.58a2.5 2.5 0 0 0 2.78 0l6.86-4.58"}],
]

const MailIcon: Icon = /* @__PURE__ */ createIcon("mail", iconNode4)

const iconNode5: IconNode = [
  ["path", {"d":"M19 21A16 16 0 0 1 3 5a2 2 0 0 1 2-2h2.33a1.5 1.5 0 0 1 1.45 1.14L9.5 7a1.5 1.5 0 0 1-.6 1.59L7.25 9.75a12.67 12.67 0 0 0 7 7l1.16-1.65a1.5 1.5 0 0 1 1.59-.6l2.86.72A1.5 1.5 0 0 1 21 16.67V19a2 2 0 0 1-2 2"}],
]

const PhoneIcon: Icon = /* @__PURE__ */ createIcon("phone", iconNode5)

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")
  ).toUpperCase()
}

/* -------------------------------------------------------------------------------------------------
 * Pieces
 * -----------------------------------------------------------------------------------------------*/

function Avatar({
  name,
  src,
  business,
  size,
}: {
  name: string
  src?: string
  business?: boolean
  size: "md" | "lg"
}) {
  const [failed, setFailed] = React.useState(false)
  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-(color:--chatcn-gray-200) text-(color:--chatcn-fg-muted) relative grid shrink-0 place-items-center overflow-hidden font-medium",
        business ? "rounded-(--chatcn-radius-md)" : "rounded-full",
        size === "lg" ? "text-[1rem]/[1.5rem] tracking-[-0.01em] size-12" : "text-[0.8125rem]/[1.25rem] size-9",
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        initials(name)
      )}
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_var(--chatcn-alpha-200)]" />
    </span>
  )
}

interface CopyButtonProps extends Omit<ButtonProps, "value" | "onCopy"> {
  value: string | (() => string)
  label?: string
  onCopy?: (value: string) => void
}

const iconNode6: IconNode = [
  ["path", {"d":"M11.5 9h7a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 9 18.5v-7A2.5 2.5 0 0 1 11.5 9"}],
  ["path", {"d":"M6 15h-.5A2.5 2.5 0 0 1 3 12.5v-7A2.5 2.5 0 0 1 5.5 3h7A2.5 2.5 0 0 1 15 5.5V6"}],
]

const CopyIcon: Icon = /* @__PURE__ */ createIcon("copy", iconNode6)

const iconNode7: IconNode = [
  ["path", {"d":"m4.5 12.75 3.23 3.23a2.5 2.5 0 0 0 3.54 0l8.48-8.48"}],
]

const CheckIcon: Icon = /* @__PURE__ */ createIcon("check", iconNode7)

/** Copy swaps to a check with a 150 ms blur crossfade, holds for 1.5 s and announces itself. */
function CopyButton({
  value,
  label = "Copy",
  onCopy,
  onClick,
  children,
  size = "icon-sm",
  className,
  ...props
}: CopyButtonProps) {
  // A counter, not a flag: copying again while the check shows restarts the 1.5 s hold.
  const [copies, setCopies] = React.useState(0)
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copies) return
    setCopied(true)
    const id = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(id)
  }, [copies])

  // Reduced motion keeps the crossfade and drops the scale and blur.
  const layer = cn(
    "ease-(--chatcn-ease-out) absolute transition-[opacity,scale,filter] duration-150",
    "motion-reduce:scale-100 motion-reduce:blur-none motion-reduce:transition-opacity",
  )
  return (
    <Button
      {...props}
      size={size}
      aria-label={children ? undefined : copied ? "Copied" : label}
      onClick={(event) => {
        // Compose with handlers injected by wrappers such as Tooltip instead of replacing them.
        onClick?.(event)
        if (event.defaultPrevented) return
        const text = typeof value === "function" ? value() : value
        navigator.clipboard
          ?.writeText(text)
          .then(() => {
            setCopies((n) => n + 1)
            onCopy?.(text)
          })
          // Clipboard access can be denied (insecure context, permissions). Stay quiet and unchanged.
          .catch(() => {})
      }}
      className={cn("relative", className)}
    >
      {children ? (
        <>
          <span className="relative grid size-3.5 place-items-center">
            <CopyIcon
              className={cn(
                layer,
                copied ? "scale-75 opacity-0 blur-[2px]" : "scale-100 opacity-100",
              )}
            />
            <CheckIcon
              className={cn(
                layer,
                copied ? "scale-100 opacity-100" : "scale-75 opacity-0 blur-[2px]",
              )}
            />
          </span>
          {children}
        </>
      ) : null}
      {children ? null : (
        <>
          <CopyIcon
            className={cn(
              layer,
              copied ? "scale-75 opacity-0 blur-[2px]" : "scale-100 opacity-100",
            )}
          />
          <CheckIcon
            className={cn(
              layer,
              copied ? "scale-100 opacity-100" : "scale-75 opacity-0 blur-[2px]",
            )}
          />
        </>
      )}
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </Button>
  )
}

const iconNode8: IconNode = [
  ["path", {"d":"m13.39 6.07.96 2.39a1 1 0 0 0 .86.62l2.57.18a1.5 1.5 0 0 1 .86 2.64l-1.97 1.66a1 1 0 0 0-.33 1.01l.63 2.5a1.5 1.5 0 0 1-2.26 1.63l-2.18-1.37a1 1 0 0 0-1.06 0L9.29 18.7a1.5 1.5 0 0 1-2.26-1.63l.63-2.5a1 1 0 0 0-.33-1.01L5.36 11.9a1.5 1.5 0 0 1 .86-2.64l2.57-.18a1 1 0 0 0 .86-.62l.96-2.39a1.5 1.5 0 0 1 2.78 0"}],
]

const StarIcon: Icon = /* @__PURE__ */ createIcon("star", iconNode8)

const iconNode9: IconNode = [
  ["path", {"d":"M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0"}],
  ["path", {"d":"M12 6.75v4.26a1.75 1.75 0 0 0 .85 1.5l2.9 1.74"}],
]

const ClockIcon: Icon = /* @__PURE__ */ createIcon("clock", iconNode9)

const iconNode10: IconNode = [
  ["path", {"d":"m6 9.25 4.23 4.23a2.5 2.5 0 0 0 3.54 0L18 9.25"}],
]

const ChevronDownIcon: Icon = /* @__PURE__ */ createIcon("chevron-down", iconNode10)

/** A detail row with a copy button that appears on hover or focus, and always on touch. */
function Field({
  icon,
  label,
  copy,
  copyLabel,
  children,
}: {
  icon: React.ReactNode
  label: string
  copy?: string
  copyLabel?: string
  children: React.ReactNode
}) {
  return (
    <div className="group/field flex min-h-8 items-center gap-3">
      <span aria-hidden="true" className="text-(color:--chatcn-fg-subtle) shrink-0 [&_svg]:size-4">
        {icon}
      </span>
      <span className="sr-only">{label}: </span>
      <div className="text-[0.8125rem]/[1.25rem] text-(color:--chatcn-fg-muted) flex min-w-0 flex-1 items-center">
        {children}
      </div>
      {copy ? (
        <CopyButton
          size="icon-xs"
          value={copy}
          label={copyLabel ?? label}
          className={cn(
            "-me-1 opacity-0 group-focus-within/field:opacity-100 group-hover/field:opacity-100 focus-visible:opacity-100",
            "pointer-coarse:size-11 pointer-coarse:opacity-100",
          )}
        />
      ) : null}
    </div>
  )
}

const linkClass =
  "chatcn-focus rounded-(--chatcn-radius-xs) min-w-0 truncate underline-offset-2 hover:text-(color:--chatcn-fg) hover:underline"

const iconNode11: IconNode = [
  ["path", {"d":"M6.23 14.54a7.5 7.5 0 1 1 11.54 0l-3.85 4.64a2.5 2.5 0 0 1-3.84 0z"}],
  ["path", {"d":"M9.25 9.75a2.75 2.75 0 1 0 5.5 0 2.75 2.75 0 1 0-5.5 0"}],
]

const MapPinIcon: Icon = /* @__PURE__ */ createIcon("map-pin", iconNode11)

const iconNode12: IconNode = [
  ["path", {"d":"M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0"}],
  ["path", {"d":"M12.72 3.8a11.9 11.9 0 0 1 0 16.4 1 1 0 0 1-1.44 0 11.9 11.9 0 0 1 0-16.4 1 1 0 0 1 1.44 0"}],
  ["path", {"d":"M3 12h2.25"}],
  ["path", {"d":"M10.75 12h2.5"}],
  ["path", {"d":"M18.75 12H21"}],
]

const GlobeIcon: Icon = /* @__PURE__ */ createIcon("globe", iconNode12)

const iconNode13: IconNode = [
  ["path", {"d":"M10.5 6.5h-4a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-4"}],
  ["path", {"d":"M14.5 3.5H18A2.5 2.5 0 0 1 20.5 6v3.5"}],
  ["path", {"d":"m10.5 13.5 6.46-6.46"}],
]

const ExternalLinkIcon: Icon = /* @__PURE__ */ createIcon("external-link", iconNode13)

/**
 * A person or a business the agent found. People show their local time and how far it is from
 * yours, so you know whether to call. Businesses show whether they are open right now, worked out
 * from their hours in their own zone, with the week one click away. Every value copies.
 */
export function ContactCard({
  kind = "person",
  name,
  avatar,
  jobTitle,
  category,
  company,
  pronouns,
  email,
  phone,
  links,
  timeZone,
  address,
  addressHref,
  hours,
  rating,
  reviewCount,
  now: nowProp,
  locale = "en-US",
  onEmail,
  onCall,
  layout = "full",
  loading = false,
  error,
  onRetry,
  empty,
  labels: labelsProp,
  className,
  ...props
}: ContactCardProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp }
  const now = useNow(nowProp)
  const [showWeek, setShowWeek] = React.useState(false)
  const weekId = React.useId()
  const business = kind === "business"
  const compact = layout === "compact"

  const clock = React.useMemo(() => {
    if (!now || !timeZone) return null
    try {
      const time = new Intl.DateTimeFormat(locale, {
        timeZone,
        hour: "numeric",
        minute: "2-digit",
      }).format(now)
      const diff = offset(now, timeZone) - offset(now)
      const relation =
        diff === 0
          ? labels.sameTime
          : labels.offset(Math.floor(Math.abs(diff) / 60), Math.abs(diff) % 60, diff > 0)
      return { time, relation }
    } catch {
      return null
    }
  }, [now, timeZone, locale])

  const open = React.useMemo(
    () => (now && hours?.length ? openState(hours, now, timeZone) : null),
    [now, hours, timeZone],
  )
  const today = now ? zoned(now, timeZone).day : -1

  if (error) {
    return (
      <div
        data-slot="contact-card"
        data-contact-state="error"
        role="alert"
        className={cn(surface, "gap-2 p-4", className)}
        {...props}
      >
        <div className="flex items-center gap-2">
          <CircleAlertIcon aria-hidden="true" className="text-(color:--chatcn-red) size-4 shrink-0" />
          <span className="font-medium">{labels.unavailable}</span>
        </div>
        <p className="text-[0.8125rem]/[1.25rem] text-(color:--chatcn-fg-subtle) ps-6 text-pretty">{error}</p>
        {onRetry ? (
          <Button size="sm" variant="outline" className="ms-6 self-start" onClick={onRetry}>
            <RotateCcwIcon />
            {labels.retry}
          </Button>
        ) : null}
      </div>
    )
  }

  if (loading) {
    return (
      <div
        data-slot="contact-card"
        data-contact-state="loading"
        aria-busy="true"
        className={cn(surface, compact ? "p-3" : "", className)}
        {...props}
      >
        <span className="sr-only">Loading contact</span>
        <div aria-hidden="true" className={cn("flex items-center gap-3", !compact && "p-4")}>
          <span
            className={cn("bg-(color:--chatcn-fill) shrink-0 rounded-full", compact ? "size-9" : "size-12")}
          />
          <span className="flex flex-1 flex-col gap-2">
            <span className="bg-(color:--chatcn-fill) rounded-(--chatcn-radius-xs) h-3.5 w-2/5" />
            <span className="bg-(color:--chatcn-fill) rounded-(--chatcn-radius-xs) h-3 w-3/5" />
          </span>
        </div>
        {compact ? null : (
          <div aria-hidden="true" className="flex flex-col gap-4 px-4 pb-4">
            {["w-1/2", "w-2/5", "w-1/3"].map((w) => (
              <span key={w} className="flex items-center gap-3">
                <span className="bg-(color:--chatcn-fill) size-4 rounded-full" />
                <span className={cn("bg-(color:--chatcn-fill) rounded-(--chatcn-radius-xs) h-3", w)} />
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!name) {
    return (
      <div
        data-slot="contact-card"
        data-contact-state="empty"
        className={cn(surface, "flex-row items-start gap-3 p-4", className)}
        {...props}
      >
        <UserXIcon aria-hidden="true" className="text-(color:--chatcn-fg-subtle) mt-0.5 size-4 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{labels.noContact}</span>
          <span className="text-[0.8125rem]/[1.25rem] text-(color:--chatcn-fg-subtle) text-pretty">
            {empty ?? labels.noMatch}
          </span>
        </div>
      </div>
    )
  }

  const subtitle = [business ? category : jobTitle, company].filter(Boolean).join(" · ")

  const openLine = open ? (
    open.open ? (
      <span
        className={cn(
          "inline-flex items-center gap-1.5",
          open.soon ? "text-(color:--chatcn-amber)" : "text-(color:--chatcn-green)",
        )}
      >
        <span aria-hidden="true" className="size-1.5 rounded-[2px] bg-current" />
        <span className="font-medium">{open.soon ? labels.closesSoon : labels.openNow}</span>
        <span className="text-(color:--chatcn-fg-subtle)">· {labels.until(open.closesAt)}</span>
      </span>
    ) : (
      <span className="text-(color:--chatcn-fg-muted) inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="bg-(color:--chatcn-fg-subtle) size-1.5 rounded-[2px]" />
        <span className="font-medium">{labels.closed}</span>
        {open.opensAt ? (
          <span className="text-(color:--chatcn-fg-subtle)">
            ·{" "}
            {labels.opens(
              open.opensDay !== undefined ? labels.dayNames[open.opensDay] : undefined,
              open.opensAt,
            )}
          </span>
        ) : null}
      </span>
    )
  ) : null

  const actions = (
    <>
      {email ? (
        <a
          href={`mailto:${email}`}
          onClick={onEmail}
          aria-label={compact ? labels.emailPerson(name) : undefined}
          className={cn(
            buttonVariants({
              variant: compact ? "ghost" : "outline",
              size: compact ? "icon-sm" : "sm",
            }),
            "pointer-coarse:h-11",
            compact && "pointer-coarse:w-11",
          )}
        >
          <MailIcon />
          {compact ? null : labels.email}
        </a>
      ) : null}
      {phone ? (
        <a
          href={`tel:${phone.replace(/[^\d+]/g, "")}`}
          onClick={onCall}
          aria-label={compact ? labels.callPerson(name) : undefined}
          className={cn(
            buttonVariants({
              variant: compact ? "ghost" : "outline",
              size: compact ? "icon-sm" : "sm",
            }),
            "pointer-coarse:h-11",
            compact && "pointer-coarse:w-11",
          )}
        >
          <PhoneIcon />
          {compact ? null : labels.call}
        </a>
      ) : null}
    </>
  )

  if (compact) {
    return (
      <div
        data-slot="contact-card"
        data-contact-state="ready"
        data-layout="compact"
        className={cn(surface, "flex-row items-center gap-3 p-3", className)}
        {...props}
      >
        <Avatar name={name} src={avatar} business={business} size="md" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{name}</span>
          <span className="text-[0.8125rem]/[1.25rem] text-(color:--chatcn-fg-subtle) truncate">
            {business && openLine ? openLine : subtitle}
            {!business && clock ? <span className="tabular-nums"> · {clock.time}</span> : null}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {actions}
          {email || phone ? (
            <CopyButton
              size="icon-sm"
              value={email ?? phone ?? ""}
              label={email ? labels.copyEmail : labels.copyPhone}
              className="pointer-coarse:size-11"
            />
          ) : null}
        </div>
      </div>
    )
  }

  const week = hours?.length
    ? [1, 2, 3, 4, 5, 6, 0].map((d) => ({
        day: d,
        slots: hours
          .filter((h) => h.day === d)
          .sort((a, b) => toMinutes(a.open) - toMinutes(b.open)),
      }))
    : []

  return (
    <div
      data-slot="contact-card"
      data-contact-state="ready"
      data-layout="full"
      data-kind={kind}
      className={cn(surface, className)}
      {...props}
    >
      {/* Who */}
      <div className="flex items-center gap-3 p-4">
        <Avatar name={name} src={avatar} business={business} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="text-[0.9375rem]/[1.5rem] tracking-[-0.006em] flex min-w-0 items-baseline gap-1.5 font-medium tracking-tight">
            <span className="line-clamp-2 text-pretty">{name}</span>
            {pronouns ? (
              <span className="text-[0.75rem]/[1rem] text-(color:--chatcn-fg-subtle) shrink-0 font-normal">
                {pronouns}
              </span>
            ) : null}
          </h3>
          {subtitle ? (
            <p className="text-[0.8125rem]/[1.25rem] text-(color:--chatcn-fg-muted) truncate">{subtitle}</p>
          ) : null}
          {business && rating !== undefined ? (
            <p className="text-[0.75rem]/[1rem] text-(color:--chatcn-fg-subtle) flex items-center gap-1 tabular-nums">
              <StarIcon
                aria-hidden="true"
                className="text-(color:--chatcn-fg) size-3 fill-current [stroke-width:0]"
              />
              <span className="sr-only">Rated</span>
              <span className="text-(color:--chatcn-fg-muted)">{rating.toFixed(1)}</span>
              {reviewCount !== undefined ? (
                <span>
                  ({new Intl.NumberFormat(locale).format(reviewCount)}
                  <span className="sr-only"> reviews</span>)
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col px-4 pb-2">
        {business && openLine ? (
          <div className="flex flex-col">
            <div className="flex min-h-8 items-center gap-3">
              <ClockIcon aria-hidden="true" className="text-(color:--chatcn-fg-subtle) size-4 shrink-0" />
              <span className="text-[0.8125rem]/[1.25rem] min-w-0 flex-1 tabular-nums">{openLine}</span>
              {week.length ? (
                <button
                  type="button"
                  aria-expanded={showWeek}
                  aria-controls={weekId}
                  onClick={() => setShowWeek((v) => !v)}
                  className={cn(
                    "chatcn-focus rounded-(--chatcn-radius-sm) text-[0.75rem]/[1rem] text-(color:--chatcn-fg-subtle) -me-1.5 inline-flex h-6 shrink-0 items-center gap-1 px-1.5",
                    "hover:bg-(color:--chatcn-fill-hover) hover:text-(color:--chatcn-fg) ease-(--chatcn-ease-standard) transition-colors duration-150 pointer-coarse:h-11",
                  )}
                >
                  {labels.hours}
                  <ChevronDownIcon
                    aria-hidden="true"
                    className={cn(
                      "ease-(--chatcn-ease-out) size-3.5 transition-transform duration-200 motion-reduce:transition-none",
                      showWeek && "rotate-180",
                    )}
                  />
                </button>
              ) : null}
            </div>
            {showWeek ? (
              <table
                id={weekId}
                className="text-[0.8125rem]/[1.25rem] ms-7 mb-2 w-[calc(100%-1.75rem)] tabular-nums"
              >
                <caption className="sr-only">{labels.openingHours}</caption>
                <tbody>
                  {week.map((w) => (
                    <tr
                      key={w.day}
                      aria-current={w.day === today ? "date" : undefined}
                      className={
                        w.day === today ? "text-(color:--chatcn-fg) font-medium" : "text-(color:--chatcn-fg-muted)"
                      }
                    >
                      <th scope="row" className="py-0.5 text-start font-[inherit]">
                        {labels.dayNames[w.day]}
                      </th>
                      <td className="py-0.5 text-end">
                        {w.slots.length ? (
                          w.slots.map((s) => labels.slot(s.open, s.close)).join(", ")
                        ) : (
                          <span className="text-(color:--chatcn-fg-subtle)">{labels.closed}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        ) : null}
        {!business && clock ? (
          <Field icon={<ClockIcon />} label={labels.localTime}>
            <span className="tabular-nums">
              <span className="text-(color:--chatcn-fg)">{clock.time}</span> {labels.localTime}
              <span className="text-(color:--chatcn-fg-subtle)"> · {clock.relation}</span>
            </span>
          </Field>
        ) : null}
        {email ? (
          <Field
            icon={<MailIcon />}
            label={labels.email}
            copy={email}
            copyLabel={labels.copyField(labels.email)}
          >
            {/* Long addresses give way in the middle: the start of the name and the whole domain stay. */}
            <a
              href={`mailto:${email}`}
              onClick={onEmail}
              title={email}
              className={cn(linkClass, "inline-flex max-w-full min-w-0 align-top")}
            >
              {email.includes("@") ? (
                <>
                  <span className="min-w-0 truncate">{email.slice(0, email.lastIndexOf("@"))}</span>
                  <span className="shrink-0">{email.slice(email.lastIndexOf("@"))}</span>
                </>
              ) : (
                <span className="min-w-0 truncate">{email}</span>
              )}
            </a>
          </Field>
        ) : null}
        {phone ? (
          <Field
            icon={<PhoneIcon />}
            label={labels.phone}
            copy={phone}
            copyLabel={labels.copyField(labels.phone)}
          >
            <a
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              onClick={onCall}
              dir="ltr"
              className={cn(linkClass, "tabular-nums")}
            >
              {phone}
            </a>
          </Field>
        ) : null}
        {address ? (
          <Field
            icon={<MapPinIcon />}
            label={labels.address}
            copy={address}
            copyLabel={labels.copyField(labels.address)}
          >
            {addressHref ? (
              <a
                href={addressHref}
                target="_blank"
                rel="noreferrer"
                className={cn(linkClass, "whitespace-normal")}
              >
                {address}
              </a>
            ) : (
              <span className="text-pretty">{address}</span>
            )}
          </Field>
        ) : null}
        {links?.length ? (
          <Field icon={<GlobeIcon />} label={labels.links}>
            <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(linkClass, "inline-flex items-center gap-1")}
                >
                  {l.label}
                  <ExternalLinkIcon
                    aria-hidden="true"
                    className="text-(color:--chatcn-fg-faint) size-3 shrink-0"
                  />
                </a>
              ))}
            </span>
          </Field>
        ) : null}
      </div>

      {/* Actions */}
      {email || phone ? (
        <div className="border-(color:--chatcn-border) flex items-center gap-2 border-t px-4 py-3">
          {actions}
          <CopyButton
            size="sm"
            variant="ghost"
            value={() => [name, subtitle, email, phone, address].filter(Boolean).join("\n")}
            label={labels.copyContact}
            className="ms-auto pointer-coarse:h-11"
          >
            {labels.copy}
          </CopyButton>
        </div>
      ) : null}
    </div>
  )
}

export default ContactCard
