## Issue

The hero section is `min-h-[90vh]` but its content (`heroOpacity`) fades to **0 by 400px of scroll** and shrinks via `heroScale`. On most screens you're still inside the hero at that scroll point, so the title/CTA vanish and you see a blank stage before the next section scrolls into view.

The same `ParallaxBackground` wrapper also fades its decorative blobs to 0 over `[0, 600]`, contributing to the empty look.

## Fix

In `src/pages/Home.tsx`:

1. **Remove the scroll-tied opacity & scale on the hero content.** Keep only a gentle parallax `y` shift so it still feels alive without disappearing.
   - Drop `heroOpacity` and `heroScale`.
   - Reduce `heroY` range to `[0, 600] → [0, 30]` for a subtler glide.
   - Update `style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}` → `style={{ y: heroY }}`.
   - Remove the `style={{ opacity: heroOpacity }}` on the scroll-down indicator (let it fade naturally when out of view).

2. **Stop the ParallaxBackground from fully fading.** Change its `opacity` transform from `[1, 0]` to `[1, 0.4]` so the ambient gradients/grain never hit a blank state during the hero.

Result: hero stays readable for the full 90vh, the next section enters cleanly underneath, no blank gap.

No other sections touched — `whileInView` fades for downstream sections are scoped per-element and don't cause the gap.
