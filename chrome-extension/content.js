// Content script: auto-expands shortcuts on any website
let shortcuts = {};
let isExpanding = false; // Guard against re-entrant calls

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
document.addEventListener("input", (e) => {
  if (isExpanding) return; // Prevent re-entrant expansion

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

// Also listen for keydown to catch cases where input event doesn't provide good cursor info
document.addEventListener("keydown", (e) => {
  if (isExpanding) return;
  if (e.key !== " " && e.key !== "Enter" && e.key !== "Tab") return;

  const el = e.target;
  const isEditable =
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable;
  if (!isEditable) return;

  // Check the word just before the space/enter
  if (el.isContentEditable) {
    const expanded = tryExpandContentEditable(el);
    if (expanded && e.key === "Tab") e.preventDefault();
  } else {
    const expanded = tryExpandInputField(el);
    if (expanded && e.key === "Tab") e.preventDefault();
  }
});

function findShortcutKey(word) {
  if (!word) return null;
  return Object.keys(shortcuts).find(
    (k) => k.toLowerCase() === word.toLowerCase()
  );
}

function handleInputField(el) {
  tryExpandInputField(el);
}

function tryExpandInputField(el) {
  const val = el.value;
  const cursorPos = el.selectionStart;
  if (cursorPos === null || cursorPos === undefined) return false;
  const textBeforeCursor = val.substring(0, cursorPos);

  const match = textBeforeCursor.match(/(\S+)$/);
  if (!match) return false;

  const lastWord = match[1];
  const key = findShortcutKey(lastWord);
  if (!key) return false;

  const expansion = shortcuts[key];
  const wordStart = cursorPos - lastWord.length;
  const before = val.substring(0, wordStart);
  const after = val.substring(cursorPos);

  isExpanding = true;

  // Try using native setter for React-controlled inputs
  const nativeSetter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(el), 'value'
  )?.set || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set || Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;

  if (nativeSetter) {
    nativeSetter.call(el, before + expansion + after);
  } else {
    el.value = before + expansion + after;
  }

  // Set cursor after expansion
  const newPos = wordStart + expansion.length;
  el.setSelectionRange(newPos, newPos);

  // Trigger events so frameworks detect the change
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));

  // Reset guard after a tick
  setTimeout(() => { isExpanding = false; }, 0);
  return true;
}

function handleContentEditable(el) {
  tryExpandContentEditable(el);
}

function tryExpandContentEditable(el) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;

  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return false;

  const text = node.textContent;
  const cursorOffset = range.startOffset;
  const textBeforeCursor = text.substring(0, cursorOffset);

  const match = textBeforeCursor.match(/(\S+)$/);
  if (!match) return false;

  const lastWord = match[1];
  const key = findShortcutKey(lastWord);
  if (!key) return false;

  const expansion = shortcuts[key];
  const wordStart = cursorOffset - lastWord.length;

  isExpanding = true;

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
  el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));

  setTimeout(() => { isExpanding = false; }, 0);
  return true;
}
