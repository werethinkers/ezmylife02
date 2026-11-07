import { Capacitor } from "@capacitor/core";

/*
 * The iOS app (ios/, capacitor.config.ts) is a shell that opens https://ezyourlife.com, so every
 * Publish reaches the app at once with no App Store update. Code that must behave differently
 * inside the app asks these helpers. See docs/ios-app.md.
 */

/** True inside the iOS or Android app shell, false in any browser (including "Add to Home Screen"). */
export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

/** True inside the iOS app shell only. */
export const isIosApp = (): boolean => Capacitor.getPlatform() === "ios";

/**
 * Apple only allows digital goods (credits, the kit) to be sold inside an iOS app through
 * Apple's in-app purchase. Until that exists, the iOS app neither sells nor links to a sale.
 */
export const canBuyInThisApp = (): boolean => !isIosApp();

/** Google blocks its sign-in inside app web views, so the iOS app offers email and Apple only. */
export const canUseGoogleSignIn = (): boolean => !isIosApp();
