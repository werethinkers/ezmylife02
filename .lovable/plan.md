## Continue Credits Migration — Remaining Work

The credit-based monetization foundation is in place (DB schema, wallet, purchase flow, `tool-charge` RPC, `useWallet`/`runWithCredits`, Credits page, navbar badge). What remains is to actually charge credits on every tool run, seed pricing, build the admin pricing UI, and clean up the old subscription surface.

### 1. Seed `tool_pricing`
Insert rows for every tool in `tools_catalog` + native tools. Defaults:
- Pure client-side image tools (resize, rotate, crop, blur, grayscale, watermark, etc.) → `cost_inr = 0.10` → 1 credit
- AI text generation (caption, hashtag, content idea, social post, video script, job post, contract, bibliography) → `cost_inr = 0.30` → 1 credit
- AI image generation / passport photo / background remover / image beautify → `cost_inr = 1.50` → 5 credits
- Video generator → `cost_inr = 4.00` → 14 credits
- Startup Analyser (per deck) → `cost_inr = 5.00` → 17 credits
- Business card scanner / Meet Nudge AI ops → `cost_inr = 0.50` → 2 credits
- Notebook AI / PromptMaster AI / Tools chatbot per message → `cost_inr = 0.20` → 1 credit
Admins can adjust later from the new pricing UI.

### 2. Wire charging into tool actions
Wrap the action that actually consumes compute with `runWithCredits(toolId, work)` and show `BuyCreditsDialog` on `insufficient_credits`. Add a `<CreditCostBadge toolId=...>` next to the primary action button.

Tools to wire (calls Lovable AI / Gemini / generates output):
- Frontend AI tools: `CaptionGenerator`, `HashtagGenerator`, `ContentIdeaGenerator`, `SocialPostGenerator`, `VideoScriptWriter`, `JobPostGenerator`, `ContractDrafter`, `BibliographyGenerator`, `LessonPlanner`, `QuizMaker`, `FlashcardMaker`, `ThumbnailMaker`, `ImageBeautify`, `BackgroundRemover`, `PassportPhotoMaker`, `VideoMaker`, `AddLogoToImage`, `ImageTextOverlay`
- Native apps: `StartupAnalyserApp` (per analysis), `BusinessCardScanner` (per scan), `SpeedyNotebook`/`PromptMaster` (per AI action), `Virasat` (per AI question), `ToolsChatbot` (per message), `PersonalizedTools` (per recommendation)
- Pure client-side image tools: leave free (cost 0) but still call `runWithCredits` so admin can monetize later by editing pricing — passes through with 1 credit minimum only if `cost_inr > 0`. Update `compute_credit_cost` to return 0 when cost is 0 (free tools).

**Migration tweak**: change `compute_credit_cost` so `cost_inr = 0` ⇒ `credit_cost = 0`, and update `start_tool_run` to skip balance check + ledger write when `credit_cost = 0`.

### 3. Bulk runner integration
In `supabase/functions/bulk-run/index.ts`:
- Before processing: call `start_tool_run` per item; if total exceeds balance, refuse with clear error.
- After each item: call `complete_tool_run(success)` so failed items aren't charged.
- Surface `total_credits_charged` on the job row (add column via migration) and show in `BulkJobDetail`.

### 4. Post-Run summary
New `src/components/wallet/PostRunSummary.tsx` — small toast/inline card after a successful charge: "Charged 5 credits · Balance: 142". Trigger from `runWithCredits` via callback.

### 5. Admin: Credits & Pricing tab
Replace the existing "Subscriptions" tab in `AdminDashboard` with `CreditsAdmin.tsx`:
- **Pricing table**: list every `tool_id` with editable `cost_inr` (credits auto-computed via trigger). Add/save via `admin-tool-pricing` edge function.
- **Aggregates**: cards showing total free credits granted, paid credits sold, INR revenue, INR cost (sum of `tool_runs.cost_inr` where succeeded), profit margin %.
- **Per-user wallet lookup**: search by email → show balances + `admin_adjust_credits` form.
- **Recent purchases** + **recent runs** tables.

Also extend `AdminUserDetail` with a "Credits" section (wallet + adjust + ledger).

### 6. Coupons → credit grants
`coupon_codes.credit_grant` already exists. Update `CouponManager` admin form to include `credit_grant` field. `redeem-coupon` already grants credits (verified earlier).

### 7. Cleanup of subscription surface
- Remove `LaunchOfferBanner` mounts; delete file.
- Remove `BulkPromoSection` "premium" copy → "use credits".
- Remove `AUTO_PREMIUM_DOMAINS` enforcement from any remaining check; keep `premium_access` table read-only for legacy users (display "Lifetime" badge if they have a row, no gate).
- `Subscription.tsx` already redirects → keep redirect, delete page body.
- Update `Navbar` "Upgrade"/"Premium" link → "Buy Credits" linking to `/credits` (WalletBadge already added).
- Update copy on `About`, `Home`, `Tools`, footer mentioning subscriptions/plans → pay-as-you-go credits messaging.

### 8. Memory updates
- Add `mem://features/credits-system` describing wallet, pricing formula, packs, free monthly reset, signup/first-action bonuses.
- Mark `mem://features/subscription-system`, `auto-premium-domains`, `premium-status-display`, `launch-offer-promotion`, `promotional-codes` as superseded; update `index.md` to remove or annotate.

### Out of scope
- Migrating existing Razorpay subscribers — `premium_access` rows stay valid, no automatic credit grant.
- Refunds, GST invoicing, multi-currency.

### Technical notes
- All charging goes through `runWithCredits` → `tool-charge` edge fn → `start_tool_run`/`complete_tool_run` RPCs. No client-side balance mutation.
- Free tools (`cost_inr = 0`) skip both balance check and ledger write to keep noise low.
- Bulk jobs charge per-item, never up-front, so partial failures refund automatically (failed item = no charge).
