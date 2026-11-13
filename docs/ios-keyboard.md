# The EZYOURLIFE keyboard and "Ask EZYOURLIFE" voice (iPhone)

ezme's `/pm` and `/invo` on the iPhone alone, in any app, plus voice through Siri and the Action Button.
Both ship inside the iOS app (docs/ios-app.md), so they need a new App Store build (version 1.1 or later).

## What people get

- **Keyboard.** An iPhone-style keyboard with one strip on top and a coral `/` key. In any app, `/` and a
  few letters show the person's synced shortcuts (the same list as Speedy Notebook, EzMe and the Chrome
  extension) and Ezyourlife apps.
  - Tap a shortcut: its text replaces `/pm`.
  - Tap an app (`/invo` → Proforma Invoice): a **details card** opens in place of the keys, with the
    person's saved business details (name, GSTIN, address… from the website's workspace profile) already
    filled and marked "from your profile". Required boxes still empty say **Tap to add**.
  - Or type `/`, tap iOS's own mic under the keyboard and say the whole thing ("proforma invoice for Rahul
    Traders, 2 chairs at 1500"). The words land after the `/`, the keyboard picks the app and opens the card
    filled from them. Saying more while the card is open fills the boxes not yet touched.
  - Tap a box to type in it (the keys come back and type into that box; **Done** returns to the card).
  - **Generate · 2 credits**: the result replaces the command in the text box. Image results are copied for
    the person to paste (iOS doesn't let a keyboard put a photo into another app's box).
  - The last Siri result shows first as **Insert: …** for 15 minutes.
- **Ask EZYOURLIFE.** "Hey Siri, ask EZYOURLIFE", the Action Button, Back Tap or the Shortcuts app. Siri asks
  "What do you need?". A shortcut's name copies that shortcut for free. Otherwise Siri names the app and its
  price and asks before running it, then copies the result. It runs in the background, so the person stays
  in their chat. Keyboards can never use the microphone (Apple's rule), so voice lives here.
- **Setup page** `/keyboard` (works in browsers too, as an explainer): Connect, Settings steps, voice steps.

- **Older AI apps** with their own server function (captions, hashtags, social posts, content ideas, video
  scripts, Startup Analyser, Speedy Notebook, Thumbnail Maker, Video Maker, ProductVision 360) run through
  `supabase/functions/_shared/nativeApis.ts`, charged at their website prices. ProductVision 360 takes a
  **copied photo** (Photos › Share › Copy, then tap the photo box) and charges per angle in its own function.
- **Browser text tools** (study, writing and teaching helpers) run through `ai-app` on the server.
- **Photo and PDF tools run on the phone** (about 70: ID and exam photo sizes, KB size, resize, crop,
  signature, background removal and blur, face blur, watermark, text, DPI, metadata, JPG to PDF, PDF to
  JPG or text, rotate, split and merge PDFs, HEIC/WebP/PNG to JPG, photo + signature, join photos, logo).
  Photo boxes open a grid of the person's recent photos inside the keyboard (Photos access is asked for in
  the app once the keyboard is connected, because a keyboard can't ask; without it they fall back to the
  copied photo).
  The code is `EzyPhoto` in `ios/App/Keyboard/KeyboardViewController.swift` (CoreImage, Vision, ImageIO,
  PDFKit). The picture or PDF is read from what the person copied and the result is copied back for
  pasting. Nothing is uploaded: the keyboard only calls `POST /v1/apps/{id}/charge` to charge the run at
  the tool's usual price. Server list: `DEVICE_APPS` in `nativeApis.ts` (mode `device`).
- Still website only: coaching sessions, trackers, AI-only photo tools (AI ID photo, object removal,
  retouch, face generator), and the few apps that need several files at once (Instagram grid, bulk resize).

## How it fits together

