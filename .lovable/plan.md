
## Goal
Make the Chrome extension actually run on *all* websites (not just inside your Lovable app) and give clear “why it’s not working” diagnostics inside the extension popup.

## What’s most likely happening
On Chrome, extensions can be “withheld” from running on most sites due to **Site access** settings (On click / On specific sites). When that happens:
- Popup can still say “Connected & synced” (because sync uses storage + network),
- But the **content script never injects**, so expansion never triggers anywhere (normal forms, ChatGPT, Gmail, etc.).

## Plan (implementation)

### 1) Add a built-in “This page is active” health check (popup → content script)
- Add a `PING`/`PONG` message in `content.js` so it can confirm it’s running.
- In `popup.js`, query the current active tab and `sendMessage` a `PING`.
- Show a small status row in the popup:
  - “Shortcut expansion: Active on this site” (green)
  - or “Not active on this site” (red) with a fix button

**Files**
- `public/extensions/chrome/content.js`
- `chrome-extension/content.js`
- `public/extensions/chrome/popup.html`
- `chrome-extension/popup.html`
- `public/extensions/chrome/popup.js`
- `chrome-extension/popup.js`

### 2) Add a one-click “Enable on all sites” permission flow (fixes Site access issues)
Switch to an explicit permission onboarding so the extension can self-fix when Chrome withholds access:
- Update `manifest.json` to use:
  - `optional_host_permissions: ["<all_urls>"]`
  - add `"scripting"` + `"tabs"` (or `"activeTab"` + `"scripting"` depending on what we end up needing)
- In the popup, add a button:
  - “Enable on all sites”
  - Calls `chrome.permissions.request({ origins: ["<all_urls>"] })`
  - On success, registers the content script and injects it into the current tab immediately (so the user can test right away).

**Files**
- `public/extensions/chrome/manifest.json`
- `chrome-extension/manifest.json`
- `public/extensions/chrome/background.js`
- `chrome-extension/background.js`
- `public/extensions/chrome/popup.js`
- `chrome-extension/popup.js`

### 3) Make Gmail/Docs iframes work reliably (about:blank/srcdoc frames)
Even with permissions, Gmail/Docs often uses editor iframes that are `about:blank` or `srcdoc`.
- Ensure injection supports those frames:
  - For MV3 declarative scripts: add `match_origin_as_fallback: true`
  - If we go programmatic via `chrome.scripting.registerContentScripts`, set `matchOriginAsFallback: true`
- Keep `all_frames: true`.

**Files**
- `public/extensions/chrome/manifest.json` (or registration config in background)

### 4) Update the “Get Extension” install steps so users don’t miss Site Access
Add an explicit install step after “Load unpacked”:
- “Open extension Details → Site access → set to ‘On all sites’ (or click ‘Enable on all sites’ inside the popup).”

**Files**
- `src/pages/GetExtension.tsx` (update the `manualSteps` arrays)
- (Optional) `public/extensions/chrome/README.md`

## How you’ll verify (end-to-end)
1. Re-download extension ZIP from `/get-extension`, remove old one, load unpacked new folder.
2. Open `google.com`, click extension → confirm popup shows:
   - “Shortcut expansion: Not active” initially (if permissions withheld)
3. Click “Enable on all sites”
4. Popup should flip to “Active on this site”
5. Type a known shortcut into:
   - a plain `<input>` on any random site
   - ChatGPT textarea
   - Gmail compose box
   Confirm expansion happens.

## Notes / constraints
- Chrome will never allow content scripts on certain internal pages (e.g. `chrome://`, Web Store pages). That’s normal.
- This plan focuses first on “script not injecting anywhere”; once injection is confirmed by the health check, any remaining site-specific editor quirks (Docs/Gmail rich editors) become much easier to address with targeted fixes.
