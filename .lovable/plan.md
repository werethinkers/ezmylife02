## Remove Launch Offer Coupon Banner

The `ezyLAUNCH` coupon banner currently renders at the top of the Home page.

### Changes
1. **`src/pages/Home.tsx`** — Remove the `<LaunchOfferBanner />` render and its import.
2. **`src/components/LaunchOfferBanner.tsx`** — Delete the file (no longer used anywhere).

### Notes
- No other files reference `LaunchOfferBanner`.
- The credits system already replaced subscriptions, so this banner is stale.
- Memory `mem://features/subscription/launch-offer-promotion` will be removed since the promotion is retired.