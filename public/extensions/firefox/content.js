// Content script: auto-expands shortcuts on any website
let shortcuts = {};
let isExpanding = false;

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

// Real-time sync across tabs via storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.shortcuts) {
    shortcuts = changes.shortcuts.newValue || {};
  }
});

document.addEventListener("input", (e) => {
  if (isExpanding) return;

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

document.addEventListener("keydown", (e) => {
  if (isExpanding) return;
  if (e.key !== " " && e.key !== "Enter" && e.key !== "Tab") return;

  const el = e.target;
  if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA" && !el.isContentEditable) return;

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

    const nativeSetter =
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set ||
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;

    if (nativeSetter) {
      nativeSetter.call(el, newValue);
    } else {
      el.value = newValue;
    }

    const newPos = wordStart + expansion.length;
    el.setSelectionRange(newPos, newPos);

    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));

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
  let node = range.startContainer;
  let cursorOffset = range.startOffset;

  if (node.nodeType !== Node.TEXT_NODE) {
    if (node.childNodes.length > 0 && cursorOffset > 0) {
      const child = node.childNodes[cursorOffset - 1];
      if (child && child.nodeType === Node.TEXT_NODE) {
        node = child;
        cursorOffset = node.textContent.length;
      } else if (child && child.textContent) {
        const walker = document.createTreeWalker(child, NodeFilter.SHOW_TEXT);
        let lastText = null;
        while (walker.nextNode()) lastText = walker.currentNode;
        if (lastText) {
          node = lastText;
          cursorOffset = lastText.textContent.length;
        } else {
          return;
        }
      } else {
        return;
      }
    } else {
      return;
    }
  }

  const text = node.textContent;
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

    try {
      const selectRange = document.createRange();
      selectRange.setStart(node, wordStart);
      selectRange.setEnd(node, cursorOffset);
      sel.removeAllRanges();
      sel.addRange(selectRange);
      document.execCommand('insertText', false, expansion);
    } catch (e) {
      const before = text.substring(0, wordStart);
      const after = text.substring(cursorOffset);
      node.textContent = before + expansion + after;

      const newRange = document.createRange();
      newRange.setStart(node, wordStart + expansion.length);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      el.dispatchEvent(new Event("input", { bubbles: true }));
    }

    setTimeout(() => { isExpanding = false; }, 50);
  }
}
