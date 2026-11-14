// @ts-nocheck
/* eslint-disable */
"use client"

import * as React from "react"
import { ContactCard, ContactHours } from "@/components/ui/contact-card"

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

function ContactCardDemo() {
  return (
    <div className="w-full max-w-md">
      <ContactCard
        name="Amara Nwosu"
        pronouns="she/her"
        jobTitle="Staff engineer, payments"
        company="Fieldnote"
        email="amara.nwosu@fieldnote.studio"
        phone="+234 803 555 0142"
        timeZone="Africa/Lagos"
        now={new Date("2026-10-26T15:42:00Z")}
        links={[
          { label: "Website", href: "https://example.com/amara" },
          { label: "GitHub", href: "https://github.com/" },
        ]}
      />
    </div>
  )
}

const weekdays = (open: string, close: string): ContactHours[] =>
  [1, 2, 3, 4, 5].map((day) => ({ day, open, close }))

function ContactCardBusiness() {
  return (
    <div className="grid w-full max-w-3xl items-start gap-4 md:grid-cols-2">
      <ContactCard
        kind="business"
        name="Padaria Ribeiro"
        category="Bakery"
        company="Príncipe Real"
        rating={4.7}
        reviewCount={1284}
        phone="+351 21 342 5590"
        address="Rua Dom Pedro V 57, 1250-092 Lisboa"
        addressHref="https://maps.google.com/?q=Rua+Dom+Pedro+V+57+Lisboa"
        timeZone="Europe/Lisbon"
        now={new Date("2026-10-26T10:15:00Z")}
        hours={[...weekdays("07:00", "19:00"), { day: 6, open: "08:00", close: "14:00" }]}
        links={[{ label: "Menu", href: "https://example.com/menu" }]}
      />
      <ContactCard
        kind="business"
        name="Clínica Veterinária do Rato"
        category="Veterinary clinic"
        phone="+351 21 388 1200"
        email="geral@vetrato.pt"
        address="Largo do Rato 3, Lisboa"
        timeZone="Europe/Lisbon"
        now={new Date("2026-10-26T18:20:00Z")}
        hours={[...weekdays("09:00", "19:00"), { day: 6, open: "10:00", close: "13:00" }]}
      />
    </div>
  )
}

const VIEWS = [ContactCardDemo, ContactCardBusiness]

const VIEW_MS = 2200

const FIT_CSS = "html,body{overflow:hidden}[data-fit-small] [data-fit-hide]{display:none!important}"

/**
 * 21st shows a demo in a small frame: about 674 by 421 on a component page, 358 by 224 on a
 * phone and 245 by 139 on a profile card. A demo taller than its frame gets scrollbars, which
 * render white on dark pages. FitFrame fills the frame exactly instead.
 *
 * - "scale": the content shrinks until it fits, centered. For visuals such as orbs.
 * - "crop": the content stays at full size from the top and fades out at the bottom. For text
 *   that streams in, where a changing scale would make the page breathe.
 *
 * `minWidth` lays out a wide demo (a table, a two column panel) at that width and scales it down
 * to the frame, instead of letting it collapse to a narrow layout. The frame centers it, so it
 * shrinks evenly on both sides.
 *
 * Anything marked `data-fit-hide` (state buttons, the chatcn.dev line) drops out in frames
 * shorter than `hideBelow`, so a profile card shows the visual alone.
 */
function FitFrame({
  children,
  mode = "scale",
  hideBelow = 360,
  minWidth,
}: {
  children: React.ReactNode
  mode?: "scale" | "crop"
  hideBelow?: number
  minWidth?: string
}) {
  const content = React.useRef<HTMLDivElement>(null)
  const [cropped, setCropped] = React.useState(false)

  React.useLayoutEffect(() => {
    const el = content.current
    if (!el) return
    const measure = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      el.toggleAttribute("data-fit-small", vh < hideBelow)
      // Layout sizes ignore the transform, so measuring never feeds back.
      const w = Math.max(el.offsetWidth, el.scrollWidth)
      const h = Math.max(el.offsetHeight, el.scrollHeight)
      const scale = mode === "scale" ? Math.min(1, vw / w, vh / h) : 1
      el.style.transform = scale < 1 ? `scale(${scale})` : ""
      setCropped(mode === "crop" && h > vh + 1)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    // Content that changes inside a fixed width box (a headline that cycles words) never resizes
    // the box itself, so changes below it measure again on the next frame.
    let frame = 0
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    })
    mutations.observe(el, { subtree: true, childList: true, characterData: true })
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      mutations.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", measure)
    }
  }, [mode, hideBelow])

  const fade = "linear-gradient(to bottom, #000 calc(100% - 40px), transparent)"
  return (
    <div
      className="flex w-full justify-center overflow-hidden"
      style={{
        height: "100dvh",
        alignItems: mode === "crop" ? "flex-start" : "center",
        maskImage: cropped ? fade : undefined,
        WebkitMaskImage: cropped ? fade : undefined,
      }}
    >
      <style>{FIT_CSS}</style>
      <div
        ref={content}
        className="w-full shrink-0"
        style={{ transformOrigin: mode === "crop" ? "top center" : "center", minWidth }}
      >
        {children}
      </div>
    </div>
  )
}

/** The line under each 21st demo that points back to the kit. */
function MoreOn({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <p data-fit-hide className="text-[0.75rem]/[1rem] text-(color:--chatcn-fg-faint) text-center text-balance">
      {children}{" "}
      <a
        href={`https://chatcn.dev/docs/components/${slug}`}
        target="_blank"
        rel="noopener"
        className="text-(color:--chatcn-fg-subtle) hover:text-(color:--chatcn-fg) underline underline-offset-2"
      >
        chatcn.dev
      </a>
    </p>
  )
}

/**
 * The kit's own examples, crossfading every couple of seconds. They share one grid cell, so the
 * frame keeps the size of the larger one and never rescales.
 */
export default function ContactCardPreview() {
  const [view, setView] = React.useState(0)
  React.useEffect(() => {
    if (reducedMotion()) return
    const id = window.setInterval(() => setView((v) => (v + 1) % VIEWS.length), VIEW_MS)
    return () => window.clearInterval(id)
  }, [])
  return (
    <FitFrame minWidth="36rem">
      <div className="flex w-full flex-col items-center justify-center gap-4 p-6">
        <div className="grid w-full max-w-2xl">
          {VIEWS.map((View, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list.
              key={i}
              aria-hidden={i !== view}
              inert={i !== view}
              className="col-start-1 row-start-1 flex items-center justify-center transition-opacity duration-300"
              style={{ opacity: i === view ? 1 : 0 }}
            >
              <View />
            </div>
          ))}
        </div>
        <MoreOn slug="contact-card">People and businesses in a reply, with actions. On</MoreOn>
      </div>
    </FitFrame>
  )
}
