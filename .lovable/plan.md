

# Launch Offer Carousel + `ezyLAUNCH` Coupon

## What we're building

1. **Home page carousel banner** — An auto-scrolling promotional carousel at the top of the home page (below Navbar, above hero) showcasing the launch offer with the `ezyLAUNCH` code. Eye-catching design with copy/paste code button.

2. **`ezyLAUNCH` coupon backend** — Unlike existing coupons (lifetime access), this one grants **30-day free premium**. After 30 days, the user automatically reverts to free tier (handled by the existing `check-subscription` expiry logic). One use per account, enforced via `coupon_redemptions` table.

3. **Redemption flow from home page** — A "Redeem Now" button in the carousel that either:
   - Redirects to `/subscription` with the coupon pre-filled, or
   - Redeems directly if logged in (with toast feedback)

## Technical steps

### Step 1: Update `redeem-coupon` edge function
- Add `"ezylaunch"` to `VALID_COUPONS` array
- Make it a **time-limited coupon**: when `normalizedCode === "ezylaunch"`, set `expires_at` to `now + 30 days` instead of `null`
- Update success message to say "30-day free premium access"

### Step 2: Add carousel to Home page
- Import the existing `Carousel` component from `src/components/ui/carousel.tsx`
- Place a promotional banner carousel between Navbar and Hero section
- Slides:
  - **Slide 1**: "🚀 Launch Offer – Limited Time!" with code `ezyLAUNCH`, copy button, and "Redeem Now" CTA linking to `/subscription?coupon=ezyLAUNCH`
  - **Slide 2**: Feature highlights (can add more slides later)
- Auto-play with `embla-carousel-autoplay` plugin
- Styled with gradient background, animated badges

### Step 3: Pre-fill coupon on Subscription page
- Read `coupon` from URL search params in `Subscription.tsx`
- Auto-populate `couponCode` state if present
- Optionally auto-trigger redemption

### Security
- One-use-per-user enforced by existing `coupon_redemptions` check in the edge function
- Expiry enforced by existing `check-subscription` function which checks `expires_at`
- No client-side premium checks — all server-side via edge functions

