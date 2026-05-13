# Always-popup login (no more /auth redirects)

## Problem
Many apps (Notebook, PromptMaster, Startup Analyser, Meet Nudge, Virasat, Get Extension, Mobile Shortcuts, Bulk Jobs, ProductVision 360, Profile, Credits History, Admin) are wrapped in `ProtectedRoute`, which hard-redirects unauthenticated users to `/auth`. The user wants the same inline `LoginPromptDialog` popup behavior used elsewhere — and if the user closes it without signing in, show an error and re-prompt.

## Changes

### 1. Update `src/components/ProtectedRoute.tsx`
Stop using `<Navigate to="/auth" />`. Instead, when the visitor is unauthenticated:
- Render a dimmed/blurred placeholder behind the dialog (don't render protected children — they may call user-only APIs).
- Show `LoginPromptDialog` immediately, with `returnTo` set to current path so post-login redirect works.
- Make the dialog **persistent**: if the user closes it (`onOpenChange(false)`), fire a Sonner toast — "Please sign in to continue" — and reopen the dialog after ~400 ms.
- Add a small "Go back" link under the dialog so the user has a non-auth escape hatch (navigates to `/ai-apps`). Without this they'd be fully trapped, which is bad UX; the popup still always reopens on this page.

### 2. Update `src/components/auth/LoginPromptDialog.tsx`
Add an optional `persistent?: boolean` prop. When true:
- Hide the default close (X) button (`[&>button]:hidden` on `DialogContent`, or pass a custom flag).
- Disable outside-click / Esc dismissal via `onInteractOutside` / `onEscapeKeyDown` preventDefault.
This keeps the existing soft-prompt behavior (e.g. `ToolAccessGuard`'s 7-second prompt) unchanged when `persistent` is false.

### 3. `ToolAccessGuard` (no behavior change)
Already shows the popup inline and lets users keep exploring — leave as is. Only `ProtectedRoute` is changing.

## Out of scope
- No auth flow changes (Auth page, OAuth callback, redirect-to logic remain identical).
- No changes to credit-charging `useCredits` login dialog (already a popup).
- No route restructuring.

## Files touched
- `src/components/ProtectedRoute.tsx` (rewrite)
- `src/components/auth/LoginPromptDialog.tsx` (add `persistent` prop)
