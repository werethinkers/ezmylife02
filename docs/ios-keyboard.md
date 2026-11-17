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
- **More phone-run tools** (Nov 2026): exam photo + signature sets (NTA, SBI Clerk, GATE, OCI), US visa and
  India e-Visa photos, ID photo on white, retouch, blemish and unblur, object removal, shape crop, edit
  metadata, split image, Instagram grid, bulk resize (pick up to 10 photos) and PDF pages to pictures.
- **Several outputs.** Apps that make more than one picture (exam sets, grids, splits, bulk resize, PDF
  pages, ProductVision 360 angles) copy them all at once, in order, as separate images; one Paste in
  WhatsApp or Mail puts in every one. Instagram grid pieces come last-first, the order to post them.
- **PDFs are saved in Files, then sent from there.** Every PDF the keyboard or Siri makes is saved
  without asking (`EzyClipboard.saveToFiles`): Siri writes straight into the app's Documents folder, which
  the Files app shows as On My iPhone > EZYOURLIFE (`UIFileSharingEnabled` in App/Info.plist). A keyboard
  can't write there, so it saves into the App Group and the app moves the file across the next time it
  opens (`mirrorToFiles`). The result panel's **Send PDF** button opens the iPhone share sheet on the
  file; picking WhatsApp attaches the real file in the chat (pasting a PDF never worked in WhatsApp).
  Siri does the same: it saves the PDF, then opens EZYOURLIFE on `ezyourlife://share-pdf?file=...`, which
  shows the share sheet. iOS has no way to attach a file silently, so the person picks WhatsApp and the
  chat once, then taps Send. The PDF is still copied as well (Notes, Mail). Not tested on a real iPhone:
  the share sheet inside a keyboard extension may be refused by some iOS versions; the PDF is still
  saved and still copied.
- **Coaching sessions** run as a chat inside the card: Start (the app's price) gives the first message,
  replies and the closing summary are free. Paste reply puts the coach's last message in the text box.
- **Trackers** add one entry per run to the same saved list the website shows (`tool_sessions`), charged
  at the tracker's price per entry.
- **Content Workflow** runs its 4 steps on the server (4 credits each, 16 in all).
- Still website only: Image to WebP (iOS can't write WebP), Mail Brain (needs Gmail), Virasat (needs voice
  recording) and outside-developer apps without code in this repo.

- **Look (Nov 2026).** The keyboard follows the site's look (`EzyLook` in the keyboard file): cream panels,
  2 px ink borders, flat offset shadows, sun and teal accents, heavy rounded titles, and the balance in a pill.
  After `/` the best match is a big card with a row of other apps and shortcuts above the keys; the details
  card shows a tick per box, an "N of M ready" bar, choices as chips and "Make it · N credits"; typing into a box
  shows one box at a time with Back and Next; a picture or PDF result shows a preview, how to paste and credits
  left. Design canvas: https://claude.ai/artifact/T7hXVoiCvRyNLtHtRtqfET.

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

## Siri conversation (iOS 18 and later)

"Hey Siri, ask EZYOURLIFE" now runs the whole job by voice, in `ios/App/App/AskEzyourlifeIntent.swift`:

1. "What do you need?" A shortcut name is copied at once. Otherwise `/v1/command` picks the app.
2. A problem sentence ("mujhe invoice mai dikkat aa rahi hai") gets "What's the trouble?"; "making one" carries on.
3. Each empty required box is asked in turn, in the person's own words.
4. Siri reads the answers back with the price: Run, Change something (names the box), or Cancel. Nothing is charged before Run.
5. After the run: Text or PDF (only for apps that offer it, and only if the choice isn't already remembered), who to send it to (a Contacts name, or a spoken number or email) and WhatsApp, Messages, Mail or just copy.
   iOS never lets an app send a message silently, so the chat opens with the text filled and the person taps Send once.
   A PDF is copied as a file and pasted into the chat.

Siri and the app's name: "ease your life", "easy your life", "EZ your life" and similar are listed under
`INAlternativeAppNames` in `Info.plist`, and there are more phrases ("Talk to", "Hey", "voice"). Contacts access is
asked once when the person taps Connect on `/keyboard` (a Siri run can't show the prompt).
iOS 16 and 17 no longer get the Siri command; they keep the keyboard.

## Problem to app, and voice into one box (Nov 2026)

- `POST /v1/command` now copes with a problem said in plain words ("GST notice aaya hai, kya karu"): when the
  words match apps weakly, one small Flash-Lite call turns the problem into search words and the catalogue is
  searched again. The answer also carries `alternatives` (up to 3 other apps). The keyboard lists them after the
  best app; Siri names them and lets the person say one. Needs the `api` function redeployed.
- While a card box is open for editing, the mic under the keyboard fills that box: `takeDictation` moves what was
  dictated from the chat into the box. Tap the next box (or Next) and say the next answer.
