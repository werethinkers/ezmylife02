// @ts-nocheck
/* eslint-disable */
"use client";

import * as React from "react";
import { EarlyAccessPassCta, nameFromEmail } from "@/components/ui/early-access-pass-cta";
import type { EarlyAccessPassData, EarlyAccessPassLayout } from "@/components/ui/early-access-pass-cta";

const EMAILS = ["jordan@alder.studio", "mina@alder.studio"];
const FIRST_NUMBER = 1284;
const LAYOUTS: EarlyAccessPassLayout[] = ["auto", "split", "stack"];

function orbit(target: HTMLElement, duration: number, onDone: () => void) {
  const rect = target.getBoundingClientRect();
  const centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  const fire = (type: string, x: number, y: number) => {
    target.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true, pointerType: "mouse", pointerId: 1, isPrimary: true }));
  };
  let frame = 0;
  const started = performance.now();
  fire("pointerenter", centre.x, centre.y);
  const tick = (now: number) => {
    const progress = Math.min(1, (now - started) / duration);
    const reach = Math.sin(progress * Math.PI);
    const angle = -Math.PI / 2 + progress * Math.PI * 2;
    const x = centre.x + Math.cos(angle) * rect.width * 0.44 * reach;
    const y = centre.y + Math.sin(angle) * rect.height * 0.44 * reach;
    fire("pointermove", x, y);
    if (progress < 1) { frame = requestAnimationFrame(tick); return; }
    fire("pointerleave", x, y);
    onDone();
  };
  frame = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(frame); fire("pointerleave", centre.x, centre.y); };
}

export default function Demo({ autoplay = true }: { autoplay?: boolean }) {
  const params = React.useMemo(() => new URLSearchParams(typeof location === "undefined" ? "" : location.search), []);
  const speed = Number(params.get("speed") ?? 1) || 1;
  const fail = params.get("fail");
  const lock = params.get("lock") === "1";
  const uncontrolled = params.get("uncontrolled") === "1";
  const layout = LAYOUTS.find((value) => value === params.get("layout")) ?? "auto";
  const tilt = params.get("tilt") !== "0";
  const sheen = params.get("sheen") !== "0";
  const preset = params.get("preset") === "1";

  const [email, setEmail] = React.useState(preset ? EMAILS[0]! : "");
  const [pass, setPass] = React.useState((preset ? { name: "Jordan", number: FIRST_NUMBER, issuedAt: new Date() } : null) as EarlyAccessPassData | null);
  const [requested, setRequested] = React.useState("");
  const [status, setStatus] = React.useState("idle");
  const [run, setRun] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  const sectionRef = React.useRef(null as HTMLElement | null);
  const attempts = React.useRef(0);
  const runRef = React.useRef(0);
  const realPointer = React.useRef(false);
  const cancelOrbit = React.useRef(null as (() => void) | null);
  runRef.current = run;

  const failsFirst = (index: number) => fail === "1" || (fail !== "0" && index % 2 === 1);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  React.useEffect(() => {
    if (!autoplay || paused) return;
    const timers: number[] = [];
    const at = (ms: number, task: () => void) => timers.push(window.setTimeout(task, Math.round(ms * speed)));
    const form = () => sectionRef.current?.querySelector("form");
    const text = EMAILS[run % EMAILS.length] ?? EMAILS[0]!;
    attempts.current = 0;
    for (let i = 1; i <= text.length; i += 1) at(500 + (i - 1) * 90, () => setEmail(text.slice(0, i)));
    at(2400, () => form()?.requestSubmit());
    const retry = failsFirst(run);
    if (retry) at(4000, () => form()?.requestSubmit());
    at(retry ? 5800 : 4200, () => {
      const card = sectionRef.current?.querySelector("[data-pass]");
      if (!(card instanceof HTMLElement) || realPointer.current || reduced) return;
      cancelOrbit.current = orbit(card, Math.round(2400 * speed), () => { cancelOrbit.current = null; });
    });
    at(12000, () => { setPass(null); setEmail(""); setRun((previous) => previous + 1); });
    return () => { timers.forEach((timer) => window.clearTimeout(timer)); cancelOrbit.current?.(); cancelOrbit.current = null; };
  }, [autoplay, paused, run, speed, fail, reduced]);

  const takeOver = () => { if (autoplay) setPaused(true); cancelOrbit.current?.(); cancelOrbit.current = null; };
  const watchPointer = (event: React.PointerEvent) => {
    if (!event.isTrusted) return;
    realPointer.current = true;
    cancelOrbit.current?.();
    cancelOrbit.current = null;
  };

  const submit = async (address: string) => {
    const index = runRef.current;
    attempts.current += 1;
    await new Promise((resolve) => window.setTimeout(resolve, Math.round(600 * speed)));
    if (failsFirst(index) && attempts.current === 1) throw new Error("Network hiccup");
    return { name: nameFromEmail(address), number: FIRST_NUMBER + index, issuedAt: new Date() };
  };

  return (
    <main
      data-demo-root
      data-run={run}
      data-requested={requested}
      data-host-status={status}
      onPointerDownCapture={takeOver}
      onKeyDownCapture={takeOver}
      onPointerMoveCapture={watchPointer}
      className="flex min-h-[min(100svh,760px)] w-full items-center justify-center bg-background px-6 py-8 text-foreground sm:px-10"
    >
      <EarlyAccessPassCta
        key={uncontrolled ? run : "demo"}
        ref={sectionRef}
        className="max-w-[1040px]"
        brand={{ name: "Alder" }}
        eyebrow="Early access"
        heading="Be first on the list."
        lead="Alder opens to a small group each month. Leave your email and we will hold a pass with your name on it."
        note="No spam. One email when we open."
        email={email}
        onEmailChange={setEmail}
        onSubmit={submit}
        onStatusChange={setStatus}
        layout={layout}
        tilt={tilt}
        sheen={sheen}
        {...(uncontrolled
          ? {}
          : { pass, onPassChange: (next: EarlyAccessPassData | null) => { setRequested(next ? String(next.number) : ""); if (!lock) setPass(next); } })}
      />
    </main>
  );
}
