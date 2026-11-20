import { supabase } from "@/integrations/supabase/client";
import { isIosApp } from "./nativeApp";

/*
 * Google sign-in. In a browser it is the normal Supabase redirect flow. Inside the iPhone app Google refuses to sign
 * in from an app's own web view, so the app opens the sign-in in Safari's secure window instead and Safari
 * sends the result back to the app through the ezyourlife:// link (registered in ios/App/App/Info.plist).
 * See docs/ios-app.md.
 *
 * We get the OAuth URL directly from Supabase (skipBrowserRedirect: true) so there is no server proxy
 * endpoint needed. After Google auth, Supabase redirects to ezyourlife://oauth-callback with either:
 *   - a PKCE code (?code=xxx) → exchangeCodeForSession
 *   - implicit tokens (#access_token=xxx&refresh_token=xxx) → setSession
 */

/** Return address Safari uses to hand the sign-in back to the app. Must match Info.plist (CFBundleURLSchemes). */
export const APP_OAUTH_REDIRECT = "ezyourlife://oauth-callback";

type Result = { error: Error | null; cancelled?: boolean };

async function signInInApp(): Promise<Result> {
  const [{ Browser }, { App }] = await Promise.all([import("@capacitor/browser"), import("@capacitor/app")]);

  // Get the Google OAuth URL directly from Supabase — no server proxy needed.
  const { data, error: urlError } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: APP_OAUTH_REDIRECT,
      skipBrowserRedirect: true,
    },
  });

  if (urlError || !data?.url) {
    return { error: urlError ?? new Error("Could not start Google sign-in. Please try again.") };
  }

  return new Promise<Result>((resolve) => {
    let settled = false;
    const handles: { remove: () => Promise<void> }[] = [];
    const finish = (r: Result) => {
      if (settled) return;
      settled = true;
      handles.forEach((h) => h.remove().catch(() => undefined));
      Browser.close().catch(() => undefined);
      resolve(r);
    };

    App.addListener("appUrlOpen", async ({ url: opened }) => {
      if (!opened.startsWith(APP_OAUTH_REDIRECT)) return;
      try {
        const u = new URL(opened);

        // PKCE flow: Supabase redirects with ?code=xxx
        const code = new URLSearchParams(u.search).get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          return finish({ error: error ?? null });
        }

        // Implicit flow: tokens arrive in the URL hash
        const p = new URLSearchParams();
        new URLSearchParams(u.hash.replace(/^#/, "")).forEach((v, k) => p.set(k, v));
        if (p.get("error")) return finish({ error: new Error(p.get("error_description") || "Sign in failed") });
        const access_token = p.get("access_token");
        const refresh_token = p.get("refresh_token");
        if (!access_token || !refresh_token) return finish({ error: new Error("Sign in failed. Please try again.") });
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        finish({ error: error ?? null });
      } catch (e) {
        finish({ error: e instanceof Error ? e : new Error(String(e)) });
      }
    }).then((h) => handles.push(h));

    // Closing Safari without finishing is a cancel, not an error. Wait a moment in case the result is still arriving.
    Browser.addListener("browserFinished", () => setTimeout(() => finish({ error: null, cancelled: true }), 1500)).then((h) => handles.push(h));

    Browser.open({ url: data.url }).catch((e) => finish({ error: e instanceof Error ? e : new Error(String(e)) }));
  });
}

/** Starts Google sign-in. `redirect_uri` is where the website flow lands (usually /auth/callback). */
export async function googleSignIn(redirect_uri: string): Promise<Result> {
  if (isIosApp()) {
    const r = await signInInApp();
    // Same finish as the website: the callback page checks the account and sends the person where they were going.
    if (!r.error && !r.cancelled) window.location.assign("/auth/callback");
    return r;
  }
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirect_uri } });
  return { error: error ?? null };
}
