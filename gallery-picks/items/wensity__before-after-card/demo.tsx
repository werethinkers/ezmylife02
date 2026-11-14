// @ts-nocheck
/* eslint-disable */
"use client";

import { BeforeAfterCard } from "@/components/ui/before-after-card";

/* ───────────────────────── Assets ───────────────────────── */

/*
 * The default mode greys the same photo, so colour has to be the subject or
 * the wipe shows almost nothing, a misty blue-grey mountain lake desaturates
 * to very nearly itself. The ramen bar is split warm/cool along the axis the
 * handle travels: amber counter on the right, cold wet street on the left,
 * and that split is exactly what greyscale destroys. Its dark base also gives
 * the white divider, knob and corner labels something to read against.
 *
 * Both are 16:9 and crop the same way into the card's 3:2 frame, and both are
 * the same rain-lit night scene, so the two-photo mode looks like two frames
 * from one shoot rather than two unrelated stock pictures.
 */
const AFTER_SRC =
  "https://cdn.21st.dev/assets/mirror/d9/d930ab1f3f70cce520dffc709619b1b15bd33712ce5868c4bf6376b907be0e91.webp";
const BEFORE_SRC =
  "https://cdn.21st.dev/assets/mirror/df/df09b3328efb1755ffbbcb74b7274662dccc5e031221c296e9632e00cd7c3c14.webp";

/* ───────────────────────── Playground ───────────────────────── */

const settings = {
  defaultPosition: 46,
  orientation: "horizontal",
  showPercent: true,
  dualImage: false,
};

/* ───────────────────────── Previews ───────────────────────── */

export function BeforeAfterCardPreview(props: Partial<typeof settings> = {}) {
  const state = { ...settings, ...props };

  return (
    <div className="flex w-full items-center justify-center px-4 py-6 sm:px-8">
      <BeforeAfterCard
        key={`${state.orientation}-${state.dualImage}-${state.defaultPosition}`}
        className="w-full max-w-4xl"
        afterSrc={AFTER_SRC}
        beforeSrc={state.dualImage ? BEFORE_SRC : undefined}
        beforeAlt={
          state.dualImage
            ? "Rain-lit cafe window looking onto a wet autumn street"
            : "Steaming ramen bowl on a night counter, raw exposure"
        }
        afterAlt="Steaming ramen bowl on a night counter, graded"
        beforeLabel="Raw"
        afterLabel="Grade"
        caption="Drag the lens to wipe between exposures."
        defaultPosition={state.defaultPosition}
        orientation={state.orientation}
        showPercent={state.showPercent}
        autoDemo
      />
    </div>
  );
}

/* ───────────────────────── Controls ───────────────────────── */

export default function Demo(props: Partial<typeof settings>) {
  return <BeforeAfterCardPreview {...props} />;
}
