// @ts-nocheck
/* eslint-disable */
"use client";

import type { CSSProperties } from "react";
import HairlinePhone from "@/components/ui/hairline-phone";

/**
 * Hairline, wearing your theme: the Phone figure's palette mapped to shadcn's
 * tokens, so it follows light, dark and whatever you have made of them. Same
 * mapping the project's own published registry wrapper uses for Phone
 * (registry/src/hairline.tsx), trimmed to just this figure.
 */
const tokens = {
  "--hairline-plate": "var(--background)",
  "--hairline-hi": "var(--foreground)",
  "--hairline-edge": "var(--muted-foreground)",
  "--hairline-mid": "color-mix(in oklab, var(--muted-foreground) 55%, var(--background))",
  "--hairline-lo": "var(--border)",
} as CSSProperties;

export default function HairlinePhoneDemo() {
  return (
    <div className="flex w-full items-center justify-center bg-background p-10 text-foreground">
      <HairlinePhone
        style={{ ...tokens, width: 320 }}
        aria-label="A phone taken apart into four layers: glass, board, battery, shell"
      />
    </div>
  );
}
