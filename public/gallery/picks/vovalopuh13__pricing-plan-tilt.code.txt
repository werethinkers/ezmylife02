/*
 * Pricing Plan Tilt
 * Author: @vovalopuh13   Source: https://21st.dev/@vovalopuh13/components/pricing-plan-tilt   21st.dev id: 46292
 * Licence: covered by the paid 21st.dev plan Ezyourlife bought on 14 Nov 2026 (the API returns no
 * per-component licence text, so the author's own terms were not checked line by line).
 * Kept as published; only this header was added.
 */
// @ts-nocheck
/* eslint-disable */
"use client"
import * as React from "react"
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion"
import { Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Plan {
  id: string
  name: string
  tagline: string
  /** Price per month when billed monthly. */
  monthly: number
  /** Price per month when billed yearly. */
  yearly: number
  features: string[]
  popular?: boolean
  cta?: string
}

export interface PricingPlanTiltProps {
  plans: Plan[]
  currency?: string
  title?: string
  /** Id of the plan that starts selected. */
  defaultPlanId?: string
  onSelect?: (planId: string, billing: "monthly" | "yearly") => void
  className?: string
}

const TANGERINE = "#ff8a1f"
const GRADIENT = `linear-gradient(125deg,var(--primary),${TANGERINE})`

/** Digits roll up or down when the number changes. */
function Roll({ value, dir }: { value: number; dir: 1 | -1 }) {
  const reduce = useReducedMotion()
  return (
    <span className="inline-flex tabular-nums" aria-label={String(value)}>
      {String(value).split("").map((d, i, a) => (
        <span key={a.length - i} className="relative inline-block h-[1.1em] overflow-hidden" aria-hidden>
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.span key={d} className="inline-block" initial={{ y: reduce ? 0 : `${dir * 110}%`, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: reduce ? 0 : `${-dir * 110}%`, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22, delay: i * 0.04 }}>{d}</motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  )
}

function PlanCard({ plan, billing, dir, currency, selected, dim, onPick }: { plan: Plan; billing: "monthly" | "yearly"; dir: 1 | -1; currency: string; selected: boolean; dim: boolean; onPick: () => void }) {
  const reduce = useReducedMotion()
  const mx = useMotionValue(0.5), my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [11, -11]), { stiffness: 160, damping: 14 }), ry = useSpring(useTransform(mx, [0, 1], [-13, 13]), { stiffness: 160, damping: 14 })
  const lift = useSpring(0, { stiffness: 200, damping: 16 })
  const gx = useTransform(mx, (v) => `${v * 100}%`), gy = useTransform(my, (v) => `${v * 100}%`)
  const glare = useMotionTemplate`radial-gradient(180px circle at ${gx} ${gy}, rgba(255,255,255,0.35), transparent 60%)`
  const price = billing === "yearly" ? plan.yearly : plan.monthly
  return (
    <motion.li className="relative list-none" style={{ perspective: 900 }}
      onPointerMove={(e) => { const b = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - b.left) / b.width); my.set((e.clientY - b.top) / b.height); lift.set(40) }}
      onPointerLeave={() => { mx.set(0.5); my.set(0.5); lift.set(0) }} animate={{ opacity: dim ? 0.7 : 1, scale: dim ? 0.98 : 1 }} transition={{ duration: 0.3 }}>
      <motion.div style={{ rotateX: reduce ? 0 : rx, rotateY: reduce ? 0 : ry, z: reduce ? 0 : lift, transformStyle: "preserve-3d" }}
        className={cn("relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-4 text-foreground", selected ? "border-transparent" : plan.popular ? "border-primary/50" : "border-border")}>
        {/* running light on the popular plan, steady ring on the selected one */}
        {(plan.popular || selected) && (
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <motion.span className="absolute left-1/2 top-1/2 aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2" style={{ background: `conic-gradient(from 0deg, transparent 0 60%, ${TANGERINE}, var(--primary), transparent)`, opacity: selected ? 0.9 : 0.5 }}
              animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} />
            <span className="absolute inset-[1.5px] rounded-[14px] bg-card" />
          </span>
        )}
        {!reduce && <motion.span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl mix-blend-soft-light" style={{ background: glare }} />}

        {plan.popular && (
          <motion.span style={{ transform: "translateZ(50px)", background: GRADIENT }} animate={reduce ? undefined : { y: [0, -3, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-0 right-3 z-10 inline-flex items-center gap-1 rounded-b-lg px-2 py-1 text-[11px] font-semibold text-white shadow-lg"><Sparkles className="size-3" aria-hidden /> Popular</motion.span>
        )}
        <div className="relative" style={{ transform: "translateZ(30px)" }}>
          <h3 className="text-base font-semibold">{plan.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{plan.tagline}</p>
          <p className="mt-4 flex items-baseline gap-0.5" style={{ transform: "translateZ(24px)" }}>
            <span className="text-lg font-semibold text-muted-foreground">{currency}</span>
            <span className="text-4xl font-bold tracking-tight"><Roll value={price} dir={dir} /></span>
            <span className="ml-1 text-xs text-muted-foreground">/ month</span>
          </p>
          <p className="mt-1 h-4 text-[11px] text-muted-foreground">{billing === "yearly" && plan.monthly > 0 ? `Billed ${currency}${plan.yearly * 12} a year` : billing === "monthly" && plan.monthly > 0 ? "Billed monthly" : "Free forever"}</p>
        </div>
        <ul className="relative mt-4 flex-1 space-y-2 text-[13px]" style={{ transform: "translateZ(14px)" }}>
          {plan.features.map((f, i) => (
            <motion.li key={f} className="flex items-start gap-2" initial={{ opacity: 0, x: reduce ? 0 : -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.06 }}>
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-white" style={{ background: GRADIENT }}><Check className="size-2.5" strokeWidth={3.5} aria-hidden /></span>{f}
            </motion.li>
          ))}
        </ul>
        <motion.button type="button" onClick={onPick} aria-pressed={selected} whileTap={reduce ? undefined : { scale: 0.94 }} whileHover={reduce ? undefined : { y: -2 }} style={{ transform: "translateZ(36px)" }}
          className={cn("relative mt-5 inline-flex min-h-11 w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl text-sm font-semibold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", selected ? "text-white" : "border border-border bg-background hover:border-primary/60")}>
          {selected && <motion.span layoutId="plan-cta" className="absolute inset-0" style={{ background: GRADIENT }} transition={{ type: "spring", stiffness: 300, damping: 24 }} />}
          <span className="relative inline-flex items-center gap-1.5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={selected ? "s" : "n"} className="inline-flex items-center gap-1.5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                {selected && <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.1, duration: 0.3 }} /></svg>}
                {selected ? "Selected" : plan.cta ?? "Choose plan"}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.button>
      </motion.div>
      {selected && !reduce && <motion.span aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-2xl blur-xl" style={{ background: GRADIENT }} initial={{ opacity: 0 }} animate={{ opacity: [0.35, 0.6, 0.35] }} transition={{ duration: 2.4, repeat: Infinity }} />}
    </motion.li>
  )
}

export function PricingPlanTilt({ plans, currency = "$", title = "Pick your plan", defaultPlanId, onSelect, className }: PricingPlanTiltProps) {
  const reduce = useReducedMotion()
  const uid = React.useId()
  const [billing, setBilling] = React.useState<"monthly" | "yearly">("monthly")
  const [dir, setDir] = React.useState<1 | -1>(1)
  const [sel, setSel] = React.useState<string | null>(defaultPlanId ?? null)
  const choose = (b: "monthly" | "yearly") => { if (b === billing) return; setDir(b === "yearly" ? -1 : 1); setBilling(b) }
  const opts: { id: "monthly" | "yearly"; label: string }[] = [{ id: "monthly", label: "Monthly" }, { id: "yearly", label: "Yearly" }]
  const key = (e: React.KeyboardEvent) => { if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) { e.preventDefault(); choose(billing === "monthly" ? "yearly" : "monthly") } }

  return (
    <section aria-label={title} className={cn("relative w-full max-w-3xl", className)}>
      <div className="relative text-center">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Change plans or cancel whenever you like.</p>
        <div className="mt-4 inline-flex items-center gap-3">
          <div role="radiogroup" aria-labelledby={`${uid}-b`} onKeyDown={key} className="relative inline-grid grid-cols-2 rounded-full border border-border bg-card p-1">
            <span id={`${uid}-b`} className="sr-only">Billing period</span>
            {opts.map((o) => (
              <button key={o.id} type="button" role="radio" aria-checked={billing === o.id} tabIndex={billing === o.id ? 0 : -1} onClick={() => choose(o.id)}
                className={cn("relative min-h-11 min-w-24 rounded-full px-4 text-sm font-medium outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", billing === o.id ? "text-white" : "text-muted-foreground hover:text-foreground")}>
                {billing === o.id && <motion.span layoutId="bill-pill" className="absolute inset-0 rounded-full" style={{ background: GRADIENT }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 20 }} />}
                <span className="relative">{o.label}</span>
              </button>
            ))}
          </div>
          <motion.span animate={reduce ? undefined : billing === "yearly" ? { scale: [1, 1.3, 1], rotate: [0, -8, 0] } : { scale: 1 }} key={billing} transition={{ duration: 0.5 }}
            className="rounded-full px-2.5 py-1 text-xs font-semibold text-[#3a1a00]" style={{ background: `linear-gradient(120deg,${TANGERINE},#ffc15e)` }}>Save 20%</motion.span>
        </div>
      </div>
      <ul className="relative mt-8 grid items-stretch gap-4 sm:grid-cols-3">
        {plans.map((p) => <PlanCard key={p.id} plan={p} billing={billing} dir={dir} currency={currency} selected={sel === p.id} dim={!!sel && sel !== p.id} onPick={() => { setSel(p.id); onSelect?.(p.id, billing) }} />)}
      </ul>
    </section>
  )
}

export default function Demo() {
  const plans: Plan[] = [
    { id: "free", name: "Starter", tagline: "For trying things out", monthly: 0, yearly: 0, features: ["3 projects", "1 GB storage", "Community help"], cta: "Start free" },
    { id: "plus", name: "Plus", tagline: "For one person doing a lot", monthly: 15, yearly: 12, popular: true, features: ["Unlimited projects", "100 GB storage", "Version history", "Email support"] },
    { id: "team", name: "Team", tagline: "For groups that ship together", monthly: 36, yearly: 29, features: ["Everything in Plus", "Shared workspaces", "Roles and approvals", "Priority support"] },
  ]
  return (
    <div data-theme="lilac" className="fixed inset-0 grid place-items-center overflow-auto bg-background p-6 text-foreground">
      <PricingPlanTilt plans={plans} defaultPlanId="plus" />
    </div>
  )
}
