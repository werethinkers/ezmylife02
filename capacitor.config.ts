import type { CapacitorConfig } from '@capacitor/cli';

/*
 * The iOS app is a shell around the live site: it opens https://ezyourlife.com, so every deploy
 * of the website reaches the app at once, with no App Store update. Only changes to this file, to
 * ios/ or to the native plugins in package.json need a new App Store build. See docs/ios-app.md.
 */
const config: CapacitorConfig = {
  appId: 'com.ezyourlife.app',
  appName: 'EZYOURLIFE',
  // Tiny local bundle: a loading page and the "you're offline" page. The site itself comes from server.url.
  webDir: 'mobile/www',
  server: {
    url: 'https://ezyourlife.com',
    // Shown when ezyourlife.com can't be reached (no signal). It has a "Try again" button.
    errorPath: 'offline.html',
    // Sign-in pages that must open inside the app; any other site opens in Safari.
    allowNavigation: [
      'ezyourlife.com',
      'www.ezyourlife.com',
      'appleid.apple.com',
      '*.supabase.co',
    ],
  },
  ios: {
    // Lets the site and analytics tell app visits apart from Safari visits.
    appendUserAgent: 'EzyourlifeApp/1 (iOS)',
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: false,
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: false,
      backgroundColor: '#FFF8EC',
      showSpinner: false,
    },
    // Credits are added by our server first; only then do we finish the Apple purchase (src/lib/appleIap.ts).
    NativePurchases: {
      autoFinishTransactions: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FFF8EC',
      overlaysWebView: false,
    },
  },
};

export default config;
