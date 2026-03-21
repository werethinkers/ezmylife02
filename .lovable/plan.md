

# Fix Extension Compatibility Across Chrome Versions

## Problem
The extension fails on some Chrome versions because **Manifest V3 blocks inline event handlers** (`onclick="..."` in HTML). Stricter Chrome installations enforce this CSP, causing the popup to break silently.

## Root Causes
1. `popup.html` has `onclick="switchTab('list')"` and `onclick="switchTab('add')"` on tab elements
2. `renderShortcutList()` in `popup.js` generates delete buttons with `onclick="handleDeleteShortcut('...')"` via `innerHTML`
3. Both rely on `window.switchTab` and `window.handleDeleteShortcut` globals, which only work if inline handlers are allowed

## Fix (4 file sets, same changes mirrored)

### Step 1: Remove inline onclick from popup.html
- Remove `onclick` attributes from tab divs (lines 76-77)
- Keep the `id` attributes for programmatic binding

**Files**: `chrome-extension/popup.html`, `public/extensions/chrome/popup.html`, `firefox-extension/popup.html`, `public/extensions/firefox/popup.html`

### Step 2: Fix popup.js — programmatic tab + delete listeners
- Add `addEventListener` for `tabList` and `tabAdd` clicks in `DOMContentLoaded`
- Remove `window.switchTab` and `window.handleDeleteShortcut` global assignments
- In `renderShortcutList()`, use **event delegation** on the `shortcutList` container instead of inline `onclick` on each delete button. Add `data-key` attributes to delete buttons and listen for clicks on the container.

**Files**: `chrome-extension/popup.js`, `public/extensions/chrome/popup.js`, `firefox-extension/popup.js`, `public/extensions/firefox/popup.js`

### Step 3: Fix content.js — WhatsApp Web + SPA compatibility
- Replace direct `node.textContent` manipulation in `handleContentEditable` with `document.execCommand('insertText')` — this is the only method that works with WhatsApp Web's editor
- Add `chrome.storage.onChanged` listener for real-time shortcut sync across tabs
- These are the same content.js fixes from the previously approved plan

**Files**: All 4 content.js copies

### Technical Detail — Key Change in handleContentEditable
```javascript
// Instead of: node.textContent = before + expansion + after
// Use:
range.setStart(node, wordStart);
range.setEnd(node, cursorOffset);
sel.removeAllRanges();
sel.addRange(range);
document.execCommand('insertText', false, expansion);
```

### Technical Detail — Event Delegation for Delete
```javascript
document.getElementById("shortcutList").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-delete-key]");
  if (btn) handleDeleteShortcut(btn.dataset.deleteKey);
});
```

