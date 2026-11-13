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
| `src/lib/nativeApp.ts` | `isIosApp()`, `canBuyInThisApp()` |
| `src/lib/appleIap.ts`, `src/components/wallet/AppleCreditPacks.tsx` | Buying credits with Apple in-app purchase, and recovering a paid purchase that was never credited |
| `supabase/functions/apple-iap-verify/`, `supabase/functions/_shared/appleJws.ts` | Checks Apple's signature on the purchase and adds the credits once |
| `supabase/migrations/20261107210000_apple_purchases.sql` | `apple_purchases` table and `apply_apple_purchase` (adds credits once per Apple transaction) |
| `src/lib/googleSignIn.ts` | Google sign-in: normal in browsers, through Safari's secure window inside the app |
| `src/lib/nativeInit.ts` | Runs only in the app: downloads and `navigator.share` open the iPhone share sheet; splash and status bar |
| `.github/workflows/ios-testflight.yml` | Builds the app on GitHub's Macs and uploads it to TestFlight |
| `ios/App/Keyboard/`, `ios/App/App/AskEzyourlifeIntent.swift` | The EZYOURLIFE keyboard and the "Ask EZYOURLIFE" Siri command: `docs/ios-keyboard.md` |
| `public/manifest.webmanifest`, `public/app-icons/` | "Add to Home Screen" for everyone, no App Store needed |

## How the site behaves inside the app

- **Sign-in:** email, "Continue with Apple" and "Continue with Google". Google refuses to sign in inside an
  app's own web view, so in the app the Google button opens Safari's secure window and Safari hands the
  result back through the `ezyourlife://oauth-callback` link (`src/lib/googleSignIn.ts`, URL scheme in
  `Info.plist`). **Not tested against the live sign-in service yet**: test it first on TestFlight. If Safari
  shows an error about the return address, change `APP_OAUTH_REDIRECT` to `lovable://oauth-callback` (and the
  scheme in `Info.plist` to `lovable`), which is the address Lovable's own app wrapper uses.
- **Buying:** Apple allows digital goods to be sold in an iOS app only through Apple's in-app purchase,
  and doesn't allow pointing people elsewhere to pay. So in the app the credit packs (₹100, ₹250, ₹500,
  ₹1,000 sizes: 180, 500, 1,100 and 2,200 credits, the same credits as the website) are paid with
  Apple's payment sheet, in the person's own currency. The Razorpay packs, the coupon box and the
  ₹999 business kit are not shown in the app (the kit page shows a notice with no link and no price).
  Credits land in the same wallet. The flow: pay → the app sends Apple's signed receipt to
  `apple-iap-verify` → credits added → only then is the purchase finished with Apple. If anything fails
  in between, the purchase stays open and is credited the next time the app opens and someone is signed in.
  Apple's price (and their cut: 15% in the Small Business Program, else 30%) is not in our control, so
  the same pack costs more in the app than on the website.
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

## Setting up in-app purchases (once, before the first test)

1. App Store Connect → Business → Agreements, Tax and Banking: accept the **Paid Applications**
   agreement and add bank and tax details. Without this, in-app purchases don't load at all.
2. App Store Connect → the app → Monetization → In-App Purchases → **+** → type **Consumable**.
   Create four, with exactly these Product IDs:

   | Product ID | Reference name | Price (nearest price point) | Credits |
   | --- | --- | --- | --- |
   | `com.ezyourlife.app.credits.p100` | Credits 180 | ₹100 | 180 |
   | `com.ezyourlife.app.credits.p250` | Credits 500 | ₹250 | 500 |
   | `com.ezyourlife.app.credits.p500` | Credits 1100 | ₹500 | 1,100 |
   | `com.ezyourlife.app.credits.p1000` | Credits 2200 | ₹1,000 | 2,200 |

   For each: display name (e.g. "500 credits"), description ("Credits for EZYOURLIFE apps"), price, and a
   screenshot for review (any screenshot of the credits screen in the app). Availability: all countries.
   The credits are fixed on our server, so the price point only decides what people pay.
3. Add the four products to the app version (Version page → In-App Purchases) before submitting.
4. Settings → Users and Access → Sandbox → create a **Sandbox Apple ID** to test purchases with (TestFlight
   purchases are free test purchases).
5. Go live on the server: apply `supabase/migrations/20261107210000_apple_purchases.sql` to the live
   database and deploy the new `apple-iap-verify` function (it needs no new secrets).
6. Optional: set the function secret `APPLE_IAP_ALLOW_SANDBOX=false` after the app is approved, so test
   purchases stop adding credits. Leave it unset until then: App Review and TestFlight buy in the test store.

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
- Sign in with Google: Safari's window opens, and after choosing the account you land back in the app signed in.
- Credits screen: four packs with prices from Apple; buy one with the sandbox account; the balance goes up
  and "Credits added" shows. Buy again, then force-quit the app during the Apple sheet or turn on airplane
  mode right after paying: reopen and sign in, and the credits arrive.
- Run a browser app and an AI app; credits go down as on the web.
- Download a PDF and an image: the share sheet opens, "Save to Files" and "Save Image" work.
- Share buttons open the iPhone share sheet.
- Photo pickers and camera apps ask for permission and work.
- Credits page shows only the Apple packs (no Razorpay, no coupon box); the kit page shows a notice with no link and no price.
- Turn on airplane mode, reopen: "You're offline"; turn it off, Try again.
- Swipe from the left edge goes back; external links open in Safari.
- Profile → Delete my account (use a test account).

## Updating

- Website change: Publish in Lovable. The app has it at once.
- Shell change: run the workflow again with a higher version (`1.1`), then submit that version.

## Not done yet

- **Refunds of Apple purchases.** If Apple refunds a purchase, the credits are not taken back automatically
  (that needs Apple's server notifications). Refunds are rare; check the `apple_purchases` table if one is reported.
- **Push notifications** (needs an APNs key and a sender).
- **The business kit in the app.** Not sold there; it would need its own Apple product.
