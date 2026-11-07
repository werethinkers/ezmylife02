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
 * True where the website's Razorpay checkout may be used. Apple only allows digital goods (credits, the kit)
 * to be sold inside an iOS app through Apple's in-app purchase, so in the iOS app credits are bought with
 * AppleCreditPacks (src/lib/appleIap.ts) and the kit is not sold. Never link to the web checkout from the app.
 */
export const canBuyInThisApp = (): boolean => !isIosApp();
