## 1. Sitewide AI Chatbot (right side, every page, no signup)

**New component** `src/components/SmartAssistantChatbot.tsx` — replaces the current `ToolsChatbot` (which only sits on `/ai-apps`). Mounted globally in `src/App.tsx` so it appears on every route. Hidden on `/tool-viewer/*` and `/auth*` routes to avoid covering tool UI.

**Visual style** — "a little flashy":

- Floating orb button bottom-right (right-6, bottom-6) with animated gradient ring, pulse glow, sparkles icon. Mobile-safe.
- Open panel: 380px wide × 560px tall, glass dark card, gradient border, Framer Motion slide-in from right, animated typing dots.
- Header chip: "EZYOURLIFE Assistant · always free".

**Conversation flow** (handled in one Edge Function, streaming):

1. Greets and asks the user to describe their problem/use case.
2. Uses `tools_catalog` (live tools) as the source of truth — suggests up to 3 matching apps with deep links to `/tool-preview/:id`.
3. If nothing matches → assistant says "We don't have this yet — want our team to build it for you in 24–48 hrs?" and asks for **name, email, phone (optional), short description**.
4. On submit, frontend calls `submit-tool-request` Edge Function which:
  - Inserts a row into existing `tool_requests` table (no auth required — public insert policy added if missing).
  - Calls `send-transactional-email` with template `tool-request-received` to the user.
  - Notifies admins (insert into `activity_logs`).
5. Bottom of every assistant turn: a small "Need a custom enterprise app? → Contact us" link → `/credits#enterprise` (existing enterprise contact dialog anchor).

**Backend**:

- New edge function `supabase/functions/smart-assistant/index.ts` — streams via Lovable AI Gateway (`google/gemini-3-flash-preview`), system prompt built from live `tools_catalog` rows (id, name, description, category) so suggestions stay accurate, supports tool-calling for `suggest_tools` and `capture_lead` structured outputs.
- New edge function `supabase/functions/submit-tool-request/index.ts` — public (verify_jwt false), zod validation, inserts into `tool_requests`, fires the transactional email.
- New transactional template `supabase/functions/_shared/transactional-email-templates/tool-request-received.tsx` — branded EZYOURLIFE confirmation: "Your request is registered. Our team will build/update the app within 24–48 hours."

**Email prerequisite**: `notify.thingmonkey.com` is pending DNS. Functions and templates will be deployed; the user will be told emails start flowing once DNS verifies (monitor in Cloud → Emails). Also need to call `setup_email_infra` + `scaffold_transactional_email` before deploying the new template.

**Old chatbot**: remove `<ToolsChatbot />` mount from `src/pages/Tools.tsx` (replaced by global one).

## 2. Home page — "Simple. Credit-Based. Hassle-Free." steps rewrite

In `src/pages/Home.tsx` (lines ~317–346) replace the 3 pricing-flavored steps with a clean 3-step user journey:

1. **Choose an app** — browse 200+ live AI apps. Icon: `LayoutGrid`.
2. **Use your credits** — pay-as-you-go, from ₹10. Icon: `Wallet`.
3. **Start using the app** — instant results. Icon: `Sparkles`/`Zap`.

Same card visual treatment, middle card highlighted.

## 3. Home page — "Popular Credit Packs" → buyable scroller

Replace the static `<ul>` list (lines ~347–368) with a horizontal scroll-snap row of all six `CREDIT_PACKS`, each pack a compact card showing:

- Pack name (Starter/Mini/Pro/Popular/Better value/Best value)
- ₹ price (large), credits count
- Badge if present
- "Buy now" button

Clicking **Buy now** opens the existing `BuyCreditsDialog` pre-selected to that pack (extend `BuyCreditsDialog` with optional `defaultPackId` prop and an `autoStart` flag — when true, immediately calls `buy(defaultPackId)` after the dialog mounts and the user is logged in; if not logged in it falls through to `LoginPromptDialog` as today).

Layout: `overflow-x-auto snap-x snap-mandatory flex gap-3 pb-2`, each card `min-w-[180px] snap-start`. Keep "View All Packs" button beneath the scroller.

## Files

**Created**

- `src/components/SmartAssistantChatbot.tsx`
- `supabase/functions/smart-assistant/index.ts`
- `supabase/functions/submit-tool-request/index.ts`
- `supabase/functions/_shared/transactional-email-templates/tool-request-received.tsx`

**Edited**

- `src/App.tsx` (mount global chatbot)
- `src/pages/Home.tsx` (steps rewrite + buyable pack scroller)
- `src/pages/Tools.tsx` (remove old `<ToolsChatbot />`)
- `src/components/wallet/BuyCreditsDialog.tsx` (add `defaultPackId` + `autoStart` props)
- `supabase/functions/_shared/transactional-email-templates/registry.ts` (register new template)

**Migration**

- Ensure `tool_requests` allows public anon insert (RLS policy) so unauthenticated chat users can submit.

## Out of scope

- Changing existing favorites/recents, admin layout, or any other page.
- Building enterprise contact form anew — link to existing `/credits` enterprise dialog.
- Removing/refactoring `ToolsChatbot.tsx` source file (left in repo, just unmounted) to keep diff small.