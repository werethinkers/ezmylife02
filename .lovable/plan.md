

## Diagnosis

I reviewed all extension files and found two critical issues preventing shortcuts from working on external sites:

### Issue 1: Manifest V3 CSP blocks inline event handlers
The `popup.html` uses inline `onclick` attributes (lines 76-77):
```html
<div onclick="switchTab('list')">My Shortcuts</div>
<div onclick="switchTab('add')">+ Add New</div>
```
And `popup.js` generates inline `onclick` in `renderShortcutList`. Manifest V3 blocks ALL inline scripts/handlers. This causes JavaScript errors that can cascade and prevent `chrome.storage.local.set` from completing properly — meaning shortcuts never get stored, so the content script has nothing to expand.

### Issue 2: Missing `all_frames` in manifest
Sites like ChatGPT and Gmail use iframes for their text inputs. Without `"all_frames": true` in the manifest's `content_scripts` config, the content script only runs in the top frame and misses those inputs.

### Issue 3: Re-download required
The extension files are served from `public/extensions/chrome/`. Any code changes require re-downloading the ZIP and re-loading the extension in Chrome.

## Plan

### 1. Fix popup.html — remove all inline onclick handlers
Replace the `onclick="switchTab(...)"` attributes with `data-tab` attributes. Add corresponding `addEventListener` logic in `popup.js`.

Files: `public/extensions/chrome/popup.html`, `chrome-extension/popup.html`, `public/extensions/firefox/popup.html`, `firefox-extension/popup.html` (all 4 copies)

### 2. Fix popup.js — remove inline onclick from rendered HTML
In `renderShortcutList`, replace `onclick="handleDeleteShortcut(...)"` with a `data-key` attribute. After rendering, attach click listeners programmatically via `querySelectorAll('.delete-btn')`.

Files: `public/extensions/chrome/popup.js`, `chrome-extension/popup.js`, `public/extensions/firefox/popup.js`, `firefox-extension/popup.js` (all 4 copies)

### 3. Add `all_frames: true` to manifests
Update `content_scripts` in both Chrome and Firefox manifests to include `"all_frames": true` so the expansion script runs inside iframes (ChatGPT, Gmail, etc.).

Files: `public/extensions/chrome/manifest.json`, `chrome-extension/manifest.json`, `public/extensions/firefox/manifest.json`, `firefox-extension/manifest.json`

### 4. User action required
After these changes, you will need to:
- Re-download the extension from the Get Extension page
- Go to `chrome://extensions/`
- Remove the old extension
- Load the new unpacked folder

