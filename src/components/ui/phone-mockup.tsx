/*
 * Phone mockup: a modern phone with a slim metal edge, side buttons, a pill-shaped camera
 * cut-out, a status bar and a home bar. Websites and cards are shown inside it at phone width.
 *
 * Adapted from PhoneMockupCard in OpenSourceUI (https://opensourceui.in/components/phone),
 * restyled for Ezyourlife (ink outline, block shadow) and changed to hold live content.
 *
 * MIT License
 *
 * Copyright (c) 2026 Bidyut Kundu
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Size = "md" | "sm";

const SIZES = {
  md: { body: "rounded-[3rem] p-[10px]", screen: "rounded-[2.4rem]", bar: 34, island: "top-[9px] h-[25px] w-[31%]", text: "text-[13px]", home: "bottom-[7px] h-[5px]", btn: "w-[3px]" },
  sm: { body: "rounded-[1.6rem] p-[5px]", screen: "rounded-[1.25rem]", bar: 16, island: "top-[4px] h-[10px] w-[30%]", text: "text-[0px]", home: "bottom-[4px] h-[3px]", btn: "w-[2px]" },
} as const;

function StatusIcons({ fg }: { fg: string }) {
  // Signal bars, Wi-Fi and battery, drawn small so they read at any width.
  return (
    <span className="flex items-center gap-[5px]" style={{ color: fg }}>
      <svg viewBox="0 0 18 12" className="h-[10px] w-auto" fill="currentColor" aria-hidden="true">
        <rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" />
      </svg>
      <svg viewBox="0 0 16 12" className="h-[10px] w-auto" fill="currentColor" aria-hidden="true">
        <path d="M8 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.7 10.7 0 0 0 8 .4C5.2.4 2.5 1.5.5 3.4l1.2 1.3A9 9 0 0 1 8 2.2Zm0 3.6c1.4 0 2.7.5 3.7 1.4l1.2-1.3A7.3 7.3 0 0 0 8 4c-1.8 0-3.6.7-4.9 1.9l1.2 1.3c1-.9 2.3-1.4 3.7-1.4Zm0 3.6c.5 0 1 .2 1.3.5L8 11.6 6.7 9.9c.3-.3.8-.5 1.3-.5Z" />
      </svg>
      <svg viewBox="0 0 27 12" className="h-[10px] w-auto" aria-hidden="true">
        <rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke="currentColor" strokeOpacity=".45" />
        <rect x="2" y="2" width="19" height="8" rx="1.8" fill="currentColor" />
        <path d="M24.5 4v4c.8-.3 1.5-1.1 1.5-2s-.7-1.7-1.5-2Z" fill="currentColor" fillOpacity=".45" />
      </svg>
    </span>
  );
}

export interface PhoneMockupProps {
  children: ReactNode;
  /** Colour behind the status bar and the screen (use the design's own background). */
  screenBg?: string;
  /** Colour of the clock and status icons (use the design's own text colour). */
  screenFg?: string;
  /** Height of the content area below the status bar, in px. Or set it with screenClassName. */
  height?: number;
  /** Extra classes for the content area, e.g. responsive heights. */
  screenClassName?: string;
  /** Extra inline styles for the content area. */
  screenStyle?: CSSProperties;
  /** "sm" for small pictures in carousels and cards. */
  size?: Size;
  /** Show only the top of the phone, as if it rises out of the box below. */
  cropped?: boolean;
  /** Ink block shadow behind the phone. */
  shadow?: boolean;
  className?: string;
}

/** A realistic phone around any content. The content area scrolls; the frame does not. */
export function PhoneMockup({ children, screenBg = "#ffffff", screenFg = "#121212", height, screenClassName, screenStyle, size = "md", cropped, shadow = true, className }: PhoneMockupProps) {
  const s = SIZES[size];
  return (
    <div className={cn("relative mx-auto w-full", className)}>
      {/* Side buttons sit just outside the edge: silent switch and volume on the left, power on the right. */}
      <i aria-hidden="true" className={cn("absolute -left-[2px] top-[13%] h-[4%] -translate-x-full rounded-l-sm bg-ink", s.btn)} />
      <i aria-hidden="true" className={cn("absolute -left-[2px] top-[20%] h-[8%] -translate-x-full rounded-l-sm bg-ink", s.btn)} />
      <i aria-hidden="true" className={cn("absolute -left-[2px] top-[30%] h-[8%] -translate-x-full rounded-l-sm bg-ink", s.btn)} />
      <i aria-hidden="true" className={cn("absolute -right-[2px] top-[23%] h-[12%] translate-x-full rounded-r-sm bg-ink", s.btn)} />

      <div
        className={cn(
          "relative border-2 border-ink bg-[linear-gradient(145deg,#3a3a3a_0%,#141414_38%,#0b0b0b_62%,#2c2c2c_100%)]",
          s.body,
          shadow && (size === "sm" ? "shadow-block-sm" : "shadow-block"),
          cropped && "rounded-b-none border-b-0 pb-0 shadow-none",
        )}
      >
        <div className={cn("relative overflow-hidden bg-black", s.screen, cropped && "rounded-b-none")} style={{ background: screenBg }}>
          {/* Status bar with the camera pill in the middle. */}
          {/* The small size floats it over the picture, as on a real phone, so no coloured strip shows. */}
          <div className={cn("flex items-center justify-between px-[9%] font-semibold tabular-nums", s.text, size === "sm" ? "absolute inset-x-0 top-0 z-10" : "relative")} style={{ height: s.bar, color: screenFg, background: size === "sm" ? undefined : screenBg }}>
            {size === "md" ? <span>9:41</span> : <span />}
            {size === "md" && <StatusIcons fg={screenFg} />}
            <span aria-hidden="true" className={cn("absolute left-1/2 -translate-x-1/2 rounded-full bg-black", s.island)}>
              <i className="absolute right-[9%] top-1/2 h-[45%] w-auto -translate-y-1/2 rounded-full bg-[#1d2a44] [aspect-ratio:1]" />
            </span>
          </div>
          {/* The transform makes this box the containing block for the page's fixed bars and sheets;
              it must not scroll itself, or they would scroll away with the content. */}
          <div className={cn("ip-frame relative overflow-hidden", screenClassName)} style={{ height, transform: "translateZ(0)", ...(height ? { ["--ip-vh" as string]: `${height}px` } : null), ...screenStyle }}>
            {children}
          </div>
          {!cropped && <i aria-hidden="true" className={cn("pointer-events-none absolute left-1/2 z-50 w-[34%] -translate-x-1/2 rounded-full opacity-40", s.home)} style={{ background: screenFg }} />}
        </div>
      </div>
    </div>
  );
}
