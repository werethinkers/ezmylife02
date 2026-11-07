# The iOS app

The EZYOURLIFE iPhone app is a native shell (Capacitor 8) that opens https://ezyourlife.com.
Every Publish in Lovable reaches the app straight away. People never update from the App Store
for website changes. Apple allows this as long as the app keeps doing what it was reviewed for.

A new App Store build is needed only when the shell itself changes: `capacitor.config.ts`, the
`ios/` folder, the native plugins in `package.json` (`@capacitor/*`), the icon or the splash screen.

## What's where

| Path | What it is |
| --- | --- |
| `capacitor.config.ts` | App id `com.ezyourlife.app`, name, the live address, sites allowed inside the app, splash and status bar |
| `ios/` | The Xcode project (Swift Package Manager, no CocoaPods). `ios/App/App/public` is generated, not committed |
| `ios/App/App/MainViewController.swift` | Adds swipe-from-the-left-edge to go back |
| `ios/App/App/Info.plist` | iPhone only, portrait, camera, microphone and photo permission texts |
| `mobile/www/` | The tiny bundle inside the app: a fallback page and `offline.html` ("You're offline", Try again) |
| `src/lib/nativeApp.ts` | `isIosApp()`, `canBuyInThisApp()`, `canUseGoogleSignIn()` |
| `src/lib/nativeInit.ts` | Runs only in the app: downloads and `navigator.share` open the iPhone share sheet; splash and status bar |
| `.github/workflows/ios-testflight.yml` | Builds the app on GitHub's Macs and uploads it to TestFlight |
| `public/manifest.webmanifest`, `public/app-icons/` | "Add to Home Screen" for everyone, no App Store needed |

## How the site behaves inside the app

- **Sign-in:** email and "Continue with Apple". Google blocks its sign-in inside apps, so the Google
  button is hidden in the app (`canUseGoogleSignIn()`).
- **Buying:** Apple allows digital goods (credits, the ₹999 kit) to be sold in an iOS app only through
  Apple's in-app purchase, and outside the US it doesn't allow pointing people elsewhere to pay.
  So in the app the credit packs, the buy dialog and the kit page show a short notice instead,
  with no link and no price (`canBuyInThisApp()`, `AppStoreBuyNotice`). Credits already on the
  account work as usual, including publishing websites and cards with credits.
- **Downloads:** every download (PDFs, images, files made by apps) opens the share sheet with
  "Save to Files" and "Save Image".
- **Links to other sites** open in Safari. Sign-in pages (`oauth.lovable.app`, `appleid.apple.com`,
  `*.supabase.co`) stay inside the app.
- **No signal:** the app shows `offline.html` and reloads when the connection is back.
- The app adds `EzyourlifeApp/1 (iOS)` to its user agent, so analytics can tell app visits apart.

Also for every visitor: **Delete my account** on `/profile` (Apple requires it, guideline 5.1.1(v)).
It records a request in `account_deletion_requests` (migration
`20261107200000_account_deletion_requests.sql`) and signs the person out. An admin deletes the
account and its data within 30 days; nothing is deleted automatically. And a **Privacy policy** page
at `/privacy`, which is the privacy address for the App Store listing.

## Going live, in order

1. Release the website part as usual: merge the release PR into `main`, apply
   `supabase/migrations/20261107200000_account_deletion_requests.sql` to the live database, Publish
   in Lovable. Do this before sending the app to Apple, because the reviewer sees the live site.
2. Apple's side (Abhi, once):
   1. developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → **+** → App IDs → App →
      Bundle ID **explicit** `com.ezyourlife.app`, description "EZYOURLIFE". No extra capabilities.
   2. appstoreconnect.apple.com → Apps → **+** → New App: iOS, name "EZYOURLIFE" (or the nearest free
      name), primary language English (India), bundle ID `com.ezyourlife.app`, SKU `ezyourlife-ios`.
   3. App Store Connect → Users and Access → Integrations → App Store Connect API → Team Keys →
      **Generate API Key**, access **Admin** (needed so GitHub can make the signing certificate).
      Download the `.p8` file (it can be downloaded only once). Note the Key ID and the Issuer ID.
   4. developer.apple.com → Account → Membership details → **Team ID**.
3. GitHub → the repo → Settings → Secrets and variables → Actions → New repository secret, four times:
   `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY` (the whole text of the `.p8` file).
4. GitHub → Actions → **iOS app to TestFlight** → Run workflow (version `1.0`). About 15 minutes.
   GitHub lists a hand-run workflow only once it is on `main`, so this works after step 1.
5. App Store Connect → the app → TestFlight: add yourself as an internal tester, install the
   TestFlight app on the iPhone, and test (checklist below).
6. App Store Connect → the app → the 1.0 version page, then Submit for Review:
   - Screenshots for the 6.9" iPhone (1320 × 2868), at least 3.
   - Description, keywords, support URL `https://ezyourlife.com/about#contact`,
     privacy policy URL `https://ezyourlife.com/privacy`.
   - App Privacy: contact info (name, email, phone), user content, purchase history, usage data;
     linked to the user, not used for tracking.
   - Age rating questionnaire; category Productivity (second: Business).
   - **App Review Information:** a demo email and password for an account with some credits, and a
     note: "Sign in with the demo account. Apps run on credits already on the account; credits are not
     sold in the iOS app. Downloads open the share sheet."
   - Pick the TestFlight build, then Submit.

## Test checklist (TestFlight)

- Opens on the home page with the splash screen; no white flash.
- Sign in with email, and with Apple; sign out; Google button not shown.
- Run a browser app and an AI app; credits go down as on the web.
- Download a PDF and an image: the share sheet opens, "Save to Files" and "Save Image" work.
- Share buttons open the iPhone share sheet.
- Photo pickers and camera apps ask for permission and work.
- Credits page and kit page show the notice; no price, no pay button, no link to pay.
- Turn on airplane mode, reopen: "You're offline"; turn it off, Try again.
- Swipe from the left edge goes back; external links open in Safari.
- Profile → Delete my account (use a test account).

## Updating

- Website change: Publish in Lovable. The app has it at once.
- Shell change: run the workflow again with a higher version (`1.1`), then submit that version.

## Not done yet

- **Apple in-app purchase for credits.** Apple's rule 3.1.3(b) lets an app use credits bought on the
  website only if they can also be bought in the app, so a reviewer may still ask for it. Adding it
  means StoreKit products for the packs and a server check that adds the credits to the same wallet.
  It touches payment code, so it needs Abhi's go-ahead. Apple keeps 15% (Small Business Program) to 30%.
- **Push notifications** (needs an APNs key and a sender).
- **Sign in with Google** in the app (needs the system browser and a return link to the app).
