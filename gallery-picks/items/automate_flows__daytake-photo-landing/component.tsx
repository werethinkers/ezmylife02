/*
 * Daytake Landing Page
 * Author: @automate_flows   Source: https://21st.dev/@automate_flows/components/daytake-photo-landing   21st.dev id: 46116
 * Licence: covered by the paid 21st.dev plan Ezyourlife bought on 14 Nov 2026 (the API returns no
 * per-component licence text, so the author's own terms were not checked line by line).
 * Kept as published; only this header was added.
 */
// @ts-nocheck
/* eslint-disable */
"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  Aperture, ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, Check,
  Crop, Download, Focus, Headphones, Heart, Image as ImageIcon, MapPin, Maximize,
  MessageCircle, Pause, Play, Shapes, Sparkles, Users,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";
import { Moon, Sun, X } from "lucide-react";
import "@fontsource-variable/manrope";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin, MotionPathPlugin);

type Theme = "light" | "dark";

function usePreviewTheme(defaultTheme: Theme) {
  const [theme, setTheme] = useState< Theme>(() => {
    const requested = new URLSearchParams(typeof location === "undefined" ? "" : location.search).get("theme");
    return requested === "light" || requested === "dark" ? requested : defaultTheme;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return { theme, toggleTheme: () => setTheme(current => current === "dark" ? "light" : "dark") };
}

function ThemeToggle({ theme, toggleTheme }: ReturnType< typeof usePreviewTheme>) {
  return (
    <button
      type="button"
      className="preview-icon-button"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggleTheme}
    >
      {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  );
}

function PreviewDialog({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef< HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  function close() {
    dialog.current?.close();
    onClose();
  }

  return (
    <dialog
      ref={dialog}
      className="preview-dialog"
      aria-label={label}
      onCancel={event => {
        event.preventDefault();
        close();
      }}
      onClick={event => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="preview-dialog-inner">
        <button
          type="button"
          className="preview-icon-button preview-close"
          aria-label="Close dialog"
          onClick={close}
        >
          <X aria-hidden="true" />
        </button>
        {children}
      </div>
    </dialog>
  );
}

const pageStyles = ":root {\n  font-family: \"Manrope Variable\", system-ui, sans-serif;\n  font-synthesis: none;\n  color-scheme: light;\n  background: var(--page);\n  color: var(--ink);\n  -webkit-font-smoothing: antialiased;\n}\n\n:root[data-theme=\"dark\"] {\n  color-scheme: dark;\n}\n\n*, *::before, *::after { box-sizing: border-box; }\nbody { margin: 0; }\nimg { display: block; max-inline-size: 100%; }\nbutton, input { font: inherit; }\nbutton { color: inherit; cursor: pointer; }\nbutton:disabled { cursor: default; }\na { color: inherit; text-decoration: none; }\n:where(a, button, input):focus-visible {\n  outline: 2px solid var(--focus);\n  outline-offset: 4px;\n}\n\n.preview-icon-button {\n  display: inline-grid;\n  place-items: center;\n  flex: none;\n  inline-size: 44px;\n  block-size: 44px;\n  padding: 0;\n  border: 1px solid var(--line);\n  border-radius: 50%;\n  background: var(--page);\n}\n\n.preview-icon-button:hover:enabled { background: var(--surface); }\n.preview-icon-button:disabled { opacity: .4; }\n.preview-icon-button svg { inline-size: 18px; block-size: 18px; }\n\n.preview-dialog {\n  color: var(--ink);\n  background: var(--page);\n  border: 1px solid var(--line);\n  padding: 0;\n  width: min(760px, calc(100% - 28px));\n  max-height: calc(100% - 28px);\n  overscroll-behavior: contain;\n}\n\n.preview-dialog::backdrop { background: rgb(12 12 12 / .72); }\n.preview-dialog-inner { position: relative; }\n.preview-close { position: absolute; z-index: 1; top: 12px; right: 12px; }\n\n.preview-skip {\n  position: fixed;\n  top: 8px;\n  left: 8px;\n  z-index: 30;\n  transform: translateY(-150%);\n  color: var(--ink);\n  background: var(--page);\n  padding: 12px 16px;\n}\n\n.preview-skip:focus { transform: none; }\n\n.preview-visually-hidden {\n  position: absolute;\n  inline-size: 1px;\n  block-size: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  white-space: nowrap;\n  clip-path: inset(50%);\n}\n\n@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after {\n    scroll-behavior: auto !important;\n  }\n}\n:root {\n  scrollbar-gutter: stable;\n  --page: #fffefd;\n  --outer: #efedfa;\n  --ink: #1b2139;\n  --muted: #666578;\n  --line: #e5e2ef;\n  --surface: #f4f2fa;\n  --accent: #d84f38;\n  --accent-ink: #fff;\n  --focus: #344dcc;\n  --blue: #3658cc;\n  --about: #f4f0fc;\n  --feature-blue: #4f7aee;\n  --feature-violet: #8c63da;\n  --feature-cyan: #39baca;\n}\n:root[data-theme=\"dark\"] {\n  --page: #151521;\n  --outer: #0e0d16;\n  --ink: #f6f3ff;\n  --muted: #b5b0c6;\n  --line: #343044;\n  --surface: #242233;\n  --accent: #ff927e;\n  --accent-ink: #2d1510;\n  --focus: #a8b5ff;\n  --blue: #a8b5ff;\n  --about: #242032;\n}\nhtml { background: var(--outer); scroll-padding-top: 24px; }\nbody { background: var(--outer); overflow-x: clip; }\n::selection { background: #dcd4ff; color: #251e4a; }\n.daytake {\n  width: min(1360px, calc(100% - 56px));\n  margin: 28px auto;\n  background: var(--page);\n  border-radius: 18px;\n  overflow-x: clip;\n  box-shadow: 0 28px 90px rgb(49 37 98 / .08);\n  color: var(--ink);\n}\n.daytake-wrap { width: calc(100% - clamp(36px, 8vw, 128px)); max-width: 1180px; margin-inline: auto; }\n.daytake-window-bar {\n  height: 34px; border-bottom: 1px solid var(--line);\n  display: flex; align-items: center; justify-content: space-between;\n  padding-inline: 18px; font-size: 10px; color: var(--muted);\n}\n.daytake-window-bar > span:first-child { display: flex; gap: 6px; }\n.daytake-window-bar i { width: 7px; height: 7px; background: #ddd9e9; border-radius: 50%; }\n.daytake-window-bar i:first-child { background: #edafa5; }\n.daytake-window-bar svg { width: 11px; height: 11px; opacity: .5; }\n.daytake-header {\n  position: relative; z-index: 5; min-height: 82px;\n  display: flex; justify-content: space-between; align-items: center; gap: 24px;\n}\n.daytake-logo { display: inline-flex; gap: 8px; align-items: center; font-size: 1.4rem; font-weight: 850; letter-spacing: -.04em; }\n.daytake-logo svg { width: 29px; height: 29px; color: var(--accent); stroke-width: 2.3; }\n.daytake-header nav { display: flex; align-items: center; gap: 32px; font-size: .78rem; font-weight: 700; }\n.daytake-header nav a { min-height: 44px; display: grid; align-items: center; }\n.daytake-header nav a:hover, .daytake-footer nav a:hover { color: var(--blue); }\n.daytake-header .preview-icon-button { width: 36px; height: 36px; min-height: 44px; min-width: 44px; border: 0; background: transparent; }\n.daytake-hero {\n  position: relative; isolation: isolate; display: flex; align-items: center;\n  min-height: clamp(500px, 43vw, 630px); overflow: clip; background: var(--page);\n}\n.daytake-hero-content { position: relative; z-index: 2; padding: 30px 0 100px; pointer-events: none; }\n.daytake-hero-content a { pointer-events: auto; }\n.daytake h1, .daytake h2 { margin: 0; font-weight: 800; letter-spacing: -.04em; text-wrap: balance; }\n.daytake h1 { font-size: clamp(3rem, 5.6vw, 5.25rem); line-height: 1.05; }\n.daytake h1 span, .daytake h2 span { color: var(--blue); }\n.daytake h2 { font-size: clamp(2rem, 3.1vw, 3.1rem); line-height: 1.14; }\n.daytake-hero p { max-width: 32ch; margin: 23px 0 29px; font-size: clamp(.96rem, 1.3vw, 1.13rem); line-height: 1.65; color: var(--muted); }\n.daytake-primary {\n  display: inline-flex; align-items: center; justify-content: center; gap: 15px;\n  min-height: 48px; padding: 12px 24px; border: 0; border-radius: 99px;\n  background: var(--accent); color: var(--accent-ink); font-size: .82rem; font-weight: 750;\n  transition: box-shadow .2s, translate .2s;\n}\n.daytake-primary:hover { box-shadow: 0 6px 18px rgb(216 79 56 / .2); translate: 0 -1px; }\n.daytake-primary svg { width: 15px; height: 15px; }\n.daytake-counter { display: flex; align-items: center; gap: 12px; margin-top: 34px; }\n.daytake-counter-icon { width: 39px; height: 39px; display: grid; place-items: center; border: 1px solid var(--line); border-radius: 50%; }\n.daytake-counter-icon svg { width: 17px; height: 17px; color: var(--muted); }\n.daytake-counter small { display: block; font-size: .66rem; color: var(--muted); margin-bottom: 3px; }\n.daytake-counter strong { font-size: 1.1rem; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -.02em; }\n.daytake-hero-foot { position: absolute; z-index: 3; left: 0; right: 0; bottom: 20px; display: flex; align-items: center; justify-content: space-between; font-size: .68rem; color: var(--muted); }\n.daytake-hero-foot a { min-height: 44px; display: flex; align-items: center; gap: 10px; }\n.daytake-hero-foot svg { width: 12px; height: 12px; }\n.daytake-mosaic {\n  --mosaic-gap: clamp(10px, 1.35vw, 20px);\n  position: absolute; inset: 0 -9% 0 43%;\n  display: flex; align-items: center; perspective: 1000px; pointer-events: none;\n  mask-image: linear-gradient(90deg, transparent, #000 17%, #000 90%, transparent), linear-gradient(180deg, transparent, #000 19%, #000 80%, transparent);\n  mask-composite: intersect;\n}\n.daytake-mosaic-grid {\n  flex: none; width: 110%; height: 860px; display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--mosaic-gap);\n  transform-style: preserve-3d; transform: rotateX(18deg) rotateY(-24deg) rotateZ(-12deg) translateZ(-150px);\n  transform-origin: 50% 50%;\n}\n.daytake-mosaic-column { min-width: 0; overflow: visible; }\n.daytake-mosaic-track { will-change: transform; }\n.daytake-mosaic-set { display: grid; gap: var(--mosaic-gap); padding-bottom: var(--mosaic-gap); }\n.daytake-mosaic-tile { width: 100%; aspect-ratio: .87; height: auto; object-fit: cover; border-radius: 13px; background: var(--surface); }\n.daytake-mosaic::after { content: \"\"; position: absolute; inset: 0 auto 0 0; width: 16%; backdrop-filter: blur(8px); mask-image: linear-gradient(90deg, #000, transparent); }\n.daytake-features { padding-block: clamp(54px, 6.5vw, 94px); }\n.daytake-feature-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(24px, 5.8vw, 90px); }\n.daytake-feature { --feature: var(--feature-blue); }\n.daytake-feature:nth-child(2) { --feature: var(--feature-violet); }\n.daytake-feature:nth-child(3) { --feature: var(--feature-cyan); }\n.daytake-feature-icon {\n  width: 58px; height: 58px; display: grid; place-items: center; border-radius: 50%; margin-bottom: 23px;\n  background: var(--feature); color: #fff; box-shadow: 0 7px 18px color-mix(in srgb, var(--feature) 18%, transparent);\n}\n.daytake-feature-icon svg { width: 25px; height: 25px; stroke-width: 1.7; }\n.daytake .daytake-feature h2 { max-width: 18ch; font-size: 1.15rem; line-height: 1.3; letter-spacing: -.025em; }\n.daytake-feature p { max-width: 32ch; font-size: .82rem; line-height: 1.7; color: var(--muted); margin: 12px 0 0; }\n\n.daytake-library { position: relative; padding: 55px 0 28px; overflow: clip; background: var(--page); }\n.daytake-library-heading { text-align: center; margin-bottom: 28px; }\n.daytake-library-heading p { margin: 14px 0 0; font-size: .91rem; color: var(--muted); }\n.daytake-gallery { --gallery-gap: 18px; --gallery-card: clamp(190px, 20vw, 270px); padding: 20px 0; overflow: clip; }\n.daytake-gallery-tilt { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; rotate: 2deg; margin-inline: -30px; }\n.daytake-gallery-lane { display: flex; overflow-x: auto; overflow-y: hidden; overflow-anchor: none; scrollbar-width: none; padding: 8px 0; overscroll-behavior-x: contain; touch-action: pan-x pan-y; }\n.daytake-gallery-lane::-webkit-scrollbar { display: none; }\n.daytake-gallery-group { display: flex; flex: none; gap: var(--gallery-gap); padding-right: var(--gallery-gap); }\n.daytake-photo-arrival { flex: 0 0 var(--gallery-card); width: var(--gallery-card); }\n.daytake-photo {\n  width: 100%; aspect-ratio: 1.55; position: relative; padding: 0;\n  display: block; border: 0; border-radius: 13px; background: var(--surface); overflow: hidden;\n}\n.daytake-photo > img { width: 100%; height: 100%; object-fit: cover; object-position: center 35%; transition: scale .45s; }\n.daytake-photo:hover > img { scale: 1.035; }\n.daytake-photo-badge { position: absolute; display: grid; place-items: center; border-radius: 50%; }\n.daytake-category-badge { top: 12px; left: 12px; width: 27px; height: 27px; color: #574674; background: #fffdf9; }\n.daytake-category-badge svg { width: 13px; height: 13px; }\n.daytake-play-badge { bottom: 12px; right: 12px; width: 35px; height: 35px; background: #ec7159; color: #fff; }\n.daytake-play-badge svg { width: 13px; height: 13px; margin-left: 2px; }\n.daytake-photo-caption { position: absolute; left: 14px; bottom: 13px; max-width: 70%; color: #fff; font-size: .72rem; font-weight: 700; opacity: 0; text-shadow: 0 2px 5px rgb(0 0 0 / .7); }\n.daytake-photo:hover .daytake-photo-caption, .daytake-photo:focus-visible .daytake-photo-caption { opacity: 1; }\n.daytake-gallery-footer { display: flex; align-items: center; justify-content: space-between; color: var(--muted); font-size: .68rem; margin-top: 12px; }\n.daytake-motion-toggle { display: inline-flex; align-items: center; gap: 7px; min-width: 64px; min-height: 44px; border: 0; background: transparent; color: var(--muted); font-size: .68rem; }\n.daytake-motion-toggle:hover { color: var(--blue); }\n.daytake-motion-toggle svg { width: 13px; height: 13px; }\n\n.daytake-editorial {\n  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);\n  align-items: center; column-gap: clamp(32px, 5.5vw, 85px);\n  padding-block: 85px; margin-block: 35px; position: relative;\n}\n.daytake-editorial::before {\n  content: \"\"; position: absolute; z-index: 0; top: 80px; bottom: 90px; left: 20%; right: -5%;\n  background: linear-gradient(90deg, transparent, var(--about) 45%, var(--about));\n  border-radius: 16px; pointer-events: none;\n}\n.daytake-editorial-figure { margin: 0; min-width: 0; z-index: 1; }\n.daytake-editorial-stage { position: relative; isolation: isolate; aspect-ratio: 1 / 1.1; }\n.daytake-editorial-media { position: absolute; inset: 0 auto auto 7%; width: 76%; height: 97%; transform-origin: center bottom; }\n.daytake-editorial-photo { display: block; padding: 0; border: 0; width: 100%; height: 100%; border-radius: 24px; overflow: hidden; background: #ddd5cc; }\n.daytake-editorial-photo img { width: 100%; height: 100%; object-fit: cover; }\n.daytake-editorial-photo[data-full-frame=\"true\"] img { object-fit: contain; }\n.daytake-editorial-open { position: absolute; right: -18px; top: 14px; width: 56px; height: 56px; display: grid; place-items: center; border: 0; border-radius: 50%; background: var(--accent); color: var(--accent-ink); box-shadow: 0 6px 18px rgb(131 42 19 / .14); }\n.daytake-editorial-open svg { width: 21px; height: 21px; margin-left: 3px; }\n.daytake-editorial-toolbar { position: absolute; top: 24%; left: 0; width: 43px; display: grid; padding: 5px 0; background: rgb(255 255 255 / .74); backdrop-filter: blur(14px); border-radius: 99px; box-shadow: 0 7px 20px rgb(31 24 68 / .1); }\n.daytake-editorial-toolbar button, .daytake-editorial-toolbar a { display: grid; place-items: center; width: 43px; height: 39px; padding: 0; border: 0; background: transparent; color: #777184; }\n.daytake-editorial-toolbar svg { width: 16px; height: 16px; }\n.daytake-editorial-toolbar [aria-pressed=\"true\"], .daytake-editorial-toolbar :is(a,button):hover { color: #3658cc; }\n.daytake-audio { position: absolute; z-index: 3; left: 0; bottom: 9%; width: 48%; padding: 10px 12px; border-radius: 11px; background: #fff; color: #3b5e4e; box-shadow: 0 9px 24px rgb(25 35 47 / .14); }\n.daytake-waveform { display: flex; align-items: center; justify-content: space-between; gap: 2px; height: 30px; }\n.daytake-waveform i { display: block; flex: 1; max-width: 3px; border-radius: 2px; background: #63bc9a; }\n.daytake-waveform i:nth-child(n+19) { background: #bcd6c9; }\n.daytake-audio-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 5px; font-size: .52rem; font-weight: 700; }\n.daytake-audio-meta > span:first-child { display: flex; gap: 5px; align-items: center; }\n.daytake-audio-progress { position: absolute; left: 0; bottom: 0; width: 62%; height: 3px; background: #62b699; border-radius: 0 0 0 11px; }\n.daytake-editorial-line { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }\n.daytake-editorial-line path { fill: none; stroke: var(--blue); stroke-width: .32; stroke-linecap: round; stroke-linejoin: round; }\n.daytake-editorial-card { position: absolute; z-index: 2; width: 29%; left: 69%; text-align: left; padding: 6px; border: 0; border-radius: 10px; background: var(--page); box-shadow: 0 8px 24px rgb(35 27 60 / .13); }\n.daytake-editorial-question { top: 51%; }\n.daytake-editorial-result { top: 82%; left: 53%; width: 27%; }\n.daytake-editorial-card img { width: 100%; height: auto; aspect-ratio: 1.85; object-fit: cover; border-radius: 6px; }\n.daytake-editorial-card strong { display: block; padding: 5px 2px 2px; font-size: clamp(.57rem, .85vw, .73rem); line-height: 1.2; }\n.daytake-editorial-card small { display: block; color: var(--muted); font-size: clamp(.43rem, .6vw, .52rem); padding: 1px 2px 3px; }\n.daytake-mini-image { position: relative; display: block; }\n.daytake-mini-image i { position: absolute; display: grid; place-items: center; width: 23px; height: 23px; right: -10px; top: 2px; border-radius: 50%; color: #fff; background: #ec7159; }\n.daytake-mini-image svg { width: 9px; height: 9px; margin-left: 1px; }\n.daytake-editorial-figure figcaption { margin: 12px 7% 0; font-size: .62rem; color: var(--muted); }\n.daytake-editorial-content { position: relative; z-index: 1; }\n.daytake-editorial-content h2 { font-size: clamp(2rem, 3.55vw, 3.5rem); line-height: 1.13; }\n.daytake-editorial-content > p { max-width: 36ch; margin: 22px 0 28px; font-size: .9rem; line-height: 1.7; color: var(--muted); }\n.daytake-editorial-actions { display: flex; flex-wrap: wrap; gap: 20px; align-items: center; }\n.daytake-watch { display: inline-flex; align-items: center; gap: 9px; padding: 0; border: 0; background: transparent; font-size: .76rem; font-weight: 600; min-height: 48px; }\n.daytake-watch > span { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid var(--line); border-radius: 50%; }\n.daytake-watch svg { width: 11px; height: 11px; margin-left: 2px; color: var(--blue); }\n.daytake-watch:hover { color: var(--blue); }\n.daytake-trust { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 15px; border-top: 1px solid var(--line); margin-top: 35px; padding-top: 22px; }\n.daytake-trust-item { display: flex; align-items: center; gap: 8px; font-size: .58rem; line-height: 1.55; color: var(--muted); }\n.daytake-trust-item svg { width: 18px; height: 18px; flex: none; color: var(--blue); }\n.daytake-trust-item:nth-child(2) svg { color: var(--accent); }\n.daytake-trust-item:nth-child(3) svg { color: #8b69a4; }\n\n.daytake-people { padding: 40px 0 78px; text-align: center; overflow: clip; }\n.daytake-people h2 { font-size: clamp(2rem, 3.5vw, 3.4rem); }\n.daytake-people > .daytake-wrap > p { font-size: .91rem; color: var(--muted); margin: 18px 0 0; }\n.daytake-portrait-field { width: min(1120px, 100%); position: relative; isolation: isolate; margin: 20px auto 6px; height: 390px; }\n.daytake-portrait-line { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1; }\n.daytake-portrait-trace { fill: none; stroke: color-mix(in srgb, var(--blue) 30%, var(--page)); stroke-width: 1.5; }\n.daytake-portrait-line-phone { display: none; }\n.daytake-creators { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(4, 1fr); width: 100%; }\n.daytake-creator-arrival { padding-top: 40px; }\n.daytake-creator-arrival:nth-child(2) { padding-top: 140px; }\n.daytake-creator-arrival:nth-child(3) { padding-top: 20px; }\n.daytake-creator-arrival:nth-child(4) { padding-top: 120px; }\n.daytake-creator { display: inline-grid; justify-items: center; padding: 0; border: 0; background: transparent; color: var(--ink); border-radius: 24px; }\n.daytake-creator-plate {\n  position: relative; display: block; width: clamp(148px, 15vw, 188px); aspect-ratio: 1;\n  margin-bottom: 20px;\n}\n.daytake-creator-backplate { position: absolute; inset: 0; border-radius: 28%; transform: rotate(var(--tilt)); background: #e6def8; }\n.daytake-creator-backplate.lavender { background: repeating-linear-gradient(35deg, #e7dff7 0 9px, #dcd2f0 9px 11px); }\n.daytake-creator-backplate.pink { background: #f4d9e0; }\n.daytake-creator-backplate.cream { background: #f1e6d1; }\n.daytake-creator-backplate.yellow { background: repeating-linear-gradient(-35deg, #f4ecbf 0 9px, #eae0a9 9px 11px); }\n.daytake-creator-body { position: absolute; inset: 9% 10%; border-radius: 17px; background: #fffefa; box-shadow: 0 8px 18px #3628380c; }\n.daytake-creator-avatar { position: absolute; width: 38%; aspect-ratio: 1; left: 31%; top: 17%; border-radius: 50%; overflow: hidden; transform-origin: 50% 50%; }\n.daytake-creator-avatar img { width: 100%; height: 100%; object-fit: cover; object-position: center 30%; }\n.daytake-creator-caption { position: absolute; inset: 59% 11% auto; display: grid; justify-items: center; gap: 8px; color: #252336; }\n.daytake-creator-caption strong { font-size: clamp(.6rem, .86vw, .75rem); line-height: 1.3; letter-spacing: -.015em; }\n.daytake-creator-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; font-size: .55rem; font-weight: 650; border-radius: 99px; color: #534d68; background: #eeebf4; }\n.daytake-creator-badge svg { width: 10px; height: 10px; }\n.daytake-creator-specialty { font-size: .65rem; color: var(--muted); }\n.daytake-creator:hover .daytake-creator-caption strong { color: #314ec7; }\n.daytake-particle-arrival { position: absolute; pointer-events: none; }\n.daytake-particle { display: block; width: 10px; height: 10px; border-radius: 50%; background: #6682e8; }\n.particle-0 { left: 3%; top: 56%; }\n.particle-1 { left: 29%; top: 9%; }\n.particle-1 .daytake-particle { width: 15px; height: 15px; background: #f38d79; }\n.particle-2 { left: 62%; top: 78%; }\n.particle-2 .daytake-particle { width: 6px; height: 6px; background: #272b50; }\n.particle-3 { left: 91%; top: 8%; }\n.particle-3 .daytake-particle { width: 9px; height: 9px; background: #f38d79; }\n.daytake-text-link { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; color: var(--blue); font-size: .78rem; font-weight: 750; }\n.daytake-text-link svg { width: 15px; height: 15px; }\n.daytake-text-link:hover { text-decoration: underline; text-underline-offset: .3em; }\n.daytake-footer { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 20px; border-top: 1px solid var(--line); padding: 30px 0 22px; }\n.daytake-footer p { font-size: .7rem; color: var(--muted); margin: 8px 0; }\n.daytake-footer nav { display: flex; gap: 28px; font-size: .73rem; }\n.daytake-footer nav a { min-height: 44px; display: grid; align-items: center; }\n.daytake-demo-note { flex-basis: 100%; font-size: .6rem; line-height: 1.7; color: var(--muted); }\n.daytake .preview-dialog { width: min(760px, calc(100% - 28px)); border-radius: 16px; }\n.daytake-dialog-photo { width: 100%; height: min(65vh, 570px); object-fit: contain; background: var(--surface); }\n.daytake-dialog-info { display: flex; justify-content: space-between; align-items: center; gap: 18px; padding: 22px; }\n.daytake-dialog-info h2 { font-size: 1.35rem; }\n.daytake-dialog-info p { margin: 9px 0 0; color: var(--muted); font-size: .8rem; line-height: 1.6; }\n.daytake-studio-film { width: 100%; max-height: 70vh; display: block; background: #141524; }\n:root[data-theme=\"dark\"] .daytake-hero-cta { background: var(--accent) !important; }\n:root[data-theme=\"dark\"] .daytake-editorial-toolbar { background: rgb(27 27 43 / .8); }\n:root[data-theme=\"dark\"] .daytake-editorial-toolbar :is(button,a) { color: #e0d7f5; }\n\n@media (max-width: 1000px) {\n  .daytake { width: calc(100% - 32px); margin-block: 16px; }\n  .daytake-wrap { width: calc(100% - 64px); }\n  .daytake-header { min-height: 75px; }\n  .daytake-hero { min-height: 510px; }\n  .daytake-hero h1 { font-size: 3.5rem; }\n  .daytake-hero-content { padding-bottom: 82px; }\n  .daytake-mosaic { inset: 0 -18% 0 43%; }\n  .daytake-mosaic-grid { height: 680px; }\n  .daytake-editorial { column-gap: 32px; }\n  .daytake-editorial-content h2 { font-size: 2.25rem; }\n  .daytake-editorial-actions { gap: 12px; }\n  .daytake-primary { padding-inline: 20px; }\n  .daytake-trust { gap: 8px; }\n  .daytake-trust-item { flex-direction: column; align-items: start; }\n}\n@media (max-width: 759px) {\n  .daytake { width: calc(100% - 16px); margin: 8px auto; border-radius: 13px; }\n  .daytake-wrap { width: calc(100% - 36px); }\n  .daytake-window-bar { height: 27px; padding-inline: 12px; font-size: 9px; }\n  .daytake-header { min-height: 66px; gap: 8px; }\n  .daytake-logo { font-size: 1.25rem; gap: 5px; }\n  .daytake-logo svg { width: 25px; height: 25px; }\n  .daytake-header nav { gap: 14px; font-size: .68rem; }\n  .daytake-header nav a:first-child { display: none; }\n  .daytake-header > .preview-icon-button { min-width: 44px; width: 44px; }\n  .daytake-header > .preview-icon-button svg { width: 15px; height: 15px; }\n  .daytake-hero { display: grid; align-items: start; grid-template-rows: auto 300px; min-height: 0; padding-bottom: 44px; }\n  .daytake-hero-content { grid-row: 1; padding: 34px 0 0; }\n  .daytake-hero h1 { font-size: clamp(2.6rem, 10.2vw, 4.2rem); line-height: 1.05; }\n  .daytake-hero p { font-size: .87rem; margin: 19px 0 24px; max-width: 33ch; }\n  .daytake-primary { min-height: 46px; font-size: .76rem; }\n  .daytake-counter { margin-top: 23px; gap: 10px; }\n  .daytake-counter-icon { width: 34px; height: 34px; }\n  .daytake-counter small { font-size: .58rem; }\n  .daytake-counter strong { font-size: 1rem; }\n  .daytake-mosaic { grid-row: 2; position: relative; inset: auto; height: 350px; margin: -8px -14% 0 -8%; }\n  .daytake-mosaic-grid { height: 650px; width: 100%; }\n  .daytake-mosaic-tile { aspect-ratio: .94; border-radius: 10px; }\n  .daytake-mosaic { --mosaic-gap: 10px; mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent), linear-gradient(180deg, transparent, #000 22%, #000 74%, transparent); }\n  .daytake-hero-foot { font-size: .58rem; bottom: 0; }\n  .daytake-features { padding-block: 40px 45px; }\n  .daytake-feature-grid { grid-template-columns: 1fr; gap: 30px; }\n  .daytake-feature { display: grid; grid-template-columns: 47px 1fr; gap: 5px 16px; }\n  .daytake-feature-icon { width: 47px; height: 47px; grid-row: span 2; margin: 0; }\n  .daytake-feature-icon svg { width: 21px; height: 21px; }\n  .daytake .daytake-feature h2 { font-size: 1.02rem; max-width: none; }\n  .daytake-feature p { font-size: .76rem; margin: 3px 0 0; }\n  .daytake-library { padding-top: 35px; padding-bottom: 20px; }\n  .daytake-library-heading { margin-bottom: 22px; }\n  .daytake-library-heading h2 { font-size: clamp(1.9rem, 7.8vw, 2.6rem); }\n  .daytake-library-heading p { font-size: .76rem; margin-top: 12px; }\n  .daytake-gallery { --gallery-gap: 12px; --gallery-card: clamp(166px, 48vw, 245px); padding: 17px 0; }\n  .daytake-gallery-tilt { gap: 5px; }\n  .daytake-photo { border-radius: 11px; }\n  .daytake-category-badge { width: 23px; height: 23px; top: 8px; left: 8px; }\n  .daytake-category-badge svg { width: 11px; height: 11px; }\n  .daytake-play-badge { width: 29px; height: 29px; bottom: 8px; right: 8px; }\n  .daytake-play-badge svg { width: 11px; height: 11px; }\n  .daytake-gallery-footer { margin-top: 5px; font-size: .6rem; }\n  .daytake-editorial { grid-template-columns: 1fr; gap: 34px; padding: 45px 0; margin-block: 10px; }\n  .daytake-editorial::before { inset: 20% -8px 14px; background: linear-gradient(180deg, transparent, var(--about) 62%); }\n  .daytake-editorial-figure { max-width: 440px; width: 100%; justify-self: center; }\n  .daytake-editorial-stage { aspect-ratio: 1 / 1.06; }\n  .daytake-editorial-media { width: 76%; }\n  .daytake-editorial-photo { border-radius: 22px; }\n  .daytake-editorial-open { width: 47px; height: 47px; right: -15px; }\n  .daytake-editorial-open svg { width: 18px; height: 18px; }\n  .daytake-editorial-toolbar { top: 25%; width: 44px; }\n  .daytake-editorial-toolbar :is(button,a) { width: 44px; height: 44px; }\n  .daytake-editorial-toolbar svg { width: 14px; height: 14px; }\n  .daytake-audio { padding: 8px 10px; width: 47%; }\n  .daytake-waveform { height: 24px; }\n  .daytake-waveform i { max-height: 24px; max-width: 2px; }\n  .daytake-audio-meta { font-size: .48rem; }\n  .daytake-editorial-card { padding: 5px; }\n  .daytake-editorial-card strong { font-size: .58rem; }\n  .daytake-editorial-card small { font-size: .44rem; }\n  .daytake-editorial-content { padding: 0 8px; }\n  .daytake-editorial-content h2 { font-size: 2.2rem; }\n  .daytake-editorial-content > p { font-size: .83rem; margin: 18px 0 22px; }\n  .daytake-editorial-actions { gap: 22px; }\n  .daytake-trust { margin-top: 26px; padding-top: 20px; }\n  .daytake-trust-item { flex-direction: row; align-items: center; font-size: .54rem; gap: 7px; }\n  .daytake-trust-item svg { width: 16px; height: 16px; }\n  .daytake-people { padding: 50px 0 40px; }\n  .daytake-people h2 { font-size: 2.2rem; }\n  .daytake-people > .daytake-wrap > p { font-size: .8rem; margin-top: 14px; }\n  .daytake-portrait-field { width: min(420px, 100%); height: 530px; margin-top: 20px; }\n  .daytake-portrait-line-wide { display: none; }\n  .daytake-portrait-line-phone { display: block; }\n  .daytake-creators { grid-template-columns: repeat(2, 1fr); grid-template-rows: 240px 240px; }\n  .daytake-creator-arrival { padding-top: 24px; }\n  .daytake-creator-arrival:nth-child(2) { padding-top: 80px; }\n  .daytake-creator-arrival:nth-child(3) { padding-top: 12px; }\n  .daytake-creator-arrival:nth-child(4) { padding-top: 66px; }\n  .daytake-creator-plate { width: clamp(130px, 35vw, 155px); margin-bottom: 17px; }\n  .daytake-creator-caption { gap: 6px; }\n  .daytake-creator-caption strong { font-size: .61rem; }\n  .daytake-creator-badge { padding: 2px 6px; font-size: .5rem; }\n  .daytake-creator-specialty { font-size: .58rem; }\n  .particle-1 { top: 4%; left: 52%; }\n  .particle-2 { top: 44%; left: 10%; }\n  .particle-3 { top: 51%; left: 87%; }\n  .daytake-footer { padding-block: 25px 18px; gap: 12px; }\n  .daytake-footer nav { gap: 18px; font-size: .65rem; }\n  .daytake-demo-note { font-size: .55rem; }\n  .daytake-dialog-info { padding: 17px; }\n  .daytake-dialog-info h2 { font-size: 1.15rem; }\n}\n@media (prefers-reduced-motion: reduce) {\n  .daytake-mosaic-grid { transform: rotate(-8deg); }\n  .daytake-mosaic-track { will-change: auto; }\n  .daytake-gallery-copy { display: none; }\n  .daytake-motion-toggle { display: none; }\n  .daytake-primary, .daytake-photo > img { transition: none; }\n}\n";

type Category = "People" | "Objects" | "Places";

const photoNotes: { title: string; category: Category; description: string; size?: [number, number] }[] = [
  { title: "Blue frequency", category: "People", description: "A woman wearing cobalt headphones against a blue studio wall" },
  { title: "Analog days", category: "Objects", description: "A vintage camera and film canister on an orange set" },
  { title: "After school", category: "People", description: "A skater caught in afternoon light" },
  { title: "First light", category: "Objects", description: "Sliced oranges casting shadows across a peach surface" },
  { title: "In motion", category: "People", description: "A dancer in a turquoise track jacket against mint green" },
  { title: "Upstairs", category: "Places", description: "A public staircase with a pink tiled wall" },
  { title: "Blue hour", category: "Objects", description: "Sunglasses on a blue surface with ripples of reflected light" },
  { title: "Red study", category: "People", description: "A curly-haired woman in red against a coral studio backdrop" },
  { title: "A quiet arrangement", category: "Objects", description: "Calla lilies arranged in a cobalt vase" },
  { title: "Out of frame", category: "People", description: "A photographer with a camera against a yellow wall" },
  { title: "Poolside", category: "Places", description: "An empty blue pool with a yellow diving board" },
  { title: "Last pair", category: "Objects", description: "Silver sneakers in a dark violet studio" },
  { title: "In the making", category: "People", description: "A graphic designer working on a colorful poster at a computer", size: [800, 1000] },
];

/** Full editorial landing page. Supply hosted photographs and a studio film URL. */
export function DaytakeLandingPage({ images, film }: { images: Readonly< Record< string, string>>; film: string }) {
  const photos = photoNotes.map((photo, index) => ({
    ...photo,
    id: index + 1,
    width: photo.size?.[0] ?? 358,
    height: photo.size?.[1] ?? 358,
    src: images["./assets/daytake-" + String(index + 1).padStart(2, "0") + ".webp"],
  }));
  
  
  type Photo = typeof photos[number];
  const editorial = photos[12];
  const question = photos[7];
  const galleryRows = [
    [photos[0], photos[2], photos[4], photos[7], photos[9], photos[5]],
    [photos[12], photos[8], photos[6], photos[3], photos[10], photos[11]],
  ];
  const mosaic = [
    [photos[5], photos[7], photos[3], photos[1]],
    [photos[8], photos[0], photos[10], photos[4]],
    [photos[2], photos[6], photos[9], photos[11]],
  ];
  const categoryIcons = { People: Users, Objects: Shapes, Places: MapPin };
  const features = [
    { title: "A different point of view.", description: "Photographs with a little more feeling. Find a perspective that makes your idea your own.", icon: Focus },
    { title: "Room to make it yours.", description: "Explore color, composition and character. See what happens when an image starts a new idea.", icon: Sparkles },
    { title: "Made to move you.", description: "From a quiet detail to a whole new direction. Follow the frames that catch your eye.", icon: Headphones },
  ];
  const creators = [
    { photo: photos[0], name: "Alexandra & Andrew", specialty: "Color & culture", color: "lavender", tilt: -8 },
    { photo: photos[4], name: "Girlfriend", specialty: "Movement & mood", color: "pink", tilt: 6 },
    { photo: photos[7], name: "Vanessa & Jony", specialty: "People & stories", color: "cream", tilt: -5 },
    { photo: photos[9], name: "Damian", specialty: "The everyday, reframed", color: "yellow", tilt: 8 },
  ];
  const waves = [
    { layout: "wide", box: "0 0 1120 390", path: "M -20 190 C 60 190 66 134 140 134 S 300 234 420 234 S 582 114 700 114 S 864 214 980 214 S 1080 170 1140 170" },
    { layout: "phone", box: "0 0 400 560", path: "M -16 150 C 35 150 45 110 100 110 S 245 175 300 175 C 425 175 420 390 300 390 S 155 335 100 335 C 10 335 -5 470 50 520" },
  ];
  const waveform = [5,11,18,9,22,15,8,24,30,16,23,11,20,28,16,9,21,32,19,25,14,7,15,23,12,29,18,8,20,13,6,11];
  const theme = usePreviewTheme("light");
  const [selected, setSelected] = useState< Photo | null>(null);
  const [showFilm, setShowFilm] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullFrame, setFullFrame] = useState(false);
  const root = useRef< HTMLDivElement>(null);
  const hero = useRef< HTMLElement>(null);
  const gallery = useRef< HTMLDivElement>(null);
  const library = useRef< HTMLElement>(null);
  const counter = useRef< HTMLSpanElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add({
      reduce: "(prefers-reduced-motion: reduce)",
      wide: "(min-width: 760px)",
      tall: "(min-height: 650px)",
    }, context => {
      const { reduce, wide, tall } = context.conditions!;
      const select = gsap.utils.selector(root);
      if (reduce) {
        if (counter.current) counter.current.textContent = "322,572";
        return;
      }
      const counterValue = { value: 319386 };
      const intro = gsap.timeline({ defaults: { ease: "power2.out" } });
      intro.fromTo(select(".daytake-hero-cta"), { opacity: .45, backgroundColor: "#e9a397" },
        { opacity: 1, backgroundColor: "#d84f38", duration: 1.15 }, 0)
        .to(counterValue, {
          value: 322572, duration: 2.6, ease: "power2.out",
          onUpdate: () => {
            if (counter.current) counter.current.textContent = Math.round(counterValue.value).toLocaleString("en-US");
          },
        }, .1);

      // The matrix owns 3D orientation; each child track owns its opposing travel.
      const unfurl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: hero.current, start: "top top",
          end: wide && tall ? () => "+=" + Math.round(innerHeight * .7) : "bottom top",
          pin: !!(wide && tall), pinSpacing: true, scrub: .65,
          anticipatePin: 1, invalidateOnRefresh: true,
        },
      });
      unfurl.addLabel("unfurl", 0)
        .fromTo(select(".daytake-mosaic-grid"),
          { rotationX: 18, rotationY: -24, rotationZ: -12, z: -150 },
          { rotationX: 3, rotationY: -3, rotationZ: -5, z: 0, duration: 1 }, "unfurl");
      gsap.utils.toArray< HTMLElement>(".daytake-mosaic-track", root.current).forEach((track, index) => {
        unfurl.fromTo(track, { yPercent: index === 1 ? -24 : -3 },
          { yPercent: index === 1 ? -4 : -25, duration: 1 }, "unfurl");
      });

      const featureCards = select(".daytake-feature");
      const featureIcons = select(".daytake-feature-icon");
      gsap.timeline({
        defaults: { duration: .55, ease: "power3.out" },
        scrollTrigger: { trigger: select(".daytake-features")[0], start: "top 82%", once: true },
      }).fromTo(featureCards, { opacity: .3, x: wide ? 28 : 12 }, { opacity: 1, x: 0, stagger: .13 }, 0)
        .fromTo(featureIcons, { scale: .55 }, { scale: 1, stagger: .13, ease: "back.out(1.5)" }, .08);

      // Scroll entrance and the horizontal glide use different wrappers.
      const badges = gsap.timeline({ paused: true })
        .fromTo(select(".daytake-photo-badge"), { scale: 0, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: .44, stagger: .018, ease: "back.out(1.45)" });
      const arrival = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: library.current, start: "top 92%", end: "top 50%",
          scrub: .45, invalidateOnRefresh: true,
          onUpdate: self => {
            if (self.progress > .96) badges.play();
          },
        },
      });
      arrival.addLabel("photos", 0);
      gsap.utils.toArray< HTMLElement>(".daytake-gallery-group", root.current).forEach(group => {
        arrival.fromTo(group.querySelectorAll(".daytake-photo-arrival"),
          { x: () => Math.min(innerWidth, 1300) * .83, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: .65, stagger: .09 }, "photos");
      });
      if (tall) {
        ScrollTrigger.create({
          trigger: library.current, start: "center center",
          end: () => "+=" + Math.round(innerHeight * (wide ? .66 : .38)),
          pin: true, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true,
        });
      }

      const editorialTimeline = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: select(".daytake-editorial")[0],
          start: "top 88%", end: wide ? "center 43%" : "top 12%",
          scrub: .45, invalidateOnRefresh: true,
        },
      });
      editorialTimeline.addLabel("grow", 0)
        .fromTo(select(".daytake-editorial-media"), { scale: .65, yPercent: 12 },
          { scale: 1, yPercent: 0, duration: .75, ease: "none" }, "grow")
        .addLabel("assemble", .42)
        .fromTo(select(".daytake-editorial-toolbar"), { x: -65, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: .38 }, "assemble")
        .fromTo(select(".daytake-audio"), { y: 56, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: .4 }, "assemble+=.1")
        .fromTo(select(".daytake-editorial-question"), { x: 38, y: 26, scale: .7, autoAlpha: 0 },
          { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: .43, ease: "back.out(1.1)" }, "assemble+=.14")
        .fromTo(select(".daytake-editorial-actions"), { x: 35, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: .35 }, "assemble+=.15")
        .fromTo(select(".daytake-trust-item"), { x: 20, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: .3, stagger: .07 }, "assemble+=.3")
        .fromTo(select(".daytake-editorial-connector"), { drawSVG: "0%" },
          { drawSVG: "100%", duration: .4, ease: "none" }, "assemble+=.38")
        .fromTo(select(".daytake-editorial-result"), { scale: .85, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: .25 }, "assemble+=.66");

      // A single reversible sequence: pastel plates, inner portrait seeds,
      // white card blooms, then the outer pair. Nothing runs on an idle loop.
      const field = select(".daytake-portrait-field")[0] as HTMLElement;
      const peopleTimeline = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: select(".daytake-people")[0],
          start: "clamp(top 72%)", end: "clamp(bottom 92%)",
          scrub: .6, invalidateOnRefresh: true,
        },
      });
      peopleTimeline
        .fromTo(select(".daytake-portrait-line"), { y: 40 }, { y: 0, duration: 1.5 }, 0)
        .fromTo(select(".daytake-portrait-trace"), { drawSVG: "0%" },
          { drawSVG: "100%", duration: 1.65, ease: "none" }, .12);

      select(".daytake-creator-arrival").forEach((item: HTMLElement, index: number) => {
        const inner = index === 1 || index === 2;
        const side = index < 2 ? -1 : 1;
        const at = inner ? .22 + (index - 1) * .09 : 1.02 + (index === 3 ? .08 : 0);
        const plate = item.querySelector(".daytake-creator-backplate");
        const avatar = item.querySelector(".daytake-creator-avatar");
        const body = item.querySelector(".daytake-creator-body");
        const caption = item.querySelector(".daytake-creator-caption");
        const travel = field.clientWidth * (wide ? .34 : .23);
        if (inner) {
          peopleTimeline.fromTo(item, { y: 110, scale: .7 },
            { y: 0, scale: 1, duration: .94 }, 0);
        } else {
          peopleTimeline.fromTo(item, { x: side * travel, y: 56, scale: .72 }, {
            motionPath: { path: [
              { x: side * travel, y: 56 },
              { x: side * travel * .43, y: -28 },
              { x: 0, y: 0 },
            ], curviness: 1.2 },
            scale: 1, duration: 1.05,
          }, .48);
        }
        peopleTimeline
          .fromTo(plate, { opacity: 0, rotation: creators[index].tilt + side * 16 },
            { opacity: 1, rotation: creators[index].tilt, duration: .85 }, inner ? 0 : .2)
          .fromTo(avatar, { scale: .1, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: .46, ease: "power3.out" }, at)
          .fromTo(body, { clipPath: "circle(2% at 50% 27%)", opacity: 0 },
            { clipPath: "circle(100% at 50% 45%)", opacity: 1, duration: .48 }, at + .24)
          .fromTo(caption, { y: 8, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: .25 }, at + .47);
      });
      select(".daytake-particle-arrival").forEach((dot: HTMLElement, index: number) => {
        const direction = index % 2 ? -1 : 1;
        const reach = wide ? 135 : 45;
        peopleTimeline.fromTo(dot, { x: direction * -reach, y: 62, autoAlpha: 0 }, {
          autoAlpha: 1, duration: 1.9, ease: "none",
          motionPath: { path: [
            { x: direction * -reach, y: 62 },
            { x: direction * -reach * .2, y: -48 - index * 7 },
            { x: 0, y: 0 },
          ], curviness: 1.5 },
        }, index * .035);
      });

      // Keyboard users can reach the creator buttons before a scrub finishes.
      // Reveal the composition immediately instead of focusing a hidden seed.
      const revealFocusedCreator = (event: FocusEvent) => {
        if ((event.target as HTMLElement).matches(".daytake-creator:focus-visible")) {
          peopleTimeline.scrollTrigger?.getTween()?.progress(1);
          peopleTimeline.progress(1);
        }
      };
      field.addEventListener("focusin", revealFocusedCreator);

      let disposed = false;
      const refresh = () => { if (!disposed) ScrollTrigger.refresh(); };
      document.fonts.ready.then(refresh);
      // Every image has reserved dimensions. Refreshing when off-screen lazy
      // duplicates load would repeatedly reset the horizontal gallery scrollers.
      return () => {
        disposed = true;
        field.removeEventListener("focusin", revealFocusedCreator);
      };
    });
    return () => media.revert();
  }, { scope: root });

  useEffect(() => {
    const strip = gallery.current;
    if (!strip) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const tracks = gsap.utils.toArray< HTMLDivElement>(".daytake-gallery-lane", strip).map((lane, index) => ({
        lane, group: lane.firstElementChild as HTMLElement, direction: index === 0 ? 1 : -1,
        period: 0, position: 0, rendered: 0, resumeAt: 0,
      }));
      const measure = () => {
        tracks.forEach(track => {
          const period = track.group.offsetWidth;
          if (period === track.period) return;
          track.position = track.period ? track.position / track.period * period : (track.direction === 1 ? 0 : period);
          track.period = period;
          track.lane.scrollLeft = track.position;
          track.rendered = track.lane.scrollLeft;
        });
      };
      const tick = (time: number, elapsed: number) => {
        if (document.hidden || root.current?.dataset.motionPaused === "true") return;
        // Visibility starts the glide. A resting pointer must not freeze the
        // whole gallery while the user scrolls through its entrance.
        const inspecting = !!strip.querySelector(":focus-visible") || strip.matches(":active");
        for (const track of tracks) {
          if (track.lane.scrollLeft !== track.rendered) {
            track.position = track.lane.scrollLeft;
            track.rendered = track.lane.scrollLeft;
            track.resumeAt = time + .8;
          }
          if (time < track.resumeAt || inspecting || !track.period) continue;
          track.position = gsap.utils.wrap(0, track.period,
            track.position + track.direction * Math.min(elapsed, 48) * .032);
          track.lane.scrollLeft = track.position;
          track.rendered = track.lane.scrollLeft;
        }
      };
      measure();
      const resize = new ResizeObserver(measure);
      tracks.forEach(track => resize.observe(track.group));
      const view = new IntersectionObserver(([entry]) => {
        gsap.ticker.remove(tick);
        if (entry.isIntersecting) gsap.ticker.add(tick);
      });
      view.observe(strip);
      return () => { resize.disconnect(); view.disconnect(); gsap.ticker.remove(tick); };
    });
    return () => media.revert();
  }, []);

  const motionControl = (
    <button className="daytake-motion-toggle" type="button"
      aria-label={motionPaused ? "Resume photo motion" : "Pause photo motion"}
      aria-pressed={motionPaused} onClick={() => setMotionPaused(value => !value)}>
      {motionPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
      <span>{motionPaused ? "Resume" : "Pause"}</span>
    </button>
  );

  function photoCard(photo: Photo, copy = false) {
    const Icon = categoryIcons[photo.category];
    return <div className="daytake-photo-arrival" key={photo.id}>
      <button className="daytake-photo" type="button" tabIndex={copy ? -1 : undefined}
        onMouseDown={copy ? event => event.preventDefault() : undefined}
        aria-label={"Preview " + photo.title} onClick={() => setSelected(photo)}>
        <img src={photo.src} alt={copy ? "" : photo.description} width={photo.width} height={photo.height} loading="lazy" />
        <span className="daytake-photo-badge daytake-category-badge"><Icon aria-hidden="true" /></span>
        <span className="daytake-photo-badge daytake-play-badge"><Play aria-hidden="true" fill="currentColor" /></span>
        <span className="daytake-photo-caption">{photo.title}</span>
      </button>
    </div>;
  }

  return (
    <div className="daytake" ref={root} id="top" data-motion-paused={motionPaused || !!selected || showFilm}>
      <style>{pageStyles}</style>
      <a className="preview-skip" href="#library">Skip to photos</a>
      <div className="daytake-window-bar" aria-hidden="true"><span><i /><i /><i /></span><span>yourstudio.in</span><Maximize /></div>
      <header className="daytake-header daytake-wrap">
        <a className="daytake-logo" href="#top"><Aperture aria-hidden="true" />studio</a>
        <nav aria-label="Main navigation">
          <a href="#about">Our idea</a><a href="#library">Collection</a><a href="#portraits">Creators</a>
        </nav>
        <ThemeToggle {...theme} />
      </header>
      <main>
        <section className="daytake-hero" ref={hero} aria-labelledby="daytake-title">
          <div className="daytake-mosaic" aria-hidden="true">
            <div className="daytake-mosaic-grid">
              {mosaic.map((column, index) => <div className="daytake-mosaic-column" key={index}>
                <div className="daytake-mosaic-track">{[0, 1].map(copy =>
                  <div className="daytake-mosaic-set" key={copy}>{column.map(photo =>
                    <img key={photo.id} src={photo.src} alt="" width="358" height="358" className="daytake-mosaic-tile"
                      fetchPriority={index === 1 && copy === 0 ? "high" : "auto"} />)}</div>)}</div>
              </div>)}
            </div>
          </div>
          <div className="daytake-wrap daytake-hero-content">
            <h1 id="daytake-title">Good images.<br /><span>Better work.</span></h1>
            <p>Editorial photography for people<br className="daytake-wide-break" /> making something of their own.</p>
            <a href="#library" className="daytake-primary daytake-hero-cta">Explore the collection <ArrowRight aria-hidden="true" /></a>
            <div className="daytake-counter">
              <span className="daytake-counter-icon"><Users aria-hidden="true" /></span>
              <span><small>Frames of possibility</small><strong aria-label="322,572"><span ref={counter} aria-hidden="true">322,572</span></strong></span>
            </div>
          </div>
          <div className="daytake-hero-foot daytake-wrap"><span>Find something worth making.</span><a href="#about">Take a look <ArrowDown aria-hidden="true" /></a></div>
        </section>

        <section className="daytake-features daytake-wrap" id="about" aria-label="How it works">
          <div className="daytake-feature-grid">{features.map(({ title, description, icon: Icon }) =>
            <article className="daytake-feature" key={title}>
              <span className="daytake-feature-icon"><Icon aria-hidden="true" /></span>
              <h2>{title}</h2><p>{description}</p>
            </article>)}</div>
        </section>

        <section className="daytake-library" id="library" ref={library} aria-labelledby="library-title">
          <div className="daytake-library-heading daytake-wrap">
            <h2 id="library-title">Find your next <span>frames.</span></h2>
            <p>Thousands of editorial photographs to explore.</p>
          </div>
          <div className="daytake-gallery" ref={gallery}>
            <div className="daytake-gallery-tilt">
              {galleryRows.map((row, index) => <div className="daytake-gallery-lane" key={index}
                aria-label={index === 0 ? "First photo row" : "Second photo row"}>
                {[0, 1, 2].map(copy => <div key={copy}
                  className={"daytake-gallery-group" + (copy ? " daytake-gallery-copy" : "")}
                  aria-hidden={copy ? "true" : undefined}>
                  {row.map(photo => photoCard(photo, !!copy))}
                </div>)}
              </div>)}
            </div>
          </div>
          <div className="daytake-gallery-footer daytake-wrap"><span>A fresh perspective, in every frame.</span>{motionControl}</div>
        </section>

        <section className="daytake-editorial daytake-wrap" aria-labelledby="daytake-editorial-title">
          <figure className="daytake-editorial-figure">
            <div className="daytake-editorial-stage">
              <div className="daytake-editorial-media">
                <button className="daytake-editorial-photo" type="button" data-full-frame={fullFrame}
                  aria-label={"Open featured photo " + editorial.title} onClick={() => setSelected(editorial)}>
                  <img src={editorial.src} alt={editorial.description} width={editorial.width} height={editorial.height} loading="lazy" />
                </button>
                <button className="daytake-editorial-open" type="button" aria-label="Play studio film" onClick={() => setShowFilm(true)}><Play fill="currentColor" aria-hidden="true" /></button>
              </div>
              <div className="daytake-editorial-toolbar" role="group" aria-label="Featured photo tools">
                <button aria-label="Open full image" onClick={() => setSelected(editorial)}><ImageIcon aria-hidden="true" /></button>
                <button aria-label="Show full photo" aria-pressed={fullFrame} onClick={() => setFullFrame(value => !value)}><Crop aria-hidden="true" /></button>
                <button aria-label={saved ? "Unsave featured photo" : "Save featured photo"} aria-pressed={saved} onClick={() => setSaved(value => !value)}>{saved ? <Check aria-hidden="true" /> : <Heart aria-hidden="true" />}</button>
                <a href={editorial.src} download="daytake-in-the-making.webp" aria-label="Download featured photo"><Download aria-hidden="true" /></a>
              </div>
              <div className="daytake-audio" aria-label="Illustrative audio waveform, 1 minute 45 seconds">
                <div className="daytake-waveform" aria-hidden="true">{waveform.map((height, index) => <i key={index} style={{ height }} />)}</div>
                <div className="daytake-audio-meta"><span><Play size={10} fill="currentColor" /> Studio notes</span><span>01:45</span></div>
                <span className="daytake-audio-progress" aria-hidden="true" />
              </div>
              <svg className="daytake-editorial-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path className="daytake-editorial-connector" d="M 86 61 H 94 Q 97 61 97 64 V 85 Q 97 88 94 88 H 79 M 82 86 L 79 88 L 82 90" />
              </svg>
              <button className="daytake-editorial-card daytake-editorial-question" type="button"
                aria-label="Preview Question photo" onClick={() => setSelected(question)}>
                <span className="daytake-mini-image"><img src={question.src} alt="" width="358" height="358" loading="lazy" /><i><Play fill="currentColor" /></i></span>
                <strong>Question</strong><small>Where will it take you?</small>
              </button>
              <button className="daytake-editorial-card daytake-editorial-result" type="button"
                aria-label="Preview Result photo" onClick={() => setSelected(photos[4])}>
                <img src={photos[4].src} alt="" width="358" height="358" loading="lazy" />
                <strong>A new direction.</strong>
              </button>
            </div>
            <figcaption>In the making. A little space to create.</figcaption>
          </figure>
          <div className="daytake-editorial-content">
            <h2 id="daytake-editorial-title">Make room for<br />your next <span>idea.</span></h2>
            <p>A different image can change everything. Follow a color, a feeling, a spark. Give your next idea somewhere to begin.</p>
            <div className="daytake-editorial-actions">
              <a className="daytake-primary" href="#library">Get started <ArrowRight aria-hidden="true" /></a>
              <button className="daytake-watch" type="button" onClick={() => setShowFilm(true)}><span><Play fill="currentColor" aria-hidden="true" /></span>Watch video</button>
            </div>
            <div className="daytake-trust">
              <div className="daytake-trust-item"><Aperture aria-hidden="true" /><span>100% original<br />content</span></div>
              <div className="daytake-trust-item"><BadgeCheck aria-hidden="true" /><span>Checked by<br />our team</span></div>
              <div className="daytake-trust-item"><MessageCircle aria-hidden="true" /><span>Direct<br />support</span></div>
            </div>
          </div>
        </section>

        <section className="daytake-people" id="portraits" aria-labelledby="daytake-people-title">
          <div className="daytake-wrap">
            <h2 id="daytake-people-title">The people<br />in the <span>frame.</span></h2>
            <p>Different eyes. Endless stories.</p>
          </div>
          <div className="daytake-portrait-field">
            {waves.map(({ layout, box, path }) => <svg key={layout}
              className={"daytake-portrait-line daytake-portrait-line-" + layout}
              viewBox={box} preserveAspectRatio="none" aria-hidden="true">
              <path className="daytake-portrait-trace" d={path} />
            </svg>)}
            {[0,1,2,3].map(index => <span className={"daytake-particle-arrival particle-" + index} key={index} aria-hidden="true"><i className="daytake-particle" /></span>)}
            <ul className="daytake-creators">{creators.map(({ photo, name, specialty, color, tilt }) =>
              <li className="daytake-creator-arrival" key={name}>
                <button className="daytake-creator" type="button" onClick={() => setSelected(photo)} aria-label={"View " + name + "'s portrait"}>
                  <span className={"daytake-creator-plate " + color} style={{ "--tilt": tilt + "deg" } as CSSProperties}>
                    <span className={"daytake-creator-backplate " + color} aria-hidden="true" />
                    <span className="daytake-creator-body" aria-hidden="true" />
                    <span className="daytake-creator-avatar"><img src={photo.src} alt={photo.description} width="358" height="358" loading="lazy" /></span>
                    <span className="daytake-creator-caption"><strong>{name}</strong><span className="daytake-creator-badge">Creator <ArrowUpRight aria-hidden="true" /></span></span>
                  </span>
                  <small className="daytake-creator-specialty">{specialty}</small>
                </button>
              </li>)}</ul>
          </div>
          <a className="daytake-text-link" href="#library">Meet your next inspiration <ArrowUpRight aria-hidden="true" /></a>
        </section>
      </main>
      <footer className="daytake-footer daytake-wrap">
        <div><a className="daytake-logo" href="#top"><Aperture aria-hidden="true" />studio</a><p>A fresh way to see things.</p></div>
        <nav aria-label="Footer navigation"><a href="#about">Our idea</a><a href="#library">Collection</a><a href="#portraits">Creators</a></nav>
        <small className="daytake-demo-note">Sample text. Replace with your own.</small>
      </footer>
      {selected && <PreviewDialog label={selected.title} onClose={() => setSelected(null)}>
        <img className="daytake-dialog-photo" src={selected.src} alt={selected.description} width={selected.width} height={selected.height} />
        <div className="daytake-dialog-info"><div><h2>{selected.title}</h2><p>{selected.description}</p></div>
          <a className="preview-icon-button" href={selected.src} download aria-label={"Download " + selected.title}><Download aria-hidden="true" /></a></div>
      </PreviewDialog>}
      {showFilm && <PreviewDialog label="Studio film" onClose={() => setShowFilm(false)}>
        <video className="daytake-studio-film" src={film} poster={editorial.src} controls autoPlay muted playsInline />
        <div className="daytake-dialog-info"><div><h2>A little room to create.</h2><p>A short, silent film from our collection.</p></div></div>
      </PreviewDialog>}
    </div>
  );
}
