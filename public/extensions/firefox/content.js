// Content script: auto-expands shortcuts on any website
const storageAPI = typeof browser !== "undefined" ? browser.storage : chrome.storage;
const runtimeAPI = typeof browser !== "undefined" ? browser.runtime : chrome.runtime;

let shortcuts = {};
let isExpanding = false;

// Load shortcuts from storage on init
storageAPI.local.get(["shortcuts"]).then(data => {
  shortcuts = data.shortcuts || {};
  console.log("[EzMyLife] Loaded shortcuts from storage:", Object.keys(shortcuts).length, "shortcuts", shortcuts);
});

// Listen for storage changes
storageAPI.onChanged.addListener((changes) => {
  if (changes.shortcuts && changes.shortcuts.newValue) {
    shortcuts = changes.shortcuts.newValue;
    console.log("[EzMyLife] Shortcuts updated via storage change:", Object.keys(shortcuts).length);
  }
});

// Listen for updates from popup
runtimeAPI.onMessage.addListener((msg) => {
  if (msg.type === "SHORTCUTS_UPDATED") {
    shortcuts = msg.shortcuts || {};
    console.log("[EzMyLife] Shortcuts updated via message:", Object.keys(shortcuts).length);
  }
});

document.addEventListener("keydown", (e) => {
  if (isExpanding) return;

  const el = e.target;
  const isInput = el.tagName === "INPUT" || el.tagName === "TEXTAREA";
  const isContentEdit = el.isContentEditable;
  if (!isInput && !isContentEdit) return;

  if (e.key === " " || e.key === "Enter" || e.key === "Tab") {
    if (isContentEdit) {
      const result = getContentEditableWord(el);
      if (result) {
        const key = findShortcutKey(result.word);
        if (key) {
          e.preventDefault();
          console.log("[EzMyLife] Expanding (contentEditable keydown):", key, "->", shortcuts[key]);
          expandContentEditable(el, result, key);
          return;
        }
      }
    } else {
      const val = el.value;
      const cursorPos = el.selectionStart;
      if (cursorPos != null && val) {
        const textBeforeCursor = val.substring(0, cursorPos);
        const match = textBeforeCursor.match(/(\S+)$/);
        if (match) {
          const key = findShortcutKey(match[1]);
          if (key) {
            e.preventDefault();
            console.log("[EzMyLife] Expanding (input keydown):", key, "->", shortcuts[key]);
            doExpandInput(el, key, match[1], cursorPos);
            return;
          }
        }
      }
    }
  }
});

document.addEventListener("input", (e) => {
  if (isExpanding) return;

  const el = e.target;
  const isInput = el.tagName === "INPUT" || el.tagName === "TEXTAREA";
  const isContentEdit = el.isContentEditable;
  if (!isInput && !isContentEdit) return;

  if (isInput) {
    const val = el.value;
    if (!val) return;
    const cursorPos = el.selectionStart;
    if (cursorPos == null) return;
    const textBeforeCursor = val.substring(0, cursorPos);

    const match = textBeforeCursor.match(/(\S+)\s$/);
    if (match) {
      const key = findShortcutKey(match[1]);
      if (key) {
        console.log("[EzMyLife] Expanding (input event):", key, "->", shortcuts[key]);
        const wordStart = cursorPos - match[1].length - 1;
        doExpandInputAt(el, key, wordStart, cursorPos);
      }
    }
  } else if (isContentEdit) {
    const result = getContentEditableWordAfterSpace(el);
    if (result) {
      const key = findShortcutKey(result.word);
      if (key) {
        console.log("[EzMyLife] Expanding (contentEditable input):", key, "->", shortcuts[key]);
        expandContentEditableAfterSpace(el, result, key);
      }
    }
  }
});

function findShortcutKey(word) {
  return Object.keys(shortcuts).find(k => k.toLowerCase() === word.toLowerCase());
}

function getContentEditableWord(el) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return null;
  const text = node.textContent;
  const cursorOffset = range.startOffset;
  const textBeforeCursor = text.substring(0, cursorOffset);
  const match = textBeforeCursor.match(/(\S+)$/);
  if (!match) return null;
  return { node, text, cursorOffset, word: match[1], wordStart: cursorOffset - match[1].length };
}

function getContentEditableWordAfterSpace(el) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return null;
  const text = node.textContent;
  const cursorOffset = range.startOffset;
  const textBeforeCursor = text.substring(0, cursorOffset);
  const match = textBeforeCursor.match(/(\S+)\s$/);
  if (!match) return null;
  return { node, text, cursorOffset, word: match[1], wordStart: cursorOffset - match[1].length - 1 };
}

function expandContentEditable(el, result, key) {
  isExpanding = true;
  const expansion = shortcuts[key];
  const { node, text, cursorOffset, wordStart } = result;
  const after = text.substring(cursorOffset);
  node.textContent = text.substring(0, wordStart) + expansion + after;
  const sel = window.getSelection();
  const newRange = document.createRange();
  newRange.setStart(node, wordStart + expansion.length);
  newRange.collapse(true);
  sel.removeAllRanges();
  sel.addRange(newRange);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  setTimeout(() => { isExpanding = false; }, 50);
}

function expandContentEditableAfterSpace(el, result, key) {
  isExpanding = true;
  const expansion = shortcuts[key];
  const { node, text, cursorOffset, wordStart } = result;
  const after = text.substring(cursorOffset);
  node.textContent = text.substring(0, wordStart) + expansion + after;
  const sel = window.getSelection();
  const newRange = document.createRange();
  newRange.setStart(node, wordStart + expansion.length);
  newRange.collapse(true);
  sel.removeAllRanges();
  sel.addRange(newRange);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  setTimeout(() => { isExpanding = false; }, 50);
}

function doExpandInput(el, key, lastWord, cursorPos) {
  const val = el.value;
  const expansion = shortcuts[key];
  const wordStart = cursorPos - lastWord.length;
  const newValue = val.substring(0, wordStart) + expansion + val.substring(cursorPos);
  isExpanding = true;
  setNativeValue(el, newValue);
  el.setSelectionRange(wordStart + expansion.length, wordStart + expansion.length);
  dispatchInputEvents(el);
  setTimeout(() => { isExpanding = false; }, 50);
}

function doExpandInputAt(el, key, wordStart, cursorPos) {
  const val = el.value;
  const expansion = shortcuts[key];
  const newValue = val.substring(0, wordStart) + expansion + val.substring(cursorPos);
  isExpanding = true;
  setNativeValue(el, newValue);
  el.setSelectionRange(wordStart + expansion.length, wordStart + expansion.length);
  dispatchInputEvents(el);
  setTimeout(() => { isExpanding = false; }, 50);
}

function setNativeValue(el, value) {
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
    bubbles: true, cancelable: true, inputType: "insertText",
  }));
}
