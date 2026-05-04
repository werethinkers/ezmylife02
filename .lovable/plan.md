## Goal

Make the whole journey feel like one guided funnel — every page tells the user where they are, what to do next, and post-payment lands them on the next logical step (not the homepage). Plus a media-rich tools experience and a redesigned pricing page with an Enterprise tier and smart upgrade nudges.

---

## 1. Step-by-step user flow (FunnelStepper)

**New component:** `src/components/FunnelStepper.tsx`
- Sticky bar shown under the navbar on key pages.
- Steps: `1 Sign in → 2 Choose Plan → 3 Pick a Tool → 4 Use it`
- Highlights the current step, dims the rest, click-to-jump for completed steps.
- Driven by `useAuth()` + `useSubscription()` so it updates live.

**Mounted on:** `Auth.tsx`, `Subscription.tsx`, `Tools.tsx`, `ToolViewer.tsx`.

**Each page gets a "What now?" header strip** — one-line title + one-line next-action helper (e.g. on Subscription: "Pick a plan to unlock 2000+ tools — you'll go straight to the tool you wanted next.").

## 2. Post-payment forward navigation (no homepage bounce)

**`Subscription.tsx`** — after successful payment / trial / coupon redemption:
1. If `auth_redirect_to` exists → go there.
2. Else if `?next=<path>` query param → go there.
3. Else → `/tools` (catalog), never `/`.

**`verify-razorpay-payment` handler** (client side in `Subscription.tsx`): replace current `checkSubscriptionStatus()` only with the redirect logic above + a 600ms success animation.

**`AuthCallback.tsx`** — already redirects to stored path; add support for `?next=` propagated through OAuth `state` and ensure non-subscribed tool clicks go `/subscription?next=/tool/<id>` instead of just `/subscription`.

**`ToolAccessGuard.tsx` / `PremiumRoute.tsx`** — when bouncing unauth/non-premium users, append `?next=<currentPath>` to the destination URL in addition to the localStorage flag (more robust across tab reloads).

## 3. Media-rich tools experience

**New table:** `tool_media`
```
id uuid pk, tool_id text, kind text ('video'|'image'|'gif'),
url text, poster_url text nullable, alt text, sort_order int,
created_at timestamptz default now()
```
RLS: public read; admin insert/update/delete via `has_role`.

**Admin tab:** add `ToolMediaManager.tsx` under AdminDashboard for uploading per-tool media (Storage bucket `tool-media`).

**Components:**
- `src/components/tools/ToolMediaCarousel.tsx` — auto-rotating carousel of images/videos for a tool, used inside `ToolQuickPreview` and at the top of `ToolViewer`.
- `src/components/tools/FloatingMediaPreview.tsx` — on hover of an `EnhancedToolCard`, a small floating panel appears next to the cursor showing the first media asset (muted autoplay video or image). Scroll-triggered fade-in for cards in viewport.

**Tool catalog page** — add a "Media" toggle in `ToolsHeader` to switch the grid into a richer card layout with embedded thumbnails.

## 4. Pricing page redesign (`Subscription.tsx`)

Replace the current single-yearly-card layout with a **3-column plan grid always visible**: Trial (24h) · Monthly · Yearly (highlighted "Best Value"), plus a 4th **Enterprise** card.

- Each card: price, top 4 benefits, single CTA, "what's included" expand.
- Sticky comparison row at the bottom with checkmarks.
- **Coupon code** moves into a `Dialog` modal triggered by a small `"Have a coupon?"` link below the plans (keeps UI clean).
- **Launch offer banner** stays compact, becomes a thin ribbon above the grid.

## 5. Smart upgrade nudges

In `Subscription.tsx`, when `isPremium` is true, instead of the single "Welcome back" card show:
- Current plan summary card.
- **Upgrade panel** based on `accessType`:
  - `trial` → "Lock in unlimited access — upgrade to Monthly"
  - `subscription` + monthly billing → "Save 60% — switch to Yearly"
  - `subscription` + yearly → "Scale your team — Talk to our Enterprise team"
  - `lifetime/coupon` → just show enterprise upsell.
- Side-by-side benefits comparison (current vs. recommended).

## 6. Enterprise funnel

**New plan card** "Enterprise — Custom":
- Bullets: SSO, dedicated success manager, custom tools, SLA, volume pricing.
- CTA "Talk to Sales" opens `EnterpriseContactDialog.tsx` (name, work email, company size, use case, message).
- Submits to new edge function `enterprise-inquiry` → inserts into `enterprise_inquiries` table + sends notification (uses existing email infra if available, else just logs to DB + admin tab).

**Admin tab:** "Enterprise Leads" listing inquiries.

## 7. Polish

- Consistent page headers with breadcrumb + next-step hint.
- Subtle Framer Motion fade/slide between funnel steps (matches existing `pageVariants`).
- All new copy: short, action-led ("Pick a plan", "Open your tool", "Talk to sales").

---

## Technical notes

**Files created**
- `src/components/FunnelStepper.tsx`
- `src/components/tools/ToolMediaCarousel.tsx`
- `src/components/tools/FloatingMediaPreview.tsx`
- `src/components/EnterpriseContactDialog.tsx`
- `src/components/admin/ToolMediaManager.tsx`
- `src/components/admin/EnterpriseLeads.tsx`
- `supabase/functions/enterprise-inquiry/index.ts`
- migration: `tool_media`, `enterprise_inquiries`, storage bucket `tool-media`, RLS policies.

**Files edited**
- `src/pages/Subscription.tsx` — full layout rewrite, redirect logic, coupon modal, upgrade nudges, enterprise card.
- `src/pages/AuthCallback.tsx` — `?next=` support + non-premium tool redirect to `/subscription?next=...`.
- `src/components/ToolAccessGuard.tsx`, `src/components/PremiumRoute.tsx` — append `?next=` query param.
- `src/pages/Auth.tsx`, `src/pages/Tools.tsx`, `src/pages/ToolViewer.tsx` — mount `FunnelStepper`.
- `src/components/tools/EnhancedToolCard.tsx` — wire `FloatingMediaPreview`.
- `src/components/tools/ToolQuickPreview.tsx` — embed `ToolMediaCarousel`.
- `src/pages/AdminDashboard.tsx` — new tabs: Tool Media, Enterprise Leads.

**No breaking changes** to auth, payment verification, or existing RLS.
