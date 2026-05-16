## Problem

Clicking the Virasat, Startup Analyser, or ProductVision 360 card from `/ai-apps` opens the tool for a split second, then bounces back to `/ai-apps` (or `/auth`).

## Root cause (most likely)

Two issues compound:

1. **`ToolViewer.tsx` line 155** has this safety net:
   ```tsx
   if (!isLoading && !isNativeTool && !iframeSrc && catalogInfo) {
     return <Navigate to="/ai-apps" replace />;
   }
   ```
   For tools with a `dedicated_route` (Virasat, Startup Analyser, ProductVision, etc.), the redirect to the dedicated route happens inside an async callback. There is a render between `setCatalogInfo` and the URL actually changing. If `isLoading` has already been flipped to `false` (e.g. because of a re-render path), this guard fires `<Navigate to="/ai-apps" replace />` before the dedicated-route navigation completes — the user gets thrown back.

2. **`Virasat.tsx` lines 159–161** runs:
   ```tsx
   useEffect(() => { if (!user) navigate("/auth"); }, [user, navigate]);
   ```
   It doesn't gate on `loading` from `useAuth`. While `ProtectedRoute` does check loading, the auth subscription in `AuthContext` is re-firing (3× "Welcome back" toasts visible in the session replay confirms this), which can momentarily make `user` null between events and kick the user out.

   `AuthContext.tsx` line 79 has `useEffect(..., [toast])`. `toast` from `useToast()` is a new reference on every render → the auth listener gets torn down and re-subscribed repeatedly, producing duplicate `SIGNED_IN` events and a brief `user = null` window.

## Fix

### 1. `src/pages/ToolViewer.tsx`
- In `checkCatalog`, when `dedicated_route` is set, do **not** rely on the catch-all guard. Skip all subsequent state work and leave `isLoading = true` so nothing renders until the route change lands.
- Tighten the line-155 guard so it only fires for tools that are genuinely orphaned (no `dedicated_route`, no native impl, no iframe URL, no uploaded files, and is_live=true). Guard it behind a "catalog check finished" flag instead of `!isLoading`.

### 2. `src/contexts/AuthContext.tsx`
- Remove `toast` from the effect dependency array (use a `toastRef` to call the latest toast without re-subscribing). This stops the listener thrash and the duplicate `SIGNED_IN` toasts.
- Treat `INITIAL_SESSION` explicitly so a re-subscription never fires the welcome toast again.

### 3. `src/pages/Virasat.tsx`
- Change the auth-check effect to also wait for `loading`:
  ```tsx
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);
  ```
- (Optional) Since `ProtectedRoute` already handles this, the effect can simply be removed.

### 4. Quick sweep
Apply the same `loading`-gated check (or remove redundant client-side redirects) anywhere else inside protected pages that does `if (!user) navigate(...)` — `StartupAnalyser`, `ProductVision360`, `MeetNudge`, etc.

## Verification

1. Sign in, open `/ai-apps`, click Virasat → lands on `/virasat` and stays.
2. Same for Startup Analyser and ProductVision 360.
3. Reload `/virasat` directly while signed in — no bounce.
4. Sign out and click Virasat → goes to `/auth` once, no flicker.
5. Sign in via password → exactly one "Welcome back" toast (not three).
