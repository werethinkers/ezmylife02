// Content script: auto-expands shortcuts on any website
let shortcuts = {};

// Load shortcuts from storage on init
chrome.storage.local.get(["shortcuts"], (data) => {
  if (data.shortcuts) shortcuts = data.shortcuts;
});

// Listen for updates from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SHORTCUTS_UPDATED") {
    shortcuts = msg.shortcuts || {};
  }
});

// Track typed text in any input/textarea/contenteditable
let buffer = "";

document.addEventListener("input", (e) => {
  const el = e.target;
  const isEditable =
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable;
  if (!isEditable) return;

  // For contenteditable (ChatGPT, Gemini, etc.)
  if (el.isContentEditable) {
    handleContentEditable(el);
    return;
  }

  // For input/textarea
  handleInputField(el);
});

function handleInputField(el) {
  const val = el.value;
  const cursorPos = el.selectionStart;
  const textBeforeCursor = val.substring(0, cursorPos);

  // Find the last word (including / prefix for promptmaster shortcuts)
  const match = textBeforeCursor.match(/(\S+)$/);
  if (!match) return;

  const lastWord = match[1];

  // Check shortcuts (case-insensitive)
  const key = Object.keys(shortcuts).find(
    (k) => k.toLowerCase() === lastWord.toLowerCase()
  );

  if (key) {
    const expansion = shortcuts[key];
    const wordStart = cursorPos - lastWord.length;
    const before = val.substring(0, wordStart);
    const after = val.substring(cursorPos);

    el.value = before + expansion + after;

    // Set cursor after expansion
    const newPos = wordStart + expansion.length;
    el.setSelectionRange(newPos, newPos);

    // Trigger input event so frameworks detect the change
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function handleContentEditable(el) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return;

  const text = node.textContent;
  const cursorOffset = range.startOffset;
  const textBeforeCursor = text.substring(0, cursorOffset);

  const match = textBeforeCursor.match(/(\S+)$/);
  if (!match) return;

  const lastWord = match[1];

  const key = Object.keys(shortcuts).find(
    (k) => k.toLowerCase() === lastWord.toLowerCase()
  );

  if (key) {
    const expansion = shortcuts[key];
    const wordStart = cursorOffset - lastWord.length;

    // Replace the shortcut text with the expansion
    const before = text.substring(0, wordStart);
    const after = text.substring(cursorOffset);
    node.textContent = before + expansion + after;

    // Restore cursor
    const newRange = document.createRange();
    newRange.setStart(node, wordStart + expansion.length);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    // Trigger input event
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
