import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { isIosApp } from "./nativeApp";

/*
 * Google sign-in. In a browser it is the normal Lovable flow. Inside the iPhone app Google refuses to sign
 * in from an app's own web view, so the app opens the sign-in in Safari's secure window instead and Safari
 * sends the result back to the app through the ezyourlife:// link (registered in ios/App/App/Info.plist).
 * See docs/ios-app.md.
 */

/** Return address Safari uses to hand the sign-in back to the app. Must match Info.plist (CFBundleURLSchemes). */
export const APP_OAUTH_REDIRECT = "ezyourlife://oauth-callback";

type Result = { error: Error | null; cancelled?: boolean };

async function signInInApp(): Promise<Result> {
  const [{ Browser }, { App }] = await Promise.all([import("@capacitor/browser"), import("@capacitor/app")]);

  const state = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const params = new URLSearchParams({ provider: "google", redirect_uri: APP_OAUTH_REDIRECT, state });
  const url = `${window.location.origin}/~oauth/initiate?${params.toString()}`;

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
        const p = new URLSearchParams(u.search);
        new URLSearchParams(u.hash.replace(/^#/, "")).forEach((v, k) => p.set(k, v));
        if (p.get("state") !== state) return finish({ error: new Error("Sign in failed. Please try again.") });
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

    // Closing the Safari window without finishing is a cancel, not an error. Wait a moment in case the result is arriving.
    Browser.addListener("browserFinished", () => setTimeout(() => finish({ error: null, cancelled: true }), 1500)).then((h) => handles.push(h));

    Browser.open({ url }).catch((e) => finish({ error: e instanceof Error ? e : new Error(String(e)) }));
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
  const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri });
  return { error: error ?? null };
}