| Path | What it is |
| --- | --- |
| `ios/App/Keyboard/KeyboardViewController.swift` | The keyboard: keys, auto-capitals, double-space full stop, delete-repeat, and the strip |
| `ios/App/Keyboard/Info.plist` | Keyboard extension settings (`RequestsOpenAccess` = Full Access) |
| `ios/App/App/AskEzyourlifeIntent.swift` | The Siri / Action Button command (App Intents, iOS 16+) and its Siri phrases |
| `ios/App/App/EzyKeyboardPlugin.swift` | Capacitor plugin `EzyKeyboard`: the website hands the keyboard its API key |
| `ios/App/Shared/EzyShared.swift` | Shared by both targets: App Group storage, the API client, matching `/` commands |
| `ios/App/App/App.entitlements`, `ios/App/Keyboard/Keyboard.entitlements` | App Group `group.com.ezyourlife.app` |
| `ios/stamp-entitlements.sh` | Puts the App Group into the unsigned archive before Apple signs it at export |
| `src/pages/KeyboardSetup.tsx`, `src/lib/ezyKeyboard.ts` | The `/keyboard` page and its bridge to the plugin |
| `supabase/functions/api` `POST /v1/command` | One sentence to the best app with its boxes filled. Free, runs nothing |
| `.github/workflows/ios-build-check.yml` | Compiles the app and keyboard on GitHub's Macs for every PR touching `ios/` |

Connecting makes an API key named "EZYOURLIFE keyboard on iPhone" (daily limit 500 credits) through the
existing `/v1/keys` route. The person sees and removes it under `/developers/keys`. Runs are charged by the
existing `POST /v1/apps/{id}/run` at the website's prices, only after a tap or Siri's confirmation.

## Abhi's Apple steps (once, before the 1.1 build)

1. developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → **+** → **App Groups** →
   description "EZYOURLIFE shared", identifier `group.com.ezyourlife.app`.
2. Identifiers → `com.ezyourlife.app` → tick **App Groups** → Configure → tick `group.com.ezyourlife.app` → Save.
3. Identifiers → **+** → App IDs → App → description "EZYOURLIFE Keyboard", bundle ID explicit
   `com.ezyourlife.app.keyboard` → tick **App Groups** → Configure → `group.com.ezyourlife.app` → Register.
4. Run Actions → "iOS app to TestFlight" with version `1.1` on the release that contains this work.
   (Xcode may register steps 1 to 3 by itself during the export; doing them by hand first is the safe path.)
5. App Store Connect → the 1.1 version → App Review notes: "The app includes a custom keyboard. Full Access is
   used only to reach the person's own shortcuts and apps on ezyourlife.com; the keyboard keeps no record of typing and sends only the words after '/'
   (to look up a shortcut or app) and the details of an app the person chooses to run. Privacy policy: https://ezyourlife.com/privacy."
   Add the demo account. In App Privacy nothing new is collected beyond what is already declared.

## Testing on TestFlight

1. Install, sign in, open Menu → `/keyboard` (or https://ezyourlife.com/keyboard in the app) → **Connect**.
2. Settings → Apps → EZYOURLIFE → Keyboards → turn on EZYOURLIFE and Allow Full Access.
3. In WhatsApp: globe key → EZYOURLIFE → type `/` and a shortcut's first letters → tap it.
4. `/invo` → tap Proforma Invoice → type the details → **Run** → the invoice text replaces the command.
5. "Hey Siri, ask EZYOURLIFE" → say a shortcut's name, then an app request. Check the price question,
   then the result in the keyboard strip.
6. Action Button: Settings → Action Button → Shortcut → EZYOURLIFE → Ask EZYOURLIFE.

## Known limits

- No Apple autocorrect, word predictions, swipe typing or other languages in the keyboard itself (Apple
  doesn't share them with other keyboards). People switch with the globe key when they need those.
- iOS uses Apple's own keyboard in password and phone-number boxes.
- Without Full Access the keyboard types normally but the strip only shows how to turn it on.
- The keyboard can use roughly 2,400-pixel pictures and PDFs up to 15 MB (iOS caps keyboard memory).
- Siri's trigger phrase can't carry free words, so Siri always asks "What do you need?" first.
- No app can make itself the default keyboard. People drag EZYOURLIFE to the top of Settings › General ›
  Keyboard › Keyboards › Edit; iOS then opens it first and remembers it per app.
