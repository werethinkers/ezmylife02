// Content script: auto-expands shortcuts on any website
let shortcuts = {};
let isExpanding = false; // Prevent re-entrancy

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

document.addEventListener("input", (e) => {
  if (isExpanding) return; // Skip our own programmatic changes

  const el = e.target;
  const isEditable =
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable;
  if (!isEditable) return;

  if (el.isContentEditable) {
    handleContentEditable(el);
    return;
  }

  handleInputField(el);
});

// Also listen for keydown to catch cases where input event doesn't fire properly
document.addEventListener("keydown", (e) => {
  if (isExpanding) return;
  if (e.key !== " " && e.key !== "Enter" && e.key !== "Tab") return;

  const el = e.target;
  if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA" && !el.isContentEditable) return;

  // Small delay to let the character be inserted first
  setTimeout(() => {
    if (el.isContentEditable) {
      handleContentEditable(el);
    } else {
      handleInputField(el);
    }
  }, 0);
});

function handleInputField(el) {
  const val = el.value;
  if (!val) return;
  const cursorPos = el.selectionStart;
  if (cursorPos === null || cursorPos === undefined) return;
  const textBeforeCursor = val.substring(0, cursorPos);

  const match = textBeforeCursor.match(/(\S+)$/);
  if (!match) return;

  const lastWord = match[1];

  const key = Object.keys(shortcuts).find(
    (k) => k.toLowerCase() === lastWord.toLowerCase()
  );

  if (key) {
    const expansion = shortcuts[key];
    const wordStart = cursorPos - lastWord.length;
    const before = val.substring(0, wordStart);
    const after = val.substring(cursorPos);
    const newValue = before + expansion + after;

    isExpanding = true;

    // Use native setter for React/framework compatibility
    const nativeSetter =
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set ||
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;

    if (nativeSetter) {
      nativeSetter.call(el, newValue);
    } else {
      el.value = newValue;
    }

    // Set cursor after expansion
    const newPos = wordStart + expansion.length;
    el.setSelectionRange(newPos, newPos);

    // Dispatch events so frameworks detect the change
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));

    // Also dispatch React-specific events
    const nativeInputEvent = new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: expansion,
    });
    el.dispatchEvent(nativeInputEvent);

    setTimeout(() => { isExpanding = false; }, 50);
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
    isExpanding = true;
    const expansion = shortcuts[key];
    const wordStart = cursorOffset - lastWord.length;

    const before = text.substring(0, wordStart);
    const after = text.substring(cursorOffset);
    node.textContent = before + expansion + after;

    const newRange = document.createRange();
    newRange.setStart(node, wordStart + expansion.length);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    el.dispatchEvent(new Event("input", { bubbles: true }));

    setTimeout(() => { isExpanding = false; }, 50);
  }
}
