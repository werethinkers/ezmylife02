## Goal
Create promo-only Product Detail Pages (PDPs) — one per AI app — modeled on the uploaded AnglePro reference. Pages are NOT linked from the main site (hidden from nav, sitemap, robots), but live at shareable URLs. The "Use it" CTA gates on auth, then opens the actual tool, automatically charging the configured credit cost. Admins can edit every section of each PDP and toggle Launch (publish) per page.

## URL structure
- Public route (hidden from navbar/footer): `/promo/:slug`
- Example: `/promo/anglepro`, `/promo/virasat`, `/promo/startup-analyser`
- `slug` resolves to a `tools_catalog.id` via a new `tool_promo_pages.slug` column
- Admin editor at `/admin` → new sidebar tab **"Promo Pages"**
- Added to `robots.txt` Disallow `/promo/` so it's indexable only by direct UTM-tagged links

## Data model
New table `tool_promo_pages` (1:1 with `tools_catalog`):

```text
id              uuid pk
tool_id         text fk → tools_catalog(id)  unique
slug            text unique          -- url segment
is_published    boolean default false  -- "Launch" toggle
hero_eyebrow    text  -- e.g. "AI POWERED"
hero_title      text  -- "One Image."
hero_title_accent text -- "Endless Angles." (gradient)
hero_subtitle   text
hero_image_url  text
hero_chips      jsonb -- [{label,icon}] e.g. Multiple Angles, High Quality
cta_label       text  -- "Try AnglePro Now"
cta_sublabel    text  -- "1 CREDIT to start" (auto-filled from tool_pricing but overridable)
rating          numeric, reviews_count int, social_proof text
trust_logos     jsonb -- [{name,url}]
features        jsonb -- [{icon,title,body}] (Why You'll Love)
how_it_works    jsonb -- [{step,title,body,icon}]
testimonials    jsonb -- [{name,role,quote,rating,avatar}]
stats           jsonb -- e.g. {"users":"50,000+","label":"Happy Users"}
final_cta_title text, final_cta_subtitle text
footer_badges   jsonb -- Secure & Private / 24/7 Support / Credit System / Cancel Anytime
seo_title text, seo_description text, og_image_url text
created_at, updated_at timestamptz
```

RLS:
- `SELECT` allowed to everyone WHERE `is_published = true` (anon access for marketing).
- Admins: full CRUD via `has_role(auth.uid(),'admin')`.

## Frontend
**`src/pages/PromoPage.tsx`** (route `/promo/:slug`):
- Fetches `tool_promo_pages` joined with `tools_catalog` + `tool_pricing`.
- Renders the AnglePro-style layout using existing design tokens (gradient primary→accent, glass cards, Space Grotesk). Reuses `Navbar` in a lightweight "promo" mode (no main nav links) and the standard footer.
- "Use it" button behavior:
  1. If not signed in → opens `LoginPromptDialog` with `returnTo=/promo/:slug?launch=1`.
  2. If signed in → navigates to `/tool/:toolId` (existing `ToolViewer`). Credit deduction already happens inside each tool via `useCredits` / `runWithCredits`, so the promo CTA does NOT pre-charge — it just routes. (Pre-charging would double-charge.)
  3. If URL has `?launch=1` after auth callback, auto-redirect to `/tool/:toolId`.
- Sections built as small subcomponents: `PromoHero`, `PromoTrustBar`, `PromoFeatures`, `PromoHowItWorks`, `PromoTestimonials`, `PromoFinalCta`, `PromoFooterBadges`.
- `SEOHead` per page; `<meta name="robots" content="noindex,nofollow">` so they're whitelisted only when admin chooses (toggle `seo_indexable` later if needed — default noindex for promo).

**Hidden from main site**: do NOT add `/promo` to Navbar, Footer, sitemap. `public/robots.txt` gets `Disallow: /promo/`.

## Admin editor
**`src/components/admin/PromoPagesManager.tsx`** wired into `AdminDashboard` as tab "Promo Pages":
- Table of all tools (from `tools_catalog`) with columns: Name, Slug, Published, Last edited, Actions (Edit / Open / Copy link).
- "New promo page" → pick a tool from a combobox, auto-suggest slug from name.
- Editor drawer with tabs: **Hero**, **Trust & Stats**, **Features**, **How it works**, **Testimonials**, **Final CTA & Footer**, **SEO**.
  - Inline image upload using existing storage bucket (`tool-media` or new `promo-pages`).
  - JSONB lists edited with add/remove/reorder rows.
  - Live preview pane (right side) renders the same `PromoPage` components.
- "Launch" switch flips `is_published`. Saving an unpublished page is allowed; only published pages serve to anon users.
- "Generate with AI" helper (optional, behind a button): calls a new edge function `generate-promo-page` that uses Lovable AI Gateway (Gemini 2.5 Flash) to draft hero/features/testimonials from `tools_catalog` description + category. Admin can accept/edit. (Uses same fallback strategy memory.)

## Edge function
`supabase/functions/generate-promo-page/index.ts`:
- Input: `{ tool_id }`
- Auth: admin only (`has_role` check).
- Calls Lovable AI Gateway with structured prompt → returns JSON matching the `tool_promo_pages` shape.
- Returns draft; admin reviews + saves.

## Credit flow (clarification)
The PDP does **not** charge credits. It only routes the authenticated user into the live tool, which already handles its own credit gating via `useCredits` + `tool-charge` edge function. This avoids double-charge and keeps the source of truth in `tool_pricing`. The CTA sublabel auto-displays `${credit_cost} CREDIT${s} to start` from `useToolPricing`.

## Rollout
1. Migration: create `tool_promo_pages` table + RLS + storage bucket if needed.
2. Build `PromoPage` route + components.
3. Build `PromoPagesManager` admin tab + JSON editors + live preview.
4. Edge function for AI draft generation.
5. Update `robots.txt` to disallow `/promo/`.
6. Seed one published example (AnglePro for ProductVision360 → slug `anglepro`) so the admin can clone the pattern.

## Out of scope
- A/B testing variants, multi-language, public marketplace listing — can be added later.
- Custom domains per promo page (use UTM links via existing `utm_links` table instead).
