// Content script: auto-expands shortcuts on any website
let shortcuts = {};
let isExpanding = false;

// Load shortcuts from storage on init
chrome.storage.local.get(["shortcuts"], (data) => {
  if (data.shortcuts) shortcuts = data.shortcuts;
});

// Listen for storage changes (from background sync or popup)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.shortcuts && changes.shortcuts.newValue) {
    shortcuts = changes.shortcuts.newValue;
  }
});

// Listen for updates from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SHORTCUTS_UPDATED") {
    shortcuts = msg.shortcuts || {};
  }
});

document.addEventListener("input", (e) => {
  if (isExpanding) return;
  const el = e.target;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    handleInputField(el);
  } else if (el.isContentEditable) {
    handleContentEditable(el);
  }
});

document.addEventListener("keydown", (e) => {
  if (isExpanding) return;
  if (e.key !== " " && e.key !== "Enter" && e.key !== "Tab") return;

  const el = e.target;
  if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA" && !el.isContentEditable) return;

  // Capture text BEFORE the space/enter is inserted
  if (el.isContentEditable) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const cursorOffset = range.startOffset;
        const textBeforeCursor = text.substring(0, cursorOffset);
        const match = textBeforeCursor.match(/(\S+)$/);
        if (match) {
          const lastWord = match[1];
          const key = Object.keys(shortcuts).find(k => k.toLowerCase() === lastWord.toLowerCase());
          if (key) {
            e.preventDefault();
            isExpanding = true;
            const expansion = shortcuts[key];
            const wordStart = cursorOffset - lastWord.length;
            node.textContent = text.substring(0, wordStart) + expansion + text.substring(cursorOffset);
            const newRange = document.createRange();
            newRange.setStart(node, wordStart + expansion.length);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            el.dispatchEvent(new Event("input", { bubbles: true }));
            setTimeout(() => { isExpanding = false; }, 50);
          }
        }
      }
    }
  } else {
    const val = el.value;
    const cursorPos = el.selectionStart;
    if (cursorPos == null || !val) return;
    const textBeforeCursor = val.substring(0, cursorPos);
    const match = textBeforeCursor.match(/(\S+)$/);
    if (!match) return;
    const lastWord = match[1];
    const key = Object.keys(shortcuts).find(k => k.toLowerCase() === lastWord.toLowerCase());
    if (key) {
      e.preventDefault();
      expandInputField(el, key, lastWord, cursorPos);
    }
  }
});

function handleInputField(el) {
  const val = el.value;
  if (!val) return;
  const cursorPos = el.selectionStart;
  if (cursorPos == null) return;
  const textBeforeCursor = val.substring(0, cursorPos);

  // Check if last char is a space/trigger — look at word before it
  const match = textBeforeCursor.match(/(\S+)\s$/);
  if (!match) return;

  const lastWord = match[1];
  const key = Object.keys(shortcuts).find(k => k.toLowerCase() === lastWord.toLowerCase());
  if (key) {
    // Remove the trailing space too and replace with expansion
    const wordStart = cursorPos - lastWord.length - 1; // -1 for the space
    expandInputFieldAt(el, key, wordStart, cursorPos);
  }
}

function expandInputField(el, key, lastWord, cursorPos) {
  const val = el.value;
  const expansion = shortcuts[key];
  const wordStart = cursorPos - lastWord.length;
  const before = val.substring(0, wordStart);
  const after = val.substring(cursorPos);
  const newValue = before + expansion + after;

  isExpanding = true;
  setNativeValue(el, newValue);
  const newPos = wordStart + expansion.length;
  el.setSelectionRange(newPos, newPos);
  dispatchInputEvents(el);
  setTimeout(() => { isExpanding = false; }, 50);
}

function expandInputFieldAt(el, key, wordStart, cursorPos) {
  const val = el.value;
  const expansion = shortcuts[key];
  const before = val.substring(0, wordStart);
  const after = val.substring(cursorPos);
  const newValue = before + expansion + after;

  isExpanding = true;
  setNativeValue(el, newValue);
  const newPos = wordStart + expansion.length;
  el.setSelectionRange(newPos, newPos);
  dispatchInputEvents(el);
  setTimeout(() => { isExpanding = false; }, 50);
}

function setNativeValue(el, value) {
  // Use the correct prototype setter based on element type
  const proto = el.tagName === "TEXTAREA"
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;

  if (nativeSetter) {
    nativeSetter.call(el, value);
  } else {
    el.value = value;
  }
}

function dispatchInputEvents(el) {
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new InputEvent("input", {
    bubbles: true,
    cancelable: true,
    inputType: "insertText",
  }));
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

  // Check for word followed by space
  const match = textBeforeCursor.match(/(\S+)\s$/);
  if (!match) return;

  const lastWord = match[1];
  const key = Object.keys(shortcuts).find(k => k.toLowerCase() === lastWord.toLowerCase());

  if (key) {
    isExpanding = true;
    const expansion = shortcuts[key];
    const wordStart = cursorOffset - lastWord.length - 1; // -1 for space
    const after = text.substring(cursorOffset);
    node.textContent = text.substring(0, wordStart) + expansion + after;

    const newRange = document.createRange();
    newRange.setStart(node, wordStart + expansion.length);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    el.dispatchEvent(new Event("input", { bubbles: true }));
    setTimeout(() => { isExpanding = false; }, 50);
  }
}
